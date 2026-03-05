import { useEffect } from "react";

export default function ExtraFeatures({ time }) {
  useEffect(() => {
    // Каждые 20 секунд показываем маленькое уведомление
    const interval = setInterval(() => {
      const sec = Math.floor(time / 100000);
      if (sec === 0) return;
      const message = [
        "💡 Сделай вдох и расслабься",
        "🛋 Подумай о том, что ничего не делать тоже нормально",
        "☕ Время для воды или кофе",
        "😎 Ты уже продержался " + sec + " секунд ничего",
        "🎵 Сделай короткий танец или растяжку"
      ];
      const randomMsg = message[Math.floor(Math.random() * message.length)];

      const div = document.createElement("div");
      div.innerText = randomMsg;
      div.style.position = "fixed";
      div.style.bottom = "30px";
      div.style.left = Math.random() * 70 + 15 + "%";
      div.style.background = "#111";
      div.style.color = "#00ffcc";
      div.style.padding = "10px 20px";
      div.style.borderRadius = "12px";
      div.style.boxShadow = "0 0 20px #00ffcc";
      div.style.fontWeight = "bold";
      div.style.zIndex = 9999;
      div.style.opacity = 0;
      div.style.transform = "translateY(20px)";
      div.style.transition = "all 0.5s";

      document.body.appendChild(div);

      setTimeout(() => {
        div.style.opacity = 1;
        div.style.transform = "translateY(0px)";
      }, 50);

      setTimeout(() => {
        div.style.opacity = 0;
        div.style.transform = "translateY(-20px)";
      }, 3500);

      setTimeout(() => {
        document.body.removeChild(div);
      }, 4000);

    }, 20000);

    return () => clearInterval(interval);
  }, [time]);

  return null;
}