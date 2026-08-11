import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

interface TooltipProps {
  text: string;
}

export function Tooltip({ text }: TooltipProps) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen((v) => !v)}
        className="text-zinc-400 hover:text-cyan-400 transition-colors"
        aria-label="안내"
      >
        <HelpCircle size={15} />
      </button>
      {open && (
        <span className="absolute left-1/2 top-7 z-30 w-56 -translate-x-1/2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs leading-relaxed text-zinc-300 shadow-xl">
          {text}
        </span>
      )}
    </span>
  );
}

interface CollapsibleProps {
  title: string;
  icon?: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export function Collapsible({ title, icon, open, onToggle, children }: CollapsibleProps) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <span className="flex items-center gap-2 font-medium text-zinc-100">
          {icon}
          {title}
        </span>
        <ChevronDown
          size={18}
          className={`text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}
