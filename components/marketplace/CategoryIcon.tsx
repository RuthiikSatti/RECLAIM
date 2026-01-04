// components/marketplace/CategoryIcon.tsx
'use client';

import { getCategoryIcon } from '@/lib/constants/categoryIcons';

interface CategoryIconProps {
  category: string;
  size?: number;
  className?: string;
}

export default function CategoryIcon({
  category,
  size = 24,
  className = '',
}: CategoryIconProps) {
  const Icon = getCategoryIcon(category);

  return (
    <Icon
      size={size}
      weight="regular"
      color="currentColor"
      className={className}
    />
  );
}
