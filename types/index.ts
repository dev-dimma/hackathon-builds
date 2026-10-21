export type Order = {
  productId: string;
  product: string;
  quantity: number;
  size: string | null;
  deliveryLocation: string | null;
  unitPrice: number;
  subtotal: number;
  deliveryFee: number;
  total: number;
};

export type PaidOrder = Order & {
  id: string;
  status: "PAID (DEMO)";
  createdAt: string;
};

export type Message = {
  id: string;
  sender: "customer" | "business";
  text: string;
  time: string;
  order?: Order | null;
};

export type Screen = "chat" | "dashboard";
