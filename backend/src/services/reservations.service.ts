import { findReservations, insertReservation } from "../repositories/reservations.repository.ts";
import type { CreateReservationInput } from "../types/reservations.ts";
import { buildWhatsAppUrl } from "../utils/whatsapp.ts";

export async function listReservationsService(productId?: string) {
  return findReservations(productId);
}

export async function createReservationService(input: CreateReservationInput) {
  const reservation = await insertReservation(input);
  const storePhone = reservation.product.user.numeroWhatsApp;
  const message = [
  " SMART LINKS - NOVA RESERVA",
  "",
  `Produto: ${reservation.product.name}`,
  `Quantidade: ${reservation.quantity}`,
  "",
  `Cliente: ${reservation.customerName}`,
  `WhatsApp: ${reservation.customerPhone}`,
  "",
  "Enviado via Smart Links",
].join("\n");

  return {
    reservation,
    whatsappUrl: buildWhatsAppUrl({
      phone: storePhone,
      message,
    }),
  };
}
