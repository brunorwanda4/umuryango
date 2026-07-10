import type {
  DebtRecord,
  MoneyActivity,
  MoneySummary,
  SavingsGoal,
} from "./types";

export const moneyCurrency = "RWF";

export const moneyActivities: MoneyActivity[] = [
  {
    id: "txn-001",
    title: "Monthly family contribution",
    type: "income",
    category: "Contributions",
    amountMinorUnits: 125000,
    direction: "in",
    date: "2026-07-05",
    account: "Mobile money",
    status: "received",
    description: "July contribution collected from members.",
  },
  {
    id: "txn-002",
    title: "School support",
    type: "expense",
    category: "Education",
    amountMinorUnits: 68000,
    direction: "out",
    date: "2026-07-04",
    account: "Bank account",
    status: "paid",
    description: "Support payment for school supplies.",
  },
  {
    id: "txn-003",
    title: "Small business income",
    type: "income",
    category: "Business",
    amountMinorUnits: 210000,
    direction: "in",
    date: "2026-07-03",
    account: "Cash",
    status: "received",
    description: "Family shop weekly income.",
  },
  {
    id: "txn-004",
    title: "Medical visit",
    type: "expense",
    category: "Health",
    amountMinorUnits: 42000,
    direction: "out",
    date: "2026-07-02",
    account: "Mobile money",
    status: "paid",
    description: "Clinic consultation and medicine.",
  },
  {
    id: "txn-005",
    title: "Emergency fund deposit",
    type: "saving",
    category: "Emergency fund",
    amountMinorUnits: 50000,
    direction: "out",
    date: "2026-07-01",
    account: "Savings wallet",
    status: "active",
    description: "Monthly savings transfer.",
  },
  {
    id: "txn-006",
    title: "Loan repayment to aunt",
    type: "repayment",
    category: "Family loan",
    amountMinorUnits: 35000,
    direction: "out",
    date: "2026-06-29",
    account: "Mobile money",
    status: "paid",
    description: "Part repayment on a borrowed family loan.",
  },
];

export const savingsGoals: SavingsGoal[] = [
  {
    id: "sav-001",
    title: "Emergency fund",
    category: "Family safety",
    savedMinorUnits: 420000,
    targetMinorUnits: 600000,
    dueDate: "2026-12-31",
    status: "active",
  },
  {
    id: "sav-002",
    title: "Education reserve",
    category: "School fees",
    savedMinorUnits: 260000,
    targetMinorUnits: 500000,
    dueDate: "2026-09-15",
    status: "active",
  },
  {
    id: "sav-003",
    title: "Ceremony support",
    category: "Events",
    savedMinorUnits: 180000,
    targetMinorUnits: 180000,
    dueDate: "2026-08-20",
    status: "settled",
  },
];

export const debtRecords: DebtRecord[] = [
  {
    id: "debt-001",
    title: "Aunt's support loan",
    party: "Aunt Claudine",
    kind: "borrowed",
    principalMinorUnits: 300000,
    outstandingMinorUnits: 145000,
    dueDate: "2026-10-30",
    status: "active",
  },
  {
    id: "debt-002",
    title: "Cousin business advance",
    party: "Eric N.",
    kind: "lent",
    principalMinorUnits: 180000,
    outstandingMinorUnits: 60000,
    dueDate: "2026-08-15",
    status: "active",
  },
  {
    id: "debt-003",
    title: "Transport refund",
    party: "Family event team",
    kind: "lent",
    principalMinorUnits: 45000,
    outstandingMinorUnits: 45000,
    dueDate: "2026-07-20",
    status: "overdue",
  },
];

const totalByDirection = (direction: MoneyActivity["direction"]) =>
  moneyActivities
    .filter((activity) => activity.direction === direction)
    .reduce((total, activity) => total + activity.amountMinorUnits, 0);

export const moneySummary: MoneySummary = {
  totalIncomeMinorUnits: totalByDirection("in"),
  totalExpensesMinorUnits: totalByDirection("out"),
  balanceMinorUnits: totalByDirection("in") - totalByDirection("out"),
  savingsMinorUnits: savingsGoals.reduce(
    (total, goal) => total + goal.savedMinorUnits,
    0,
  ),
  debtsMinorUnits: debtRecords.reduce(
    (total, debt) => total + debt.outstandingMinorUnits,
    0,
  ),
};

export const incomeActivities = moneyActivities.filter(
  (activity) => activity.type === "income",
);

export const expenseActivities = moneyActivities.filter(
  (activity) => activity.type === "expense",
);

export const recentActivities = [...moneyActivities].sort((first, second) =>
  second.date.localeCompare(first.date),
);
