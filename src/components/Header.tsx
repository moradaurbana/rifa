import React, { useState } from 'react';
import {
  Trophy,
  HelpCircle,
  Shield,
  User,
  Wine,
  Heart,
  Settings,
  ChevronDown,
  ChevronUp,
  UtensilsCrossed,
  Sparkles,
  Calendar,
  Phone,
  MessageCircle,
} from 'lucide-react';
import { RaffleConfig, RaffleSlot } from '../types';
import { formatBRL, cleanPhone } from '../utils/formatters';

interface HeaderProps {
  config: RaffleConfig;
  slots: RaffleSlot[];
  onOpenRules: () => void;
  onOpenAdmin: () => void;
  onOpenMyReservations: () => void;
  mySlotsCount: number;
  isAdminLoggedIn: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  slots,
  onOpenRules,
  onOpenAdmin,
  onOpenMyReservations,
  mySlotsCount,
  isAdminLoggedIn,
}) => {
  const [showFullMenu, setShowFullMenu] = useState(false);

  const total = slots.length;
  const paidCount = slots.filter((s) => s.status === 'paid').length;
  const reservedCount = slots.filter((s) => s.status === 'reserved').length;
  const takenCount = paidCount + reservedCount;
  const availableCount = total - takenCount;
  const percentTaken = Math.round((takenCount / total) * 100);

  const shirleyPhone = config.organizer2Phone || '(11) 95780-1850';
  const jefersonPhone = config.organizerPhone || '(11) 98712-1667';

  return (
    <header className="relative w-full">
      {/* Apple-style Translucent Sticky Navigation Bar */}
      <nav className="sticky top-0 z-30 w-full backdrop-blur-2xl bg-white/80 border-b border-black/[0.06] transition-all">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-4">
          {/* Brand & Cause */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-white font-bold shadow-xs shrink-0">
              <Heart className="w-4 h-4 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-rose-600 tracking-tight">
                  Casa do Pequeno Cidadão
                </span>
                <span className="text-[10px] text-[#86868b] hidden sm:inline">· Rifa Beneficente Oficial</span>
              </div>
              <h1 className="text-xs sm:text-sm font-semibold tracking-tight text-[#1d1d1f] line-clamp-1">
                Jantar Harmonizado para 6 Pessoas
              </h1>
            </div>
          </div>

          {/* Action Links */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {isAdminLoggedIn && (
              <button
                onClick={onOpenAdmin}
                className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 rounded-full border border-emerald-200"
                title="Modo Organizador ativo"
              >
                <Settings className="w-3 h-3 text-emerald-600" />
                <span>Modo Admin Ativo</span>
              </button>
            )}

            <button
              onClick={onOpenRules}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#1d1d1f] hover:bg-black/[0.04] rounded-full transition-colors cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-[#86868b]" />
              <span>Regras & Prêmio</span>
            </button>

            <button
              onClick={onOpenMyReservations}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#1d1d1f] hover:bg-black/[0.04] rounded-full transition-colors relative cursor-pointer"
            >
              <User className="w-3.5 h-3.5 text-[#86868b]" />
              <span>Meus Nomes</span>
              {mySlotsCount > 0 && (
                <span className="bg-[#0071e3] text-white font-bold text-[10px] px-1.5 py-0.2 rounded-full">
                  {mySlotsCount}
                </span>
              )}
            </button>

            <button
              onClick={onOpenAdmin}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-full bg-[#1d1d1f] hover:bg-[#2d2d2f] text-white shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5 text-amber-300" />
              <span>Organizador</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Content in Apple Style */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-4">
        {/* Subtle charity banner */}
        <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
          <div className="flex items-center gap-2 text-xs font-medium text-[#86868b] flex-wrap">
            <span className="text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Cartela de 100 Nomes
            </span>
            <span aria-hidden="true">·</span>
            <span>Vendas: {config.salesPeriod || 'Outubro e Novembro / 2026'}</span>
            <span aria-hidden="true">·</span>
            <span>Apurado na Rifa Física Oficial</span>
          </div>

          {isAdminLoggedIn && (
            <div className="text-[12px] font-medium text-emerald-800 bg-emerald-50/80 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1.5">
              <span>💡</span>
              <span>Modo Admin: Toque em qualquer nome na cartela para alterar Livre/Reservado/Pago</span>
            </div>
          )}
        </div>

        {/* Apple Bento Grid Header */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Bento Card 1: Main Prize Highlight */}
          <div className="md:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-black/[0.06] shadow-[0_2px_16px_rgba(0,0,0,0.03)] flex flex-col justify-between relative overflow-hidden">
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wider uppercase text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                  <Wine className="w-3.5 h-3.5 text-amber-600" />
                  <span>Experiência Gastronômica Exclusiva</span>
                </div>

                <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                  100% Beneficente
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1d1d1f] leading-snug">
                Jantar Harmonizado com Vinhos Finos para 6 Pessoas
              </h2>

              <p className="text-sm text-[#86868b] leading-relaxed">
                Um menu gourmet completo preparado para 6 pessoas no conforto do lar do anfitrião, com opções de{' '}
                <strong className="text-[#1d1d1f]">Carnes Nobres</strong> ou{' '}
                <strong className="text-[#1d1d1f]">Frutos do Mar</strong> e seleção especial de vinhos.
              </p>

              {/* Four pillars of the prize */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2 text-xs">
                  <UtensilsCrossed className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 block font-semibold">Menu Gourmet Completo</strong>
                    <span className="text-slate-500 text-[11px]">Entrada, prato principal (carnes ou frutos do mar) e sobremesa.</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2 text-xs">
                  <Wine className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 block font-semibold">6 Garrafas de Vinhos Finos</strong>
                    <span className="text-slate-500 text-[11px]">3 rótulos selecionados para harmonizar. Água e refrigerantes inclusos.</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2 text-xs">
                  <Sparkles className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 block font-semibold">Serviço de Louças Finas</strong>
                    <span className="text-slate-500 text-[11px]">Porcelanas e taças de cristal levadas e recolhidas pela equipe.</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2 text-xs">
                  <Trophy className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 block font-semibold">Cozinha e Equipamentos</strong>
                    <span className="text-slate-500 text-[11px]">Acessórios levados e retirados. Conforto total para o anfitrião!</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Transparency Note */}
            <div className="mt-4 pt-3 border-t border-black/[0.04] text-[11px] text-[#86868b] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span>
                🤝 <strong>Transparência:</strong> Mão de obra e equipamentos 100% doados. Deduzidos apenas os custos de insumos.
              </span>
              <button
                onClick={onOpenRules}
                className="text-[#0071e3] font-semibold hover:underline shrink-0 text-left sm:text-right"
              >
                Ver todas as regras & detalhes →
              </button>
            </div>
          </div>

          {/* Bento Card 2: Price & Progress & Organizers */}
          <div className="md:col-span-5 flex flex-col gap-4">
            {/* Price Widget */}
            <div className="bg-white rounded-3xl p-6 border border-black/[0.06] shadow-[0_2px_16px_rgba(0,0,0,0.03)] flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider block">
                  Valor por Nome
                </span>
                <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1d1d1f] mt-0.5">
                  {formatBRL(config.pricePerTicket)}
                </div>
                <span className="text-xs text-[#86868b] mt-0.5 block">
                  PIX para Shirley Cristina Ortega: <strong>{config.pixKey || '11 95780-1850'}</strong>
                </span>
              </div>

              <div className="w-14 h-14 rounded-2xl bg-black/[0.03] border border-black/[0.05] flex items-center justify-center text-2xl shadow-inner shrink-0">
                🎟️
              </div>
            </div>

            {/* Progress Widget */}
            <div className="bg-white rounded-3xl p-6 border border-black/[0.06] shadow-[0_2px_16px_rgba(0,0,0,0.03)] flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#1d1d1f]">
                  {takenCount} de {total} nomes escolhidos
                </span>
                <span className="font-bold text-[#0071e3]">{percentTaken}%</span>
              </div>

              {/* Fine Apple Progress Bar */}
              <div className="w-full h-2.5 bg-black/[0.05] rounded-full overflow-hidden p-0.5">
                <div
                  className="h-full bg-[#1d1d1f] rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${Math.max(4, percentTaken)}%` }}
                />
              </div>

              {/* Status Breakdown (Unboxed Clean Text) */}
              <div className="flex items-center justify-between text-xs text-[#86868b] pt-1">
                <span>
                  <strong className="text-emerald-700 font-semibold">{availableCount}</strong> livres
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  <strong className="text-amber-700 font-semibold">{reservedCount}</strong> aguardando
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  <strong className="text-purple-700 font-semibold">{paidCount}</strong> confirmados
                </span>
              </div>
            </div>

            {/* Quick Organizers Contact Card */}
            <div className="bg-white rounded-2xl p-4 border border-black/[0.06] shadow-[0_2px_16px_rgba(0,0,0,0.03)] space-y-2">
              <span className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider block">
                Contatos dos Organizadores:
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <a
                  href={`https://wa.me/55${cleanPhone(shirleyPhone)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-100 hover:border-emerald-200 transition-colors block"
                >
                  <div className="font-semibold text-slate-800 flex items-center gap-1">
                    <MessageCircle className="w-3 h-3 text-emerald-600" /> Shirley
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">{shirleyPhone}</div>
                </a>

                <a
                  href={`https://wa.me/55${cleanPhone(jefersonPhone)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 transition-colors block"
                >
                  <div className="font-semibold text-slate-800 flex items-center gap-1">
                    <MessageCircle className="w-3 h-3 text-slate-700" /> Jeferson
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">{jefersonPhone}</div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
