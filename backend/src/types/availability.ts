export type Weekday =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

export type CreateAvailabilityInput = {
  userId?: string;
  weekday: Weekday;
  startTime: string;
  endTime: string;
  active?: boolean;
};
