// lib/constants/categoryIcons.ts
import {
  HouseLine,
  CoatHanger,
  MagicWand,
  Bicycle,
  Gift,
  Devices,
  MagnifyingGlass,
  Book,
} from 'phosphor-react';
import type { Icon } from 'phosphor-react';

// Map category names to their corresponding Phosphor icons
export const CATEGORY_ICONS: Record<string, Icon> = {
  'All': MagnifyingGlass,
  'Dorm & Decor': HouseLine,
  'Clothing & Accessories': CoatHanger,
  'Fun & Craft': MagicWand,
  'Transportation': Bicycle,
  'Giveaways': Gift,
  'Tech & Gadgets': Devices,
  'Books': Book,
  'Other': MagnifyingGlass,
} as const;

// Get icon for a category with safe fallback
export function getCategoryIcon(category: string): Icon {
  return CATEGORY_ICONS[category] || MagnifyingGlass;
}
