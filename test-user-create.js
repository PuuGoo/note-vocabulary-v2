// Test script to debug user creation issue
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    console.log('1. Checking existing users...');
    const users = await prisma.user.findMany();
    console.log('Existing users:', users.map(u => ({ id: u.id, email: u.email })));
    
    console.log('\n2. Checking database schema...');
    const tableInfo = await prisma.$queryRaw`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'users'
      ORDER BY ORDINAL_POSITION
    `;
    console.log('Table schema:', tableInfo);
    
    console.log('\n3. Checking constraints...');
    const constraints = await prisma.$queryRaw`
      SELECT 
        tc.CONSTRAINT_NAME,
        tc.CONSTRAINT_TYPE,
        kcu.COLUMN_NAME
      FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
      JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu
        ON tc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
      WHERE tc.TABLE_NAME = 'users'
    `;
    console.log('Constraints:', constraints);
    
    console.log('\n4. Trying to create test user...');
    const testEmail = 'test-' + Date.now() + '@example.com';
    const testUser = await prisma.user.create({
      data: {
        email: testEmail,
        passwordHash: '$2a$10$testHashValue',
        name: 'Test User',
        role: 'USER',
        emailVerified: false
      }
    });
    console.log('✅ User created successfully:', testUser);
    
    // Clean up
    await prisma.user.delete({ where: { id: testUser.id } });
    console.log('✅ Test user deleted');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Error code:', error.code);
    console.error('Error meta:', error.meta);
  } finally {
    await prisma.$disconnect();
  }
}

test();
