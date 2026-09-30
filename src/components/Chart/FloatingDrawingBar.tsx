import React from 'react';
import { Trash2, X } from 'lucide-react';

interface FloatingDrawingBarProps {
  selectedId: string | null;
  currentColor?: string;
  onChangeColor: (color: string) => void;
  onDelete: () => void;
  onClose: () => void;
}

const PRESET_COLORS = ['#2962ff', '#089981', '#f23645', '#f59e0b', '#a855f7', '#38bdf8', '#ffffff'];

export const FloatingDrawingBar: React.FC<FloatingDrawingBarProps> = ({
  selectedId,
  currentColor = '#f59e0b',
  onChangeColor,
  onDelete,
  onClose,
}) => {
  if (!selectedId) return null;

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-[#1e222d] border border-[#2a2e39] rounded-full shadow-2xl px-3 py-1 flex items-center gap-2 text-xs text-[#d1d4dc] font-sans animate-in fade-in slide-in-from-top-2 duration-150">
      <span className="text-[10px] uppercase font-mono text-[#787b86] pr-1 border-r border-[#2a2e39]">
        Object
      </span>

      {/* Quick Color Swatches */}
      <div className="flex items-center gap-1">
        {PRESET_COLORS.map((c) => (
          <button
            key={c}
            onClick={() => onChangeColor(c)}
            className={`w-3.5 h-3.5 rounded-full transition-transform ${
              currentColor === c ? 'scale-125 ring-2 ring-white/50' : 'hover:scale-110 opacity-70 hover:opacity-100'
            }`}
            style={{ backgroundColor: c }}
            title="Color"
          />
        ))}
      </div>

      <div className="h-3 w-[1px] bg-[#2a2e39] mx-1" />

      {/* Delete Button */}
      <button
        onClick={onDelete}
        className="p-1 rounded text-[#787b86] hover:text-[#f23645] hover:bg-[#2a2e39] transition-colors"
        title="Delete Object (Delete / Backspace)"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>

      {/* Close Selection */}
      <button
        onClick={onClose}
        className="p-1 rounded text-[#787b86] hover:text-white hover:bg-[#2a2e39] transition-colors"
        title="Deselect (Esc)"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
