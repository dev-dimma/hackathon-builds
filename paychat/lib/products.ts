export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  emoji: string;
  category: string;
  keywords: string[];
};

export const products: Product[] = [
  {
    id: "sneakers",
    name: "Black Sneakers",
    description: "Comfortable everyday sneakers",
    price: 35000,
    emoji: "👟",
    category: "Footwear",
    keywords: ["sneaker", "sneakers", "shoe", "shoes"],
  },
  {
    id: "shirt",
    name: "Black Shirt",
    description: "Classic casual shirt",
    price: 15000,
    emoji: "👕",
    category: "Clothing",
    keywords: ["shirt", "shirts"],
  },
  {
    id: "hoodie",
    name: "Hoodie",
    description: "Premium everyday hoodie",
    price: 25000,
    emoji: "🧥",
    category: "Clothing",
    keywords: ["hoodie", "hoodies"],
  },
];

export function formatMoney(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}
