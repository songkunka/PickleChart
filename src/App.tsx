import { useState, useEffect, useRef, useMemo } from 'react';
import { ASSET_MAP, BigTrade, Broker, Candle, MarketSymbol, MarketTicker, OrderBookState, RawTrade, Timeframe } from './types/market';
import { LiquidityPool, RestingLimitWall, SweptOrderEvent } from './types/liquidity';
import { BinanceService } from './services/binanceService';
import { CandleAggregator, isSubMinute } from './services/candleAggregator';
import { TradeClusterEngine } from './services/tradeClusterEngine';
import { LiquidityEngine } from './services/liquidityEngine';
import { audioAlertService } from './services/audioAlert';
import { TradingViewHeader } from './components/Header/TradingViewHeader';
import { CanvasChart } from './components/Chart/CanvasChart';
import { RightActionDock, RightDockPanel } from './components/Dock/RightActionDock';
import { TVStatusBar } from './components/Footer/TVStatusBar';
import { ChartSettingsModal } from './components/Settings/ChartSettingsModal';
import { SettingsStorage } from './services/settingsStorage';
import { ChartAppearanceSettings, ChartPreset } from './types/settings';
import { DrawingItem, DrawingToolType } from './types/drawing';

// Historical aggTrades to preload (~1h of XAUUSDT flow); 1000 per REST page
const HISTORY_TRADES = 20_000;

export function App() {
  const [symbol, setSymbol] = useState<MarketSymbol>('XAUUSDT');
  const [broker] = useState<Broker>('binance');
  const [timeframe, setTimeframe] = useState<Timeframe>('1s');
  const [ticker, setTicker] = useState<MarketTicker | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');
  const [candles, setCandles] = useState<Candle[]>([]);
  const [bigTrades, setBigTrades] = useState<BigTrade[]>([]);
  const [recentTrades, setRecentTrades] = useState<RawTrade[]>([]);
  const [orderBook, setOrderBook] = useState<OrderBookState | null>(null);

  // Local-First Chart Appearance, Drawings & Presets State
  const [settings, setSettings] = useState<ChartAppearanceSettings>(() => SettingsStorage.loadSettings());
  const [drawings, setDrawings] = useState<DrawingItem[]>(() => SettingsStorage.loadDrawings());
  const [presets, setPresets] = useState<ChartPreset[]>(() => SettingsStorage.loadPresets());
  const [activeDrawingTool, setActiveDrawingTool] = useState<DrawingToolType>('select');
  const [drawingColor, setDrawingColor] = useState<string>('#f59e0b');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [resetViewTrigger, setResetViewTrigger] = useState<number>(0);

  // Big Trade and Audio Settings
  const [bigTradeThreshold, setBigTradeThreshold] = useState<number>(2.0); // Starts at 2.0 contracts
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Liquidity Tool Settings
  const [showLimitWalls, setShowLimitWalls] = useState<boolean>(true);
  const [showSLTPPools, setShowSLTPPools] = useState<boolean>(true);
  const [showSweptMarkers, setShowSweptMarkers] = useState<boolean>(true);
  const [measureToolActive, setMeasureToolActive] = useState<boolean>(false);

  // Liquidity Data
  const [limitWalls, setLimitWalls] = useState<RestingLimitWall[]>([]);
  const [liquidityPools, setLiquidityPools] = useState<LiquidityPool[]>([]);
  const [sweptEvents, setSweptEvents] = useState<SweptOrderEvent[]>([]);

  // Key-absorption alerts (live only: events after the latest history load)
  const [absorbAlerts, setAbsorbAlerts] = useState<SweptOrderEvent[]>([]);
  const notifiedAbsorbRef = useRef<Set<string>>(new Set());
  const liveSinceRef = useRef<number>(Date.now());

  // Right Action Dock Panel: 'dom' | 'tape' | 'liquidity' | 'stats' | null
  const [activeRightPanel, setActiveRightPanel] = useState<RightDockPanel>('dom');

  // Order Flow metrics
  const [sessionBuyVol, setSessionBuyVol] = useState<number>(0);
  const [sessionSellVol, setSessionSellVol] = useState<number>(0);
  const [tradeCount, setTradeCount] = useState<number>(0);
  const [depthCount, setDepthCount] = useState<number>(0);
  const [dataRevision, setDataRevision] = useState(0);

  // Engines
  const liquidityEngine = useMemo(() => new LiquidityEngine(0.50), []);
  const clusterEngineRef = useRef<TradeClusterEngine>(new TradeClusterEngine(2.0));
  const thresholdRef = useRef<number>(2.0);
  const aggregatorRef = useRef<CandleAggregator | null>(null);
  const activeServiceRef = useRef<BinanceService | null>(null);

  // High-performance micro-batching buffer refs (prevents UI freeze under 1000+ trades/sec)
  const pendingRecentTradesRef = useRef<RawTrade[]>([]);
  const pendingBuyVolRef = useRef<number>(0);
  const pendingSellVolRef = useRef<number>(0);
  const pendingTradeCountRef = useRef<number>(0);
  const pendingLastPriceRef = useRef<number>(0);
  const pendingCandlesRef = useRef<Candle[]>([]);
  const hasPendingCandlesRef = useRef<boolean>(false);
  const hasPendingBigTradesRef = useRef<boolean>(false);
  const hasPendingLiquidityRef = useRef<boolean>(false);

  // Initialize Candle Aggregator
  useEffect(() => {
    aggregatorRef.current = new CandleAggregator(timeframe, (updatedCandles) => {
      pendingCandlesRef.current = updatedCandles;
      hasPendingCandlesRef.current = true;
      liquidityEngine.processCandles(updatedCandles);
      hasPendingLiquidityRef.current = true;
    });
  }, [liquidityEngine]);

  // Micro-batch flush timer: updates React state at smooth 20 FPS (every 50ms)
  useEffect(() => {
    const interval = setInterval(() => {
      if (hasPendingCandlesRef.current) {
        hasPendingCandlesRef.current = false;
        setCandles([...pendingCandlesRef.current]);
      }
      if (hasPendingBigTradesRef.current) {
        hasPendingBigTradesRef.current = false;
        setBigTrades([...clusterEngineRef.current.getBigTrades()]);
      }
      if (hasPendingLiquidityRef.current) {
        hasPendingLiquidityRef.current = false;
        setLimitWalls([...liquidityEngine.getLimitWalls()]);
        setLiquidityPools([...liquidityEngine.getLiquidityPools()]);
        const events = liquidityEngine.getSweptEvents();
        setSweptEvents([...events]);

        const fresh = events.filter(
          (e) => e.significant && e.time >= liveSinceRef.current && !notifiedAbsorbRef.current.has(e.id)
        );
        if (fresh.length > 0) {
          fresh.forEach((e) => notifiedAbsorbRef.current.add(e.id));
          if (notifiedAbsorbRef.current.size > 500) {
            notifiedAbsorbRef.current = new Set([...notifiedAbsorbRef.current].slice(-200));
          }
          setAbsorbAlerts((prev) => [...fresh, ...prev].slice(0, 3));
          // Aggressor was selling and got absorbed -> price turned up (and vice versa)
          audioAlertService.playAbsorptionAlert(fresh[0].aggressorSide === 'sell');
          fresh.forEach((e) => {
            setTimeout(() => setAbsorbAlerts((prev) => prev.filter((a) => a.id !== e.id)), 12_000);
          });
        }
      }
      if (pendingRecentTradesRef.current.length > 0) {
        const batch = pendingRecentTradesRef.current;
        pendingRecentTradesRef.current = [];
        setRecentTrades((prev) => [...batch, ...prev].slice(0, 250));
      }
      if (pendingBuyVolRef.current > 0) {
        const v = pendingBuyVolRef.current;
        pendingBuyVolRef.current = 0;
        setSessionBuyVol((prev) => prev + v);
      }
      if (pendingSellVolRef.current > 0) {
        const v = pendingSellVolRef.current;
        pendingSellVolRef.current = 0;
        setSessionSellVol((prev) => prev + v);
      }
      if (pendingTradeCountRef.current > 0) {
        const c = pendingTradeCountRef.current;
        pendingTradeCountRef.current = 0;
        setTradeCount((prev) => prev + c);
      }
      // Keep ticker price live from the trade stream (the @ticker stream only
      // pushes ~1/s and may drop); recompute 24h change against the implied open.
      if (pendingLastPriceRef.current > 0) {
        const p = pendingLastPriceRef.current;
        pendingLastPriceRef.current = 0;
        setTicker((prev) => {
          if (!prev || prev.price === p) return prev;
          const open24h = prev.price - prev.change24h;
          const change24h = p - open24h;
          return {
            ...prev,
            price: p,
            high24h: Math.max(prev.high24h, p),
            low24h: Math.min(prev.low24h, p),
            change24h,
            changePercent24h: open24h > 0 ? (change24h / open24h) * 100 : prev.changePercent24h,
          };
        });
      }
    }, 50);

    return () => clearInterval(interval);
  }, [liquidityEngine]);

  // Update threshold in cluster engine
  const handleThresholdChange = (val: number) => {
    thresholdRef.current = val;
    setBigTradeThreshold(val);
    const updated = clusterEngineRef.current.setThreshold(val);
    setBigTrades([...updated]);
  };

  // Switch active asset (Gold, NASDAQ QQQ, S&P 500, etc.)
  const handleSelectSymbol = (newSymbol: MarketSymbol) => {
    if (newSymbol === symbol) return;
    setSymbol(newSymbol);
    const asset = ASSET_MAP[newSymbol];
    if (asset) {
      handleThresholdChange(asset.defaultBigTradeThreshold);
      liquidityEngine.setTickSize(asset.tickSize);
    }
  };

  // Load historical candles and load historical trade balls
  useEffect(() => {
    if (!aggregatorRef.current) return;
    aggregatorRef.current.setTimeframe(timeframe);

    const loadData = async () => {
      if (!activeServiceRef.current) return;

      let loadedCandles: Candle[] = [];
      let loadedTrades: RawTrade[] = [];

      if (isSubMinute(timeframe)) {
        // 1. Fetch multi-batch trades (high resolution tick history)
        const trades = await activeServiceRef.current.fetchHistoricalTrades(HISTORY_TRADES);
        loadedTrades = trades;
        const tradeCandles = CandleAggregator.aggregateTrades(trades, timeframe);

        // 2. Also fetch 1m klines (prior 15-20 minutes)
        const klines1m = await activeServiceRef.current.fetchHistoricalKlines('1m', 1500);

        // 3. Synthesize cleanly into uniform sub-minute candles
        loadedCandles = CandleAggregator.mergeKlinesWithSubMinute(klines1m, tradeCandles, timeframe);

        const clusters = clusterEngineRef.current.setHistoricalTrades(trades.slice(-3000));
        setBigTrades([...clusters]);
        setRecentTrades(trades.slice(-250).reverse()); // newest first, like live onTrade
      } else {
        // Standard timeframes: fetch up to 1500 historical candles (25 hours to 2+ weeks)
        loadedCandles = await activeServiceRef.current.fetchHistoricalKlines(timeframe, 1500);
        const trades = await activeServiceRef.current.fetchHistoricalTrades(HISTORY_TRADES);
        loadedTrades = trades;
        const clusters = clusterEngineRef.current.setHistoricalTrades(trades.slice(-3000));
        setBigTrades([...clusters]);
        setRecentTrades(trades.slice(-250).reverse()); // newest first, like live onTrade
      }

      let initialBook: OrderBookState | null = orderBook;
      const deep = await activeServiceRef.current.fetchDepthSnapshot(500);
      if (deep) {
        initialBook = deep;
        setOrderBook(deep);
      }

      if (loadedCandles.length > 0) {
        aggregatorRef.current?.setCandles(loadedCandles);
        setCandles([...loadedCandles]);
        liquidityEngine.processCandles(loadedCandles, true);
        if (loadedTrades.length > 0) {
          liquidityEngine.setHistoricalTrades(loadedTrades);
          // Rebuild with tick data available so swept volume uses real trades beyond the level
          liquidityEngine.processCandles(loadedCandles, true);
        }
        if (initialBook) {
          liquidityEngine.processOrderBook(initialBook);
        }
        hasPendingLiquidityRef.current = true;
      }
      // Anything flagged from here on is live and may alert
      liveSinceRef.current = Date.now();
    };

    loadData();
  }, [symbol, timeframe, broker, dataRevision, liquidityEngine]);

  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    audioAlertService.setMuted(next);
  };

  // Connect to Broker Data Stream (Real-Time WebSocket)
  useEffect(() => {
    setBigTrades([]);
    setRecentTrades([]);
    setSessionBuyVol(0);
    setSessionSellVol(0);
    setTradeCount(0);
    setDepthCount(0);

    const onDepth = (state: OrderBookState) => {
      setOrderBook(state);
      liquidityEngine.processOrderBook(state);
      hasPendingLiquidityRef.current = true;
      setDepthCount((prev) => prev + 1);
    };

    const onTrade = (trade: RawTrade) => {
      // 1. Live candle aggregation (synchronous in-memory)
      aggregatorRef.current?.processTrade(trade);

      // 2. Consume / reduce resting limit orders at trade price & detect order sweeps
      liquidityEngine.processTrade(trade);
      hasPendingLiquidityRef.current = true;

      // 3. DOM volume profile buffer
      pendingRecentTradesRef.current.unshift(trade);

      // 4. Update volume metrics buffer
      if (trade.side === 'buy') {
        pendingBuyVolRef.current += trade.qty;
      } else {
        pendingSellVolRef.current += trade.qty;
      }
      pendingTradeCountRef.current += 1;
      pendingLastPriceRef.current = trade.price;

      // 5. Process trade in Cluster Engine -> produces 3D Big Trade Spheres (Balls)
      const bt = clusterEngineRef.current.processTrade(trade);
      if (bt) {
        hasPendingBigTradesRef.current = true;
        if (bt.qty >= thresholdRef.current) {
          audioAlertService.playBigTradeChime(trade.side, bt.notional);
        }
      }
    };

    const onTicker = (tick: MarketTicker) => {
      setTicker(tick);
    };

    const onStatusChange = (status: 'connecting' | 'connected' | 'disconnected' | 'error') => {
      setConnectionStatus(status);
    };

    const service = new BinanceService({ onDepth, onTrade, onTicker, onStatusChange }, symbol);
    activeServiceRef.current = service;
    service.connect();
    setDataRevision((revision) => revision + 1);

    return () => {
      if (activeServiceRef.current) {
        activeServiceRef.current.disconnect();
        activeServiceRef.current = null;
      }
    };
  }, [symbol, broker, liquidityEngine]);



  const handleUpdateDrawings = (newDrawings: DrawingItem[]) => {
    setDrawings(newDrawings);
    SettingsStorage.saveDrawings(newDrawings);
  };

  const handleUpdateSettings = (newSettings: ChartAppearanceSettings) => {
    setSettings(newSettings);
    SettingsStorage.saveSettings(newSettings);
  };

  const handleApplyPreset = (preset: ChartPreset) => {
    handleUpdateSettings(preset.settings);
  };

  const handleRefreshPresets = () => {
    setPresets(SettingsStorage.loadPresets());
  };

  const handleQuickToggleIndicator = (key: 'ema9' | 'ema21' | 'ema50' | 'ema200' | 'vwap' | 'bollinger' | 'volumeProfile' | 'cvd') => {
    const next: ChartAppearanceSettings = {
      ...settings,
      indicators: {
        ...settings.indicators,
        [key]: {
          ...settings.indicators[key],
          enabled: !settings.indicators[key].enabled,
        },
      },
    };
    handleUpdateSettings(next);
  };

  const handleResetView = () => {
    setResetViewTrigger(Date.now());
  };

  const currentPrice = ticker ? ticker.price : (orderBook?.bestBid || 0);

  return (
    <div className="w-screen h-screen bg-[#131722] flex flex-col overflow-hidden select-none font-sans text-[#d1d4dc]">
      {/* 1. TradingView Top Header */}
      <TradingViewHeader
        symbol={symbol}
        onSelectSymbol={handleSelectSymbol}
        timeframe={timeframe}
        onSelectTimeframe={setTimeframe}
        ticker={ticker}
        connectionStatus={connectionStatus}
        bigTradeThreshold={bigTradeThreshold}
        onChangeThreshold={handleThresholdChange}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        showLimitWalls={showLimitWalls}
        onToggleLimitWalls={() => setShowLimitWalls(!showLimitWalls)}
        showSLTPPools={showSLTPPools}
        onToggleSLTPPools={() => setShowSLTPPools(!showSLTPPools)}
        showSweptMarkers={showSweptMarkers}
        onToggleSweptMarkers={() => setShowSweptMarkers(!showSweptMarkers)}
        onResetView={handleResetView}
        onOpenSettings={() => setIsSettingsOpen(true)}
        indicators={settings.indicators}
        onToggleIndicator={handleQuickToggleIndicator}
      />

      {/* 2. Main Workspace (Canvas Chart + Right Collapsible Action Dock) */}
      <div className="flex-1 flex flex-row overflow-hidden w-full h-full min-h-0 bg-[#131722]">
          {/* High-Performance Canvas Chart */}
          <main className="flex-1 min-w-0 h-full relative overflow-hidden bg-[#11151c]">
            {/* Key absorption alerts */}
            {absorbAlerts.length > 0 && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 z-40 flex flex-col gap-1 items-center pointer-events-none">
                {absorbAlerts.map((a) => {
                  const up = a.aggressorSide === 'sell';
                  return (
                    <div
                      key={a.id}
                      onClick={() => setAbsorbAlerts((prev) => prev.filter((x) => x.id !== a.id))}
                      className="pointer-events-auto cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-[3px] border-2 border-[#f59e0b] bg-[#1c1508]/95 shadow-lg text-[11px] font-mono text-amber-100"
                      title="Click to dismiss"
                    >
                      <span className="text-[13px]">🛡️</span>
                      <span className="font-bold text-amber-300">KEY ABSORPTION</span>
                      <span className={up ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                        {a.aggressorSide.toUpperCase()} {a.volume.toFixed(1)} XAU absorbed @ ${a.price.toFixed(2)} → {up ? '↑' : '↓'}
                      </span>
                      {a.significanceTags?.map((t) => (
                        <span key={t} className="px-1 rounded-[2px] bg-amber-500/20 text-amber-200 text-[10px]">
                          {t}
                        </span>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
            <CanvasChart
              candles={candles}
              bigTrades={bigTrades}
              orderBook={orderBook}
              timeframe={timeframe}
              currentPrice={currentPrice}
              limitWalls={limitWalls}
              liquidityPools={liquidityPools}
              sweptEvents={sweptEvents}
              showLimitWalls={showLimitWalls}
              showSLTPPools={showSLTPPools}
              showSweptMarkers={showSweptMarkers}
              measureToolActive={measureToolActive}
              liquidityEngine={liquidityEngine}
              onToggleMeasureTool={() => setMeasureToolActive(!measureToolActive)}
              settings={settings}
              drawings={drawings}
              onUpdateDrawings={handleUpdateDrawings}
              activeDrawingTool={activeDrawingTool}
              onSelectDrawingTool={setActiveDrawingTool}
              drawingColor={drawingColor}
              onDrawingColorChange={setDrawingColor}
              resetViewTrigger={resetViewTrigger}
              symbol={symbol}
            />
          </main>

          {/* 3. TradingView Right Collapsible Action Dock (DOM, Trades, Liquidity, Stats) */}
          <RightActionDock
            activePanel={activeRightPanel}
            onTogglePanel={setActiveRightPanel}
            symbol={symbol}
            currentPrice={currentPrice}
            orderBook={orderBook}
            recentTrades={recentTrades}
            bigTrades={bigTrades}
            limitWalls={limitWalls}
            liquidityPools={liquidityPools}
            sweptEvents={sweptEvents}
            sessionBuyVol={sessionBuyVol}
            sessionSellVol={sessionSellVol}
            tradeCount={tradeCount}
            depthCount={depthCount}
          />
        </div>

      {/* 4. TradingView Bottom Status Bar */}
      <TVStatusBar symbol={symbol} connectionStatus={connectionStatus} />

      {/* 5. Chart Settings Modal */}
      <ChartSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleUpdateSettings}
        presets={presets}
        onApplyPreset={handleApplyPreset}
        onRefreshPresets={handleRefreshPresets}
      />
    </div>
  );
}

export default App;
