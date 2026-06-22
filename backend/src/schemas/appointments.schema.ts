export const listAppointmentsSchema = {
  querystring: {
    type: "object",
    properties: {
      userId: { type: "string" },
    },
  },
};

export const createAppointmentSchema = {
  body: {
    type: "object",
    required: ["userId", "serviceId", "customerName", "customerPhone", "date"],
    properties: {
      userId: { type: "string" },
      serviceId: { type: "string" },
      customerName: { type: "string" },
      customerPhone: { type: "string" },
      date: { type: "string", format: "date-time" },
    },
  },
};

export const updateAppointmentStatusSchema = {
  body: {
    type: "object",
    required: ["status"],
    properties: {
      status: {
        type: "string",
        enum: ["SCHEDULED", "CONFIRMED", "COMPLETED", "CANCELED"],
      },
    },
  },
};
