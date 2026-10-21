"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCheck,
  Copy,
  Loader2,
  MessageCircle,
  Phone,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Video,
  Wallet,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Profile = { user_id: string; display_name: string; invite_code: string };
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
type AiResponse = {
  mode?: "gemini" | "fallback";
  hasOrder?: boolean;
  summary?: string;
  order?: Order | null;
  error?: string;
};

const money = (n: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n);
const errorText = (e: unknown) =>
  e instanceof Error ? e.message : "Something went wrong.";
const avatarColor = "bg-gradient-to-br from-emerald-500 to-teal-800";

export default function MessagesPage() {
  const [userId, setUserId] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [search, setSearch] = useState("");
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
      } catch (e) {
        if (active) setError(errorText(e));
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
    const timer = window.setTimeout(() => {
      void loadChats();
    }, 0);
    const interval = window.setInterval(() => {
      void loadChats();
    }, 5000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
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
            previous.some((m) => m.id === message.id)
              ? previous
              : [...previous, message],
          );
          void loadChats();
        },
      )
      .subscribe((status) => {
        if (!active) return;
        setConnected(status === "SUBSCRIBED");
        if (status === "SUBSCRIBED") void loadMessages(selectedId);
      });
    const timer = window.setTimeout(() => {
      if (active) void loadMessages(selectedId);
    }, 0);
    return () => {
      active = false;
      clearTimeout(timer);
      void supabase.removeChannel(channel);
    };
  }, [selectedId, loadMessages, loadChats]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function register() {
    if (!name.trim()) {
      setError("Enter your display name.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await supabase.rpc("paychat_register", {
        p_name: name.trim(),
      });
      if (result.error) throw result.error;
      const next = (result.data as Profile[])?.[0];
      if (!next) throw new Error("Unable to create profile.");
      setProfile(next);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
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

  async function startChat() {
    if (!inviteCode.trim()) {
      setError("Enter your contact's invite code.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await supabase.rpc("paychat_start_private_chat", {
        p_invite_code: inviteCode.trim(),
      });
      if (result.error) throw result.error;
      const list = await supabase.rpc("paychat_list_private_chats");
      if (list.error) throw list.error;
      const updated = (list.data ?? []) as Chat[];
      setChats(updated);
      const found = updated.find((chat) => chat.chat_id === result.data);
      if (found) openChat(found);
      setInviteCode("");
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  async function sendMessage(bodyOverride?: string): Promise<boolean> {
    if (!selected || !userId || sending) return false;
    const body = (bodyOverride ?? input).trim();
    if (!body) return false;
    setSending(true);
    setError("");
    try {
      const result = await supabase
        .from("paychat_private_messages")
        .insert({ chat_id: selected.chat_id, sender_id: userId, body });
      if (result.error) throw result.error;
      if (!bodyOverride) setInput("");
      setOrder(null);
      setSummary("");
      await Promise.all([loadMessages(selected.chat_id), loadChats()]);
      return true;
    } catch (e) {
      setError(errorText(e));
      return false;
    } finally {
      setSending(false);
    }
  }

  async function generateOrder() {
    if (!selected || analyzing) return;
    const history = messages
      .filter((m) => !m.body.startsWith("PAYCHAT DEMO PAYMENT"))
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
          messages: history.map((m) => ({
            sender: m.sender_id === userId ? "buyer" : "seller",
            text: m.body,
          })),
        }),
      });
      const data: AiResponse = await response.json();
      if (!response.ok) throw new Error(data.error || "AI analysis failed.");
      if (!data.hasOrder || !data.order) {
        setNotice(data.summary || "No potential order found.");
        return;
      }
      setOrder(data.order);
      setSummary(
        `${data.mode === "fallback" ? "Quick fallback" : "Gemini AI"} · ${data.summary || "Potential order found."}`,
      );
    } catch (e) {
      setError(errorText(e));
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
      )
        return { ...previous, [field]: value === "" ? null : Number(value) };
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
    if (!paymentAmount.trim() || !Number.isSafeInteger(amount) || amount <= 0) {
      setError("Enter a valid whole-naira amount.");
      return;
    }
    const success = await sendMessage(
      [
        "PAYCHAT DEMO PAYMENT",
        `To: ${selected?.contact_name}`,
        `Amount: ${money(amount)}`,
        "Status: Simulated transfer",
        "No real money was transferred.",
      ].join("\n"),
    );
    if (success) {
      setShowPayment(false);
      setPaymentAmount("");
    }
  }

  async function copyCode() {
    if (!profile) return;
    try {
      await navigator.clipboard.writeText(profile.invite_code);
      setNotice("Invite code copied.");
    } catch {
      setNotice(`Invite code: ${profile.invite_code}`);
    }
  }

  const callNotice = (kind: string) => {
    setNotice(
      `${kind} calling is coming soon. This hackathon demo supports live text chat.`,
    );
    setError("");
  };
  const filteredChats = chats.filter((chat) =>
    chat.contact_name.toLowerCase().includes(search.toLowerCase()),
  );

  if (!profile)
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#08131a] p-5 text-white">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#172730] p-8 shadow-2xl shadow-black/40">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400">
            <MessageCircle size={30} />
          </div>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.25em] text-emerald-400">
            Conversations, commerce, connection
          </p>
          <h1 className="mt-2 text-3xl font-extrabold">
            Welcome to <span className="text-emerald-400">PayChat.</span>
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Your conversations can become seamless transactions. Choose a name
            to start chatting.
          </p>
          <input
            value={name}
            maxLength={40}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your display name"
            className="mt-7 w-full rounded-xl border border-white/10 bg-[#253740] px-4 py-3 outline-none focus:border-emerald-500"
          />
          <button
            onClick={() => void register()}
            disabled={!userId || busy}
            className="mt-4 w-full rounded-xl bg-emerald-500 p-3 font-bold text-[#05241b] transition hover:bg-emerald-400 disabled:opacity-50"
          >
            {busy ? "Setting up..." : "Continue →"}
          </button>
          {error && <p className="mt-4 text-sm text-red-300">{error}</p>}
          <p className="mt-6 text-xs text-slate-400">
            Demo accounts only. Do not share sensitive information.
          </p>
        </div>
      </main>
    );

  return (
    <main className="h-dvh overflow-hidden bg-[#08131a] text-[#eaf4f2]">
      <div className="mx-auto flex h-full max-w-[1600px] overflow-hidden border-x border-white/5">
        <aside
          className={`w-full shrink-0 border-r border-white/10 bg-[#101e26] md:w-85 ${selected ? "hidden md:flex" : "flex"} flex-col`}
        >
          <div className="border-b border-white/10 px-5 pb-5 pt-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-[#06251d]">
                    <MessageCircle size={21} />
                  </div>
                  <h1 className="text-2xl font-black tracking-tight">
                    Pay<span className="text-emerald-400">Chat</span>
                  </h1>
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  Connect. Converse. Commerce.
                </p>
              </div>
              <Link
                href="/"
                className="rounded-lg border border-white/10 px-2 py-2 text-[11px] text-slate-300 hover:bg-white/10"
              >
                Demo home
              </Link>
            </div>
            <div className="mt-6 rounded-2xl border border-emerald-400/15 bg-linear-to-br from-[#203c3b] to-[#1a2931] p-4">
              <div className="flex items-center gap-2 text-xs text-emerald-200">
                <ShieldCheck size={15} /> Your private invite code
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="break-all font-mono text-sm font-bold tracking-wider text-emerald-300">
                  {profile.invite_code}
                </span>
                <button
                  onClick={() => void copyCode()}
                  aria-label="Copy invite code"
                  className="rounded-lg bg-white/10 p-2 hover:bg-white/20"
                >
                  <Copy size={17} />
                </button>
              </div>
              <p className="mt-3 text-[11px] text-slate-300">
                Signed in as {profile.display_name}
              </p>
            </div>
            <div className="mt-5 flex gap-2">
              <input
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="Contact's invite code"
                className="min-w-0 flex-1 rounded-xl border border-white/5 bg-[#263740] px-3 py-3 text-sm outline-none focus:border-emerald-500"
              />
              <button
                onClick={() => void startChat()}
                disabled={busy}
                aria-label="Start private chat"
                className="rounded-xl bg-emerald-500 p-3 text-[#05241b] hover:bg-emerald-400 disabled:opacity-50"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>
          <div className="px-5 pb-3 pt-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold">Messages</h2>
              <span className="rounded-full bg-emerald-400/10 px-2 py-1 text-xs text-emerald-300">
                {chats.length} chats
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-[#23343d] px-3 text-slate-400">
              <Search size={16} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search conversations"
                className="w-full bg-transparent py-3 text-sm text-white outline-none placeholder:text-slate-400"
              />
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto pb-4">
            {filteredChats.length === 0 ? (
              <p className="px-5 py-6 text-sm leading-6 text-slate-400">
                No conversations found. Exchange invite codes to start chatting.
              </p>
            ) : (
              filteredChats.map((chat) => (
                <button
                  key={chat.chat_id}
                  onClick={() => openChat(chat)}
                  className={`flex w-full items-center gap-3 border-b border-white/5 px-5 py-4 text-left transition hover:bg-white/5 ${selectedId === chat.chat_id ? "bg-emerald-400/10" : ""}`}
                >
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl font-bold ${avatarColor}`}
                  >
                    {chat.contact_name[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-semibold">
                        {chat.contact_name}
                      </p>
                      <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
                    </div>
                    <p className="mt-1 truncate text-xs text-slate-400">
                      {chat.last_message || "Say hello!"}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
          <div className="border-t border-white/10 px-5 py-4 text-[11px] text-slate-400">
            <span className="text-emerald-400">●</span> PayChat · Built for
            meaningful conversations
          </div>
        </aside>

        <section
          className={`min-w-0 flex-1 flex-col ${selected ? "flex" : "hidden md:flex"}`}
        >
          {!selected ? (
            <div className="flex flex-1 flex-col items-center justify-center bg-[radial-gradient(ellipse_at_center,#123b37_0%,#08131a_65%)] px-6 text-center">
              <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-8 text-emerald-400">
                <MessageCircle size={55} />
              </div>
              <h2 className="mt-7 text-3xl font-extrabold">
                Your conversations, reimagined.
              </h2>
              <p className="mt-3 max-w-sm text-sm leading-6 text-slate-400">
                Select a conversation to message, send demo payments, and
                transform agreements into editable AI orders.
              </p>
            </div>
          ) : (
            <>
              <header className="flex flex-wrap items-center gap-3 border-b border-white/10 bg-[#182a32] px-4 py-3 shadow-lg sm:px-5">
                <button
                  onClick={() => setSelected(null)}
                  className="rounded-lg p-2 hover:bg-white/10 md:hidden"
                  aria-label="Back to conversations"
                >
                  <ArrowLeft size={20} />
                </button>
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl font-bold ${avatarColor}`}
                >
                  {selected.contact_name[0]?.toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{selected.contact_name}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-400">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${connected ? "bg-emerald-400" : "bg-amber-400"}`}
                    />
                    {connected ? "Live private chat" : "Connecting..."}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button
                    onClick={() => callNotice("Audio")}
                    title="Audio call (coming soon)"
                    aria-label="Audio call"
                    className="rounded-xl border border-white/10 p-2.5 text-slate-200 transition hover:bg-white/10"
                  >
                    <Phone size={18} />
                  </button>
                  <button
                    onClick={() => callNotice("Video")}
                    title="Video call (coming soon)"
                    aria-label="Video call"
                    className="rounded-xl border border-white/10 p-2.5 text-slate-200 transition hover:bg-white/10"
                  >
                    <Video size={19} />
                  </button>
                  <button
                    onClick={() => {
                      setShowPayment(true);
                      setError("");
                    }}
                    className="flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2.5 text-xs font-bold transition hover:bg-emerald-500 sm:px-4"
                  >
                    <Wallet size={17} />
                    <span className="hidden sm:inline">Send Money</span>
                    <span className="sm:hidden">Pay</span>
                  </button>
                </div>
              </header>

              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-[radial-gradient(circle_at_15%_20%,#102b2d_0%,transparent_38%),radial-gradient(circle_at_85%_80%,#11242c_0%,transparent_42%)] px-4 py-5 sm:px-6">
                <p className="mx-auto w-fit rounded-full border border-white/10 bg-[#1b2b33] px-4 py-2 text-center text-[11px] text-slate-300">
                  🔒 Private demo chat · Not end-to-end encrypted
                </p>
                {messages.map((message) => {
                  const own = message.sender_id === userId;
                  const payment = message.body.startsWith(
                    "PAYCHAT DEMO PAYMENT",
                  );
                  return (
                    <div
                      key={message.id}
                      className={`flex ${own ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[88%] rounded-2xl px-4 py-3 shadow-md sm:max-w-[72%] ${own ? "rounded-br-sm bg-[#006b59]" : "rounded-bl-sm border border-white/5 bg-[#22343d]"} ${payment ? "border-l-4 border-l-emerald-300" : ""}`}
                      >
                        {payment && (
                          <div className="mb-2 flex items-center gap-2 text-xs font-bold text-emerald-200">
                            <Wallet size={15} /> Demo transaction receipt
                          </div>
                        )}
                        <p className="whitespace-pre-wrap wrap-break-word text-sm leading-6">
                          {message.body}
                        </p>
                        <div className="mt-2 flex items-center justify-end gap-1 text-[10px] text-slate-200/70">
                          {new Date(message.created_at).toLocaleTimeString(
                            "en-NG",
                            { hour: "2-digit", minute: "2-digit" },
                          )}
                          {own && <CheckCheck size={14} />}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              <div className="border-t border-white/10 bg-[#101e26] px-3 py-3 sm:px-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                      <Sparkles size={15} /> Smart Commerce
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      Turn your conversation into an order
                    </p>
                  </div>
                  <button
                    onClick={() => void generateOrder()}
                    disabled={analyzing || messages.length === 0}
                    className="flex items-center justify-center gap-2 rounded-xl border border-emerald-400/50 bg-emerald-400/10 px-4 py-2.5 text-xs font-bold text-emerald-300 transition hover:bg-emerald-400/20 disabled:opacity-50"
                  >
                    {analyzing ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Sparkles size={16} />
                    )}
                    {analyzing
                      ? "Analyzing (up to 15s)..."
                      : "Generate Order with AI"}
                  </button>
                </div>
                {order && (
                  <div className="mx-auto mt-4 max-h-[35vh] max-w-2xl overflow-y-auto rounded-2xl border border-emerald-400/25 bg-[#1c3037] p-4 shadow-xl sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-300">
                          AI-powered commerce
                        </p>
                        <h3 className="mt-1 text-lg font-extrabold">
                          Editable order draft
                        </h3>
                      </div>
                      <button
                        onClick={() => setOrder(null)}
                        aria-label="Close order"
                        className="rounded-lg p-2 hover:bg-white/10"
                      >
                        <X size={19} />
                      </button>
                    </div>
                    {summary && (
                      <p className="mt-3 text-xs leading-5 text-slate-300">
                        {summary}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-amber-300">
                      Confirm the details with your contact before simulating
                      payment.
                    </p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {(
                        [
                          ["product", "Product", "text"],
                          ["quantity", "Quantity", "number"],
                          ["size", "Size / variant", "text"],
                          ["deliveryLocation", "Delivery location", "text"],
                          ["unitPrice", "Unit price (₦)", "number"],
                          ["deliveryFee", "Delivery fee (₦)", "number"],
                        ] as const
                      ).map(([field, label, type]) => (
                        <label key={field} className="text-xs">
                          <span className="mb-1.5 block text-slate-300">
                            {label}
                          </span>
                          <input
                            type={type}
                            min={field === "deliveryFee" ? "0" : "1"}
                            step={type === "number" ? "1" : undefined}
                            value={order[field] ?? ""}
                            onChange={(e) => updateOrder(field, e.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-[#2a4149] px-3 py-2.5 text-sm outline-none focus:border-emerald-400"
                          />
                        </label>
                      ))}
                    </div>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
                      <div>
                        <p className="text-[11px] text-slate-400">
                          Estimated total
                        </p>
                        <p className="mt-1 text-xl font-black text-emerald-300">
                          {validTotal === null
                            ? "Complete pricing"
                            : money(validTotal)}
                        </p>
                      </div>
                      <button
                        onClick={() => void payOrder()}
                        disabled={validTotal === null || sending}
                        className="rounded-xl bg-emerald-500 px-5 py-3 text-xs font-bold text-[#05241b] hover:bg-emerald-400 disabled:opacity-50"
                      >
                        Simulate Payment
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {error && (
                <p
                  role="alert"
                  className="bg-red-950 px-4 py-2 text-sm text-red-200"
                >
                  {error}
                </p>
              )}
              {notice && (
                <p
                  role="status"
                  className="bg-[#1a4039] px-4 py-2 text-sm text-emerald-100"
                >
                  {notice}
                </p>
              )}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void sendMessage();
                }}
                className="flex items-center gap-3 bg-[#182a32] px-3 py-3 sm:px-5"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a message..."
                  className="min-w-0 flex-1 rounded-xl border border-white/5 bg-[#2a3e47] px-4 py-3 text-sm outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || sending}
                  aria-label="Send message"
                  className="rounded-xl bg-emerald-500 p-3 text-[#05241b] transition hover:bg-emerald-400 disabled:opacity-50"
                >
                  {sending ? (
                    <Loader2 size={19} className="animate-spin" />
                  ) : (
                    <Send size={19} />
                  )}
                </button>
              </form>
            </>
          )}
        </section>
      </div>

      {showPayment && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Send demo money"
            className="w-full max-w-md rounded-3xl border border-emerald-400/20 bg-[#1b3038] p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-emerald-400/15 p-3 text-emerald-300">
                  <Wallet size={22} />
                </div>
                <h2 className="text-xl font-bold">Send Money</h2>
              </div>
              <button
                onClick={() => setShowPayment(false)}
                aria-label="Close"
                className="rounded-lg p-2 hover:bg-white/10"
              >
                <X size={20} />
              </button>
            </div>
            <p className="mt-5 text-sm text-slate-300">
              Sending to{" "}
              <strong className="text-white">{selected.contact_name}</strong>
            </p>
            <p className="mt-2 text-xs text-amber-300">
              Demo only. No real bank or wallet is connected.
            </p>
            <input
              type="number"
              min="1"
              step="1"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder="Amount in NGN"
              className="mt-5 w-full rounded-xl border border-white/10 bg-[#2b424b] px-4 py-3 outline-none focus:border-emerald-400"
            />
            {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
            <button
              onClick={() => void sendTransfer()}
              disabled={sending}
              className="mt-4 w-full rounded-xl bg-emerald-500 p-3 font-bold text-[#05241b] hover:bg-emerald-400 disabled:opacity-50"
            >
              {sending ? "Sending..." : "Confirm Demo Transfer"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
