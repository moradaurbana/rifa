import React from 'react';
import { X, CheckCircle2, Clock, MessageCircle, Copy, Check, Ticket } from 'lucide-react';
import { RaffleConfig, RaffleSlot } from '../types';
import { formatBRL, formatDate, cleanPhone } from '../utils/formatters';
import { CountdownTimer } from './CountdownTimer';

interface MyReservationsModalProps {
  isOpen: boolean;
  slots: RaffleSlot[];
  mySlotIds: number[];
  config: RaffleConfig;
  onClose: () => void;
  onClearHistory: () => void;
}

export const MyReservationsModal: React.FC<MyReservationsModalProps> = ({
  isOpen,
  slots,
  mySlotIds,
  config,
  onClose,
  onClearHistory,
}) => {
  const [copiedPix, setCopiedPix] = React.useState(false);

  if (!isOpen) return null;

  const mySlots = slots.filter((s) => mySlotIds.includes(s.id));
  const totalAmount = mySlots.length * config.pricePerTicket;
  const pendingCount = mySlots.filter((s) => s.status === 'reserved').length;
  const paidCount = mySlots.filter((s) => s.status === 'paid').length;

  const handleCopyPix = () => {
    navigator.clipboard.writeText(config.pixKey);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2000);
  };

  const getWhatsAppLink = () => {
    const rawOrganizerPhone = cleanPhone(config.organizerPhone || '');
    const namesList = mySlots.map((s) => `#${s.id} ${s.name}`).join(', ');
    const message = `Olá! Gostaria de confirmar meus nomes na rifa *${config.title}*:\nNomes: *${namesList}*\nValor: ${formatBRL(
      totalAmount
    )}`;
    return `https://wa.me/55${rawOrganizerPhone}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black">Meus Nomes na Rifa</h3>
              <p className="text-xs text-slate-400">Registrados neste dispositivo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-5">
          {mySlots.length === 0 ? (
            <div className="py-8 text-center text-slate-500">
              <div className="text-3xl mb-2">🎟️</div>
              <h4 className="font-bold text-slate-800">Você ainda não escolheu nenhum nome</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Volte para a cartela e toque em qualquer nome livre para fazer sua reserva.
              </p>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <div className="text-lg font-black text-slate-900">{mySlots.length}</div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Nomes</div>
                </div>
                <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                  <div className="text-lg font-black text-amber-700">{pendingCount}</div>
                  <div className="text-[10px] text-amber-600 uppercase font-bold">Pendentes</div>
                </div>
                <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                  <div className="text-lg font-black text-emerald-700">{paidCount}</div>
                  <div className="text-[10px] text-emerald-600 uppercase font-bold">Confirmados</div>
                </div>
              </div>

              {/* List of slots */}
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {mySlots.map((slot) => (
                  <div
                    key={slot.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white shadow-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-700">
                        #{slot.id}
                      </span>
                      <div>
                        <div className="font-black text-slate-900 text-sm">{slot.name}</div>
                        <div className="text-[10px] text-slate-500">
                          Reservado em: {formatDate(slot.reservedAt)}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      {slot.status === 'paid' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                          <CheckCircle2 className="w-3 h-3" /> Pago
                        </span>
                      ) : (
                        <div className="flex flex-col items-end gap-1">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                            <Clock className="w-3 h-3" /> Pendente
                          </span>
                          {slot.reservedAt && (
                            <CountdownTimer
                              reservedAt={slot.reservedAt}
                              toleranceDays={config.reservationToleranceDays || 3}
                              variant="badge"
                            />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* PIX Reminder if pending */}
              {pendingCount > 0 && (
                <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-900">Pague via PIX para confirmar:</span>
                    <button
                      onClick={handleCopyPix}
                      className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedPix ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copiedPix ? 'Chave Copiada!' : 'Copiar Chave PIX'}
                    </button>
                  </div>
                  <div className="font-mono text-slate-700 bg-white p-2 rounded-lg border border-amber-200 text-[11px] truncate select-all">
                    {config.pixKey} (Telefone Shirley Cristina Ortega)
                  </div>

                  {/* Countdown notice */}
                  <CountdownTimer
                    reservedAt={mySlots.find((s) => s.status === 'reserved')?.reservedAt}
                    toleranceDays={config.reservationToleranceDays || 3}
                    variant="compact"
                  />
                </div>
              )}

              {/* Contact Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <a
                  href={`https://wa.me/55${cleanPhone(config.organizer2Phone || '11957801850')}?text=${encodeURIComponent(
                    `Olá Shirley! Segue meu comprovante de pagamento dos nomes na rifa da Casa do Pequeno Cidadão: ${mySlots
                      .map((s) => `#${s.id} ${s.name}`)
                      .join(', ')}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp Shirley</span>
                </a>

                <a
                  href={`https://wa.me/55${cleanPhone(config.organizerPhone || '11987121667')}?text=${encodeURIComponent(
                    `Olá Jeferson! Gostaria de confirmar meus nomes na rifa da Casa do Pequeno Cidadão: ${mySlots
                      .map((s) => `#${s.id} ${s.name}`)
                      .join(', ')}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp Jeferson</span>
                </a>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
                <button
                  onClick={onClearHistory}
                  className="hover:text-rose-600 transition-colors"
                  title="Remove apenas os dados salvos deste navegador"
                >
                  Limpar histórico deste aparelho
                </button>
                <button onClick={onClose} className="font-bold text-slate-700 hover:underline">
                  Fechar
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
