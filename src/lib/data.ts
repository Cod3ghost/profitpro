import type { Product, Sale } from './types';

export const mockProducts: Product[] = [
  { id: 'prod-001', name: 'Wireless Mouse', costPrice: 15, sellingPrice: 30, stock: 150, imageUrl: "https://picsum.photos/seed/product1/400/300", imageHint: "wireless mouse" },
  { id: 'prod-002', name: 'Mechanical Keyboard', costPrice: 60, sellingPrice: 100, stock: 80, imageUrl: "https://picsum.photos/seed/product2/400/300", imageHint: "mechanical keyboard" },
  { id: 'prod-003', name: '4K Monitor', costPrice: 250, sellingPrice: 400, stock: 50, imageUrl: "https://picsum.photos/seed/product3/400/300", imageHint: "computer monitor" },
  { id: 'prod-004', name: 'Noise-Cancelling Headphones', costPrice: 80, sellingPrice: 150, stock: 120, imageUrl: "https://picsum.photos/seed/product4/400/300", imageHint: "headphones" },
  { id: 'prod-005', name: 'Webcam', costPrice: 45, sellingPrice: 75, stock: 200, imageUrl: "https://picsum.photos/seed/product5/400/300", imageHint: "webcam" },
  { id: 'prod-006', name: 'Ergonomic Office Chair', costPrice: 180, sellingPrice: 350, stock: 30, imageUrl: "https://picsum.photos/seed/product6/400/300", imageHint: "office chair" },
];

const generateSales = (): Sale[] => {
  const sales: Sale[] = [];
  const today = new Date();
  
  for (let i = 0; i < 90; i++) {
    const date = new Date();
    date.setDate(today.getDate() - i);

    // Make more sales on weekdays
    if (date.getDay() === 0 || date.getDay() === 6) {
        if (Math.random() > 0.3) continue;
    }

    const numSales = Math.floor(Math.random() * 5) + 1;

    for (let j = 0; j < numSales; j++) {
      const product = mockProducts[Math.floor(Math.random() * mockProducts.length)];
      const quantity = Math.floor(Math.random() * 3) + 1;
      const totalRevenue = product.sellingPrice * quantity;
      const totalCost = product.costPrice * quantity;
      const profit = totalRevenue - totalCost;

      sales.push({
        id: `sale-${i}-${j}`,
        productId: product.id,
        productName: product.name,
        quantity,
        totalRevenue,
        totalCost,
        profit,
        date: date.toISOString(),
      });
    }
  }
  return sales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const mockSales: Sale[] = generateSales();
