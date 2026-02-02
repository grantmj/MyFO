import { Category, CATEGORIES, CATEGORY_KEYWORDS } from './constants';

/**
 * Automatically categorize a transaction based on description
 * Uses simple keyword matching - deterministic, not AI
 */
export function categorizeTransaction(description: string): Category {
  const lowerDesc = description.toLowerCase();
  
  // Check each category's keywords
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerDesc.includes(keyword.toLowerCase())) {
        return category as Category;
      }
    }
  }
  
  // Default to misc if no match found
  return CATEGORIES.MISC;
}

/**
 * Normalize transaction amount
 * Handles both positive=spend and negative=spend conventions
 */
export function normalizeAmount(amount: number, convention: 'positive-spend' | 'negative-spend' = 'positive-spend'): number {
  if (convention === 'negative-spend') {
    return Math.abs(amount);
  }
  return amount;
}
