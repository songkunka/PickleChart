import React, { useState } from 'react';
import { DrawingToolType } from '../../types/drawing';
import {
  Crosshair,
  TrendingUp,
  Minus,
  Square,
  Percent,
  Type,
  Ruler,
  Undo2,
  Trash2,
  BarChart3,
  Magnet,
  Lock,
  Unlock,
  Eye,
  EyeOff,
} from 'lucide-react';

interface TVDrawingToolbarProps {
  activeTool: DrawingToolType;
  onSelectTool: (tool: DrawingToolType) => void;
  currentColor: string;
  onChangeColor: (color: string) => void;
  onUndo: () => void;
  onClearAll: () => void;
  onDeleteSelected: () => void;
  hasSelection: boolean;
  canUndo: boolean;
  drawingsCount: number;
  isMagnetActive?: boolean;
  onToggleMagnet?: () => void;
  isLocked?: boolean;
  onToggleLock?: () => void;
  isHidden?: boolean;
  onToggleHide?: () => void;
}

const COLOR_PALETTE = [
  '#2962ff', // TradingView Blue
  '#089981', // TradingView Green
  '#f23645', // TradingView Red
  '#f59e0b', // Amber
  '#a855f7', // Purple
  '#38bdf8', // Sky
  '#ffffff', // White
  '#787b86', // Slate Gray
];

export const TVDrawingToolbar: React.FC<TVDrawingToolbarProps> = ({
  activeTool,
  onSelectTool,
  currentColor,
  onChangeColor,
  onUndo,
  onClearAll,
  onDeleteSelected,
  hasSelection,
  canUndo,
  drawingsCount,
  isMagnetActive = false,
  onToggleMagnet,
  isLocked = false,
  onToggleLock,
  isHidden = false,
  onToggleHide,
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);

  const tools: Array<{
    type: DrawingToolType;
    label: string;
    shortcut: string;
    icon: React.ReactNode;
  }> = [
    { type: 'select', label: 'Crosshair / Select', shortcut: 'V', icon: <Crosshair className="w-4 h-4" /> },
    { type: 'trendline', label: 'Trendline', shortcut: 'T', icon: <TrendingUp className="w-4 h-4" /> },
    { type: 'horizontal_ray', label: 'Horizontal Ray / Level', shortcut: 'H', icon: <Minus className="w-4 h-4" /> },
    { type: 'box', label: 'Order Block (Box)', shortcut: 'B', icon: <Square className="w-4 h-4" /> },
    { type: 'fibonacci', label: 'Fibonacci Retracement', shortcut: 'F', icon: <Percent className="w-4 h-4" /> },
    { type: 'fixed_range_vp', label: 'Fixed Range Volume Profile', shortcut: 'P', icon: <BarChart3 className="w-4 h-4 -rotate-90" /> },
    { type: 'measure', label: 'Ruler (Measure)', shortcut: 'M', icon: <Ruler className="w-4 h-4" /> },
    { type: 'text', label: 'Text Note', shortcut: 'N', icon: <Type className="w-4 h-4" /> },
  ];

  return (
    <aside className="w-[42px] bg-[#1e222d] border-r border-[#2a2e39] flex flex-col justify-between py-1.5 items-center select-none shrink-0 z-20">
      {/* Top Section: Main Drawing Tools */}
      <div className="flex flex-col items-center gap-0.5">
        {tools.map((t) => {
          const isActive = activeTool === t.type;
          return (
            <button
              key={t.type}
              onClick={() => onSelectTool(t.type)}
              className={`w-7 h-7 rounded flex items-center justify-center transition-colors relative group cursor-pointer ${
                isActive
                  ? 'bg-[#2962ff]/20 text-[#2962ff]'
                  : 'text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39]'
              }`}
              title={`${t.label} (${t.shortcut})`}
            >
              {t.icon}

              {/* Tooltip */}
              <div className="absolute left-full ml-2 px-2 py-1 bg-[#1e222d] text-[#d1d4dc] text-[11px] font-sans rounded shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 border border-[#2a2e39]">
                <span>{t.label}</span>
                <span className="ml-1.5 text-[10px] text-[#787b86] font-mono">[{t.shortcut}]</span>
              </div>
            </button>
          );
        })}

        <div className="w-5 h-[1px] bg-[#2a2e39] my-1" />

        {/* Color Swatch Button */}
        <div className="relative">
          <button
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="w-7 h-7 rounded flex items-center justify-center hover:bg-[#2a2e39] transition-colors group relative cursor-pointer"
            title="Drawing Color"
          >
            <div
              className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm"
              style={{ backgroundColor: currentColor }}
            />
          </button>

          {showColorPicker && (
            <div
              className="absolute left-full top-0 ml-2 p-2 bg-[#1e222d] border border-[#2a2e39] rounded shadow-2xl z-50 grid grid-cols-4 gap-1.5 w-32"
              onClick={(e) => e.stopPropagation()}
            >
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    onChangeColor(c);
                    setShowColorPicker(false);
                  }}
                  className={`w-5 h-5 rounded-full border transition-transform ${
                    currentColor === c ? 'border-white scale-110 shadow-sm' : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section: Tool Modifiers (Magnet, Lock, Hide, Undo, Trash) */}
      <div className="flex flex-col items-center gap-0.5">
        {/* Magnet Mode */}
        {onToggleMagnet && (
          <button
            onClick={onToggleMagnet}
            className={`w-7 h-7 rounded flex items-center justify-center transition-colors relative group cursor-pointer ${
              isMagnetActive ? 'text-[#2962ff] bg-[#2962ff]/20' : 'text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39]'
            }`}
            title="Magnet Mode (Snap to candle high/low)"
          >
            <Magnet className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Lock All Drawings */}
        {onToggleLock && (
          <button
            onClick={onToggleLock}
            className={`w-7 h-7 rounded flex items-center justify-center transition-colors cursor-pointer ${
              isLocked ? 'text-amber-400 bg-amber-400/20' : 'text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39]'
            }`}
            title={isLocked ? 'Unlock All Drawings' : 'Lock All Drawings'}
          >
            {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
          </button>
        )}

        {/* Hide All Drawings */}
        {onToggleHide && (
          <button
            onClick={onToggleHide}
            className={`w-7 h-7 rounded flex items-center justify-center transition-colors cursor-pointer ${
              isHidden ? 'text-[#f23645] bg-[#f23645]/20' : 'text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39]'
            }`}
            title={isHidden ? 'Show All Drawings' : 'Hide All Drawings'}
          >
            {isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        )}

        {/* Undo Button */}
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${
            canUndo ? 'text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39] cursor-pointer' : 'text-[#787b86]/30 cursor-not-allowed'
          }`}
          title="Undo Drawing (Ctrl+Z)"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>

        {/* Delete Selected Object Button */}
        {hasSelection && (
          <button
            onClick={onDeleteSelected}
            className="w-7 h-7 rounded flex items-center justify-center text-[#f23645] hover:bg-[#f23645]/20 transition-colors cursor-pointer"
            title="Delete Selected Drawing (Del / Backspace)"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Clear All Drawings (only if drawings exist) */}
        {drawingsCount > 0 && (
          <button
            onClick={() => {
              if (window.confirm('Delete all drawn objects on the chart?')) {
                onClearAll();
              }
            }}
            className="w-7 h-7 rounded flex items-center justify-center text-[#787b86] hover:text-[#f23645] hover:bg-[#2a2e39] transition-colors cursor-pointer"
            title={`Clear All (${drawingsCount} items)`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </aside>
  );
};
