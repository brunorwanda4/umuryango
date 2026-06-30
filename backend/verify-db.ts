import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required.');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

async function main() {
  const models = [
    'user',
    'emailVerification',
    'passwordReset',
    'authSession',
    'family',
    'familyMember',
    'familyInvite',
    'familyAuditEvent',
    'authAuditEvent',
    'familyContributionPlan',
    'familyContributionAssignment',
    'familyContributionCycle',
    'familyContributionPayment',
    'familyProject',
    'familyProjectParticipant',
    'familyProjectContribution',
    'familyProjectUpdate',
    'familyTransactionCategory',
    'familyTransaction',
    'familyReceipt',
    'familyBudget',
  ];

  console.log('--- Database Verification ---');
  for (const model of models) {
    const count = await (prisma as any)[model].count();
    console.log(`${model}: ${count} records`);
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
