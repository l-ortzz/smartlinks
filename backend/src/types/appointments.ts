export type CreateAppointmentInput = {
  userId: string;
  serviceId: string;
  customerName: string;
  customerPhone: string;
  date: string;
};

export type AppointmentStatus =
  | "SCHEDULED"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELED";
