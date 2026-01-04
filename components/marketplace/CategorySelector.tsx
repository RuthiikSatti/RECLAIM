// components/marketplace/CategorySelector.tsx
'use client';

import { CATEGORIES, type Category } from '@/lib/constants/categories';

interface Props {
  selected: string;
  onChange: (category: string) => void;
}

export default function CategorySelector({ selected, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {CATEGORIES.map((c) => (
        <button
          key={c}
          aria-pressed={selected === c}
          onClick={() => onChange(c)}
          className={`px-4 py-2 rounded-full border transition-colors ${
            selected === c
              ? 'bg-black text-white border-black'
              : 'bg-white text-black border-gray-300 hover:border-black'
          }`}
        >
          {c}
        </button>
      ))}
    </div>
  );
}
