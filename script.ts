import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

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
        console.log('files deleted', fileDeletion, 'folders deleted', folderDeletion, 'root and trash reset', rootTrashReset)
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

async function main() {
    try {
        const folders = await prisma.folder.findMany({
            include: {
                parent: {
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
                folder: {
                    select: { name: true }
                }
            }
        })
        const users = await prisma.user.findMany()

        console.log('files', files, 'folders', folders, 'users', users)
    }
    catch (error) {
        console.error('Error deleting users:', error)
    }
}

findChildren()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })