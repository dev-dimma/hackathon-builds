"use client";

import { useState } from "react";
import type { Order } from "@/types";

type CheckoutProps = {
  order: Order;
  onClose: () => void;
  onPay: (order: Order) => void;
};

export default function Checkout({ order, onClose, onPay }: CheckoutProps) {
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState(order.deliveryLocation || "");
  const [size, setSize] = useState(order.size || "");

  const deliveryFee = 2000;
  const subtotal = order.unitPrice * order.quantity;
  const total = subtotal + deliveryFee;

  const formatMoney = (amount: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(amount);

  function handlePayment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!customerName.trim() || !phone.trim() || !address.trim()) {
      return;
    }

    onPay({
      ...order,
      size: size.trim() || null,
      deliveryLocation: address.trim(),
      subtotal,
      deliveryFee,
      total,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b p-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Checkout</h2>
            <p className="text-sm text-gray-500">Complete your PayChat order</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close checkout"
            className="rounded-full px-3 py-2 text-gray-600 hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handlePayment} className="space-y-5 p-5">
          <div className="rounded-xl bg-gray-50 p-4">
            <h3 className="mb-3 font-semibold text-gray-900">Order Summary</h3>

            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex justify-between gap-3">
                <span>{order.product}</span>
                <span>× {order.quantity}</span>
              </div>

              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatMoney(subtotal)}</span>
              </div>

              <div className="flex justify-between">
                <span>Delivery fee</span>
                <span>{formatMoney(deliveryFee)}</span>
              </div>

              <div className="flex justify-between border-t pt-3 text-base font-bold text-gray-900">
                <span>Total</span>
                <span>{formatMoney(total)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">
              Delivery Information
            </h3>

            <div>
              <label
                htmlFor="customerName"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Full Name
              </label>

              <input
                id="customerName"
                type="text"
                required
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                placeholder="Enter your full name"
                className="w-full rounded-lg border border-gray-300 p-3 text-gray-900 outline-none focus:border-green-600"
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Phone Number
              </label>

              <input
                id="phone"
                type="tel"
                required
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="08012345678"
                className="w-full rounded-lg border border-gray-300 p-3 text-gray-900 outline-none focus:border-green-600"
              />
            </div>

            <div>
              <label
                htmlFor="address"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Delivery Address
              </label>

              <textarea
                id="address"
                required
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                placeholder="Enter your delivery address"
                rows={3}
                className="w-full rounded-lg border border-gray-300 p-3 text-gray-900 outline-none focus:border-green-600"
              />
            </div>

            <div>
              <label
                htmlFor="size"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Product Size (Optional)
              </label>

              <input
                id="size"
                type="text"
                value={size}
                onChange={(event) => setSize(event.target.value)}
                placeholder="e.g. 42, M, XL"
                className="w-full rounded-lg border border-gray-300 p-3 text-gray-900 outline-none focus:border-green-600"
              />
            </div>
          </div>

          <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
            Demo payment only. No real money will be charged.
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-green-600 p-4 font-semibold text-white transition hover:bg-green-700"
          >
            Simulate Payment — {formatMoney(total)}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-lg border border-gray-300 p-3 font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
}
