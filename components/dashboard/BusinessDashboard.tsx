"use client";

import { ArrowLeft, ShoppingBag, Wallet } from "lucide-react";
import type { PaidOrder } from "@/types";
import { formatMoney } from "@/lib/products";

type Props = {
  orders: PaidOrder[];
  onBack: () => void;
};

export default function BusinessDashboard({ orders, onBack }: Props) {
  const revenue = orders.reduce((total, order) => total + order.total, 0);

  return (
    <div className="h-full overflow-y-auto bg-[#f7f9fa] p-5 md:p-8">
      <button
        onClick={onBack}
        className="mb-6 flex items-center gap-2 text-sm text-[#008069]"
      >
        <ArrowLeft size={18} />
        Back to Chats
      </button>

      <h2 className="text-2xl font-bold">Business Dashboard</h2>
      <p className="mt-1 text-sm text-[#667781]">
        Urban Kicks Store · Demo transactions
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <ShoppingBag className="text-[#00a884]" size={25} />
          <p className="mt-3 text-sm text-[#667781]">Completed Demo Orders</p>
          <p className="text-3xl font-bold">{orders.length}</p>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <Wallet className="text-[#00a884]" size={25} />
          <p className="mt-3 text-sm text-[#667781]">Simulated Revenue</p>
          <p className="text-3xl font-bold">{formatMoney(revenue)}</p>
        </div>
      </div>

      <h3 className="mt-8 text-lg font-bold">Recent Orders</h3>

      <div className="mt-4 space-y-3">
        {orders.length === 0 ? (
          <p className="rounded-xl bg-white p-6 text-[#667781]">
            No demo orders yet. Complete a checkout in the chat.
          </p>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="rounded-xl bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">{order.product}</p>
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                  {order.status}
                </span>
              </div>

              <p className="mt-2 text-xs text-[#667781]">
                {order.id} · {order.createdAt}
              </p>

              <p className="mt-2 text-sm">Quantity: {order.quantity}</p>
              <p className="text-sm">Size: {order.size || "Not specified"}</p>
              <p className="text-sm">Delivery: {order.deliveryLocation}</p>

              <p className="mt-3 font-bold text-[#008069]">
                {formatMoney(order.total)}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
