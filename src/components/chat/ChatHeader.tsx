import { useRef } from "react";
import Icon from "@/components/ui/icon";
import { Contact, Msg, ViewType, statusColor, statusLabel } from "./chat-types";

interface ChatHeaderProps {
  activeContact: Contact;
  isTyping: boolean;
  view: ViewType;
  setView: (v: ViewType) => void;
  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  msgSearchOpen: boolean;
  msgSearch: string;
  msgSearchIdx: number;
  msgMatches: number[];
  msgSearchRef: React.RefObject<HTMLInputElement>;
  setMsgSearch: (v: string) => void;
  setMsgSearchIdx: (v: number) => void;
  openMsgSearch: () => void;
  closeMsgSearch: () => void;
  stepSearch: (dir: 1 | -1) => void;
  pinnedMsgs: Record<number, number | null>;
  setPinnedMsgs: React.Dispatch<React.SetStateAction<Record<number, number | null>>>;
  currentMsgs: Msg[];
  msgRefs: React.MutableRefObject<Record<number, HTMLDivElement | null>>;
}

export default function ChatHeader({
  activeContact,
  isTyping,
  view,
  setView,
  sidebarOpen,
  setSidebarOpen,
  msgSearchOpen,
  msgSearch,
  msgSearchIdx,
  msgMatches,
  msgSearchRef,
  setMsgSearch,
  setMsgSearchIdx,
  openMsgSearch,
  closeMsgSearch,
  stepSearch,
  pinnedMsgs,
  setPinnedMsgs,
  currentMsgs,
  msgRefs,
}: ChatHeaderProps) {
  const pinnedMsg = pinnedMsgs[activeContact.id]
    ? currentMsgs.find((m) => m.id === pinnedMsgs[activeContact.id])
    : null;

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/[0.06]" style={{ background: "rgba(0,0,0,0.15)" }}>
        <button
          onClick={() => setSidebarOpen((s) => !s)}
          className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-white/40 hover:text-white/70 flex-shrink-0"
        >
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
          <div className="text-xs flex items-center gap-1">
            {isTyping && activeContact.status !== "offline" ? (
              <>
                <span className="flex gap-[3px] items-center">
                  <span className="w-1 h-1 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1 h-1 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1 h-1 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                </span>
                <span className="text-violet-400">печатает...</span>
              </>
            ) : (
              <span className="text-white/40">{statusLabel[activeContact.status]}</span>
            )}
          </div>
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
          <button
            onClick={openMsgSearch}
            className={`p-2 rounded-lg transition-colors ${msgSearchOpen ? "bg-violet-500/20 text-violet-300" : "hover:bg-white/[0.06] text-white/40 hover:text-white/70"}`}
          >
            <Icon name="Search" size={16} />
          </button>
          <button className="p-2 rounded-lg hover:bg-white/[0.06] transition-colors text-white/40 hover:text-white/70">
            <Icon name="MoreVertical" size={16} />
          </button>
        </div>
      </div>

      {/* Message search bar */}
      {msgSearchOpen && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-white/[0.06] animate-fade-in" style={{ background: "rgba(0,0,0,0.2)" }}>
          <Icon name="Search" size={14} className="text-white/30 flex-shrink-0" />
          <input
            ref={msgSearchRef}
            value={msgSearch}
            onChange={(e) => { setMsgSearch(e.target.value); setMsgSearchIdx(0); }}
            onKeyDown={(e) => {
              if (e.key === "Enter") stepSearch(e.shiftKey ? -1 : 1);
              if (e.key === "Escape") closeMsgSearch();
            }}
            placeholder="Поиск в переписке..."
            className="flex-1 bg-transparent text-sm text-white/80 placeholder-white/25 outline-none"
          />
          {msgSearch && (
            <span className="text-xs text-white/30 flex-shrink-0">
              {msgMatches.length > 0 ? `${msgSearchIdx + 1} / ${msgMatches.length}` : "0 результатов"}
            </span>
          )}
          {msgMatches.length > 1 && (
            <>
              <button onClick={() => stepSearch(-1)} className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-white/70 transition-colors">
                <Icon name="ChevronUp" size={14} />
              </button>
              <button onClick={() => stepSearch(1)} className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-white/70 transition-colors">
                <Icon name="ChevronDown" size={14} />
              </button>
            </>
          )}
          <button onClick={closeMsgSearch} className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-white/70 transition-colors">
            <Icon name="X" size={14} />
          </button>
        </div>
      )}

      {/* Pinned message banner */}
      {pinnedMsg && (
        <div
          className="flex items-center gap-3 px-4 py-2 border-b border-white/[0.06] cursor-pointer hover:bg-white/[0.03] transition-colors animate-fade-in"
          style={{ background: "rgba(139,92,246,0.07)" }}
          onClick={() => {
            msgRefs.current[pinnedMsg.id]?.scrollIntoView({ behavior: "smooth", block: "center" });
          }}
        >
          <div className="w-0.5 h-8 rounded-full bg-violet-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-violet-400 font-medium mb-0.5 flex items-center gap-1">
              <Icon name="Pin" size={11} />
              Закреплённое сообщение
            </p>
            <p className="text-xs text-white/55 truncate">{pinnedMsg.text}</p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setPinnedMsgs((prev) => ({ ...prev, [activeContact.id]: null })); }}
            className="p-1 rounded hover:bg-white/10 text-white/25 hover:text-white/60 transition-colors flex-shrink-0"
          >
            <Icon name="X" size={13} />
          </button>
        </div>
      )}
    </>
  );
}
