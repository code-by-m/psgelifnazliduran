import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Brain,
  CalendarDays,
  Clock3,
  GraduationCap,
  Heart,
  HeartHandshake,
  Mail,
  MapPin,
  MessageCircle,
  Moon,
  Phone,
  ShieldCheck,
  Sun,
  UsersRound,
} from "lucide-react";

const expertiseIcons = [Brain, Heart, UsersRound, HeartHandshake];

function getWhatsAppUrl(value) {
  if (!value) return "";
  if (/^https:\/\/(wa\.me|api\.whatsapp\.com)\//i.test(value)) return value;
  let phone = value.replace(/\D/g, "");
  if (phone.startsWith("00")) phone = phone.slice(2);
  else if (phone.startsWith("0")) phone = `90${phone.slice(1)}`;
  else if (phone.length === 10) phone = `90${phone}`;
  return phone ? `https://wa.me/${phone}` : "";
}

function getExternalUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : "";
  } catch {
    return "";
  }
}

function getImageSource(value) {
  if (/^data:image\/(?:png|jpeg|webp|gif);base64,/i.test(value ?? "")) return value;
  return getExternalUrl(value);
}

const socialLabels = {
  linkedin: "LinkedIn",
  instagram: "Instagram",
  medium: "Medium",
  website: "Kişisel web sitesi",
};

export default function PortfolioView({ data, onAdmin, onToggleTheme, previewSection }) {
  const { profile, sections } = data;
  const isPreview = Boolean(previewSection);
  const showSection = (sectionKey) => isPreview
    ? previewSection === sectionKey
    : sections[sectionKey]?.enabled !== false;
  const expertise = data.expertise.filter((item) => item.active !== false);
  const services = data.services.filter((item) => item.active !== false);
  const articles = data.articles.filter((item) => item.active !== false);
  const testimonials = data.testimonials.filter((item) => item.active !== false);
  const education = data.education.filter((item) => item.active !== false);
  const whatsappUrl = getWhatsAppUrl(profile.whatsapp);
  const bookingIntegrationUrl = getExternalUrl(profile.bookingUrl);
  const bookingUrl = bookingIntegrationUrl || (whatsappUrl ? `${whatsappUrl}?text=${encodeURIComponent("Merhaba, randevu hakkında bilgi almak istiyorum.")}` : "");
  const socialLinks = (profile.socialLinks ?? [])
    .map((link) => ({ ...link, safeUrl: getExternalUrl(link.url) }))
    .filter((link) => link.safeUrl);
  const hasContactDetails = Boolean(
    profile.location || profile.phone || profile.email || socialLinks.length > 0,
  );
  const hasContactActions = Boolean(profile.email || profile.phone || whatsappUrl || bookingIntegrationUrl);
  const navigation = [
    ["about", sections.header.navAbout, "about"],
    ["expertise", sections.header.navExpertise, "expertise"],
    ["services", sections.header.navServices, "services"],
    ["articles", sections.header.navArticles, "articles"],
    ["testimonials", sections.header.navTestimonials || "Yorumlar", "testimonials"],
    ["education", sections.header.navEducation, "education"],
    ["contact", sections.header.navContact, "contact"],
  ];

  return (
    <div className={isPreview ? "portfolio-section-preview" : "site-shell"}>
      {!isPreview && (
        <header className="topbar">
          <a className="brand" href="#home" aria-label="Ana sayfaya dön">
            <span className="brand-mark"><Heart size={16} /></span>
            <span>{profile.name}</span>
          </a>
          {sections.header.enabled !== false && (
            <nav className="main-nav" aria-label="Ana menü">
              {navigation.map(([sectionKey, label, id]) => sections[sectionKey]?.enabled !== false && (
                <a key={sectionKey} href={`#${id}`}>{label}</a>
              ))}
            </nav>
          )}
          <div className="header-utilities">
            <a className="availability" href={bookingUrl || "#contact"}>
              <span className="status-dot" /> {profile.availability}
            </a>
            <button
              className="theme-toggle public-theme-toggle"
              onClick={onToggleTheme}
              aria-label={data.appearance.theme === "light" ? "Koyu temaya geç" : "Aydınlık temaya geç"}
              title={data.appearance.theme === "light" ? "Koyu tema" : "Aydınlık tema"}
            >
              {data.appearance.theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
            </button>
            <button className="header-admin-button" onClick={onAdmin}>{sections.header.adminLabel}</button>
          </div>
        </header>
      )}

      <main className={isPreview ? "portfolio-preview-main" : undefined}>
        {showSection("hero") && (
          <section className={`hero section-wrap ${sections.hero.visualEnabled === false ? "hero-no-visual" : ""}`} id="home">
            <div className="hero-copy">
              <div className="eyebrow hero-eyebrow"><span className="eyebrow-line" /> {profile.title}</div>
              <h1>
                {sections.hero.headlineLead}<br />
                <span className="text-muted">{sections.hero.headlineMuted}</span><br />
                {sections.hero.headlineEnd}<span className="accent">.</span>
              </h1>
              <p className="hero-description">{profile.bio}</p>
              <div className="hero-actions">
                <a className="button button-primary" href={bookingUrl || "#contact"} target={bookingUrl ? "_blank" : undefined} rel={bookingUrl ? "noreferrer" : undefined}>
                  <CalendarDays size={16} /> {sections.hero.primaryCta} <ArrowUpRight size={15} />
                </a>
                <a className="button button-quiet" href="#education">{sections.hero.secondaryCta} <ArrowRight size={15} /></a>
              </div>
              <div className="hero-meta">
                {profile.location && <span><MapPin size={14} /> {profile.location}</span>}
                {profile.location && <span className="meta-divider" />}
                <span>{sections.hero.meta}</span>
              </div>
            </div>
            {sections.hero.visualEnabled !== false && (
              <div className="hero-visual">
                <div className="portrait-frame">
                  {getImageSource(profile.photo) ? (
                    <img className="profile-portrait" src={getImageSource(profile.photo)} alt={`${profile.name} profil fotoğrafı`} />
                  ) : (
                    <div className="portrait-placeholder" aria-label="Profil fotoğrafı eklenmedi">
                      <span className="portrait-sun" />
                      <span className="portrait-initial">{profile.name.slice(0, 1)}</span>
                      <Heart className="portrait-heart" size={23} />
                    </div>
                  )}
                  {(sections.hero.visualCaption?.trim() || sections.hero.visualDescription?.trim()) && (
                    <div className="portrait-note">
                      <span className="note-icon"><ShieldCheck size={15} /></span>
                      <span>
                        {sections.hero.visualCaption?.trim() && <strong>{sections.hero.visualCaption}</strong>}
                        {sections.hero.visualDescription?.trim() && <small>{sections.hero.visualDescription}</small>}
                      </span>
                    </div>
                  )}
                  {(sections.hero.visualSecondaryCaption?.trim() || sections.hero.visualSecondaryDescription?.trim()) && (
                    <div className="portrait-note portrait-note-secondary">
                      <span className="note-icon"><Heart size={15} /></span>
                      <span>
                        {sections.hero.visualSecondaryCaption?.trim() && <strong>{sections.hero.visualSecondaryCaption}</strong>}
                        {sections.hero.visualSecondaryDescription?.trim() && <small>{sections.hero.visualSecondaryDescription}</small>}
                      </span>
                    </div>
                  )}
                </div>
                <span className="visual-decoration visual-decoration-one" />
                <span className="visual-decoration visual-decoration-two" />
              </div>
            )}
            {!isPreview && <a className="scroll-cue" href="#about"><ArrowDown size={15} /> KEŞFETMEYE DEVAM ET</a>}
          </section>
        )}

        {showSection("about") && (
          <section className="content-section section-wrap" id="about">
            <SectionHeading index="01" title={sections.about.title} kicker={sections.about.kicker} />
            <div className="about-grid">
              <div className="about-lead"><p>{sections.about.quote}</p><div className="about-mark">“</div></div>
              <div className="about-body">
                <p>{profile.bio}</p>
                <p>{sections.about.detail}</p>
                {profile.approach && (
                  <div className="therapy-approach">
                    <strong>Terapi yaklaşımı</strong>
                    <p>{profile.approach}</p>
                  </div>
                )}
                {profile.interests && (
                  <div className="therapy-approach">
                    <strong>Mesleki ilgi alanları ve beceriler</strong>
                    <p>{profile.interests}</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {showSection("expertise") && (
          <section className="content-section expertise-section section-wrap" id="expertise">
            <SectionHeading index="02" title={sections.expertise.title} kicker={sections.expertise.kicker} />
            <p className="section-intro-text">{sections.expertise.intro}</p>
            <div className="expertise-grid">
              {expertise.map((item, index) => {
                const Icon = expertiseIcons[index % expertiseIcons.length];
                return (
                  <article className="expertise-card" key={item.id}>
                    <span className="expertise-icon"><Icon size={20} /></span>
                    <span className="card-index">0{index + 1}</span>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </article>
                );
              })}
              {expertise.length === 0 && <p className="empty-content">İlgi alanları ve beceriler yakında burada paylaşılacak.</p>}
            </div>
          </section>
        )}

        {showSection("services") && (
          <section className="content-section services-section section-wrap" id="services">
            <SectionHeading index="03" title={sections.services.title} kicker={sections.services.kicker} />
            <p className="section-intro-text">{sections.services.intro}</p>
            <div className="services-grid">
              {services.map((service) => (
                <article className="service-card" key={service.id}>
                  <div className="service-card-top"><span className="service-icon"><HeartHandshake size={20} /></span><span className="service-format">{service.format}</span></div>
                  <h3>{service.title}</h3>
                  <p>{service.description}</p>
                  {service.duration && <div className="service-duration"><Clock3 size={15} /> {service.duration}</div>}
                  {service.conditions && <p className="service-conditions">{service.conditions}</p>}
                </article>
              ))}
              {services.length === 0 && <p className="empty-content">Seans bilgileri için lütfen iletişime geçin.</p>}
            </div>
          </section>
        )}

        {showSection("articles") && (
          <section className="content-section articles-section section-wrap" id="articles">
            <SectionHeading index="04" title={sections.articles.title} kicker={sections.articles.kicker} />
            <p className="section-intro-text">{sections.articles.intro}</p>
            <div className="articles-grid">
              {articles.map((article) => (
                <article className="article-card" key={article.id}>
                  <div className="article-card-top"><BookOpen size={19} /><span>{article.category}</span></div>
                  <h3>{article.title}</h3>
                  <p>{article.description}</p>
                  <div className="article-card-bottom">
                    <span><Clock3 size={13} /> {article.readTime}</span>
                    {getExternalUrl(article.url) && <a href={getExternalUrl(article.url)} target="_blank" rel="noreferrer">Yazıyı oku <ArrowUpRight size={14} /></a>}
                  </div>
                </article>
              ))}
              {articles.length === 0 && <p className="empty-content">Yeni yazılar yakında burada paylaşılacak.</p>}
            </div>
            <p className="article-disclaimer">Bu içerikler genel bilgilendirme amaçlıdır; tanı ve kişiye özel profesyonel destek yerine geçmez.</p>
          </section>
        )}

        {showSection("testimonials") && (
          <section className="content-section testimonials-section section-wrap" id="testimonials">
            <SectionHeading index="05" title={sections.testimonials.title} kicker={sections.testimonials.kicker} />
            <div className="testimonials-grid">
              {testimonials.map((item) => (
                <article className="testimonial-card" key={item.id}>
                  <span className="testimonial-quote">“</span>
                  <p>{item.quote}</p>
                  <span className="testimonial-author">{item.anonymousLabel || "Danışan"}</span>
                </article>
              ))}
              {testimonials.length === 0 && <p className="empty-content">{sections.testimonials.intro}</p>}
            </div>
            {testimonials.length > 0 && <p className="article-disclaimer">{sections.testimonials.intro} Paylaşımlar gerekli izinler alınarak anonimleştirilmiştir.</p>}
          </section>
        )}

        {showSection("education") && (
          <section className="content-section education-section section-wrap" id="education">
            <SectionHeading index="06" title={sections.education.title} kicker={sections.education.kicker} />
            <div className="education-list">
              {education.map((item) => (
                <article className="education-item" key={item.id}>
                  <div className="education-icon"><GraduationCap size={19} /></div>
                  <div className="education-copy">
                    <div className="education-title-row"><h3>{item.program}</h3>{item.period && <span>{item.period}</span>}</div>
                    <p>{item.institution}{item.location && ` · ${item.location}`}</p>
                    {item.description && <p className="education-description">{item.description}</p>}
                  </div>
                </article>
              ))}
              {education.length === 0 && <p className="empty-content">Eğitim ve mesleki gelişim bilgileri henüz eklenmedi.</p>}
            </div>
          </section>
        )}

        {showSection("contact") && (
          <section className="contact-section section-wrap" id="contact">
            <div className={`contact-card ${hasContactDetails ? "" : "contact-card-no-details"}`}>
              <div className="contact-copy">
                <p className="eyebrow"><span className="eyebrow-line" /> {sections.contact.kicker}</p>
                <h2>{sections.contact.titleLead}<br />{sections.contact.titleEnd}</h2>
                <p>{sections.contact.description}</p>
                <div className="contact-actions">
                  {profile.email && <a className="button button-primary" href={`mailto:${profile.email}`}><Mail size={15} /> {sections.contact.emailCta} <ArrowUpRight size={15} /></a>}
                  {profile.phone && <a className="button button-quiet" href={`tel:${profile.phone.replace(/[^\d+]/g, "")}`}><Phone size={15} /> {sections.contact.phoneCta}</a>}
                  {whatsappUrl && <a className="button button-quiet" href={whatsappUrl} target="_blank" rel="noreferrer"><MessageCircle size={15} /> {sections.contact.phoneCta}</a>}
                  {bookingIntegrationUrl && <a className="button button-quiet" href={bookingIntegrationUrl} target="_blank" rel="noreferrer"><CalendarDays size={15} /> {sections.contact.bookingCta}</a>}
                </div>
                {!hasContactActions && <p className="contact-unavailable">İletişim bilgileri yakında burada paylaşılacak.</p>}
              </div>
              {hasContactDetails && (
                <div className="contact-details">
                  {profile.location && <div><MapPin size={17} /><span><strong>Konum</strong>{profile.location}</span></div>}
                  {profile.phone && <div><Phone size={17} /><span><strong>Telefon</strong>{profile.phone}</span></div>}
                  {profile.email && <div><Mail size={17} /><span><strong>E-posta</strong>{profile.email}</span></div>}
                  {socialLinks.length > 0 && (
                    <div className="contact-social-links">
                      <Heart size={17} />
                      <span><strong>Bağlantılar</strong>
                        {socialLinks.map((link) => (
                          <a key={link.id} href={link.safeUrl} target="_blank" rel="noreferrer">
                            {socialLabels[link.platform] || "Web sitesi"} <ArrowUpRight size={12} />
                          </a>
                        ))}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {showSection("footer") && (
        <footer className="footer section-wrap">
          <a className="brand footer-brand" href="#home"><span className="brand-mark"><Heart size={15} /></span><span>{profile.name}</span></a>
          <span>© {new Date().getFullYear()} {profile.name}. {sections.footer.tagline}</span>
          <div className="footer-right">{profile.location && <span>{profile.location}</span>}{!isPreview && <button onClick={onAdmin}>Yönetici girişi</button>}</div>
        </footer>
      )}
    </div>
  );
}

function SectionHeading({ index, title, kicker }) {
  return (
    <div className="section-heading">
      <span className="section-index">{index} /</span>
      <div><p className="eyebrow">{kicker}</p><h2>{title}<span className="accent">.</span></h2></div>
      <span className="heading-rule" />
    </div>
  );
}
