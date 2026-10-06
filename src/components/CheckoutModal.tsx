import React, { useState } from 'react';
import { X, Check, Copy, AlertTriangle, ArrowRight, MessageCircle, QrCode } from 'lucide-react';
import confetti from 'canvas-confetti';
import { RaffleConfig, RaffleSlot } from '../types';
import { formatBRL, formatPhone, cleanPhone } from '../utils/formatters';
import { PixQrCode } from './PixQrCode';
import { CountdownTimer } from './CountdownTimer';

interface CheckoutModalProps {
  isOpen: boolean;
  selectedSlots: RaffleSlot[];
  config: RaffleConfig;
  onClose: () => void;
  onSuccessReservation: (reservedIds: number[], buyerName: string, buyerPhone: string) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  selectedSlots,
  config,
  onClose,
  onSuccessReservation,
}) => {
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerNotes, setBuyerNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Step state: 'form' | 'success_pix'
  const [step, setStep] = useState<'form' | 'success_pix'>('form');
  const [copiedPix, setCopiedPix] = useState(false);
  const [reservationCode, setReservationCode] = useState('');
  const [reservationTimestamp, setReservationTimestamp] = useState<string>('');

  if (!isOpen || selectedSlots.length === 0) return null;

  const totalAmount = selectedSlots.length * config.pricePerTicket;

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBuyerPhone(formatPhone(e.target.value));
  };

  const handleCopyPix = () => {
    // Copy clean key or formatted key
    navigator.clipboard.writeText(config.pixKey);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!buyerName.trim()) {
      setErrorMessage('Por favor, informe seu nome completo.');
      return;
    }

    const digitsOnly = cleanPhone(buyerPhone);
    if (digitsOnly.length < 10) {
      setErrorMessage('Por favor, informe um número de telefone com DDD válido (ex: 11 98765-4321).');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/raffle/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slotIds: selectedSlots.map((s) => s.id),
          buyerName: buyerName.trim(),
          buyerPhone: buyerPhone.trim(),
          buyerNotes: buyerNotes.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Não foi possível reservar os nomes escolhidos.');
      }

      // Success! Fire celebration confetti
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }

      setReservationCode(data.reservationId || 'RES-' + Date.now());
      setReservationTimestamp(new Date().toISOString());
      setStep('success_pix');
      onSuccessReservation(
        selectedSlots.map((s) => s.id),
        buyerName.trim(),
        buyerPhone.trim()
      );
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao processar reserva. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const createWhatsAppLink = (phone: string, organizerTitle: string) => {
    const rawPhone = cleanPhone(phone);
    const namesList = selectedSlots.map((s) => `#${s.id} ${s.name}`).join(', ');
    const message = `Olá ${organizerTitle}! Acabei de reservar o(s) nome(s) *${namesList}* na rifa beneficente da *Casa do Pequeno Cidadão* (Total: ${formatBRL(
      totalAmount
    )}).\n\nMeu nome: *${buyerName}*\nTelefone: ${buyerPhone}\nCódigo de Reserva: ${reservationCode}\n\nSegue em anexo o meu comprovante de pagamento via PIX!`;

    return `https://wa.me/55${rawPhone}?text=${encodeURIComponent(message)}`;
  };

  const shirleyPhone = config.organizer2Phone || '(11) 95780-1850';
  const jefersonPhone = config.organizerPhone || '(11) 98712-1667';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#fbfbfd] text-[#1d1d1f] rounded-3xl max-w-lg w-full shadow-2xl border border-black/5 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Apple Style Header */}
        <div className="px-6 pt-6 pb-4 flex items-start justify-between border-b border-black/[0.06]">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-600 block">
              Casa do Pequeno Cidadão · Rifa Beneficente
            </span>
            <h3 className="text-xl font-bold tracking-tight text-[#1d1d1f] mt-0.5">
              {step === 'form' ? 'Garantir Meus Nomes' : 'Nomes Reservados com Sucesso!'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center text-[#86868b] hover:text-[#1d1d1f] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[85vh] overflow-y-auto">
          {step === 'form' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Selected Slots summary card */}
              <div className="bg-white rounded-2xl p-4 border border-black/[0.06] shadow-2xs">
                <div className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider mb-2">
                  Nomes Selecionados ({selectedSlots.length})
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedSlots.map((slot) => (
                    <span
                      key={slot.id}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200 font-bold text-xs"
                    >
                      <span className="font-mono text-emerald-700">#{slot.id}</span>
                      <span>{slot.name}</span>
                    </span>
                  ))}
                </div>

                <div className="mt-3 pt-3 border-t border-black/[0.04] flex items-center justify-between text-sm">
                  <span className="text-[#86868b]">Valor total:</span>
                  <span className="text-lg font-bold text-[#1d1d1f]">{formatBRL(totalAmount)}</span>
                </div>
              </div>

              {/* Conflict or validation error warning */}
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2.5 animate-shake">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-semibold">Aviso:</strong>
                    <span>{errorMessage}</span>
                  </div>
                </div>
              )}

              {/* Form Inputs */}
              <div>
                <label className="block text-[11px] font-semibold text-[#86868b] uppercase tracking-wider mb-1">
                  Seu Nome Completo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Eduardo de Oliveira"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/10 focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/10 text-sm font-medium outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#86868b] uppercase tracking-wider mb-1">
                  WhatsApp com DDD <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="(11) 98765-4321"
                  maxLength={15}
                  value={buyerPhone}
                  onChange={handlePhoneChange}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/10 focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/10 text-sm font-medium outline-none transition-all"
                />
                <p className="text-[11px] text-[#86868b] mt-1">
                  Usado para contato caso seu nome seja o vencedor apurado na rifa física!
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#86868b] uppercase tracking-wider mb-1">
                  Observações (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Mensagem ou recado..."
                  value={buyerNotes}
                  onChange={(e) => setBuyerNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-black/10 focus:border-[#0071e3] text-xs outline-none transition-all"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white font-semibold text-sm tracking-tight shadow-sm transition-all active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLoading ? (
                    <span>Bloqueando nomes na cartela...</span>
                  ) : (
                    <>
                      <span>Confirmar e Bloquear Nomes</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
                <p className="text-[11px] text-center text-[#86868b] mt-2">
                  🔒 Bloqueio imediato em tempo real para que ninguém mais possa escolher este nome.
                </p>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              {/* Success Badge */}
              <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Check className="w-5 h-5 stroke-[3]" />
                </div>
                <div>
                  <h4 className="font-bold text-emerald-950 text-sm">
                    Nomes reservados e bloqueados na cartela!
                  </h4>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Seus nomes já estão garantidos. Efetue o PIX abaixo e envie o comprovante.
                  </p>
                </div>
              </div>

              {/* Countdown Timer with 3-day tolerance */}
              <CountdownTimer
                reservedAt={reservationTimestamp || new Date().toISOString()}
                toleranceDays={config.reservationToleranceDays || 3}
                variant="card"
              />

              {/* QR Code and PIX Details */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-black/[0.06] space-y-4 text-center">
                <div className="flex items-center justify-between pb-2 border-b border-black/[0.04] text-xs text-left">
                  <span className="font-semibold text-[#86868b] uppercase">Pague via PIX</span>
                  <span className="text-[#86868b] font-mono">Código: {reservationCode}</span>
                </div>

                {/* Visual QR Code */}
                <PixQrCode
                  pixKey={config.pixKey}
                  customImageUrl={config.pixQrCodeImage}
                  amount={totalAmount}
                  receiverName={config.pixReceiverName}
                />

                {/* PIX Key copy box */}
                <div className="text-left space-y-1">
                  <span className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider block">
                    Chave PIX (Telefone Shirley Cristina Ortega):
                  </span>
                  <div className="flex items-center justify-between gap-2 bg-[#f5f5f7] p-2.5 rounded-xl">
                    <div className="font-mono font-bold text-sm text-[#1d1d1f] truncate select-all">
                      {config.pixKey}
                    </div>
                    <button
                      onClick={handleCopyPix}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#1d1d1f] hover:bg-[#2d2d2f] text-white text-xs font-semibold transition-all shrink-0 active:scale-95 cursor-pointer"
                    >
                      {copiedPix ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar Chave</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Beneficiary and Amount */}
                <div className="grid grid-cols-2 gap-2 text-xs pt-1 text-left bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-[#86868b] block">Titular do PIX:</span>
                    <strong className="text-[#1d1d1f] font-semibold">{config.pixReceiverName || 'Shirley Cristina Ortega'}</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-[#86868b] block">Valor exato:</span>
                    <strong className="text-base font-bold text-[#1d1d1f]">{formatBRL(totalAmount)}</strong>
                  </div>
                </div>

                {/* Confirmation Instruction */}
                <p className="text-xs text-amber-900 bg-amber-50 p-2.5 rounded-xl border border-amber-200/80 font-medium text-left">
                  📸 <strong>Importante:</strong> Ao efetuar o pagamento, envie o comprovante para facilitar a conferência pelos organizadores!
                </p>
              </div>

              {/* Direct WhatsApp Buttons to Organizers */}
              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider block text-center">
                  Enviar Comprovante de Pagamento:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <a
                    href={createWhatsAppLink(shirleyPhone, 'Shirley')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs tracking-tight shadow-sm transition-all flex items-center justify-center gap-1.5"
                  >
                    <MessageCircle className="w-4 h-4 shrink-0" />
                    <span>WhatsApp Shirley ({shirleyPhone})</span>
                  </a>

                  <a
                    href={createWhatsAppLink(jefersonPhone, 'Jeferson')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs tracking-tight shadow-sm transition-all flex items-center justify-center gap-1.5"
                  >
                    <MessageCircle className="w-4 h-4 shrink-0" />
                    <span>WhatsApp Jeferson ({jefersonPhone})</span>
                  </a>
                </div>

                <button
                  onClick={onClose}
                  className="w-full py-2.5 px-4 rounded-xl bg-black/[0.04] hover:bg-black/[0.08] text-[#1d1d1f] font-medium text-xs transition-colors cursor-pointer"
                >
                  Concluir e Voltar para a Cartela
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
