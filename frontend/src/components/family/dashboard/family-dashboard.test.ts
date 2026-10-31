import assert from "node:assert/strict";
import test from "node:test";
import type { LoanRecord } from "@/components/family/money/loans/types-and-schemas";
import type { MoneyOverview } from "@/components/family/money/types";
import * as dashboardDataModule from "./dashboard-data";
import {
  buildAttentionItems,
  buildFamilyActivityEntries,
  getFamilyQuickActions,
  loadFamilyDashboardData,
  resolveCurrentFamilyMember,
  summarizeFamilyLoans,
} from "./dashboard-data";
import type {
  ContributionsOverview,
  FamilyAuditEvent,
  FamilyDetail,
  RejectedTransactionRow,
} from "./types";

function makeFamily(overrides: Partial<FamilyDetail> = {}): FamilyDetail {
  return {
    id: "fam-rw-1",
    name: "Mutesi Family",
    slug: "mutesi-family",
    country: "RW",
    defaultCurrency: "RWF",
    contributionCadence: "monthly",
    type: "NUCLEAR",
    description: "Shared family administration workspace.",
    createdAt: "2026-01-10T08:00:00.000Z",
    authority: "ADMIN",
    capabilities: ["RECORD_INCOME", "RECORD_EXPENSE", "VIEW_REPORTS"],
    memberCount: 3,
    members: [
      {
        id: "mem-1",
        userId: "user-admin-first",
        fullName: "First Admin",
        avatarUrl: null,
        authority: "ADMIN",
        kinshipLabel: "BROTHER",
        kinshipCustom: null,
        capabilities: ["RECORD_INCOME", "RECORD_EXPENSE"],
        joinedAt: "2026-01-11T08:00:00.000Z",
      },
      {
        id: "mem-2",
        userId: "user-admin-second",
        fullName: "Aline Uwimana",
        avatarUrl: null,
        authority: "ADMIN",
        kinshipLabel: "SISTER",
        kinshipCustom: null,
        capabilities: ["RECORD_INCOME", "RECORD_EXPENSE", "VIEW_REPORTS"],
        joinedAt: "2026-02-15T08:00:00.000Z",
      },
      {
        id: "mem-3",
        userId: "user-member-1",
        fullName: "Eric Nshimiyimana",
        avatarUrl: null,
        authority: "MEMBER",
        kinshipLabel: "COUSIN",
        kinshipCustom: null,
        capabilities: [],
        joinedAt: "2026-03-01T08:00:00.000Z",
      },
    ],
    ...overrides,
  };
}

function makeMoneyOverview(
  overrides: Partial<MoneyOverview> = {},
): MoneyOverview {
  return {
    currency: "RWF",
    period: { label: "This month" },
    sourceRecordCount: 2,
    totals: {
      cashBalanceMinorUnits: "350000",
      incomeMinorUnits: "500000",
      expenseMinorUnits: "150000",
      contributionsPaidMinorUnits: "0",
      savingsMinorUnits: null,
      debtOutstandingMinorUnits: null,
      pendingApprovalCount: 1,
      overdueCount: 1,
    },
    cashFlow: [],
    allocation: [],
    budgets: [],
    approvals: [
      {
        id: "tx-pending-1",
        type: "transaction",
        title: "Clinic bill",
        submittedBy: "Eric Nshimiyimana",
        submittedAt: "2026-07-10T09:00:00.000Z",
        amountMinorUnits: "45000",
        status: "pending",
      },
      {
        id: "tx-pending-own",
        type: "transaction",
        title: "Transport reimbursement",
        submittedBy: "Aline Uwimana",
        submittedAt: "2026-07-11T09:00:00.000Z",
        amountMinorUnits: "15000",
        status: "pending",
      },
    ],
    records: [
      {
        id: "tx-1",
        type: "income",
        title: "Monthly contribution deposit",
        category: "Family Contribution",
        status: "approved",
        createdBy: "Aline Uwimana",
        date: "2026-07-05T10:00:00.000Z",
        amountMinorUnits: "500000",
      },
      {
        id: "tx-overdue-1",
        type: "expense",
        title: "School bus installment",
        category: "School Fees",
        status: "overdue",
        createdBy: "First Admin",
        date: "2026-07-02T10:00:00.000Z",
        amountMinorUnits: "150000",
      },
    ],
    ...overrides,
  };
}

test("DEMO/MOCK data removal: MOCK_MEMBERS and enrichWithDemoData do not exist", () => {
  assert.equal("MOCK_MEMBERS" in dashboardDataModule, false);
  assert.equal("enrichWithDemoData" in dashboardDataModule, false);
});

test("resolveCurrentFamilyMember identifies the authenticated user by userId or currentMember, never by matching authority", () => {
  const family = makeFamily();

  const resolvedById = resolveCurrentFamilyMember(family, "user-admin-second");
  assert.equal(resolvedById.currentMember?.id, "mem-2");
  assert.equal(resolvedById.currentMember?.fullName, "Aline Uwimana");
  assert.equal(resolvedById.firstName, "Aline");

  const familyWithCurrentMember = makeFamily({
    currentMember: family.members[1],
  });
  const resolvedByField = resolveCurrentFamilyMember(familyWithCurrentMember);
  assert.equal(resolvedByField.currentMember?.id, "mem-2");
  assert.equal(resolvedByField.firstName, "Aline");

  const unresolved = resolveCurrentFamilyMember(family, null, "Fallback User");
  assert.equal(unresolved.currentMember, null);
  assert.equal(unresolved.firstName, "Fallback");
});

test("getFamilyQuickActions filters strictly by capability and never includes non-existent routes", () => {
  const limitedFamily = makeFamily({
    authority: "MEMBER",
    capabilities: ["RECORD_EXPENSE", "VIEW_REPORTS"],
  });
  const limitedActions = getFamilyQuickActions(limitedFamily);
  assert.deepEqual(
    limitedActions.map((item) => item.id),
    ["add-expense", "open-reports"],
  );
  assert.deepEqual(
    limitedActions.map((item) => item.href),
    ["/family/mutesi-family/money/expenses", "/family/mutesi-family/reports"],
  );

  const headFamily = makeFamily({
    authority: "HEAD",
    capabilities: [],
  });
  const headActions = getFamilyQuickActions(headFamily);
  assert.deepEqual(
    headActions.map((item) => item.id),
    [
      "add-income",
      "add-expense",
      "add-loan",
      "create-project",
      "invite-member",
      "review-approvals",
      "open-reports",
    ],
  );
  assert.equal(
    headActions.some((item) => item.href.includes("/contributions")),
    false,
  );

  const readOnlyMember = makeFamily({
    authority: "MEMBER",
    capabilities: [],
  });
  assert.deepEqual(getFamilyQuickActions(readOnlyMember), []);
});

test("summarizeFamilyLoans performs bigint-safe aggregation without floating point", () => {
  const now = new Date("2026-07-10T12:00:00.000Z");
  const loans: LoanRecord[] = [
    {
      id: "loan-1",
      familyId: "fam-rw-1",
      title: "Land purchase loan",
      type: "MONEY_BORROWED",
      status: "OVERDUE",
      approvalStatus: "APPROVED",
      currency: "RWF",
      originalAmountMinorUnits: "9007199254740993",
      paidAmountMinorUnits: "1000000000000000",
      remainingBalanceMinorUnits: "8007199254740993",
      interestRateBasisPoints: null,
      repaymentFrequency: "MONTHLY",
      paymentMethod: "BANK_TRANSFER",
      startDate: "2026-01-01",
      dueDate: "2026-07-01",
      notes: null,
      borrower: "Mutesi Family",
      lender: "SACCO Nyarugenge",
      category: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "loan-2",
      familyId: "fam-rw-1",
      title: "Emergency cousin support",
      type: "MONEY_LENT",
      status: "ACTIVE",
      approvalStatus: "APPROVED",
      currency: "RWF",
      originalAmountMinorUnits: "250000",
      paidAmountMinorUnits: "50000",
      remainingBalanceMinorUnits: "200000",
      interestRateBasisPoints: null,
      repaymentFrequency: "ONE_TIME",
      paymentMethod: "MOBILE_MONEY",
      startDate: "2026-06-20",
      dueDate: "2026-07-14",
      notes: null,
      borrower: "Jean Bosco",
      lender: "Mutesi Family",
      category: null,
      createdAt: "2026-06-20T00:00:00.000Z",
      updatedAt: "2026-06-20T00:00:00.000Z",
    },
  ];

  const summary = summarizeFamilyLoans(loans, now);
  assert.equal(summary.borrowedMinorUnits, 9007199254740993n);
  assert.equal(summary.lentMinorUnits, 250000n);
  assert.equal(summary.remainingMinorUnits, 8007199254940993n);
  assert.equal(summary.overdueCount, 1);
  assert.equal(summary.dueSoonCount, 1);
  assert.equal(summary.urgentLoans.length, 2);
  assert.equal(summary.urgentLoans[0]?.id, "loan-1");
});

test("buildAttentionItems scopes pending/rejected records by APPROVE_EXPENSE capability vs current member", () => {
  const family = makeFamily({
    authority: "ADMIN",
    capabilities: ["RECORD_EXPENSE"],
  });
  const currentMember = family.members[1] ?? null; // Aline Uwimana
  const money = makeMoneyOverview();
  const rejectedTransactions: RejectedTransactionRow[] = [
    {
      id: "tx-rejected-other",
      type: "EXPENSE",
      status: "REJECTED",
      description: "Unapproved repair",
      amountMinorUnits: "80000",
      currency: "RWF",
      date: "2026-07-08T00:00:00.000Z",
      category: { name: "Housing" },
      createdById: "user-admin-first",
      createdBy: { id: "user-admin-first", fullName: "First Admin" },
    },
    {
      id: "tx-rejected-own",
      type: "EXPENSE",
      status: "REJECTED",
      description: "Aline internet receipt",
      amountMinorUnits: "30000",
      currency: "RWF",
      date: "2026-07-09T00:00:00.000Z",
      category: { name: "Utilities" },
      createdById: "user-admin-second",
      createdBy: { id: "user-admin-second", fullName: "Aline Uwimana" },
    },
  ];

  const memberItems = buildAttentionItems({
    family,
    currentMember,
    money,
    contributions: null,
    rejectedTransactions,
  });
  assert.deepEqual(
    memberItems.map((item) => item.title),
    ["Transport reimbursement", "Aline internet receipt"],
  );

  const approverFamily = makeFamily({
    authority: "HEAD",
    capabilities: ["APPROVE_EXPENSE"],
  });
  const approverItems = buildAttentionItems({
    family: approverFamily,
    currentMember,
    money,
    contributions: null,
    rejectedTransactions,
  });
  assert.equal(approverItems.length, 5);
  assert.equal(
    approverItems.every((item) =>
      item.href?.startsWith("/family/mutesi-family/money"),
    ),
    true,
  );
});

test("loadFamilyDashboardData isolates family tenant calls, never calls /mine, and handles partial failures with warnings", async () => {
  const requestedPaths: string[] = [];
  const family = makeFamily({
    authority: "HEAD",
    capabilities: ["MANAGE_MEMBERS"],
  });

  const mockContributions: ContributionsOverview = {
    currency: "RWF",
    period: { label: "This month" },
    sourceRecordCount: 0,
    totals: {
      expectedMinorUnits: "0",
      collectedMinorUnits: "0",
      outstandingMinorUnits: "0",
      overdueMinorUnits: "0",
      collectionRatePercent: 0,
      contributorsPaid: 0,
      contributorsExpected: 0,
      activePlanCount: 0,
      pendingVerificationCount: 0,
      overdueContributorCount: 0,
    },
    plans: [],
    cycles: [],
    members: [],
    payments: [],
  };

  const result = await loadFamilyDashboardData(
    "mutesi-family",
    async <T>(path: string): Promise<T> => {
      requestedPaths.push(path);
      if (path === "/families/mutesi-family") return family as T;
      if (path === "/auth/me") {
        return {
          user: {
            id: "user-admin-second",
            fullName: "Aline Uwimana",
            email: "aline@example.com",
          },
        } as T;
      }
      if (path === "/families/fam-rw-1/money/overview?period=month") {
        return makeMoneyOverview() as T;
      }
      if (path === "/families/fam-rw-1/money/transactions?status=REJECTED") {
        return [] as T;
      }
      if (path === "/families/fam-rw-1/contributions/overview?period=month") {
        return mockContributions as T;
      }
      if (path === "/families/fam-rw-1/projects/overview?status=active") {
        throw new Error("Projects service unavailable");
      }
      if (path === "/families/fam-rw-1/money/loans?limit=100") {
        return { items: [], total: 0, page: 1, limit: 100 } as T;
      }
      if (path === "/families/mutesi-family/audit?limit=10") {
        return [
          {
            id: "audit-1",
            action: "FAMILY_SETTINGS_UPDATED",
            actorId: "user-admin-second",
            targetMemberId: null,
            createdAt: "2026-07-12T10:00:00.000Z",
          },
        ] as T;
      }
      throw new Error(`Unexpected path: ${path}`);
    },
  );

  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.equal(
    requestedPaths.some(
      (path) =>
        path.includes("/mine") ||
        path.includes("/personal-plans") ||
        path.includes("/families/personal"),
    ),
    false,
  );

  assert.equal(
    requestedPaths.includes("/families/fam-rw-1/money/overview?period=month"),
    true,
  );
  assert.equal(
    requestedPaths.includes(
      "/families/fam-rw-1/contributions/overview?period=month",
    ),
    true,
  );

  assert.equal(result.data.projects, null);
  assert.notEqual(result.data.contributions, null);
  assert.equal(result.data.contributions?.totals?.activePlanCount, 0);
  assert.equal(result.data.warnings.length, 1);

  const activity = buildFamilyActivityEntries({
    family: result.data.family,
    money: result.data.money,
    contributions: result.data.contributions,
    projects: result.data.projects,
    auditEvents: result.data.auditEvents as FamilyAuditEvent[],
  });
  assert.equal(activity.length <= 5, true);
  assert.equal(activity[0]?.id, "audit-audit-1");
});
