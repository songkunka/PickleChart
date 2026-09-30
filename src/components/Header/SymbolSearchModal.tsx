import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ASSET_MAP, MarketSymbol } from '../../types/market';
import { Search, X } from 'lucide-react';

interface SymbolSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSymbol: MarketSymbol;
  onSelectSymbol: (symbol: MarketSymbol) => void;
}

export const SymbolSearchModal: React.FC<SymbolSearchModalProps> = ({
  isOpen,
  onClose,
  currentSymbol,
  onSelectSymbol,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'crypto' | 'commodities'>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Handle keyboard navigation (Escape to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const assetList = useMemo(() => {
    return Object.values(ASSET_MAP);
  }, []);

  const filteredAssets = useMemo(() => {
    return assetList.filter((asset) => {
      const matchesSearch =
        asset.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.baseAsset.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (selectedCategory === 'crypto') {
        return asset.category.toLowerCase().includes('crypto');
      }
      if (selectedCategory === 'commodities') {
        return (
          asset.category.toLowerCase().includes('metal') ||
          asset.category.toLowerCase().includes('index')
        );
      }
      return true;
    });
  }, [assetList, searchQuery, selectedCategory]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl bg-[#1e222d] border border-[#2a2e39] rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[80vh] text-[#d1d4dc] font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Search Input */}
        <div className="p-3 border-b border-[#2a2e39] flex items-center gap-3 bg-[#131722]">
          <Search className="w-5 h-5 text-[#787b86] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search symbol, currency or name (e.g. BTC, Gold, XAU)..."
            className="w-full bg-transparent text-sm text-[#d1d4dc] placeholder-[#787b86] focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="p-1 text-[#787b86] hover:text-[#d1d4dc] rounded"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded text-[#787b86] hover:text-white hover:bg-[#2a2e39] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-[#2a2e39] bg-[#1e222d] text-xs">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded-full font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-[#2962ff] text-white'
                : 'text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39]'
            }`}
          >
            All Markets
          </button>
          <button
            onClick={() => setSelectedCategory('crypto')}
            className={`px-3 py-1 rounded-full font-medium transition-colors ${
              selectedCategory === 'crypto'
                ? 'bg-[#2962ff] text-white'
                : 'text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39]'
            }`}
          >
            Crypto
          </button>
          <button
            onClick={() => setSelectedCategory('commodities')}
            className={`px-3 py-1 rounded-full font-medium transition-colors ${
              selectedCategory === 'commodities'
                ? 'bg-[#2962ff] text-white'
                : 'text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39]'
            }`}
          >
            Metals & Indices
          </button>
        </div>

        {/* Assets List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#2a2e39]/50">
          {filteredAssets.length === 0 ? (
            <div className="py-12 text-center text-[#787b86] text-sm">
              No matching symbols found.
            </div>
          ) : (
            filteredAssets.map((asset) => {
              const isSelected = asset.symbol === currentSymbol;
              return (
                <div
                  key={asset.symbol}
                  onClick={() => {
                    onSelectSymbol(asset.symbol);
                    onClose();
                  }}
                  className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-[#2962ff]/10 hover:bg-[#2962ff]/20'
                      : 'hover:bg-[#2a2e39]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs bg-gradient-to-br ${asset.bgGradient} text-white shadow-sm`}
                    >
                      {asset.iconLabel}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white font-mono">
                          {asset.symbol}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#2a2e39] text-[#787b86] uppercase font-mono">
                          {asset.badge}
                        </span>
                        {isSelected && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#2962ff] text-white font-medium">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[#787b86] mt-0.5">
                        {asset.name} · {asset.category}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-mono text-[#787b86]">
                      Tick: {asset.tickSize.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-2 border-t border-[#2a2e39] bg-[#131722] text-[11px] text-[#787b86] flex items-center justify-between">
          <span>Tip: Press ESC to close</span>
          <span>Order Flow live feeds via Binance Futures</span>
        </div>
      </div>
    </div>
  );
};
