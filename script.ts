import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function findChildren() {
    try {
        const results = await prisma.folder.findUnique({
            where: { id: "f8853f36-e155-424a-9ac8-0bfaeea9efb8" },
            include: {
                parent: true
            }
        })
        console.log('child results', results)

    } catch (err) {
        console.error('Error deleting users:', err)
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
                files : {
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

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })

