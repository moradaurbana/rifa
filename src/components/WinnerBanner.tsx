import React, { useState } from 'react';
import { Sparkles, Camera, ZoomIn, X, Settings, Pencil, Trash2, Video, Play, ExternalLink } from 'lucide-react';
import { RaffleWinner } from '../types';
import { formatDate } from '../utils/formatters';

interface WinnerBannerProps {
  winner: RaffleWinner;
  prizeTitle: string;
  onManageWinner?: () => void;
  onEditWinner?: () => void;
  onRemoveWinner?: () => void;
  isAdmin?: boolean;
}

function getEmbedVideoUrl(url?: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();

  // YouTube match
  const ytMatch = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([\w-]{11})/);
  if (ytMatch) {
    return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0`;
  }

  // Vimeo match
  const vimeoMatch = trimmed.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)/);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
  }

  return null;
}

export const WinnerBanner: React.FC<WinnerBannerProps> = ({
  winner,
  prizeTitle,
  onManageWinner,
  onEditWinner,
  onRemoveWinner,
  isAdmin,
}) => {
  const [isPhotoZoomed, setIsPhotoZoomed] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  const embedUrl = getEmbedVideoUrl(winner.videoUrl);
  const isDirectVideo = winner.videoUrl && /\.(mp4|webm|ogg|mov)($|\?)/i.test(winner.videoUrl);

  return (
    <>
      <div className="relative overflow-hidden bg-[#1d1d1f] text-white p-6 sm:p-7 rounded-3xl shadow-2xl border border-white/10 mb-8 animate-in fade-in duration-300">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-center md:text-left flex-1">
            <div className="w-16 h-16 bg-white/10 border border-white/15 text-amber-400 rounded-2xl flex items-center justify-center text-3xl shadow-inner shrink-0">
              👑
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 justify-center md:justify-start flex-wrap">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950/40 px-2.5 py-0.5 rounded-full border border-amber-400/20">
                  <Sparkles className="w-3 h-3" /> Ganhador Oficial da Rifa
                </span>
                <span className="text-[11px] text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-400/20">
                  Apurado na Cartela Física
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Nome Sorteado:{' '}
                <span className="text-amber-300">
                  #{String(winner.slotId).padStart(2, '0')} · {winner.slotName}
                </span>
              </h2>

              <p className="text-white/90 font-medium text-xs sm:text-sm">
                Parabéns a <strong className="text-white font-bold">{winner.buyerName}</strong> pelo prêmio do{' '}
                <span className="text-amber-200 font-semibold">{prizeTitle}</span>!
              </p>

              <div className="flex items-center gap-2 flex-wrap justify-center md:justify-start">
                <span className="text-xs text-amber-200/90 font-medium bg-white/5 px-3 py-1.5 rounded-xl border border-white/10 inline-block">
                  📞 {winner.announcementNotes || 'Entraremos em contato com o ganhador para organizar e agendar o jantar!'}
                </span>

                <span className="text-xs text-slate-300 font-medium bg-white/5 px-2.5 py-1.5 rounded-xl border border-white/10 inline-block">
                  🗓️ Prazo para agendamento do jantar: até 2 meses
                </span>
              </div>

              {/* Public Video of Unsealing Physical Ticket */}
              {winner.videoUrl && (
                <div className="pt-1 flex items-center justify-center md:justify-start">
                  <button
                    type="button"
                    onClick={() => setIsVideoModalOpen(true)}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer border border-white/20 animate-pulse"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Assistir Vídeo da Cartela Sendo Deslacrada (Auditoria Pública)</span>
                  </button>
                </div>
              )}

              {/* Organizer Manage Actions */}
              <div className="pt-2 flex items-center justify-center md:justify-start gap-2 flex-wrap">
                {onEditWinner && (
                  <button
                    type="button"
                    onClick={onEditWinner}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                    title="Editar informações ou foto do ganhador"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Editar Divulgação</span>
                  </button>
                )}

                {onRemoveWinner && (
                  <button
                    type="button"
                    onClick={onRemoveWinner}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                    title="Remover divulgação e voltar a rifa para o modo normal"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remover Divulgação</span>
                  </button>
                )}

                {onManageWinner && !onEditWinner && !onRemoveWinner && (
                  <button
                    type="button"
                    onClick={onManageWinner}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                    title="Editar ou remover a divulgação do ganhador"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Gerenciar Divulgação (Organizador)</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Photo and Video shortcuts */}
          <div className="flex items-center gap-3 shrink-0 flex-wrap justify-center">
            {winner.photoUrl && (
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => setIsPhotoZoomed(true)}
                  className="group relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-amber-400/80 shadow-lg cursor-pointer hover:scale-105 transition-all"
                  title="Clique para ampliar a foto da cartela física oficial"
                >
                  <img
                    src={winner.photoUrl}
                    alt="Foto do bilhete físico ganhador"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 flex flex-col items-center justify-center text-[10px] text-white font-bold transition-all">
                    <ZoomIn className="w-5 h-5 mb-0.5 text-amber-300" />
                    <span>Ver Bilhete</span>
                  </div>
                </button>
                <span className="text-[10px] text-slate-300 mt-1 font-medium">Comprovante Físico</span>
              </div>
            )}

            {winner.videoUrl && (
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => setIsVideoModalOpen(true)}
                  className="group relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-rose-500/80 bg-rose-950/60 shadow-lg cursor-pointer hover:scale-105 transition-all flex flex-col items-center justify-center p-2 text-center"
                  title="Clique para assistir o vídeo da abertura da cartela"
                >
                  <div className="w-10 h-10 rounded-full bg-rose-600 group-hover:bg-rose-500 text-white flex items-center justify-center shadow-md transition-transform group-hover:scale-110 mb-1">
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </div>
                  <span className="text-[10px] font-bold text-white">Vídeo Oficial</span>
                </button>
                <span className="text-[10px] text-slate-300 mt-1 font-medium">Auditoria em Vídeo</span>
              </div>
            )}

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center md:text-right">
              <div className="text-[10px] font-semibold text-white/60 uppercase tracking-wider">Data da Apuração</div>
              <div className="text-xs font-semibold text-white mt-0.5">{formatDate(winner.drawnAt)}</div>
              <div className="text-[11px] text-emerald-400 font-medium mt-1">
                Casa do Pequeno Cidadão
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for viewing zoomed photo of the winning physical ticket */}
      {isPhotoZoomed && winner.photoUrl && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative max-w-2xl w-full bg-slate-900 rounded-3xl overflow-hidden border border-white/15 p-4 space-y-3">
            <div className="flex items-center justify-between text-white pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-amber-400" />
                <h4 className="font-bold text-sm">
                  Foto do Bilhete Físico Oficial: #{winner.slotId} - {winner.slotName}
                </h4>
              </div>
              <button
                onClick={() => setIsPhotoZoomed(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-auto flex items-center justify-center bg-black/40 rounded-2xl p-2">
              <img
                src={winner.photoUrl}
                alt="Foto do bilhete vencedor da rifa física"
                className="max-h-[65vh] w-auto object-contain rounded-xl shadow-2xl"
              />
            </div>

            <p className="text-center text-xs text-slate-400">
              Bilhete oficial apurado na cartela física da Casa do Pequeno Cidadão · Ganhador: <strong>{winner.buyerName}</strong>
            </p>
          </div>
        </div>
      )}

      {/* Modal for Watching Unsealing Video (Public Audit) */}
      {isVideoModalOpen && winner.videoUrl && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative max-w-3xl w-full bg-slate-900 rounded-3xl overflow-hidden border border-white/15 p-5 space-y-4">
            <div className="flex items-center justify-between text-white pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-red-600/20 text-red-400 flex items-center justify-center">
                  <Video className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm sm:text-base text-white">
                    Vídeo Oficial: Deslacração da Cartela Física
                  </h4>
                  <p className="text-xs text-slate-400">Auditoria pública e idoneidade absoluta do sorteio</p>
                </div>
              </div>
              <button
                onClick={() => setIsVideoModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Video Player or Embed */}
            <div className="relative aspect-video w-full bg-black rounded-2xl overflow-hidden flex items-center justify-center border border-white/10">
              {embedUrl ? (
                <iframe
                  src={embedUrl}
                  title="Vídeo de Auditoria da Rifa"
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : isDirectVideo ? (
                <video controls autoPlay className="w-full h-full object-contain">
                  <source src={winner.videoUrl} />
                  Seu navegador não suporta a exibição direta deste vídeo.
                </video>
              ) : (
                <div className="p-6 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-white/10 text-amber-400 flex items-center justify-center mx-auto text-2xl">
                    🎥
                  </div>
                  <div>
                    <h5 className="font-bold text-white text-base">Vídeo Gravado da Cartela Física</h5>
                    <p className="text-xs text-slate-300 max-w-md mx-auto mt-1">
                      O vídeo foi hospedado em um serviço externo. Clique no botão abaixo para assistir à gravação completa do momento em que a cartela foi deslacrada.
                    </p>
                  </div>
                  <a
                    href={winner.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg transition-all"
                  >
                    <span>Abrir Vídeo Completo</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span>Bilhete vencedor #{winner.slotId}: <strong>{winner.slotName}</strong></span>
              <a
                href={winner.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-400 hover:underline flex items-center gap-1"
              >
                <span>Link direto do vídeo</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
