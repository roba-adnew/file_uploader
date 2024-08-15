require('dotenv').config()
const debug = require('debug')('backend:manager')
const multer = require('multer')
const path = require('path')
const fs = require('fs/promises')
const checkAuth = require('./authContr').checkAuthGet
const getFolderIdLineage = require('./folderContr').getFolderIdLineage;
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        return cb(null, 'public')
    },
    filename: (req, file, cb) => {
        return cb(null, file.originalname)
    }
})
const upload = multer({ storage })

exports.fileUploadPost = [
    upload.single('uploaded_file'),
    checkAuth,
    async (req, res, next) => {
        debug('file details: %O', req.file)
        try {
            const newFile = await prisma.file.create({
                data: {
                    name: req.file.filename,
                    type: req.file.mimetype,
                    sizeKB: req.file.size,
                    owner: {
                        connect: {
                            id: req.user.id,
                        }
                    },
                    folder: {
                        connect: {
                            id: req.body.folderId,
                        }
                    }
                }
            })

            const folderLineage = await getFolderIdLineage(newFile)

            const addMemoryFolderPromises = folderLineage.map(
                async (folderId) => {
                    const result = await prisma.folder.update({
                        where: { id: folderId },
                        data: { sizeKB: { increment: newFile.sizeKB } }
                    })
                    return result;
                }
            )
            const folderUpdates = await Promise.all(addMemoryFolderPromises)

            const userUpdate = await prisma.user.update({
                where: { id: newFile.userId },
                data: { memoryUsedKB: { increment: newFile.sizeKB } }
            })

            debug('file uploaded: %O', newFile)
            debug('folder memory update results', folderUpdates)
            debug('user memory update', userUpdate)

            return res.status(201).json({ message: "file uploaded" })
        } catch (err) {
            debug('error uploading file: %O', err)
            throw err
        }
    }
]

exports.viewFileGet = [
    checkAuth,
    async (req, res, next) => {
        const { fileId } = req.body;
        debug(`commence file retrieval for file#${fileId}`, req.body);
        try {
            const fileDetails = await prisma.file.findFirst({
                where: { id: fileId }
            })
            if (fileDetails.deleted) {
                return res
                    .status(404)
                    .json({ message: "file has been deleted" })
            }
            const filePath = path
                .join(__dirname, '../../public', fileDetails.name)
            return res.status(200).sendFile(filePath)
        } catch (err) {
            debug('error retrieving file', err)
            throw err
        }
    }
]

exports.updateFileNamePut = [
    checkAuth,
    async (req, res, next) => {
        // keep the file deletion check, make sure ext is handled when moving to supabase
        const { fileId, newName } = req.body;
        try {
            debug('commencing file name change')
            const fileDetails = await prisma.file.findFirst({
                where: { id: fileId }
            })
            if (fileDetails.deleted) {
                return res
                    .status(404)
                    .json({ message: "file has been deleted" })
            }
            const filePath =
                path.join(__dirname, '../../public', fileDetails.name)
            const ext = path.extname(filePath)


            const updatedFile = await prisma.file.update({
                where: { id: fileId },
                data: { name: `${newName}${ext}` }
            })
            const newPath =
                path.join(__dirname, '../../public', `${newName}${ext}`)

            await fs.rename(filePath, newPath)
            debug('file name changes to ', updatedFile.name)
            res.status(200).json({ message: "file name changed" })
        } catch (err) {
            debug('error in updating file name', err)
            throw err
        }
    }
]

exports.updateFileLocationPut = [
    checkAuth,
    async (req, res, next) => {
        const { fileId, oldFolderId, newFolderId } = req.body
        const file = await prisma.file.findFirst({ where: { id: fileId }})
        const oldLineage = await getFolderIdLineage(file)
        const newLineage = await getFolderIdLineage(newFolderId)

        const readOldLineagePromises = oldLineage.map(
            async (folderId) => {
                const result = await prisma.folder.findUnique({
                    where: { id: folderId },
                })
                return result;
            }
        )
        const readOldLineageResults = await Promise.all(readOldLineagePromises)

        const readNewLineagePromises = newLineage.map(
            async (folderId) => {
                const result = await prisma.folder.findUnique({
                    where: { id: folderId }
                })
                return result
            }
        )
        const readNewLineageResults = await Promise.all(readNewLineagePromises);

        const oldFolder = prisma.folder.findFirst({ where: { id: oldFolderId }})
        const newFolder = prisma.folder.findFirst({ where: { id: newFolderId }})

        const updatedFile = await prisma.file.update({
            where: { id: file.id },
            data: {
                folder: { connect: { id: newFolderId } }
            }
        })

        const updateOldLineagePromises = oldLineage.map(
            async (folderId) => {
                const result = await prisma.folder.update({
                    where: { id: folderId },
                    data: { sizeKB: { decrement: file.sizeKB } }
                })
                return result;
            }
        )
        const updateOldLineageResults = 
            await Promise.all(updateOldLineagePromises);

        const updateNewLineagePromises = newLineage.map(
            async (folderId) => {
                const result = await prisma.folder.update({
                    where: { id: folderId },
                    data: { sizeKB: { increment: file.sizeKB } }
                })
                return result;
            }
        )
        const updateNewLineageResults = 
            await Promise.all(updateNewLineagePromises);

        debug('old file details', file)
        debug('new file details', updatedFile)
        debug('old lineage pre-move results', readOldLineageResults)
        debug('old lineage update results', updateOldLineageResults)
        debug('new lineage pre-move results', readNewLineageResults)
        debug('new lineage update results', updateNewLineageResults)

        return res.status(200).json({ message: "file move successful"})
    }
]

exports.deleteFileDelete = [
    checkAuth,
    async (req, res, next) => {
        const { fileId } = req.body;
        debug('commencing file name change')

        try {
            const fileToDelete = await prisma.file.findFirst({
                where: { id: fileId }
            })
            const trashFolder = await prisma.folder.findFirst({
                where: { userId: req.user.id, isTrash: true }

            })
            const folderLineage = await getFolderIdLineage(fileToDelete)

            const deleted = await prisma.file.update({
                where: { id: fileToDelete.id },
                data: {
                    deleted: true,
                    deletedAt: new Date(Date.now()),
                    folder: {
                        connect: {
                            id: trashFolder.id,
                        }
                    }
                }
            })
            const addTrashMemory = await prisma.folder.update({
                where: { id: trashFolder.id },
                data: { sizeKB: { increment: fileToDelete.sizeKB } }
            })

            const reduceMemoryFolderPromises = folderLineage.map(
                async (folderId) => {
                    const result = await prisma.folder.update({
                        where: { id: folderId },
                        data: { sizeKB: { decrement: fileToDelete.sizeKB } }
                    })
                    return result;
                }
            )
            const folderUpdates = await Promise.all(reduceMemoryFolderPromises)
            const userUpdate = await prisma.user.update({
                where: { id: fileToDelete.userId },
                data: { memoryUsedKB: { decrement: fileToDelete.sizeKB } }
            })

            debug('DB deleted file', deleted)
            debug('trash folder memory increase', addTrashMemory)
            debug('folder memory reduction results', folderUpdates)
            debug('user memory update', userUpdate)

            const partialPath =
                path.join(__dirname, '../../public', deleted.name)
            // const ext = path.extname(partialPath)
            // const deletedPath = path.join(partialPath, ext)
            debug('path', partialPath)
            await fs.rm(partialPath)
            return res.status(201).json({ message: "file has been deleted" })
        } catch (err) {
            debug('error deleting file: %O', err)
            throw err
        }
    }
]

// exports.readFolderContentsGet = [
//     checkAuth,
//     async (req, res, next) => {

//     }
// ]