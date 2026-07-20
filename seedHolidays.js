const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const holidays2026 = [
  { name: 'Republic Day', date: '2026-01-26T00:00:00.000Z', type: 'NATIONAL', isOptional: false },
  { name: 'Maha Shivaratri', date: '2026-02-14T00:00:00.000Z', type: 'OPTIONAL', isOptional: true },
  { name: 'Holi', date: '2026-03-03T00:00:00.000Z', type: 'NATIONAL', isOptional: false },
  { name: 'Eid al-Fitr', date: '2026-03-20T00:00:00.000Z', type: 'NATIONAL', isOptional: false },
  { name: 'Mahavir Jayanti', date: '2026-04-01T00:00:00.000Z', type: 'OPTIONAL', isOptional: true },
  { name: 'Good Friday', date: '2026-04-03T00:00:00.000Z', type: 'NATIONAL', isOptional: false },
  { name: 'Eid al-Adha', date: '2026-05-27T00:00:00.000Z', type: 'NATIONAL', isOptional: false },
  { name: 'Muharram', date: '2026-06-26T00:00:00.000Z', type: 'OPTIONAL', isOptional: true },
  { name: 'Independence Day', date: '2026-08-15T00:00:00.000Z', type: 'NATIONAL', isOptional: false },
  { name: 'Raksha Bandhan', date: '2026-08-28T00:00:00.000Z', type: 'OPTIONAL', isOptional: true },
  { name: 'Janmashtami', date: '2026-09-04T00:00:00.000Z', type: 'OPTIONAL', isOptional: true },
  { name: 'Mahatma Gandhi Jayanti', date: '2026-10-02T00:00:00.000Z', type: 'NATIONAL', isOptional: false },
  { name: 'Dussehra', date: '2026-10-19T00:00:00.000Z', type: 'NATIONAL', isOptional: false },
  { name: 'Diwali', date: '2026-11-08T00:00:00.000Z', type: 'NATIONAL', isOptional: false },
  { name: 'Guru Nanak Jayanti', date: '2026-11-24T00:00:00.000Z', type: 'OPTIONAL', isOptional: true },
  { name: 'Christmas Day', date: '2026-12-25T00:00:00.000Z', type: 'NATIONAL', isOptional: false }
]

async function seedHolidays() {
  try {
    console.log('Seeding holidays for 2026...')
    for (const h of holidays2026) {
      // Check if it exists
      const existing = await prisma.holiday.findFirst({
        where: { name: h.name, date: new Date(h.date) }
      })
      if (!existing) {
        await prisma.holiday.create({
          data: {
            name: h.name,
            date: new Date(h.date),
            type: h.type,
            isOptional: h.isOptional,
            description: `Public Holiday for ${h.name}`
          }
        })
        console.log(`Added: ${h.name}`)
      } else {
        console.log(`Skipped (already exists): ${h.name}`)
      }
    }
    console.log('Successfully seeded Indian holidays for 2026!')
  } catch (error) {
    console.error('Error seeding holidays:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedHolidays()
