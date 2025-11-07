/**
 * Test script to check API usage tracking
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkApiUsage() {
  try {
    console.log('Checking API usage records...\n');

    // Get today's date in Vietnam timezone (GMT+7)
    const now = new Date();
    const utcTime = now.getTime();
    const vietnamOffset = 7 * 60 * 60 * 1000; // GMT+7 in milliseconds
    const vietnamTime = new Date(utcTime + vietnamOffset);
    
    // Get date string and create Date object at midnight UTC
    const year = vietnamTime.getUTCFullYear();
    const month = String(vietnamTime.getUTCMonth() + 1).padStart(2, '0');
    const day = String(vietnamTime.getUTCDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    const today = new Date(dateString + 'T00:00:00.000Z');

    console.log(`🕐 Vietnam Time: ${vietnamTime.toISOString().replace('T', ' ').substring(0, 19)} GMT+7`);
    console.log(`📅 Checking for date: ${dateString}\n`);

    const usageRecords = await prisma.apiUsage.findMany({
      orderBy: { date: 'desc' },
    });

    if (usageRecords.length === 0) {
      console.log('❌ No API usage records found in database');
    } else {
      console.log(`✅ Found ${usageRecords.length} API usage record(s):\n`);
      usageRecords.forEach((record) => {
        console.log(`📊 Service: ${record.service}`);
        console.log(`   Date: ${record.date.toISOString().split('T')[0]}`);
        console.log(`   Request Count: ${record.requestCount}`);
        console.log(`   Created: ${record.createdAt}`);
        console.log(`   Updated: ${record.updatedAt}`);
        console.log('');
      });
    }

    // Check today's dictionary usage
    const todayDictionary = await prisma.apiUsage.findFirst({
      where: {
        date: today,
        service: 'dictionary',
      },
    });

    if (todayDictionary) {
      console.log("📖 Today's Dictionary Usage:");
      console.log(`   Current: ${todayDictionary.requestCount} / 2000`);
      console.log(`   Remaining: ${2000 - todayDictionary.requestCount}`);
    } else {
      console.log('📖 No dictionary usage recorded for today yet');
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkApiUsage();
