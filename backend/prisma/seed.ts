import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  AuthAuditAction,
  AuthAuditResult,
  CategoryStatus,
  ContributionCadence,
  ContributionCycleStatus,
  ContributionPaymentMethod,
  ContributionPaymentStatus,
  ContributionPlanStatus,
  FamilyAuditAction,
  FamilyAuthority,
  FamilyCapability,
  FamilyInviteStatus,
  FamilyKinship,
  FamilyProjectCategory,
  FamilyProjectContributionStatus,
  FamilyProjectContributionStrategy,
  FamilyProjectStatus,
  FamilyType,
  PrismaClient,
  TransactionStatus,
  TransactionType,
  UserStatus,
} from '@prisma/client';
import { hash } from 'bcryptjs';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to seed the database.');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

const seedPassword = 'RwandaFamily123!';

const allCapabilities = Object.values(FamilyCapability);

const ids = {
  users: {
    head: 'seed-user-aline-mukamana',
    admin: 'seed-user-patrick-uwimana',
    member: 'seed-user-claudine-nyirahabimana',
    cousin: 'seed-user-eric-habimana',
  },
  family: 'seed-family-mukamana',
  members: {
    head: 'seed-member-aline-mukamana',
    admin: 'seed-member-patrick-uwimana',
    member: 'seed-member-claudine-nyirahabimana',
    cousin: 'seed-member-eric-habimana',
  },
  invite: 'seed-invite-jeanine',
  contributionPlan: 'seed-plan-monthly-welfare',
  cycles: {
    may: 'seed-cycle-monthly-welfare-2026-05',
    june: 'seed-cycle-monthly-welfare-2026-06',
  },
  payments: {
    mayHead: 'seed-payment-may-aline',
    mayAdmin: 'seed-payment-may-patrick',
    mayMember: 'seed-payment-may-claudine',
    mayCousin: 'seed-payment-may-eric',
    juneHead: 'seed-payment-june-aline',
    juneAdmin: 'seed-payment-june-patrick',
    juneMemberPartial: 'seed-payment-june-claudine-partial',
  },
  project: 'seed-project-house-renovation',
  projectContributions: {
    head: 'seed-project-contribution-aline',
    admin: 'seed-project-contribution-patrick',
    memberPending: 'seed-project-contribution-claudine-pending',
  },
  projectUpdate: 'seed-project-update-materials',
  categories: {
    food: 'seed-cat-food',
    rent: 'seed-cat-rent',
    schoolFees: 'seed-cat-school-fees',
    salary: 'seed-cat-salary',
    businessIncome: 'seed-cat-business-income',
    otherExpense: 'seed-cat-other-expense',
  },
  transactions: {
    salaryJune: 'seed-tx-salary-june',
    rentJune: 'seed-tx-rent-june',
    foodJune: 'seed-tx-food-june',
    schoolFeesJune: 'seed-tx-school-fees-june',
  },
  receipts: {
    rentJuneReceipt: 'seed-receipt-rent-june',
  },
  budgets: {
    foodBudgetJune: 'seed-budget-food-june',
    schoolFeesBudgetJune: 'seed-budget-school-fees-june',
  },
  emailVerifications: {
    head: 'seed-email-verify-head',
  },
  passwordResets: {
    head: 'seed-password-reset-head',
  },
  authSessions: {
    head: 'seed-auth-session-head',
  },
};

function utcDate(year: number, monthIndex: number, day: number): Date {
  return new Date(Date.UTC(year, monthIndex, day, 0, 0, 0));
}

function plusDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

async function upsertUsers(seedPasswordHash: string) {
  const users = [
    {
      id: ids.users.head,
      email: 'aline.mukamana@example.com',
      phoneNumber: '+250788000101',
      fullName: 'Aline Mukamana',
      gender: 'female',
    },
    {
      id: ids.users.admin,
      email: 'patrick.uwimana@example.com',
      phoneNumber: '+250788000102',
      fullName: 'Patrick Uwimana',
      gender: 'male',
    },
    {
      id: ids.users.member,
      email: 'claudine.nyirahabimana@example.com',
      phoneNumber: '+250788000103',
      fullName: 'Claudine Nyirahabimana',
      gender: 'female',
    },
    {
      id: ids.users.cousin,
      email: 'eric.habimana@example.com',
      phoneNumber: '+250788000104',
      fullName: 'Eric Habimana',
      gender: 'male',
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { id: user.id },
      create: {
        ...user,
        passwordHash: seedPasswordHash,
        status: UserStatus.ACTIVE,
        emailVerifiedAt: utcDate(2026, 5, 1),
      },
      update: {
        phoneNumber: user.phoneNumber,
        fullName: user.fullName,
        gender: user.gender,
        passwordHash: seedPasswordHash,
        status: UserStatus.ACTIVE,
        emailVerifiedAt: utcDate(2026, 5, 1),
      },
    });

    await prisma.authAuditEvent.upsert({
      where: { id: `seed-auth-audit-${user.id}` },
      create: {
        id: `seed-auth-audit-${user.id}`,
        userId: user.id,
        emailOrMobile: user.email,
        action: AuthAuditAction.REGISTER,
        result: AuthAuditResult.SUCCESS,
        ipAddress: '127.0.0.1',
        userAgent: 'Prisma seed',
        createdAt: utcDate(2026, 5, 1),
      },
      update: {},
    });
  }
}

async function upsertFamily() {
  await prisma.family.upsert({
    where: { id: ids.family },
    create: {
      id: ids.family,
      name: 'Mukamana Family',
      slug: 'mukamana-family',
      country: 'Rwanda',
      defaultCurrency: 'RWF',
      contributionCadence: 'MONTHLY',
      type: FamilyType.JOINT_EXTENDED,
      description:
        'Extended family fund for monthly welfare support, ceremonies, education, and shared projects.',
      createdById: ids.users.head,
    },
    update: {
      name: 'Mukamana Family',
      country: 'Rwanda',
      defaultCurrency: 'RWF',
      contributionCadence: 'MONTHLY',
      type: FamilyType.JOINT_EXTENDED,
      description:
        'Extended family fund for monthly welfare support, ceremonies, education, and shared projects.',
      createdById: ids.users.head,
    },
  });

  const members = [
    {
      id: ids.members.head,
      userId: ids.users.head,
      authority: FamilyAuthority.HEAD,
      kinshipLabel: FamilyKinship.MOTHER,
      capabilities: allCapabilities,
    },
    {
      id: ids.members.admin,
      userId: ids.users.admin,
      authority: FamilyAuthority.ADMIN,
      kinshipLabel: FamilyKinship.UNCLE,
      capabilities: [
        FamilyCapability.MANAGE_MEMBERS,
        FamilyCapability.MANAGE_CONTRIBUTIONS,
        FamilyCapability.MANAGE_PROJECTS,
        FamilyCapability.MANAGE_DOCUMENTS,
        FamilyCapability.VIEW_REPORTS,
        FamilyCapability.EXPORT_REPORTS,
      ],
    },
    {
      id: ids.members.member,
      userId: ids.users.member,
      authority: FamilyAuthority.MEMBER,
      kinshipLabel: FamilyKinship.DAUGHTER,
      capabilities: [FamilyCapability.VIEW_REPORTS],
    },
    {
      id: ids.members.cousin,
      userId: ids.users.cousin,
      authority: FamilyAuthority.MEMBER,
      kinshipLabel: FamilyKinship.COUSIN,
      capabilities: [],
    },
  ];

  for (const member of members) {
    await prisma.familyMember.upsert({
      where: {
        familyId_userId: {
          familyId: ids.family,
          userId: member.userId,
        },
      },
      create: {
        id: member.id,
        familyId: ids.family,
        userId: member.userId,
        authority: member.authority,
        kinshipLabel: member.kinshipLabel,
        capabilities: member.capabilities,
      },
      update: {
        authority: member.authority,
        kinshipLabel: member.kinshipLabel,
        capabilities: member.capabilities,
        removedAt: null,
      },
    });
  }

  await prisma.familyInvite.upsert({
    where: {
      familyId_email: {
        familyId: ids.family,
        email: 'jeanine.nzeyimana@example.com',
      },
    },
    create: {
      id: ids.invite,
      familyId: ids.family,
      email: 'jeanine.nzeyimana@example.com',
      authority: FamilyAuthority.MEMBER,
      kinshipLabel: FamilyKinship.AUNT,
      capabilities: [],
      status: FamilyInviteStatus.PENDING,
      tokenHash: await hash('seed-jeanine-invite-token', 10),
      expiresAt: plusDays(new Date(), 14),
    },
    update: {
      authority: FamilyAuthority.MEMBER,
      kinshipLabel: FamilyKinship.AUNT,
      capabilities: [],
      status: FamilyInviteStatus.PENDING,
      expiresAt: plusDays(new Date(), 14),
    },
  });

  await prisma.familyAuditEvent.upsert({
    where: { id: 'seed-audit-member-invited-jeanine' },
    create: {
      id: 'seed-audit-member-invited-jeanine',
      familyId: ids.family,
      actorId: ids.users.head,
      action: FamilyAuditAction.MEMBER_INVITED,
      after: {
        email: 'jeanine.nzeyimana@example.com',
        authority: FamilyAuthority.MEMBER,
      },
      createdAt: utcDate(2026, 5, 4),
    },
    update: {},
  });
}

async function upsertContributions() {
  await prisma.familyContributionPlan.upsert({
    where: { id: ids.contributionPlan },
    create: {
      id: ids.contributionPlan,
      familyId: ids.family,
      name: 'Monthly welfare contribution',
      description:
        'Recurring support fund for family emergencies, visits, and shared obligations.',
      cadence: ContributionCadence.MONTHLY,
      amountMinorUnits: 10_000n,
      currency: 'RWF',
      status: ContributionPlanStatus.ACTIVE,
      createdById: ids.users.head,
    },
    update: {
      name: 'Monthly welfare contribution',
      description:
        'Recurring support fund for family emergencies, visits, and shared obligations.',
      cadence: ContributionCadence.MONTHLY,
      amountMinorUnits: 10_000n,
      currency: 'RWF',
      status: ContributionPlanStatus.ACTIVE,
      archivedAt: null,
    },
  });

  for (const memberId of Object.values(ids.members)) {
    await prisma.familyContributionAssignment.upsert({
      where: {
        planId_memberId: {
          planId: ids.contributionPlan,
          memberId,
        },
      },
      create: {
        planId: ids.contributionPlan,
        memberId,
        amountMinorUnits: 10_000n,
      },
      update: {
        amountMinorUnits: 10_000n,
        removedAt: null,
      },
    });
  }

  const cycles = [
    {
      id: ids.cycles.may,
      label: 'May 2026',
      periodStart: utcDate(2026, 4, 1),
      periodEnd: utcDate(2026, 4, 31),
      dueDate: utcDate(2026, 4, 25),
      status: ContributionCycleStatus.COMPLETED,
    },
    {
      id: ids.cycles.june,
      label: 'June 2026',
      periodStart: utcDate(2026, 5, 1),
      periodEnd: utcDate(2026, 5, 30),
      dueDate: utcDate(2026, 5, 25),
      status: ContributionCycleStatus.OPEN,
    },
  ];

  for (const cycle of cycles) {
    await prisma.familyContributionCycle.upsert({
      where: { id: cycle.id },
      create: {
        id: cycle.id,
        familyId: ids.family,
        planId: ids.contributionPlan,
        label: cycle.label,
        periodStart: cycle.periodStart,
        periodEnd: cycle.periodEnd,
        dueDate: cycle.dueDate,
        expectedMinorUnits: 40_000n,
        status: cycle.status,
      },
      update: {
        label: cycle.label,
        periodStart: cycle.periodStart,
        periodEnd: cycle.periodEnd,
        dueDate: cycle.dueDate,
        expectedMinorUnits: 40_000n,
        status: cycle.status,
      },
    });
  }

  const payments = [
    {
      id: ids.payments.mayHead,
      cycleId: ids.cycles.may,
      memberId: ids.members.head,
      amountMinorUnits: 10_000n,
      method: ContributionPaymentMethod.MOBILE_MONEY,
      status: ContributionPaymentStatus.VERIFIED,
      reference: 'MTN-MAY-ALINE',
      paidAt: utcDate(2026, 4, 7),
      idempotencyKey: 'seed-payment-may-aline',
    },
    {
      id: ids.payments.mayAdmin,
      cycleId: ids.cycles.may,
      memberId: ids.members.admin,
      amountMinorUnits: 10_000n,
      method: ContributionPaymentMethod.BANK_TRANSFER,
      status: ContributionPaymentStatus.VERIFIED,
      reference: 'BK-MAY-PATRICK',
      paidAt: utcDate(2026, 4, 9),
      idempotencyKey: 'seed-payment-may-patrick',
    },
    {
      id: ids.payments.mayMember,
      cycleId: ids.cycles.may,
      memberId: ids.members.member,
      amountMinorUnits: 10_000n,
      method: ContributionPaymentMethod.CASH,
      status: ContributionPaymentStatus.VERIFIED,
      reference: 'CASH-MAY-CLAUDINE',
      paidAt: utcDate(2026, 4, 12),
      idempotencyKey: 'seed-payment-may-claudine',
    },
    {
      id: ids.payments.mayCousin,
      cycleId: ids.cycles.may,
      memberId: ids.members.cousin,
      amountMinorUnits: 10_000n,
      method: ContributionPaymentMethod.MOBILE_MONEY,
      status: ContributionPaymentStatus.VERIFIED,
      reference: 'AIRTEL-MAY-ERIC',
      paidAt: utcDate(2026, 4, 14),
      idempotencyKey: 'seed-payment-may-eric',
    },
    {
      id: ids.payments.juneHead,
      cycleId: ids.cycles.june,
      memberId: ids.members.head,
      amountMinorUnits: 10_000n,
      method: ContributionPaymentMethod.MOBILE_MONEY,
      status: ContributionPaymentStatus.VERIFIED,
      reference: 'MTN-JUN-ALINE',
      paidAt: utcDate(2026, 5, 5),
      idempotencyKey: 'seed-payment-june-aline',
    },
    {
      id: ids.payments.juneAdmin,
      cycleId: ids.cycles.june,
      memberId: ids.members.admin,
      amountMinorUnits: 10_000n,
      method: ContributionPaymentMethod.BANK_TRANSFER,
      status: ContributionPaymentStatus.VERIFIED,
      reference: 'BK-JUN-PATRICK',
      paidAt: utcDate(2026, 5, 10),
      idempotencyKey: 'seed-payment-june-patrick',
    },
    {
      id: ids.payments.juneMemberPartial,
      cycleId: ids.cycles.june,
      memberId: ids.members.member,
      amountMinorUnits: 5_000n,
      method: ContributionPaymentMethod.MOBILE_MONEY,
      status: ContributionPaymentStatus.PENDING,
      reference: 'MTN-JUN-CLAUDINE-PARTIAL',
      paidAt: utcDate(2026, 5, 18),
      idempotencyKey: 'seed-payment-june-claudine-partial',
    },
  ];

  for (const payment of payments) {
    const verified = payment.status === ContributionPaymentStatus.VERIFIED;

    await prisma.familyContributionPayment.upsert({
      where: { id: payment.id },
      create: {
        id: payment.id,
        familyId: ids.family,
        planId: ids.contributionPlan,
        cycleId: payment.cycleId,
        memberId: payment.memberId,
        amountMinorUnits: payment.amountMinorUnits,
        method: payment.method,
        status: payment.status,
        reference: payment.reference,
        idempotencyKey: payment.idempotencyKey,
        paidAt: payment.paidAt,
        recordedById: ids.users.admin,
        verifiedById: verified ? ids.users.head : null,
        verifiedAt: verified ? plusDays(payment.paidAt, 1) : null,
      },
      update: {
        cycleId: payment.cycleId,
        memberId: payment.memberId,
        amountMinorUnits: payment.amountMinorUnits,
        method: payment.method,
        status: payment.status,
        reference: payment.reference,
        idempotencyKey: payment.idempotencyKey,
        paidAt: payment.paidAt,
        recordedById: ids.users.admin,
        verifiedById: verified ? ids.users.head : null,
        verifiedAt: verified ? plusDays(payment.paidAt, 1) : null,
        reversedAt: null,
      },
    });
  }

  await prisma.familyAuditEvent.upsert({
    where: { id: 'seed-audit-contribution-plan-created' },
    create: {
      id: 'seed-audit-contribution-plan-created',
      familyId: ids.family,
      actorId: ids.users.head,
      action: FamilyAuditAction.CONTRIBUTION_PLAN_CREATED,
      after: {
        planId: ids.contributionPlan,
        name: 'Monthly welfare contribution',
        amountMinorUnits: '10000',
        assignmentCount: 4,
      },
      createdAt: utcDate(2026, 4, 1),
    },
    update: {},
  });

  await prisma.familyAuditEvent.upsert({
    where: { id: 'seed-audit-contribution-recorded-june' },
    create: {
      id: 'seed-audit-contribution-recorded-june',
      familyId: ids.family,
      actorId: ids.users.admin,
      action: FamilyAuditAction.CONTRIBUTION_RECORDED,
      targetMemberId: ids.members.member,
      after: {
        paymentId: ids.payments.juneMemberPartial,
        amountMinorUnits: '5000',
        method: ContributionPaymentMethod.MOBILE_MONEY,
      },
      createdAt: utcDate(2026, 5, 18),
    },
    update: {},
  });
}

async function upsertProjects() {
  await prisma.familyProject.upsert({
    where: { id: ids.project },
    create: {
      id: ids.project,
      familyId: ids.family,
      name: 'Kigali house renovation',
      category: FamilyProjectCategory.HOUSE,
      description:
        'Repair roof sheets, repaint common rooms, and improve water drainage before the rainy season.',
      targetAmountMinorUnits: 5_000_000n,
      currency: 'RWF',
      startDate: utcDate(2026, 5, 1),
      targetDate: utcDate(2026, 11, 31),
      status: FamilyProjectStatus.ACTIVE,
      ownerMemberId: ids.members.admin,
      contributionStrategy: FamilyProjectContributionStrategy.PLEDGES,
      expectedContributionMinorUnits: 250_000n,
      participantNotes: 'Priority contributors are adult working members.',
      idempotencyKey: 'seed-project-house-renovation',
      createdById: ids.users.head,
    },
    update: {
      name: 'Kigali house renovation',
      category: FamilyProjectCategory.HOUSE,
      description:
        'Repair roof sheets, repaint common rooms, and improve water drainage before the rainy season.',
      targetAmountMinorUnits: 5_000_000n,
      currency: 'RWF',
      startDate: utcDate(2026, 5, 1),
      targetDate: utcDate(2026, 11, 31),
      status: FamilyProjectStatus.ACTIVE,
      ownerMemberId: ids.members.admin,
      contributionStrategy: FamilyProjectContributionStrategy.PLEDGES,
      expectedContributionMinorUnits: 250_000n,
      participantNotes: 'Priority contributors are adult working members.',
      idempotencyKey: 'seed-project-house-renovation',
      createdById: ids.users.head,
      completedAt: null,
      archivedAt: null,
    },
  });

  for (const [memberId, roleNotes] of [
    [ids.members.head, 'Project sponsor and final approver'],
    [ids.members.admin, 'Coordinates contractor updates'],
    [ids.members.member, 'Tracks receipts and photos'],
  ] as const) {
    await prisma.familyProjectParticipant.upsert({
      where: {
        projectId_memberId: {
          projectId: ids.project,
          memberId,
        },
      },
      create: {
        projectId: ids.project,
        memberId,
        roleNotes,
      },
      update: {
        roleNotes,
        removedAt: null,
      },
    });
  }

  const contributions = [
    {
      id: ids.projectContributions.head,
      memberId: ids.members.head,
      amountMinorUnits: 300_000n,
      status: FamilyProjectContributionStatus.VERIFIED,
      reference: 'BK-HOUSE-ALINE',
      paidAt: utcDate(2026, 5, 8),
      idempotencyKey: 'seed-project-contribution-aline',
    },
    {
      id: ids.projectContributions.admin,
      memberId: ids.members.admin,
      amountMinorUnits: 150_000n,
      status: FamilyProjectContributionStatus.VERIFIED,
      reference: 'MTN-HOUSE-PATRICK',
      paidAt: utcDate(2026, 5, 15),
      idempotencyKey: 'seed-project-contribution-patrick',
    },
    {
      id: ids.projectContributions.memberPending,
      memberId: ids.members.member,
      amountMinorUnits: 75_000n,
      status: FamilyProjectContributionStatus.PENDING,
      reference: 'CASH-HOUSE-CLAUDINE',
      paidAt: utcDate(2026, 5, 19),
      idempotencyKey: 'seed-project-contribution-claudine-pending',
    },
  ];

  for (const contribution of contributions) {
    const verified =
      contribution.status === FamilyProjectContributionStatus.VERIFIED;

    await prisma.familyProjectContribution.upsert({
      where: { id: contribution.id },
      create: {
        id: contribution.id,
        familyId: ids.family,
        projectId: ids.project,
        memberId: contribution.memberId,
        amountMinorUnits: contribution.amountMinorUnits,
        currency: 'RWF',
        status: contribution.status,
        reference: contribution.reference,
        idempotencyKey: contribution.idempotencyKey,
        paidAt: contribution.paidAt,
        recordedById: ids.users.admin,
        verifiedById: verified ? ids.users.head : null,
        verifiedAt: verified ? plusDays(contribution.paidAt, 1) : null,
      },
      update: {
        memberId: contribution.memberId,
        amountMinorUnits: contribution.amountMinorUnits,
        currency: 'RWF',
        status: contribution.status,
        reference: contribution.reference,
        idempotencyKey: contribution.idempotencyKey,
        paidAt: contribution.paidAt,
        recordedById: ids.users.admin,
        verifiedById: verified ? ids.users.head : null,
        verifiedAt: verified ? plusDays(contribution.paidAt, 1) : null,
        reversedAt: null,
      },
    });
  }

  await prisma.familyProjectUpdate.upsert({
    where: { id: ids.projectUpdate },
    create: {
      id: ids.projectUpdate,
      familyId: ids.family,
      projectId: ids.project,
      title: 'Materials quote received',
      body: 'Two supplier quotes are saved for roof sheets, paint, and drainage materials. The lower quote is awaiting family approval.',
      createdById: ids.users.admin,
      createdAt: utcDate(2026, 5, 20),
    },
    update: {
      title: 'Materials quote received',
      body: 'Two supplier quotes are saved for roof sheets, paint, and drainage materials. The lower quote is awaiting family approval.',
      createdById: ids.users.admin,
    },
  });

  await prisma.familyAuditEvent.upsert({
    where: { id: 'seed-audit-project-created' },
    create: {
      id: 'seed-audit-project-created',
      familyId: ids.family,
      actorId: ids.users.head,
      action: FamilyAuditAction.PROJECT_CREATED,
      targetMemberId: ids.members.admin,
      after: {
        projectId: ids.project,
        name: 'Kigali house renovation',
        targetAmountMinorUnits: '5000000',
        currency: 'RWF',
      },
      createdAt: utcDate(2026, 5, 1),
    },
    update: {},
  });

  await prisma.familyAuditEvent.upsert({
    where: { id: 'seed-audit-project-update-created' },
    create: {
      id: 'seed-audit-project-update-created',
      familyId: ids.family,
      actorId: ids.users.admin,
      action: FamilyAuditAction.PROJECT_UPDATE_CREATED,
      after: {
        projectId: ids.project,
        updateId: ids.projectUpdate,
        title: 'Materials quote received',
      },
      createdAt: utcDate(2026, 5, 20),
    },
    update: {},
  });
}

async function upsertCategories() {
  const categories = [
    {
      id: ids.categories.food,
      name: 'Food',
      type: TransactionType.EXPENSE,
      description: 'Groceries, market shopping, and family meals.',
      icon: 'Utensils',
      color: 'var(--chart-1)',
      isDefault: true,
      status: CategoryStatus.ACTIVE,
    },
    {
      id: ids.categories.rent,
      name: 'House Rent',
      type: TransactionType.EXPENSE,
      description: 'Rent paid for family housing or rooms.',
      icon: 'Home',
      color: 'var(--chart-2)',
      isDefault: true,
      status: CategoryStatus.ACTIVE,
    },
    {
      id: ids.categories.schoolFees,
      name: 'School Fees',
      type: TransactionType.EXPENSE,
      description: 'Tuition, uniforms, books, and school contribution payments.',
      icon: 'GraduationCap',
      color: 'var(--chart-3)',
      isDefault: true,
      status: CategoryStatus.ACTIVE,
    },
    {
      id: ids.categories.salary,
      name: 'Salary',
      type: TransactionType.INCOME,
      description: 'Employment income received by family members.',
      icon: 'Banknote',
      color: 'var(--chart-3)',
      isDefault: true,
      status: CategoryStatus.ACTIVE,
    },
    {
      id: ids.categories.businessIncome,
      name: 'Business Income',
      type: TransactionType.INCOME,
      description: 'Income from shops, trading, services, and family businesses.',
      icon: 'Briefcase',
      color: 'var(--chart-4)',
      isDefault: true,
      status: CategoryStatus.ACTIVE,
    },
    {
      id: ids.categories.otherExpense,
      name: 'Other',
      type: TransactionType.EXPENSE,
      description: 'Fallback expense category for records that need later cleanup.',
      icon: 'Circle',
      color: 'var(--muted-foreground)',
      isDefault: true,
      status: CategoryStatus.ACTIVE,
    },
  ];

  for (const cat of categories) {
    await prisma.familyTransactionCategory.upsert({
      where: { id: cat.id },
      create: {
        id: cat.id,
        familyId: ids.family,
        name: cat.name,
        type: cat.type,
        description: cat.description,
        icon: cat.icon,
        color: cat.color,
        isDefault: cat.isDefault,
        status: cat.status,
        createdById: ids.users.head,
      },
      update: {
        name: cat.name,
        type: cat.type,
        description: cat.description,
        icon: cat.icon,
        color: cat.color,
        isDefault: cat.isDefault,
        status: cat.status,
      },
    });
  }
}

async function upsertTransactionsAndReceipts() {
  const transactions = [
    {
      id: ids.transactions.salaryJune,
      categoryId: ids.categories.salary,
      amountMinorUnits: 450_000n,
      currency: 'RWF',
      type: TransactionType.INCOME,
      status: TransactionStatus.APPROVED,
      date: utcDate(2026, 5, 28),
      description: 'Aline June Salary',
      paymentMethod: 'BANK_TRANSFER',
      idempotencyKey: 'seed-tx-salary-june',
      createdById: ids.users.head,
      approvedById: ids.users.head,
      approvedAt: utcDate(2026, 5, 28),
      notes: 'Monthly employment salary.',
    },
    {
      id: ids.transactions.rentJune,
      categoryId: ids.categories.rent,
      amountMinorUnits: 120_000n,
      currency: 'RWF',
      type: TransactionType.EXPENSE,
      status: TransactionStatus.APPROVED,
      date: utcDate(2026, 5, 1),
      description: 'House rent payment - June',
      paymentMethod: 'MOBILE_MONEY',
      idempotencyKey: 'seed-tx-rent-june',
      createdById: ids.users.admin,
      approvedById: ids.users.head,
      approvedAt: utcDate(2026, 5, 2),
      notes: 'Rent for family house.',
    },
    {
      id: ids.transactions.foodJune,
      categoryId: ids.categories.food,
      amountMinorUnits: 35_000n,
      currency: 'RWF',
      type: TransactionType.EXPENSE,
      status: TransactionStatus.APPROVED,
      date: utcDate(2026, 5, 10),
      description: 'Weekly grocery shopping at Kimironko market',
      paymentMethod: 'CASH',
      idempotencyKey: 'seed-tx-food-june',
      createdById: ids.users.member,
      approvedById: ids.users.head,
      approvedAt: utcDate(2026, 5, 10),
      notes: 'Vegetables, rice, and cooking oil.',
    },
    {
      id: ids.transactions.schoolFeesJune,
      categoryId: ids.categories.schoolFees,
      amountMinorUnits: 150_000n,
      currency: 'RWF',
      type: TransactionType.EXPENSE,
      status: TransactionStatus.PENDING,
      date: utcDate(2026, 5, 25),
      description: 'School fees deposit for next term',
      paymentMethod: 'BANK_TRANSFER',
      idempotencyKey: 'seed-tx-school-fees-june',
      createdById: ids.users.admin,
      notes: 'Awaiting head verification and approval.',
    },
  ];

  for (const tx of transactions) {
    await prisma.familyTransaction.upsert({
      where: { id: tx.id },
      create: {
        id: tx.id,
        familyId: ids.family,
        categoryId: tx.categoryId,
        amountMinorUnits: tx.amountMinorUnits,
        currency: tx.currency,
        type: tx.type,
        status: tx.status,
        date: tx.date,
        description: tx.description,
        paymentMethod: tx.paymentMethod,
        idempotencyKey: tx.idempotencyKey,
        createdById: tx.createdById,
        approvedById: tx.approvedById,
        approvedAt: tx.approvedAt,
        notes: tx.notes,
      },
      update: {
        categoryId: tx.categoryId,
        amountMinorUnits: tx.amountMinorUnits,
        currency: tx.currency,
        type: tx.type,
        status: tx.status,
        date: tx.date,
        description: tx.description,
        paymentMethod: tx.paymentMethod,
        idempotencyKey: tx.idempotencyKey,
        createdById: tx.createdById,
        approvedById: tx.approvedById,
        approvedAt: tx.approvedAt,
        notes: tx.notes,
        reversedAt: null,
      },
    });
  }

  // Seed a receipt for the Rent transaction
  await prisma.familyReceipt.upsert({
    where: { id: ids.receipts.rentJuneReceipt },
    create: {
      id: ids.receipts.rentJuneReceipt,
      familyId: ids.family,
      transactionId: ids.transactions.rentJune,
      fileName: 'june_rent_receipt.pdf',
      fileType: 'application/pdf',
      fileSizeBytes: 1024 * 128,
      storageKey: 'receipts/seed-june-rent.pdf',
      uploadedById: ids.users.admin,
    },
    update: {
      fileName: 'june_rent_receipt.pdf',
      fileType: 'application/pdf',
      fileSizeBytes: 1024 * 128,
      storageKey: 'receipts/seed-june-rent.pdf',
      uploadedById: ids.users.admin,
    },
  });
}

async function upsertBudgets() {
  const budgets = [
    {
      id: ids.budgets.foodBudgetJune,
      categoryId: ids.categories.food,
      amountMinorUnits: 150_000n,
      currency: 'RWF',
      startDate: utcDate(2026, 5, 1),
      endDate: utcDate(2026, 5, 30),
      createdById: ids.users.head,
    },
    {
      id: ids.budgets.schoolFeesBudgetJune,
      categoryId: ids.categories.schoolFees,
      amountMinorUnits: 300_000n,
      currency: 'RWF',
      startDate: utcDate(2026, 5, 1),
      endDate: utcDate(2026, 5, 30),
      createdById: ids.users.head,
    },
  ];

  for (const b of budgets) {
    await prisma.familyBudget.upsert({
      where: { id: b.id },
      create: {
        id: b.id,
        familyId: ids.family,
        categoryId: b.categoryId,
        amountMinorUnits: b.amountMinorUnits,
        currency: b.currency,
        startDate: b.startDate,
        endDate: b.endDate,
        createdById: b.createdById,
      },
      update: {
        categoryId: b.categoryId,
        amountMinorUnits: b.amountMinorUnits,
        currency: b.currency,
        startDate: b.startDate,
        endDate: b.endDate,
        createdById: b.createdById,
      },
    });
  }
}

async function upsertAuthDetails() {
  const codeHash = await hash('123456', 10);
  const refreshTokenHash = await hash('seed-refresh-token-string', 10);

  // Email verification (e.g. consumed email verification)
  await prisma.emailVerification.upsert({
    where: { id: ids.emailVerifications.head },
    create: {
      id: ids.emailVerifications.head,
      userId: ids.users.head,
      codeHash,
      expiresAt: utcDate(2026, 5, 2),
      consumedAt: utcDate(2026, 5, 1),
      attempts: 1,
    },
    update: {
      userId: ids.users.head,
      codeHash,
      expiresAt: utcDate(2026, 5, 2),
      consumedAt: utcDate(2026, 5, 1),
      attempts: 1,
    },
  });

  // Password reset (e.g. expired or unused password reset code)
  await prisma.passwordReset.upsert({
    where: { id: ids.passwordResets.head },
    create: {
      id: ids.passwordResets.head,
      userId: ids.users.head,
      codeHash,
      expiresAt: utcDate(2026, 5, 1),
      consumedAt: null,
      attempts: 0,
    },
    update: {
      userId: ids.users.head,
      codeHash,
      expiresAt: utcDate(2026, 5, 1),
      consumedAt: null,
      attempts: 0,
    },
  });

  // Active auth session
  await prisma.authSession.upsert({
    where: { id: ids.authSessions.head },
    create: {
      id: ids.authSessions.head,
      userId: ids.users.head,
      refreshTokenHash,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      ipAddress: '197.243.12.34', // Kigali IP address example
      expiresAt: plusDays(new Date(), 30),
      revokedAt: null,
    },
    update: {
      userId: ids.users.head,
      refreshTokenHash,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      ipAddress: '197.243.12.34',
      expiresAt: plusDays(new Date(), 30),
      revokedAt: null,
    },
  });
}

async function main() {
  const seedPasswordHash = await hash(seedPassword, 12);

  await upsertUsers(seedPasswordHash);
  await upsertFamily();
  await upsertContributions();
  await upsertProjects();
  await upsertCategories();
  await upsertTransactionsAndReceipts();
  await upsertBudgets();
  await upsertAuthDetails();

  console.info('Seed complete.');
  console.info('Demo login: aline.mukamana@example.com / RwandaFamily123!');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
