require('dotenv').config()
const debug = require('debug')('backend:manager')
const multer = require('multer')
const path = require('path')
const fs = require('fs/promises')
const checkAuth = require('./authContr').checkAuthGet
const getFolderIdLineage = require('./folderContr').getFolderIdLineage;
const toJSONObject = require('./folderContr').toJSONObject;
const { PrismaClient } = require('@prisma/client')
const { createClient } = require('@supabase/supabase-js')

const prisma = new PrismaClient()
const supabase = createClient(process.env.SB_API_URL, process.env.SB_API_KEY)

const upload = multer({ storage: multer.memoryStorage() })

const fiveMBinKB = 5 * 1000 * 1000 / 1000 

exports.fileUploadPost = [
    upload.single('uploaded_file'),
    checkAuth,
    async (req, res, next) => {
        debug('file details: %O', req.file)
        const { originalname, buffer, mimetype, size } = req.file;
        const { parentFolderId } = req.body;
        const fileSizeKB = size / 1000;

        try {
            const user = await prisma.user.findFirst({
                where: { id: req.user.id }
            })


            if (user.memoryUsedKB + fileSizeKB > fiveMBinKB) {
                return res
                    .status(405)
                    .json({ message: "memory limit exceeded. \
                        try a smaller file or deleting a current file" })
            }
            const { data, error } = await supabase
                .storage
                .from('files')
                .upload(originalname, buffer, {
                    contentType: mimetype,
                    upsert: false
                })

            debug('sb upload (expect null): %O', data)
            debug('sb error upload: %O', error)

            const newFile = await prisma.file.create({
                data: {
                    name: originalname,
                    type: mimetype,
                    sizeKB: fileSizeKB,
                    owner: { connect: { id: req.user.id } },
                    parentFolder: { connect: { id: parentFolderId } }
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

exports.readFileGet = [
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

            const fileObject = toJSONObject(fileDetails)
            return res.status(200).sendFile(filePath)
        } catch (err) {
            debug('error retrieving file', err)
            throw err
        }
    }
]

exports.sbDownloadGet = [
    checkAuth,
    async (req, res, next) => {
        try {
            const fileName = 'sb_pic_orig.png';
            const { data, error } = await supabase
                .storage
                .from('files')
                .getPublicUrl(fileName)

                // .createSignedUrl(fileName, 600)
                // .download(fileName)
                
            const fileObject = new File([data], fileName)
            const file = Buffer.from(await fileObject.arrayBuffer())

            debug('sb data raw:%O', data)
            debug('sb download file object:%O', fileObject)
            debug('sb download buffered file:%O', file)

            res.setHeader('Content-Type', data.type)
            res.setHeader(
                'Content-Disposition', 
                `attachment; filename="${fileObject.name}"`
            )

            if (error) {
                debug('Error downloading from Supabase:', error)
                return res
                    .status(500)
                    .json({ error: 'Failed to download file' })
                }
            return res.status(200).send(file)
        } catch (error) {
            debug('unexpected error downloading from supabase', error)
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
            const newPath =
                path.join(__dirname, '../../public', `${newName}${ext}`)
            await fs.rename(filePath, newPath)
            


            const updatedFile = await prisma.file.update({
                where: { id: fileId },
                data: { name: `${newName}${ext}` }
            })
            

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
        const { fileId, newParentFolderId } = req.body
        try {
            const file = await prisma.file.findFirst({ where: { id: fileId } })
            const oldLineage = await getFolderIdLineage(file)
            const newLineage = await getFolderIdLineage(newParentFolderId)

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
            const readNewLineageResults =
                await Promise.all(readNewLineagePromises);

            const updatedFile = await prisma.file.update({
                where: { id: file.id },
                data: {
                    parentFolder: { connect: { id: newParentFolderId } }
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

            return res.status(200).json({ message: "file move successful" })
        } catch (err) {
            debug('error in moving file: %O', err)
        }
    }
]

exports.deleteFileDelete = [
    checkAuth,
    async (req, res, next) => {
        const { fileId } = req.body;
        debug('commencing file deletion')

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
                    parentFolder: {
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

            debug('trash folder post update: %O', addTrashMemory)
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

            let trashFiles;
            if (addTrashMemory.sizeKB > fiveMBinKB) {
                const memoryToDelete = addTrashMemory.sizeKB - fiveMBinKB;
                trashFiles = await prisma.file.findMany({
                    where: { 
                        parentFolderId: trashFolder.id,
                        deleted: true 
                    },
                    orderBy: { deletedAt: 'asc' }
                })

                let deletedKB = 0;
                let deletedFiles = [];

                for (let file of trashFiles) {
                    deletedKB += file.sizeKB;
                    deletedFiles.push(file)

                    const dbDeletion = await prisma.file.delete({
                        where: { id: file.id }
                    })
                    const updateTrashFolder = await prisma.folder.update({
                        where: { id: trashFolder.id },
                        data: { sizeKB: { decrement: file.sizeKB } }
                    })

                    const { data, error } = await supabase
                        .storage
                        .from('files')
                        .remove([file.name])
                    
                    if (deletedKB >= memoryToDelete) break
                }
            }

            debug('DB deleted file', deleted)
            debug('trash folder memory increase', addTrashMemory)
            debug('folder memory reduction results', folderUpdates)
            debug('user memory update', userUpdate)
            debug('trash files', trashFiles)

            return res.status(201).json({ message: "file has been deleted" })
        } catch (err) {
            debug('error deleting file: %O', err)
            throw err
        }
    }
]