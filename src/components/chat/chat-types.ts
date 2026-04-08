export const contacts = [
  { id: 1, name: "Алексей Громов", avatar: "АГ", status: "online", lastMsg: "Увидимся завтра!", time: "14:32", unread: 2, color: "from-violet-500 to-purple-600" },
  { id: 2, name: "Марина Светлова", avatar: "МС", status: "online", lastMsg: "Посмотри файл 👀", time: "13:15", unread: 0, color: "from-cyan-500 to-blue-500" },
  { id: 3, name: "Дмитрий Волков", avatar: "ДВ", status: "away", lastMsg: "Хорошо, договорились", time: "11:02", unread: 0, color: "from-pink-500 to-rose-600" },
  { id: 4, name: "Команда Разработки", avatar: "КР", status: "online", lastMsg: "Деплой прошёл успешно 🚀", time: "Вчера", unread: 5, color: "from-emerald-500 to-teal-600" },
  { id: 5, name: "Ольга Небесная", avatar: "ОН", status: "offline", lastMsg: "Спасибо за помощь!", time: "Вчера", unread: 0, color: "from-amber-500 to-orange-500" },
  { id: 6, name: "Игорь Стальной", avatar: "ИС", status: "online", lastMsg: "Отправил отчёт", time: "Пн", unread: 0, color: "from-indigo-500 to-violet-500" },
];

export type Contact = typeof contacts[0];

export type MsgStatus = "sending" | "sent" | "delivered" | "read";
export type Msg = { id: number; text: string; out: boolean; time: string; reactions?: Record<string, number>; status?: MsgStatus };
export type ViewType = "chat" | "video";
export type Notification = { id: number; contactId: number; name: string; text: string; avatar: string; color: string };

export const REACTION_EMOJIS = ["❤️", "😂", "🔥", "👍", "😮", "😢"];

export const initialMessages: Record<number, Array<Msg>> = {
  1: [
    { id: 1, text: "Привет! Как дела?", out: false, time: "14:10" },
    { id: 2, text: "Отлично! Работаю над проектом", out: true, time: "14:12", status: "read" },
    { id: 3, text: "Классно, ты уже близко к финишу?", out: false, time: "14:20" },
    { id: 4, text: "Да, ещё пару дней и готово 🎉", out: true, time: "14:25", status: "read" },
    { id: 5, text: "Увидимся завтра!", out: false, time: "14:32" },
  ],
  2: [
    { id: 1, text: "Посмотри файл 👀", out: false, time: "13:15" },
  ],
  3: [
    { id: 1, text: "Встретимся в 15:00?", out: true, time: "10:55", status: "read" },
    { id: 2, text: "Хорошо, договорились", out: false, time: "11:02" },
  ],
  4: [
    { id: 1, text: "Ребята, готов к тестированию?", out: true, time: "10:00", status: "read" },
    { id: 2, text: "Да, всё норм!", out: false, time: "10:15" },
    { id: 3, text: "Деплой прошёл успешно 🚀", out: false, time: "Вчера" },
  ],
  5: [{ id: 1, text: "Спасибо за помощь!", out: false, time: "Вчера" }],
  6: [{ id: 1, text: "Отправил отчёт", out: false, time: "Пн" }],
};

export const statusColor: Record<string, string> = {
  online: "bg-emerald-400",
  away: "bg-amber-400",
  offline: "bg-gray-500",
};

export const statusLabel: Record<string, string> = {
  online: "в сети",
  away: "недавно",
  offline: "не в сети",
};

export const playSound = (type: "send" | "receive") => {
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
