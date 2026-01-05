// Transaction type aware categories
export const TRANSACTION_CATEGORIES = {
  expense: [
    'Bills',
    'Car',
    'Food',
    'Gifts',
    'Government',
    'Grocery',
    'Health',
    'Household',
    'Leisure',
    'Lifestyle',
    'Others',
    'Pranav',
    'Purchases',
    'Rent',
    'Transport'
  ],
  income: [
    'Business',
    'Car Park',
    'Carpooling',
    'Cashback',
    'Freelancing',
    'Gifts',
    'Interest',
    'Others',
    'Salary',
    'Tax',
    'Trading'
  ],
  savings: [
    'Investment',
    'Other'
  ]
}

export const ALL_CATEGORIES = [
  'All Categories',
  ...new Set([
    ...TRANSACTION_CATEGORIES.expense,
    ...TRANSACTION_CATEGORIES.income,
    ...TRANSACTION_CATEGORIES.savings
  ])
]

export const FORM_PLACEHOLDERS = {
  expense: {
    placeholder: 'e.g., Groceries, Gas, Movie tickets...',
    label: 'What did you spend on?'
  },
  income: {
    placeholder: 'e.g., Salary, Freelance project, Bonus...',
    label: 'Source of income?'
  },
  savings: {
    placeholder: 'e.g., Monthly savings goal, Emergency fund...',
    label: 'What are you saving for?'
  }
}

export const TRANSACTION_TYPES = [
  { value: 'expense', label: 'Expenses', color: 'red' },
  { value: 'income', label: 'Income', color: 'green' },
  { value: 'savings', label: 'Savings', color: 'blue' }
]
