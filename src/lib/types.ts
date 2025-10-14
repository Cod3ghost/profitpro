export type Product = {
  id: string;
  name: string;
  costPrice: number;
  sellingPrice: number;
  stock: number;
  imageUrl: string;
  imageHint: string;
};

export type Sale = {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  totalRevenue: number;
  totalCost: number;
  profit: number;
  date: string; // ISO string
};
