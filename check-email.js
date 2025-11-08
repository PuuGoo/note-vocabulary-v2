require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkEmail() {
  const email = 'puugoo002@gmail.com';
  
  console.log('\n1. Searching for email:', email);
  const user = await prisma.user.findUnique({ where: { email } });
  console.log('Found:', user);
  
  console.log('\n2. All users in database:');
  const allUsers = await prisma.user.findMany();
  console.log(allUsers.map(u => ({ email: u.email, name: u.name })));
  
  console.log('\n3. Raw SQL query:');
  const raw = await prisma.$queryRaw`SELECT email, name FROM dbo.users`;
  console.log(raw);
  
  await prisma.$disconnect();
}

checkEmail();
