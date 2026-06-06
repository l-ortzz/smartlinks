export type CreateReservationInput = {
  productId: string;
  customerName: string;
  customerPhone: string;
  quantity?: number;
  expiresAt?: string;
};
