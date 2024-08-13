require('dotenv').config()
const debug = require('debug')('backend:manager')
const multer = require('multer')
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
    (req, res, next) => {
        debug('file details', req.file)
        if (!req.isAuthenticated()) return res.status(401)
        return res.status(201).json({ message: "file uploaded" })
    }
]

exports.createFolderPost = async (req, res, next) => {
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