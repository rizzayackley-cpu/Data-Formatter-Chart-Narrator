import React from 'react';
import { Button } from '../../components/ui/button';
import { cn } from '../../components/ui/utils';

export function Segmented<T extends string>(props: {
  value: T;
  options: { value: T; label: string; icon?: React.ReactNode }[];
  onChange: (next: T) => void;
}) {
  return (
    <div className="inline-flex items-center rounded-xl border border-gray-200 bg-gray-50 p-1">
      {props.options.map(opt => {
        const selected = opt.value === props.value;
        return (
          <Button
            key={opt.value}
            type="button"
            variant="ghost"
            aria-pressed={selected}
            onClick={() => props.onChange(opt.value)}
            className={cn(
              'h-9 gap-2 rounded-lg px-3 text-sm',
              selected ? 'bg-white shadow-sm border border-gray-200' : 'border border-transparent'
            )}
          >
            {opt.icon}
            {opt.label}
          </Button>
        );
      })}
    </div>
  );
}
