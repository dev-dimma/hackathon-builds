"use client";

import type { Order } from "@/types";
import { formatMoney } from "@/lib/products";

type Props = {
  order: Order;
  onCheckout: (order: Order) => void;
};

export default function OrderCard({ order, onCheckout }: Props) {
  return (
    <div className="mt-3 overflow-hidden rounded-lg border border-[#e9edef] bg-white">
      <div className="border-b bg-[#f7f9fa] px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#00a884]">
          PayChat Order
        </p>
        <h3 className="mt-1 font-bold">Order Summary</h3>
      </div>

      <div className="space-y-2 px-4 py-3 text-sm">
        <div className="flex justify-between gap-3">
          <span>
            {order.product} × {order.quantity}
          </span>
          <span className="font-semibold">{formatMoney(order.subtotal)}</span>
        </div>

        <p className="text-[#667781]">Size: {order.size || "Not specified"}</p>

        <p className="text-[#667781]">
          Delivery: {order.deliveryLocation || "Not specified"}
        </p>

        <div className="flex justify-between gap-3">
          <span>Delivery fee</span>
          <span>{formatMoney(order.deliveryFee)}</span>
        </div>

        <div className="flex justify-between border-t pt-3 font-bold">
          <span>Total</span>
          <span>{formatMoney(order.total)}</span>
        </div>

        <button
          onClick={() => onCheckout(order)}
          className="mt-2 w-full rounded-lg bg-[#00a884] px-4 py-3 font-semibold text-white hover:bg-[#008f72]"
        >
          Review & Checkout
        </button>
      </div>
    </div>
  );
}
