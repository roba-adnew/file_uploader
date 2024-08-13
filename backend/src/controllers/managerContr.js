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
    checkAuth,
    async (req, res, next) => {
        debug('file details: %O', req.file)
        try {
            const newFile = await prisma.file.create({
                data: {
                    name: req.file.filename,
                    type: req.file.mimetype,
                    owner: {
                        connect: {
                            id: req.user.id,
                        }
                    },
                    folder: {
                        connect: {
                            id: req.body.folder,
                        }
                    }
                }
            })
            debug('file uploaded: %O', newFile)
        } catch (err) {
            debug('error uploading file: %O', err)
            throw err
        }
        return res.status(201).json({ message: "file uploaded" })
    }
]

exports.createFolderPost = async (req, res, next) => {
    checkAuth();
    checkAuth();
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
            const updatedFile = await prisma.file.update({
                where: { id: fileId },
                data: { name: newName }
            })
            const filePath = path
                .join(__dirname, '../../public', fileDetails.name)
            const ext = path.extname(filePath)
            const newPath = path
                .join(__dirname, '../../public', `${newName}${ext}`)
            debug('filePath:', filePath, 'newPath', newPath)
            await fs.rename(filePath, newPath)
            debug('file name changes to ', updatedFile.name)
            res.status(200).json({ message: "file name changed" })
        } catch (err) {
            debug('error in updating file name', err)
            throw err
        }
    }
]