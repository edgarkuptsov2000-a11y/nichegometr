import { useState, useEffect } from "react";
import "./index.css";
import ExtraFeatures from "./ExtraFeatures";
import { db, auth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "./firebase";
import { collection, getDocs, setDoc, doc, getDoc, query, orderBy, limit } from "firebase/firestore";

function App() {
  console.log(auth.app.options.projectId);
  // ================== Основные состояния ==================
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [globalSorted, setGlobalSorted] = useState([]);
  const [time, setTime] = useState(0);
  const [start, setStart] = useState(null);
  const [clicks, setClicks] = useState(0);

  // ================== Email/Пароль ==================
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);

  // ================== Профиль ==================
  const [nick, setNick] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [editing, setEditing] = useState(false);
  const [newNick, setNewNick] = useState("");
  const [newAvatar, setNewAvatar] = useState(null);

  // ================== Модалки ==================
  const [modalThoughts, setModalThoughts] = useState([]);
  const [modalNope, setModalNope] = useState(false);

  // ================== Полезные мысли ==================
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

  // ================== Достижения ==================
  const achievementsList = [
    { time: 30, text: "🐌 Медленный старт" },
    { time: 120, text: "🛋 Диванный философ" },
    { time: 300, text: "🔥 Легенда безделья" },
    { time: 900, text: "💀 Профессиональный ничегонеделатель" }
  ];

  // ================== Модалки ==================
  const showModalThought = () => {
    const randomText = usefulThoughts[Math.floor(Math.random() * usefulThoughts.length)];
    const id = Date.now();
    const left = Math.floor(Math.random() * 60 + 20);
    const color = colors[Math.floor(Math.random() * colors.length)];
    setModalThoughts(prev => [...prev, { id, text: randomText, left, color }]);
    setTimeout(() => setModalThoughts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const showNopeModal = () => {
    setModalNope(true);
    new Audio("/faah.mp3").play();
    setTimeout(() => setModalNope(false), 4000);
  };

  // ================== Таймер ==================
  useEffect(() => {
    let interval;
    if (start) {
      interval = setInterval(() => setTime(Date.now() - start), 1000);
    }
    return () => clearInterval(interval);
  }, [start]);

  useEffect(() => {
    const sec = Math.floor(time / 1000);
    achievementsList.forEach(a => { if (sec === a.time) alert(a.text); });
  }, [time]);

  useEffect(() => {
    const troll = setInterval(() => { if (!start) return; alert("⏳ Ты всё ещё ничего не делаешь. Отлично."); }, 45000);
    return () => clearInterval(troll);
  }, [start]);

  // ================== Email/Пароль ==================
const loginWithEmail = async () => {
  if (!email || !password) return alert("Введите email и пароль");

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
    const firebaseUser = userCredential.user;

    const docRef = doc(db, "users", firebaseUser.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const userData = docSnap.data();
      localStorage.setItem("nichegoUser", JSON.stringify(userData));
      setUser(userData);
    } else {
      alert("Документ пользователя не найден в Firestore");
    }

  } catch (e) {
    console.log(e);
    alert(e.code + " | " + e.message);
  }
};

const registerWithEmail = async () => {
  if (!email || !password) return alert("Введите email и пароль");

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
    const firebaseUser = userCredential.user;

    const newUser = {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      nick: "",
      avatar: "",
      total: 0
    };

    await setDoc(doc(db, "users", firebaseUser.uid), newUser);

    localStorage.setItem("nichegoUser", JSON.stringify(newUser));
    setUser(newUser);

  } catch (e) {
    console.log(e);
    alert(e.code + " | " + e.message);
  }
};
  // ================== Сохранение прогресса ==================
  const stop = async () => {
    const sec = Math.floor(time / 1000);
    const updated = { ...user, total: user.total + sec };
    localStorage.setItem("nichegoUser", JSON.stringify(updated));
    const list = users.map(u => u.uid === user.uid ? updated : u);
    localStorage.setItem("nichegoUsers", JSON.stringify(list));
    setUsers(list);
    setUser(updated);
    setStart(null);
    setTime(0);

    try { await setDoc(doc(db, "users", updated.uid), updated); } catch (err) { console.error(err); }
  };

  const secret = () => { setClicks(c => c + 1); if (clicks > 7) alert("Подозрительная активность…"); };

  const saveProfile = async () => {
    const updatedUser = { ...user, nick: newNick };
    if (newAvatar) {
      const reader = new FileReader();
      reader.onload = async () => {
        updatedUser.avatar = reader.result;
        finalizeProfile(updatedUser);
      };
      reader.readAsDataURL(newAvatar);
    } else finalizeProfile(updatedUser);
  };

  const finalizeProfile = async (updatedUser) => {
    setUser(updatedUser);
    const newList = users.map(u => u.uid === user.uid ? updatedUser : u);
    localStorage.setItem("nichegoUser", JSON.stringify(updatedUser));
    localStorage.setItem("nichegoUsers", JSON.stringify(newList));
    setUsers(newList);
    setEditing(false);
    try { await setDoc(doc(db, "users", updatedUser.uid), updatedUser); } catch (err) { console.error(err); }
  };

  // ================== Глобальный рейтинг ==================
  useEffect(() => {
    const fetchGlobal = async () => {
      try {
        const q = query(collection(db, "users"), orderBy("total", "desc"), limit(10));
        const querySnapshot = await getDocs(q);
        const topUsers = querySnapshot.docs.map(doc => doc.data());
        setGlobalSorted(topUsers);
      } catch (err) { console.error(err); }
    };
    fetchGlobal();
    const interval = setInterval(fetchGlobal, 10000);
    return () => clearInterval(interval);
  }, []);

  // ================== LocalStorage ==================
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("nichegoUser"));
    const list = JSON.parse(localStorage.getItem("nichegoUsers")) || [];
    if (saved) setUser(saved);
    setUsers(list);
  }, []);

  useEffect(() => {
    const sync = () => { const list = JSON.parse(localStorage.getItem("nichegoUsers")) || []; setUsers(list); };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  // ================== Если пользователь не вошёл ==================
  if (!user) return (
    <div style={{ textAlign:"center", marginTop:100 }}>
      <h1>Ничегометр 💀</h1>
      <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} /><br/>
      <input type="password" placeholder="Пароль" value={password} onChange={e=>setPassword(e.target.value)} /><br/>
      {isLogin ? <button onClick={loginWithEmail}>Войти</button> : <button onClick={registerWithEmail}>Зарегистрироваться</button>}
      <p style={{cursor:"pointer", color:"blue"}} onClick={()=>setIsLogin(!isLogin)}>
        {isLogin ? "Создать новый аккаунт" : "Уже есть аккаунт? Войти"}
      </p>
    </div>
  );

  const sorted = [...users].sort((a,b)=>b.total-a.total);

  // ================== JSX ==================
  return (
    <div style={{ textAlign:"center", marginTop:40, position:"relative" }}>
      <h1>{user.nick || "Без ника"}</h1>
      <img src={user.avatar || "/default-avatar.png"} width={80} style={{borderRadius:"50%"}} />
      <div className="editProfileWrapper">
        <button className="editProfileBtn" onClick={()=>setEditing(true)} title="Редактировать профиль">⚙️</button>
      </div>

      {editing && (
        <div className="profileEditor">
          <input placeholder="Новый ник" value={newNick} onChange={e=>setNewNick(e.target.value)} /><br/>
          <input type="file" onChange={e=>setNewAvatar(e.target.files[0])} /><br/>
          <button onClick={saveProfile}>Сохранить</button>
          <button onClick={()=>setEditing(false)}>Отмена</button>
          <ExtraFeatures time={time} />
        </div>
      )}

      <h1 style={{fontSize:80, textShadow:"0 0 25px #ff00aa", cursor:"pointer"}} onClick={secret}>{Math.floor(time/1000)} сек</h1>

      {!editing && (
        <>
          <button onClick={()=>setStart(Date.now())}>Начать ничего</button>
          <button onClick={stop}>Я хочу заняться делами</button>
          <button onClick={showNopeModal}>Стать продуктивным</button>
          <button onClick={showModalThought}>Полезная мысль 💡</button>
        </>
      )}

      <h3>Всего ничего: {user.total} сек</h3>

      <h2>🏆 Локальный рейтинг</h2>
      {sorted.map((u,i)=><div key={i}>{i+1}. {u.nick || "Без ника"} — {u.total} сек</div>)}

      <h2 style={{marginTop:40}}>🌍 Глобальный рейтинг</h2>
      {globalSorted.map((u,i)=><div key={i} style={{opacity:u.uid===user.uid?1:0.8}}>{i+1}. {u.nick || "Без ника"} — {u.total} сек</div>)}

      {modalThoughts.map(t=><div key={t.id} className="modalThought" style={{left:`${t.left}%`, color:t.color}}>{t.text}</div>)}
      {modalNope && <div className="modalNope">Нет Нет Нет, вы нарушаете правила. <br/>Вернитесь обратно к ничегонеделанию!</div>}
    </div>
  );
}

export default App;