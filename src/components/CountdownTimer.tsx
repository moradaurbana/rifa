import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, ShieldCheck } from 'lucide-react';

interface CountdownTimerProps {
  reservedAt?: string;
  toleranceDays?: number;
  variant?: 'card' | 'compact' | 'badge';
  onExpired?: () => void;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  reservedAt,
  toleranceDays = 3,
  variant = 'card',
  onExpired,
}) => {
  const [timeLeft, setTimeLeft] = useState<{
    totalMs: number;
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
    percentageRemaining: number;
  } | null>(null);

  useEffect(() => {
    if (!reservedAt) return;

    const calculate = () => {
      const reservedTime = new Date(reservedAt).getTime();
      const totalToleranceMs = toleranceDays * 24 * 60 * 60 * 1000;
      const expireTime = reservedTime + totalToleranceMs;
      const now = Date.now();
      const diff = expireTime - now;

      if (diff <= 0) {
        setTimeLeft({
          totalMs: 0,
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isExpired: true,
          percentageRemaining: 0,
        });
        onExpired?.();
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      const percentageRemaining = Math.max(0, Math.min(100, (diff / totalToleranceMs) * 100));

      setTimeLeft({
        totalMs: diff,
        days,
        hours,
        minutes,
        seconds,
        isExpired: false,
        percentageRemaining,
      });
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [reservedAt, toleranceDays, onExpired]);

  if (!timeLeft) return null;

  if (timeLeft.isExpired) {
    if (variant === 'badge') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full border border-rose-200">
          <AlertTriangle className="w-3 h-3" /> Tolerância de 3 dias expirada
        </span>
      );
    }
    return (
      <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 text-xs flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
        <span>Prazo de tolerância de 3 dias esgotado. O nome poderá ser liberado para venda.</span>
      </div>
    );
  }

  // Format strings
  const pad = (n: number) => String(n).padStart(2, '0');
  const isUrgent = timeLeft.days === 0 && timeLeft.hours < 12;

  if (variant === 'badge') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full border shadow-2xs transition-colors ${
          isUrgent
            ? 'text-rose-900 bg-rose-50 border-rose-200 animate-pulse'
            : 'text-amber-900 bg-amber-50 border-amber-200'
        }`}
      >
        <Clock className="w-3 h-3 text-amber-700 shrink-0" />
        <span>
          {timeLeft.days > 0 ? `${timeLeft.days}d ` : ''}
          {pad(timeLeft.hours)}h {pad(timeLeft.minutes)}m {pad(timeLeft.seconds)}s
        </span>
      </span>
    );
  }

  if (variant === 'compact') {
    return (
      <div
        className={`flex items-center justify-between text-xs px-3 py-2 rounded-xl border ${
          isUrgent ? 'bg-rose-50/80 border-rose-200 text-rose-950' : 'bg-amber-50/80 border-amber-200 text-amber-950'
        }`}
      >
        <div className="flex items-center gap-1.5 font-semibold text-[11px]">
          <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>Tolerância para envio do PIX:</span>
        </div>
        <div className="font-mono font-bold text-xs tracking-tight">
          {timeLeft.days > 0 ? `${timeLeft.days}d ` : ''}
          {pad(timeLeft.hours)}h {pad(timeLeft.minutes)}m {pad(timeLeft.seconds)}s
        </div>
      </div>
    );
  }

  // Variant: Card (Default in Checkout & My Reservations)
  return (
    <div
      className={`p-4 rounded-2xl border text-left transition-all ${
        isUrgent
          ? 'bg-rose-50/70 border-rose-300 shadow-sm'
          : 'bg-gradient-to-br from-amber-50/90 to-amber-100/40 border-amber-200 shadow-2xs'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
              isUrgent ? 'bg-rose-200 text-rose-800' : 'bg-amber-200 text-amber-900'
            }`}
          >
            <Clock className="w-4 h-4 animate-spin-slow" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
              Tolerância de 3 Dias para Confirmação
            </span>
            <h5 className="text-xs font-extrabold text-[#1d1d1f]">
              Tempo Restante para Enviar o Comprovante:
            </h5>
          </div>
        </div>

        <span className="text-[11px] font-medium text-amber-900/80 hidden sm:inline">
          {toleranceDays} dias corridos
        </span>
      </div>

      {/* Smooth Timer Digit Blocks */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2 text-center mt-3">
        <div className="bg-white/90 backdrop-blur-xs p-2 rounded-xl border border-black/[0.06] shadow-2xs">
          <div className="font-mono font-black text-base sm:text-lg text-[#1d1d1f]">{timeLeft.days}</div>
          <div className="text-[9px] uppercase font-bold text-[#86868b]">Dias</div>
        </div>
        <div className="bg-white/90 backdrop-blur-xs p-2 rounded-xl border border-black/[0.06] shadow-2xs">
          <div className="font-mono font-black text-base sm:text-lg text-[#1d1d1f]">{pad(timeLeft.hours)}</div>
          <div className="text-[9px] uppercase font-bold text-[#86868b]">Horas</div>
        </div>
        <div className="bg-white/90 backdrop-blur-xs p-2 rounded-xl border border-black/[0.06] shadow-2xs">
          <div className="font-mono font-black text-base sm:text-lg text-[#1d1d1f]">{pad(timeLeft.minutes)}</div>
          <div className="text-[9px] uppercase font-bold text-[#86868b]">Min</div>
        </div>
        <div className="bg-white/90 backdrop-blur-xs p-2 rounded-xl border border-black/[0.06] shadow-2xs">
          <div className="font-mono font-black text-base sm:text-lg text-[#0071e3]">{pad(timeLeft.seconds)}</div>
          <div className="text-[9px] uppercase font-bold text-[#86868b]">Seg</div>
        </div>
      </div>

      {/* Subtle Progress Bar */}
      <div className="mt-3">
        <div className="w-full bg-amber-200/60 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ease-linear rounded-full ${
              isUrgent ? 'bg-rose-500' : 'bg-amber-600'
            }`}
            style={{ width: `${timeLeft.percentageRemaining}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[10px] text-amber-900/80 font-medium mt-1">
          <span>Reserva ativa</span>
          <span>Após 3 dias sem comprovante, o nome é liberado</span>
        </div>
      </div>
    </div>
  );
};
