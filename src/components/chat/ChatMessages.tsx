import Icon from "@/components/ui/icon";
import { Contact, Msg, MsgStatus, ViewType, REACTION_EMOJIS, contacts } from "./chat-types";

function MsgTick({ status }: { status?: MsgStatus }) {
  if (!status) return null;
  if (status === "sending") return <span className="text-white/30 text-[11px]">⏳</span>;
  if (status === "sent") return (
    <svg width="14" height="10" viewBox="0 0 14 10" className="inline text-white/40" fill="none">
      <path d="M1 5l3 3 5-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  if (status === "delivered") return (
    <svg width="18" height="10" viewBox="0 0 18 10" className="inline text-white/40" fill="none">
      <path d="M1 5l3 3 5-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6 5l3 3 5-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  return (
    <svg width="18" height="10" viewBox="0 0 18 10" className="inline text-cyan-400" fill="none">
      <path d="M1 5l3 3 5-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6 5l3 3 5-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

interface ChatMessagesProps {
  view: ViewType;
  setView: (v: ViewType) => void;
  activeContact: Contact;
  currentMsgs: Msg[];
  isTyping: boolean;
  hoveredMsgId: number | null;
  setHoveredMsgId: (id: number | null) => void;
  reactionPickerMsgId: number | null;
  setReactionPickerMsgId: (id: number | null) => void;
  msgSearch: string;
  msgSearchIdx: number;
  msgMatches: number[];
  msgRefs: React.MutableRefObject<Record<number, HTMLDivElement | null>>;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  inputText: string;
  setInputText: (v: string) => void;
  sendMessage: () => void;
  addReaction: (msgId: number, emoji: string) => void;
  openCtxMenu: (e: React.MouseEvent, msgId: number) => void;
  micOn: boolean;
  setMicOn: React.Dispatch<React.SetStateAction<boolean>>;
  camOn: boolean;
  setCamOn: React.Dispatch<React.SetStateAction<boolean>>;
  callDuration: number;
  formatDuration: (s: number) => string;
}

export default function ChatMessages({
  view,
  setView,
  activeContact,
  currentMsgs,
  isTyping,
  hoveredMsgId,
  setHoveredMsgId,
  reactionPickerMsgId,
  setReactionPickerMsgId,
  msgSearch,
  msgSearchIdx,
  msgMatches,
  msgRefs,
  messagesEndRef,
  inputText,
  setInputText,
  sendMessage,
  addReaction,
  openCtxMenu,
  micOn,
  setMicOn,
  camOn,
  setCamOn,
  callDuration,
  formatDuration,
}: ChatMessagesProps) {
  return (
    <>
      {/* Video call */}
      {view === "video" && (
        <div className="flex-1 flex flex-col items-center justify-center relative animate-fade-in" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`w-40 h-40 rounded-full bg-gradient-to-br ${activeContact.color} opacity-20 blur-3xl`} />
          </div>

          <div className="relative w-full max-w-lg mx-4">
            <div className={`w-full aspect-video rounded-2xl bg-gradient-to-br ${activeContact.color} opacity-20 flex items-center justify-center border border-white/10`}>
              <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${activeContact.color} flex items-center justify-center text-3xl font-bold text-white opacity-90 pulse-ring`}>
                {activeContact.avatar}
              </div>
            </div>

            <div className="absolute bottom-3 right-3 w-24 h-16 rounded-xl bg-gradient-to-br from-violet-800 to-violet-900 border border-white/20 flex items-center justify-center overflow-hidden shadow-xl">
              {camOn ? (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-sm font-bold text-white">Я</div>
              ) : (
                <Icon name="VideoOff" size={20} className="text-white/40" />
              )}
            </div>
          </div>

          <div className="mt-5 text-center z-10">
            <div className="text-white/90 font-semibold text-lg">{activeContact.name}</div>
            <div className="text-emerald-400 text-sm font-medium mt-1">{formatDuration(callDuration)}</div>
          </div>

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
            {currentMsgs.map((msg, i) => {
              const isMatch = msgSearch.trim() && msg.text.toLowerCase().includes(msgSearch.toLowerCase());
              const matchPos = msgMatches.indexOf(i);
              const isActiveMatch = isMatch && matchPos === msgSearchIdx;
              return (
                <div
                  key={msg.id}
                  ref={(el) => { msgRefs.current[msg.id] = el; }}
                  className={`flex ${msg.out ? "justify-end" : "justify-start"} animate-fade-in group/msg transition-all duration-200`}
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

                    <div
                      onContextMenu={(e) => openCtxMenu(e, msg.id)}
                      className={`px-4 py-2.5 transition-all duration-300 cursor-context-menu ${msg.out ? "msg-bubble-out" : "msg-bubble-in"} ${isActiveMatch ? "ring-2 ring-violet-400/70 ring-offset-1 ring-offset-transparent" : isMatch ? "ring-1 ring-amber-400/40" : ""}`}
                    >
                      <p className="text-sm text-white/90 leading-relaxed">
                        {isMatch
                          ? (() => {
                              const q = msgSearch.toLowerCase();
                              const parts = msg.text.split(new RegExp(`(${msgSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
                              return parts.map((p, pi) =>
                                p.toLowerCase() === q
                                  ? <mark key={pi} className={`rounded px-0.5 ${isActiveMatch ? "bg-violet-400 text-white" : "bg-amber-400/50 text-white"}`}>{p}</mark>
                                  : p
                              );
                            })()
                          : msg.text
                        }
                      </p>
                      <p className={`text-[11px] mt-1 flex items-center gap-1 ${msg.out ? "text-white/50 justify-end" : "text-white/30"}`}>
                        {msg.time}
                        {msg.out && <MsgTick status={msg.status} />}
                      </p>
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
              );
            })}

            {/* Typing indicator bubble */}
            {isTyping && activeContact.status !== "offline" && (
              <div className="flex justify-start items-end gap-2 animate-fade-in mt-1">
                <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${activeContact.color} flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0`}>
                  {activeContact.avatar[0]}
                </div>
                <div className="msg-bubble-in px-4 py-3 flex gap-1.5 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-white/50 animate-bounce" style={{ animationDelay: "160ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-white/50 animate-bounce" style={{ animationDelay: "320ms" }} />
                </div>
              </div>
            )}
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
                className="msg-input flex-1 bg-transparent text-sm text-white/85 placeholder-white/25 outline-none"
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
    </>
  );
}
