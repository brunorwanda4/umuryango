import { TransactionType } from '@prisma/client';

export type DefaultMoneyCategory = {
  name: string;
  type: TransactionType;
  description: string;
};

export const DEFAULT_MONEY_CATEGORIES: DefaultMoneyCategory[] = [
  {
    name: 'Food',
    type: TransactionType.EXPENSE,
    description: 'Groceries, market shopping, and family meals.',
  },
  {
    name: 'House Rent',
    type: TransactionType.EXPENSE,
    description: 'Rent paid for family housing or rooms.',
  },
  {
    name: 'School Fees',
    type: TransactionType.EXPENSE,
    description: 'Tuition, uniforms, books, and school contribution payments.',
  },
  {
    name: 'Transport',
    type: TransactionType.EXPENSE,
    description: 'Bus fares, moto rides, taxi trips, and family travel.',
  },
  {
    name: 'Fuel',
    type: TransactionType.EXPENSE,
    description: 'Vehicle fuel used for family errands, visits, and projects.',
  },
  {
    name: 'Healthcare',
    type: TransactionType.EXPENSE,
    description: 'Medication, clinic visits, insurance gaps, and emergency care.',
  },
  {
    name: 'Utilities',
    type: TransactionType.EXPENSE,
    description: 'Water, electricity, cooking gas, and shared home services.',
  },
  {
    name: 'Internet',
    type: TransactionType.EXPENSE,
    description: 'Data bundles, home internet, and communication subscriptions.',
  },
  {
    name: 'Clothing',
    type: TransactionType.EXPENSE,
    description: 'Clothes and shoes bought for family members.',
  },
  {
    name: 'Home Maintenance',
    type: TransactionType.EXPENSE,
    description: 'Repairs, paint, construction supplies, and household fixes.',
  },
  {
    name: 'Entertainment',
    type: TransactionType.EXPENSE,
    description: 'Celebrations, family outings, and non-essential activities.',
  },
  {
    name: 'Farming',
    type: TransactionType.EXPENSE,
    description: 'Seeds, fertilizer, tools, livestock care, and harvest support.',
  },
  {
    name: 'Business Expenses',
    type: TransactionType.EXPENSE,
    description: 'Stock purchases, transport, permits, and operating costs.',
  },
  {
    name: 'Taxes',
    type: TransactionType.EXPENSE,
    description: 'Taxes, local dues, and official fees.',
  },
  {
    name: 'Insurance',
    type: TransactionType.EXPENSE,
    description: 'Health, vehicle, property, and family protection premiums.',
  },
  {
    name: 'Loan Repayment',
    type: TransactionType.EXPENSE,
    description: 'Loan principal and interest repayments made by the family.',
  },
  {
    name: 'Emergency',
    type: TransactionType.EXPENSE,
    description: 'Urgent support and unplanned family needs.',
  },
  {
    name: 'Other',
    type: TransactionType.EXPENSE,
    description: 'Fallback expense category for records that need later cleanup.',
  },
  {
    name: 'Salary',
    type: TransactionType.INCOME,
    description: 'Employment income received by family members.',
  },
  {
    name: 'Business Income',
    type: TransactionType.INCOME,
    description: 'Income from shops, trading, services, and family businesses.',
  },
  {
    name: 'Farming Income',
    type: TransactionType.INCOME,
    description: 'Harvest sales, livestock income, and agricultural support.',
  },
  {
    name: 'Rental Income',
    type: TransactionType.INCOME,
    description: 'Rent collected from family property or rooms.',
  },
  {
    name: 'Freelance',
    type: TransactionType.INCOME,
    description: 'Short-term work, consulting, and independent service payments.',
  },
  {
    name: 'Investment',
    type: TransactionType.INCOME,
    description: 'Interest, dividends, and investment returns.',
  },
  {
    name: 'Family Contribution',
    type: TransactionType.INCOME,
    description: 'Member contributions transferred into family money records.',
  },
  {
    name: 'Donations',
    type: TransactionType.INCOME,
    description: 'Support received from relatives, friends, or community groups.',
  },
  {
    name: 'Gifts',
    type: TransactionType.INCOME,
    description: 'Personal gifts received and recorded for family transparency.',
  },
  {
    name: 'Pension',
    type: TransactionType.INCOME,
    description: 'Pension or retirement support income.',
  },
  {
    name: 'Other',
    type: TransactionType.INCOME,
    description: 'Fallback income category for records that need later cleanup.',
  },
];
