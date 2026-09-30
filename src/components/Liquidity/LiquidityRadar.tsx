import React, { useState } from 'react';
import {
  LiquidityPool,
  RestingLimitWall,
  SweptOrderEvent,
} from '../../types/liquidity';
import {
  ShieldAlert,
  Flame,
  CheckCircle2,
  Crosshair,
  TrendingDown,
  TrendingUp,
  Clock,
  Layers,
  Sparkles,
} from 'lucide-react';

interface LiquidityRadarProps {
  limitWalls: RestingLimitWall[];
  liquidityPools: LiquidityPool[];
  sweptEvents: SweptOrderEvent[];
  currentPrice: number;
  symbol?: string;
  onPriceSelect?: (price: number) => void;
  measureToolActive?: boolean;
  onToggleMeasureTool?: () => void;
}

export const LiquidityRadar: React.FC<LiquidityRadarProps> = ({
  limitWalls,
  liquidityPools,
  sweptEvents,
  currentPrice,
  symbol = 'XAUUSDT',
  onPriceSelect,
  measureToolActive = false,
  onToggleMeasureTool,
}) => {
  type TabType = 'swept' | 'walls' | 'pools';
  const [activeTab, setActiveTab] = useState<TabType>('swept');
  const [minVolFilter, setMinVolFilter] = useState<number>(1.0);

  // Compute summary stats
  const buyWalls = limitWalls.filter((w) => w.side === 'buy');
  const sellWalls = limitWalls.filter((w) => w.side === 'sell');

  const totalBuyLimitVol = buyWalls.reduce((acc, w) => acc + w.volume, 0);
  const totalSellLimitVol = sellWalls.reduce((acc, w) => acc + w.volume, 0);
  const totalLimitVol = totalBuyLimitVol + totalSellLimitVol;
  const buyRatio = totalLimitVol > 0 ? (totalBuyLimitVol / totalLimitVol) * 100 : 50;

  const totalSweptVol = sweptEvents.reduce((acc, s) => acc + s.volume, 0);
  const activePoolsCount = liquidityPools.filter((p) => !p.isSwept).length;

  // Max volume for relative bar widths
  const maxWallVol = Math.max(1, ...limitWalls.map((w) => w.volume));

  return (
    <div className="flex flex-col h-full bg-[#131722] select-none font-mono text-[11px] text-[#d1d4dc]">
      {/* 1. Header Toolbar */}
      <div className="px-3 py-2 bg-[#1e222d] border-b border-[#2a2e39] flex items-center justify-between font-sans">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#2962ff]" />
          <span className="font-bold text-xs text-[#e0e3eb] tracking-wide">
            LIQUIDITY & SWEEP
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#2a2e39] text-[#2962ff] font-mono font-semibold">
            {symbol} {currentPrice > 0 ? `$${currentPrice.toFixed(2)}` : ''}
          </span>
        </div>

        {/* Measure Tool Toggle */}
        <button
          onClick={onToggleMeasureTool}
          className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-sans font-medium rounded transition-colors ${
            measureToolActive
              ? 'bg-[#2962ff] text-white shadow-sm'
              : 'bg-[#2a2e39] hover:bg-[#363a45] text-[#d1d4dc]'
          }`}
          title="Toggle Click & Drag Range Measurement Ruler on Chart"
        >
          <Crosshair className="w-3 h-3 text-white" />
          <span>{measureToolActive ? 'Measuring...' : 'Measure'}</span>
        </button>
      </div>

      {/* 2. Top Summary Metrics */}
      <div className="p-3 bg-[#171b26] border-b border-[#2a2e39] space-y-2 text-[10px] font-sans">
        {/* Limit Order Imbalance Bar */}
        <div>
          <div className="flex justify-between items-center text-[#787b86] font-semibold mb-1">
            <span className="flex items-center gap-1 text-[#089981]">
              <TrendingUp className="w-3 h-3" /> Buy: {totalBuyLimitVol.toFixed(1)}
            </span>
            <span className="text-[#d1d4dc] font-bold">{buyRatio.toFixed(0)}% / {(100 - buyRatio).toFixed(0)}%</span>
            <span className="flex items-center gap-1 text-[#f23645]">
              Sell: {totalSellLimitVol.toFixed(1)} <TrendingDown className="w-3 h-3" />
            </span>
          </div>
          {/* Modern Progress Track */}
          <div className="w-full h-2 rounded bg-[#2a2e39] p-[1px] flex overflow-hidden">
            <div
              className="bg-[#089981] h-full transition-all duration-300 rounded-l"
              style={{ width: `${buyRatio}%` }}
            />
            <div
              className="bg-[#f23645] h-full transition-all duration-300 rounded-r"
              style={{ width: `${100 - buyRatio}%` }}
            />
          </div>
        </div>

        {/* Quick Highlights Grid */}
        <div className="grid grid-cols-2 gap-2 pt-0.5">
          <div className="bg-[#1e222d] p-2 rounded border border-[#2a2e39]">
            <div className="text-[#787b86] flex items-center gap-1.5 text-[9px] font-medium uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-[#f59e0b]" />
              <span>Swept Volume</span>
            </div>
            <div className="text-xs font-bold text-[#f59e0b] font-mono mt-1">
              {totalSweptVol.toFixed(1)} <span className="text-[9px] text-[#787b86] font-normal">Contracts</span>
            </div>
          </div>
          <div className="bg-[#1e222d] p-2 rounded border border-[#2a2e39]">
            <div className="text-[#787b86] flex items-center gap-1.5 text-[9px] font-medium uppercase tracking-wider">
              <ShieldAlert className="w-3 h-3 text-[#2962ff]" />
              <span>Est. SL/TP Pools</span>
            </div>
            <div className="text-xs font-bold text-[#2962ff] font-mono mt-1">
              {activePoolsCount} <span className="text-[9px] text-[#787b86] font-normal">Active Near</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. TradingView Sub Tabs */}
      <div className="flex bg-[#1e222d] border-b border-[#2a2e39] px-2 gap-2 shrink-0 font-sans">
        <button
          onClick={() => setActiveTab('swept')}
          className={`py-2 px-2 text-[11px] font-medium transition-colors flex items-center gap-1.5 border-b-2 ${
            activeTab === 'swept'
              ? 'border-[#2962ff] text-[#2962ff]'
              : 'border-transparent text-[#787b86] hover:text-[#d1d4dc]'
          }`}
        >
          <CheckCircle2 className="w-3 h-3" />
          <span>Swept ({sweptEvents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('walls')}
          className={`py-2 px-2 text-[11px] font-medium transition-colors flex items-center gap-1.5 border-b-2 ${
            activeTab === 'walls'
              ? 'border-[#2962ff] text-[#2962ff]'
              : 'border-transparent text-[#787b86] hover:text-[#d1d4dc]'
          }`}
        >
          <Flame className="w-3 h-3" />
          <span>Walls ({limitWalls.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('pools')}
          className={`py-2 px-2 text-[11px] font-medium transition-colors flex items-center gap-1.5 border-b-2 ${
            activeTab === 'pools'
              ? 'border-[#2962ff] text-[#2962ff]'
              : 'border-transparent text-[#787b86] hover:text-[#d1d4dc]'
          }`}
        >
          <ShieldAlert className="w-3 h-3" />
          <span>Pools ({liquidityPools.length})</span>
        </button>
      </div>

      {/* 4. Tab Contents */}
      <div className="flex-1 overflow-y-auto bg-[#131722] font-sans text-xs">
        {/* TAB 1: SWEPT ORDERS */}
        {activeTab === 'swept' && (
          <div className="divide-y divide-[#1e222d]">
            {sweptEvents.length === 0 ? (
              <div className="p-8 text-center text-[#787b86] text-xs">
                Monitoring live order sweeps...
              </div>
            ) : (
              sweptEvents.map((ev) => {
                const isBuySwept = ev.aggressorSide === 'buy';
                const d = new Date(ev.time);
                const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

                return (
                  <div
                    key={ev.id}
                    onClick={() => onPriceSelect && onPriceSelect(ev.price)}
                    className={`p-2.5 cursor-pointer transition-colors space-y-1.5 ${
                      ev.significant
                        ? 'bg-[#f59e0b]/10 hover:bg-[#f59e0b]/15 border-l-2 border-[#f59e0b]'
                        : 'hover:bg-[#1e222d]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            isBuySwept
                              ? 'bg-[#089981]/20 text-[#089981] border border-[#089981]/30'
                              : 'bg-[#f23645]/20 text-[#f23645] border border-[#f23645]/30'
                          }`}
                        >
                          {isBuySwept ? 'BUY SWEEP' : 'SELL SWEEP'}
                        </span>
                        <span className="font-bold text-[#e0e3eb] font-mono text-[11px]">${ev.price.toFixed(2)}</span>
                        {ev.significant && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/30">★ KEY ABSORB</span>
                        )}
                      </div>
                      <span className="text-[9px] text-[#787b86] font-mono flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {timeStr}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-[#f59e0b] font-bold">
                        {ev.volume.toFixed(1)} <span className="text-[#787b86] font-normal">Contracts</span>
                      </span>
                      <span className="text-[#787b86]">
                        ${ev.notional.toLocaleString()} USDT
                      </span>
                    </div>

                    {ev.significant && ev.significanceTags && ev.significanceTags.length > 0 && (
                      <div className="flex flex-wrap gap-1 text-[9px] font-mono">
                        {ev.significanceTags.map((t) => (
                          <span key={t} className="px-1.5 py-0.5 rounded bg-[#2a2e39] text-[#d1d4dc]">{t}</span>
                        ))}
                      </div>
                    )}

                    {/* Market Reaction badge */}
                    <div className="flex items-center justify-between text-[9px] pt-1 border-t border-[#1e222d]">
                      <span className="text-[#787b86] font-sans">Reaction:</span>
                      {ev.reaction === 'absorbed_reversal' ? (
                        <span className="px-1.5 py-0.5 rounded bg-[#f59e0b]/20 text-[#f59e0b] font-semibold border border-[#f59e0b]/30">
                          🛡️ Absorbed & Reversal {isBuySwept ? '↓' : '↑'}
                        </span>
                      ) : ev.reaction === 'breakout_continuation' ? (
                        <span className="px-1.5 py-0.5 rounded bg-[#2962ff]/20 text-[#2962ff] font-semibold border border-[#2962ff]/30">
                          🚀 Breakout {isBuySwept ? '↑' : '↓'}
                        </span>
                      ) : ev.reaction === 'stalled' ? (
                        <span
                          className="px-1.5 py-0.5 rounded bg-[#2a2e39] text-[#787b86] font-semibold"
                          title="No move within 30s"
                        >
                          ⏸ Stalled
                        </span>
                      ) : (
                        <span className="text-[#787b86] italic">Analyzing reaction...</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 2: LIMIT WALLS */}
        {activeTab === 'walls' && (
          <div className="divide-y divide-[#1e222d]">
            {/* Filter */}
            <div className="px-3 py-1.5 flex items-center justify-between text-[10px] text-[#787b86] bg-[#1e222d] border-b border-[#2a2e39] font-sans">
              <span>Min Volume Filter:</span>
              <div className="flex gap-1">
                {[1, 2, 5, 10].map((v) => (
                  <button
                    key={v}
                    onClick={() => setMinVolFilter(v)}
                    className={`px-2 py-0.5 rounded text-[10px] font-sans transition-colors ${
                      minVolFilter === v
                        ? 'bg-[#2962ff] text-white font-bold'
                        : 'bg-[#2a2e39] hover:bg-[#363a45] text-[#d1d4dc]'
                    }`}
                  >
                    ≥{v}
                  </button>
                ))}
              </div>
            </div>

            {limitWalls
              .filter((w) => w.volume >= minVolFilter)
              .map((w, idx) => {
                const isBuy = w.side === 'buy';
                const barWidth = Math.min(100, (w.volume / maxWallVol) * 100);

                return (
                  <div
                    key={`${w.side}-${w.price}-${idx}`}
                    onClick={() => onPriceSelect && onPriceSelect(w.price)}
                    className="p-2.5 cursor-pointer transition-colors relative overflow-hidden hover:bg-[#1e222d]"
                  >
                    {/* Background Progress Bar */}
                    <div
                      className={`absolute left-0 top-0 bottom-0 opacity-15 pointer-events-none transition-all ${
                        isBuy ? 'bg-[#089981]' : 'bg-[#f23645]'
                      }`}
                      style={{ width: `${barWidth}%` }}
                    />

                    <div className="relative z-10 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isBuy ? 'bg-[#089981]' : 'bg-[#f23645]'
                          }`}
                        />
                        <span className="font-bold text-[#e0e3eb] font-mono text-[11px]">${w.price.toFixed(2)}</span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            isBuy
                              ? 'text-[#089981] bg-[#089981]/20 border border-[#089981]/30'
                              : 'text-[#f23645] bg-[#f23645]/20 border border-[#f23645]/30'
                          }`}
                        >
                          {isBuy ? 'LIMIT BUY' : 'LIMIT SELL'}
                        </span>
                      </div>

                      <div className="text-right font-mono">
                        <span className={`font-bold ${isBuy ? 'text-[#089981]' : 'text-[#f23645]'}`}>
                          {w.volume.toFixed(1)} XAU
                        </span>
                      </div>
                    </div>

                    <div className="relative z-10 flex items-center justify-between text-[9px] text-[#787b86] font-mono mt-1">
                      <span>Dist: {w.distance >= 0 ? `+${w.distance.toFixed(2)}` : w.distance.toFixed(2)} ({w.distancePercent.toFixed(2)}%)</span>
                      <span>${w.notional.toLocaleString()} USDT</span>
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {/* TAB 3: SL / TP LIQUIDITY POOLS */}
        {activeTab === 'pools' && (
          <div className="divide-y divide-[#1e222d]">
            {liquidityPools.length === 0 ? (
              <div className="p-8 text-center text-[#787b86] text-xs font-sans">
                Scanning swing highs & lows for SL/TP pools...
              </div>
            ) : (
              liquidityPools.map((pool) => {
                const isBSL = pool.type === 'BSL';

                return (
                  <div
                    key={pool.id}
                    onClick={() => onPriceSelect && onPriceSelect(pool.price)}
                    className={`p-2.5 cursor-pointer transition-colors space-y-1.5 ${
                      pool.isSwept
                        ? 'opacity-50'
                        : 'hover:bg-[#1e222d]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            isBSL
                              ? 'bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/30'
                              : 'bg-[#2962ff]/20 text-[#2962ff] border border-[#2962ff]/30'
                          }`}
                        >
                          {pool.type}
                        </span>
                        <span className={`font-bold font-mono text-[11px] ${pool.isSwept ? 'line-through text-[#787b86]' : 'text-[#e0e3eb]'}`}>
                          ${pool.price.toFixed(2)}
                        </span>
                      </div>

                      {pool.isSwept ? (
                        <span className="flex items-center gap-1 text-[9px] font-semibold text-[#089981] bg-[#089981]/20 px-1.5 py-0.5 rounded border border-[#089981]/30">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          SWEPT
                        </span>
                      ) : (
                        <span className="text-[9px] text-[#f59e0b] font-semibold font-sans">
                          Active Pool
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-[#787b86] font-sans text-[9px]">{pool.description}</span>
                      <span className="font-semibold text-[#d1d4dc]">
                        Swing vol ~{pool.estimatedVolume.toFixed(1)} XAU
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[9px] text-[#787b86] font-mono pt-0.5">
                      <span>Distance: {pool.distance.toFixed(2)} pts</span>
                      {pool.sweptVolume !== undefined && (
                        <span
                          className="text-[#089981] font-bold"
                          title="Volume traded beyond the level during the sweep bar"
                        >
                          Vol beyond: {pool.sweptVolume.toFixed(1)} XAU{pool.sweptVolumeSource === 'candle' ? ' (bar)' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};
