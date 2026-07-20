import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const password = 'admin123'
    const hashedPassword = await bcrypt.hash(password, 10)

    try {
        const admin = await prisma.user.update({
            where: { email: 'admin@dayflow.com' },
            data: { 
                password: hashedPassword,
                firstLogin: false
            }
        })
        console.log(`Admin password reset successful.`)
        console.log(`Email: admin@dayflow.com`)
        console.log(`Password: ${password}`)
    } catch (e) {
        console.log("Admin user not found. Let's create it...")
        const admin = await prisma.user.upsert({
            where: { email: 'admin@dayflow.com' },
            update: {},
            create: {
                email: 'admin@dayflow.com',
                employeeId: 'ADMIN001',
                password: hashedPassword,
                role: 'ADMIN',
                isActive: true,
                firstLogin: false,
                emailVerified: true,
                details: {
                    create: {
                        firstName: 'System',
                        lastName: 'Admin',
                        jobTitle: 'Super Admin',
                        department: 'IT',
                        joiningDate: new Date(),
                    }
                }
            },
        })
        console.log(`Admin user created.`)
        console.log(`Email: admin@dayflow.com`)
        console.log(`Password: ${password}`)
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
