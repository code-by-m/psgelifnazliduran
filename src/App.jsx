import { useEffect, useRef, useState } from "react";
import { ArrowLeft, LockKeyhole, ShieldAlert } from "lucide-react";
import AdminPanel from "./components/AdminPanel.jsx";
import PortfolioView from "./components/PortfolioView.jsx";
import portfolioData, { STORAGE_KEY } from "./data/portfolioData.js";
import {
  isSupabaseAdminConfigured,
  isSupabaseConfigured,
  supabase,
  supabaseAdminEmail,
} from "./lib/supabase.js";

function getRgbValue(hexColor) {
  if (!/^#[\da-f]{6}$/i.test(hexColor ?? "")) return null;
  const value = hexColor.slice(1);
  return [0, 2, 4].map((index) => Number.parseInt(value.slice(index, index + 2), 16)).join(", ");
}

function getReadableButtonText(hexColor) {
  const rgb = getRgbValue(hexColor);
  if (!rgb) return "#102023";
  const luminance = rgb.split(",").map(Number).reduce((total, channel, index) => {
    const normalized = channel / 255;
    const linear = normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
    return total + linear * [0.2126, 0.7152, 0.0722][index];
  }, 0);
  return luminance > 0.42 ? "#17201e" : "#ffffff";
}

function isAdminUser(user) {
  return user?.app_metadata?.role === "admin";
}

async function loadCloudPortfolio() {
  const { data, error } = await supabase
    .from("portfolio_content")
    .select("data")
    .eq("id", "main")
    .maybeSingle();
  if (error) throw error;
  return data?.data ?? null;
}

function normalizePortfolioData(savedData) {
  if (!savedData || typeof savedData !== "object") return portfolioData;

  const saved = savedData;
  const collectionKeys = ["expertise", "services", "articles", "testimonials", "education"];
  const savedProfile = saved.profile && typeof saved.profile === "object" ? saved.profile : {};
  const normalized = {
    ...portfolioData,
    ...saved,
    appearance: {
      ...portfolioData.appearance,
      ...saved.appearance,
    },
    profile: {
      ...portfolioData.profile,
      ...savedProfile,
      socialLinks: Array.isArray(savedProfile.socialLinks)
        ? savedProfile.socialLinks.map((link, index) => ({
          ...link,
          id: link.id || `social-${index}`,
          platform: link.platform || "",
          url: link.url || "",
        }))
        : portfolioData.profile.socialLinks,
    },
    sections: Object.fromEntries(
      Object.entries(portfolioData.sections).map(([key, defaults]) => [
        key,
        { ...defaults, ...(saved.sections?.[key] ?? {}) },
      ]),
    ),
  };
  normalized.contentRevision = Number(saved.contentRevision) || 0;

  for (const key of collectionKeys) {
    const savedItems = Array.isArray(saved[key]) ? saved[key] : portfolioData[key];
    normalized[key] = savedItems.map((item, index) => ({
      ...item,
      id: item.id || `${key}-${index}`,
      active: item.active !== false,
    }));
  }

  if (normalized.contentRevision < portfolioData.contentRevision) {
    normalized.contentRevision = portfolioData.contentRevision;
    normalized.profile = {
      ...normalized.profile,
      name: portfolioData.profile.name,
      title: portfolioData.profile.title,
      bio: portfolioData.profile.bio,
      approach: portfolioData.profile.approach,
      interests: portfolioData.profile.interests,
      location: portfolioData.profile.location,
      email: portfolioData.profile.email,
      phone: portfolioData.profile.phone,
      whatsapp: "",
      bookingUrl: "",
      availability: portfolioData.profile.availability,
    };
    normalized.sections = {
      ...normalized.sections,
      header: {
        ...normalized.sections.header,
        navExpertise: portfolioData.sections.header.navExpertise,
        navEducation: portfolioData.sections.header.navEducation,
      },
      hero: {
        ...normalized.sections.hero,
        headlineLead: portfolioData.sections.hero.headlineLead,
        headlineMuted: portfolioData.sections.hero.headlineMuted,
        headlineEnd: portfolioData.sections.hero.headlineEnd,
        meta: portfolioData.sections.hero.meta,
        primaryCta: portfolioData.sections.hero.primaryCta,
        secondaryCta: portfolioData.sections.hero.secondaryCta,
        visualCaption: portfolioData.sections.hero.visualCaption,
      },
      about: { ...normalized.sections.about, ...portfolioData.sections.about },
      expertise: { ...normalized.sections.expertise, ...portfolioData.sections.expertise },
      services: { ...normalized.sections.services, enabled: false },
      articles: { ...normalized.sections.articles, enabled: false },
      testimonials: { ...normalized.sections.testimonials, enabled: false },
      education: { ...normalized.sections.education, ...portfolioData.sections.education },
      contact: { ...normalized.sections.contact, ...portfolioData.sections.contact },
      footer: { ...normalized.sections.footer, ...portfolioData.sections.footer },
    };
    for (const key of collectionKeys) {
      normalized[key] = portfolioData[key];
    }
  }

  return normalized;
}

function readPortfolioData() {
  try {
    const savedData = window.localStorage.getItem(STORAGE_KEY);
    return savedData ? normalizePortfolioData(JSON.parse(savedData)) : portfolioData;
  } catch (error) {
    console.error("Portföy verisi okunamadı:", error);
    return portfolioData;
  }
}

export default function App() {
  const [data, setData] = useState(readPortfolioData);
  const [view, setView] = useState(() => (
    window.location.pathname.replace(/\/+$/, "") === "/admin" ? "login" : "portfolio"
  ));
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [storageError, setStorageError] = useState("");
  const [syncError, setSyncError] = useState("");
  const [syncStatus, setSyncStatus] = useState(isSupabaseConfigured ? "loading" : "local");
  const [cloudReady, setCloudReady] = useState(!isSupabaseConfigured);
  const [authUser, setAuthUser] = useState(null);
  const saveQueue = useRef(Promise.resolve());
  const saveSequence = useRef(0);

  useEffect(() => {
    function syncViewWithLocation() {
      const isAdminPath = window.location.pathname.replace(/\/+$/, "") === "/admin";
      setView(isAdminPath ? (isAdminUser(authUser) ? "admin" : "login") : "portfolio");
    }

    window.addEventListener("popstate", syncViewWithLocation);
    return () => window.removeEventListener("popstate", syncViewWithLocation);
  }, [authUser]);

  useEffect(() => {
    if (!supabase) {
      setCloudReady(true);
      setSyncStatus("local");
      return undefined;
    }

    let active = true;
    async function initializeCloud() {
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        const user = sessionData.session?.user;
        if (active && isAdminUser(user)) {
          setAuthUser(user);
          if (window.location.pathname.replace(/\/+$/, "") === "/admin") setView("admin");
        }

        const cloudData = await loadCloudPortfolio();
        if (!active) return;
        if (cloudData) setData(normalizePortfolioData(cloudData));
        setSyncStatus(cloudData ? "synced" : "ready");
        setSyncError("");
      } catch (error) {
        console.error("Bulut portföy verisi yüklenemedi:", error);
        if (active) {
          setSyncStatus("error");
          setSyncError("Bulut içeriği yüklenemedi. Bu cihazdaki kayıt gösteriliyor.");
        }
      } finally {
        if (active) setCloudReady(true);
      }
    }

    initializeCloud();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setStorageError("");
    } catch (error) {
      console.error("Portföy verisi kaydedilemedi:", error);
      setStorageError(
        "Değişiklikler tarayıcıya kaydedilemedi. Depolama alanınızı kontrol edin.",
      );
    }
  }, [data]);

  useEffect(() => {
    if (!supabase || !cloudReady || !isAdminUser(authUser)) return undefined;

    const sequence = ++saveSequence.current;
    const timer = window.setTimeout(() => {
      setSyncStatus("syncing");
      setSyncError("");
      saveQueue.current = saveQueue.current
        .catch(() => {})
        .then(async () => {
          const { error } = await supabase
            .from("portfolio_content")
            .upsert({ id: "main", data, updated_at: new Date().toISOString() });
          if (error) throw error;
          if (sequence === saveSequence.current) setSyncStatus("synced");
        })
        .catch((error) => {
          console.error("Bulut portföy verisi kaydedilemedi:", error);
          if (sequence === saveSequence.current) {
            setSyncStatus("error");
            setSyncError("Değişiklikler buluta kaydedilemedi. Bağlantı ve Supabase izinlerini kontrol edin.");
          }
        });
    }, 450);

    return () => window.clearTimeout(timer);
  }, [data, cloudReady, authUser]);

  useEffect(() => {
    document.title = `${data.profile.name} — ${data.profile.title}`;
  }, [data.profile.name, data.profile.title]);

  useEffect(() => {
    const favicon = document.querySelector('link[rel="icon"]');
    if (!favicon) return;

    try {
      const faviconSource = data.profile.favicon?.trim() || "/brand/Icon.png";
      if (/^data:image\/(?:png|jpeg|webp|gif|x-icon|vnd\.microsoft\.icon);base64,/i.test(faviconSource)) {
        favicon.href = faviconSource;
        return;
      }
      const iconUrl = new URL(faviconSource, window.location.href);
      if (iconUrl.protocol !== "http:" && iconUrl.protocol !== "https:") {
        throw new Error("Site simgesi geçerli bir görsel dosyası olmalıdır.");
      }
      favicon.href = iconUrl.href;
    } catch (error) {
      console.error("Site simgesi adresi geçersiz:", error);
      favicon.href = new URL("/brand/Icon.png", window.location.href).href;
    }
  }, [data.profile.favicon]);

  useEffect(() => {
    const root = document.documentElement;
    const theme = data.appearance.theme === "dark" ? "dark" : "light";
    root.dataset.theme = theme;
    const palette = ["sage", "ocean", "sand", "slate", "rose", "custom"].includes(data.appearance.palette)
      ? data.appearance.palette
      : "sage";
    root.dataset.palette = palette;
    if (palette === "custom") {
      const brandRgb = getRgbValue(data.appearance.customBrand);
      const accentRgb = getRgbValue(data.appearance.customAccent);
      if (brandRgb && accentRgb) {
        root.style.setProperty("--brand", data.appearance.customBrand);
        root.style.setProperty("--brand-rgb", brandRgb);
        root.style.setProperty("--accent", data.appearance.customAccent);
        root.style.setProperty("--accent-rgb", accentRgb);
        root.style.setProperty("--button-text", getReadableButtonText(data.appearance.customAccent));
      }
    } else {
      ["--brand", "--brand-rgb", "--accent", "--accent-rgb", "--button-text"]
        .forEach((property) => root.style.removeProperty(property));
    }
    document.querySelector('meta[name="theme-color"]')?.setAttribute(
      "content",
      theme === "light" ? "#f6f7f2" : "#17201e",
    );
  }, [data.appearance]);

  async function signIn(event) {
    event.preventDefault();
    if (!isSupabaseAdminConfigured) {
      setLoginError("Yönetici girişi için Supabase bağlantısı ve yönetici hesabı e-postası ayarlanmalıdır.");
      return;
    }
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: supabaseAdminEmail,
        password,
      });
      if (error) throw error;
      if (!isAdminUser(authData.user)) {
        await supabase.auth.signOut();
        setLoginError("Bu hesap yönetici yetkisine sahip değil.");
        return;
      }

      setAuthUser(authData.user);
      try {
        const cloudData = await loadCloudPortfolio();
        if (cloudData) setData(normalizePortfolioData(cloudData));
        setSyncError("");
        setSyncStatus(cloudData ? "synced" : "ready");
      } catch (error) {
        console.error("Bulut portföy verisi giriş sırasında yüklenemedi:", error);
        setSyncStatus("error");
        setSyncError("Bulut içeriği yüklenemedi. Bu cihazdaki kayıtla devam ediliyor.");
      }
    } catch (error) {
      console.error("Yönetici girişi başarısız oldu:", error);
      setLoginError(error.message || "Giriş başarısız oldu. E-posta ve parolanızı kontrol edin.");
      return;
    }
    setLoginError("");
    setPassword("");
    setView("admin");
  }

  function openAdmin() {
    if (window.location.pathname.replace(/\/+$/, "") !== "/admin") {
      window.history.pushState(null, "", "/admin");
    }
    setView(isAdminUser(authUser) ? "admin" : "login");
  }

  function leaveAdmin() {
    window.history.replaceState(null, "", "/");
    setView("portfolio");
  }

  if (view === "admin") {
    return (
      <>
        <AdminPanel
          data={data}
          onChange={setData}
          onBack={leaveAdmin}
          syncStatus={syncStatus}
          onToggleTheme={() => setData((current) => ({
            ...current,
            appearance: {
              ...current.appearance,
              theme: current.appearance.theme === "light" ? "dark" : "light",
            },
          }))}
        />
        {storageError && <div className="storage-alert">{storageError}</div>}
        {syncError && <div className="storage-alert">{syncError}</div>}
      </>
    );
  }

  if (view === "login") {
    return (
      <main className="login-screen">
        <button className="login-back" onClick={leaveAdmin}>
          <ArrowLeft size={16} /> Portföye dön
        </button>
        <form className="login-card" onSubmit={signIn}>
          <div className="login-icon"><LockKeyhole size={21} /></div>
          <p className="eyebrow">YÖNETİCİ ALANI</p>
          <h1>Tekrar hoş geldin.</h1>
          <p className="login-copy">Portföyünü düzenlemek için yönetici hesabınla giriş yap.</p>
          {!isSupabaseAdminConfigured && (
            <p className="form-error"><ShieldAlert size={14} /> Supabase bağlantı ayarları yapılmadı; yönetici girişi kullanılamıyor.</p>
          )}
          <label className="field-label" htmlFor="admin-password">Parola</label>
          <input
            autoFocus
            id="admin-password"
            className="text-input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Yönetici parolanız"
            required
          />
          {loginError && <p className="form-error">{loginError}</p>}
          <button className="button button-primary login-submit" type="submit" disabled={!isSupabaseAdminConfigured}>
            Yönetim paneline gir <ArrowLeft className="arrow-forward" size={16} />
          </button>
          <div className="security-note"><ShieldAlert size={14} /> Yönetici hesabı Supabase Auth üzerinden doğrulanır.</div>
        </form>
      </main>
    );
  }

  return (
    <>
      <PortfolioView
        data={data}
        onAdmin={openAdmin}
        onToggleTheme={() => setData((current) => ({
          ...current,
          appearance: {
            ...current.appearance,
            theme: current.appearance.theme === "light" ? "dark" : "light",
          },
        }))}
      />
      {storageError && <div className="storage-alert">{storageError}</div>}
      {syncError && <div className="storage-alert">{syncError}</div>}
    </>
  );
}
