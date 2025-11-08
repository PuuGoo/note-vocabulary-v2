// Quick script to list all users
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    // Check existing users
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, googleId: true, createdAt: true }
    });
    
    console.log('\n=== ALL USERS IN DATABASE ===');
    console.log(`Total users: ${users.length}`);
    users.forEach((user, i) => {
      console.log(`\n${i + 1}. ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Name: ${user.name || 'N/A'}`);
      console.log(`   Google ID: ${user.googleId || 'N/A'}`);
      console.log(`   Created: ${user.createdAt}`);
    });
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
