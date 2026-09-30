import React, { useState, useEffect } from 'react';
import { MarketSymbol } from '../../types/market';
import { Clock, ShieldCheck } from 'lucide-react';

interface TVStatusBarProps {
  symbol: MarketSymbol;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
}

export const TVStatusBar: React.FC<TVStatusBarProps> = ({ symbol, connectionStatus }) => {
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="h-6 bg-[#131722] border-t border-[#2a2e39] px-3 flex items-center justify-between text-[11px] text-[#787b86] font-mono select-none shrink-0 z-30">
      {/* Left: Feed Status & Market Info */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <div
            className={`w-1.5 h-1.5 rounded-full ${
              connectionStatus === 'connected'
                ? 'bg-[#089981]'
                : connectionStatus === 'connecting'
                ? 'bg-amber-400 animate-pulse'
                : 'bg-[#f23645]'
            }`}
          />
          <span className="text-[#d1d4dc] font-sans font-medium">{symbol} · Binance Live</span>
          <span className="text-[#787b86]">({connectionStatus})</span>
        </div>

        <div className="h-3 w-[1px] bg-[#2a2e39]" />

        <div className="flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-[#089981]" />
          <span>L2 Orderbook 20-depth</span>
        </div>
      </div>

      {/* Right: Local Clock & Timezone */}
      <div className="flex items-center gap-2">
        <Clock className="w-3 h-3 text-[#787b86]" />
        <span className="text-[#d1d4dc] font-bold">{timeStr}</span>
        <span className="text-[#787b86] text-[10px]">(UTC+7 Bangkok)</span>
      </div>
    </footer>
  );
};
