require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');

const prisma = new PrismaClient();

async function createUserRawSQL() {
  try {
    const id = randomUUID();
    const email = 'puugoo002@gmail.com';
    const passwordHash = await bcrypt.hash('13031997Phu', 10);
    const name = 'puugoo';
    
    console.log('Creating user with raw SQL...');
    console.log({ id, email, name });
    
    const result = await prisma.$executeRaw`
      INSERT INTO dbo.users (id, email, name, passwordHash, role, emailVerified, createdAt, updatedAt)
      VALUES (${id}, ${email}, ${name}, ${passwordHash}, 'USER', 0, GETDATE(), GETDATE())
    `;
    
    console.log('✅ User created successfully!', result);
    
    // Verify
    const user = await prisma.user.findUnique({ where: { email } });
    console.log('Verified:', user);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Code:', error.code);
    console.error('Meta:', error.meta);
  } finally {
    await prisma.$disconnect();
  }
}

createUserRawSQL();
