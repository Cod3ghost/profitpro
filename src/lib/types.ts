import { Timestamp } from "firebase/firestore";

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
  productName?: string; // Optional for backwards compatibility with mock
  quantity: number;
  totalRevenue: number;
  totalCost: number;
  profit: number;
  saleDate: Timestamp | string; // Support both Timestamp and string for mock data
  salesAgentId: string;
};
