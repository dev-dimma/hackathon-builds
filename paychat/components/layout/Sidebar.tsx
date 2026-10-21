"use client";

import { LayoutDashboard, MessageCircle, ShoppingBag } from "lucide-react";
import type { Screen } from "@/types";

type Props = {
  screen: Screen;
  onNavigate: (screen: Screen) => void;
  onCatalogue: () => void;
};

export default function Sidebar({ screen, onNavigate, onCatalogue }: Props) {
  return (
    <aside className="flex w-14 shrink-0 flex-col items-center gap-4 border-r border-[#d1d7db] bg-[#f0f2f5] py-5 md:w-16">
      <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-[#00a884] text-lg font-bold text-white">
        P
      </div>

      <button
        title="Chats"
        aria-label="Chats"
        onClick={() => onNavigate("chat")}
        className={`rounded-xl p-2.5 ${
          screen === "chat" ? "bg-[#d9e1e5]" : "hover:bg-[#d9e1e5]"
        }`}
      >
        <MessageCircle size={23} />
      </button>

      <button
        title="Product catalogue"
        aria-label="Product catalogue"
        onClick={onCatalogue}
        className="rounded-xl p-2.5 hover:bg-[#d9e1e5]"
      >
        <ShoppingBag size={23} />
      </button>

      <button
        title="Business dashboard"
        aria-label="Business dashboard"
        onClick={() => onNavigate("dashboard")}
        className={`rounded-xl p-2.5 ${
          screen === "dashboard" ? "bg-[#d9e1e5]" : "hover:bg-[#d9e1e5]"
        }`}
      >
        <LayoutDashboard size={23} />
      </button>

      <div className="mt-auto flex h-9 w-9 items-center justify-center rounded-full bg-[#c6e7df] text-sm font-bold text-[#075e54]">
        D
      </div>
    </aside>
  );
}
