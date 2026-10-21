"use client";

import { Search, MoreVertical } from "lucide-react";
import type { Message } from "@/types";

type Props = {
  messages: Message[];
  onOpenChat: () => void;
};

export default function ChatList({ messages, onOpenChat }: Props) {
  const latest = messages[messages.length - 1];

  return (
    <aside className="w-full border-r border-[#d1d7db] bg-white md:w-[320px] md:shrink-0">
      <div className="flex items-center justify-between px-5 py-5">
        <h2 className="text-2xl font-bold">Chats</h2>
        <MoreVertical size={21} className="text-[#54656f]" />
      </div>

      <div className="mx-4 mb-4 flex items-center gap-3 rounded-lg bg-[#f0f2f5] px-4 py-2.5">
        <Search size={18} className="text-[#667781]" />
        <span className="text-sm text-[#667781]">
          Search or start a new chat
        </span>
      </div>

      <button
        onClick={onOpenChat}
        className="flex w-full items-center gap-3 border-b border-[#f0f2f5] px-4 py-4 text-left hover:bg-[#f5f6f6]"
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#d9fdd3] text-2xl">
          🛍️
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex justify-between gap-2">
            <h3 className="font-semibold">Urban Kicks Store</h3>
            <span className="text-xs text-[#667781]">{latest?.time}</span>
          </div>

          <p className="mt-1 truncate text-sm text-[#667781]">
            {latest?.text || "Start shopping"}
          </p>
        </div>
      </button>

      <p className="px-5 py-5 text-xs text-[#8696a0]">
        PayChat concept prototype · Not affiliated with WhatsApp
      </p>
    </aside>
  );
}
