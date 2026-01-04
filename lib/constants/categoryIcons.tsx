// lib/constants/categoryIcons.tsx
import React from 'react';
import {
  HouseLine,
  CoatHanger,
  MagicWand,
  Bicycle,
  Gift,
  Laptop,
  MagnifyingGlass,
  Book,
} from 'phosphor-react';
import type { IconProps } from 'phosphor-react';

// Single source of truth: mapping category -> render function
export const CATEGORY_ICONS: Record<string, (props?: IconProps) => React.ReactElement> = {
  'All': (p = {}) => <MagnifyingGlass {...p} />,
  'Dorm & Decor': (p = {}) => <HouseLine {...p} />,
  'Clothing & Accessories': (p = {}) => <CoatHanger {...p} />,
  'Fun & Craft': (p = {}) => <MagicWand {...p} />,
  'Transportation': (p = {}) => <Bicycle {...p} />,
  'Giveaways': (p = {}) => <Gift {...p} />,
  'Tech & Gadgets': (p = {}) => <Laptop {...p} />,
  'Books': (p = {}) => <Book {...p} />,
  'Other': (p = {}) => <MagnifyingGlass {...p} />,
};
