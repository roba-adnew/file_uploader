require('dotenv').config()
const debug = require('debug')('backend:manager')
const checkAuth = require('./authContr').checkAuthGet
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

exports.getFolderIdLineage = async (fileOrId) => {
    debug('lineage input: %O', fileOrId)
    const fileId = typeof fileOrId === 'string' ? fileOrId : fileOrId.folderId;
    debug('lineage input update: %O', fileId)
    const folderLineage = [fileId]
    let parentExists= true;
    let i = 0;
    try {
        do {
            const folder = await prisma.folder.findFirst({
                where: { id: folderLineage[i] },
                include: { parent: true }
            })
            debug(`#${i} folder lookup`, folder)
            debug(`parent exists`, !!folder.parent)
            parentExists = !!folder.parent;
            if (parentExists) {
                i = folderLineage.push(folder.parentId) - 1;
            }
        }
        while (parentExists)
    } catch (err) {
        debug('error retrieving folder lineage', err)
    }
    return folderLineage
}

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

