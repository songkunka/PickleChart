import React from 'react';
import { IndicatorSettings } from '../../types/settings';
import { X, Check, Eye, EyeOff } from 'lucide-react';

interface IndicatorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  indicators: IndicatorSettings;
  onToggleIndicator: (key: keyof IndicatorSettings) => void;
  onChangeColor?: (key: keyof IndicatorSettings, color: string) => void;
}

export const IndicatorsModal: React.FC<IndicatorsModalProps> = ({
  isOpen,
  onClose,
  indicators,
  onToggleIndicator,
  onChangeColor,
}) => {
  if (!isOpen) return null;

  const indicatorList: Array<{
    key: keyof IndicatorSettings;
    title: string;
    description: string;
    type: 'overlay' | 'pane';
  }> = [
    { key: 'ema9', title: 'EMA 9 (Fast Trend)', description: 'Exponential Moving Average 9 periods', type: 'overlay' },
    { key: 'ema21', title: 'EMA 21 (Pullback Trend)', description: 'Exponential Moving Average 21 periods', type: 'overlay' },
    { key: 'ema50', title: 'EMA 50 (Intermediate Trend)', description: 'Exponential Moving Average 50 periods', type: 'overlay' },
    { key: 'ema200', title: 'EMA 200 (Major Trend)', description: 'Long term institutional benchmark', type: 'overlay' },
    { key: 'vwap', title: 'VWAP (Volume Weighted Avg Price)', description: 'Session benchmark for institutional liquidity', type: 'overlay' },
    { key: 'bollinger', title: 'Bollinger Bands (20, 2)', description: 'Volatility envelope bands', type: 'overlay' },
    { key: 'volumeProfile', title: 'Visible Range Volume Profile', description: 'Session Point of Control (POC), VAH & VAL levels', type: 'overlay' },
    { key: 'cvd', title: 'CVD (Cumulative Volume Delta)', description: 'Lower sub-pane tracking buyer/seller absorption', type: 'pane' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-[#1e222d] border border-[#2a2e39] rounded-lg shadow-2xl overflow-hidden flex flex-col text-[#d1d4dc] font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-[#2a2e39] flex items-center justify-between bg-[#131722]">
          <div className="flex items-center gap-2">
            <span className="font-serif italic font-bold text-[#2962ff] text-base">fx</span>
            <span className="font-semibold text-sm text-white">Indicators & Metrics</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#787b86] hover:text-white hover:bg-[#2a2e39] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 divide-y divide-[#2a2e39]/60 max-h-[65vh] overflow-y-auto">
          {indicatorList.map((item) => {
            const config = indicators[item.key];
            const isEnabled = config?.enabled ?? false;

            return (
              <div
                key={item.key}
                className="py-2.5 px-2 flex items-center justify-between hover:bg-[#2a2e39]/40 rounded transition-colors"
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onToggleIndicator(item.key)}
                    className={`w-6 h-6 rounded flex items-center justify-center transition-all ${
                      isEnabled
                        ? 'bg-[#2962ff] text-white shadow-sm'
                        : 'border border-[#787b86]/40 text-transparent hover:border-[#d1d4dc]'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium ${isEnabled ? 'text-white font-semibold' : 'text-[#d1d4dc]'}`}>
                        {item.title}
                      </span>
                      <span className="text-[9px] px-1 rounded bg-[#2a2e39] text-[#787b86] uppercase font-mono">
                        {item.type}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#787b86] mt-0.5">
                      {item.description}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {onChangeColor && config && (
                    <input
                      type="color"
                      value={config.color}
                      onChange={(e) => onChangeColor(item.key, e.target.value)}
                      className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                      title="Indicator Color"
                    />
                  )}
                  <button
                    onClick={() => onToggleIndicator(item.key)}
                    className="p-1 text-[#787b86] hover:text-[#d1d4dc]"
                    title={isEnabled ? 'Hide Indicator' : 'Show Indicator'}
                  >
                    {isEnabled ? <Eye className="w-4 h-4 text-[#2962ff]" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="px-4 py-2.5 border-t border-[#2a2e39] bg-[#131722] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-[#2962ff] hover:bg-[#1e53e5] text-white text-xs font-medium transition-colors"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
