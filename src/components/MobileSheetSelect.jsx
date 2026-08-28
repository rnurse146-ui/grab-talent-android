import React, { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle,
} from '@/components/ui/drawer';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Renders a large selector as:
 *  - the standard shadcn Select on desktop
 *  - a native-style bottom-sheet Drawer (Vaul) on mobile
 * `options`: [{ value, label, icon? }]
 */
export default function MobileSheetSelect({
  value,
  onChange,
  options,
  placeholder,
  triggerClassName,
  contentClassName,
  title,
}) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  const selected = options.find((o) => o.value === value);
  const display = selected
    ? (selected.icon ? `${selected.icon} ${selected.label}` : selected.label)
    : (placeholder || 'Select...');

  if (!isMobile) {
    return (
      <Select value={value ?? undefined} onValueChange={onChange}>
        <SelectTrigger className={triggerClassName}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className={cn('bg-zinc-900 border-zinc-800', contentClassName)}>
          {options.map((opt) => (
            <SelectItem key={String(opt.value)} value={String(opt.value)}>
              {opt.icon ? (
                <span className="flex items-center gap-2">
                  <span>{opt.icon}</span>
                  <span>{opt.label}</span>
                </span>
              ) : opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'flex items-center justify-between w-full rounded-md border px-3 py-2 text-sm bg-zinc-900 border-zinc-800 text-white',
          triggerClassName
        )}
      >
        <span className={cn(!selected && 'text-zinc-500')}>{display}</span>
        <ChevronDown className="w-4 h-4 opacity-50 shrink-0" />
      </button>
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="bg-zinc-900 border-zinc-700 text-white max-h-[75vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle className="text-white">{title || placeholder || 'Select'}</DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto px-4 pb-8 space-y-1 max-h-[60vh]">
            {options.map((opt) => {
              const active = opt.value === value;
              return (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm transition-colors',
                    active ? 'bg-white text-black' : 'text-zinc-200 hover:bg-zinc-800'
                  )}
                >
                  {opt.icon && <span className="text-lg">{opt.icon}</span>}
                  <span className="flex-1">{opt.label}</span>
                  {active && <Check className="w-4 h-4" />}
                </button>
              );
            })}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}