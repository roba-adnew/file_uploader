require('dotenv').config()
const debug = require('debug')('backend:manager')
const postAuthCheck = require('./authContr').postAuthCheck
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

function toJSONObject(object) {
    return JSON.parse(JSON.stringify(object, (key, value) => {
        return typeof value === 'bigint' ? value.toString() : value
    }))
}

exports.getFolderIdLineage = async (parentFolderId) => {
    debug('lineage input update: %O', parentFolderId)
    const folderLineage = [parentFolderId]
    let parentFolderExists = true;
    let i = 0;
    try {
        do {
            debug(`folder lineage i=0`, folderLineage[i])
            const folder = await prisma.folder.findFirst({
                where: { id: folderLineage[i] },
                include: { parentFolder: true }
            })
            debug(`#${i+1} folder lookup`, folder)
            debug('parentFolderExists:', !!folder.parentFolder)
            debug('lineage isRoot: ', folder.isRoot)
            parentFolderExists = !!folder.parentFolder && !folder.isRoot;
            if (parentFolderExists) {
                i = folderLineage.push(folder.parentFolderId) - 1;
            }
        }
        while (parentFolderExists)
    } catch (err) {
        debug('error retrieving folder lineage', err)
    }
    return folderLineage
}

exports.postAddFolder = [
    postAuthCheck,
    async (req, res, next) => {
        debug('commencing new folder creation: %O', req.body);
        const { parentFolderId, name } = req.body
        try {
            const newFolder = await prisma.folder.create({
                data: {
                    name: name,
                    owner: {
                        connect: {
                            id: req.user.id,
                        }
                    },
                    parentFolder: {
                        connect: {
                            id: parentFolderId,
                        }
                    }
                }
            })
            debug('folder creation results: %O', newFolder)
            res.status(201).json({ message: "folder created" })
            next()
        } catch (err) {
            debug(err)
            throw err
        }
    }
]

exports.getFolderContentsPost = [
    postAuthCheck,
    async (req, res, next) => {
        debug('get folder req object: %O', req.body)
        let folderId = req.body.folderId === undefined
            ? null
            : req.body.folderId;

        try {
            if (!folderId) {
                const rootFolder = await prisma.folder.findFirst({
                    where: { AND: { userId: req.user.id, isRoot: true } }
                });
                folderId = rootFolder.id;
            }
    
            const results = await prisma.folder.findUnique({
                where: { id: folderId },
                include: {
                    childFolders: true,
                    files: true
                }
            })
            const allChildren = toJSONObject(results)
            debug(
                'folder children raw', results,
                'folder children transformed', allChildren
            )
            return res.status(200).json({ results: allChildren })
        } catch (err) {
            debug('error getting folder contents: %O', err)
            throw err
        }
    }
]

exports.getTrashContentsPost = [
    postAuthCheck,
    async (req, res, next) => {
        try {
            const trashFolder = await prisma.folder.findFirst({
                where: { userId: req.user.id, isTrash: true },
                include: {
                    childFolders: true,
                    files: true
                }
            })
            const trashFolderJSON = toJSONObject(trashFolder)
            return res.status(200).json({ results: trashFolderJSON })
        } catch (err) {
            console.error(err)
            throw err
        }
    }
]

exports.updateFolderNamePut = [
    postAuthCheck,
    async (req, res, next) => {
        const { folderId, newName } = req.body;
        try {
            const updatedFolder = await prisma.folder.update({
                where: { id: folderId },
                data: { name: newName }
            })
            debug('update results', updatedFolder)
            return res.status(200).json({ message: "folder name updated" })
        } catch (err) {
            debug('error updating file name: %O', err)
            throw err
        }
    }
]

exports.updateFolderLocationPut = [
    postAuthCheck,
    async (req, res, next) => {
        try {
            const { folderId, newParentFolderId } = req.body
            const folder = await prisma.folder.findFirst(
                { where: { id: folderId } }
            )
            const oldLineage =
                await exports.getFolderIdLineage(folder.parentFolderId)
            const newLineage =
                await exports.getFolderIdLineage(newParentFolderId)

            const readOldLineagePromises = oldLineage.map(
                async (folderId) => {
                    const result = await prisma.folder.findFirst({
                        where: { id: folderId },
                    })
                    return result;
                }
            )
            const readOldLineageResults =
                await Promise.all(readOldLineagePromises)

            const readNewLineagePromises = newLineage.map(
                async (folderId) => {
                    const result = await prisma.folder.findFirst({
                        where: { id: folderId }
                    })
                    return result
                }
            )
            const readNewLineageResults = await
                Promise.all(readNewLineagePromises);

            const updatedFolder = await prisma.folder.update({
                where: { id: folder.id },
                data: {
                    parentFolder: { connect: { id: newParentFolderId } }
                }
            })

            debug('folder', folder)
            debug('old Lineage', oldLineage)
            const updateOldLineagePromises = oldLineage.map(
                async (folderId) => {
                    const result = await prisma.folder.update({
                        where: { id: folderId },
                        data: { sizeKB: { decrement: folder.sizeKB } }
                    })
                    return result;
                }
            )
            const updateOldLineageResults =
                await Promise.all(updateOldLineagePromises);

            const updateNewLineagePromises = newLineage.map(
                async (folderId) => {
                    const result = await prisma.folder.updateMany({
                        where: { id: folderId },
                        data: { sizeKB: { increment: folder.sizeKB } }
                    })
                    return result;
                }
            )
            const updateNewLineageResults =
                await Promise.all(updateNewLineagePromises);

            debug('old folder details', folder)
            debug('new folder details', updatedFolder)
            debug('old lineage pre-move results', readOldLineageResults)
            debug('old lineage update results', updateOldLineageResults)
            debug('new lineage pre-move results', readNewLineageResults)
            debug('new lineage update results', updateNewLineageResults)

            return res.status(200).json({ message: "folder move successful" })
        } catch (err) {
            debug('error in moving folder: %O', err)
        }
    }
]

exports.deleteFolderDelete = [
    postAuthCheck,
    async (req, res, next) => {
        const { folderId } = req.body;
        debug('commencing folder deletion')

        try {
            const folderToDelete = await prisma.folder.findFirst({
                where: { id: folderId }
            })
            if (folderToDelete.isRoot || folderToDelete.isTrash) {
                return res.status(405).json({ message: "You cannot delete the root or trash folder" })
            }

            const trashFolder = await prisma.folder.findFirst({
                where: { userId: req.user.id, isTrash: true }
            })
            const folderLineage =
                await exports.getFolderIdLineage(folderToDelete)

            const deleted = await prisma.folder.update({
                where: { id: folderToDelete.id },
                data: {
                    deleted: true,
                    deletedAt: new Date(Date.now()),
                    parentFolder: {
                        connect: {
                            id: trashFolder.id,
                        }
                    }
                }
            })
            const addTrashMemory = await prisma.folder.update({
                where: { id: trashFolder.id },
                data: { sizeKB: { increment: folderToDelete.sizeKB } }
            })

            const reduceMemoryFolderPromises = folderLineage.map(
                async (folderId) => {
                    const result = await prisma.folder.update({
                        where: { id: folderId },
                        data: { sizeKB: { decrement: folderToDelete.sizeKB } }
                    })
                    return result;
                }
            )
            const folderUpdates = await Promise.all(reduceMemoryFolderPromises)
            const userUpdate = await prisma.user.update({
                where: { id: folderToDelete.userId },
                data: { memoryUsedKB: { decrement: folderToDelete.sizeKB } }
            })

            debug('DB deleted folder', deleted)
            debug('trash folder memory increase', addTrashMemory)
            debug('folder memory reduction results', folderUpdates)
            debug('user memory update', userUpdate)

            return res.status(201).json({ message: "folder has been deleted" })
        } catch (err) {
            debug('error deleting folder: %O', err)
            throw err
        }
    }
]