import React from 'react';
import { ArrowDown, ArrowUp, BarChart2 } from 'lucide-react';
import { Broker } from '../../types/market';

interface OrderFlowStatsProps {
  broker?: Broker;
  symbol?: string;
  sessionBuyVolume?: number;
  sessionSellVolume?: number;
  sessionDelta?: number;
  tradeCount?: number;
  connectionStatus?: string;
  depthCount?: number;
  currentPrice?: number;
  buyVolume?: number;
  sellVolume?: number;
  totalTrades?: number;
  depthUpdates?: number;
}

export const OrderFlowStats: React.FC<OrderFlowStatsProps> = ({
  symbol = 'XAUUSDT',
  sessionBuyVolume,
  sessionSellVolume,
  sessionDelta,
  tradeCount,
  depthCount,
  buyVolume,
  sellVolume,
  totalTrades,
  depthUpdates,
}) => {
  const buyVol = buyVolume ?? sessionBuyVolume ?? 0;
  const sellVol = sellVolume ?? sessionSellVolume ?? 0;
  const delta = sessionDelta ?? (buyVol - sellVol);
  const trades = totalTrades ?? tradeCount ?? 0;
  const depth = depthUpdates ?? depthCount ?? 0;

  const isDeltaPositive = delta >= 0;
  const unit = symbol.replace('USDT', '');

  return (
    <div className="flex flex-col gap-2 p-2 bg-[#1e222d] text-[#d1d4dc] font-sans text-xs select-none">
      {/* Session Delta (CVD) Card */}
      <div className="p-2.5 rounded bg-[#131722] border border-[#2a2e39] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-[#2962ff]" />
          <span className="font-medium text-[#787b86]">Session Delta (CVD):</span>
        </div>
        <span
          className={`font-mono font-bold text-sm flex items-center gap-1 ${
            isDeltaPositive ? 'text-[#089981]' : 'text-[#f23645]'
          }`}
        >
          {isDeltaPositive ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
          {isDeltaPositive ? '+' : ''}
          {delta.toFixed(2)} {unit}
        </span>
      </div>

      {/* Buy & Sell Volume Breakdown */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2 rounded bg-[#131722] border border-[#2a2e39]">
          <div className="text-[10px] text-[#787b86] uppercase font-mono">Buy Volume</div>
          <div className="text-sm font-bold font-mono text-[#089981] mt-0.5">
            {buyVol.toFixed(2)}
          </div>
        </div>
        <div className="p-2 rounded bg-[#131722] border border-[#2a2e39]">
          <div className="text-[10px] text-[#787b86] uppercase font-mono">Sell Volume</div>
          <div className="text-sm font-bold font-mono text-[#f23645] mt-0.5">
            {sellVol.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Trade Ticks & Depth Updates */}
      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
        <div className="p-2 rounded bg-[#131722] border border-[#2a2e39] flex justify-between">
          <span className="text-[#787b86]">Ticks:</span>
          <span className="text-white font-semibold">{trades.toLocaleString()}</span>
        </div>
        <div className="p-2 rounded bg-[#131722] border border-[#2a2e39] flex justify-between">
          <span className="text-[#787b86]">Depth:</span>
          <span className="text-white font-semibold">{depth.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};
