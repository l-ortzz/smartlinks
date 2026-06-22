export type CreateServiceInput = {
  userId?: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
  image?: string;
  active?: boolean;
};

export type UpdateServiceInput = Partial<CreateServiceInput>;
