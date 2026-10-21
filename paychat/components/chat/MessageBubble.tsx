import { CheckCheck } from "lucide-react";
import type { Message, Order } from "@/types";
import OrderCard from "@/components/commerce/OrderCard";

type Props = {
  message: Message;
  onCheckout: (order: Order) => void;
};

export default function MessageBubble({ message, onCheckout }: Props) {
  const isCustomer = message.sender === "customer";

  return (
    <div className={`flex ${isCustomer ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[90%] rounded-lg px-3 py-2 shadow-sm sm:max-w-[75%] ${
          isCustomer ? "bg-[#d9fdd3]" : "bg-white"
        }`}
      >
        <p className="whitespace-pre-wrap wrap-break-word text-sm leading-6">
          {message.text}
        </p>

        {message.order && (
          <OrderCard order={message.order} onCheckout={onCheckout} />
        )}

        <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-[#667781]">
          <span>{message.time}</span>
          {isCustomer && <CheckCheck size={15} className="text-[#53bdeb]" />}
        </div>
      </div>
    </div>
  );
}
