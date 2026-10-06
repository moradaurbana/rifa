export interface RaffleSlot {
  id: number;
  name: string;
  status: 'available' | 'reserved' | 'paid';
  buyerName?: string;
  buyerPhone?: string;
  buyerNotes?: string;
  reservedAt?: string;
  paidAt?: string;
}

export interface RaffleConfig {
  title: string;
  description: string;
  prize: string;
  pricePerTicket: number;
  pixKey: string;
  pixKeyType: 'CPF' | 'CNPJ' | 'Email' | 'Telefone' | 'Aleatória';
  pixReceiverName: string;
  organizerPhone: string; // Jeferson Bernardes
  organizerName?: string;
  organizer2Name?: string; // Shirley Cristina Ortega
  organizer2Phone?: string;
  rules: string;
  adminPin?: string;
  salesPeriod?: string;
  schedulingInfo?: string;
  transparencyInfo?: string;
  reservationToleranceDays?: number; // e.g. 3 days
  pixQrCodeImage?: string; // Custom uploaded QR code image if provided
}

export interface RaffleWinner {
  slotId: number;
  slotName: string;
  buyerName: string;
  buyerPhone: string;
  drawnAt: string;
  drawMethod: 'physical_ticket' | 'only_sold' | 'all_slots';
  photoUrl?: string; // Photo of the physical winning raffle ticket
  videoUrl?: string; // Video link of unsealing the physical ticket
  announcementNotes?: string;
}

export interface RaffleData {
  id: string;
  config: RaffleConfig;
  slots: RaffleSlot[];
  winner: RaffleWinner | null;
  updatedAt: string;
}
