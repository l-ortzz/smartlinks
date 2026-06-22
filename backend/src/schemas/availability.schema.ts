const weekdays = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

export const listAvailabilitySchema = {
  querystring: {
    type: "object",
    properties: {
      userId: { type: "string" },
    },
  },
};

export const createAvailabilitySchema = {
  body: {
    type: "object",
    required: ["weekday", "startTime", "endTime"],
    properties: {
      userId: { type: "string" },
      weekday: { type: "string", enum: weekdays },
      startTime: { type: "string", pattern: "^\\d{2}:\\d{2}$" },
      endTime: { type: "string", pattern: "^\\d{2}:\\d{2}$" },
      active: { type: "boolean" },
    },
  },
};

export const updateAvailabilitySchema = {
  body: {
    type: "object",
    properties: {
      weekday: { type: "string", enum: weekdays },
      startTime: { type: "string", pattern: "^\\d{2}:\\d{2}$" },
      endTime: { type: "string", pattern: "^\\d{2}:\\d{2}$" },
      active: { type: "boolean" },
    },
  },
};
