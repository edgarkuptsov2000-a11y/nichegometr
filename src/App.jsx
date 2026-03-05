import { useState, useEffect, useRef } from "react";
import "./index.css";
import ExtraFeatures from "./ExtraFeatures";
import { createClient } from "@supabase/supabase-js";
import AvatarEditor from "./AvatarEditor";

// ================== Настройка Supabase ==================
const supabaseUrl = "https://jecdcdeuexnxcncphtzq.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplY2RjZGV1ZXhueGNuY3BodHpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NDA1MDIsImV4cCI6MjA4NzUxNjUwMn0.qsF63HwE6GZQJMMtv-4qXWiZAhppeC2rB0bJCxWAL3g";
const supabase = createClient(supabaseUrl, supabaseKey);

function App() {
  const [ratingLimit, setRatingLimit] = useState(10);
  const [user, setUser] = useState(null);
  const [globalSorted, setGlobalSorted] = useState([]);
  const [time, setTime] = useState(0);
  const [start, setStart] = useState(null);
  const [clicks, setClicks] = useState(0);

  const handleAvatarSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
  };

  const [selectedImage, setSelectedImage] = useState(null);
  const [showCropper, setShowCropper] = useState(false);

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const [showCaptcha, setShowCaptcha] = useState(false);
  const [captchaTimeout, setCaptchaTimeout] = useState(null);
  const [isRunning, setIsRunning] = useState(true);

  const fileInputRef = useRef();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);

  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  const [editing, setEditing] = useState(false);
  const [firstSetup, setFirstSetup] = useState(false);
  const [newNick, setNewNick] = useState("");
  const [newAvatar, setNewAvatar] = useState(null);

  const [modalThoughts, setModalThoughts] = useState([]);
  const [modalNope, setModalNope] = useState(false);

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

  const achievementsList = [
    { time: 300, text: "🐌 Медленный старт" },
    { time: 1200, text: "🛋 Диванный философ" },
    { time: 3000, text: "🔥 Легенда безделья" },
    { time: 9000, text: "💀 Профессиональный ничегонеделатель" }
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

  //======================================

  const getOrCreateProfile = async (uid, email) => {
    // maybeSingle НЕ падает, если строки нет
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", uid)
      .maybeSingle();

    if (error) throw error;

    // Если профиля нет — создаём
    if (!data) {
      const { error: insErr } = await supabase.from("users").insert([{
        id: uid,
        email: email || "",
        nick: "",
        avatar: "",
        total: 0
      }]);

      if (insErr) throw insErr;

      // Забираем созданный профиль
      const { data: created, error: selErr } = await supabase
        .from("users")
        .select("*")
        .eq("id", uid)
        .single();

      if (selErr) throw selErr;
      return created;
    }

    return data;
  };

  //=================================================

  useEffect(() => {
    const loadUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) return;

      try {
        const profile = await getOrCreateProfile(session.user.id, session.user.email);
        setUser(profile);

        if (!profile.nick) {
          setFirstSetup(true);
        }

      } catch (err) {
        console.log("SESSION LOAD ERROR", err);
      }
    };

    loadUser();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!session?.user) {
          setUser(null);
          return;
        }

        try {
          const profile = await getOrCreateProfile(session.user.id, session.user.email);
          setUser(profile);

          if (!profile.nick) {
            setFirstSetup(true);
          }

        } catch (err) {
          console.log("AUTH LISTENER ERROR", err);
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  //=====================================================

  useEffect(() => {
    // сохраняем старт таймера
    if (start) localStorage.setItem("timerStart", String(start));
    else localStorage.removeItem("timerStart");
  }, [start]);

  useEffect(() => {
    localStorage.setItem("timerRunning", String(isRunning));
  }, [isRunning]);

  useEffect(() => {
    const savedStart = localStorage.getItem("timerStart");
    const savedRunning = localStorage.getItem("timerRunning");

    if (savedStart) {
      const s = Number(savedStart);
      if (!Number.isNaN(s)) {
        setStart(s);
        setTime(Date.now() - s); // ✅ сразу выставляем время
      }
    }

    if (savedRunning) {
      setIsRunning(savedRunning === "true");
    }
  }, []);

  // ================== Таймер ==================
  useEffect(() => {
    let interval;

    if (start && isRunning) {
      interval = setInterval(() => {
        setTime(Date.now() - start);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [start, isRunning]);

  useEffect(() => {
    const sec = Math.floor(time / 1000);
    achievementsList.forEach(a => { if (sec === a.time) alert(a.text); });
  }, [time]);

  useEffect(() => {
    const troll = setInterval(() => {
      if (!start) return;
      alert("⏳ Ты всё ещё ничего не делаешь. Отлично.");
    }, 4500000);
    return () => clearInterval(troll);
  }, [start]);

  const formatTime = (ms) => {
    const total = Math.floor(ms / 1000);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const openLogoutConfirm = () => setShowLogoutConfirm(true);

  const confirmLogout = async () => {
    setShowLogoutConfirm(false);
    await logout(); // твоя существующая функция logout()
  };

  // ================== Регистрация ==================
const loginWithEmail = async () => {
  setAuthError("");

  if (!email || !password) {
    setAuthError("Введите email и пароль");
    return;
  }

  setAuthLoading(true);

  try {
    console.log("LOGIN START", email.trim());

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) throw error;

    console.log("LOGIN SUCCESS", data);

    // НИЧЕГО больше не делаем
    // onAuthStateChange сам загрузит профиль

  } catch (e) {
    console.log("LOGIN ERROR FULL", e);
    setAuthError(e?.message || "Ошибка входа");
  } finally {
    setAuthLoading(false);
  }
};

  const handleAuthSubmit = async () => {
    console.log("AUTH CLICK"); // проверка
    if (isLogin) await loginWithEmail();
    else await registerWithEmail();
  };

  // ================== Сохранение прогресса ==================
  const stop = async () => {
    if (!user) return;

    const sec = Math.floor(time / 1000);
    if (sec <= 0) return;

    const updated = {
      ...user,
      total: user.total + sec,
      sessions_count: (user.sessions_count || 0) + 1,
      longest_session: Math.max(user.longest_session || 0, sec),
      total_sessions_time: (user.total_sessions_time || 0) + sec
    };

    updated.average_session = Math.floor(
      updated.total_sessions_time / updated.sessions_count
    );

    setUser(updated);
    setStart(null);
    setTime(0);

    try {
      await supabase
        .from("users")
        .update({
          total: updated.total,
          sessions_count: updated.sessions_count,
          longest_session: updated.longest_session,
          total_sessions_time: updated.total_sessions_time,
          average_session: updated.average_session
        })
        .eq("id", updated.id);

      fetchGlobalRating();
    } catch (err) {
      console.error(err);
    }
  };

  //====================================================
  const triggerCaptcha = () => {
    setShowCaptcha(true);

    const timeout = setTimeout(async () => {
      setShowCaptcha(false);
      setIsRunning(false);

      await stop(); // ← ВОТ ЭТОГО ТОЖЕ НЕ БЫЛО
    }, 10000);

    setCaptchaTimeout(timeout);
  };

  const handleCaptchaSuccess = () => {
    clearTimeout(captchaTimeout);
    setShowCaptcha(false);
    setIsRunning(true);
  };

  const handleCaptchaFail = async () => {
    clearTimeout(captchaTimeout);
    setShowCaptcha(false);
    setIsRunning(false);

    await stop(); // ← ВОТ ЭТОГО НЕ ХВАТАЛО
  };

  // ================== Редактирование профиля с проверкой уникальности ==================
  const saveProfile = async () => {
    const trimmedNick = newNick.trim();

    if (!trimmedNick) {
      alert("Ник не может быть пустым");
      return;
    }

    try {
      // Проверяем уникальность ника
      const { data: existingNick } = await supabase
        .from("users")
        .select("id")
        .eq("nick", trimmedNick)
        .neq("id", user.id)
        .single();

      if (existingNick) {
        alert("Такой ничегошка уже есть(");
        return;
      }

      const updatedUser = { ...user, nick: trimmedNick };

      if (newAvatar) {
        updatedUser.avatar = newAvatar;
      }
      await finalize(updatedUser);

      async function finalize(updated) {
        const { data, error } = await supabase
          .from("users")
          .update({ nick: updated.nick, avatar: updated.avatar || "" })
          .eq("id", updated.id)
          .select()
          .single();

        if (error) throw error;

        localStorage.setItem("nichegoUser", JSON.stringify(data));
        setUser(data);

        // Обновляем локально
        setNewNick("");
        setNewAvatar(null);
        setEditing(false);
        setFirstSetup(false);

        alert("Профиль успешно обновлён!");
        fetchGlobalRating();
      }

    } catch (err) {
      console.error(err);
      alert("Не удалось проверить ник");
    }
  };

  // ================== Выход ==================
  const logout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem("timerStart");
      localStorage.removeItem("timerRunning");
      localStorage.removeItem("nichegoUser");
      setUser(null);
      setStart(null);
      setTime(0);
      setEditing(false);
    } catch (err) {
      console.error(err);
      alert("Не удалось выйти из аккаунта");
    }
  };

  //====================ТАЙМЕР========================
  useEffect(() => {
    if (!user) return;

    const randomTime =
      (15 + Math.random() * 5) * 60 * 1000; // 15-20 минут

    const interval = setInterval(() => {
      triggerCaptcha();
    }, randomTime);

    return () => clearInterval(interval);
  }, [user]);

  // ================== Глобальный рейтинг ==================
  const fetchGlobalRating = async () => {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("total", { ascending: false })
      .limit(ratingLimit);

    if (!error && data) setGlobalSorted(data);
  };

  useEffect(() => {
    fetchGlobalRating();

    const channel = supabase
      .channel("users-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "users" },
        () => fetchGlobalRating()
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [ratingLimit]);

  // ================== JSX ==================
  if (user && firstSetup) {
    return (
      <div style={{ textAlign: "center", marginTop: 80 }}>
        <h2>Добро пожаловать, ничегошка</h2>
        <input
          placeholder="Твой ник"
          value={newNick}
          onChange={(e) => setNewNick(e.target.value)}
        /><br />
        <input
          type="file"
          accept="image/*"
          onChange={handleAvatarSelect}
        />
        <br />
        <button onClick={() => saveProfile()}>Начать ничего не делать</button>
        {showCropper && (
          <AvatarEditor
            image={selectedImage}
            onSave={(croppedImage) => {
              setNewAvatar(croppedImage);
              setShowCropper(false);
            }}
            onCancel={() => setShowCropper(false)}
          />
        )}
      </div>
    );
  }

  if (!user) return (
    <div style={{ textAlign: "center", marginTop: 100 }}>
      <h1>Ничегометр</h1>

      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
      />
      <br />

      <input
        type="password"
        placeholder="Пароль"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete={isLogin ? "current-password" : "new-password"}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleAuthSubmit();
        }}
      />
      <br />

      <button
        type="button"
        onClick={handleAuthSubmit}
        disabled={authLoading}
        style={{ opacity: authLoading ? 0.7 : 1 }}
      >
        {authLoading ? "Входим..." : (isLogin ? "Войти" : "Зарегистрироваться")}
      </button>

      {authError && (
        <div style={{ marginTop: 12, color: "#ff8080", fontWeight: 700 }}>
          {authError}
        </div>
      )}

      <p
        style={{ cursor: "pointer", color: "blue", marginTop: 16 }}
        onClick={() => {
          setAuthError("");
          setIsLogin(!isLogin);
        }}
      >
        {isLogin ? "Создать новый аккаунт" : "Уже есть аккаунт? Войти"}
      </p>
    </div>
  );

  return (
    <div style={{ padding: "40px 60px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "60px"
        }}
      >
        {/* ====== СТАТИСТИКА (STICKY) ====== */}
        <div
          style={{
            width: "260px",
            position: "sticky",
            top: "50px"
          }}
        >
          <div
            style={{
              padding: 20,
              background: "#111",
              borderRadius: 20,
              boxShadow: "0 0 25px rgba(0,0,0,0.6)"
            }}
          >
            <h3>📊 Статистика</h3>
            <p>Всего ничегонеделанья: {user.total} сек</p>
            <p>Количество попыток за день: {user.sessions_count || 0}</p>
            <p>Самое длинное ничегонеделанье: {user.longest_session || 0} сек</p>
            <p>Среднее ничегонеделанье: {user.average_session || 0} сек</p>
          </div>
        </div>

        {/* ====== ОСНОВНОЙ КОНТЕНТ ====== */}
        <div
          style={{
            flex: 1,
            maxWidth: "700px",
            textAlign: "center"
          }}
        >
          {/* Аватар + ник */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "20px",
              marginBottom: "20px"
            }}
          >
            {editing && (
              <div
                className="cropperOverlay"
                onClick={() => setEditing(false)}
              >
                <div
                  className="editPanel"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h2 style={{ marginTop: 0 }}>Редактирование профиля</h2>

                  <input
                    className="editInput"
                    placeholder="Новый ник"
                    value={newNick}
                    onChange={(e) => setNewNick(e.target.value)}
                  />

                  <div className="editActions">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Выбрать аватар
                    </button>

                    <button type="button" onClick={saveProfile}>
                      Сохранить
                    </button>

                    <button
                      type="button"
                      className="secondary"
                      onClick={() => setEditing(false)}
                    >
                      Отмена
                    </button>
                  </div>

                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleAvatarSelect}
                    style={{ display: "none" }}
                  />
                </div>
              </div>
            )}

            <img
              src={user.avatar || "/default-avatar.png"}
              style={{
                width: 120,
                height: 120,
                borderRadius: "50%",
                objectFit: "cover",
                boxShadow: "0 0 15px #ff00aa"
              }}
            />

            <div>
              <h1 style={{ margin: 0 }}>{user.nick || "Без ника"}</h1>

              <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => {
                    setNewNick(user.nick || "");
                    setNewAvatar(null);
                    setEditing(true);
                  }}
                >
                  ⚙️ Редактировать
                </button>

                <button onClick={openLogoutConfirm}>Выйти</button>
              </div>
            </div>
          </div>

          {/* Таймер */}
          <h1
            style={{
              fontSize: 80,
              textShadow: "0 0 25px #ff00aa"
            }}
          >
            {formatTime(time)}
          </h1>

          {/* Кнопки */}
          <div className="buttons-grid">
            <button onClick={() => {
              setIsRunning(true);
              setStart(Date.now());
            }}>
              Начать ничего
            </button>

            <button onClick={stop}>
              Я хочу заняться делами
            </button>

            <button onClick={showNopeModal}>
              Стать продуктивным
            </button>

            <button onClick={showModalThought}>
              Полезная мысль 💡
            </button>
          </div>

          {/* ====== РЕЙТИНГ ====== */}
          <h2 style={{ marginTop: 50 }}>🌍 Глобальный рейтинг</h2>

          <div className="rating-actions">
            {ratingLimit === 10 && (
              <button onClick={() => setRatingLimit(50)}>Показать ТОП-50</button>
            )}
            {ratingLimit === 50 && (
              <button onClick={() => setRatingLimit(100)}>Показать ТОП-100</button>
            )}
            {ratingLimit === 100 && (
              <button onClick={() => setRatingLimit(10)}>Вернуть ТОП-10</button>
            )}

            <button className="secondary" onClick={() => {
              const index = globalSorted.findIndex(u => u.id === user.id);
              if (index !== -1) alert(`Ты на ${index + 1} месте 🔥`);
            }}>
              Найти меня в рейтинге
            </button>
          </div>

          <div style={{ marginTop: 20 }}>
            {globalSorted.map((u, i) => {
              let color = "";
              if (i === 0) color = "#FFD700";
              if (i === 1) color = "#C0C0C0";
              if (i === 2) color = "#cd7f32";

              return (
                <div
                  key={i}
                  style={{
                    opacity: u.id === user.id ? 1 : 0.75,
                    fontWeight: u.id === user.id || i < 3 ? "bold" : "normal",
                    transform: u.id === user.id ? "scale(1.05)" : "scale(1)",
                    color
                  }}
                >
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}{" "}
                  {u.nick && u.nick.trim() !== "" ? u.nick : "Без ника"} — {u.total} сек
                </div>
              );
            })}
          </div>

          {/* ====== КРОППЕР ====== */}
          {showCropper && (
            <div className="cropperOverlay" onClick={() => setShowCropper(false)}>
              <div className="cropperModal" onClick={(e) => e.stopPropagation()}>
                <AvatarEditor
                  image={selectedImage}
                  onSave={(croppedImage) => {
                    setNewAvatar(croppedImage);
                    setShowCropper(false);
                  }}
                  onCancel={() => setShowCropper(false)}
                />
              </div>
            </div>
          )}

          {/* ====== ВСПЛЫВАЮЩИЕ МЫСЛИ ====== */}
          {modalThoughts.map((t) => (
            <div key={t.id} className="modalThought" style={{ color: t.color }}>
              {t.text}
            </div>
          ))}

          {/* ====== МОДАЛКА NOPE ====== */}
          {modalNope && (
            <div className="modalNope">
              Нет Нет Нет, вы нарушаете правила. <br />
              Вернитесь обратно к ничегонеделанию!
            </div>
          )}

          {/* ====== КАПЧА (ОДИН РАЗ!) ====== */}
          {showCaptcha && (
            <div className="cropperOverlay">
              <div className="cropperModal">
                <h2>Ты всё ещё ничего не делаешь, да?</h2>

                <div style={{ marginTop: 20, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                  <button type="button" onClick={handleCaptchaSuccess}>
                    Конечно да
                  </button>
                  <button type="button" onClick={handleCaptchaFail}>
                    Нет, уже делаю
                  </button>
                </div>

                <p style={{ marginTop: 15, opacity: 0.7 }}>
                  Если не ответишь 60 секунд — таймер остановится
                </p>
              </div>
            </div>
          )}

          {/* ====== ВЫХОД (ОТДЕЛЬНО, НЕ ВНУТРИ КАПЧИ) ====== */}
          {showLogoutConfirm && (
            <div className="cropperOverlay" onClick={() => setShowLogoutConfirm(false)}>
              <div className="cropperModal" onClick={(e) => e.stopPropagation()}>
                <h2 style={{ marginTop: 0 }}>Ты точно хочешь выйти?</h2>

                <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 18, flexWrap: "wrap" }}>
                  <button type="button" onClick={confirmLogout}>Да</button>
                  <button type="button" onClick={() => setShowLogoutConfirm(false)}>Нет</button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default App;