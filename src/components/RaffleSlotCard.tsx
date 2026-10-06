import React from 'react';
import { Check, Lock, Clock, Sparkles, Pencil } from 'lucide-react';
import { RaffleSlot } from '../types';

interface RaffleSlotCardProps {
  slot: RaffleSlot;
  isSelected: boolean;
  isMySlot: boolean;
  isAdmin: boolean;
  onToggleSelect: (slot: RaffleSlot) => void;
  onAdminEditSlot?: (slot: RaffleSlot) => void;
  disabled?: boolean;
}

export const RaffleSlotCard: React.FC<RaffleSlotCardProps> = ({
  slot,
  isSelected,
  isMySlot,
  isAdmin,
  onToggleSelect,
  onAdminEditSlot,
  disabled,
}) => {
  const isAvailable = slot.status === 'available';
  const isReserved = slot.status === 'reserved';
  const isPaid = slot.status === 'paid';

  const handleClick = (e: React.MouseEvent) => {
    if (isAdmin && onAdminEditSlot) {
      e.preventDefault();
      onAdminEditSlot(slot);
      return;
    }

    if (!isAvailable || disabled) return;
    onToggleSelect(slot);
  };

  const handleAdminEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAdminEditSlot) {
      onAdminEditSlot(slot);
    }
  };

  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick(e as any);
        }
      }}
      aria-label={`Nome ${slot.id}: ${slot.name} - ${
        isAvailable ? 'Disponível' : isPaid ? 'Pago' : 'Reservado'
      }`}
      className={`group relative rounded-2xl p-3 sm:p-3.5 transition-all duration-200 select-none flex flex-col justify-between min-h-[96px] sm:min-h-[104px] text-left outline-none ${
        isSelected
          ? 'bg-[#0071e3] text-white shadow-lg ring-4 ring-[#0071e3]/25 scale-[1.02] cursor-pointer'
          : isAvailable
          ? 'bg-[#ecfdf5] hover:bg-[#d1fae5] border border-emerald-300/70 text-emerald-950 shadow-2xs hover:shadow-md hover:-translate-y-0.5 cursor-pointer active:scale-[0.98]'
          : isReserved
          ? 'bg-[#fefce8] border border-amber-300/80 text-amber-950 cursor-not-allowed shadow-2xs'
          : 'bg-[#faf5ff] border border-purple-200 text-purple-950 cursor-not-allowed shadow-2xs'
      } ${isAdmin ? '!cursor-pointer hover:ring-2 hover:ring-[#0071e3]/40' : ''}`}
    >
      {/* Top Row: Number ID & Status Dot/Pill */}
      <div className="flex items-center justify-between gap-1 w-full">
        <span
          className={`font-mono text-[11px] font-bold px-1.5 py-0.5 rounded-md ${
            isSelected
              ? 'bg-white/20 text-white'
              : isAvailable
              ? 'bg-emerald-100/90 text-emerald-800'
              : isReserved
              ? 'bg-amber-100/90 text-amber-800'
              : 'bg-purple-100/90 text-purple-800'
          }`}
        >
          #{String(slot.id).padStart(2, '0')}
        </span>

        {/* Status / Actions indicator */}
        <div className="flex items-center gap-1">
          {isAdmin && (
            <button
              type="button"
              onClick={handleAdminEditClick}
              className={`p-1 rounded-md text-[10px] transition-all ${
                isSelected
                  ? 'bg-white/20 text-white'
                  : 'bg-black/5 hover:bg-black/10 text-[#1d1d1f]'
              }`}
              title="Editar status deste nome (Admin)"
            >
              <Pencil className="w-3 h-3" />
            </button>
          )}

          {isSelected && !isAdmin && (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold bg-white text-[#0071e3] px-1.5 py-0.5 rounded-full shadow-xs">
              <Check className="w-3 h-3 stroke-[3]" /> Escolhido
            </span>
          )}

          {!isSelected && isAvailable && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100/60 px-1.5 py-0.5 rounded-md">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              Livre
            </span>
          )}

          {isReserved && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-900 bg-amber-100/80 px-1.5 py-0.5 rounded-md">
              <Clock className="w-2.5 h-2.5" />
              Reservado
            </span>
          )}

          {isPaid && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-900 bg-purple-100/80 px-1.5 py-0.5 rounded-md">
              <Lock className="w-2.5 h-2.5" />
              Pago
            </span>
          )}
        </div>
      </div>

      {/* Main Name Headline */}
      <div className="my-1.5">
        <h4
          className={`font-black text-sm sm:text-base tracking-tight truncate ${
            isSelected
              ? 'text-white'
              : isAvailable
              ? 'text-emerald-950 group-hover:text-emerald-800'
              : isReserved
              ? 'text-amber-950'
              : 'text-purple-900 line-through decoration-purple-300'
          }`}
          title={slot.name}
        >
          {slot.name}
        </h4>
      </div>

      {/* Footer Info / Buyer name */}
      <div className="text-[11px] truncate">
        {isAdmin ? (
          <span className="text-[#0071e3] font-semibold group-hover:underline">
            {slot.status === 'available'
              ? 'Clique p/ alterar status'
              : slot.buyerName
              ? `Status: ${slot.status === 'paid' ? 'Pago' : 'Reservado'} (${slot.buyerName})`
              : `Status: ${slot.status === 'paid' ? 'Pago' : 'Reservado'}`}
          </span>
        ) : isSelected ? (
          <span className="text-white/90 font-medium">Toque para desmarcar</span>
        ) : isAvailable ? (
          <span className="text-emerald-700/80 font-medium transition-colors">
            Toque para escolher
          </span>
        ) : isMySlot ? (
          <span className="inline-flex items-center gap-1 font-bold text-amber-900 bg-amber-200/60 px-1 rounded">
            <Sparkles className="w-2.5 h-2.5" /> Seu nome
          </span>
        ) : slot.buyerName ? (
          <span className="text-slate-600 truncate block" title={`Por: ${slot.buyerName}`}>
            {isPaid ? 'Comprador: ' : 'Reservado: '}
            <strong className="text-slate-900 font-bold">{slot.buyerName}</strong>
          </span>
        ) : (
          <span className="text-slate-500 font-medium">Indisponível</span>
        )}
      </div>
    </div>
  );
};
