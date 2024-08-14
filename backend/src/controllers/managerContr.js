require('dotenv').config()
const debug = require('debug')('backend:manager')
const multer = require('multer')
const path = require('path')
const fs = require('fs/promises')
const checkAuth = require('./authContr').checkAuthGet
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

            const updateFolderMemoryPromises = folderLineage.map(
                async (folderId) => {
                    const result = await prisma.folder.update({
                        where: { id: folderId },
                        data: { sizeKB: { increment: newFile.sizeKB } }
                    })
                    return result;
                }
            )
            const folderUpdates = await Promise.all(updateFolderMemoryPromises)
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

exports.deleteFileDelete = [
    checkAuth,
    async (req, res, next) => {
        const { fileId } = req.body;
        debug('commencing file name change')

        try {
            const trashFolder = await prisma.folder.findFirst({
                where: { userId: req.user.id, isTrash: true }
            })

            const deleted = await prisma.file.update({
                where: { id: fileId },
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

            debug('DB deleted folder', deleted)

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

exports.createFolderPost = [
    checkAuth,
    async (req, res, next) => {
        debug('commencing new folder creation: %O', req.body);
        const { parentId, name } = req.body
        try {
            const newFolder = await prisma.folder.create({
                data: {
                    name: name,
                    owner: {
                        connect: {
                            id: req.user.id,
                        }
                    },
                    parent: {
                        connect: {
                            id: parentId,
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

// exports.readFolderContentsGet = [
//     checkAuth,
//     async (req, res, next) => {

//     }
// ]

async function getFolderIdLineage(file) {
    const folderChain = [file.folderId]
    let i = 0;
    try {
        do {
            const folder = await prisma.folder.findFirst({
                where: { id: folderChain[i] }
            })
            let parentExists = !!folder.parent
            if (parentExists) {
                i = folderChain.push(folder.parentId) - 1;
            }
        }
        while (parentExists)
    } catch (err) {
        debug('error retrieving folder lineage', err)
    }
    return folderChain
}