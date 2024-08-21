require('dotenv').config()
const debug = require('debug')('backend:manager')
const multer = require('multer')
const postAuthCheck = require('./authContr').postAuthCheck
const getFolderIdLineage = require('./folderContr').getFolderIdLineage;
const { PrismaClient } = require('@prisma/client')
const { createClient } = require('@supabase/supabase-js')

const prisma = new PrismaClient()
const supabase = createClient(process.env.SB_API_URL, process.env.SB_API_KEY)

const upload = multer({ storage: multer.memoryStorage() })

const fiveMBinKB = 5 * 1000 * 1000 / 1000

exports.postFileUpload = [
    upload.single('uploaded_file'),
    postAuthCheck,
    async (req, res, next) => {
        debug('file details: %O', req.file)
        debug('parentFolder', req.body.parentFolderId)
        const { originalname, buffer, mimetype, size } = req.file;
        let parentFolderId = req.body.parentFolderId === undefined 
            ? null
            : req.body.parentFolderId;

        const fileSizeKB = parseFloat(size / 1000, 3);
        try {
            const user = await prisma.user.findFirst({
                where: { id: req.user.id }
            })

            if (user.memoryUsedKB + fileSizeKB > fiveMBinKB) {
                return res
                    .status(405)
                    .json({
                        message: "memory limit exceeded. \
                        try a smaller file or deleting a current file"
                    })
            }

            if (!parentFolderId) {
                const rootFolder = await prisma.folder.findFirst({
                    where: { AND: { userId: req.user.id, isRoot: true } }
                });
                parentFolderId = rootFolder.id;
            }

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

            const { data, error } = await supabase
                .storage
                .from('files')
                .upload(originalname, buffer, {
                    contentType: mimetype,
                    upsert: false
                })

            if (error) {
                debug('Error uploading to Supabase:', error)
                return res
                    .status(500)
                    .json({ error: 'Failed to upload file' })
            }

            debug('sb upload: %O', data)
            debug('sb error upload: %O', error)
            debug('file uploaded: %O', newFile)
            debug('folder memory update results', folderUpdates)
            debug('user memory update', userUpdate)

            return res.status(201).json({ message: "file uploaded", newFile })
        } catch (err) {
            debug('error uploading file: %O', err)
            return res
                .status(500)
                .json({
                    error: 'An unexpected error occurred',
                    details: err.message
                })
        }
    }
]

exports.getFile = [
    postAuthCheck,
    async (req, res, next) => {
        try {
            const { fileId } = req.body;
            const fileDetails = await prisma.file.update({
                where: { id: fileId },
                data: { downloads: { increment: 1 } }
            })
            const fileName = fileDetails.name
            const { data, error } = await supabase
                .storage
                .from('files')
                .download(fileName)

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

exports.getFileDetails = [
    postAuthCheck,
    async (req, res, next) => {
        const { fileId } = req.body;
        debug(`commence file retrieval for file #${fileId}`, req.body);
        try {
            const fileDetails = await prisma.file.findFirst({
                where: { id: fileId }
            })
            if (fileDetails.deletedFile) {
                return res
                    .status(404)
                    .json({ message: "file has been deleted" })
            }

            return res.status(200).send(fileDetails)
        } catch (err) {
            debug('error retrieving file', err)
            throw err
        }
    }
]

exports.updateFileNamePut = [
    postAuthCheck,
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

            const ext = fileDetails.name
                .slice((fileDetails.name.lastIndexOf('.') - 1 >>> 0) + 1);
            debug('extension:', ext)

            const { data: downloadData,
                error: downloadError } = await supabase
                    .storage
                    .from('files')
                    .download(fileDetails.name)

            if (downloadError) {
                debug('Error downloading from supabase for name change:'
                    , downloadError)
                return res
                    .status(500)
                    .json({ error: 'Failed to upload file' })
            }

            const fileObject = new File([downloadData], fileDetails.name)
            const fileBuffer = Buffer.from(await fileObject.arrayBuffer())

            const { data: nameChangeDeleteData,
                error: nameChangeDeleteError } = await supabase
                    .storage
                    .from('files')
                    .remove([fileDetails.name])

            if (nameChangeDeleteError) {
                debug('Error deleting from supabase for name change:'
                    , nameChangeDeleteError)
                return res
                    .status(500)
                    .json({ error: 'Failed to upload file' })
            }

            const updatedFile = await prisma.file.update({
                where: { id: fileId },
                data: { name: `${newName}${ext}` }
            })

            const { data: nameChangeUploadData,
                error: nameChangeUploadError } = await supabase
                    .storage
                    .from('files')
                    .upload(updatedFile.name, fileBuffer, {
                        contentType: downloadData.type,
                        upsert: false
                    })

            if (nameChangeUploadError) {
                debug('Error uploading to Supabase:', nameChangeUploadError)
                return res
                    .status(500)
                    .json({ error: 'Failed to upload file' })
            }

            debug('file name changes to ', updatedFile.name)
            res.status(200).json({ message: "file name changed", updatedFile })
        } catch (err) {
            debug('error in updating file name', err)
            throw err
        }
    }
]

exports.updateFileLocationPut = [
    postAuthCheck,
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

exports.deleteFile = [
    postAuthCheck,
    async (req, res, next) => {
        const { fileId } = req.body;
        debug('commencing file deletion')

        try {
            const trashFolder = await prisma.folder.findFirst({
                where: { userId: req.user.id, isTrash: true }

            })
            const folderLineage = await getFolderIdLineage(fileId)

            const deletedFile = await prisma.file.update({
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

                    if (error) {
                        debug('error deleting file', error)
                        res.status(500).json({ message: 'error deleting file' })
                    }

                    if (deletedKB >= memoryToDelete) break
                }
            }

            debug('DB deleted file', deletedFile)
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