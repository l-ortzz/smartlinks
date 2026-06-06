type WhatsAppMessageInput = {
  phone?: string | null;
  message: string;
};

export function buildWhatsAppUrl({ phone, message }: WhatsAppMessageInput) {
  const normalizedPhone = phone?.replace(/\D/g, "");
  const text = encodeURIComponent(message);

  if (!normalizedPhone) {
    return `https://wa.me/?text=${text}`;
  }

  return `https://wa.me/${normalizedPhone}?text=${text}`;
}
