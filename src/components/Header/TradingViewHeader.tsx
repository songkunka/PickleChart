import React, { useState } from 'react';
import { ASSET_MAP, MarketSymbol, MarketTicker, Timeframe } from '../../types/market';
import { IndicatorSettings } from '../../types/settings';
import { SymbolSearchModal } from './SymbolSearchModal';
import { IndicatorsModal } from './IndicatorsModal';
import {
  Volume2,
  VolumeX,
  Settings,
  RotateCcw,
  ChevronDown,
  Flame,
  Maximize2,
  Minimize2,
} from 'lucide-react';

interface TradingViewHeaderProps {
  symbol: MarketSymbol;
  onSelectSymbol: (s: MarketSymbol) => void;
  timeframe: Timeframe;
  onSelectTimeframe: (tf: Timeframe) => void;
  ticker: MarketTicker | null;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  bigTradeThreshold: number;
  onChangeThreshold: (val: number) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  showLimitWalls?: boolean;
  onToggleLimitWalls?: () => void;
  showSLTPPools?: boolean;
  onToggleSLTPPools?: () => void;
  showSweptMarkers?: boolean;
  onToggleSweptMarkers?: () => void;
  onResetView?: () => void;
  onOpenSettings?: () => void;
  indicators: IndicatorSettings;
  onToggleIndicator: (key: keyof IndicatorSettings) => void;
  onChangeIndicatorColor?: (key: keyof IndicatorSettings, color: string) => void;
}

const PRIMARY_TIMEFRAMES: Timeframe[] = ['1s', '5s', '15s', '1m', '5m', '15m', '1h', '4h'];

export const TradingViewHeader: React.FC<TradingViewHeaderProps> = ({
  symbol,
  onSelectSymbol,
  timeframe,
  onSelectTimeframe,
  ticker,
  connectionStatus,
  bigTradeThreshold,
  onChangeThreshold,
  isMuted,
  onToggleMute,
  showLimitWalls = true,
  onToggleLimitWalls,
  showSLTPPools = true,
  onToggleSLTPPools,
  showSweptMarkers = true,
  onToggleSweptMarkers,
  onResetView,
  onOpenSettings,
  indicators,
  onToggleIndicator,
  onChangeIndicatorColor,
}) => {
  const [isSymbolModalOpen, setIsSymbolModalOpen] = useState(false);
  const [isIndicatorsModalOpen, setIsIndicatorsModalOpen] = useState(false);
  const [isThresholdOpen, setIsThresholdOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const currentAsset = ASSET_MAP[symbol] || ASSET_MAP['XAUUSDT'];
  const isPositive = ticker ? ticker.change24h >= 0 : true;

  const activeIndicatorsCount = Object.values(indicators).filter((i) => i.enabled).length;

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
      }
    }
  };

  return (
    <>
      <header className="h-[38px] bg-[#1e222d] border-b border-[#2a2e39] px-2 flex items-center justify-between text-[#d1d4dc] font-sans select-none shrink-0 z-30">
        {/* Left Section: Symbol Search + Price Readout + Timeframes */}
        <div className="flex items-center gap-1.5">
          {/* Symbol Search Button (TradingView Style) */}
          <button
            onClick={() => setIsSymbolModalOpen(true)}
            className="flex items-center gap-1.5 h-[28px] px-2 rounded hover:bg-[#2a2e39] transition-colors group cursor-pointer"
            title="Search Symbol (Click to search)"
          >
            <div
              className={`w-4 h-4 rounded-full flex items-center justify-center font-bold text-[9px] bg-gradient-to-br ${currentAsset.bgGradient} text-white shrink-0`}
            >
              {currentAsset.iconLabel}
            </div>
            <span className="font-bold text-xs text-white font-mono group-hover:text-[#2962ff] transition-colors">
              {symbol}
            </span>
            <span className="text-[11px] text-[#787b86] hidden md:inline">
              · {currentAsset.name}
            </span>
            <ChevronDown className="w-3 h-3 text-[#787b86] group-hover:text-white" />
          </button>

          {/* Price Readout with 24h Change */}
          {ticker && (
            <div className="hidden lg:flex items-center gap-1.5 h-[26px] px-2 rounded bg-[#131722] border border-[#2a2e39] font-mono text-xs tabular-nums">
              <span className={`font-semibold ${isPositive ? 'text-[#089981]' : 'text-[#f23645]'}`}>
                {ticker.price.toFixed(currentAsset.tickSize < 0.1 ? 2 : 1)}
              </span>
              <span className={`text-[10px] ${isPositive ? 'text-[#089981]' : 'text-[#f23645]'}`}>
                {isPositive ? '+' : ''}{ticker.change24h.toFixed(2)}%
              </span>
            </div>
          )}

          <div className="h-3.5 w-[1px] bg-[#2a2e39] mx-0.5" />

          {/* Quick Timeframes Toolbar */}
          <div className="flex items-center gap-0.5">
            {PRIMARY_TIMEFRAMES.map((tf) => {
              const isActive = timeframe === tf;
              return (
                <button
                  key={tf}
                  onClick={() => onSelectTimeframe(tf)}
                  className={`h-[26px] px-1.5 rounded text-[11px] font-medium transition-colors ${
                    isActive
                      ? 'bg-[#2962ff]/20 text-[#2962ff] font-bold'
                      : 'text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39]'
                  }`}
                >
                  {tf}
                </button>
              );
            })}
          </div>

          <div className="h-3.5 w-[1px] bg-[#2a2e39] mx-0.5 hidden sm:block" />

          {/* Indicators Button (fx) */}
          <button
            onClick={() => setIsIndicatorsModalOpen(true)}
            className="flex items-center gap-1.5 h-[26px] px-2 rounded hover:bg-[#2a2e39] text-xs transition-colors"
            title="Technical Indicators (fx)"
          >
            <span className="font-serif italic font-bold text-[#2962ff] text-xs">fx</span>
            <span className="text-[#d1d4dc] font-medium text-[11px] hidden sm:inline">Indicators</span>
            {activeIndicatorsCount > 0 && (
              <span className="w-3.5 h-3.5 rounded-full bg-[#2962ff] text-white text-[9px] flex items-center justify-center font-bold">
                {activeIndicatorsCount}
              </span>
            )}
          </button>
        </div>

        {/* Right Section: Order Flow Filters + Tools + Settings */}
        <div className="flex items-center gap-1">
          {/* Liquidity Toggles Pill */}
          <div className="hidden xl:flex items-center gap-0.5 bg-[#131722] p-[2px] rounded border border-[#2a2e39] text-[11px]">
            {onToggleLimitWalls && (
              <button
                onClick={onToggleLimitWalls}
                className={`h-[22px] px-1.5 rounded text-[10px] font-medium transition-colors ${
                  showLimitWalls
                    ? 'bg-[#2962ff] text-white'
                    : 'text-[#787b86] hover:text-[#d1d4dc]'
                }`}
                title="Toggle Resting Limit Walls"
              >
                Walls
              </button>
            )}
            {onToggleSLTPPools && (
              <button
                onClick={onToggleSLTPPools}
                className={`h-[22px] px-1.5 rounded text-[10px] font-medium transition-colors ${
                  showSLTPPools
                    ? 'bg-[#2962ff] text-white'
                    : 'text-[#787b86] hover:text-[#d1d4dc]'
                }`}
                title="Toggle SL / TP Liquidity Pools"
              >
                SL/TP
              </button>
            )}
            {onToggleSweptMarkers && (
              <button
                onClick={onToggleSweptMarkers}
                className={`h-[22px] px-1.5 rounded text-[10px] font-medium transition-colors ${
                  showSweptMarkers
                    ? 'bg-[#2962ff] text-white'
                    : 'text-[#787b86] hover:text-[#d1d4dc]'
                }`}
                title="Toggle Swept Liquidity Absorption Markers"
              >
                Sweeps
              </button>
            )}
          </div>

          {/* Big Trade Filter Button & Popover */}
          <div className="relative">
            <button
              onClick={() => setIsThresholdOpen(!isThresholdOpen)}
              className="flex items-center gap-1 h-[26px] px-2 rounded bg-[#131722] border border-[#2a2e39] hover:border-[#787b86] text-xs transition-colors"
              title="Filter Big Trades Threshold"
            >
              <Flame className="w-3 h-3 text-amber-400" />
              <span className="font-mono text-white text-[11px] tabular-nums">≥{bigTradeThreshold}</span>
              <ChevronDown className="w-2.5 h-2.5 text-[#787b86]" />
            </button>

            {isThresholdOpen && (
              <div
                className="absolute right-0 top-full mt-1 w-44 bg-[#1e222d] border border-[#2a2e39] rounded shadow-xl p-2 z-50 text-xs space-y-1.5"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-[11px] text-[#787b86] font-semibold">Min Contract Filter:</div>
                <div className="grid grid-cols-3 gap-1">
                  {currentAsset.thresholdOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => {
                        onChangeThreshold(opt);
                        setIsThresholdOpen(false);
                      }}
                      className={`py-1 rounded font-mono text-[11px] transition-colors ${
                        bigTradeThreshold === opt
                          ? 'bg-[#2962ff] text-white font-bold'
                          : 'bg-[#131722] hover:bg-[#2a2e39] text-[#d1d4dc]'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Audio Mute Toggle */}
          <button
            onClick={onToggleMute}
            className={`w-7 h-7 flex items-center justify-center rounded hover:bg-[#2a2e39] transition-colors ${
              isMuted ? 'text-[#f23645]' : 'text-[#089981]'
            }`}
            title={isMuted ? 'Unmute Big Trade Alerts' : 'Mute Big Trade Alerts'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          {/* Reset Chart View Button */}
          {onResetView && (
            <button
              onClick={onResetView}
              className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#2a2e39] text-[#787b86] hover:text-[#d1d4dc] transition-colors"
              title="Reset Chart View (Fit to screen)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#2a2e39] text-[#787b86] hover:text-[#d1d4dc] transition-colors hidden sm:flex"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Chart Settings Button */}
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#2a2e39] text-[#787b86] hover:text-[#d1d4dc] transition-colors"
              title="Chart Properties & Appearance Settings"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Connection Dot */}
          <div className="flex items-center gap-1.5 pl-1.5 border-l border-[#2a2e39]">
            <div
              className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected'
                  ? 'bg-[#089981]'
                  : connectionStatus === 'connecting'
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-[#f23645]'
              }`}
              title={`Binance Feed: ${connectionStatus}`}
            />
          </div>
        </div>
      </header>

      {/* Symbol Search Modal */}
      <SymbolSearchModal
        isOpen={isSymbolModalOpen}
        onClose={() => setIsSymbolModalOpen(false)}
        currentSymbol={symbol}
        onSelectSymbol={onSelectSymbol}
      />

      {/* Indicators Modal */}
      <IndicatorsModal
        isOpen={isIndicatorsModalOpen}
        onClose={() => setIsIndicatorsModalOpen(false)}
        indicators={indicators}
        onToggleIndicator={onToggleIndicator}
        onChangeColor={onChangeIndicatorColor}
      />
    </>
  );
};
