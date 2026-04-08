import { useState, useRef, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { contacts, initialMessages, playSound, Msg, MsgStatus, ViewType, Notification } from "@/components/chat/chat-types";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatHeader from "@/components/chat/ChatHeader";
import ChatMessages from "@/components/chat/ChatMessages";

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
  const [isTyping, setIsTyping] = useState(false);
  const [ctxMenu, setCtxMenu] = useState<{ msgId: number; x: number; y: number } | null>(null);
  const [copyToast, setCopyToast] = useState(false);
  const [forwardContact, setForwardContact] = useState<typeof contacts[0] | null>(null);
  const [pinnedMsgs, setPinnedMsgs] = useState<Record<number, number | null>>({});
  const [msgSearch, setMsgSearch] = useState("");
  const [msgSearchOpen, setMsgSearchOpen] = useState(false);
  const [msgSearchIdx, setMsgSearchIdx] = useState(0);
  const msgSearchRef = useRef<HTMLInputElement>(null);
  const msgRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const notifTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  const pushNotification = useCallback((contact: typeof contacts[0], text: string, withTyping = false) => {
    const nid = ++notifIdRef.current;
    const deliver = () => {
      setNotifications((prev) => [...prev.slice(-2), { id: nid, contactId: contact.id, name: contact.name, text, avatar: contact.avatar, color: contact.color }]);
      playSound("receive");
      setUnreadCounts((prev) => ({ ...prev, [contact.id]: (prev[contact.id] || 0) + 1 }));
      setMessages((prev) => ({
        ...prev,
        [contact.id]: [...(prev[contact.id] || []), { id: nid, text, out: false, time: new Date().toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" }) }],
      }));
      setTimeout(() => setNotifications((prev) => prev.filter((n) => n.id !== nid)), 4000);
    };
    if (withTyping) {
      setTimeout(deliver, 2000 + Math.random() * 1500);
    } else {
      deliver();
    }
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

  useEffect(() => {
    if (activeContact.status === "offline") { setIsTyping(false); return; }
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    const delay = 1500 + Math.random() * 2000;
    setIsTyping(true);
    typingTimerRef.current = setTimeout(() => setIsTyping(false), delay);
    return () => { if (typingTimerRef.current) clearTimeout(typingTimerRef.current); };
  }, [activeContact]);

  const triggerTyping = useCallback(() => {
    if (activeContact.status === "offline") return;
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    setIsTyping(true);
    typingTimerRef.current = setTimeout(() => setIsTyping(false), 2500 + Math.random() * 1500);
  }, [activeContact]);

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  const updateMsgStatus = (msgId: number, contactId: number, status: MsgStatus) => {
    setMessages((prev) => ({
      ...prev,
      [contactId]: (prev[contactId] || []).map((m) => m.id === msgId ? { ...m, status } : m),
    }));
  };

  const sendMessage = () => {
    if (!inputText.trim()) return;
    const msgId = Date.now();
    const cid = activeContact.id;
    const newMsg: Msg = { id: msgId, text: inputText.trim(), out: true, time: new Date().toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" }), status: "sending" };
    setMessages((prev) => ({ ...prev, [cid]: [...(prev[cid] || []), newMsg] }));
    setInputText("");
    playSound("send");
    triggerTyping();
    setTimeout(() => updateMsgStatus(msgId, cid, "sent"), 400);
    setTimeout(() => updateMsgStatus(msgId, cid, "delivered"), 1200);
    if (activeContact.status === "online") {
      setTimeout(() => updateMsgStatus(msgId, cid, "read"), 2800 + Math.random() * 1500);
    }
  };

  // Поиск по сообщениям
  const currentMsgs = messages[activeContact.id] || [];

  const msgMatches = msgSearch.trim()
    ? currentMsgs.reduce<number[]>((acc, m, i) => {
        if (m.text.toLowerCase().includes(msgSearch.toLowerCase())) acc.push(i);
        return acc;
      }, [])
    : [];

  const openMsgSearch = () => {
    setMsgSearchOpen(true);
    setMsgSearch("");
    setMsgSearchIdx(0);
    setTimeout(() => msgSearchRef.current?.focus(), 50);
  };

  const closeMsgSearch = () => {
    setMsgSearchOpen(false);
    setMsgSearch("");
    setMsgSearchIdx(0);
  };

  useEffect(() => {
    if (msgMatches.length === 0) return;
    const idx = msgMatches[msgSearchIdx] ?? msgMatches[0];
    const msg = currentMsgs[idx];
    if (msg && msgRefs.current[msg.id]) {
      msgRefs.current[msg.id]?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [msgSearchIdx, msgSearch]);

  const stepSearch = (dir: 1 | -1) => {
    if (msgMatches.length === 0) return;
    setMsgSearchIdx((prev) => (prev + dir + msgMatches.length) % msgMatches.length);
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

  const openCtxMenu = (e: React.MouseEvent, msgId: number) => {
    e.preventDefault();
    e.stopPropagation();
    setCtxMenu({ msgId, x: e.clientX, y: e.clientY });
    setReactionPickerMsgId(null);
  };

  const closeCtxMenu = () => setCtxMenu(null);

  const copyMsg = () => {
    if (!ctxMenu) return;
    const msg = currentMsgs.find((m) => m.id === ctxMenu.msgId);
    if (!msg) return;
    navigator.clipboard.writeText(msg.text).catch(() => {});
    setCopyToast(true);
    setTimeout(() => setCopyToast(false), 2000);
    closeCtxMenu();
  };

  const deleteMsg = () => {
    if (!ctxMenu) return;
    const mid = ctxMenu.msgId;
    setMessages((prev) => ({
      ...prev,
      [activeContact.id]: (prev[activeContact.id] || []).filter((m) => m.id !== mid),
    }));
    closeCtxMenu();
  };

  const forwardMsg = (target: typeof contacts[0]) => {
    if (!ctxMenu) return;
    const msg = currentMsgs.find((m) => m.id === ctxMenu.msgId);
    if (!msg) return;
    const fwdId = Date.now();
    setMessages((prev) => ({
      ...prev,
      [target.id]: [...(prev[target.id] || []), { id: fwdId, text: `↪ ${msg.text}`, out: true, time: new Date().toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" }), status: "sending" }],
    }));
    setTimeout(() => updateMsgStatus(fwdId, target.id, "sent"), 400);
    setTimeout(() => updateMsgStatus(fwdId, target.id, "delivered"), 1200);
    if (target.status === "online") setTimeout(() => updateMsgStatus(fwdId, target.id, "read"), 2800);
    setForwardContact(null);
    closeCtxMenu();
    playSound("send");
  };

  const replyMsg = () => {
    if (!ctxMenu) return;
    const msg = currentMsgs.find((m) => m.id === ctxMenu.msgId);
    if (!msg) return;
    setInputText(`↩ «${msg.text.slice(0, 40)}${msg.text.length > 40 ? "…" : ""}»\n`);
    closeCtxMenu();
    setTimeout(() => document.querySelector<HTMLInputElement>(".msg-input")?.focus(), 50);
  };

  const pinMsg = () => {
    if (!ctxMenu) return;
    const cid = activeContact.id;
    setPinnedMsgs((prev) => ({
      ...prev,
      [cid]: prev[cid] === ctxMenu.msgId ? null : ctxMenu.msgId,
    }));
    closeCtxMenu();
  };

  const filtered = contacts.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="bg-mesh min-h-screen flex items-center justify-center p-2 md:p-4" onClick={closeCtxMenu}>
      {/* Copy toast */}
      {copyToast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 rounded-xl glass-dark border border-white/10 text-sm text-white/80 animate-fade-in shadow-xl flex items-center gap-2">
          <Icon name="Check" size={14} className="text-emerald-400" />
          Скопировано
        </div>
      )}

      {/* Context menu */}
      {ctxMenu && (
        <div
          className="fixed z-[60] glass-dark border border-white/10 rounded-2xl shadow-2xl py-1.5 min-w-[180px] animate-scale-in"
          style={{ left: Math.min(ctxMenu.x, window.innerWidth - 200), top: Math.min(ctxMenu.y, window.innerHeight - 220) }}
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={replyMsg} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/75 hover:bg-white/[0.06] hover:text-white transition-colors">
            <Icon name="CornerUpLeft" size={15} className="text-violet-400" />
            Ответить
          </button>
          <button onClick={copyMsg} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/75 hover:bg-white/[0.06] hover:text-white transition-colors">
            <Icon name="Copy" size={15} className="text-cyan-400" />
            Копировать
          </button>
          <button
            onClick={() => setForwardContact(forwardContact ? null : contacts[0])}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/75 hover:bg-white/[0.06] hover:text-white transition-colors"
          >
            <Icon name="Forward" size={15} className="text-emerald-400" />
            Переслать
          </button>
          {forwardContact !== null && (
            <div className="border-t border-white/[0.06] pt-1 mt-1">
              <p className="px-4 py-1 text-[11px] text-white/30 uppercase tracking-wider">Переслать кому</p>
              {contacts.filter((c) => c.id !== activeContact.id).map((c) => (
                <button
                  key={c.id}
                  onClick={() => forwardMsg(c)}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-white/75 hover:bg-white/[0.06] hover:text-white transition-colors"
                >
                  <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${c.color} flex items-center justify-center text-[9px] font-bold text-white`}>{c.avatar[0]}</div>
                  {c.name.split(" ")[0]}
                </button>
              ))}
            </div>
          )}
          <button onClick={pinMsg} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/75 hover:bg-white/[0.06] hover:text-white transition-colors">
            <Icon name="Pin" size={15} className="text-amber-400" />
            {pinnedMsgs[activeContact.id] === ctxMenu?.msgId ? "Открепить" : "Закрепить"}
          </button>
          <div className="border-t border-white/[0.06] mt-1 pt-1">
            <button onClick={deleteMsg} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400/80 hover:bg-red-500/10 hover:text-red-400 transition-colors">
              <Icon name="Trash2" size={15} />
              Удалить
            </button>
          </div>
        </div>
      )}

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

        <ChatSidebar
          sidebarOpen={sidebarOpen}
          search={search}
          setSearch={setSearch}
          filtered={filtered}
          activeContact={activeContact}
          setActiveContact={setActiveContact}
          unreadCounts={unreadCounts}
          setUnreadCounts={setUnreadCounts}
        />

        <div className="flex-1 flex flex-col min-w-0">
          <ChatHeader
            activeContact={activeContact}
            isTyping={isTyping}
            view={view}
            setView={setView}
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            msgSearchOpen={msgSearchOpen}
            msgSearch={msgSearch}
            msgSearchIdx={msgSearchIdx}
            msgMatches={msgMatches}
            msgSearchRef={msgSearchRef}
            setMsgSearch={setMsgSearch}
            setMsgSearchIdx={setMsgSearchIdx}
            openMsgSearch={openMsgSearch}
            closeMsgSearch={closeMsgSearch}
            stepSearch={stepSearch}
            pinnedMsgs={pinnedMsgs}
            setPinnedMsgs={setPinnedMsgs}
            currentMsgs={currentMsgs}
            msgRefs={msgRefs}
          />

          <ChatMessages
            view={view}
            setView={setView}
            activeContact={activeContact}
            currentMsgs={currentMsgs}
            isTyping={isTyping}
            hoveredMsgId={hoveredMsgId}
            setHoveredMsgId={setHoveredMsgId}
            reactionPickerMsgId={reactionPickerMsgId}
            setReactionPickerMsgId={setReactionPickerMsgId}
            msgSearch={msgSearch}
            msgSearchIdx={msgSearchIdx}
            msgMatches={msgMatches}
            msgRefs={msgRefs}
            messagesEndRef={messagesEndRef}
            inputText={inputText}
            setInputText={setInputText}
            sendMessage={sendMessage}
            addReaction={addReaction}
            openCtxMenu={openCtxMenu}
            micOn={micOn}
            setMicOn={setMicOn}
            camOn={camOn}
            setCamOn={setCamOn}
            callDuration={callDuration}
            formatDuration={formatDuration}
          />
        </div>
      </div>
    </div>
  );
}
