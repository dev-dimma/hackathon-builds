"use client";

import { useEffect, useRef } from "react";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import type { Message, Order } from "@/types";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";

type Props = {
  messages: Message[];
  loading: boolean;
  error: string;
  onSend: (text: string) => Promise<void>;
  onCheckout: (order: Order) => void;
  onCatalogue: () => void;
  onBack: () => void;
};

export default function ChatWindow({
  messages,
  loading,
  error,
  onSend,
  onCheckout,
  onCatalogue,
  onBack,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex shrink-0 items-center justify-between border-b border-[#d1d7db] bg-[#f0f2f5] px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="md:hidden"
            aria-label="Back to chats"
          >
            <ArrowLeft size={21} />
          </button>

          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d9fdd3] text-xl">
            🛍️
          </div>

          <div>
            <h2 className="font-semibold">Urban Kicks Store</h2>
            <p className="text-xs text-[#667781]">
              Business account · Demo assistant
            </p>
          </div>
        </div>

        <button
          onClick={onCatalogue}
          aria-label="Open catalogue"
          title="Browse products"
          className="rounded-lg p-2 text-[#54656f] hover:bg-[#d9e1e5]"
        >
          <ShoppingBag size={22} />
        </button>
      </header>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-[#efeae2] px-4 py-6 md:px-10">
        <div className="mx-auto w-fit rounded-lg bg-[#fff3c4] px-3 py-2 text-center text-xs text-[#54656f]">
          PayChat concept demo · AI and payments are simulated
        </div>

        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            onCheckout={onCheckout}
          />
        ))}

        {loading && (
          <div className="w-fit rounded-lg bg-white px-4 py-3 text-sm text-[#667781]">
            Preparing your order...
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {error && (
        <p role="alert" className="bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <MessageInput
        onSend={onSend}
        onCatalogue={onCatalogue}
        loading={loading}
      />
    </div>
  );
}
