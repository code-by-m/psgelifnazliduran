import { useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  Download,
  Eye,
  EyeOff,
  FileText,
  Image,
  Moon,
  Palette,
  Pencil,
  Plus,
  Save,
  Sun,
  Trash2,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import PortfolioView from "./PortfolioView.jsx";
import { isSupabaseConfigured, uploadPortfolioImage } from "../lib/supabase.js";

const sectionTabs = [
  { id: "hero", label: "Karşılama" },
  { id: "about", label: "Hakkımda" },
  { id: "expertise", label: "İlgi alanları ve beceriler" },
  { id: "services", label: "Seans türleri" },
  { id: "articles", label: "Yazılar & blog" },
  { id: "testimonials", label: "Danışan yorumları" },
  { id: "education", label: "Eğitim & deneyim" },
  { id: "contact", label: "İletişim" },
];

const collectionDefinitions = {
  expertise: {
    title: "İlgi alanları ve beceriler",
    fields: [
      { key: "title", label: "Alan adı" },
      { key: "description", label: "Kısa açıklama", type: "textarea" },
    ],
    summary: (item) => item.title,
  },
  services: {
    title: "Seans türleri",
    fields: [
      { key: "title", label: "Seans türü" },
      { key: "description", label: "Açıklama", type: "textarea" },
      { key: "format", label: "Biçim (online / yüz yüze)" },
      { key: "duration", label: "Süre" },
      { key: "conditions", label: "Seans koşulları", type: "textarea" },
    ],
    summary: (item) => item.title,
  },
  articles: {
    title: "Yazılar ve içerikler",
    fields: [
      { key: "title", label: "Yazı başlığı" },
      { key: "description", label: "Kısa açıklama", type: "textarea" },
      { key: "category", label: "Kategori" },
      { key: "readTime", label: "Okuma süresi" },
      { key: "url", label: "Yazı bağlantısı", type: "url" },
    ],
    summary: (item) => item.title,
  },
  testimonials: {
    title: "Danışan yorumları",
    fields: [
      { key: "quote", label: "Yorum (açık rıza alınmış, anonimleştirilmiş içerik)", type: "textarea" },
      { key: "anonymousLabel", label: "Görünen anonim etiket" },
    ],
    summary: (item) => item.anonymousLabel || "Anonim danışan yorumu",
  },
  education: {
    title: "Eğitim ve deneyim kayıtları",
    fields: [
      { key: "program", label: "Eğitim / görev" },
      { key: "institution", label: "Kurum / kuruluş" },
      { key: "period", label: "Tarih aralığı" },
      { key: "location", label: "Konum" },
      { key: "description", label: "Açıklama", type: "textarea" },
    ],
    summary: (item) => `${item.program} · ${item.institution}`,
  },
};

const sectionFields = {
  hero: [
    { key: "headlineLead", label: "Başlık — ilk satır" },
    { key: "headlineMuted", label: "Başlık — vurgulu satır" },
    { key: "headlineEnd", label: "Başlık — son satır" },
    { key: "meta", label: "Başlık altındaki kısa metin" },
    { key: "primaryCta", label: "Randevu düğmesi metni" },
    { key: "secondaryCta", label: "İkincil düğme metni" },
    { key: "visualCaption", label: "Profil fotoğrafı altındaki kısa ifade" },
    { key: "visualEnabled", label: "Profil görselini göster", type: "checkbox" },
  ],
  about: [
    { key: "title", label: "Bölüm başlığı" },
    { key: "kicker", label: "Küçük başlık" },
    { key: "quote", label: "Vurgu metni", type: "textarea" },
    { key: "detail", label: "Ek hakkımda metni", type: "textarea" },
  ],
  expertise: [
    { key: "title", label: "Bölüm başlığı" },
    { key: "kicker", label: "Küçük başlık" },
    { key: "intro", label: "Tanıtım metni", type: "textarea" },
  ],
  services: [
    { key: "title", label: "Bölüm başlığı" },
    { key: "kicker", label: "Küçük başlık" },
    { key: "intro", label: "Tanıtım metni", type: "textarea" },
  ],
  articles: [
    { key: "title", label: "Bölüm başlığı" },
    { key: "kicker", label: "Küçük başlık" },
    { key: "intro", label: "Tanıtım metni", type: "textarea" },
  ],
  testimonials: [
    { key: "title", label: "Bölüm başlığı" },
    { key: "kicker", label: "Küçük başlık" },
    { key: "intro", label: "Gizlilik ve izin bilgilendirmesi", type: "textarea" },
  ],
  education: [
    { key: "title", label: "Bölüm başlığı" },
    { key: "kicker", label: "Küçük başlık" },
  ],
  contact: [
    { key: "kicker", label: "Küçük başlık" },
    { key: "titleLead", label: "Başlık — ilk satır" },
    { key: "titleEnd", label: "Başlık — ikinci satır" },
    { key: "description", label: "Açıklama", type: "textarea" },
    { key: "emailCta", label: "E-posta düğme metni" },
    { key: "phoneCta", label: "Telefon düğme metni" },
    { key: "bookingCta", label: "Randevu düğme metni" },
  ],
};

const profileFields = [
  { key: "name", label: "Ad soyad" },
  { key: "title", label: "Meslek unvanı" },
  { key: "favicon", label: "Site simgesi", type: "image-file", accept: "image/png,image/jpeg,image/webp,image/gif,image/x-icon,.ico" },
  { key: "photo", label: "Profil fotoğrafı", type: "image-file", accept: "image/png,image/jpeg,image/webp,image/gif" },
  { key: "interests", label: "Mesleki ilgi alanları ve beceriler", type: "textarea" },
  { key: "email", label: "E-posta", type: "email" },
  { key: "phone", label: "Telefon", type: "tel" },
  { key: "whatsapp", label: "WhatsApp numarası (ülke koduyla) veya bağlantısı" },
  { key: "bookingUrl", label: "Randevu sistemi bağlantısı", type: "url" },
  { key: "location", label: "Konum" },
  { key: "availability", label: "Durum etiketi" },
  { key: "bio", label: "Kısa biyografi", type: "textarea" },
  { key: "approach", label: "Terapi yaklaşımı / ekoller", type: "textarea", placeholder: "Örn. BDT (CBT), Çözüm Odaklı Terapi. Yalnızca yetkin olduğunuz yaklaşımları belirtin." },
];

const socialPlatforms = [
  { id: "linkedin", label: "LinkedIn" },
  { id: "instagram", label: "Instagram" },
  { id: "medium", label: "Medium" },
  { id: "website", label: "Kişisel web sitesi" },
];

const themePalettes = [
  { id: "sage", name: "Adaçayı", brand: "#718b78", accent: "#dce8d9" },
  { id: "ocean", name: "Yumuşak mavi", brand: "#66899a", accent: "#dceaf0" },
  { id: "sand", name: "Kum", brand: "#a88762", accent: "#f0e2cf" },
  { id: "slate", name: "Dingin gri", brand: "#687b7b", accent: "#dce5e2" },
  { id: "rose", name: "Gül kurusu", brand: "#a77a7b", accent: "#f0dfdd" },
  { id: "custom", name: "Özel renkler", brand: "#718b78", accent: "#dce8d9" },
];

const MAX_IMAGE_FILE_SIZE = 1.5 * 1024 * 1024;
const allowedImageTypes = new Set(["image/png", "image/jpeg", "image/webp", "image/gif", "image/x-icon", "image/vnd.microsoft.icon"]);

function readImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Dosya verisi okunamadı."));
    };
    reader.onerror = () => reject(reader.error ?? new Error("Dosya okunamadı."));
    reader.readAsDataURL(file);
  });
}

function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `item-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function AdminCollection({ collectionKey, items, onChange, onNotice }) {
  const definition = collectionDefinitions[collectionKey];
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(null);

  function beginCreate() {
    setEditingId("new");
    setDraft({
      id: "",
      active: true,
      ...Object.fromEntries(definition.fields.map(({ key, type }) => [key, type === "lines" || type === "csv" ? [] : ""])),
    });
  }

  function beginEdit(item) {
    setEditingId(item.id);
    setDraft({
      ...item,
      ...Object.fromEntries(
        definition.fields
          .filter(({ type }) => type === "lines" || type === "csv")
          .map(({ key }) => [key, Array.isArray(item[key]) ? item[key] : []]),
      ),
    });
  }

  function setField(key, value) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function saveItem(event) {
    event.preventDefault();
    const savedItem = {
      ...draft,
      id: editingId === "new" ? createId() : draft.id,
      active: draft.active !== false,
    };
    const nextItems = editingId === "new"
      ? [...items, savedItem]
      : items.map((item) => item.id === editingId ? savedItem : item);
    onChange(nextItems);
    setEditingId(null);
    setDraft(null);
    onNotice(editingId === "new" ? "Yeni kayıt eklendi." : "Kayıt güncellendi.");
  }

  function toggleItem(item) {
    onChange(items.map((entry) => entry.id === item.id ? { ...entry, active: entry.active === false } : entry));
    onNotice(item.active === false ? "Kayıt sitede gösterilecek." : "Kayıt sitede gizlendi.");
  }

  function removeItem(item) {
    if (!window.confirm(`“${definition.summary(item)}” kaydını silmek istiyor musunuz?`)) return;
    onChange(items.filter((entry) => entry.id !== item.id));
    if (editingId === item.id) {
      setEditingId(null);
      setDraft(null);
    }
    onNotice("Kayıt silindi.");
  }

  return (
    <div className="collection-layout">
      <section className="collection-list">
        <div className="collection-list-heading"><span>{items.length} kayıt</span><button className="button button-primary" onClick={beginCreate}><Plus size={15} /> Yeni ekle</button></div>
        {items.map((item) => (
          <article className={`collection-row ${item.active === false ? "is-inactive" : ""} ${editingId === item.id ? "row-active" : ""}`} key={item.id}>
            <div className="collection-item-copy"><strong>{definition.summary(item) || "İsimsiz kayıt"}</strong><span>{item.active === false ? "Pasif · sitede görünmüyor" : "Aktif · sitede görünüyor"}</span></div>
            <div className="collection-item-actions">
              <button className="icon-button" onClick={() => toggleItem(item)} title={item.active === false ? "Etkinleştir" : "Devre dışı bırak"} aria-label={item.active === false ? "Etkinleştir" : "Devre dışı bırak"}>{item.active === false ? <EyeOff size={15} /> : <Eye size={15} />}</button>
              <button className="icon-button" onClick={() => beginEdit(item)} title="Düzenle" aria-label="Düzenle"><Pencil size={15} /></button>
              <button className="icon-button danger-icon" onClick={() => removeItem(item)} title="Sil" aria-label="Sil"><Trash2 size={15} /></button>
            </div>
          </article>
        ))}
        {items.length === 0 && <div className="admin-empty">Bu bölümde henüz kayıt yok. Yeni bir kayıt ekleyin.</div>}
      </section>

      {draft && (
        <form className="editor-card" onSubmit={saveItem}>
          <div className="editor-heading"><div><p className="eyebrow">{editingId === "new" ? "YENİ KAYIT" : "KAYDI DÜZENLE"}</p><h2>{editingId === "new" ? "Yeni ekle" : "İçeriği düzenle"}</h2></div><button type="button" className="icon-button" onClick={() => { setEditingId(null); setDraft(null); }} aria-label="Formu kapat"><X size={17} /></button></div>
          {definition.fields.map((field) => (
            <Field key={field.key} label={field.label}>
              {field.type === "textarea" || field.type === "lines" ? (
                <textarea className="text-input text-area" value={field.type === "lines" ? (draft[field.key] ?? []).join("\n") : draft[field.key] ?? ""} onChange={(event) => setField(field.key, field.type === "lines" ? event.target.value.split("\n") : event.target.value)} />
              ) : (
                <input className="text-input" type={field.type === "url" ? "url" : "text"} value={field.type === "csv" ? (draft[field.key] ?? []).join(", ") : draft[field.key] ?? ""} onChange={(event) => setField(field.key, field.type === "csv" ? event.target.value.split(",").map((value) => value.trim()).filter(Boolean) : event.target.value)} />
              )}
            </Field>
          ))}
          <label className="checkbox-field"><input type="checkbox" checked={draft.active !== false} onChange={(event) => setField("active", event.target.checked)} /><span>Bu kaydı sitede göster</span></label>
          <div className="editor-actions"><button type="button" className="button button-quiet" onClick={() => { setEditingId(null); setDraft(null); }}>Vazgeç</button><button className="button button-primary" type="submit"><Save size={15} /> Kaydet</button></div>
        </form>
      )}
    </div>
  );
}

export default function AdminPanel({ data, onChange, onBack, onToggleTheme, syncStatus }) {
  const [activeTab, setActiveTab] = useState("profile");
  const [profileDraft, setProfileDraft] = useState(data.profile);
  const [notice, setNotice] = useState("");
  const [exportOpen, setExportOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const exportRef = useRef(null);

  const activeSection = sectionTabs.find((section) => section.id === activeTab);
  const collectionDefinition = collectionDefinitions[activeTab];
  const activeCount = collectionDefinition
    ? (data[activeTab] ?? []).filter((item) => item.active !== false).length
    : null;

  function showNotice(message) {
    setNotice(message);
  }

  function updateCollection(key, items) {
    onChange({ ...data, [key]: items });
  }

  function updateSection(key, field, value) {
    onChange({
      ...data,
      sections: {
        ...data.sections,
        [key]: { ...data.sections[key], [field]: value },
      },
    });
  }

  function updateAppearance(field, value) {
    onChange({
      ...data,
      appearance: { ...data.appearance, [field]: value },
    });
    showNotice(field === "theme" ? "Tema tercihi kaydedildi." : "Renk tercihi kaydedildi.");
  }

  function toggleSection(key) {
    const enabled = data.sections[key].enabled !== false;
    updateSection(key, "enabled", !enabled);
    showNotice(enabled ? "Bölüm portföyde gizlendi." : "Bölüm portföyde etkinleştirildi.");
  }

  function saveProfile(event) {
    event.preventDefault();
    const profile = {
      ...profileDraft,
      socialLinks: (profileDraft.socialLinks ?? []).filter(
        (link) => link.platform && link.url.trim(),
      ),
    };
    setProfileDraft(profile);
    onChange({ ...data, profile });
    showNotice("Profil bilgileri kaydedildi.");
  }

  async function handleProfileImageChange(event, field) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;

    const isIcoFile = field.key === "favicon" && /\.ico$/i.test(file.name);
    if (!allowedImageTypes.has(file.type) && !isIcoFile) {
      showNotice("Lütfen PNG, JPG, WebP veya GIF biçiminde bir görsel seçin. Site simgesi için ICO da seçilebilir.");
      return;
    }
    if (file.size > MAX_IMAGE_FILE_SIZE) {
      showNotice("Görsel dosyası 1,5 MB'tan küçük olmalıdır.");
      return;
    }

    try {
      const imageSource = isSupabaseConfigured
        ? await uploadPortfolioImage(file)
        : await readImageFile(file);
      setProfileDraft((current) => ({ ...current, [field.key]: imageSource }));
      showNotice(`${field.label} seçildi. Uygulamak için profil değişikliklerini kaydedin.`);
    } catch (error) {
      console.error(`${field.label} dosyası okunamadı:`, error);
      showNotice(`${field.label} yüklenemedi: ${error.message || "Lütfen tekrar deneyin."}`);
    }
  }

  function removeProfileImage(field) {
    setProfileDraft((current) => ({ ...current, [field.key]: "" }));
    showNotice(`${field.label} kaldırıldı. Değişikliği uygulamak için profili kaydedin.`);
  }

  async function copyExport() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch (error) {
      console.error("JSON panoya kopyalanamadı:", error);
      exportRef.current?.select();
      showNotice("Otomatik kopyalama başarısız. JSON'u seçip Ctrl+C ile kopyalayın.");
    }
  }

  function navigate(tab) {
    setActiveTab(tab);
    setNotice("");
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <a className="brand admin-brand" href="#" onClick={(event) => { event.preventDefault(); onBack(); }}>
          <span className="brand-mark"><UserRound size={15} /></span><span>{data.profile.name}</span>
        </a>
        <div className="sidebar-label">GENEL</div>
        <button className={`sidebar-link ${activeTab === "profile" ? "active" : ""}`} onClick={() => navigate("profile")}><UserRound size={16} /> Profil bilgileri</button>
        <button className={`sidebar-link ${activeTab === "appearance" ? "active" : ""}`} onClick={() => navigate("appearance")}><Palette size={16} /> Tema & renkler</button>
        <div className="sidebar-label section-list-label">PORTFÖY İÇERİĞİ</div>
        <nav className="admin-section-nav" aria-label="Düzenlenecek site bölümleri">
          {sectionTabs.map((section) => {
            const enabled = data.sections[section.id]?.enabled !== false;
            const count = collectionDefinitions[section.id]
              ? data[section.id].filter((item) => item.active !== false).length
              : null;
            return (
              <button className={`sidebar-link ${activeTab === section.id ? "active" : ""}`} key={section.id} onClick={() => navigate(section.id)}>
                <FileText size={15} /><span className="sidebar-link-label">{section.label}</span>
                {count !== null && <span className="sidebar-count">{count}</span>}
                <span className={`sidebar-status ${enabled ? "" : "off"}`} title={enabled ? "Bölüm aktif" : "Bölüm pasif"} />
              </button>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="admin-user"><div className="admin-avatar">{data.profile.name.slice(0, 1).toUpperCase()}</div><div><strong>{data.profile.name}</strong><span>Değişiklikler otomatik kaydedilir</span></div></div>
          <button className="sidebar-back" onClick={onBack}><ArrowLeft size={15} /> Portföye dön</button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div className="admin-breadcrumb"><span>Yönetim</span><span>/</span><strong>{activeTab === "profile" ? "Profil bilgileri" : activeTab === "appearance" ? "Tema & renkler" : activeSection?.label}</strong></div>
          <div className="admin-top-actions">
            <span className="saved-indicator"><span className="status-dot" />{
              syncStatus === "syncing" ? "Buluta kaydediliyor"
                : syncStatus === "synced" ? "Buluta kaydedildi"
                  : syncStatus === "error" ? "Bulut kaydı başarısız"
                    : syncStatus === "loading" ? "Bulut verisi yükleniyor"
                      : syncStatus === "ready" ? "Bulut bağlantısı hazır"
                        : "Bu tarayıcıya kaydediliyor"
            }</span>
            <button className="icon-button theme-toggle" onClick={onToggleTheme} aria-label={data.appearance.theme === "light" ? "Koyu temaya geç" : "Aydınlık temaya geç"} title={data.appearance.theme === "light" ? "Koyu tema" : "Aydınlık tema"}>{data.appearance.theme === "light" ? <Moon size={16} /> : <Sun size={16} />}</button>
            <button className="button button-outline export-button" onClick={() => setExportOpen((open) => !open)}><Download size={15} /> JSON dışa aktar</button>
          </div>
        </header>

        {exportOpen && (
          <section className="export-panel">
            <div className="export-heading"><div><strong>Portföy verisini dışa aktar</strong><p>Tüm bölümlerin ve içeriklerin JSON yedeğini alın.</p></div><button className="icon-button" onClick={() => setExportOpen(false)} aria-label="Kapat"><X size={17} /></button></div>
            <textarea ref={exportRef} className="export-textarea" readOnly value={JSON.stringify(data, null, 2)} aria-label="Dışa aktarılan JSON" />
            <button className="button button-primary copy-button" onClick={copyExport}>{copied ? <Check size={15} /> : <Download size={15} />}{copied ? "Kopyalandı" : "JSON'u kopyala"}</button>
          </section>
        )}

        <div className="admin-content">
          <div className="admin-page-heading">
            <div><p className="eyebrow">KLİNİK PORTFÖYÜNÜ YÖNET</p><h1>{activeTab === "profile" ? "Profil bilgileri" : activeTab === "appearance" ? "Tema & renkler" : activeSection?.label}</h1><p>{activeTab === "profile" ? "Mesleki unvan, profil fotoğrafı, iletişim ve biyografi bilgilerini düzenle." : activeTab === "appearance" ? "Sitenin görünüm modunu ve sakin renk paletini belirle." : collectionDefinition ? `${collectionDefinition.title} ekle, düzenle, sil veya yayından kaldır.` : "Bölüm içeriğini düzenle ve sitede görünürlüğünü yönet."}</p></div>
            {activeSection && <button className={`button ${data.sections[activeTab].enabled === false ? "button-primary" : "button-outline"}`} onClick={() => toggleSection(activeTab)}>{data.sections[activeTab].enabled === false ? <Eye size={15} /> : <EyeOff size={15} />}{data.sections[activeTab].enabled === false ? "Bölümü etkinleştir" : "Bölümü gizle"}</button>}
          </div>

          {notice && <div className="admin-notice"><Check size={15} /> {notice}<button onClick={() => setNotice("")} aria-label="Bildirimi kapat"><X size={14} /></button></div>}

          <div className={activeSection ? "admin-workspace" : undefined}>
            <div className={activeSection ? "admin-editor-pane" : undefined}>
          {activeTab === "profile" ? (
            <form className="profile-editor" onSubmit={saveProfile}>
              <div className="profile-editor-title"><div className="profile-avatar-large">{profileDraft.photo ? <img src={profileDraft.photo} alt="" /> : profileDraft.name.slice(0, 1).toUpperCase()}</div><div><h2>Mesleki profil</h2><p>Unvan, biyografi, fotoğraf ve iletişim bilgileri ziyaretçi sayfasında kullanılır. Yalnızca doğrulanmış mesleki bilgileri paylaşın.</p></div></div>
              <div className="profile-form-grid">
                {profileFields.map((field) => (
                  field.type === "image-file" ? (
                    <div className="profile-image-field" key={field.key}>
                      <label className="field-label">
                        {field.label}
                        <span className="image-file-control">
                          <Upload size={15} />
                          <span>Bilgisayardan dosya seç</span>
                          <input
                            type="file"
                            accept={field.accept}
                            aria-label={field.label}
                            onChange={(event) => handleProfileImageChange(event, field)}
                          />
                        </span>
                        <span className="image-file-help">PNG, JPG, WebP veya GIF · En fazla 1,5 MB{field.key === "favicon" ? " · ICO da desteklenir" : ""}</span>
                      </label>
                      {profileDraft[field.key] && (
                        <div className="profile-image-preview">
                          <img
                            className={field.key === "favicon" ? "favicon-file-preview" : ""}
                            src={profileDraft[field.key]}
                            alt={`${field.label} önizlemesi`}
                          />
                          <button
                            type="button"
                            className="button button-outline image-remove-button"
                            onClick={() => removeProfileImage(field)}
                          >
                            <Trash2 size={14} /> Görseli kaldır
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Field key={field.key} label={field.label}>
                      {field.type === "textarea" ? (
                        <textarea className="text-input text-area profile-bio" placeholder={field.placeholder} value={profileDraft[field.key] ?? ""} onChange={(event) => setProfileDraft({ ...profileDraft, [field.key]: event.target.value })} />
                      ) : (
                        <input className="text-input" type={field.type ?? "text"} placeholder={field.placeholder} value={profileDraft[field.key] ?? ""} onChange={(event) => setProfileDraft({ ...profileDraft, [field.key]: event.target.value })} />
                      )}
                    </Field>
                  )
                ))}
                <div className="social-editor">
                  <div className="social-editor-heading">
                    <span className="field-label">Sosyal medya bağlantıları</span>
                    <button
                      type="button"
                      className="button button-outline social-add-button"
                      onClick={() => setProfileDraft({
                        ...profileDraft,
                        socialLinks: [...(profileDraft.socialLinks ?? []), {
                          id: createId(),
                          platform: "",
                          url: "",
                        }],
                      })}
                    >
                      <Plus size={14} /> Sosyal medya ekle
                    </button>
                  </div>
                  {(profileDraft.socialLinks ?? []).map((link, index) => (
                    <div className="social-editor-row" key={link.id}>
                      <select
                        className="text-input"
                        aria-label={`Sosyal medya platformu ${index + 1}`}
                        value={link.platform}
                        onChange={(event) => setProfileDraft({
                          ...profileDraft,
                          socialLinks: profileDraft.socialLinks.map((item) => item.id === link.id
                            ? { ...item, platform: event.target.value }
                            : item),
                        })}
                      >
                        <option value="">Platform seçin</option>
                        {socialPlatforms.map((platform) => (
                          <option key={platform.id} value={platform.id}>{platform.label}</option>
                        ))}
                      </select>
                      <input
                        className="text-input"
                        type="url"
                        aria-label={`${socialPlatforms.find((platform) => platform.id === link.platform)?.label ?? "Sosyal medya"} URL`}
                        placeholder="https://..."
                        value={link.url}
                        onChange={(event) => setProfileDraft({
                          ...profileDraft,
                          socialLinks: profileDraft.socialLinks.map((item) => item.id === link.id
                            ? { ...item, url: event.target.value }
                            : item),
                        })}
                      />
                      <button
                        type="button"
                        className="icon-button danger-icon social-remove-button"
                        aria-label={`${socialPlatforms.find((platform) => platform.id === link.platform)?.label ?? "Sosyal medya"} bağlantısını kaldır`}
                        onClick={() => setProfileDraft({
                          ...profileDraft,
                          socialLinks: profileDraft.socialLinks.filter((item) => item.id !== link.id),
                        })}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                  {profileDraft.socialLinks.length === 0 && (
                    <p className="social-editor-empty">Henüz sosyal medya bağlantısı eklenmedi.</p>
                  )}
                </div>
              </div>
              <div className="editor-actions"><button type="submit" className="button button-primary"><Save size={15} /> Değişiklikleri kaydet</button></div>
            </form>
          ) : activeTab === "appearance" ? (
            <section className="appearance-editor">
              <div className="appearance-card">
                <div className="appearance-card-heading"><div className="appearance-icon"><Sun size={18} /></div><div><h2>Görünüm modu</h2><p>Aydınlık ve koyu, sakin görünümler arasında seçim yapın.</p></div></div>
                <div className="theme-options">
                  {[
                    { id: "dark", label: "Koyu", Icon: Moon },
                    { id: "light", label: "Aydınlık", Icon: Sun },
                  ].map(({ id, label, Icon }) => (
                    <button className={`theme-option ${data.appearance.theme === id ? "selected" : ""}`} key={id} onClick={() => updateAppearance("theme", id)}>
                      <span className={`theme-preview theme-preview-${id}`}><i /><i /><i /></span><span className="theme-option-copy"><Icon size={15} />{label}</span>{data.appearance.theme === id && <Check className="theme-selected-check" size={15} />}
                    </button>
                  ))}
                </div>
              </div>
              <div className="appearance-card">
                <div className="appearance-card-heading"><div className="appearance-icon"><Palette size={18} /></div><div><h2>Renk paleti</h2><p>Hazır renklerden birini seçin veya kendi renklerinizi belirleyin.</p></div></div>
                <div className="palette-options">
                  {themePalettes.map((palette) => (
                    <button className={`palette-option ${data.appearance.palette === palette.id ? "selected" : ""}`} key={palette.id} onClick={() => updateAppearance("palette", palette.id)} aria-pressed={data.appearance.palette === palette.id}>
                      <span className="palette-swatches"><i style={{ backgroundColor: palette.brand }} /><i style={{ backgroundColor: palette.accent }} /></span><span className="palette-name">{palette.name}</span>{data.appearance.palette === palette.id && <Check className="palette-check" size={14} />}
                    </button>
                  ))}
                </div>
                {data.appearance.palette === "custom" && (
                  <div className="custom-color-fields">
                    <label className="custom-color-field">
                      <span>Ana renk</span>
                      <input
                        type="color"
                        value={data.appearance.customBrand}
                        onChange={(event) => updateAppearance("customBrand", event.target.value)}
                      />
                    </label>
                    <label className="custom-color-field">
                      <span>Vurgu rengi</span>
                      <input
                        type="color"
                        value={data.appearance.customAccent}
                        onChange={(event) => updateAppearance("customAccent", event.target.value)}
                      />
                    </label>
                  </div>
                )}
              </div>
              <div className="appearance-tip"><Check size={15} /> Tema ve renk tercihleriniz otomatik kaydedilir ve portföy ziyaretçilerine uygulanır.</div>
            </section>
          ) : (
            <SectionEditor
              sectionKey={activeTab}
              section={data.sections[activeTab]}
              fields={sectionFields[activeTab] ?? []}
              items={collectionDefinition ? data[activeTab] : null}
              onChange={(field, value) => updateSection(activeTab, field, value)}
              onCollectionChange={(items) => updateCollection(activeTab, items)}
              onNotice={showNotice}
            />
          )}

          {activeTab !== "profile" && activeTab !== "appearance" && collectionDefinition && <p className="collection-status-note">{activeCount} aktif kayıt · {data[activeTab].length - activeCount} pasif kayıt</p>}
            </div>
            {activeSection && (
              <aside className="admin-preview-pane" aria-label={`${activeSection.label} canlı ön izlemesi`}>
                <div className="admin-preview-heading">
                  <div>
                    <p className="eyebrow">CANLI ÖN İZLEME</p>
                    <h2>{activeSection.label}</h2>
                  </div>
                  <span><i /> Anında güncellenir</span>
                </div>
                <div className="admin-preview-canvas">
                  <PortfolioView data={data} previewSection={activeTab} />
                </div>
              </aside>
            )}
          </div>
          <div className="admin-footer-note"><span className="status-dot" />{isSupabaseConfigured ? "Değişiklikler Supabase hesabına kaydedilir ve tüm cihazlarda paylaşılır." : "Supabase ayarlanana kadar değişiklikler yalnızca bu tarayıcıya kaydedilir."}</div>
        </div>
      </main>
    </div>
  );
}

function SectionEditor({
  sectionKey,
  section,
  fields,
  items,
  onChange,
  onCollectionChange,
  onNotice,
}) {
  const definition = collectionDefinitions[sectionKey];
  return (
    <div className="section-editor-layout">
      <form className="profile-editor section-settings-card" onSubmit={(event) => event.preventDefault()}>
        <div className="profile-editor-title"><div className="profile-avatar-large"><FileText size={19} /></div><div><h2>Bölüm metinleri</h2><p>Yaptığınız değişiklikler kaydedildiğinde portföye anında yansır.</p></div></div>
        <div className="profile-form-grid">
          {fields.map((field) => (
            <Field key={field.key} label={field.label}>
              {field.type === "checkbox" ? (
                <input className="section-checkbox" type="checkbox" checked={section[field.key] !== false} onChange={(event) => onChange(field.key, event.target.checked)} />
              ) : field.type === "textarea" ? (
                <textarea className="text-input text-area" value={section[field.key] ?? ""} onChange={(event) => onChange(field.key, event.target.value)} />
              ) : (
                <input className="text-input" value={section[field.key] ?? ""} onChange={(event) => onChange(field.key, event.target.value)} />
              )}
            </Field>
          ))}
        </div>
      </form>
      {definition && (
        <AdminCollection
          key={sectionKey}
          collectionKey={sectionKey}
          items={items}
          onChange={onCollectionChange}
          onNotice={onNotice}
        />
      )}
    </div>
  );
}

function Field({ label, children }) {
  return <label className="field-label">{label}{children}</label>;
}
