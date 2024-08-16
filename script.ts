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
        const fileList: string[] = listData.map(
            (file: { name: string }) => {
                if (file.name !== '.emptyFolderPlaceholder') return file.name
            }
        );

        const finalFileList: string[] = fileList
            .filter(file => file !== undefined)

        const { data: deleteData, error: deleteError } = await supabase
            .storage
            .from('files')
            .remove(finalFileList);
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

async function updates() {
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
         const fileList: string[] = listData.map(
            (file: { name: string }) => file.name
        );

        if (listError) console.error('supabase listing error', listError)

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

clearFilesAndFolders()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })