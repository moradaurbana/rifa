import React from 'react';
import {
  X,
  ShieldCheck,
  UtensilsCrossed,
  Wine,
  Sparkles,
  Calendar,
  Phone,
  MessageCircle,
  Heart,
  Camera,
  CheckCircle2,
} from 'lucide-react';
import { RaffleConfig } from '../types';
import { formatBRL, cleanPhone } from '../utils/formatters';

interface RulesModalProps {
  isOpen: boolean;
  config: RaffleConfig;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, config, onClose }) => {
  if (!isOpen) return null;

  const shirleyPhone = config.organizer2Phone || '(11) 95780-1850';
  const jefersonPhone = config.organizerPhone || '(11) 98712-1667';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#fbfbfd] text-[#1d1d1f] rounded-3xl max-w-xl w-full shadow-2xl border border-black/5 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-black/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-white font-bold shadow-xs">
              <Heart className="w-4 h-4 fill-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight text-[#1d1d1f]">
                Regras & Detalhes da Rifa Beneficente
              </h3>
              <p className="text-xs text-[#86868b]">Casa do Pequeno Cidadão</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center text-[#86868b] hover:text-[#1d1d1f] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto text-sm text-slate-700">
          {/* Section 1: O Prêmio Gourmet */}
          <div className="space-y-3">
            <span className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider block">
              1. A Respeito do Prêmio (Jantar para 6 Pessoas):
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 bg-white rounded-2xl border border-black/[0.06] shadow-2xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                  <UtensilsCrossed className="w-4 h-4 text-emerald-600" />
                  <span>Menu Gourmet Completo</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Entrada, prato principal (opções: <strong>Carnes Nobres</strong> ou <strong>Frutos do Mar</strong>) e sobremesa. O cardápio será apresentado ao ganhador para livre escolha.
                </p>
              </div>

              <div className="p-3 bg-white rounded-2xl border border-black/[0.06] shadow-2xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                  <Wine className="w-4 h-4 text-amber-600" />
                  <span>Harmonização de Vinhos</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Incluso o total de <strong>6 garrafas de vinhos finos</strong> (3 rótulos selecionados para harmonizar com o jantar). Água e refrigerantes também inclusos.
                </p>
              </div>

              <div className="p-3 bg-white rounded-2xl border border-black/[0.06] shadow-2xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>Serviço de Louças Finas</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Todas as porcelanas e taças de cristal serão levadas e recolhidas após o final do jantar pela nossa equipe.
                </p>
              </div>

              <div className="p-3 bg-white rounded-2xl border border-black/[0.06] shadow-2xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                  <ShieldCheck className="w-4 h-4 text-rose-600" />
                  <span>Cozinha & Equipamentos</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Todos os acessórios e utensílios serão levados e retirados pela equipe. <strong>Conforto total para o anfitrião!</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Validade e Agendamento */}
          <div className="p-4 bg-white rounded-2xl border border-black/[0.06] space-y-2">
            <span className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider block">
              2. Validade, Tolerância de Pagamento & Agendamento:
            </span>
            <ul className="text-xs space-y-1.5 text-slate-700">
              <li>
                📅 <strong>Período de Venda:</strong> {config.salesPeriod || 'Outubro e Novembro / 2026'}.
              </li>
              <li>
                ⏳ <strong>Tolerância de 3 Dias para Pagamento:</strong> Os nomes reservados têm tolerância de até 3 dias corridos para efetuar o pagamento e enviar o comprovante via PIX. Caso não efetuado nesse período, o nome é liberado para venda novamente na cartela.
              </li>
              <li>
                🤝 <strong>Prazo para Agendamento do Jantar:</strong> O prazo para o ganhador agendar o jantar após a divulgação do vencedor da rifa será de <strong>até 2 meses</strong> em comum acordo com a equipe.
              </li>
            </ul>
          </div>

          {/* Section 3: Transparência */}
          <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200/80 space-y-2">
            <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider block">
              3. Transparência & Doação:
            </span>
            <ul className="text-xs space-y-1 text-emerald-950 leading-relaxed">
              <li>
                ❤️ <strong>100% do benefício para a Casa do Pequeno Cidadão:</strong> toda a mão de obra profissional e equipamentos foram doados integralmente para esta ação beneficente.
              </li>
              <li>
                🥩 Do valor total arrecadado, serão deduzidos exclusivamente os custos estritos de insumos do jantar.
              </li>
            </ul>
          </div>

          {/* Section 4: Apuração na Rifa Física & Vídeo */}
          <div className="p-4 bg-white rounded-2xl border border-black/[0.06] space-y-2">
            <span className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider block">
              4. Integração Rifa Eletrônica + Cartela Física & Vídeo Oficial:
            </span>
            <p className="text-xs text-slate-600 leading-relaxed">
              📱 <strong>O que vale para a venda é a rifa eletrônica:</strong> os participantes escolhem os nomes diretamente neste aplicativo. Os organizadores escrevem o nome do comprador na respectiva célula da cartela física de papel.
            </p>
            <p className="text-xs text-slate-600 leading-relaxed">
              🏷️ <strong>À cartela física cabe o nome oficial do ganhador lacrado.</strong>
            </p>
            <p className="text-xs text-slate-600 leading-relaxed">
              🎥 <strong>Vídeo oficial de abertura do lacre:</strong> No dia da abertura da rifa será gravado um vídeo oficial comprovando a idoneidade da abertura da cartela.
            </p>
            <p className="text-xs text-slate-600 leading-relaxed">
              📸 <strong>Auditoria pública no app:</strong> O nome vencedor, a <strong>foto nítida do bilhete físico deslacrado</strong> e o <strong>link do vídeo da abertura</strong> serão publicados diretamente nesta página eletrônica com zoom e visualização pública para que todos os participantes possam auditar com total transparência.
            </p>
          </div>

          {/* Section 5: Pagamento e Contatos */}
          <div className="p-4 bg-white rounded-2xl border border-black/[0.06] space-y-3">
            <span className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider block">
              5. Pagamento e Contato dos Organizadores:
            </span>
            <p className="text-xs text-slate-600">
              PIX em nome de <strong>Shirley Cristina Ortega</strong> — Chave (Telefone celular): <strong className="text-slate-900 font-mono">11 95780-1850</strong>.
              Ao efetuar o pagamento, envie o comprovante para facilitar a conferência.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <a
                href={`https://wa.me/55${cleanPhone(shirleyPhone)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-100 hover:border-emerald-200 transition-colors flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-xs text-slate-900">Shirley Cristina Ortega</div>
                  <div className="text-[11px] text-slate-500 font-mono">{shirleyPhone}</div>
                </div>
                <MessageCircle className="w-4 h-4 text-emerald-600" />
              </a>

              <a
                href={`https://wa.me/55${cleanPhone(jefersonPhone)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 transition-colors flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-xs text-slate-900">Jeferson Bernardes</div>
                  <div className="text-[11px] text-slate-500 font-mono">{jefersonPhone}</div>
                </div>
                <MessageCircle className="w-4 h-4 text-slate-700" />
              </a>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 px-4 rounded-xl bg-[#1d1d1f] hover:bg-[#2d2d2f] text-white font-semibold text-xs tracking-tight shadow-sm transition-all cursor-pointer"
          >
            Entendi, Voltar para a Cartela
          </button>
        </div>
      </div>
    </div>
  );
};
