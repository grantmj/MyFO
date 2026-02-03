// Category definitions for MyFo
export const CATEGORIES = {
  RENT: 'rent',
  UTILITIES: 'utilities',
  GROCERIES: 'groceries',
  DINING: 'dining',
  TRANSPORTATION: 'transportation',
  BOOKS_SUPPLIES: 'books_supplies',
  HEALTH: 'health',
  SUBSCRIPTIONS: 'subscriptions',
  ENTERTAINMENT: 'entertainment',
  TRAVEL: 'travel',
  MISC: 'misc',
  INCOME: 'income',
} as const;

export type Category = typeof CATEGORIES[keyof typeof CATEGORIES];

export const CATEGORY_LABELS: Record<Category, string> = {
  rent: 'Rent',
  utilities: 'Utilities',
  groceries: 'Groceries',
  dining: 'Dining Out',
  transportation: 'Transportation',
  books_supplies: 'Books & Supplies',
  health: 'Health',
  subscriptions: 'Subscriptions',
  entertainment: 'Entertainment',
  travel: 'Travel',
  misc: 'Miscellaneous',
  income: 'Income',
};

// Keywords for auto-categorization
export const CATEGORY_KEYWORDS: Record<Category, string[]> = {
  rent: ['rent', 'apartment', 'lease', 'housing'],
  utilities: ['electric', 'water', 'gas', 'internet', 'wifi', 'phone', 'verizon', 'att', 'tmobile'],
  groceries: ['grocery', 'supermarket', 'whole foods', 'trader joe', 'safeway', 'kroger', 'walmart', 'target'],
  dining: ['restaurant', 'cafe', 'coffee', 'starbucks', 'chipotle', 'mcdonalds', 'pizza', 'burger', 'food delivery', 'doordash', 'ubereats', 'grubhub'],
  transportation: ['gas', 'fuel', 'uber', 'lyft', 'transit', 'parking', 'bus', 'train', 'metro'],
  books_supplies: ['book', 'amazon', 'textbook', 'supplies', 'office', 'staples'],
  health: ['pharmacy', 'cvs', 'walgreens', 'doctor', 'medical', 'health', 'clinic'],
  subscriptions: ['netflix', 'spotify', 'apple', 'subscription', 'membership', 'prime'],
  entertainment: ['movie', 'theater', 'concert', 'ticket', 'game', 'entertainment'],
  travel: ['airline', 'flight', 'hotel', 'airbnb', 'travel'],
  misc: [],
  income: ['payroll', 'deposit', 'transfer', 'income', 'payment received'],
};
