import { useEffect, useMemo, useRef, useState } from "react";
import "./index.css";
import { supabase } from "./supabaseClient";
import AvatarEditorModal from "./AvatarEditor";

function App() {
  const [ratingLimit, setRatingLimit] = useState(10);
  const [user, setUser] = useState(null);
  const [globalSorted, setGlobalSorted] = useState([]);

  const [time, setTime] = useState(0);
  const [start, setStart] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  const [selectedImage, setSelectedImage] = useState(null);
  const [showCropper, setShowCropper] = useState(false);

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [captchaTimeoutId, setCaptchaTimeoutId] = useState(null);

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

  const [statsPeriod, setStatsPeriod] = useState("day");

  const fileInputRef = useRef(null);

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
    "Отдохни от экрана — глаза будут благодарны.",
  ];

  const colors = ["#00ffcc", "#ff00aa", "#ffaa00", "#00aaff", "#ff44ff"];

  const achievementsList = [
    { time: 300, text: "🐌 Медленный старт" },
    { time: 1200, text: "🛋 Диванный философ" },
    { time: 3000, text: "🔥 Легенда безделья" },
    { time: 9000, text: "💀 Профессиональный ничегонеделатель" },
  ];

  const formatTime = (ms) => {
    const total = Math.floor(ms / 1000);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const getWeekKey = (date = new Date()) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-W${weekNo}`;
  };

  const getPeriodKeys = () => {
    const now = new Date();
    const day = now.toISOString().slice(0, 10);
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const year = String(now.getFullYear());
    const week = getWeekKey(now);

    return { day, week, month, year };
  };

  const emptyPeriodStats = (key) => ({
    key,
    total: 0,
    sessions_count: 0,
    longest_session: 0,
    total_sessions_time: 0,
    average_session: 0,
  });

  const getPeriodStorageKey = (userId) => `nichego_period_stats_${userId}`;

  const readPeriodStats = (userId) => {
    if (!userId) return null;

    const raw = localStorage.getItem(getPeriodStorageKey(userId));
    const keys = getPeriodKeys();

    const fallback = {
      day: emptyPeriodStats(keys.day),
      week: emptyPeriodStats(keys.week),
      month: emptyPeriodStats(keys.month),
      year: emptyPeriodStats(keys.year),
    };

    if (!raw) return fallback;

    try {
      const parsed = JSON.parse(raw);

      return {
        day:
          parsed.day?.key === keys.day ? parsed.day : emptyPeriodStats(keys.day),
        week:
          parsed.week?.key === keys.week ? parsed.week : emptyPeriodStats(keys.week),
        month:
          parsed.month?.key === keys.month
            ? parsed.month
            : emptyPeriodStats(keys.month),
        year:
          parsed.year?.key === keys.year ? parsed.year : emptyPeriodStats(keys.year),
      };
    } catch {
      return fallback;
    }
  };

  const writePeriodStats = (userId, stats) => {
    if (!userId) return;
    localStorage.setItem(getPeriodStorageKey(userId), JSON.stringify(stats));
  };

  const getCurrentPeriodStats = (userId) => {
    const stats = readPeriodStats(userId);
    if (!stats) return emptyPeriodStats(getPeriodKeys()[statsPeriod]);
    return stats[statsPeriod];
  };

  const addSessionToPeriodStats = (userId, seconds) => {
    if (!userId || seconds <= 0) return;

    const stats = readPeriodStats(userId);
    if (!stats) return;

    ["day", "week", "month", "year"].forEach((period) => {
      stats[period].total += seconds;
      stats[period].sessions_count += 1;
      stats[period].longest_session = Math.max(
        stats[period].longest_session || 0,
        seconds
      );
      stats[period].total_sessions_time += seconds;
      stats[period].average_session = Math.floor(
        stats[period].total_sessions_time / stats[period].sessions_count
      );
    });

    writePeriodStats(userId, stats);
  };

  const currentPeriodStats = useMemo(() => {
    if (!user?.id) return emptyPeriodStats(getPeriodKeys()[statsPeriod]);
    return getCurrentPeriodStats(user.id);
  }, [user, statsPeriod, time]);

  const refreshPeriodStatsIfNeeded = (userId) => {
    if (!userId) return;
    const stats = readPeriodStats(userId);
    if (stats) writePeriodStats(userId, stats);
  };

  const handleAvatarSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
  };

  const showModalThought = () => {
    const randomText =
      usefulThoughts[Math.floor(Math.random() * usefulThoughts.length)];
    const id = Date.now();
    const color = colors[Math.floor(Math.random() * colors.length)];

    setModalThoughts((prev) => [...prev, { id, text: randomText, color }]);

    setTimeout(() => {
      setModalThoughts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const showNopeModal = () => {
    setModalNope(true);
    try {
      new Audio("/faah.mp3").play();
    } catch {
      // ignore audio errors
    }
    setTimeout(() => setModalNope(false), 4000);
  };

  const getOrCreateProfile = async (uid, emailValue) => {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", uid)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      const newUser = {
        id: uid,
        email: emailValue || "",
        nick: "",
        avatar: "",
        total: 0,
        sessions_count: 0,
        longest_session: 0,
        total_sessions_time: 0,
        average_session: 0,
      };

      const { error: insertError } = await supabase.from("users").insert([newUser]);
      if (insertError) throw insertError;

      return newUser;
    }

    return {
      sessions_count: 0,
      longest_session: 0,
      total_sessions_time: 0,
      average_session: 0,
      ...data,
    };
  };

  const loadProfileFromSession = async (session) => {
    if (!session?.user) {
      setUser(null);
      return;
    }

    const profile = await getOrCreateProfile(session.user.id, session.user.email);
    setUser(profile);
    setFirstSetup(!profile.nick);
    refreshPeriodStatsIfNeeded(profile.id);
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) throw error;
        if (!mounted) return;

        await loadProfileFromSession(session);
      } catch (err) {
        console.error("SESSION LOAD ERROR", err);
      }
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      try {
        await loadProfileFromSession(session);
      } catch (err) {
        console.error("AUTH LISTENER ERROR", err);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (start) {
      localStorage.setItem("timerStart", String(start));
    } else {
      localStorage.removeItem("timerStart");
    }
  }, [start]);

  useEffect(() => {
    localStorage.setItem("timerRunning", String(isRunning));
  }, [isRunning]);

  useEffect(() => {
    const savedStart = localStorage.getItem("timerStart");
    const savedRunning = localStorage.getItem("timerRunning");

    if (savedStart) {
      const parsed = Number(savedStart);
      if (!Number.isNaN(parsed)) {
        setStart(parsed);
        setTime(Date.now() - parsed);
      }
    }

    if (savedRunning) {
      setIsRunning(savedRunning === "true");
    }
  }, []);

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
    achievementsList.forEach((a) => {
      if (sec === a.time) alert(a.text);
    });
  }, [time]);

  useEffect(() => {
    const troll = setInterval(() => {
      if (!start || !isRunning) return;
      alert("⏳ Ты всё ещё ничего не делаешь. Отлично.");
    }, 4500000);

    return () => clearInterval(troll);
  }, [start, isRunning]);

  useEffect(() => {
    if (!user?.id) return;
    refreshPeriodStatsIfNeeded(user.id);

    const midnightChecker = setInterval(() => {
      refreshPeriodStatsIfNeeded(user.id);
    }, 60000);

    return () => clearInterval(midnightChecker);
  }, [user]);

  const registerWithEmail = async () => {
    setAuthError("");

    if (!email || !password) {
      setAuthError("Введите email и пароль");
      return;
    }

    setAuthLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      alert(
        "Аккаунт создан. Если в Supabase включено подтверждение почты — подтверди email и затем войди."
      );
      setIsLogin(true);
    } catch (e) {
      console.error("REGISTER ERROR", e);
      setAuthError(e?.message || "Ошибка регистрации");
    } finally {
      setAuthLoading(false);
    }
  };

  const loginWithEmail = async () => {
    setAuthError("");

    if (!email || !password) {
      setAuthError("Введите email и пароль");
      return;
    }

    setAuthLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      const session = data?.session;
      if (!session) {
        throw new Error("Не удалось получить сессию после входа");
      }

      await loadProfileFromSession(session);
    } catch (e) {
      console.error("LOGIN ERROR", e);
      setAuthError(e?.message || "Ошибка входа");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAuthSubmit = async () => {
    if (authLoading) return;
    if (isLogin) await loginWithEmail();
    else await registerWithEmail();
  };

  const startTimer = () => {
    if (start && isRunning) return;

    const newStart = start ? Date.now() - time : Date.now();
    setStart(newStart);
    setIsRunning(true);
  };

  const stopTimerAndSave = async () => {
    if (!user) return;

    const sec = Math.floor(time / 1000);
    setIsRunning(false);

    if (sec <= 0) {
      setStart(null);
      setTime(0);
      return;
    }

    const updated = {
      ...user,
      total: (user.total || 0) + sec,
      sessions_count: (user.sessions_count || 0) + 1,
      longest_session: Math.max(user.longest_session || 0, sec),
      total_sessions_time: (user.total_sessions_time || 0) + sec,
    };

    updated.average_session = Math.floor(
      updated.total_sessions_time / updated.sessions_count
    );

    setUser(updated);
    setStart(null);
    setTime(0);

    addSessionToPeriodStats(user.id, sec);

    try {
      const { error } = await supabase
        .from("users")
        .update({
          total: updated.total,
          sessions_count: updated.sessions_count,
          longest_session: updated.longest_session,
          total_sessions_time: updated.total_sessions_time,
          average_session: updated.average_session,
        })
        .eq("id", updated.id);

      if (error) throw error;

      fetchGlobalRating();
    } catch (err) {
      console.error(err);
      alert("Не удалось сохранить прогресс");
    }
  };

  const triggerCaptcha = () => {
    if (!start || !isRunning) return;

    setShowCaptcha(true);

    const timeoutId = setTimeout(async () => {
      setShowCaptcha(false);
      setIsRunning(false);
      await stopTimerAndSave();
    }, 10000);

    setCaptchaTimeoutId(timeoutId);
  };

  const handleCaptchaSuccess = () => {
    clearTimeout(captchaTimeoutId);
    setShowCaptcha(false);
    setIsRunning(true);
  };

  const handleCaptchaFail = async () => {
    clearTimeout(captchaTimeoutId);
    setShowCaptcha(false);
    setIsRunning(false);
    await stopTimerAndSave();
  };

  const saveProfile = async () => {
    const trimmedNick = newNick.trim();

    if (!trimmedNick) {
      alert("Ник не может быть пустым");
      return;
    }

    try {
      const { data: existingNick, error: nickError } = await supabase
        .from("users")
        .select("id")
        .eq("nick", trimmedNick)
        .neq("id", user.id)
        .maybeSingle();

      if (nickError) throw nickError;

      if (existingNick) {
        alert("Такой ничегошка уже есть(");
        return;
      }

      const updatedUser = {
        ...user,
        nick: trimmedNick,
        avatar: newAvatar || user.avatar || "",
      };

      const { data, error } = await supabase
        .from("users")
        .update({
          nick: updatedUser.nick,
          avatar: updatedUser.avatar,
        })
        .eq("id", updatedUser.id)
        .select()
        .single();

      if (error) throw error;

      setUser(data);
      setNewNick("");
      setNewAvatar(null);
      setEditing(false);
      setFirstSetup(false);

      alert("Профиль успешно обновлён!");
      fetchGlobalRating();
    } catch (err) {
      console.error(err);
      alert(err?.message || "Не удалось сохранить профиль");
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem("timerStart");
      localStorage.removeItem("timerRunning");
      setUser(null);
      setStart(null);
      setTime(0);
      setIsRunning(false);
      setEditing(false);
      setShowLogoutConfirm(false);
    } catch (err) {
      console.error(err);
      alert("Не удалось выйти из аккаунта");
    }
  };

  useEffect(() => {
    if (!user || !start || !isRunning) return;

    const randomTime = (15 + Math.random() * 5) * 60 * 1000;

    const interval = setTimeout(() => {
      triggerCaptcha();
    }, randomTime);

    return () => clearTimeout(interval);
  }, [user, start, isRunning]);

  const fetchGlobalRating = async () => {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("total", { ascending: false })
      .limit(ratingLimit);

    if (!error && data) {
      setGlobalSorted(data);
    }
  };

  useEffect(() => {
    fetchGlobalRating();
  }, [ratingLimit]);

  if (user && firstSetup) {
    return (
      <div className="authPage">
        <h2>Добро пожаловать, ничегошка</h2>

        <input
          placeholder="Твой ник"
          value={newNick}
          onChange={(e) => setNewNick(e.target.value)}
        />
        <br />

        <input type="file" accept="image/*" onChange={handleAvatarSelect} />
        <br />

        <button onClick={saveProfile}>Начать ничего не делать</button>

        {showCropper && (
          <div className="cropperOverlay" onClick={() => setShowCropper(false)}>
            <div className="cropperModal" onClick={(e) => e.stopPropagation()}>
              <AvatarEditorModal
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
      </div>
    );
  }

  if (!user) {
    return (
      <div className="authPage">
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
          {authLoading ? "Входим..." : isLogin ? "Войти" : "Зарегистрироваться"}
        </button>

        {authError && <div className="authError">{authError}</div>}

        <p
          className="switchAuth"
          onClick={() => {
            setAuthError("");
            setIsLogin(!isLogin);
          }}
        >
          {isLogin ? "Создать новый аккаунт" : "Уже есть аккаунт? Войти"}
        </p>
      </div>
    );
  }

  return (
    <div className="pageWrap">
      <div className="layout">
        <div className="statsCardWrap">
          <div className="statsCard">
            <h3>📊 Статистика</h3>

            <div className="statsTabs">
              <button
                className={statsPeriod === "day" ? "tabBtn activeTab" : "tabBtn"}
                onClick={() => setStatsPeriod("day")}
              >
                День
              </button>
              <button
                className={statsPeriod === "week" ? "tabBtn activeTab" : "tabBtn"}
                onClick={() => setStatsPeriod("week")}
              >
                Неделя
              </button>
              <button
                className={statsPeriod === "month" ? "tabBtn activeTab" : "tabBtn"}
                onClick={() => setStatsPeriod("month")}
              >
                Месяц
              </button>
              <button
                className={statsPeriod === "year" ? "tabBtn activeTab" : "tabBtn"}
                onClick={() => setStatsPeriod("year")}
              >
                Год
              </button>
            </div>

            <p>Всего ничегонеделанья: {user.total || 0} сек</p>
            <p>Количество попыток: {currentPeriodStats.sessions_count || 0}</p>
            <p>
              Самое длинное ничегонеделанье:{" "}
              {currentPeriodStats.longest_session || 0} сек
            </p>
            <p>Среднее ничегонеделанье: {currentPeriodStats.average_session || 0} сек</p>
            <p>За период: {currentPeriodStats.total || 0} сек</p>
          </div>
        </div>

        <div className="mainContent">
          <div className="profileHeader">
            {editing && (
              <div className="cropperOverlay" onClick={() => setEditing(false)}>
                <div className="editPanel" onClick={(e) => e.stopPropagation()}>
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
              className="avatarImg"
            />

            <div>
              <h1 style={{ margin: 0 }}>{user.nick || "Без ника"}</h1>

              <div className="profileButtons">
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

                <button type="button" onClick={() => setShowLogoutConfirm(true)}>
                  Выйти
                </button>
              </div>
            </div>
          </div>

          <h1 className="timerTitle">{formatTime(time)}</h1>

          <div className="buttons-grid">
            <button onClick={startTimer}>Начать ничего</button>
            <button onClick={stopTimerAndSave}>Я хочу заняться делами</button>
            <button onClick={showNopeModal}>Стать продуктивным</button>
            <button onClick={showModalThought}>Полезная мысль 💡</button>
          </div>

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

            <button
              className="secondary"
              onClick={() => {
                const index = globalSorted.findIndex((u) => u.id === user.id);
                if (index !== -1) alert(`Ты на ${index + 1} месте 🔥`);
              }}
            >
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
                  key={u.id || i}
                  style={{
                    opacity: u.id === user.id ? 1 : 0.75,
                    fontWeight: u.id === user.id || i < 3 ? "bold" : "normal",
                    transform: u.id === user.id ? "scale(1.05)" : "scale(1)",
                    color,
                    marginBottom: 6,
                  }}
                >
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}{" "}
                  {u.nick && u.nick.trim() !== "" ? u.nick : "Без ника"} —{" "}
                  {u.total || 0} сек
                </div>
              );
            })}
          </div>

          {showCropper && (
            <div className="cropperOverlay" onClick={() => setShowCropper(false)}>
              <div className="cropperModal" onClick={(e) => e.stopPropagation()}>
                <AvatarEditorModal
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

          {modalThoughts.map((t) => (
            <div key={t.id} className="modalThought" style={{ color: t.color }}>
              {t.text}
            </div>
          ))}

          {modalNope && (
            <div className="modalNope">
              Нет Нет Нет, вы нарушаете правила. <br />
              Вернитесь обратно к ничегонеделанию!
            </div>
          )}

          {showCaptcha && (
            <div className="cropperOverlay">
              <div className="cropperModal">
                <h2>Ты всё ещё ничего не делаешь, да?</h2>

                <div className="modalButtonsRow">
                  <button type="button" onClick={handleCaptchaSuccess}>
                    Конечно да
                  </button>
                  <button type="button" onClick={handleCaptchaFail}>
                    Нет, уже делаю
                  </button>
                </div>

                <p style={{ marginTop: 15, opacity: 0.7 }}>
                  Если не ответишь 10 секунд — таймер остановится
                </p>
              </div>
            </div>
          )}

          {showLogoutConfirm && (
            <div
              className="cropperOverlay"
              onClick={() => setShowLogoutConfirm(false)}
            >
              <div className="cropperModal" onClick={(e) => e.stopPropagation()}>
                <h2 style={{ marginTop: 0 }}>Ты точно хочешь выйти?</h2>

                <div className="modalButtonsRow">
                  <button type="button" onClick={logout}>
                    Да
                  </button>
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => setShowLogoutConfirm(false)}
                  >
                    Нет
                  </button>
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