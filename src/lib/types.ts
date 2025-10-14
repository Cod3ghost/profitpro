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
  productName?: string; 
  quantity: number;
  totalRevenue: number;
  totalCost: number;
  profit: number;
  saleDate: Timestamp | string; 
  salesAgentId: string;
};

export type SalesAgent = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
}
