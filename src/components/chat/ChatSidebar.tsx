import Icon from "@/components/ui/icon";
import { Contact, statusColor } from "./chat-types";

interface ChatSidebarProps {
  sidebarOpen: boolean;
  search: string;
  setSearch: (v: string) => void;
  filtered: Contact[];
  activeContact: Contact;
  setActiveContact: (c: Contact) => void;
  unreadCounts: Record<number, number>;
  setUnreadCounts: React.Dispatch<React.SetStateAction<Record<number, number>>>;
}

export default function ChatSidebar({
  sidebarOpen,
  search,
  setSearch,
  filtered,
  activeContact,
  setActiveContact,
  unreadCounts,
  setUnreadCounts,
}: ChatSidebarProps) {
  return (
    <div
      className={`${sidebarOpen ? "w-72" : "w-0 overflow-hidden"} transition-all duration-300 flex-shrink-0 flex flex-col border-r border-white/[0.06]`}
      style={{ background: "rgba(0,0,0,0.25)" }}
    >
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
  );
}
