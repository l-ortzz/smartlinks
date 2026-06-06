export type CreateProductInput = {
  userId?: string;
  slug: string;
  name: string;
  description?: string;
  price: number;
  images?: string[];
  stock?: number;
  active?: boolean;
  attributes?: Array<{
    name: string;
    values: Array<{
      value: string;
      stock?: number;
    }>;
  }>;
};
