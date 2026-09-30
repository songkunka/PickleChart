import React, { useState, useEffect, useRef } from 'react';
import { OrderBookState, RawTrade } from '../../types/market';
import { Crosshair, Lock, Unlock } from 'lucide-react';

interface DepthOfMarketProps {
  orderBook: OrderBookState | null;
  currentPrice: number;
  recentTrades: RawTrade[];
  symbol?: string;
  onPriceClick?: (price: number) => void;
}

export const DepthOfMarket: React.FC<DepthOfMarketProps> = ({
  orderBook,
  currentPrice,
  recentTrades,
  symbol = 'XAUUSDT',
  onPriceClick,
}) => {
  const [lockedToMarket, setLockedToMarket] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const [centerPrice, setCenterPrice] = useState<number>(0);

  // Volume Profile at price tracking (Cumulative matched volume)
  const volumeAtPriceRef = useRef<Map<number, { buy: number; sell: number; total: number }>>(new Map());

  // Reset volume profile on symbol change
  useEffect(() => {
    volumeAtPriceRef.current.clear();
  }, [symbol]);

  // Aggregate trades into volume at price
  useEffect(() => {
    if (recentTrades.length === 0) return;
    const map = volumeAtPriceRef.current;
    for (const t of recentTrades) {
      const step = symbol.includes('QQQ') || symbol.includes('SPY') ? 0.10 : 0.50;
      const priceBucket = Math.round(t.price / step) * step;
      const cur = map.get(priceBucket) || { buy: 0, sell: 0, total: 0 };
      if (t.side === 'buy') {
        cur.buy += t.qty;
      } else {
        cur.sell += t.qty;
      }
      cur.total += t.qty;
      map.set(priceBucket, cur);
    }
  }, [recentTrades, symbol]);

  // Update center price when locked
  useEffect(() => {
    if (lockedToMarket && currentPrice > 0) {
      setCenterPrice(currentPrice);
    }
  }, [currentPrice, lockedToMarket]);

  if (!orderBook) {
    return (
      <div className="flex flex-col h-full bg-[#131722] p-4 text-center text-[#787b86] font-mono text-xs justify-center items-center">
        <div className="w-5 h-5 border-2 border-[#2962ff] border-t-transparent rounded-full animate-spin mb-2" />
        <span>Connecting Real-Time DOM...</span>
      </div>
    );
  }

  // Create lookup maps for bids and asks
  const tickSize = symbol.includes('QQQ') || symbol.includes('SPY') ? 0.10 : (symbol.includes('BTC') ? 1.0 : 0.50);

  const bidMap = new Map<number, number>();
  for (const b of orderBook.bids) {
    const p = Math.round(b.price / tickSize) * tickSize;
    bidMap.set(p, (bidMap.get(p) || 0) + b.qty);
  }

  const askMap = new Map<number, number>();
  for (const a of orderBook.asks) {
    const p = Math.round(a.price / tickSize) * tickSize;
    askMap.set(p, (askMap.get(p) || 0) + a.qty);
  }

  // Generate price ladder rows around centerPrice
  const baseP = centerPrice > 0 ? centerPrice : (orderBook.bestBid || 100);
  const roundedBase = Math.round(baseP / tickSize) * tickSize;
  const numRowsAbove = 24;
  const numRowsBelow = 24;

  const priceRows: number[] = [];
  for (let i = numRowsAbove; i >= -numRowsBelow; i--) {
    const p = Math.round((roundedBase + i * tickSize) * 100) / 100;
    priceRows.push(p);
  }

  const maxDepthQty = Math.max(orderBook.maxBidQty, orderBook.maxAskQty, 10.0);

  const bestBid = orderBook.bestBid;
  const bestAsk = orderBook.bestAsk;
  const spread = bestAsk > 0 && bestBid > 0 ? (bestAsk - bestBid) : 0;

  return (
    <div className="flex flex-col h-full bg-[#131722] select-none font-mono text-[11px] text-[#d1d4dc]">
      {/* TradingView / ATAS Header Controls */}
      <div className="px-3 py-2 bg-[#1e222d] border-b border-[#2a2e39] flex items-center justify-between font-sans">
        <div className="flex items-center gap-2">
          <span className="font-bold text-xs text-[#e0e3eb] tracking-wide">
            DOM LADDER
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#2a2e39] text-[#2962ff] font-mono font-semibold">
            {symbol}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              setLockedToMarket(true);
              setCenterPrice(currentPrice);
            }}
            className={`flex items-center gap-1 px-2 py-0.5 text-[10px] font-sans font-medium rounded transition-colors ${
              lockedToMarket
                ? 'bg-[#2962ff]/20 text-[#2962ff] border border-[#2962ff]/40'
                : 'bg-[#2a2e39] hover:bg-[#363a45] text-[#787b86]'
            }`}
          >
            {lockedToMarket ? <Lock className="w-2.5 h-2.5" /> : <Unlock className="w-2.5 h-2.5" />}
            <span>Lock</span>
          </button>
          <button
            onClick={() => setCenterPrice(currentPrice)}
            className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-sans font-medium rounded bg-[#2a2e39] hover:bg-[#363a45] text-[#d1d4dc] transition-colors"
            title="Recenter DOM ladder to current market price"
          >
            <Crosshair className="w-2.5 h-2.5 text-[#2962ff]" />
            <span>Center</span>
          </button>
        </div>
      </div>

      {/* Spread and Best Bid/Ask Display - Modern ATAS Inset */}
      <div className="px-3 py-1.5 bg-[#171b26] border-b border-[#2a2e39] grid grid-cols-3 gap-1.5 text-[11px] font-sans">
        <div className="flex flex-col items-center bg-[#1e222d] px-2 py-1 rounded border border-[#2a2e39]">
          <span className="text-[#787b86] text-[9px] uppercase tracking-wider">Bid</span>
          <span className="text-[#089981] font-bold font-mono text-[11px]">${bestBid?.toFixed(2)}</span>
        </div>
        <div className="flex flex-col items-center bg-[#1e222d] px-2 py-1 rounded border border-[#2a2e39]">
          <span className="text-[#787b86] text-[9px] uppercase tracking-wider">Spread</span>
          <span className="text-[#f59e0b] font-bold font-mono text-[11px]">${(spread || 0).toFixed(2)}</span>
        </div>
        <div className="flex flex-col items-center bg-[#1e222d] px-2 py-1 rounded border border-[#2a2e39]">
          <span className="text-[#787b86] text-[9px] uppercase tracking-wider">Ask</span>
          <span className="text-[#f23645] font-bold font-mono text-[11px]">${bestAsk?.toFixed(2)}</span>
        </div>
      </div>

      {/* Table Column Headers */}
      <div className="grid grid-cols-12 px-2 py-1 bg-[#1e222d] border-b border-[#2a2e39] text-[10px] font-sans font-semibold text-[#787b86] select-none">
        <div className="col-span-3 text-right pr-2">Bid Vol</div>
        <div className="col-span-4 text-center">Price ($)</div>
        <div className="col-span-3 text-left pl-2">Ask Vol</div>
        <div className="col-span-2 text-right pr-1">Total</div>
      </div>

      {/* Ladder Body */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto bg-[#131722] font-mono text-[11px] divide-y divide-[#1e222d]"
      >
        {priceRows.map((price) => {
          const bidQty = bidMap.get(price) || 0;
          const askQty = askMap.get(price) || 0;
          const isBestBid = bestBid > 0 && Math.abs(price - bestBid) < 0.25;
          const isBestAsk = bestAsk > 0 && Math.abs(price - bestAsk) < 0.25;
          const isCurrentPrice = Math.abs(price - currentPrice) < 0.25;

          const volStats = volumeAtPriceRef.current.get(price);
          const totalVolAtPrice = volStats ? volStats.total : 0;

          const bidBarWidth = Math.min(100, (bidQty / maxDepthQty) * 100);
          const askBarWidth = Math.min(100, (askQty / maxDepthQty) * 100);

          return (
            <div
              key={price}
              onClick={() => onPriceClick && onPriceClick(price)}
              className={`grid grid-cols-12 px-2 py-[2px] items-center cursor-pointer transition-colors relative ${
                isCurrentPrice
                  ? 'bg-[#2962ff]/20 text-white font-bold ring-1 ring-[#2962ff] z-10'
                  : isBestBid
                  ? 'bg-[#089981]/10'
                  : isBestAsk
                  ? 'bg-[#f23645]/10'
                  : 'hover:bg-[#1e222d]'
              }`}
            >
              {/* Bid Column with Depth Bar */}
              <div className="col-span-3 relative h-4 flex items-center justify-end pr-2">
                {bidQty > 0 && (
                  <>
                    <div
                      className="absolute right-0 top-0 bottom-0 bg-[#089981]/30 rounded-l transition-all duration-100"
                      style={{ width: `${bidBarWidth}%` }}
                    />
                    <span className="relative z-10 font-bold text-[#089981] text-[11px]">
                      {bidQty.toFixed(1)}
                    </span>
                  </>
                )}
              </div>

              {/* Price Column */}
              <div className="col-span-4 text-center font-semibold relative flex items-center justify-center">
                {isBestBid && (
                  <span className="absolute left-1 w-1.5 h-1.5 rounded-full bg-[#089981]" />
                )}
                {isBestAsk && (
                  <span className="absolute left-1 w-1.5 h-1.5 rounded-full bg-[#f23645]" />
                )}
                <span
                  className={`px-1.5 py-0.5 rounded text-[11px] ${
                    isCurrentPrice
                      ? 'bg-[#2962ff] text-white font-extrabold shadow-sm'
                      : isBestBid
                      ? 'text-[#089981] font-bold'
                      : isBestAsk
                      ? 'text-[#f23645] font-bold'
                      : 'text-[#d1d4dc]'
                  }`}
                >
                  {price.toFixed(2)}
                </span>
              </div>

              {/* Ask Column with Depth Bar */}
              <div className="col-span-3 relative h-4 flex items-center justify-start pl-2">
                {askQty > 0 && (
                  <>
                    <div
                      className="absolute left-0 top-0 bottom-0 bg-[#f23645]/30 rounded-r transition-all duration-100"
                      style={{ width: `${askBarWidth}%` }}
                    />
                    <span className="relative z-10 font-bold text-[#f23645] text-[11px]">
                      {askQty.toFixed(1)}
                    </span>
                  </>
                )}
              </div>

              {/* Traded Volume Profile at this Price */}
              <div className="col-span-2 text-right pr-1 text-[10px] font-mono">
                {totalVolAtPrice > 0 ? (
                  <span className="text-[#787b86] font-medium">{totalVolAtPrice.toFixed(0)}</span>
                ) : (
                  <span className="text-[#363a45]">-</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
