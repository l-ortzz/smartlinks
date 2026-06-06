export type CreateServiceInput = {
  userId?: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
  active?: boolean;
};
