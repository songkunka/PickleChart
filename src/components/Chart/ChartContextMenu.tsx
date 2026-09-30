import React, { useEffect, useRef } from 'react';
import { RotateCcw, Minus, Settings } from 'lucide-react';

interface ChartContextMenuProps {
  isOpen: boolean;
  x: number;
  y: number;
  price: number;
  onClose: () => void;
  onResetView: () => void;
  onAddHorizontalLine: (price: number) => void;
  onOpenSettings: () => void;
}

export const ChartContextMenu: React.FC<ChartContextMenuProps> = ({
  isOpen,
  x,
  y,
  price,
  onClose,
  onResetView,
  onAddHorizontalLine,
  onOpenSettings,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Ensure menu doesn't overflow screen edges
  const posX = Math.min(window.innerWidth - 220, Math.max(10, x));
  const posY = Math.min(window.innerHeight - 180, Math.max(10, y));

  return (
    <div
      ref={menuRef}
      className="fixed z-50 w-52 bg-[#1e222d] border border-[#2a2e39] rounded-lg shadow-2xl py-1 text-xs text-[#d1d4dc] font-sans animate-in fade-in zoom-in-95 duration-100 divide-y divide-[#2a2e39]/50"
      style={{ left: posX, top: posY }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="py-1">
        <button
          onClick={() => {
            onResetView();
            onClose();
          }}
          className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-[#2962ff] hover:text-white transition-colors text-left"
        >
          <div className="flex items-center gap-2">
            <RotateCcw className="w-3.5 h-3.5 text-[#787b86]" />
            <span>Reset Chart View</span>
          </div>
          <span className="text-[10px] text-[#787b86] font-mono">Alt+R</span>
        </button>

        <button
          onClick={() => {
            onAddHorizontalLine(price);
            onClose();
          }}
          className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-[#2962ff] hover:text-white transition-colors text-left"
        >
          <div className="flex items-center gap-2">
            <Minus className="w-3.5 h-3.5 text-[#787b86]" />
            <span>Add Horizontal Level</span>
          </div>
          <span className="text-[10px] text-[#787b86] font-mono">Alt+H</span>
        </button>
      </div>

      <div className="py-1">
        <div className="px-3 py-1 text-[10px] text-[#787b86] font-mono">
          Price at cursor: <strong className="text-white">${price.toFixed(2)}</strong>
        </div>

        <button
          onClick={() => {
            onOpenSettings();
            onClose();
          }}
          className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-[#2962ff] hover:text-white transition-colors text-left"
        >
          <Settings className="w-3.5 h-3.5 text-[#787b86]" />
          <span>Chart Properties...</span>
        </button>
      </div>
    </div>
  );
};
