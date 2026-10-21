"use client";

import { FormEvent, useState } from "react";
import { Send, ShoppingBag } from "lucide-react";

type Props = {
  onSend: (message: string) => Promise<void>;
  onCatalogue: () => void;
  loading: boolean;
};

export default function MessageInput({ onSend, onCatalogue, loading }: Props) {
  const [text, setText] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = text.trim();

    if (!value || loading) return;

    setText("");
    await onSend(value);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-3 bg-[#f0f2f5] px-3 py-3 md:px-5"
    >
      <button
        type="button"
        onClick={onCatalogue}
        title="Browse catalogue"
        aria-label="Browse catalogue"
        className="text-[#54656f] hover:text-[#00a884]"
      >
        <ShoppingBag size={23} />
      </button>

      <input
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Type a message"
        className="min-w-0 flex-1 rounded-lg bg-white px-4 py-3 text-sm outline-none"
      />

      <button
        type="submit"
        disabled={loading || !text.trim()}
        aria-label="Send message"
        className="rounded-full bg-[#00a884] p-3 text-white disabled:opacity-50"
      >
        <Send size={19} />
      </button>
    </form>
  );
}
