import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  Unlock,
  CheckCircle2,
  Clock,
  RotateCcw,
  Trophy,
  Settings,
  ListOrdered,
  Sparkles,
  Phone,
  MessageCircle,
  FileSpreadsheet,
  Printer,
  AlertCircle,
  AlertTriangle,
  Trash2,
  Save,
  Check,
  Edit2,
  Pencil,
  ClipboardList,
  FileText,
  UploadCloud,
  Camera,
  Image as ImageIcon,
  QrCode,
  Heart,
  Video,
  Play,
  ExternalLink,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { RaffleConfig, RaffleSlot, RaffleWinner } from '../types';
import { formatBRL, formatDate, cleanPhone } from '../utils/formatters';

interface AdminModalProps {
  isOpen: boolean;
  slots: RaffleSlot[];
  config: RaffleConfig;
  winner: RaffleWinner | null;
  onClose: () => void;
  onRefreshData: () => Promise<void>;
  onOpenSlotEdit?: (slot: RaffleSlot) => void;
  onAuthenticatedStateChange?: (isAuth: boolean, pin?: string) => void;
  defaultTab?: 'slots' | 'edit-physical-names' | 'draw' | 'settings' | 'reports';
  currentAdminPin?: string;
  isAdminLoggedIn?: boolean;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  slots,
  config,
  winner,
  onClose,
  onRefreshData,
  onOpenSlotEdit,
  onAuthenticatedStateChange,
  defaultTab,
  currentAdminPin,
  isAdminLoggedIn,
}) => {
  const [adminPin, setAdminPin] = useState(currentAdminPin || '1234');
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(isAdminLoggedIn));
  const [pinError, setPinError] = useState('');
  const [activeTab, setActiveTab] = useState<'slots' | 'edit-physical-names' | 'draw' | 'settings' | 'reports'>(
    defaultTab || 'slots'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Search and filter for slots tab
  const [searchSlots, setSearchSlots] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'reserved' | 'paid'>('all');

  // Inline rename single slot state
  const [editingSlotId, setEditingSlotId] = useState<number | null>(null);
  const [editingSlotName, setEditingSlotName] = useState<string>('');

  // Physical card 100 names editor state
  const [physicalNamesList, setPhysicalNamesList] = useState<string[]>([]);
  const [bulkPasteText, setBulkPasteText] = useState<string>('');
  const [keepReservationsOnBatch, setKeepReservationsOnBatch] = useState<boolean>(true);

  // Physical winner announcement state
  const [isEditingWinner, setIsEditingWinner] = useState(false);
  const [showConfirmRemoveWinner, setShowConfirmRemoveWinner] = useState(false);
  const [selectedWinnerSlotId, setSelectedWinnerSlotId] = useState<number>(1);
  const [winnerNameInput, setWinnerNameInput] = useState<string>('');
  const [winnerPhoneInput, setWinnerPhoneInput] = useState<string>('');
  const [winnerPhotoUrl, setWinnerPhotoUrl] = useState<string>('');
  const [winnerVideoUrl, setWinnerVideoUrl] = useState<string>('');
  const [winnerAnnouncementNotes, setWinnerAnnouncementNotes] = useState<string>(
    'Entraremos em contato com o ganhador para organizar e agendar o jantar!'
  );

  useEffect(() => {
    if (isAdminLoggedIn) {
      setIsAuthenticated(true);
    }
  }, [isAdminLoggedIn, isOpen]);

  useEffect(() => {
    if (currentAdminPin) {
      setAdminPin(currentAdminPin);
    }
  }, [currentAdminPin]);

  // Settings form
  const [settingsForm, setSettingsForm] = useState<RaffleConfig>({ ...config });
  const [newPin, setNewPin] = useState('');

  useEffect(() => {
    if (defaultTab && isOpen) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab, isOpen]);

  // Synchronize slots into physical names list when opening or slots change
  useEffect(() => {
    if (slots && slots.length > 0) {
      setPhysicalNamesList(slots.map((s) => s.name));
    }
  }, [slots]);

  useEffect(() => {
    setSettingsForm({ ...config });
  }, [config]);

  // When selected winner slot changes, pre-fill buyer if exists
  useEffect(() => {
    if (!isEditingWinner) {
      const slot = slots.find((s) => s.id === Number(selectedWinnerSlotId));
      if (slot && slot.buyerName) {
        setWinnerNameInput(slot.buyerName);
        setWinnerPhoneInput(slot.buyerPhone || '');
      }
    }
  }, [selectedWinnerSlotId, slots, isEditingWinner]);

  if (!isOpen) return null;

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/raffle/admin/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: adminPin }),
      });
      const data = await res.json();
      if (res.ok && data.authorized) {
        setIsAuthenticated(true);
        onAuthenticatedStateChange?.(true, adminPin);
      } else {
        setPinError('Senha incorreta! Digite a senha do organizador.');
      }
    } catch {
      setPinError('Erro ao verificar senha.');
    } finally {
      setIsLoading(false);
    }
  };

  // Inline edit single slot name
  const handleStartEditSlot = (slot: RaffleSlot) => {
    setEditingSlotId(slot.id);
    setEditingSlotName(slot.name);
  };

  const handleSaveSingleSlotName = async (slotId: number) => {
    if (!editingSlotName.trim()) {
      showFeedback('O nome não pode estar vazio!', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/raffle/admin/rename-slot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminPin,
          slotId,
          newName: editingSlotName.trim(),
        }),
      });

      if (res.ok) {
        setEditingSlotId(null);
        await onRefreshData();
        showFeedback(`Nome #${slotId} alterado com sucesso para "${editingSlotName.trim()}"!`);
      } else {
        const data = await res.json();
        showFeedback(data.error || 'Erro ao alterar nome', 'error');
      }
    } catch {
      showFeedback('Erro de comunicação com o servidor', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Parse bulk paste text into the 100 slots
  const handleParseBulkText = () => {
    if (!bulkPasteText.trim()) {
      showFeedback('Cole os nomes no campo de texto para processar.', 'error');
      return;
    }

    const rawTokens = bulkPasteText.split(/[\r\n,;]+/);
    const cleanedNames: string[] = [];

    for (const raw of rawTokens) {
      let name = raw.replace(/^\s*(?:#?\d+[\.\-\)\s:]+|\[\d+\])\s*/i, '').trim();
      name = name.replace(/^["']|["']$/g, '').trim();
      if (name.length > 0) {
        cleanedNames.push(name);
      }
    }

    if (cleanedNames.length === 0) {
      showFeedback('Nenhum nome válido encontrado no texto colado.', 'error');
      return;
    }

    const updated = [...physicalNamesList];
    for (let i = 0; i < 100; i++) {
      if (i < cleanedNames.length) {
        updated[i] = cleanedNames[i];
      }
    }

    setPhysicalNamesList(updated);
    showFeedback(
      `Sucesso! ${cleanedNames.length} nomes foram extraídos e preenchidos nos slots da cartela (máx 100). Confira na grade e clique em Salvar.`
    );
  };

  const handlePhysicalNameChange = (index: number, newName: string) => {
    const updated = [...physicalNamesList];
    updated[index] = newName;
    setPhysicalNamesList(updated);
  };

  const handleSaveBatchPhysicalNames = async () => {
    const emptyCount = physicalNamesList.filter((n) => !n || !n.trim()).length;
    if (emptyCount > 0) {
      if (!confirm(`Existem ${emptyCount} nomes em branco. Deseja salvar mesmo assim?`)) {
        return;
      }
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/raffle/admin/batch-rename-slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminPin,
          names: physicalNamesList,
          resetReservations: !keepReservationsOnBatch,
        }),
      });

      if (res.ok) {
        await onRefreshData();
        showFeedback('Todos os 100 nomes da cartela física foram atualizados com sucesso!');
      } else {
        const data = await res.json();
        showFeedback(data.error || 'Erro ao salvar nomes', 'error');
      }
    } catch {
      showFeedback('Erro de conexão com o servidor', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSlotStatus = async (slotId: number, status: 'available' | 'reserved' | 'paid') => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/raffle/admin/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminPin, slotId, status }),
      });
      if (res.ok) {
        await onRefreshData();
        showFeedback(
          status === 'available'
            ? 'Nome liberado e colocado como disponível!'
            : status === 'paid'
            ? 'Pagamento confirmado com sucesso!'
            : 'Marcado como pendente!'
        );
      } else {
        showFeedback('Erro ao atualizar status', 'error');
      }
    } catch {
      showFeedback('Falha de conexão', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Photo upload for winning physical ticket
  const handleWinnerPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showFeedback('A imagem selecionada é muito pesada (máx 5MB).', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setWinnerPhotoUrl(reader.result as string);
      showFeedback('Foto do bilhete carregada com sucesso!');
    };
    reader.readAsDataURL(file);
  };

  // Handle custom QR code image upload
  const handleQrCodeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setSettingsForm((prev) => ({ ...prev, pixQrCodeImage: reader.result as string }));
      showFeedback('Imagem do QR Code do banco carregada com sucesso!');
    };
    reader.readAsDataURL(file);
  };

  // Publish physical raffle winner with photo & video
  const handlePublishPhysicalWinner = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch('/api/raffle/admin/set-physical-winner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminPin,
          pin: adminPin,
          slotId: Number(selectedWinnerSlotId),
          photoUrl: winnerPhotoUrl,
          videoUrl: winnerVideoUrl.trim() || undefined,
          announcementNotes: winnerAnnouncementNotes,
          winnerName: winnerNameInput.trim(),
          winnerPhone: winnerPhoneInput.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.winner) {
        setIsEditingWinner(false);
        await onRefreshData();
        try {
          confetti({
            particleCount: 150,
            spread: 90,
            origin: { y: 0.5 },
          });
        } catch {
          // ignore
        }
        showFeedback(
          isEditingWinner
            ? '✅ Divulgação do ganhador atualizada com sucesso!'
            : '🎉 Vencedor da rifa física publicado com sucesso no aplicativo!'
        );
      } else {
        showFeedback(data.error || 'Erro ao publicar vencedor', 'error');
      }
    } catch {
      showFeedback('Erro de comunicação com o servidor', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartEditWinner = () => {
    if (!winner) return;
    setSelectedWinnerSlotId(winner.slotId);
    setWinnerNameInput(winner.buyerName);
    setWinnerPhoneInput(winner.buyerPhone || '');
    setWinnerPhotoUrl(winner.photoUrl || '');
    setWinnerVideoUrl(winner.videoUrl || '');
    setWinnerAnnouncementNotes(
      winner.announcementNotes || 'Entraremos em contato com o ganhador para organizar e agendar o jantar!'
    );
    setIsEditingWinner(true);
  };

  const handleExecuteRemoveWinner = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/raffle/admin/reset-winner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminPin, pin: adminPin }),
      });
      if (res.ok) {
        setShowConfirmRemoveWinner(false);
        setWinnerPhotoUrl('');
        setWinnerVideoUrl('');
        setWinnerNameInput('');
        setWinnerPhoneInput('');
        setIsEditingWinner(false);
        await onRefreshData();
        showFeedback('Divulgação do ganhador removida com sucesso! A rifa voltou ao estado normal.');
      } else {
        const data = await res.json();
        showFeedback(data.error || 'Erro ao remover divulgação', 'error');
      }
    } catch {
      showFeedback('Erro de conexão ao remover divulgação', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReleaseExpiredReservations = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/raffle/admin/release-expired', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminPin, pin: adminPin }),
      });
      const data = await res.json();
      if (res.ok) {
        await onRefreshData();
        showFeedback(data.message || 'Verificação de reservas expiradas concluída!');
      } else {
        showFeedback(data.error || 'Erro ao liberar reservas', 'error');
      }
    } catch {
      showFeedback('Erro de conexão', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const payload: any = { ...settingsForm };
      if (newPin.trim()) {
        payload.newAdminPin = newPin.trim();
      }
      const res = await fetch('/api/raffle/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminPin, config: payload }),
      });
      if (res.ok) {
        if (newPin.trim()) {
          setAdminPin(newPin.trim());
          setNewPin('');
        }
        await onRefreshData();
        showFeedback('Configurações salvas com sucesso!');
      } else {
        showFeedback('Erro ao salvar configurações', 'error');
      }
    } catch {
      showFeedback('Erro de conexão', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetRaffle = async () => {
    const confirmation = prompt(
      'ATENÇÃO: Isso irá apagar todas as reservas e deixar os 100 nomes livres novamente!\n\nDigite "CONFIRMAR" para prosseguir:'
    );
    if (confirmation !== 'CONFIRMAR') return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/raffle/admin/reset-raffle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminPin, resetSlotsOnly: true }),
      });
      if (res.ok) {
        await onRefreshData();
        showFeedback('Cartela zerada e reiniciada com sucesso!');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Numero', 'Nome_Cartela', 'Status', 'Comprador', 'Telefone', 'Reservado_Em', 'Pago_Em'];
    const rows = slots.map((s) => [
      s.id,
      `"${s.name}"`,
      s.status,
      `"${s.buyerName || ''}"`,
      `"${s.buyerPhone || ''}"`,
      `"${s.reservedAt || ''}"`,
      `"${s.paidAt || ''}"`,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio_rifa_pequeno_cidadao_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredSlots = slots.filter((slot) => {
    if (filterStatus === 'available' && slot.status !== 'available') return false;
    if (filterStatus === 'reserved' && slot.status !== 'reserved') return false;
    if (filterStatus === 'paid' && slot.status !== 'paid') return false;

    if (searchSlots.trim()) {
      const q = searchSlots.toLowerCase().trim();
      return (
        slot.name.toLowerCase().includes(q) ||
        String(slot.id).includes(q) ||
        (slot.buyerName && slot.buyerName.toLowerCase().includes(q)) ||
        (slot.buyerPhone && slot.buyerPhone.includes(q))
      );
    }
    return true;
  });

  const paidCount = slots.filter((s) => s.status === 'paid').length;
  const reservedCount = slots.filter((s) => s.status === 'reserved').length;
  const availableCount = slots.filter((s) => s.status === 'available').length;
  const totalRaised = paidCount * config.pricePerTicket;
  const totalPending = reservedCount * config.pricePerTicket;
  const totalPotential = 100 * config.pricePerTicket;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-[#fbfbfd] text-[#1d1d1f] rounded-3xl max-w-4xl w-full shadow-2xl border border-black/10 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="bg-[#1d1d1f] text-white p-4 sm:p-5 flex items-center justify-between border-b border-black/20 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold text-base shadow-sm">
              👑
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-400/20">
                  Painel de Controle
                </span>
                <span className="text-xs text-slate-400">Casa do Pequeno Cidadão</span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white line-clamp-1">{config.title}</h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <button
                onClick={() => setIsAuthenticated(false)}
                className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-full bg-slate-800 transition-colors cursor-pointer"
              >
                Sair
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback message banner */}
        {feedbackMsg && (
          <div
            className={`px-4 py-2 text-xs font-bold flex items-center justify-between transition-all ${
              feedbackMsg.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
            }`}
          >
            <span>{feedbackMsg.text}</span>
            <button onClick={() => setFeedbackMsg(null)}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Body */}
        {!isAuthenticated ? (
          /* Login Form */
          <div className="p-8 sm:p-12 text-center max-w-md mx-auto my-auto space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center justify-center mx-auto text-2xl shadow-inner">
              <Lock className="w-8 h-8" />
            </div>

            <div>
              <h4 className="text-xl font-bold text-[#1d1d1f]">Acesso do Organizador</h4>
              <p className="text-xs sm:text-sm text-[#86868b] mt-1">
                Área restrita aos organizadores para cadastrar vendas, alterar nomes e divulgar o vencedor da rifa física.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                  placeholder="Senha (padrão: 1234)"
                  className="w-full text-center text-lg font-mono tracking-widest px-4 py-3 rounded-2xl bg-white border border-black/10 focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/10 outline-none"
                  autoFocus
                />
                {pinError && <p className="text-xs text-rose-600 font-semibold mt-1.5">{pinError}</p>}
                <p className="text-[11px] text-[#86868b] mt-2">
                  Senha padrão inicial configurada: <strong>1234</strong>
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-[#1d1d1f] hover:bg-[#2d2d2f] text-white font-semibold text-sm shadow-md transition-all cursor-pointer"
              >
                {isLoading ? 'Verificando...' : 'Entrar no Painel'}
              </button>
            </form>
          </div>
        ) : (
          /* Authenticated Dashboard */
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-black/[0.06] bg-white px-3 pt-2 gap-1 overflow-x-auto shrink-0">
              <button
                onClick={() => setActiveTab('slots')}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-t-xl text-xs sm:text-sm font-semibold transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'slots'
                    ? 'border-[#0071e3] text-[#0071e3] bg-[#fbfbfd]'
                    : 'border-transparent text-[#86868b] hover:text-[#1d1d1f]'
                }`}
              >
                <ListOrdered className="w-4 h-4" />
                <span>Nomes & Vendas ({slots.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('edit-physical-names')}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-t-xl text-xs sm:text-sm font-semibold transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'edit-physical-names'
                    ? 'border-[#0071e3] text-[#0071e3] bg-[#fbfbfd]'
                    : 'border-transparent text-[#86868b] hover:text-[#1d1d1f]'
                }`}
              >
                <Pencil className="w-4 h-4" />
                <span>Editar 100 Nomes da Cartela Física</span>
              </button>

              <button
                onClick={() => setActiveTab('draw')}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-t-xl text-xs sm:text-sm font-semibold transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'draw'
                    ? 'border-amber-500 text-amber-700 bg-[#fbfbfd]'
                    : 'border-transparent text-[#86868b] hover:text-[#1d1d1f]'
                }`}
              >
                <Trophy className="w-4 h-4 text-amber-500" />
                <span>Divulgar Ganhador Oficial</span>
                {winner && <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />}
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-t-xl text-xs sm:text-sm font-semibold transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'settings'
                    ? 'border-[#0071e3] text-[#0071e3] bg-[#fbfbfd]'
                    : 'border-transparent text-[#86868b] hover:text-[#1d1d1f]'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Configurações & PIX</span>
              </button>

              <button
                onClick={() => setActiveTab('reports')}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-t-xl text-xs sm:text-sm font-semibold transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'reports'
                    ? 'border-[#0071e3] text-[#0071e3] bg-[#fbfbfd]'
                    : 'border-transparent text-[#86868b] hover:text-[#1d1d1f]'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Relatórios</span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              {/* TAB 1: SLOTS & SALES MANAGEMENT */}
              {activeTab === 'slots' && (
                <div className="space-y-4">
                  {/* Toolbar */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <input
                      type="text"
                      placeholder="Buscar por nome, número ou comprador..."
                      value={searchSlots}
                      onChange={(e) => setSearchSlots(e.target.value)}
                      className="w-full sm:w-72 px-3 py-2 text-xs rounded-xl bg-white border border-black/10 focus:outline-none focus:border-[#0071e3]"
                    />

                    <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
                      <button
                        onClick={() => setFilterStatus('all')}
                        className={`px-2.5 py-1 text-xs rounded-lg font-bold cursor-pointer ${
                          filterStatus === 'all' ? 'bg-[#1d1d1f] text-white' : 'bg-black/[0.04] text-[#1d1d1f]'
                        }`}
                      >
                        Todos ({slots.length})
                      </button>
                      <button
                        onClick={() => setFilterStatus('available')}
                        className={`px-2.5 py-1 text-xs rounded-lg font-bold cursor-pointer ${
                          filterStatus === 'available' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-800'
                        }`}
                      >
                        Livres ({availableCount})
                      </button>
                      <button
                        onClick={() => setFilterStatus('reserved')}
                        className={`px-2.5 py-1 text-xs rounded-lg font-bold cursor-pointer ${
                          filterStatus === 'reserved' ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-800'
                        }`}
                      >
                        Pendentes ({reservedCount})
                      </button>
                      <button
                        onClick={() => setFilterStatus('paid')}
                        className={`px-2.5 py-1 text-xs rounded-lg font-bold cursor-pointer ${
                          filterStatus === 'paid' ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-800'
                        }`}
                      >
                        Pagos ({paidCount})
                      </button>

                      <button
                        type="button"
                        onClick={handleReleaseExpiredReservations}
                        disabled={isLoading}
                        className="px-2.5 py-1 text-xs rounded-lg font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 transition-colors cursor-pointer flex items-center gap-1 shrink-0 ml-auto"
                        title="Verificar e liberar nomes reservados há mais de 3 dias sem pagamento"
                      >
                        <Clock className="w-3 h-3 text-amber-700" />
                        <span>Liberar Expirados (&gt; 3 dias)</span>
                      </button>
                    </div>
                  </div>

                  {/* Slots Table */}
                  <div className="border border-black/[0.06] rounded-2xl overflow-hidden shadow-2xs bg-white">
                    <div className="overflow-x-auto max-h-[500px]">
                      <table className="w-full text-left text-xs text-slate-600">
                        <thead className="bg-[#f5f5f7] uppercase text-[10px] font-bold text-[#86868b] sticky top-0 z-10">
                          <tr>
                            <th className="p-3">#</th>
                            <th className="p-3">Nome da Cartela</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Comprador</th>
                            <th className="p-3">WhatsApp</th>
                            <th className="p-3 text-right">Ações do Administrador</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-black/[0.04]">
                          {filteredSlots.map((slot) => {
                            const rawPhone = cleanPhone(slot.buyerPhone || '');
                            const waLink = rawPhone
                              ? `https://wa.me/55${rawPhone}?text=${encodeURIComponent(
                                  `Olá ${slot.buyerName || ''}! Falo sobre a rifa da Casa do Pequeno Cidadão referente ao nome #${slot.id} ${slot.name}.`
                                )}`
                              : '#';

                            const isEditingThis = editingSlotId === slot.id;

                            return (
                              <tr key={slot.id} className="hover:bg-black/[0.02] transition-colors">
                                <td className="p-3 font-mono font-bold text-[#1d1d1f]">
                                  #{String(slot.id).padStart(2, '0')}
                                </td>

                                {/* Name Cell with inline edit */}
                                <td className="p-3 font-bold text-[#1d1d1f] text-sm">
                                  {isEditingThis ? (
                                    <div className="flex items-center gap-1.5">
                                      <input
                                        type="text"
                                        value={editingSlotName}
                                        onChange={(e) => setEditingSlotName(e.target.value)}
                                        className="px-2 py-1 text-xs border border-[#0071e3] rounded-lg outline-none bg-white w-36 font-bold"
                                        autoFocus
                                      />
                                      <button
                                        onClick={() => handleSaveSingleSlotName(slot.id)}
                                        disabled={isLoading}
                                        className="p-1 rounded-md bg-[#0071e3] text-white hover:bg-[#0077ed]"
                                        title="Salvar novo nome"
                                      >
                                        <Check className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => setEditingSlotId(null)}
                                        className="p-1 rounded-md bg-black/5 text-[#86868b] hover:bg-black/10"
                                        title="Cancelar"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2 group/name">
                                      <span>{slot.name}</span>
                                      <button
                                        onClick={() => handleStartEditSlot(slot)}
                                        className="text-[#86868b] hover:text-[#0071e3] p-0.5 rounded opacity-40 group-hover/name:opacity-100 transition-opacity cursor-pointer"
                                        title="Editar nome deste número"
                                      >
                                        <Pencil className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  )}
                                </td>

                                <td className="p-3">
                                  {slot.status === 'available' ? (
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#e8f5e9] text-emerald-800">
                                      🟢 Livre
                                    </span>
                                  ) : slot.status === 'paid' ? (
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#ede9fe] text-purple-900 flex items-center gap-1 w-max">
                                      🟣 Pago
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#fef9c3] text-amber-900 flex items-center gap-1 w-max">
                                      🟡 Reservado
                                    </span>
                                  )}
                                </td>

                                <td className="p-3 font-medium text-[#1d1d1f]">
                                  {slot.buyerName || <span className="text-[#86868b] italic">-</span>}
                                  {slot.buyerNotes && (
                                    <span className="block text-[10px] text-[#86868b]">{slot.buyerNotes}</span>
                                  )}
                                </td>

                                <td className="p-3">
                                  {slot.buyerPhone ? (
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-mono text-[#1d1d1f]">{slot.buyerPhone}</span>
                                      <a
                                        href={waLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1 rounded bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                        title="Abrir WhatsApp com o comprador"
                                      >
                                        <MessageCircle className="w-3.5 h-3.5" />
                                      </a>
                                    </div>
                                  ) : (
                                    <span className="text-[#86868b] italic">-</span>
                                  )}
                                </td>

                                <td className="p-3 text-right">
                                  <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                    <button
                                      type="button"
                                      onClick={() => onOpenSlotEdit?.(slot)}
                                      className="px-2.5 py-1 bg-[#1d1d1f] hover:bg-[#2d2d2f] text-white rounded-lg font-semibold text-[11px] transition-all cursor-pointer"
                                      title="Editar status completo (Livre, Reservado, Pago) e dados do participante"
                                    >
                                      Editar Status
                                    </button>

                                    {slot.status === 'reserved' && (
                                      <button
                                        onClick={() => handleUpdateSlotStatus(slot.id, 'paid')}
                                        className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] transition-all cursor-pointer"
                                        title="Confirmar pagamento recebido"
                                      >
                                        Marcar Pago
                                      </button>
                                    )}

                                    {slot.status !== 'available' && (
                                      <button
                                        onClick={() => {
                                          if (confirm(`Liberar o nome "${slot.name}" de volta para disponível?`)) {
                                            handleUpdateSlotStatus(slot.id, 'available');
                                          }
                                        }}
                                        className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg font-semibold text-[11px] transition-all cursor-pointer"
                                        title="Liberar este nome"
                                      >
                                        Liberar
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: EDIT / IMPORT PHYSICAL RAFFLE NAMES */}
              {activeTab === 'edit-physical-names' && (
                <div className="space-y-6">
                  {/* Informational Callout */}
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 sm:p-5 flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
                      📝
                    </div>
                    <div>
                      <h4 className="font-bold text-emerald-950 text-sm sm:text-base">
                        Sincronizar com a sua Cartela Física de 100 Nomes
                      </h4>
                      <p className="text-xs sm:text-sm text-emerald-800 mt-1 leading-relaxed">
                        Como você já possui a cartela física impressa para a Casa do Pequeno Cidadão, digite ou cole os 100 nomes exatos abaixo. Os nomes serão atualizados imediatamente no aplicativo para facilitar suas vendas!
                      </p>
                    </div>
                  </div>

                  {/* Section A: Bulk Paste Tool */}
                  <div className="bg-white border border-black/[0.06] rounded-2xl p-4 sm:p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ClipboardList className="w-4 h-4 text-emerald-600" />
                        <h5 className="font-bold text-[#1d1d1f] text-sm">Opção 1: Colar Lista dos 100 Nomes em Lote</h5>
                      </div>
                      <span className="text-xs text-[#86868b]">Um por linha ou separados por vírgula</span>
                    </div>

                    <textarea
                      rows={5}
                      value={bulkPasteText}
                      onChange={(e) => setBulkPasteText(e.target.value)}
                      placeholder={`Cole aqui os 100 nomes da sua cartela física. Exemplos aceitos:\n1. Amor\n2. Bondade\n3. Coragem\nou: Maria, João, Pedro, Ana...`}
                      className="w-full p-3 text-xs sm:text-sm rounded-xl border border-black/10 focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/10 outline-none font-mono"
                    />

                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={handleParseBulkText}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                      >
                        <UploadCloud className="w-4 h-4" />
                        <span>Processar e Preencher nos 100 Slots Abaixo</span>
                      </button>

                      <span className="text-xs text-[#86868b]">
                        Após processar, confira os nomes na grade abaixo e clique em Salvar.
                      </span>
                    </div>
                  </div>

                  {/* Section B: 100 Slots Editable Grid */}
                  <div className="bg-white border border-black/[0.06] rounded-2xl p-4 sm:p-5 space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-black/[0.04]">
                      <div>
                        <h5 className="font-bold text-[#1d1d1f] text-sm">Opção 2: Editar Slot por Slot (#01 a #100)</h5>
                        <p className="text-xs text-[#86868b]">
                          Edite diretamente qualquer nome digitando no campo correspondente ao número da cartela física.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={keepReservationsOnBatch}
                            onChange={(e) => setKeepReservationsOnBatch(e.target.checked)}
                            className="rounded text-[#0071e3]"
                          />
                          <span className="font-semibold">Preservar nomes já vendidos/reservados</span>
                        </label>
                      </div>
                    </div>

                    {/* The 100 input fields in responsive grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 max-h-[420px] overflow-y-auto p-1 border border-black/[0.06] rounded-xl bg-slate-50/50">
                      {physicalNamesList.map((name, idx) => {
                        const slotNumber = idx + 1;
                        const originalSlot = slots[idx];
                        const isSold = originalSlot && originalSlot.status !== 'available';

                        return (
                          <div
                            key={slotNumber}
                            className={`flex items-center gap-1.5 p-2 rounded-xl border bg-white shadow-2xs ${
                              isSold ? 'border-amber-300 bg-amber-50/30' : 'border-slate-200'
                            }`}
                          >
                            <span className="font-mono font-bold text-xs text-[#86868b] shrink-0 w-8">
                              #{String(slotNumber).padStart(2, '0')}
                            </span>
                            <input
                              type="text"
                              value={name || ''}
                              onChange={(e) => handlePhysicalNameChange(idx, e.target.value)}
                              placeholder={`Nome #${slotNumber}`}
                              className="w-full text-xs font-semibold px-2 py-1 rounded-md border border-slate-200 focus:border-[#0071e3] outline-none"
                            />
                            {isSold && (
                              <span
                                className="w-2 h-2 rounded-full bg-amber-500 shrink-0"
                                title={`Já reservado por: ${originalSlot?.buyerName || 'Participante'}`}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Save Button */}
                    <div className="pt-2 flex items-center justify-between flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={handleSaveBatchPhysicalNames}
                        disabled={isLoading}
                        className="py-3 px-6 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white font-bold text-sm shadow-md transition-all flex items-center gap-2 active:scale-98 disabled:opacity-50 cursor-pointer"
                      >
                        <Save className="w-4 h-4" />
                        <span>Salvar Todos os Nomes na Cartela Oficial</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('Recarregar os nomes salvos atualmente no servidor?')) {
                            onRefreshData();
                          }
                        }}
                        className="text-xs text-[#86868b] hover:text-[#1d1d1f] underline cursor-pointer"
                      >
                        Recarregar nomes salvos
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: ANNOUNCE PHYSICAL RAFFLE WINNER (WITH PHOTO) */}
              {activeTab === 'draw' && (
                <div className="space-y-6 max-w-2xl mx-auto py-2">
                  {/* Current winner banner if already published */}
                  {winner && !isEditingWinner ? (
                    <div className="bg-amber-50/90 border-2 border-amber-300 rounded-3xl p-6 sm:p-7 text-center space-y-4 shadow-sm">
                      <div className="w-16 h-16 bg-amber-400 text-slate-950 rounded-2xl flex items-center justify-center text-3xl mx-auto shadow-md">
                        👑
                      </div>
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-900 bg-amber-200/80 px-3 py-1 rounded-full border border-amber-300">
                          Divulgação Ativa no Aplicativo
                        </span>
                        <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
                          #{winner.slotId} - {winner.slotName}
                        </h3>
                        <p className="text-sm font-semibold text-slate-700 mt-1">
                          Comprador: <strong className="text-slate-950 font-black">{winner.buyerName}</strong>
                          {winner.buyerPhone && ` (${winner.buyerPhone})`}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">Apurado em: {formatDate(winner.drawnAt)}</p>

                        {winner.photoUrl && (
                          <div className="mt-3 flex flex-col items-center">
                            <span className="text-[11px] font-bold text-slate-600 mb-1">Foto do Bilhete Físico:</span>
                            <img
                              src={winner.photoUrl}
                              alt="Bilhete vencedor"
                              className="max-h-48 rounded-xl border border-amber-300 shadow-md object-contain bg-white p-1"
                            />
                          </div>
                        )}

                        {winner.videoUrl && (
                          <div className="mt-3 flex flex-col items-center">
                            <span className="text-[11px] font-bold text-slate-600 mb-1">Vídeo da Abertura da Cartela:</span>
                            <a
                              href={winner.videoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-100 hover:bg-red-200 text-red-900 text-xs font-bold border border-red-300 transition-colors"
                            >
                              <Video className="w-3.5 h-3.5 text-red-600" />
                              <span>Assistir Gravação da Cartela Deslacrada</span>
                              <ExternalLink className="w-3 h-3 text-red-600" />
                            </a>
                          </div>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 max-w-md mx-auto">
                        Este resultado está visível para todas as pessoas que acessarem a rifa. Você pode editar os dados ou remover a divulgação a qualquer momento.
                      </p>

                      {/* Primary Actions: Edit or Remove with inline confirmation */}
                      {showConfirmRemoveWinner ? (
                        <div className="p-4.5 bg-rose-50 border-2 border-rose-300 rounded-2xl space-y-2.5 text-left animate-in fade-in duration-200">
                          <div className="flex items-center gap-2 text-rose-950 font-bold text-xs sm:text-sm">
                            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                            <span>Confirmar remoção da divulgação do ganhador?</span>
                          </div>
                          <p className="text-xs text-rose-900 leading-relaxed">
                            O banner comemorativo sairá imediatamente do topo do aplicativo para todos os participantes, voltando a cartela para o modo normal sem ganhador.
                          </p>
                          <div className="flex items-center gap-2.5 pt-1 flex-wrap">
                            <button
                              type="button"
                              onClick={handleExecuteRemoveWinner}
                              disabled={isLoading}
                              className="py-2.5 px-5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>{isLoading ? 'Removendo...' : 'Sim, Remover Agora'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowConfirmRemoveWinner(false)}
                              disabled={isLoading}
                              className="py-2.5 px-4 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs transition-colors cursor-pointer"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                          <button
                            type="button"
                            onClick={handleStartEditWinner}
                            className="w-full sm:w-auto py-3 px-6 rounded-2xl bg-[#0071e3] hover:bg-[#0077ed] text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                          >
                            <Pencil className="w-4 h-4" />
                            <span>Editar Informações / Foto / Vídeo</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (confirm('Tem certeza que deseja remover esta divulgação do ganhador e voltar a rifa ao estado normal?')) {
                                handleExecuteRemoveWinner();
                              }
                            }}
                            className="w-full sm:w-auto py-3 px-6 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Remover Divulgação (Voltar Rifa ao Normal)</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Form to publish or edit physical winner */
                    <form
                      onSubmit={handlePublishPhysicalWinner}
                      className="bg-white rounded-3xl p-6 border border-black/[0.08] shadow-sm space-y-5"
                    >
                      {isEditingWinner ? (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Pencil className="w-4 h-4 text-[#0071e3]" />
                            <span className="text-xs font-bold text-blue-950">
                              Editando Divulgação do Ganhador #{selectedWinnerSlotId}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsEditingWinner(false)}
                            className="text-xs font-semibold text-slate-600 hover:text-slate-900 underline cursor-pointer"
                          >
                            Cancelar Edição
                          </button>
                        </div>
                      ) : (
                        <div>
                          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                            <Camera className="w-3.5 h-3.5" />
                            <span>Apuração da Cartela Física</span>
                          </div>
                          <h4 className="text-lg font-bold text-[#1d1d1f] mt-1.5">
                            Divulgar Nome e Foto do Vencedor da Rifa Física
                          </h4>
                          <p className="text-xs text-[#86868b] mt-0.5">
                            Selecione o número/nome que saiu na abertura da sua cartela física de papel e anexe a foto do bilhete para que todos possam verificar a transparência.
                          </p>
                        </div>
                      )}

                      {/* Slot selector */}
                      <div>
                        <label className="block text-xs font-bold text-[#1d1d1f] uppercase tracking-wider mb-1">
                          Número e Nome Sorteado na Cartela Física:
                        </label>
                        <select
                          value={selectedWinnerSlotId}
                          onChange={(e) => setSelectedWinnerSlotId(Number(e.target.value))}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 text-sm font-semibold bg-white focus:border-[#0071e3] outline-none"
                        >
                          {slots.map((s) => (
                            <option key={s.id} value={s.id}>
                              #{String(s.id).padStart(2, '0')} - {s.name}{' '}
                              {s.buyerName ? `(Comprador: ${s.buyerName})` : '(Livre)'}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Winner Name and Phone */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-[#1d1d1f] uppercase tracking-wider mb-1">
                            Nome do Ganhador:
                          </label>
                          <input
                            type="text"
                            required
                            value={winnerNameInput}
                            onChange={(e) => setWinnerNameInput(e.target.value)}
                            placeholder="Ex: João da Silva"
                            className="w-full px-3 py-2 text-sm rounded-xl border border-black/10 focus:border-[#0071e3] outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-[#1d1d1f] uppercase tracking-wider mb-1">
                            Telefone / WhatsApp:
                          </label>
                          <input
                            type="text"
                            value={winnerPhoneInput}
                            onChange={(e) => setWinnerPhoneInput(e.target.value)}
                            placeholder="(11) 98765-4321"
                            className="w-full px-3 py-2 text-sm rounded-xl border border-black/10 focus:border-[#0071e3] outline-none"
                          />
                        </div>
                      </div>

                      {/* Photo upload */}
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                            <Camera className="w-4 h-4 text-emerald-600" />
                            Foto do Nome / Bilhete Vencedor da Rifa Física:
                          </span>
                          {winnerPhotoUrl && (
                            <button
                              type="button"
                              onClick={() => setWinnerPhotoUrl('')}
                              className="text-xs text-rose-600 hover:underline cursor-pointer"
                            >
                              Remover Foto
                            </button>
                          )}
                        </div>

                        {winnerPhotoUrl ? (
                          <div className="flex flex-col items-center">
                            <img
                              src={winnerPhotoUrl}
                              alt="Preview do bilhete vencedor"
                              className="max-h-48 rounded-xl border border-slate-300 shadow-sm object-contain bg-white p-1"
                            />
                            <span className="text-[11px] text-emerald-700 font-semibold mt-1">
                              Foto anexada e pronta para exibição!
                            </span>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 rounded-xl bg-white hover:bg-slate-50 cursor-pointer transition-colors">
                            <Camera className="w-8 h-8 text-slate-400 mb-2" />
                            <span className="text-xs font-bold text-[#0071e3]">
                              Clique para tirar uma foto com a câmera ou escolher da galeria
                            </span>
                            <span className="text-[11px] text-slate-400 mt-1">
                              Foto nítida da cartela física de papel com o nome vencedor aberto
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleWinnerPhotoUpload}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>

                      {/* Video Link */}
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                        <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                          <Video className="w-4 h-4 text-red-600" />
                          Link do Vídeo da Abertura da Cartela Física (Auditoria Pública):
                        </label>
                        <p className="text-[11px] text-slate-500">
                          Além da foto, anexe o link do vídeo gravado no momento em que a cartela física de papel foi deslacrada (YouTube, Google Drive, Vimeo, etc.).
                        </p>
                        <div className="flex items-center gap-2">
                          <input
                            type="url"
                            value={winnerVideoUrl}
                            onChange={(e) => setWinnerVideoUrl(e.target.value)}
                            placeholder="https://youtube.com/watch?v=... ou link do Google Drive / Vimeo"
                            className="flex-1 px-3 py-2 text-sm rounded-xl border border-black/10 focus:border-[#0071e3] outline-none bg-white font-mono text-xs"
                          />
                          {winnerVideoUrl && (
                            <button
                              type="button"
                              onClick={() => setWinnerVideoUrl('')}
                              className="text-xs text-rose-600 hover:underline px-2 py-1 cursor-pointer font-semibold"
                            >
                              Limpar
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Announcement text */}
                      <div>
                        <label className="block text-xs font-bold text-[#1d1d1f] uppercase tracking-wider mb-1">
                          Mensagem de Contato e Agendamento:
                        </label>
                        <input
                          type="text"
                          value={winnerAnnouncementNotes}
                          onChange={(e) => setWinnerAnnouncementNotes(e.target.value)}
                          placeholder="Ex: Entraremos em contato com o ganhador para organizar e agendar o jantar!"
                          className="w-full px-3 py-2 text-sm rounded-xl border border-black/10 focus:border-[#0071e3] outline-none"
                        />
                      </div>

                      <div className="pt-2 flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm sm:text-base shadow-xl shadow-amber-500/25 transition-all active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Sparkles className="w-5 h-5" />
                          <span>
                            {isEditingWinner
                              ? 'Salvar Alterações da Divulgação'
                              : 'Publicar Ganhador Oficial com Foto e Vídeo'}
                          </span>
                        </button>

                        {isEditingWinner && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm('Tem certeza que deseja excluir/remover esta divulgação e voltar a rifa para o estado normal sem ganhador?')) {
                                  handleExecuteRemoveWinner();
                                }
                              }}
                              className="py-4 px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                              title="Remover divulgação"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Remover</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setIsEditingWinner(false)}
                              className="py-4 px-4 rounded-2xl bg-black/[0.05] hover:bg-black/[0.1] text-[#1d1d1f] font-semibold text-xs sm:text-sm transition-all cursor-pointer shrink-0"
                            >
                              Cancelar
                            </button>
                          </>
                        )}
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* TAB 4: SETTINGS */}
              {activeTab === 'settings' && (
                <form onSubmit={handleSaveSettings} className="space-y-4 max-w-2xl mx-auto py-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Título da Rifa
                      </label>
                      <input
                        type="text"
                        value={settingsForm.title}
                        onChange={(e) => setSettingsForm({ ...settingsForm, title: e.target.value })}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:border-emerald-500 outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Prêmio Principal
                      </label>
                      <input
                        type="text"
                        value={settingsForm.prize}
                        onChange={(e) => setSettingsForm({ ...settingsForm, prize: e.target.value })}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:border-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Valor por Nome (R$)
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={settingsForm.pricePerTicket}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, pricePerTicket: parseFloat(e.target.value) || 100 })
                        }
                        className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:border-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Período de Vendas
                      </label>
                      <input
                        type="text"
                        value={settingsForm.salesPeriod || 'Outubro e Novembro / 2026'}
                        onChange={(e) => setSettingsForm({ ...settingsForm, salesPeriod: e.target.value })}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:border-emerald-500 outline-none"
                      />
                    </div>

                    {/* PIX Section */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Chave PIX (Telefone Shirley)
                      </label>
                      <input
                        type="text"
                        value={settingsForm.pixKey}
                        onChange={(e) => setSettingsForm({ ...settingsForm, pixKey: e.target.value })}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:border-emerald-500 outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Nome do Titular do PIX
                      </label>
                      <input
                        type="text"
                        value={settingsForm.pixReceiverName}
                        onChange={(e) => setSettingsForm({ ...settingsForm, pixReceiverName: e.target.value })}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:border-emerald-500 outline-none"
                      />
                    </div>

                    {/* QR Code upload */}
                    <div className="sm:col-span-2 p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                          <QrCode className="w-4 h-4 text-emerald-600" />
                          Foto do QR Code do seu Banco (Opcional):
                        </span>
                        {settingsForm.pixQrCodeImage && (
                          <button
                            type="button"
                            onClick={() => setSettingsForm((prev) => ({ ...prev, pixQrCodeImage: '' }))}
                            className="text-xs text-rose-600 hover:underline cursor-pointer"
                          >
                            Remover Imagem e Usar QR Code Automático
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        O app já gera um QR Code automático para a chave PIX informada. Se você tiver o print do QR Code exportado diretamente pelo seu banco, pode anexar o arquivo aqui:
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleQrCodeUpload}
                        className="text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-slate-800 cursor-pointer"
                      />
                    </div>

                    {/* Organizers Contacts */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        WhatsApp Shirley Cristina Ortega
                      </label>
                      <input
                        type="text"
                        value={settingsForm.organizer2Phone || '(11) 95780-1850'}
                        onChange={(e) => setSettingsForm({ ...settingsForm, organizer2Phone: e.target.value })}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:border-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        WhatsApp Jeferson Bernardes
                      </label>
                      <input
                        type="text"
                        value={settingsForm.organizerPhone || '(11) 98712-1667'}
                        onChange={(e) => setSettingsForm({ ...settingsForm, organizerPhone: e.target.value })}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:border-emerald-500 outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Alterar Senha do Administrador (PIN)
                      </label>
                      <input
                        type="text"
                        placeholder="Deixe em branco para manter a atual"
                        value={newPin}
                        onChange={(e) => setNewPin(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:border-emerald-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 px-4 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>Salvar Configurações</span>
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 5: REPORTS & ACTIONS */}
              {activeTab === 'reports' && (
                <div className="space-y-6 max-w-2xl mx-auto py-2">
                  {/* Financial Overview */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
                      <div className="text-xs font-bold text-emerald-800 uppercase">Arrecadado (Pagos)</div>
                      <div className="text-xl sm:text-2xl font-black text-emerald-700 mt-1">
                        {formatBRL(totalRaised)}
                      </div>
                      <div className="text-[11px] text-emerald-600 mt-0.5">{paidCount} nomes confirmados</div>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
                      <div className="text-xs font-bold text-amber-800 uppercase">Aguardando PIX</div>
                      <div className="text-xl sm:text-2xl font-black text-amber-700 mt-1">
                        {formatBRL(totalPending)}
                      </div>
                      <div className="text-[11px] text-amber-600 mt-0.5">{reservedCount} nomes pendentes</div>
                    </div>

                    <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4 text-center">
                      <div className="text-xs font-bold text-slate-700 uppercase">Potencial Total</div>
                      <div className="text-xl sm:text-2xl font-black text-slate-800 mt-1">
                        {formatBRL(totalPotential)}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        100 nomes x {formatBRL(config.pricePerTicket)}
                      </div>
                    </div>
                  </div>

                  {/* Export and Print actions */}
                  <div className="bg-white border border-black/[0.06] rounded-2xl p-5 space-y-3">
                    <h5 className="font-bold text-[#1d1d1f] text-sm">Exportações e Impressão</h5>
                    <div className="flex flex-wrap gap-2.5">
                      <button
                        onClick={handleExportCSV}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                        <span>Baixar Planilha Excel/CSV</span>
                      </button>

                      <button
                        onClick={() => window.print()}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                      >
                        <Printer className="w-4 h-4" />
                        <span>Imprimir Relatório</span>
                      </button>
                    </div>
                  </div>

                  {/* Seed and Reset actions */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                    <h5 className="font-bold text-slate-900 text-sm">Ações da Cartela</h5>
                    <div className="flex flex-wrap gap-2.5">
                      <button
                        onClick={handleResetRaffle}
                        disabled={isLoading}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-xs cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Zerar Todas as Reservas (Reiniciar Cartela)</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
