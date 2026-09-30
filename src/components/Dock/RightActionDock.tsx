import React from 'react';
import {
  Layers,
  Flame,
  Radio,
  BarChart2,
  X,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { MarketSymbol, OrderBookState, RawTrade, BigTrade } from '../../types/market';
import { RestingLimitWall, LiquidityPool, SweptOrderEvent } from '../../types/liquidity';
import { DepthOfMarket } from '../DOM/DepthOfMarket';
import { BigTradeTape } from '../BigTrades/BigTradeTape';
import { LiquidityRadar } from '../Liquidity/LiquidityRadar';
import { OrderFlowStats } from '../OrderFlow/OrderFlowStats';

export type RightDockPanel = 'dom' | 'tape' | 'liquidity' | 'stats' | null;

interface RightActionDockProps {
  activePanel: RightDockPanel;
  onTogglePanel: (panel: RightDockPanel) => void;
  symbol: MarketSymbol;
  currentPrice: number;
  orderBook: OrderBookState | null;
  recentTrades: RawTrade[];
  bigTrades: BigTrade[];
  limitWalls: RestingLimitWall[];
  liquidityPools: LiquidityPool[];
  sweptEvents: SweptOrderEvent[];
  sessionBuyVol: number;
  sessionSellVol: number;
  tradeCount: number;
  depthCount: number;
}

export const RightActionDock: React.FC<RightActionDockProps> = ({
  activePanel,
  onTogglePanel,
  symbol,
  currentPrice,
  orderBook,
  recentTrades,
  bigTrades,
  limitWalls,
  liquidityPools,
  sweptEvents,
  sessionBuyVol,
  sessionSellVol,
  tradeCount,
  depthCount,
}) => {
  const panelTabs: Array<{
    id: 'dom' | 'tape' | 'liquidity' | 'stats';
    label: string;
    badge?: number | string;
    icon: React.ReactNode;
  }> = [
    { id: 'dom', label: 'Depth of Market (DOM)', icon: <Layers className="w-4 h-4" /> },
    {
      id: 'tape',
      label: 'Big Trades Tape',
      badge: bigTrades.length > 0 ? bigTrades.length : undefined,
      icon: <Flame className="w-4 h-4" />,
    },
    {
      id: 'liquidity',
      label: 'Liquidity Radar',
      badge: sweptEvents.length > 0 ? sweptEvents.length : undefined,
      icon: <Radio className="w-4 h-4" />,
    },
    { id: 'stats', label: 'Order Flow Stats', icon: <BarChart2 className="w-4 h-4" /> },
  ];

  const handleTabClick = (tabId: 'dom' | 'tape' | 'liquidity' | 'stats') => {
    if (activePanel === tabId) {
      onTogglePanel(null); // collapse
    } else {
      onTogglePanel(tabId); // expand
    }
  };

  return (
    <div className="flex h-full shrink-0 select-none z-20">
      {/* 1. Slide-out Panel Content (when activePanel is not null) */}
      {activePanel && (
        <aside className="w-80 md:w-88 h-full bg-[#1e222d] border-l border-[#2a2e39] flex flex-col overflow-hidden animate-in slide-in-from-right-4 duration-200 shadow-2xl">
          {/* Panel Header */}
          <div className="h-9 px-3 border-b border-[#2a2e39] flex items-center justify-between bg-[#131722] text-xs">
            <span className="font-semibold text-white">
              {panelTabs.find((t) => t.id === activePanel)?.label}
            </span>
            <button
              onClick={() => onTogglePanel(null)}
              className="p-1 rounded text-[#787b86] hover:text-white hover:bg-[#2a2e39] transition-colors"
              title="Close Panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Panel Body */}
          <div className="flex-1 overflow-hidden bg-[#1e222d]">
            {activePanel === 'dom' && (
              <DepthOfMarket
                orderBook={orderBook}
                currentPrice={currentPrice}
                recentTrades={recentTrades}
                symbol={symbol}
              />
            )}

            {activePanel === 'tape' && (
              <BigTradeTape trades={bigTrades} symbol={symbol} />
            )}

            {activePanel === 'liquidity' && (
              <LiquidityRadar
                limitWalls={limitWalls}
                liquidityPools={liquidityPools}
                sweptEvents={sweptEvents}
                currentPrice={currentPrice}
                symbol={symbol}
              />
            )}

            {activePanel === 'stats' && (
              <div className="p-3 h-full overflow-y-auto">
                <OrderFlowStats
                  buyVolume={sessionBuyVol}
                  sellVolume={sessionSellVol}
                  totalTrades={tradeCount}
                  depthUpdates={depthCount}
                  currentPrice={currentPrice}
                  symbol={symbol}
                />
              </div>
            )}
          </div>
        </aside>
      )}

      {/* 2. Vertical Slim Icon Strip (42px) */}
      <div className="w-[42px] bg-[#1e222d] border-l border-[#2a2e39] flex flex-col justify-between py-2 items-center">
        <div className="flex flex-col items-center gap-1.5">
          {panelTabs.map((tab) => {
            const isActive = activePanel === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`w-8 h-8 rounded flex items-center justify-center transition-colors relative group ${
                  isActive
                    ? 'bg-[#2962ff] text-white shadow-md'
                    : 'text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39]'
                }`}
                title={tab.label}
              >
                {tab.icon}

                {/* Badge count */}
                {tab.badge !== undefined && (
                  <span className="absolute -top-1 -right-1 px-1 min-w-3.5 h-3.5 rounded-full bg-[#f59e0b] text-[#000000] text-[9px] font-bold flex items-center justify-center">
                    {typeof tab.badge === 'number' && tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}

                {/* Hover Tooltip */}
                <div className="absolute right-full mr-2 px-2 py-1 bg-[#131722] text-white text-[11px] font-sans rounded shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 border border-[#2a2e39]">
                  {tab.label}
                </div>
              </button>
            );
          })}
        </div>

        {/* Toggle Collapse Arrow */}
        <button
          onClick={() => onTogglePanel(activePanel ? null : 'dom')}
          className="w-8 h-8 rounded flex items-center justify-center text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39] transition-colors"
          title={activePanel ? 'Collapse Sidebar' : 'Expand Sidebar'}
        >
          {activePanel ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};
