import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    // Find all employees
    const employees = await prisma.user.findMany({
        where: { role: 'EMPLOYEE' },
        include: { details: true }
    })

    console.log('\n=== EMPLOYEES IN DATABASE ===')
    for (const emp of employees) {
        const newPassword = Math.random().toString(36).slice(-8)
        const hashed = await bcrypt.hash(newPassword, 10)
        
        await prisma.user.update({
            where: { id: emp.id },
            data: { 
                password: hashed,
                firstLogin: true,
                emailVerified: true // mark as verified so they can log in
            }
        })

        console.log(`\nEmployee: ${emp.details?.firstName} ${emp.details?.lastName}`)
        console.log(`  Email:       ${emp.email}`)
        console.log(`  Employee ID: ${emp.employeeId}`)
        console.log(`  NEW Password: ${newPassword}`)
        console.log(`  → They can now log in at http://localhost:3000/login`)
    }
    console.log('\n=============================\n')
}

main()
    .then(() => prisma.$disconnect())
    .catch(e => { console.error(e); prisma.$disconnect(); process.exit(1) })
