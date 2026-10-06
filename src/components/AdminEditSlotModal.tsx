import React, { useState, useEffect } from 'react';
import { X, Check, Lock, Clock, Sparkles, User, Phone, FileText, Trash2 } from 'lucide-react';
import { RaffleSlot } from '../types';
import { formatPhone } from '../utils/formatters';

interface AdminEditSlotModalProps {
  isOpen: boolean;
  slot: RaffleSlot | null;
  adminPin: string;
  onClose: () => void;
  onRefreshData: () => Promise<void>;
  onSuccessMessage: (msg: string) => void;
}

export const AdminEditSlotModal: React.FC<AdminEditSlotModalProps> = ({
  isOpen,
  slot,
  adminPin,
  onClose,
  onRefreshData,
  onSuccessMessage,
}) => {
  const [name, setName] = useState('');
  const [status, setStatus] = useState<'available' | 'reserved' | 'paid'>('available');
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerNotes, setBuyerNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slot) {
      setName(slot.name);
      setStatus(slot.status);
      setBuyerName(slot.buyerName || '');
      setBuyerPhone(slot.buyerPhone || '');
      setBuyerNotes(slot.buyerNotes || '');
      setError(null);
    }
  }, [slot]);

  if (!isOpen || !slot) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('O nome na cartela não pode estar vazio.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/raffle/admin/edit-slot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminPin,
          slotId: slot.id,
          name: name.trim(),
          status,
          buyerName: status === 'available' ? '' : buyerName.trim(),
          buyerPhone: status === 'available' ? '' : buyerPhone.trim(),
          buyerNotes: status === 'available' ? '' : buyerNotes.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao atualizar o slot.');
      }

      await onRefreshData();
      onSuccessMessage(`Slot #${slot.id} "${name.trim()}" atualizado para ${status === 'available' ? 'Livre' : status === 'paid' ? 'Pago' : 'Reservado'}!`);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar alterações.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMakeAvailable = async () => {
    if (!confirm(`Deseja realmente liberar o slot #${slot.id} ("${slot.name}") e remover dados do comprador?`)) {
      return;
    }
    setStatus('available');
    setBuyerName('');
    setBuyerPhone('');
    setBuyerNotes('');

    setIsLoading(true);
    try {
      const res = await fetch('/api/raffle/admin/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminPin,
          slotId: slot.id,
          status: 'available',
        }),
      });
      if (res.ok) {
        await onRefreshData();
        onSuccessMessage(`Slot #${slot.id} agora está Livre e Disponível na cartela!`);
        onClose();
      }
    } catch {
      setError('Erro ao liberar slot');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#fbfbfd] text-[#1d1d1f] rounded-3xl max-w-md w-full shadow-2xl border border-black/5 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Apple Style Modal Header */}
        <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-black/[0.06]">
          <div className="flex items-center gap-2.5">
            <span className="font-mono font-bold text-xs bg-black/5 text-[#86868b] px-2 py-1 rounded-md">
              #{String(slot.id).padStart(2, '0')}
            </span>
            <div>
              <h3 className="text-base font-semibold tracking-tight text-[#1d1d1f]">
                Editar Nome da Cartela
              </h3>
              <p className="text-[12px] text-[#86868b]">Controle exclusivo de administrador</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center text-[#86868b] hover:text-[#1d1d1f] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          {error && (
            <div className="p-3 text-xs rounded-xl bg-rose-50 border border-rose-200 text-rose-800">
              {error}
            </div>
          )}

          {/* Slot Name */}
          <div>
            <label className="block text-[11px] font-semibold text-[#86868b] uppercase tracking-wider mb-1.5">
              Nome na Cartela Física
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Afonso, Coragem, Amor..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/10 focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/10 text-sm font-semibold outline-none transition-all"
            />
          </div>

          {/* Status Segmented Control (Apple iOS Style) */}
          <div>
            <label className="block text-[11px] font-semibold text-[#86868b] uppercase tracking-wider mb-1.5">
              Estado do Nome
            </label>
            <div className="grid grid-cols-3 gap-1 p-1 bg-black/[0.05] rounded-xl border border-black/[0.04]">
              <button
                type="button"
                onClick={() => setStatus('available')}
                className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                  status === 'available'
                    ? 'bg-white text-emerald-800 shadow-sm border border-black/[0.04]'
                    : 'text-[#86868b] hover:text-[#1d1d1f]'
                }`}
              >
                🟢 Livre
              </button>

              <button
                type="button"
                onClick={() => setStatus('reserved')}
                className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                  status === 'reserved'
                    ? 'bg-white text-amber-800 shadow-sm border border-black/[0.04]'
                    : 'text-[#86868b] hover:text-[#1d1d1f]'
                }`}
              >
                🟡 Reservado
              </button>

              <button
                type="button"
                onClick={() => setStatus('paid')}
                className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                  status === 'paid'
                    ? 'bg-white text-purple-900 shadow-sm border border-black/[0.04]'
                    : 'text-[#86868b] hover:text-[#1d1d1f]'
                }`}
              >
                🟣 Pago
              </button>
            </div>
          </div>

          {/* Buyer Details (Shown if reserved or paid) */}
          {status !== 'available' && (
            <div className="p-4 bg-white rounded-2xl border border-black/[0.06] space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider">
                  Dados do Comprador
                </span>
                <span className="text-[11px] text-[#86868b]">
                  {status === 'paid' ? 'Pagamento Confirmado' : 'Aguardando Pagamento'}
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#1d1d1f] mb-1">
                  Nome do Participante
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#86868b]" />
                  <input
                    type="text"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    placeholder="Ex: João Silva"
                    className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-black/10 focus:border-[#0071e3] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#1d1d1f] mb-1">
                  Telefone / WhatsApp
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#86868b]" />
                  <input
                    type="text"
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(formatPhone(e.target.value))}
                    placeholder="(11) 98765-4321"
                    className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-black/10 focus:border-[#0071e3] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#1d1d1f] mb-1">
                  Anotações / Origem (Opcional)
                </label>
                <input
                  type="text"
                  value={buyerNotes}
                  onChange={(e) => setBuyerNotes(e.target.value)}
                  placeholder="Ex: Comprou na cartela física de papel"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-black/10 focus:border-[#0071e3] outline-none"
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 space-y-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white font-semibold text-xs tracking-tight shadow-sm transition-all active:scale-[0.99] disabled:opacity-50"
            >
              {isLoading ? 'Salvando...' : 'Salvar Alterações'}
            </button>

            {slot.status !== 'available' && (
              <button
                type="button"
                onClick={handleMakeAvailable}
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-black/[0.04] hover:bg-rose-50 hover:text-rose-700 text-[#86868b] font-medium text-xs transition-colors"
              >
                Liberar este nome e deixar Disponível
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
