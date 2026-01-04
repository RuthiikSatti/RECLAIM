// lib/constants/categories.ts
export const CATEGORIES = [
  'All',
  'Dorm & Decor',
  'Fun & Craft',
  'Books',
  'Clothing & Accessories',
  'Transportation',
  'Tech & Gadgets',
  'Giveaways',
  'Other',
] as const;

export type Category = typeof CATEGORIES[number];

export const CATEGORY_SUBTITLES: Record<Category, string> = {
  All: 'Everything you need, all in one place',
  'Dorm & Decor': 'Make your space feel like home',
  'Fun & Craft': 'Creative items and fun finds from fellow students',
  Books: 'Textbooks, novels, and study materials from students',
  'Clothing & Accessories': 'Upgrade your style for less',
  Transportation: 'Easy, affordable ways to get around campus',
  'Tech & Gadgets': 'Student-verified tech you can trust',
  Giveaways: 'Free items shared by students, for students',
  Other: "Helpful finds that don't fit in one category",
} as const;

export function getCategorySubtitle(category: string): string {
  if ((CATEGORIES as readonly string[]).includes(category)) {
    return CATEGORY_SUBTITLES[category as Category];
  }
  return 'Browse items from your campus community';
}
