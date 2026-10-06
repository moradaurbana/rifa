import React, { useState, useMemo } from 'react';
import { Search, Sparkles, Filter, X, ArrowRight, Settings } from 'lucide-react';
import { RaffleSlot } from '../types';
import { RaffleSlotCard } from './RaffleSlotCard';
import { formatBRL } from '../utils/formatters';

interface RaffleGridProps {
  slots: RaffleSlot[];
  selectedSlots: RaffleSlot[];
  mySlotIds: number[];
  pricePerTicket: number;
  isAdmin: boolean;
  onToggleSlot: (slot: RaffleSlot) => void;
  onAdminEditSlot?: (slot: RaffleSlot) => void;
  onClearSelection: () => void;
  onSelectRandom: () => void;
  onProceedToCheckout: () => void;
}

export const RaffleGrid: React.FC<RaffleGridProps> = ({
  slots,
  selectedSlots,
  mySlotIds,
  pricePerTicket,
  isAdmin,
  onToggleSlot,
  onAdminEditSlot,
  onClearSelection,
  onSelectRandom,
  onProceedToCheckout,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'available' | 'taken' | 'my'>('all');

  const availableCount = slots.filter((s) => s.status === 'available').length;
  const takenCount = slots.length - availableCount;
  const myCount = slots.filter((s) => mySlotIds.includes(s.id)).length;

  const filteredSlots = useMemo(() => {
    return slots.filter((slot) => {
      // Filter tab
      if (filterMode === 'available' && slot.status !== 'available') return false;
      if (filterMode === 'taken' && slot.status === 'available') return false;
      if (filterMode === 'my' && !mySlotIds.includes(slot.id)) return false;

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchesName = slot.name.toLowerCase().includes(query);
        const matchesId = String(slot.id).includes(query);
        const matchesBuyer = slot.buyerName?.toLowerCase().includes(query);
        return matchesName || matchesId || matchesBuyer;
      }

      return true;
    });
  }, [slots, filterMode, searchTerm, mySlotIds]);

  const selectedIds = useMemo(() => new Set(selectedSlots.map((s) => s.id)), [selectedSlots]);
  const totalSelectedPrice = selectedSlots.length * pricePerTicket;

  return (
    <div className="space-y-6">
      {/* Apple-style Toolbar & Segmented Filter */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-black/[0.06] shadow-[0_2px_16px_rgba(0,0,0,0.03)] space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#86868b]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar nome na cartela ou número..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-[#f5f5f7] border-0 focus:bg-white focus:ring-2 focus:ring-[#0071e3]/20 text-sm text-[#1d1d1f] placeholder:text-[#86868b] outline-none transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#86868b] hover:text-[#1d1d1f] p-1"
                title="Limpar busca"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Actions & Surpresinha */}
          <div className="flex items-center gap-2">
            <button
              onClick={onSelectRandom}
              disabled={availableCount === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-black/[0.04] hover:bg-black/[0.08] disabled:opacity-40 text-[#1d1d1f] text-xs font-semibold transition-all active:scale-95 shrink-0"
              title="Escolher aleatoriamente um nome disponível"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Surpresinha (Aleatório)</span>
            </button>
          </div>
        </div>

        {/* Apple Segmented Control */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-black/[0.04]">
          <div className="inline-flex p-1 bg-black/[0.04] rounded-xl gap-1 overflow-x-auto max-w-full">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                filterMode === 'all'
                  ? 'bg-white text-[#1d1d1f] shadow-xs'
                  : 'text-[#86868b] hover:text-[#1d1d1f]'
              }`}
            >
              Todos (100)
            </button>

            <button
              onClick={() => setFilterMode('available')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                filterMode === 'available'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-[#86868b] hover:text-[#1d1d1f]'
              }`}
            >
              Disponíveis ({availableCount})
            </button>

            <button
              onClick={() => setFilterMode('taken')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                filterMode === 'taken'
                  ? 'bg-white text-amber-800 shadow-xs'
                  : 'text-[#86868b] hover:text-[#1d1d1f]'
              }`}
            >
              Ocupados ({takenCount})
            </button>

            {myCount > 0 && (
              <button
                onClick={() => setFilterMode('my')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  filterMode === 'my'
                    ? 'bg-white text-purple-900 shadow-xs'
                    : 'text-[#86868b] hover:text-[#1d1d1f]'
                }`}
              >
                Meus Nomes ({myCount})
              </button>
            )}
          </div>

          {/* Clean Apple Pastel Legend */}
          <div className="flex items-center gap-2 text-xs text-[#86868b] flex-wrap">
            <span className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider hidden sm:inline mr-1">
              Legenda:
            </span>
            <span className="flex items-center gap-1.5 font-bold text-emerald-950 bg-[#ecfdf5] px-2.5 py-1 rounded-lg border border-emerald-300/70 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Livre (Pastel Verde)
            </span>
            <span className="flex items-center gap-1.5 font-bold text-amber-950 bg-[#fefce8] px-2.5 py-1 rounded-lg border border-amber-300/80 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Reservado (Pastel Amarelo)
            </span>
            <span className="flex items-center gap-1.5 font-bold text-purple-950 bg-[#faf5ff] px-2.5 py-1 rounded-lg border border-purple-200 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-purple-600" />
              Pago (Pastel Lilás)
            </span>
            <span className="flex items-center gap-1.5 font-bold text-white bg-[#0071e3] px-2.5 py-1 rounded-lg shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-white" />
              Selecionado
            </span>
          </div>
        </div>
      </div>

      {/* Grid of 100 slots */}
      {filteredSlots.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-black/[0.06]">
          <div className="text-3xl mb-2">🔍</div>
          <h3 className="text-base font-semibold text-[#1d1d1f]">Nenhum nome encontrado</h3>
          <p className="text-xs text-[#86868b] mt-1 max-w-sm mx-auto">
            Não encontramos resultados para sua busca. Experimente limpar os filtros.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterMode('all');
            }}
            className="mt-4 px-4 py-2 bg-[#1d1d1f] text-white rounded-full text-xs font-medium"
          >
            Ver todos os 100 nomes
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3">
          {filteredSlots.map((slot) => (
            <RaffleSlotCard
              key={slot.id}
              slot={slot}
              isSelected={selectedIds.has(slot.id)}
              isMySlot={mySlotIds.includes(slot.id)}
              isAdmin={isAdmin}
              onToggleSelect={onToggleSlot}
              onAdminEditSlot={onAdminEditSlot}
            />
          ))}
        </div>
      )}

      {/* Floating Apple-style Dock Checkout Bar */}
      {selectedSlots.length > 0 && (
        <div className="fixed bottom-5 left-4 right-4 max-w-2xl mx-auto z-40 animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-[#1d1d1f]/95 text-white backdrop-blur-2xl p-4 sm:p-4.5 rounded-2xl shadow-2xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="w-10 h-10 rounded-xl bg-[#0071e3] text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">
                {selectedSlots.length}
              </div>
              <div className="truncate flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-white/70 uppercase tracking-wider">
                    {selectedSlots.length === 1 ? '1 Nome Selecionado' : `${selectedSlots.length} Nomes Selecionados`}
                  </span>
                  <button
                    onClick={onClearSelection}
                    className="text-xs text-white/50 hover:text-white underline"
                  >
                    Limpar
                  </button>
                </div>
                <div className="text-sm font-semibold text-white truncate max-w-xs sm:max-w-sm">
                  {selectedSlots.map((s) => s.name).join(', ')}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-white/10">
              <div className="text-left sm:text-right">
                <div className="text-[10px] text-white/60">Total</div>
                <div className="text-base sm:text-lg font-bold text-white">
                  {formatBRL(totalSelectedPrice)}
                </div>
              </div>

              <button
                onClick={onProceedToCheckout}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white font-semibold text-xs tracking-tight shadow-sm transition-all active:scale-95"
              >
                <span>Continuar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
