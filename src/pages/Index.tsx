import { useState, useRef, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";

const contacts = [
  { id: 1, name: "Алексей Громов", avatar: "АГ", status: "online", lastMsg: "Увидимся завтра!", time: "14:32", unread: 2, color: "from-violet-500 to-purple-600" },
  { id: 2, name: "Марина Светлова", avatar: "МС", status: "online", lastMsg: "Посмотри файл 👀", time: "13:15", unread: 0, color: "from-cyan-500 to-blue-500" },
  { id: 3, name: "Дмитрий Волков", avatar: "ДВ", status: "away", lastMsg: "Хорошо, договорились", time: "11:02", unread: 0, color: "from-pink-500 to-rose-600" },
  { id: 4, name: "Команда Разработки", avatar: "КР", status: "online", lastMsg: "Деплой прошёл успешно 🚀", time: "Вчера", unread: 5, color: "from-emerald-500 to-teal-600" },
  { id: 5, name: "Ольга Небесная", avatar: "ОН", status: "offline", lastMsg: "Спасибо за помощь!", time: "Вчера", unread: 0, color: "from-amber-500 to-orange-500" },
  { id: 6, name: "Игорь Стальной", avatar: "ИС", status: "online", lastMsg: "Отправил отчёт", time: "Пн", unread: 0, color: "from-indigo-500 to-violet-500" },
];

type Msg = { id: number; text: string; out: boolean; time: string; reactions?: Record<string, number> };

const REACTION_EMOJIS = ["❤️", "😂", "🔥", "👍", "😮", "😢"];

const initialMessages: Record<number, Array<Msg>> = {
  1: [
    { id: 1, text: "Привет! Как дела?", out: false, time: "14:10" },
    { id: 2, text: "Отлично! Работаю над проектом", out: true, time: "14:12" },
    { id: 3, text: "Классно, ты уже близко к финишу?", out: false, time: "14:20" },
    { id: 4, text: "Да, ещё пару дней и готово 🎉", out: true, time: "14:25" },
    { id: 5, text: "Увидимся завтра!", out: false, time: "14:32" },
  ],
  2: [
    { id: 1, text: "Посмотри файл 👀", out: false, time: "13:15" },
  ],
  3: [
    { id: 1, text: "Встретимся в 15:00?", out: true, time: "10:55" },
    { id: 2, text: "Хорошо, договорились", out: false, time: "11:02" },
  ],
  4: [
    { id: 1, text: "Ребята, готов к тестированию?", out: true, time: "10:00" },
    { id: 2, text: "Да, всё норм!", out: false, time: "10:15" },
    { id: 3, text: "Деплой прошёл успешно 🚀", out: false, time: "Вчера" },
  ],
  5: [{ id: 1, text: "Спасибо за помощь!", out: false, time: "Вчера" }],
  6: [{ id: 1, text: "Отправил отчёт", out: false, time: "Пн" }],
};

type ViewType = "chat" | "video";

type Notification = { id: number; contactId: number; name: string; text: string; avatar: string; color: string };

const playSound = (type: "send" | "receive") => {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    if (type === "send") {
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1100, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.12);
    } else {
      osc.frequency.setValueAtTime(660, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.07, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    }
  } catch (_e) {
    void _e;
  }
};

export default function Index() {
  const [activeContact, setActiveContact] = useState(contacts[0]);
  const [messages, setMessages] = useState<Record<number, Msg[]>>(initialMessages);
  const [hoveredMsgId, setHoveredMsgId] = useState<number | null>(null);
  const [reactionPickerMsgId, setReactionPickerMsgId] = useState<number | null>(null);
  const [inputText, setInputText] = useState("");
  const [view, setView] = useState<ViewType>("chat");
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [search, setSearch] = useState("");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<number, number>>(() =>
    Object.fromEntries(contacts.map((c) => [c.id, c.unread]))
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const notifTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const notifIdRef = useRef(100);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeContact]);

  useEffect(() => {
    if (view === "video") {
      setCallDuration(0);
      timerRef.current = setInterval(() => setCallDuration((d) => d + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [view]);

  const incomingTexts = [
    "Окей, понял!", "Спасибо!", "Хорошо, договорились 👍", "Жду ответа", "Отлично!",
    "Можешь позвонить?", "Смотри что нашёл 🔥", "Всё сделано", "Когда будешь?", "Ок 👌"
  ];

  const pushNotification = useCallback((contact: typeof contacts[0], text: string) => {
    const nid = ++notifIdRef.current;
    setNotifications((prev) => [...prev.slice(-2), { id: nid, contactId: contact.id, name: contact.name, text, avatar: contact.avatar, color: contact.color }]);
    playSound("receive");
    setUnreadCounts((prev) => ({ ...prev, [contact.id]: (prev[contact.id] || 0) + 1 }));
    setMessages((prev) => ({
      ...prev,
      [contact.id]: [...(prev[contact.id] || []), { id: nid, text, out: false, time: new Date().toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" }) }],
    }));
    setTimeout(() => setNotifications((prev) => prev.filter((n) => n.id !== nid)), 4000);
  }, []);

  useEffect(() => {
    notifTimerRef.current = setInterval(() => {
      const others = contacts.filter((c) => c.id !== activeContact.id && c.status !== "offline");
      if (others.length === 0) return;
      const c = others[Math.floor(Math.random() * others.length)];
      const text = incomingTexts[Math.floor(Math.random() * incomingTexts.length)];
      pushNotification(c, text);
    }, 12000);
    return () => { if (notifTimerRef.current) clearInterval(notifTimerRef.current); };
  }, [activeContact, pushNotification]);

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  const sendMessage = () => {
    if (!inputText.trim()) return;
    const newMsg = { id: Date.now(), text: inputText.trim(), out: true, time: new Date().toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" }) };
    setMessages((prev) => ({ ...prev, [activeContact.id]: [...(prev[activeContact.id] || []), newMsg] }));
    setInputText("");
    playSound("send");
  };

  const addReaction = (msgId: number, emoji: string) => {
    setMessages((prev) => ({
      ...prev,
      [activeContact.id]: (prev[activeContact.id] || []).map((m) => {
        if (m.id !== msgId) return m;
        const reactions = { ...(m.reactions || {}) };
        reactions[emoji] = (reactions[emoji] || 0) + 1;
        return { ...m, reactions };
      }),
    }));
    setReactionPickerMsgId(null);
    playSound("send");
  };

  const filtered = contacts.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));
  const currentMsgs = messages[activeContact.id] || [];

  const statusColor: Record<string, string> = {
    online: "bg-emerald-400",
    away: "bg-amber-400",
    offline: "bg-gray-500",
  };
  const statusLabel: Record<string, string> = {
    online: "в сети",
    away: "недавно",
    offline: "не в сети",
  };

  return (
    <div className="bg-mesh min-h-screen flex items-center justify-center p-2 md:p-4">
      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {notifications.map((n) => (
          <div
            key={n.id}
            className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl glass-dark border border-white/10 shadow-2xl animate-slide-up cursor-pointer min-w-[260px]"
            onClick={() => {
              const c = contacts.find((cc) => cc.id === n.contactId);
              if (c) { setActiveContact(c); setUnreadCounts((prev) => ({ ...prev, [c.id]: 0 })); }
              setNotifications((prev) => prev.filter((x) => x.id !== n.id));
            }}
          >
            <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${n.color} flex items-center justify-center text-xs font-bold text-white flex-shrink-0`}>
              {n.avatar}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-white/80">{n.name}</div>
              <div className="text-xs text-white/50 truncate">{n.text}</div>
            </div>
            <div className="w-2 h-2 rounded-full bg-violet-400 flex-shrink-0 ml-auto" />
          </div>
        ))}
      </div>

      <div className="w-full max-w-6xl h-[92vh] flex rounded-2xl overflow-hidden glass border border-white/[0.07] shadow-2xl animate-scale-in">

        {/* Sidebar */}
        <div className={`${sidebarOpen ? "w-72" : "w-0 overflow-hidden"} transition-all duration-300 flex-shrink-0 flex flex-col border-r border-white/[0.06]`} style={{ background: "rgba(0,0,0,0.25)" }}>
          {/* Logo */}
          <div className="px-5 pt-5 pb-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center neon-glow flex-shrink-0">
              <Icon name="Waves" size={18} className="text-white" />
            </div>
            <span className="text-lg font-bold text-gradient">Волна</span>
            <button className="ml-auto p-1.5 rounded-lg hover:bg-white/5 transition-colors text-white/40 hover:text-white/70">
              <Icon name="PenSquare" size={16} />
            </button>
          </div>

          {/* Search */}
          <div className="px-4 pb-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.05] border border-white/[0.07]">
              <Icon name="Search" size={14} className="text-white/40" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск чатов..."
                className="flex-1 bg-transparent text-sm text-white/80 placeholder-white/30 outline-none"
              />
            </div>
          </div>

          {/* Contacts */}
          <div className="flex-1 overflow-y-auto scrollbar-hide px-2 pb-4 space-y-0.5">
            {filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => { setActiveContact(c); setUnreadCounts((prev) => ({ ...prev, [c.id]: 0 })); }}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-150 text-left group
                  ${activeContact.id === c.id ? "bg-white/[0.08] shadow-sm" : "hover:bg-white/[0.04]"}`}
              >
                <div className="relative flex-shrink-0">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${c.color} flex items-center justify-center text-xs font-bold text-white`}>
                    {c.avatar}
                  </div>
                  <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-black/50 ${statusColor[c.status]}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm font-semibold text-white/90 truncate">{c.name}</span>
                    <span className="text-[11px] text-white/30 ml-2 flex-shrink-0">{c.time}</span>
                  </div>
                  <span className="text-xs text-white/40 truncate block">{c.lastMsg}</span>
                </div>
                {(unreadCounts[c.id] || 0) > 0 && (
                  <span className="w-5 h-5 rounded-full bg-violet-500 text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                    {unreadCounts[c.id]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* User */}
          <div className="px-4 py-3 border-t border-white/[0.06] flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-pink-500 flex items-center justify-center text-xs font-bold text-white">
              Я
            </div>
            <span className="text-sm text-white/60 flex-1">Мой профиль</span>
            <button className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-white/30 hover:text-white/60">
              <Icon name="Settings" size={15} />
            </button>
          </div>
        </div>

        {/* Main */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/[0.06]" style={{ background: "rgba(0,0,0,0.15)" }}>
            <button onClick={() => setSidebarOpen((s) => !s)} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-white/40 hover:text-white/70 flex-shrink-0">
              <Icon name="PanelLeft" size={18} />
            </button>
            <div className="relative flex-shrink-0">
              <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${activeContact.color} flex items-center justify-center text-xs font-bold text-white`}>
                {activeContact.avatar}
              </div>
              <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-black/50 ${statusColor[activeContact.status]}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-white/95 text-sm leading-tight">{activeContact.name}</div>
              <div className="text-xs text-white/40">{statusLabel[activeContact.status]}</div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setView(view === "video" ? "chat" : "video")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200
                  ${view === "video"
                    ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                    : "hover:bg-white/[0.06] text-white/50 hover:text-white/80"
                  }`}
              >
                <Icon name="Video" size={15} />
                <span className="hidden sm:inline">{view === "video" ? "Завершить" : "Видеозвонок"}</span>
              </button>
              <button className="p-2 rounded-lg hover:bg-white/[0.06] transition-colors text-white/40 hover:text-white/70">
                <Icon name="Phone" size={16} />
              </button>
              <button className="p-2 rounded-lg hover:bg-white/[0.06] transition-colors text-white/40 hover:text-white/70">
                <Icon name="MoreVertical" size={16} />
              </button>
            </div>
          </div>

          {/* Video call */}
          {view === "video" && (
            <div className="flex-1 flex flex-col items-center justify-center relative animate-fade-in" style={{ background: "rgba(0,0,0,0.6)" }}>
              {/* Background avatars */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className={`w-40 h-40 rounded-full bg-gradient-to-br ${activeContact.color} opacity-20 blur-3xl`} />
              </div>

              {/* Remote video mockup */}
              <div className="relative w-full max-w-lg mx-4">
                <div className={`w-full aspect-video rounded-2xl bg-gradient-to-br ${activeContact.color} opacity-20 flex items-center justify-center border border-white/10`}>
                  <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${activeContact.color} flex items-center justify-center text-3xl font-bold text-white opacity-90 pulse-ring`}>
                    {activeContact.avatar}
                  </div>
                </div>

                {/* Self cam */}
                <div className="absolute bottom-3 right-3 w-24 h-16 rounded-xl bg-gradient-to-br from-violet-800 to-violet-900 border border-white/20 flex items-center justify-center overflow-hidden shadow-xl">
                  {camOn ? (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-sm font-bold text-white">Я</div>
                  ) : (
                    <Icon name="VideoOff" size={20} className="text-white/40" />
                  )}
                </div>
              </div>

              {/* Call info */}
              <div className="mt-5 text-center z-10">
                <div className="text-white/90 font-semibold text-lg">{activeContact.name}</div>
                <div className="text-emerald-400 text-sm font-medium mt-1">{formatDuration(callDuration)}</div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-3 mt-6 z-10">
                <button
                  onClick={() => setMicOn((v) => !v)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${micOn ? "glass border border-white/10 text-white/80 hover:bg-white/10" : "bg-red-500/80 text-white"}`}
                >
                  <Icon name={micOn ? "Mic" : "MicOff"} size={18} />
                </button>
                <button
                  onClick={() => setView("chat")}
                  className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-400 text-white flex items-center justify-center transition-all duration-200 shadow-lg hover:scale-105"
                >
                  <Icon name="PhoneOff" size={22} />
                </button>
                <button
                  onClick={() => setCamOn((v) => !v)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${camOn ? "glass border border-white/10 text-white/80 hover:bg-white/10" : "bg-red-500/80 text-white"}`}
                >
                  <Icon name={camOn ? "Video" : "VideoOff"} size={18} />
                </button>
              </div>
            </div>
          )}

          {/* Chat */}
          {view === "chat" && (
            <>
              <div
                className="flex-1 overflow-y-auto scrollbar-hide px-5 py-4 space-y-2"
                onClick={() => setReactionPickerMsgId(null)}
              >
                {currentMsgs.map((msg, i) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.out ? "justify-end" : "justify-start"} animate-fade-in group/msg`}
                    style={{ animationDelay: `${i * 30}ms` }}
                    onMouseEnter={() => setHoveredMsgId(msg.id)}
                    onMouseLeave={() => setHoveredMsgId(null)}
                  >
                    {!msg.out && (
                      <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${activeContact.color} flex items-center justify-center text-[10px] font-bold text-white mr-2 mt-auto flex-shrink-0`}>
                        {activeContact.avatar[0]}
                      </div>
                    )}

                    <div className="relative max-w-[70%]">
                      {/* Reaction picker trigger */}
                      {hoveredMsgId === msg.id && (
                        <button
                          className={`absolute top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full glass border border-white/10 text-white/50 hover:text-white/90 flex items-center justify-center transition-all animate-scale-in
                            ${msg.out ? "-left-8" : "-right-8"}`}
                          onClick={(e) => { e.stopPropagation(); setReactionPickerMsgId(reactionPickerMsgId === msg.id ? null : msg.id); }}
                        >
                          <span className="text-[11px]">😊</span>
                        </button>
                      )}

                      {/* Reaction picker */}
                      {reactionPickerMsgId === msg.id && (
                        <div
                          className={`absolute bottom-full mb-2 z-20 flex gap-1 p-1.5 rounded-2xl glass-dark border border-white/10 shadow-xl animate-scale-in
                            ${msg.out ? "right-0" : "left-0"}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {REACTION_EMOJIS.map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => addReaction(msg.id, emoji)}
                              className="w-8 h-8 rounded-xl hover:bg-white/10 flex items-center justify-center text-lg transition-all hover:scale-125"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}

                      <div className={`px-4 py-2.5 ${msg.out ? "msg-bubble-out" : "msg-bubble-in"}`}>
                        <p className="text-sm text-white/90 leading-relaxed">{msg.text}</p>
                        <p className={`text-[11px] mt-1 ${msg.out ? "text-white/50 text-right" : "text-white/30"}`}>{msg.time}</p>
                      </div>

                      {/* Reactions display */}
                      {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                        <div className={`flex flex-wrap gap-1 mt-1 ${msg.out ? "justify-end" : "justify-start"}`}>
                          {Object.entries(msg.reactions).map(([emoji, count]) => (
                            <button
                              key={emoji}
                              onClick={() => addReaction(msg.id, emoji)}
                              className="flex items-center gap-0.5 px-2 py-0.5 rounded-full glass border border-white/10 text-xs hover:border-violet-500/40 transition-all hover:scale-105"
                            >
                              <span>{emoji}</span>
                              {count > 1 && <span className="text-white/60 text-[11px]">{count}</span>}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="px-4 py-3 border-t border-white/[0.06]" style={{ background: "rgba(0,0,0,0.15)" }}>
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/[0.05] border border-white/[0.08] focus-within:border-violet-500/40 transition-colors">
                  <button className="p-1 text-white/30 hover:text-white/60 transition-colors">
                    <Icon name="Smile" size={18} />
                  </button>
                  <input
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                    placeholder={`Написать ${activeContact.name.split(" ")[0]}...`}
                    className="flex-1 bg-transparent text-sm text-white/85 placeholder-white/25 outline-none"
                  />
                  <button className="p-1 text-white/30 hover:text-white/60 transition-colors">
                    <Icon name="Paperclip" size={18} />
                  </button>
                  <button
                    onClick={sendMessage}
                    disabled={!inputText.trim()}
                    className="w-8 h-8 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-30 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all duration-200 hover:scale-105"
                  >
                    <Icon name="Send" size={14} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}