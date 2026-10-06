import express from 'express';
import type { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, 'raffle-data.json');

export interface RaffleSlot {
  id: number; // 1 - 100
  name: string;
  status: 'available' | 'reserved' | 'paid';
  buyerName?: string;
  buyerPhone?: string;
  buyerNotes?: string;
  reservedAt?: string;
  paidAt?: string;
  reservationId?: string;
}

export interface RaffleConfig {
  title: string;
  description: string;
  prize: string;
  pricePerTicket: number;
  pixKey: string;
  pixKeyType: 'CPF' | 'CNPJ' | 'Email' | 'Telefone' | 'Aleatória';
  pixReceiverName: string;
  organizerName: string;
  organizerPhone: string;
  organizer2Name: string;
  organizer2Phone: string;
  rules: string;
  salesPeriod?: string;
  schedulingInfo?: string;
  transparencyInfo?: string;
  reservationToleranceDays?: number;
  pixQrCodeImage?: string;
  adminPin: string;
}

export interface RaffleWinner {
  slotId: number;
  slotName: string;
  buyerName: string;
  buyerPhone: string;
  drawnAt: string;
  drawMethod: 'physical_ticket' | 'only_sold' | 'all_slots';
  photoUrl?: string;
  videoUrl?: string;
  announcementNotes?: string;
}

export interface RaffleState {
  id: string;
  config: RaffleConfig;
  slots: RaffleSlot[];
  winner: RaffleWinner | null;
  updatedAt: string;
}

export const DEFAULT_NAMES: string[] = [
  'Afonso', 'Alice', 'Aline', 'Amanda', 'Ana', 'André', 'Antônio', 'Arthur', 'Beatriz', 'Bernardo',
  'Bianca', 'Bruna', 'Bruno', 'Caio', 'Camila', 'Carlos', 'Carolina', 'Cauã', 'Cecília', 'Clara',
  'Daniel', 'Daniela', 'Danilo', 'Davi', 'Débora', 'Diego', 'Diogo', 'Douglas', 'Eduardo', 'Eliane',
  'Elisa', 'Emanuel', 'Enzo', 'Fabiana', 'Fábio', 'Felipe', 'Fernanda', 'Fernando', 'Flávia', 'Francisco',
  'Gabriel', 'Gabriela', 'Giovanna', 'Guilherme', 'Gustavo', 'Heitor', 'Helena', 'Henrique', 'Hugo', 'Igor',
  'Isabela', 'Isadora', 'Jéssica', 'João', 'Joaquim', 'Jonas', 'Jorge', 'José', 'Júlia', 'Juliana',
  'Larissa', 'Laura', 'Leandro', 'Leonardo', 'Letícia', 'Lorena', 'Luana', 'Lucas', 'Luciana', 'Luísa',
  'Manuela', 'Marcela', 'Marcelo', 'Márcio', 'Marcos', 'Maria', 'Mariana', 'Mateus', 'Matheus', 'Melissa',
  'Miguel', 'Natália', 'Nicolas', 'Nicole', 'Otávio', 'Paula', 'Paulo', 'Pedro', 'Rafael', 'Rafaela',
  'Rebeca', 'Renato', 'Ricardo', 'Rodrigo', 'Samuel', 'Sara', 'Sophia', 'Thiago', 'Valentina', 'Vinícius'
];

function getInitialState(): RaffleState {
  const slots: RaffleSlot[] = DEFAULT_NAMES.map((name, index) => ({
    id: index + 1,
    name,
    status: 'available',
  }));

  return {
    id: 'raffle-100',
    config: {
      title: 'Rifa Beneficente - Casa do Pequeno Cidadão',
      description: 'Rifa beneficente em prol da Casa do Pequeno Cidadão. Concorra a um Jantar Gourmet Harmonizado com Vinhos Finos para 6 Pessoas!',
      prize: 'Jantar Harmonizado com Vinho para 6 Pessoas (Opção Frutos do Mar ou Carnes Nobres)',
      pricePerTicket: 100,
      pixKey: '11 95780-1850',
      pixKeyType: 'Telefone',
      pixReceiverName: 'Shirley Cristina Ortega',
      organizerName: 'Jeferson Bernardes',
      organizerPhone: '(11) 98712-1667',
      organizer2Name: 'Shirley Cristina Ortega',
      organizer2Phone: '(11) 95780-1850',
      salesPeriod: 'Outubro e Novembro / 2026',
      schedulingInfo: 'O prazo para o ganhador agendar o jantar após a divulgação do vencedor da rifa será de até 2 meses em comum acordo com a equipe.',
      transparencyInfo: '100% do benefício destinado à Casa do Pequeno Cidadão: toda a mão de obra e equipamentos foram doados para esta ação. Do valor arrecadado, serão deduzidos exclusivamente os custos de insumos do jantar.',
      rules: '1. Cada nome custa R$ 100,00.\n2. Rifa beneficente em prol da Casa do Pequeno Cidadão.\n3. O prêmio é um Menu Gourmet Completo para 6 pessoas (entrada, prato principal com opção entre carnes ou frutos do mar e sobremesa) com 6 garrafas de vinhos finos (3 rótulos selecionados), água, refrigerantes, louças finas, taças de cristal e equipe completa.\n4. Pagamento via PIX para Shirley Cristina Ortega (11 95780-1850), enviando o comprovante para conferência. Nomes reservados têm tolerância de 3 dias para efetuar o pagamento; caso não efetuado, o nome será liberado para venda novamente.\n5. O que vale para a venda é a rifa eletrônica. O nome do comprador é anotado na rifa física pelos organizadores. À rifa física cabe o nome do ganhador lacrado, e no dia da abertura será gravado um vídeo comprovando a idoneidade da rifa.\n6. O prazo para o ganhador agendar o jantar após a divulgação do vencedor é de até 2 meses.',
      adminPin: '1234',
    },
    slots,
    winner: null,
    updatedAt: new Date().toISOString(),
  };
}

let state: RaffleState = loadState();

function loadState(): RaffleState {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (parsed.slots && parsed.slots.length === 100) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error loading raffle data, resetting to initial state:', err);
  }
  const init = getInitialState();
  saveStateToFile(init);
  return init;
}

function saveStateToFile(dataToSave: RaffleState) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving raffle state to disk:', err);
  }
}

// Connected SSE clients
const sseClients: Response[] = [];

function broadcastState() {
  state.updatedAt = new Date().toISOString();
  saveStateToFile(state);

  const payload = JSON.stringify(getSanitizedState(false));
  const data = `data: ${payload}\n\n`;

  for (let i = sseClients.length - 1; i >= 0; i--) {
    const client = sseClients[i];
    try {
      client.write(data);
    } catch {
      sseClients.splice(i, 1);
    }
  }
}

function maskPhone(phone?: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length <= 4) return phone;
  return phone.slice(0, 4) + ' ****-' + phone.slice(-4);
}

function checkAndReleaseExpiredReservations(): number {
  const toleranceDays = state.config.reservationToleranceDays || 3;
  const toleranceMs = toleranceDays * 24 * 60 * 60 * 1000;
  const now = Date.now();
  let releasedCount = 0;

  for (const slot of state.slots) {
    if (slot.status === 'reserved' && slot.reservedAt) {
      const reservedTime = new Date(slot.reservedAt).getTime();
      if (!isNaN(reservedTime) && now - reservedTime > toleranceMs) {
        slot.status = 'available';
        delete slot.buyerName;
        delete slot.buyerPhone;
        delete slot.buyerNotes;
        delete slot.reservedAt;
        delete (slot as any).reservationId;
        releasedCount++;
      }
    }
  }

  if (releasedCount > 0) {
    broadcastState();
  }
  return releasedCount;
}

// Background cleanup interval for expired reservations (runs every 60 seconds)
setInterval(checkAndReleaseExpiredReservations, 60 * 1000);

function getSanitizedState(isAdmin: boolean) {
  return {
    id: state.id,
    config: {
      ...state.config,
      adminPin: isAdmin ? state.config.adminPin : undefined,
    },
    winner: state.winner,
    updatedAt: state.updatedAt,
    slots: state.slots.map(slot => ({
      id: slot.id,
      name: slot.name,
      status: slot.status,
      buyerName: slot.buyerName,
      buyerPhone: isAdmin ? slot.buyerPhone : maskPhone(slot.buyerPhone),
      buyerNotes: isAdmin ? slot.buyerNotes : undefined,
      reservedAt: slot.reservedAt,
      paidAt: slot.paidAt,
    })),
  };
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // SSE endpoint for instantaneous real-time updates across multiple tabs/devices
  app.get('/api/raffle/events', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    // Send initial state immediately
    const payload = JSON.stringify(getSanitizedState(false));
    res.write(`data: ${payload}\n\n`);

    sseClients.push(res);

    req.on('close', () => {
      const idx = sseClients.indexOf(res);
      if (idx !== -1) {
        sseClients.splice(idx, 1);
      }
    });
  });

  // GET current state
  app.get('/api/raffle', (req: Request, res: Response) => {
    checkAndReleaseExpiredReservations();
    const adminPin = req.headers['x-admin-pin'] as string | undefined;
    const isAdmin = Boolean(adminPin && adminPin === state.config.adminPin);
    res.json(getSanitizedState(isAdmin));
  });

  // Verify PIN
  app.post('/api/raffle/admin/verify-pin', (req: Request, res: Response) => {
    const { pin } = req.body;
    if (pin === state.config.adminPin) {
      res.json({ success: true, authorized: true });
    } else {
      res.status(401).json({ success: false, message: 'Senha incorreta' });
    }
  });

  // POST Reserve one or multiple names atomically
  app.post('/api/raffle/reserve', (req: Request, res: Response) => {
    const { slotIds, buyerName, buyerPhone, buyerNotes } = req.body;

    if (!Array.isArray(slotIds) || slotIds.length === 0) {
      return res.status(400).json({ error: 'Nenhum nome foi selecionado.' });
    }

    if (!buyerName || typeof buyerName !== 'string' || buyerName.trim().length < 2) {
      return res.status(400).json({ error: 'Por favor, informe seu nome completo.' });
    }

    if (!buyerPhone || typeof buyerPhone !== 'string' || buyerPhone.trim().length < 8) {
      return res.status(400).json({ error: 'Por favor, informe seu telefone/WhatsApp com DDD.' });
    }

    // Atomic validation: verify that all requested slots are still available
    const conflictSlots: string[] = [];
    for (const id of slotIds) {
      const slot = state.slots.find(s => s.id === id);
      if (!slot) {
        return res.status(404).json({ error: `Nome #${id} não encontrado.` });
      }
      if (slot.status !== 'available') {
        conflictSlots.push(`"${slot.name}" (#${slot.id})`);
      }
    }

    if (conflictSlots.length > 0) {
      return res.status(409).json({
        error: `Ops! O(s) nome(s) ${conflictSlots.join(', ')} acabou(aram) de ser escolhido(s) por outra pessoa! Por favor, escolha outro nome disponível.`,
        conflictSlots,
      });
    }

    // All free! Apply reservations
    const reservationId = 'RES-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7).toUpperCase();
    const now = new Date().toISOString();

    for (const id of slotIds) {
      const slot = state.slots.find(s => s.id === id)!;
      slot.status = 'reserved';
      slot.buyerName = buyerName.trim();
      slot.buyerPhone = buyerPhone.trim();
      slot.buyerNotes = buyerNotes ? String(buyerNotes).trim() : '';
      slot.reservedAt = now;
      slot.reservationId = reservationId;
    }

    broadcastState();

    res.json({
      success: true,
      message: 'Nome(s) reservado(s) com sucesso!',
      reservationId,
      reservedCount: slotIds.length,
      totalAmount: slotIds.length * state.config.pricePerTicket,
    });
  });

  // Admin: Rename a single slot
  app.post('/api/raffle/admin/rename-slot', (req: Request, res: Response) => {
    const { adminPin, slotId, newName } = req.body;

    if (adminPin !== state.config.adminPin) {
      return res.status(401).json({ error: 'Não autorizado. Senha inválida.' });
    }

    if (!newName || typeof newName !== 'string' || newName.trim().length === 0) {
      return res.status(400).json({ error: 'O nome não pode estar em branco.' });
    }

    const slot = state.slots.find(s => s.id === slotId);
    if (!slot) {
      return res.status(404).json({ error: 'Número de slot não encontrado.' });
    }

    slot.name = newName.trim();
    broadcastState();
    res.json({ success: true, slot });
  });

  // Admin: Batch rename up to 100 slots (import names from physical raffle card)
  app.post('/api/raffle/admin/batch-rename-slots', (req: Request, res: Response) => {
    const { adminPin, names, resetReservations } = req.body;

    if (adminPin !== state.config.adminPin) {
      return res.status(401).json({ error: 'Não autorizado. Senha inválida.' });
    }

    if (!Array.isArray(names) || names.length === 0) {
      return res.status(400).json({ error: 'Lista de nomes inválida.' });
    }

    // Apply names to slots
    for (let i = 0; i < 100; i++) {
      const rawName = names[i];
      if (typeof rawName === 'string' && rawName.trim().length > 0 && state.slots[i]) {
        state.slots[i].name = rawName.trim();
        if (resetReservations) {
          state.slots[i].status = 'available';
          delete state.slots[i].buyerName;
          delete state.slots[i].buyerPhone;
          delete state.slots[i].buyerNotes;
          delete state.slots[i].reservedAt;
          delete state.slots[i].paidAt;
          delete state.slots[i].reservationId;
        }
      }
    }

    if (resetReservations) {
      state.winner = null;
    }

    broadcastState();
    res.json({ success: true, message: 'Nomes da cartela física atualizados com sucesso.', slots: state.slots });
  });

  // Admin: Comprehensive edit of any slot (name, status: available/reserved/paid, buyer details)
  app.post('/api/raffle/admin/edit-slot', (req: Request, res: Response) => {
    const { adminPin, slotId, name, status, buyerName, buyerPhone, buyerNotes } = req.body;

    if (adminPin !== state.config.adminPin) {
      return res.status(401).json({ error: 'Não autorizado. Senha inválida.' });
    }

    const slot = state.slots.find(s => s.id === slotId);
    if (!slot) {
      return res.status(404).json({ error: 'Número de slot não encontrado.' });
    }

    if (name && typeof name === 'string' && name.trim().length > 0) {
      slot.name = name.trim();
    }

    if (status === 'available') {
      slot.status = 'available';
      delete slot.buyerName;
      delete slot.buyerPhone;
      delete slot.buyerNotes;
      delete slot.reservedAt;
      delete slot.paidAt;
      delete slot.reservationId;
    } else if (status === 'reserved' || status === 'paid') {
      slot.status = status;
      if (buyerName !== undefined) {
        slot.buyerName = String(buyerName).trim();
      }
      if (buyerPhone !== undefined) {
        slot.buyerPhone = String(buyerPhone).trim();
      }
      if (buyerNotes !== undefined) {
        slot.buyerNotes = String(buyerNotes).trim();
      }
      if (!slot.reservedAt) {
        slot.reservedAt = new Date().toISOString();
      }
      if (status === 'paid' && !slot.paidAt) {
        slot.paidAt = new Date().toISOString();
      } else if (status === 'reserved') {
        delete slot.paidAt;
      }
    }

    broadcastState();
    res.json({ success: true, slot });
  });

  // Admin: Update status of a single slot (Confirm Payment, Mark Pending, or Free slot)
  app.post('/api/raffle/admin/status', (req: Request, res: Response) => {
    const { adminPin, slotId, status } = req.body;

    if (adminPin !== state.config.adminPin) {
      return res.status(401).json({ error: 'Não autorizado. Senha inválida.' });
    }

    const slot = state.slots.find(s => s.id === slotId);
    if (!slot) {
      return res.status(404).json({ error: 'Nome não encontrado.' });
    }

    if (status === 'available') {
      slot.status = 'available';
      delete slot.buyerName;
      delete slot.buyerPhone;
      delete slot.buyerNotes;
      delete slot.reservedAt;
      delete slot.paidAt;
      delete slot.reservationId;
    } else if (status === 'paid') {
      slot.status = 'paid';
      slot.paidAt = new Date().toISOString();
    } else if (status === 'reserved') {
      slot.status = 'reserved';
      delete slot.paidAt;
    }

    broadcastState();
    res.json({ success: true, slot });
  });

  // Admin: Announce and publish the physical raffle winner with photo, video & notes
  app.post('/api/raffle/admin/set-physical-winner', (req: Request, res: Response) => {
    const { adminPin, pin, slotId, photoUrl, videoUrl, announcementNotes, winnerName, winnerPhone } = req.body;
    const providedPin = adminPin || pin;

    if (providedPin !== state.config.adminPin) {
      return res.status(401).json({ error: 'Não autorizado. Senha inválida.' });
    }

    const slot = state.slots.find(s => s.id === Number(slotId));
    if (!slot) {
      return res.status(404).json({ error: 'Número de slot não encontrado na cartela.' });
    }

    const finalName = winnerName && String(winnerName).trim() ? String(winnerName).trim() : (slot.buyerName || '(Ganhador apurado na rifa física)');
    const finalPhone = winnerPhone && String(winnerPhone).trim() ? String(winnerPhone).trim() : (slot.buyerPhone || '');

    const winner: RaffleWinner = {
      slotId: slot.id,
      slotName: slot.name,
      buyerName: finalName,
      buyerPhone: finalPhone,
      drawnAt: new Date().toISOString(),
      drawMethod: 'physical_ticket',
      photoUrl: photoUrl || undefined,
      videoUrl: videoUrl && String(videoUrl).trim() ? String(videoUrl).trim() : undefined,
      announcementNotes: announcementNotes ? String(announcementNotes).trim() : 'Entraremos em contato com o ganhador para organizar e agendar o jantar!',
    };

    state.winner = winner;
    broadcastState();

    res.json({ success: true, winner });
  });

  // Admin: Draw winner
  app.post('/api/raffle/admin/draw', (req: Request, res: Response) => {
    const { adminPin, mode } = req.body;

    if (adminPin !== state.config.adminPin) {
      return res.status(401).json({ error: 'Não autorizado. Senha inválida.' });
    }

    // Candidates
    let candidates: RaffleSlot[] = [];
    if (mode === 'only_sold') {
      candidates = state.slots.filter(s => s.status === 'paid' || s.status === 'reserved');
    } else {
      candidates = [...state.slots];
    }

    if (candidates.length === 0) {
      return res.status(400).json({ error: 'Não há nomes válidos para realizar o sorteio nesta modalidade.' });
    }

    const randomIndex = Math.floor(Math.random() * candidates.length);
    const chosenSlot = candidates[randomIndex];

    const winner: RaffleWinner = {
      slotId: chosenSlot.id,
      slotName: chosenSlot.name,
      buyerName: chosenSlot.buyerName || '(Nome não preenchido)',
      buyerPhone: chosenSlot.buyerPhone || '-',
      drawnAt: new Date().toISOString(),
      drawMethod: mode || 'only_sold',
    };

    state.winner = winner;
    broadcastState();

    res.json({ success: true, winner });
  });

  // Admin: Reset winner
  app.post('/api/raffle/admin/reset-winner', (req: Request, res: Response) => {
    const { adminPin, pin } = req.body;
    const providedPin = adminPin || pin;
    if (providedPin !== state.config.adminPin) {
      return res.status(401).json({ error: 'Não autorizado. Senha inválida.' });
    }

    state.winner = null;
    broadcastState();
    res.json({ success: true, message: 'Divulgação do ganhador removida com sucesso.' });
  });

  // Admin: Release expired reservations (> 3 days)
  app.post('/api/raffle/admin/release-expired', (req: Request, res: Response) => {
    const { adminPin, pin } = req.body;
    const providedPin = adminPin || pin;
    if (providedPin !== state.config.adminPin) {
      return res.status(401).json({ error: 'Não autorizado. Senha inválida.' });
    }

    const count = checkAndReleaseExpiredReservations();
    res.json({
      success: true,
      releasedCount: count,
      message:
        count > 0
          ? `${count} nome(s) com reserva expirada liberado(s) para venda!`
          : 'Nenhum nome com reserva expirada (> 3 dias) encontrado.',
    });
  });

  // Admin: Update Settings
  app.post('/api/raffle/admin/settings', (req: Request, res: Response) => {
    const { adminPin, config } = req.body;
    if (adminPin !== state.config.adminPin) {
      return res.status(401).json({ error: 'Não autorizado. Senha inválida.' });
    }

    if (config) {
      state.config = {
        ...state.config,
        title: config.title || state.config.title,
        description: config.description ?? state.config.description,
        prize: config.prize || state.config.prize,
        pricePerTicket: Number(config.pricePerTicket) > 0 ? Number(config.pricePerTicket) : state.config.pricePerTicket,
        pixKey: config.pixKey || state.config.pixKey,
        pixKeyType: config.pixKeyType || state.config.pixKeyType,
        pixReceiverName: config.pixReceiverName || state.config.pixReceiverName,
        organizerName: config.organizerName || state.config.organizerName,
        organizerPhone: config.organizerPhone || state.config.organizerPhone,
        organizer2Name: config.organizer2Name || state.config.organizer2Name,
        organizer2Phone: config.organizer2Phone || state.config.organizer2Phone,
        salesPeriod: config.salesPeriod || state.config.salesPeriod,
        schedulingInfo: config.schedulingInfo || state.config.schedulingInfo,
        transparencyInfo: config.transparencyInfo || state.config.transparencyInfo,
        pixQrCodeImage: config.pixQrCodeImage !== undefined ? config.pixQrCodeImage : state.config.pixQrCodeImage,
        rules: config.rules ?? state.config.rules,
        adminPin: config.newAdminPin ? String(config.newAdminPin).trim() : state.config.adminPin,
      };
    }

    broadcastState();
    res.json({ success: true, config: state.config });
  });

  // Admin: Reset entire raffle
  app.post('/api/raffle/admin/reset-raffle', (req: Request, res: Response) => {
    const { adminPin, resetSlotsOnly, customNames } = req.body;
    if (adminPin !== state.config.adminPin) {
      return res.status(401).json({ error: 'Não autorizado. Senha inválida.' });
    }

    const namesToUse = Array.isArray(customNames) && customNames.length === 100 ? customNames : DEFAULT_NAMES;

    state.slots = namesToUse.map((name, index) => ({
      id: index + 1,
      name,
      status: 'available',
    }));
    state.winner = null;

    if (!resetSlotsOnly) {
      // keep config
    }

    broadcastState();
    res.json({ success: true, message: 'Cartela reiniciada com sucesso.' });
  });

  // Seed sample reservations for instant demonstration if completely empty
  app.post('/api/raffle/admin/seed-demo', (req: Request, res: Response) => {
    const { adminPin } = req.body;
    if (adminPin !== state.config.adminPin) {
      return res.status(401).json({ error: 'Não autorizado.' });
    }

    const demoHolders = [
      { id: 5, name: 'Ana', buyer: 'Mariana Lima', phone: '(11) 98123-4567', status: 'paid' as const },
      { id: 13, name: 'Bruno', buyer: 'Carlos Eduardo', phone: '(21) 99345-6789', status: 'reserved' as const },
      { id: 24, name: 'Davi', buyer: 'Juliana Costa', phone: '(31) 98456-7890', status: 'paid' as const },
      { id: 41, name: 'Gabriel', buyer: 'Rodrigo Santos', phone: '(41) 97123-8899', status: 'reserved' as const },
      { id: 68, name: 'Lucas', buyer: 'Fernanda Rocha', phone: '(11) 99876-5432', status: 'paid' as const },
      { id: 76, name: 'Maria', buyer: 'Beatriz Almeida', phone: '(19) 98765-1122', status: 'paid' as const },
      { id: 88, name: 'Pedro', buyer: 'Thiago Martins', phone: '(85) 99112-3344', status: 'reserved' as const },
    ];

    for (const d of demoHolders) {
      const slot = state.slots.find(s => s.id === d.id);
      if (slot) {
        slot.status = d.status;
        slot.buyerName = d.buyer;
        slot.buyerPhone = d.phone;
        slot.reservedAt = new Date().toISOString();
        if (d.status === 'paid') {
          slot.paidAt = new Date().toISOString();
        }
      }
    }

    broadcastState();
    res.json({ success: true });
  });

  // Mount Vite or static dist
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = fs.existsSync(path.resolve(process.cwd(), 'dist'))
      ? path.resolve(process.cwd(), 'dist')
      : path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
