import { PrismaClient } from '@prisma/client'
const { createClient } = require('@supabase/supabase-js')

const prisma = new PrismaClient()
const supabase = createClient(process.env.SB_API_URL, process.env.SB_API_KEY)

async function findChildren() {
    try {
        const results = await prisma.folder.findUnique({
            where: { id: "c4fc6e90-4aa1-4fb6-b8a1-53a6255260f1" },
            include: {
                childFolders: true,
                files: true
            }
        })
        console.log('child results', results)

    } catch (err) {
        console.error('Error deleting users:', err)
    }
}

async function clearFilesAndFolders() {
    try {
        const fileDeletion = await prisma.file.deleteMany()
        const folderDeletion = await prisma.folder.deleteMany({
            where: {
                AND: {
                    isRoot: false,
                    isTrash: false
                }
            }
        })
        const rootTrashReset = await prisma.folder.updateMany({
            data: { sizeKB: 0 }
        })
        const userReset = await prisma.user.updateMany({
            data: { memoryUsedKB: 0 }
        })

        const { data: listData, error: listError } = await supabase
            .storage
            .from('files')
            .list();

        if (listError) console.error('supabase listing error', listError);
        const fileList: string[] = listData
            .map((file: { name: string }) => {
                if (file.name !== '.emptyFolderPlaceholder') return file.name
            })
            .filter((name: string) => {
                if (name !== '.emptyFolderPlaceholder') return name
            })

        const { data: deleteData, error: deleteError } = await supabase
            .storage
            .from('files')
            .remove(fileList);
        if (deleteError) console.error('supabase deleting error', deleteError);

        console.log(
            'files deleted', fileDeletion,
            'folders deleted', folderDeletion,
            'root and trash reset', rootTrashReset,
            'user reset', userReset,
            'supabase deletion', deleteData
        )
    } catch (err) {
        console.error(err)
    }
}

async function customUpdate() {
    try {
        const results = await prisma.folder.update({
            where: { id: "f1e34044-62ca-457a-aa1b-aa9211aafb72" },
            data: {
                parentFolder: {
                    connect: { id: "bfa0dec3-a822-4877-b4bb-5fcbe674e195" }
                }
            }
        })
    } catch (err) {
        console.error(err)
    }
}

async function resetToZero() {
    try {
        const user = await prisma.user.updateMany({
            data: { memoryUsedKB: 0 }
        })
        const folders = await prisma.folder.updateMany({
            data: { sizeKB: 0 }
        })
        console.log('user', user, 'folders', folders)
    }
    catch (err) {
        console.error('Error deleting users:', err)
    }
}

async function findEverything() {
    try {
        const folders = await prisma.folder.findMany({
            include: {
                parentFolder: {
                    select: { name: true }
                },
                files: {
                    select: { name: true }
                },
                childFolders: {
                    select: { name: true }
                }
            }
        })
        const files = await prisma.file.findMany({
            include: {
                parentFolder: {
                    select: { name: true }
                }
            }
        })
        const users = await prisma.user.findMany()
        const { data: listData, error: listError } = await supabase
            .storage
            .from('files')
            .list()

        if (listError) console.error('supabase listing error', listError)

        const fileList: string[] = listData
            .map((file: { name: string }) => file.name)
            .filter((name: string) => {
                if (name !== '.emptyFolderPlaceholder') return name
            })

        console.log(
            'files', files,
            'folders', folders,
            'users', users,
            'supabase files', fileList
        )
    }
    catch (error) {
        console.error('Error deleting users:', error)
    }
}

async function testing() {
    try {
        const diff = 1000;
        let trashFiles = await prisma.file.findMany({
            where: {
                parentFolderId: "60e5d65c-7c67-4a85-87a4-5d568c9975ce", // replace with trashFolder.id
                deleted: true
            },
            orderBy: { deletedAt: 'asc' }
        })
        const trashFileIds = trashFiles.map(file => file.id)

        let deletedKB = 0;
        let deletedFiles = [];

        if (true) {
            for (let file of trashFiles) {
                deletedKB = + file.sizeKB
                deletedFiles.push(trashFiles.shift())
                if (deletedKB >= diff) break
            }
        }

        console.log(
            'trash files', trashFiles,
            'deleted files', deletedFiles,
            'deleted amount', deletedKB
        )

    } catch (err) {
        console.error('error testing queries', err)
    }
}

findEverything()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })