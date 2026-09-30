import React from 'react';
import { BigTrade } from '../../types/market';
import { ArrowUpRight, ArrowDownRight, ShieldAlert } from 'lucide-react';

interface BigTradeTapeProps {
  trades: BigTrade[];
  symbol?: string;
  onSelectTrade?: (trade: BigTrade) => void;
}

export const BigTradeTape: React.FC<BigTradeTapeProps> = ({ trades, symbol = 'XAUUSDT', onSelectTrade }) => {
  const unit = symbol.replace('USDT', '');
  // Aggregate stats
  const totalBuyVol = trades.filter((t) => t.side === 'buy').reduce((acc, t) => acc + t.qty, 0);
  const totalSellVol = trades.filter((t) => t.side === 'sell').reduce((acc, t) => acc + t.qty, 0);
  const totalVol = totalBuyVol + totalSellVol || 1;
  const buyPct = Math.round((totalBuyVol / totalVol) * 100);

  return (
    <div className="flex flex-col h-full bg-[#131722] select-none text-[#d1d4dc] font-mono text-[11px]">
      {/* Header Toolbar */}
      <div className="px-3 py-2 bg-[#1e222d] border-b border-[#2a2e39] flex items-center justify-between font-sans">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-[#f59e0b]" />
          <span className="font-bold text-xs text-[#e0e3eb] tracking-wide">
            BIG TRADES TAPE
          </span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/30 font-semibold">
          {trades.length} Hits
        </span>
      </div>

      {/* Whale Ratio Bar - Modern ATAS / TradingView Meter */}
      <div className="px-3 py-2 border-b border-[#2a2e39] bg-[#171b26] select-none font-sans">
        <div className="flex justify-between text-[10px] font-semibold mb-1">
          <span className="text-[#089981] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#089981]" />
            BUY {buyPct}%
          </span>
          <span className="text-[#787b86] text-[9px] uppercase tracking-wider">Whale Pressure</span>
          <span className="text-[#f23645] flex items-center gap-1">
            SELL {100 - buyPct}%
            <span className="w-1.5 h-1.5 rounded-full bg-[#f23645]" />
          </span>
        </div>
        
        {/* Sleek Gradient Progress Track */}
        <div className="w-full h-2 rounded bg-[#2a2e39] p-[1px] flex overflow-hidden">
          <div
            className="h-full bg-[#089981] transition-all duration-300 rounded-l"
            style={{ width: `${buyPct}%` }}
          />
          <div
            className="h-full bg-[#f23645] transition-all duration-300 rounded-r"
            style={{ width: `${100 - buyPct}%` }}
          />
        </div>
        <div className="flex justify-between text-[9px] font-mono text-[#787b86] mt-1">
          <span>{totalBuyVol.toFixed(1)} {unit}</span>
          <span>{totalSellVol.toFixed(1)} {unit}</span>
        </div>
      </div>

      {/* Table Column Headers */}
      <div className="grid grid-cols-4 px-3 py-1 bg-[#1e222d] border-b border-[#2a2e39] text-[10px] font-sans font-semibold text-[#787b86] select-none">
        <div>Time</div>
        <div>Price ($)</div>
        <div className="text-right">Size ({unit})</div>
        <div className="text-right">Total ($)</div>
      </div>

      {/* Tape Rows Body */}
      <div className="flex-1 overflow-y-auto bg-[#131722] font-mono text-[11px] divide-y divide-[#1e222d]">
        {trades.length === 0 ? (
          <div className="p-6 text-center text-[#787b86] text-xs font-sans">
            Listening for big trades matching threshold...
          </div>
        ) : (
          trades.map((t, idx) => {
            const isBuy = t.side === 'buy';
            const d = new Date(t.time);
            const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
            const isFresh = idx === 0;

            return (
              <div
                key={`${t.id}-${t.time}`}
                onClick={() => onSelectTrade && onSelectTrade(t)}
                className={`grid grid-cols-4 px-3 py-1.5 items-center cursor-pointer transition-colors ${
                  isFresh
                    ? isBuy
                      ? 'bg-[#089981]/15 animate-pulse'
                      : 'bg-[#f23645]/15 animate-pulse'
                    : 'hover:bg-[#1e222d]'
                }`}
              >
                {/* Time */}
                <div className="text-[#787b86] text-[10px]">{timeStr}</div>

                {/* Price */}
                <div className="flex items-center gap-1">
                  {isBuy ? (
                    <ArrowUpRight className="w-3.5 h-3.5 text-[#089981] shrink-0" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5 text-[#f23645] shrink-0" />
                  )}
                  <span className={`font-semibold ${isBuy ? 'text-[#089981]' : 'text-[#f23645]'}`}>
                    {t.price.toFixed(2)}
                  </span>
                </div>

                {/* Size */}
                <div className="text-right font-bold text-[#e0e3eb]">
                  {t.qty.toFixed(3)}
                </div>

                {/* Total Notional USDT */}
                <div className="text-right text-[#787b86] text-[10px]">
                  ${Math.round(t.notional).toLocaleString()}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
