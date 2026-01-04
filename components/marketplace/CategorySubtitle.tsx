// components/marketplace/CategorySubtitle.tsx
'use client';

import { getCategorySubtitle } from '@/lib/constants/categories';

interface Props {
  category: string;
  className?: string;
}

export default function CategorySubtitle({ category, className = '' }: Props) {
  return (
    <p className={`text-gray-600 text-center ${className}`}>
      {getCategorySubtitle(category)}
    </p>
  );
}
