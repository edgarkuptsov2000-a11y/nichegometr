import { useEffect, useRef, useState } from "react";

export default function ExtraFeatures({ time }) {
  const [nope, setNope] = useState(false);
  const [thought, setThought] = useState(null);
  const audioRef = useRef(null);

  const thoughts = [
    "Может начнёшь учиться? Хотя не…",
    "Ты сейчас мог бы стать миллионером",
    "Твой кот продуктивнее тебя",
    "Еще 5 минут и точно начну",
    "Ничего не делать — тоже навык",
    "Открыл вкладку… и зачем?",
    "Ты проверил телефон 4 секунды назад"
  ];

  const achievements = [
    { t: 60, text: "🏆 1 минута без смысла" },
    { t: 600, text: "🏆 10 минут прокрастинации" },
    { t: 3600, text: "🏆 Час бесполезности" }
  ];

  useEffect(() => {
    const a = achievements.find(x => x.t === time);
    if (a) alert(a.text);
  }, [time]);

  const productivity = () => {
    audioRef.current?.play();
    setNope(true);
    setTimeout(() => setNope(false), 1500);
  };

  const showThought = () => {
    const t = thoughts[Math.floor(Math.random() * thoughts.length)];
    setThought(t);
    setTimeout(() => setThought(null), 3000);
  };

}