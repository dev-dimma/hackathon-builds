"use client";

import { X } from "lucide-react";
import { products, formatMoney } from "@/lib/products";

type Props = {
  onClose: () => void;
  onSelect: (productName: string) => void;
};

export default function ProductCatalogue({ onClose, onSelect }: Props) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-white md:inset-y-0 md:right-0 md:left-auto md:w-95 md:border-l md:shadow-xl">
      <div className="flex items-center justify-between bg-[#f0f2f5] px-5 py-4">
        <h2 className="text-lg font-semibold">Business Catalogue</h2>

        <button onClick={onClose} aria-label="Close catalogue">
          <X size={22} />
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        <p className="text-sm text-[#667781]">
          Browse products from Urban Kicks Store.
        </p>

        {products.map((product) => (
          <div
            key={product.id}
            className="rounded-xl border border-[#e9edef] p-4"
          >
            <div className="mb-3 flex h-28 items-center justify-center rounded-lg bg-[#f0f2f5] text-6xl">
              {product.emoji}
            </div>

            <h3 className="font-semibold">{product.name}</h3>

            <p className="mt-1 text-sm text-[#667781]">{product.description}</p>

            <p className="mt-2 font-bold text-[#008069]">
              {formatMoney(product.price)}
            </p>

            <button
              onClick={() => onSelect(product.name)}
              className="mt-4 w-full rounded-lg bg-[#00a884] p-3 text-sm font-semibold text-white"
            >
              Message Business
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
