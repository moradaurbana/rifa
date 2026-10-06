/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { RaffleData, RaffleSlot } from './types';
import { Header } from './components/Header';
import { RaffleGrid } from './components/RaffleGrid';
import { WinnerBanner } from './components/WinnerBanner';
import { CheckoutModal } from './components/CheckoutModal';
import { MyReservationsModal } from './components/MyReservationsModal';
import { RulesModal } from './components/RulesModal';
import { AdminModal } from './components/AdminModal';
import { AdminEditSlotModal } from './components/AdminEditSlotModal';
import { Check, Shield } from 'lucide-react';

const LOCAL_STORAGE_KEY = 'raffle_my_slot_ids_v1';

export default function App() {
  const [data, setData] = useState<RaffleData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // User active selection on the grid
  const [selectedSlots, setSelectedSlots] = useState<RaffleSlot[]>([]);

  // Admin session state
  const [adminPin, setAdminPin] = useState('1234');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [slotToEdit, setSlotToEdit] = useState<RaffleSlot | null>(null);
  const [isEditSlotModalOpen, setIsEditSlotModalOpen] = useState(false);

  // Notification toast (Apple Dynamic Island style)
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Stored slots chosen by this user on this browser/device
  const [mySlotIds, setMySlotIds] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Modal visibilities
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isMyReservationsOpen, setIsMyReservationsOpen] = useState(false);
  const [adminDefaultTab, setAdminDefaultTab] = useState<
    'slots' | 'edit-physical-names' | 'draw' | 'settings' | 'reports'
  >('slots');

  // Sync mySlotIds to localStorage
  const saveMySlotIds = (newIds: number[]) => {
    setMySlotIds(newIds);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newIds));
    } catch {
      // ignore
    }
  };

  // Fetch full state
  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/raffle');
      if (!res.ok) throw new Error('Não foi possível carregar a cartela.');
      const json: RaffleData = await res.json();
      setData(json);

      // Clean up any selected slots that might have been taken by another user in the background!
      setSelectedSlots((prev) =>
        prev.filter((sel) => {
          const remoteSlot = json.slots.find((s) => s.id === sel.id);
          return remoteSlot && remoteSlot.status === 'available';
        })
      );
      setErrorMessage(null);
    } catch (err: any) {
      console.error('Error fetching raffle:', err);
      setErrorMessage(err.message || 'Erro ao carregar dados.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Connect to SSE for instant real-time updates across all users & devices
  useEffect(() => {
    fetchData();

    // SSE connection
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/raffle/events');

      eventSource.onmessage = (event) => {
        try {
          const updatedState: RaffleData = JSON.parse(event.data);
          setData(updatedState);

          // Update user selection if any slot just became unavailable
          setSelectedSlots((prev) =>
            prev.filter((sel) => {
              const remoteSlot = updatedState.slots.find((s) => s.id === sel.id);
              return remoteSlot && remoteSlot.status === 'available';
            })
          );
        } catch (e) {
          console.error('Failed to parse SSE payload:', e);
        }
      };

      eventSource.onerror = () => {
        // Fallback or retry handles automatically
      };
    } catch (e) {
      console.error('SSE not supported or connection error:', e);
    }

    // Polling fallback every 4 seconds just in case SSE drops
    const interval = setInterval(fetchData, 4000);

    return () => {
      if (eventSource) eventSource.close();
      clearInterval(interval);
    };
  }, [fetchData]);

  // Toggle selection of a slot
  const handleToggleSlot = (slot: RaffleSlot) => {
    if (slot.status !== 'available') return;

    setSelectedSlots((prev) => {
      const exists = prev.some((s) => s.id === slot.id);
      if (exists) {
        return prev.filter((s) => s.id !== slot.id);
      } else {
        return [...prev, slot];
      }
    });
  };

  // Open direct slot editor for admin
  const handleAdminEditSlot = (slot: RaffleSlot) => {
    setSlotToEdit(slot);
    setIsEditSlotModalOpen(true);
  };

  // Quick random pick ("Surpresinha")
  const handleSelectRandom = () => {
    if (!data) return;
    const availableSlots = data.slots.filter(
      (s) => s.status === 'available' && !selectedSlots.some((sel) => sel.id === s.id)
    );

    if (availableSlots.length === 0) return;

    const randomIndex = Math.floor(Math.random() * availableSlots.length);
    const chosen = availableSlots[randomIndex];

    setSelectedSlots((prev) => [...prev, chosen]);
  };

  // Clear current active selection
  const handleClearSelection = () => {
    setSelectedSlots([]);
  };

  const handleDirectRemoveWinner = async () => {
    let pin = adminPin;
    if (!isAdminLoggedIn) {
      const input = prompt('Digite a senha do organizador para remover a divulgação (padrão: 1234):');
      if (!input) return;
      pin = input.trim();
    }

    if (!confirm('Tem certeza que deseja remover a divulgação do ganhador e voltar a rifa para o modo normal sem ganhador?')) {
      return;
    }

    try {
      const res = await fetch('/api/raffle/admin/reset-winner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminPin: pin, pin }),
      });
      const resData = await res.json();
      if (res.ok) {
        await fetchData();
        showToast('Divulgação do ganhador removida com sucesso!');
      } else {
        alert(resData.error || 'Erro ao remover divulgação. Verifique a senha.');
      }
    } catch {
      alert('Erro de conexão ao remover divulgação');
    }
  };

  // On reservation completed successfully in Checkout modal
  const handleSuccessReservation = (reservedIds: number[]) => {
    const updated = Array.from(new Set([...mySlotIds, ...reservedIds]));
    saveMySlotIds(updated);
    setSelectedSlots([]);
  };

  // Clear device history
  const handleClearHistory = () => {
    if (confirm('Deseja limpar os nomes salvos neste aparelho? (Isso não cancela sua compra na cartela)')) {
      saveMySlotIds([]);
    }
  };

  if (isLoading && !data) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-black/5 border border-black/10 flex items-center justify-center text-2xl animate-spin mb-4">
          🎟️
        </div>
        <h2 className="text-base font-semibold tracking-tight text-[#1d1d1f]">Carregando Cartela Oficial...</h2>
        <p className="text-xs text-[#86868b] mt-1">Conectando aos 100 nomes da Casa do Pequeno Cidadão</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] flex flex-col items-center justify-center p-4 text-center">
        <div className="text-3xl mb-3">⚠️</div>
        <h2 className="text-lg font-semibold text-rose-600">Falha ao carregar a rifa</h2>
        <p className="text-xs text-[#86868b] mt-1 max-w-sm">{errorMessage}</p>
        <button
          onClick={fetchData}
          className="mt-4 px-4 py-2 bg-[#1d1d1f] text-white rounded-full text-xs font-medium transition-all"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] flex flex-col selection:bg-[#0071e3] selection:text-white antialiased">
      {/* Apple-style Dynamic Toast Island */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-3 duration-300">
          <div className="bg-[#1d1d1f] text-white px-4 py-2 rounded-full shadow-2xl border border-white/10 flex items-center gap-2 text-xs font-medium">
            <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center">
              <Check className="w-2.5 h-2.5 stroke-[3]" />
            </span>
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Top Header & Bento Hero */}
      <Header
        config={data.config}
        slots={data.slots}
        onOpenRules={() => setIsRulesOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenMyReservations={() => setIsMyReservationsOpen(true)}
        mySlotsCount={mySlotIds.length}
        isAdminLoggedIn={isAdminLoggedIn}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Winner Hero if one was drawn */}
        {data.winner && (
          <WinnerBanner
            winner={data.winner}
            prizeTitle={data.config.prize}
            isAdmin={isAdminLoggedIn}
            onEditWinner={() => {
              setAdminDefaultTab('draw');
              setIsAdminOpen(true);
            }}
            onRemoveWinner={handleDirectRemoveWinner}
            onManageWinner={() => {
              setAdminDefaultTab('draw');
              setIsAdminOpen(true);
            }}
          />
        )}

        {/* 100-Name Grid & Filters */}
        <RaffleGrid
          slots={data.slots}
          selectedSlots={selectedSlots}
          mySlotIds={mySlotIds}
          pricePerTicket={data.config.pricePerTicket}
          isAdmin={isAdminLoggedIn}
          onToggleSlot={handleToggleSlot}
          onAdminEditSlot={handleAdminEditSlot}
          onClearSelection={handleClearSelection}
          onSelectRandom={handleSelectRandom}
          onProceedToCheckout={() => setIsCheckoutOpen(true)}
        />
      </main>

      {/* Apple-style Clean Footer */}
      <footer className="bg-white border-t border-black/[0.06] text-[#86868b] text-xs py-8 px-4 text-center mt-12">
        <div className="max-w-4xl mx-auto space-y-2">
          <div className="flex items-center justify-center gap-2 text-[#1d1d1f] font-semibold">
            <span>🎟️ {data.config.title}</span>
            <span>·</span>
            <span>Casa do Pequeno Cidadão</span>
          </div>
          <p className="text-[#86868b]">
            Cartela eletrônica de 100 nomes em tempo real. Cada nome escolhido fica imediatamente indisponível para outros participantes.
          </p>
          <div className="pt-2 flex items-center justify-center gap-3 text-[#86868b]">
            <button
              onClick={() => setIsRulesOpen(true)}
              className="hover:text-[#1d1d1f] transition-colors"
            >
              Regras do Sorteio
            </button>
            <span>·</span>
            <button
              onClick={() => setIsAdminOpen(true)}
              className="hover:text-[#1d1d1f] transition-colors"
            >
              Painel do Organizador
            </button>
            <span>·</span>
            <button
              onClick={() => {
                if (!isAdminLoggedIn) {
                  setIsAdminOpen(true);
                } else {
                  setIsAdminLoggedIn(false);
                  showToast('Modo Organizador desativado.');
                }
              }}
              className="hover:text-[#0071e3] transition-colors font-medium text-[#0071e3]"
            >
              {isAdminLoggedIn ? 'Desativar Modo Organizador' : 'Área do Organizador (Com Senha)'}
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        selectedSlots={selectedSlots}
        config={data.config}
        onClose={() => setIsCheckoutOpen(false)}
        onSuccessReservation={handleSuccessReservation}
      />

      <MyReservationsModal
        isOpen={isMyReservationsOpen}
        slots={data.slots}
        mySlotIds={mySlotIds}
        config={data.config}
        onClose={() => setIsMyReservationsOpen(false)}
        onClearHistory={handleClearHistory}
      />

      <RulesModal
        isOpen={isRulesOpen}
        config={data.config}
        onClose={() => setIsRulesOpen(false)}
      />

      <AdminModal
        isOpen={isAdminOpen}
        slots={data.slots}
        config={data.config}
        winner={data.winner}
        defaultTab={adminDefaultTab}
        currentAdminPin={adminPin}
        isAdminLoggedIn={isAdminLoggedIn}
        onClose={() => setIsAdminOpen(false)}
        onRefreshData={fetchData}
        onOpenSlotEdit={(slot) => {
          setSlotToEdit(slot);
          setIsEditSlotModalOpen(true);
        }}
        onAuthenticatedStateChange={(isAuth, pin) => {
          setIsAdminLoggedIn(isAuth);
          if (pin) setAdminPin(pin);
        }}
      />

      {/* Single Slot Edit Sheet for Admin */}
      <AdminEditSlotModal
        isOpen={isEditSlotModalOpen}
        slot={slotToEdit}
        adminPin={adminPin}
        onClose={() => {
          setIsEditSlotModalOpen(false);
          setSlotToEdit(null);
        }}
        onRefreshData={fetchData}
        onSuccessMessage={showToast}
      />
    </div>
  );
}
