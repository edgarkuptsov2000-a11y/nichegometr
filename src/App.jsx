import { useState, useEffect } from "react";
import "./index.css";
import ExtraFeatures from "./ExtraFeatures";

async function saveScore(userId, name, points) { 
  await setDoc(
    doc(db, "users", userId),
    { name, points },
    { merge: true }
  );
}
function App() {
  const [user, setUser] = useState(null);
  const [nick, setNick] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [start, setStart] = useState(null);
  const [time, setTime] = useState(0);
  const [clicks, setClicks] = useState(0);
  const [users, setUsers] = useState([]);
  const [globalUsers, setGlobalUsers] = useState([]);

  useEffect(() => {
  const q = query(collection(db, "users"), orderBy("points", "desc"));

  const unsub = onSnapshot(q, (snapshot) => {
    const leaderboard = snapshot.docs.map(doc => doc.data());
    setUsers(leaderboard);
  });

  return () => unsub();
}, []);

  // ===========================
  // Модальные окна
  const [modalThoughts, setModalThoughts] = useState([]);
  const [modalNope, setModalNope] = useState(false);

  // Редактирование профиля
  const [editing, setEditing] = useState(false);
  const [newNick, setNewNick] = useState(user?.nick);
  const [newAvatar, setNewAvatar] = useState(null);

  const usefulThoughts = [
    "Помедитируй пару минут — мозг скажет спасибо.",
    "Сделай короткую растяжку — энергия прибавится.",
    "Выпей воды — это супер просто, а помогает.",
    "Сфокусируйся на одной задаче 5 минут — старт продуктивности.",
    "Запиши три цели на завтра — без усилий, чисто подготовка.",
    "Улыбнись — даже если просто сидишь, мозг радуется.",
    "Организуй рабочее место — меньше отвлекающих факторов.",
    "Подумай о маленькой победе — она мотивирует больше.",
    "Сделай дыхательное упражнение — сразу почувствуешь разницу.",
    "Отдохни от экрана — глаза будут благодарны."
  ];

  const colors = ["#00ffcc", "#ff00aa", "#ffaa00", "#00aaff", "#ff44ff"];

  // ===========================
  const showModalThought = () => {
    const randomText = usefulThoughts[Math.floor(Math.random() * usefulThoughts.length)];
    const id = Date.now();
    const left = Math.floor(Math.random() * 60 + 20); // 20%-80% ширины
    const color = colors[Math.floor(Math.random() * colors.length)];
    setModalThoughts(prev => [...prev, { id, text: randomText, left, color }]);
    setTimeout(() => {
      setModalThoughts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const showNopeModal = () => {
    setModalNope(true);
    new Audio("/faah.mp3").play();
    setTimeout(() => setModalNope(false), 4000);
  };

  const achievementsList = [
    { time: 30, text: "🐌 Медленный старт" },
    { time: 120, text: "🛋 Диванный философ" },
    { time: 300, text: "🔥 Легенда безделья" },
    { time: 900, text: "💀 Профессиональный ничегонеделатель" }
  ];

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("nichegoUser"));
    const list = JSON.parse(localStorage.getItem("nichegoUsers")) || [];
    if (saved) setUser(saved);
    setUsers(list);
  }, []);

  useEffect(() => {
  const q = query(collection(db, "users"), orderBy("total", "desc"));

  const unsub = onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(doc => doc.data());
    setGlobalUsers(list);
  });

  return () => unsub();
}, []);

  // Синхронизация рейтинга между вкладками
  useEffect(() => {
    const sync = () => {
      const list = JSON.parse(localStorage.getItem("nichegoUsers")) || [];
      setUsers(list);
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  useEffect(() => {
    let interval;
    if (start) {
      interval = setInterval(() => setTime(Date.now() - start), 1000);
    }
    return () => clearInterval(interval);
  }, [start]);

  useEffect(() => {
    const sec = Math.floor(time / 1000);
    achievementsList.forEach(a => {
      if (sec === a.time) alert(a.text);
    });
  }, [time]);

  useEffect(() => {
    const troll = setInterval(() => {
      if (!start) return;
      alert("⏳ Ты всё ещё ничего не делаешь. Отлично.");
    }, 45000);
    return () => clearInterval(troll);
  }, [start]);

  const register = () => {
    if (!nick) return alert("Введите ник");

    const isTaken = users.some(u => u.nick === nick);
    if (isTaken) return alert("⚠ Ник уже занят, выбери другой!");

    const reader = new FileReader();
    reader.onload = () => {
      const u = { nick, avatar: reader.result, total: 0 };
      localStorage.setItem("nichegoUser", JSON.stringify(u));
      const list = JSON.parse(localStorage.getItem("nichegoUsers")) || [];
      list.push(u);
      localStorage.setItem("nichegoUsers", JSON.stringify(list));
      setUsers(list);
      setUser(u);
    };
    reader.readAsDataURL(avatar);
  };

  const stop = () => {
    const sec = Math.floor(time / 1000);
    const updated = { ...user, total: user.total + sec };
    localStorage.setItem("nichegoUser", JSON.stringify(updated));
    const list = users.map(u => u.nick === user.nick ? updated : u);
    localStorage.setItem("nichegoUsers", JSON.stringify(list));
    setUsers(list);
    setUser(updated);
    saveScore(user.nick, user.nick, updated.total);
    setStart(null);
    setTime(0);
  };

  const secret = () => {
    setClicks(c => c + 1);
    if (clicks > 7) alert("Подозрительная активность…");
  };

  const saveProfile = () => {
    const isTaken = users.some(u => u.nick === newNick && u.nick !== user.nick);
    if (isTaken) return alert("⚠ Ник уже занят!");

    const updatedUser = { ...user, nick: newNick };
    if (newAvatar) {
      const reader = new FileReader();
      reader.onload = () => {
        updatedUser.avatar = reader.result;
        finalizeProfileUpdate(updatedUser);
      };
      reader.readAsDataURL(newAvatar);
    } else {
      finalizeProfileUpdate(updatedUser);
    }
  };

  const finalizeProfileUpdate = (updatedUser) => {
    setUser(updatedUser);
    const newList = users.map(u => (u.nick === user.nick ? updatedUser : u));
    localStorage.setItem("nichegoUser", JSON.stringify(updatedUser));
    localStorage.setItem("nichegoUsers", JSON.stringify(newList));
    setUsers(newList);
    setEditing(false);
  };

  if (!user) {
    return (
      <div style={{ textAlign: "center", marginTop: 100 }}>
        <h1>Ничегометр 💀</h1>
        <input placeholder="Ник" onChange={e => setNick(e.target.value)} />
        <br />
        <input type="file" onChange={e => setAvatar(e.target.files[0])} />
        <br />
        <button onClick={register}>Начать ничего</button>
      </div>
    );
  }

  const sorted = [...users].sort((a, b) => b.total - a.total);
  <h2 style={{ marginTop: 40 }}>🌍 Глобальный рейтинг</h2>
{globalUsers.map((u, i) => (
  <div key={i} style={{ opacity: u.name === user.nick ? 1 : 0.7 }}>
    {i+1}. {u.name} — {u.points}
  </div>
))}

  return (
    <div style={{ textAlign: "center", marginTop: 40, position: "relative" }}>
      {/* Профиль */}
      <h1>{user.nick}</h1>
      <img src={user.avatar} width={80} style={{ borderRadius: "50%" }} />

      {/* Новая кнопка редактирования */}
      <div className="editProfileWrapper">
        <button
          className="editProfileBtn"
          onClick={() => setEditing(true)}
          title="Редактировать профиль"
        >
          ⚙️
        </button>
      </div>

      {/* Редактирование профиля */}
      {editing && (
        <div className="profileEditor">
          <input
            placeholder="Новый ник"
            value={newNick}
            onChange={e => setNewNick(e.target.value)}
          />
          <br />
          <input type="file" onChange={e => setNewAvatar(e.target.files[0])} />
          <br />
          <button onClick={saveProfile}>Сохранить</button>
          <button onClick={() => setEditing(false)}>Отмена</button>
          <ExtraFeatures time={time} />
        </div>
      )}

      <h1
        onClick={secret}
        style={{ fontSize: 80, textShadow: "0 0 25px #ff00aa", cursor: "pointer" }}
      >
        {Math.floor(time / 1000)} сек
      </h1>

      {!editing && (
        <>
          <button onClick={() => setStart(Date.now())}>Начать ничего</button>
          <button onClick={stop}>Я хочу заняться делами</button>
          <button onClick={showNopeModal}>Стать продуктивным</button>
          <button onClick={showModalThought}>Полезная мысль 💡</button>
        </>
      )}

      <h3>Всего ничего: {user.total} сек</h3>

      <h2>🏆 Локальный рейтинг</h2>
      {sorted.map((u, i) => (
        <div key={i}>{i+1}. {u.nick} — {u.total} сек</div>
      ))}

      <h2 style={{ marginTop: 40 }}>🌍 Глобальный рейтинг</h2>
      {globalSorted.map((u, i) => (
        <div key={i} style={{ opacity: u.nick === user.nick ? 1 : 0.8 }}>
          {i+1}. {u.nick} — {u.total} сек
        </div>
      ))}

      {/* Модальные окна полезных мыслей */}
      {modalThoughts.map(t => (
        <div
          key={t.id}
          className="modalThought"
          style={{ left: `${t.left}%`, color: t.color }}
        >
          {t.text}
        </div>
      ))}

      {/* Модальное окно "Стать продуктивным" */}
      {modalNope && (
        <div className="modalNope">
          Нет Нет Нет, вы нарушаете правила. <br />
          Вернитесь обратно к ничегонеделанию!
        </div>
      )}
    </div>
  );
}

export default App;