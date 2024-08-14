import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function updates() {
    try {
        const results = await prisma.user.update({
            where: { id: '111' },
            data: { id: 'value' }
        })
        console.log('results', results)
    }
    catch (error) {
        console.error('Error deleting users:', error)
    }
}

async function main() {
    try {
        const results = await prisma.user.findMany()
        console.log('results', results)
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