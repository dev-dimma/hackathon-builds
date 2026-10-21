"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCheck,
  Copy,
  Loader2,
  MessageCircle,
  Plus,
  Send,
  Sparkles,
  Wallet,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
type Profile = {
  user_id: string;
  display_name: string;
  invite_code: string;
};
type Chat = {
  chat_id: string;
  contact_name: string;
  contact_id: string;
  last_message: string | null;
  last_message_at: string | null;
};
type Message = {
  id: string;
  chat_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};
type Order = {
  product: string | null;
  quantity: number | null;
  size: string | null;
  deliveryLocation: string | null;
  unitPrice: number | null;
  deliveryFee: number | null;
};
const money = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
function getError(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}
export default function MessagesPage() {
  const [userId, setUserId] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [chats, setChats] = useState<Chat[]>([]);
  const [selected, setSelected] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [sending, setSending] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [summary, setSummary] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const selectedId = selected?.chat_id;
  useEffect(() => {
    let active = true;
    async function initialize() {
      try {
        const current = await supabase.auth.getUser();
        let user = current.data.user;
        if (!user) {
          const login = await supabase.auth.signInAnonymously();
          if (login.error) throw login.error;
          user = login.data.user;
        }
        if (!user || !active) return;
        setUserId(user.id);
        const result = await supabase
          .from("paychat_profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();
        if (result.error) throw result.error;
        if (active && result.data) {
          setProfile(result.data as Profile);
          setName(result.data.display_name);
        }
      } catch (cause) {
        if (active) setError(getError(cause));
      }
    }
    void initialize();
    return () => {
      active = false;
    };
  }, []);
  const loadChats = useCallback(async () => {
    const result = await supabase.rpc("paychat_list_private_chats");
    if (result.error) {
      setError(result.error.message);
      return;
    }
    setChats((result.data ?? []) as Chat[]);
  }, []);
  const loadMessages = useCallback(async (chatId: string) => {
    const result = await supabase
      .from("paychat_private_messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    setMessages(((result.data ?? []) as Message[]).reverse());
  }, []);
  useEffect(() => {
    if (!profile) return;
    let active = true;
    const refreshChats = () => {
      if (active) void loadChats();
    };
    // Load once after the effect and continue refreshing the contact list.
    const initialTimer = window.setTimeout(refreshChats, 0);
    const interval = window.setInterval(refreshChats, 5000);
    return () => {
      active = false;
      window.clearTimeout(initialTimer);
      window.clearInterval(interval);
    };
  }, [profile, loadChats]);
  useEffect(() => {
    if (!selectedId) return;
    let active = true;
    const channel = supabase
      .channel(`private-chat-${selectedId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "paychat_private_messages",
          filter: `chat_id=eq.${selectedId}`,
        },
        (payload) => {
          if (!active) return;
          const message = payload.new as Message;
          setMessages((previous) =>
            previous.some((item) => item.id === message.id)
              ? previous
              : [...previous, message],
          );
          void loadChats();
        },
      )
      .subscribe((status) => {
        if (!active) return;
        setConnected(status === "SUBSCRIBED");
        if (status === "SUBSCRIBED") {
          void loadMessages(selectedId);
        }
      });
    const initialLoadTimer = window.setTimeout(() => {
      if (active) void loadMessages(selectedId);
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(initialLoadTimer);
      void supabase.removeChannel(channel);
    };
  }, [selectedId, loadMessages, loadChats]);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages.length]);
  async function register() {
    if (!name.trim()) {
      setError("Enter your name.");
      return;
    }
    setBusy(true);
    setError("");
    const result = await supabase.rpc("paychat_register", {
      p_name: name.trim(),
    });
    if (result.error) {
      setError(result.error.message);
    } else {
      const next = (result.data as Profile[])[0];
      setProfile(next);
    }
    setBusy(false);
  }
  async function startChat() {
    if (!inviteCode.trim()) {
      setError("Enter a contact's invite code.");
      return;
    }
    setBusy(true);
    setError("");
    const result = await supabase.rpc("paychat_start_private_chat", {
      p_invite_code: inviteCode.trim(),
    });
    if (result.error) {
      setError(result.error.message);
    } else {
      const list = await supabase.rpc("paychat_list_private_chats");
      if (list.error) {
        setError(list.error.message);
      } else {
        const updated = (list.data ?? []) as Chat[];
        setChats(updated);
        const found = updated.find((chat) => chat.chat_id === result.data);
        if (found) openChat(found);
        setInviteCode("");
      }
    }
    setBusy(false);
  }
  function openChat(chat: Chat) {
    setSelected(chat);
    setMessages([]);
    setConnected(false);
    setOrder(null);
    setSummary("");
    setNotice("");
    setError("");
    setShowPayment(false);
  }
  async function sendMessage(bodyOverride?: string) {
    if (!selected || !userId || sending) return;
    const body = (bodyOverride ?? input).trim();
    if (!body) return;
    setSending(true);
    setError("");
    const result = await supabase.from("paychat_private_messages").insert({
      chat_id: selected.chat_id,
      sender_id: userId,
      body,
    });
    if (result.error) {
      setError(result.error.message);
    } else {
      if (!bodyOverride) setInput("");
      setOrder(null);
      setSummary("");
      await Promise.all([loadMessages(selected.chat_id), loadChats()]);
    }
    setSending(false);
  }
  async function generateOrder() {
    if (!selected || analyzing) return;
    const history = messages
      .filter((message) => !message.body.startsWith("PAYCHAT DEMO PAYMENT"))
      .slice(-40);
    if (!history.length) {
      setError("Chat with your contact first.");
      return;
    }
    setAnalyzing(true);
    setError("");
    setNotice("");
    setOrder(null);
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.map((message) => ({
            sender: message.sender_id === userId ? "buyer" : "seller",
            text: message.body,
          })),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "AI request failed.");
      }
      if (!data.hasOrder || !data.order) {
        setNotice(data.summary || "No potential order found.");
        return;
      }
      setOrder({
        product: data.order.product,
        quantity: data.order.quantity,
        size: data.order.size,
        deliveryLocation: data.order.deliveryLocation,
        unitPrice: data.order.unitPrice,
        deliveryFee: data.order.deliveryFee,
      });
      setSummary(data.summary || "");
    } catch (cause) {
      setError(getError(cause));
    } finally {
      setAnalyzing(false);
    }
  }
  function updateOrder(field: keyof Order, value: string) {
    setOrder((previous) => {
      if (!previous) return null;
      if (
        field === "quantity" ||
        field === "unitPrice" ||
        field === "deliveryFee"
      ) {
        return {
          ...previous,
          [field]: value === "" ? null : Number(value),
        };
      }
      return { ...previous, [field]: value };
    });
  }
  const validTotal =
    order?.product?.trim() &&
    order.quantity !== null &&
    Number.isSafeInteger(order.quantity) &&
    order.quantity > 0 &&
    order.unitPrice !== null &&
    Number.isSafeInteger(order.unitPrice) &&
    order.unitPrice > 0 &&
    order.deliveryFee !== null &&
    Number.isSafeInteger(order.deliveryFee) &&
    order.deliveryFee >= 0
      ? order.quantity * order.unitPrice + order.deliveryFee
      : null;
  async function payOrder() {
    if (!order || validTotal === null) return;
    await sendMessage(
      [
        "PAYCHAT DEMO PAYMENT",
        `Product: ${order.product}`,
        `Quantity: ${order.quantity}`,
        `Size: ${order.size || "Not specified"}`,
        `Delivery: ${order.deliveryLocation || "Not specified"}`,
        `Amount: ${money(validTotal)}`,
        "Status: Simulated payment",
        "No real money was transferred.",
      ].join("\n"),
    );
  }
  async function sendTransfer() {
    const amount = Number(paymentAmount);
    if (
      paymentAmount.trim() === "" ||
      !Number.isSafeInteger(amount) ||
      amount <= 0
    ) {
      setError("Enter a valid whole-naira amount.");
      return;
    }
    await sendMessage(
      [
        "PAYCHAT DEMO PAYMENT",
        `To: ${selected?.contact_name}`,
        `Amount: ${money(amount)}`,
        "Status: Simulated transfer",
        "No real money was transferred.",
      ].join("\n"),
    );
    setShowPayment(false);
    setPaymentAmount("");
  }
  async function copyCode() {
    if (!profile) return;
    try {
      await navigator.clipboard.writeText(profile.invite_code);
      setNotice("Your invite code was copied.");
    } catch {
      setNotice(`Your code: ${profile.invite_code}`);
    }
  }
  if (!profile) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#0b141a] p-5 text-white">
        <div className="w-full max-w-md rounded-2xl bg-[#202c33] p-7">
          <MessageCircle className="text-[#25d366]" size={34} />
          <h1 className="mt-4 text-2xl font-bold">Welcome to PayChat</h1>
          <p className="mt-2 text-sm text-[#aebac1]">
            Choose a name to start private conversations.
          </p>
          <input
            value={name}
            maxLength={40}
            onChange={(event) => setName(event.target.value)}
            placeholder="Your display name"
            className="mt-6 w-full rounded-lg bg-[#2a3942] p-3 outline-none"
          />
          <button
            onClick={() => void register()}
            disabled={!userId || busy}
            className="mt-4 w-full rounded-lg bg-[#00a884] p-3 font-semibold disabled:opacity-50"
          >
            {busy ? "Setting up..." : "Continue"}
          </button>
          {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
          <p className="mt-5 text-xs text-[#8696a0]">
            Demo accounts only. Do not share sensitive information.
          </p>
        </div>
      </main>
    );
  }
  return (
    <main className="h-dvh overflow-hidden bg-[#0b141a] text-[#e9edef]">
      <div className="mx-auto flex h-full max-w-375">
        {/* Contacts */}
        <aside
          className={`w-full shrink-0 border-r border-[#2a3942] bg-[#111b21] md:w-80 ${
            selected ? "hidden md:block" : "block"
          }`}
        >
          <div className="border-b border-[#2a3942] p-5">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">PayChat</h1>
              <Link
                href="/"
                className="text-xs text-[#aebac1] hover:text-white"
              >
                Original demo
              </Link>
            </div>
            <p className="mt-1 text-sm text-[#aebac1]">
              Signed in as {profile.display_name}
            </p>
            <div className="mt-5 rounded-xl bg-[#202c33] p-4">
              <p className="text-xs text-[#aebac1]">
                Your personal invite code
              </p>
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="break-all font-mono text-sm text-[#25d366]">
                  {profile.invite_code}
                </span>
                <button
                  onClick={() => void copyCode()}
                  aria-label="Copy invite code"
                >
                  <Copy size={18} />
                </button>
              </div>
            </div>
            <p className="mt-5 text-sm font-semibold">Start a private chat</p>
            <div className="mt-2 flex gap-2">
              <input
                value={inviteCode}
                onChange={(event) =>
                  setInviteCode(event.target.value.toUpperCase())
                }
                placeholder="Contact's invite code"
                className="min-w-0 flex-1 rounded-lg bg-[#202c33] px-3 py-2 text-sm outline-none"
              />
              <button
                onClick={() => void startChat()}
                disabled={busy}
                className="rounded-lg bg-[#00a884] p-2 disabled:opacity-50"
                aria-label="Start chat"
              >
                <Plus size={21} />
              </button>
            </div>
          </div>
          <div className="p-4 text-xs font-semibold uppercase tracking-wide text-[#8696a0]">
            Private Conversations
          </div>
          {chats.length === 0 ? (
            <p className="px-5 text-sm text-[#8696a0]">
              No contacts yet. Exchange invite codes to start chatting.
            </p>
          ) : (
            chats.map((chat) => (
              <button
                key={chat.chat_id}
                onClick={() => openChat(chat)}
                className={`flex w-full items-center gap-3 border-b border-[#202c33] p-4 text-left hover:bg-[#202c33] ${
                  selected?.chat_id === chat.chat_id ? "bg-[#2a3942]" : ""
                }`}
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#005c4b] font-bold">
                  {chat.contact_name[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold">{chat.contact_name}</p>
                  <p className="truncate text-xs text-[#8696a0]">
                    {chat.last_message || "Start chatting"}
                  </p>
                </div>
              </button>
            ))
          )}
        </aside>
        {/* Conversation */}
        <section
          className={`min-w-0 flex-1 flex-col ${
            selected ? "flex" : "hidden md:flex"
          }`}
        >
          {!selected ? (
            <div className="flex flex-1 flex-col items-center justify-center text-[#8696a0]">
              <MessageCircle size={52} />
              <p className="mt-4 text-lg">Select a conversation</p>
            </div>
          ) : (
            <>
              <header className="flex items-center gap-3 bg-[#202c33] p-4">
                <button
                  onClick={() => setSelected(null)}
                  className="md:hidden"
                  aria-label="Back"
                >
                  <ArrowLeft size={20} />
                </button>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#005c4b] font-bold">
                  {selected.contact_name[0]?.toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">
                    {selected.contact_name}
                  </p>
                  <p className="text-xs text-[#aebac1]">
                    {connected ? "Live private chat" : "Connecting..."}
                  </p>
                </div>
                <button
                  onClick={() => setShowPayment(true)}
                  className="flex items-center gap-2 rounded-lg bg-[#005c4b] px-3 py-2 text-xs font-semibold"
                >
                  <Wallet size={17} />
                  Send Money
                </button>
              </header>
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                <p className="mx-auto w-fit rounded-lg bg-[#182229] px-3 py-2 text-center text-xs text-[#aebac1]">
                  Private demo chat · Not end-to-end encrypted
                </p>
                {messages.map((message) => {
                  const own = message.sender_id === userId;
                  return (
                    <div
                      key={message.id}
                      className={`flex ${
                        own ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[85%] rounded-lg p-3 md:max-w-[70%] ${
                          own ? "bg-[#005c4b]" : "bg-[#202c33]"
                        }`}
                      >
                        <p className="whitespace-pre-wrap wrap-break-word text-sm leading-6">
                          {message.body}
                        </p>
                        <div className="mt-2 flex items-center justify-end gap-1 text-[10px] text-[#aebac1]">
                          {new Date(message.created_at).toLocaleTimeString(
                            "en-NG",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                          {own && <CheckCheck size={13} />}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
              {/* AI tools */}
              <div className="max-h-[45%] overflow-y-auto border-t border-[#2a3942] bg-[#111b21] p-3">
                <button
                  onClick={() => void generateOrder()}
                  disabled={analyzing}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#00a884] p-3 text-sm font-semibold text-[#25d366] disabled:opacity-50"
                >
                  {analyzing ? (
                    <Loader2 size={17} className="animate-spin" />
                  ) : (
                    <Sparkles size={17} />
                  )}
                  {analyzing
                    ? "Gemini is analyzing..."
                    : "Generate Order with AI"}
                </button>
                {order && (
                  <div className="mx-auto mt-3 max-w-lg rounded-xl bg-[#202c33] p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-[#25d366]">
                        Editable AI Order
                      </h3>
                      <button
                        onClick={() => setOrder(null)}
                        aria-label="Close order"
                      >
                        <X size={18} />
                      </button>
                    </div>
                    {summary && (
                      <p className="mt-2 text-xs text-[#aebac1]">{summary}</p>
                    )}
                    <p className="mt-2 text-xs text-amber-300">
                      Confirm these details with your contact before paying.
                    </p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {(
                        [
                          ["product", "Product", "text"],
                          ["quantity", "Quantity", "number"],
                          ["size", "Size", "text"],
                          ["deliveryLocation", "Delivery location", "text"],
                          ["unitPrice", "Unit price (₦)", "number"],
                          ["deliveryFee", "Delivery fee (₦)", "number"],
                        ] as const
                      ).map(([field, label, type]) => (
                        <label key={field} className="text-xs">
                          <span className="mb-1 block text-[#aebac1]">
                            {label}
                          </span>
                          <input
                            type={type}
                            min={field === "deliveryFee" ? "0" : "1"}
                            step={type === "number" ? "1" : undefined}
                            value={order[field] ?? ""}
                            onChange={(event) =>
                              updateOrder(field, event.target.value)
                            }
                            className="w-full rounded-lg bg-[#2a3942] p-2 outline-none"
                          />
                        </label>
                      ))}
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <p className="font-bold">
                        {validTotal === null
                          ? "Complete pricing"
                          : money(validTotal)}
                      </p>
                      <button
                        onClick={() => void payOrder()}
                        disabled={validTotal === null || sending}
                        className="rounded-lg bg-[#00a884] px-4 py-2 text-xs font-semibold disabled:opacity-50"
                      >
                        Simulate Payment
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {error && (
                <p className="bg-red-950 px-4 py-2 text-sm text-red-200">
                  {error}
                </p>
              )}
              {notice && (
                <p className="bg-[#1b3830] px-4 py-2 text-sm text-[#c8f7df]">
                  {notice}
                </p>
              )}
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void sendMessage();
                }}
                className="flex gap-3 bg-[#202c33] p-3"
              >
                <input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Type a message"
                  className="min-w-0 flex-1 rounded-lg bg-[#2a3942] px-4 py-3 text-sm outline-none"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || sending}
                  className="rounded-full bg-[#00a884] p-3 disabled:opacity-50"
                  aria-label="Send message"
                >
                  {sending ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                </button>
              </form>
            </>
          )}
        </section>
      </div>
      {/* Simulated bank transfer */}
      {showPayment && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-md rounded-xl bg-[#202c33] p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Send Money</h2>
              <button onClick={() => setShowPayment(false)} aria-label="Close">
                <X size={20} />
              </button>
            </div>
            <p className="mt-3 text-sm text-[#aebac1]">
              To: {selected.contact_name}
            </p>
            <p className="mt-2 text-xs text-amber-300">
              Demo transfer only. No real bank connected.
            </p>
            <input
              type="number"
              min="1"
              step="1"
              value={paymentAmount}
              onChange={(event) => setPaymentAmount(event.target.value)}
              placeholder="Amount in NGN"
              className="mt-5 w-full rounded-lg bg-[#2a3942] p-3 outline-none"
            />
            <button
              onClick={() => void sendTransfer()}
              disabled={sending}
              className="mt-4 w-full rounded-lg bg-[#00a884] p-3 font-semibold disabled:opacity-50"
            >
              Confirm Demo Transfer
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
