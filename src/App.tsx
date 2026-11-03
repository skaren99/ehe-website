import { useEffect, useRef, useState, type FormEvent } from "react";
import { api } from "./api";
import logic from "./pricing.js";
import { money } from "./domain.mjs";
import { tallinnInstant } from "./time.mjs";
import "./home.css";
type Product = {
  id: string;
  name: Record<string, string>;
  description: Record<string, string>;
  category: string;
  price: number;
  stock: number;
};
type Settings = {
  headline: Record<string, string>;
  leader: Record<string, string>;
  pricing: any;
};
export default function App() {
  const [lang, setLang] = useState(
      new URLSearchParams(location.search).get("lang") === "en" ? "en" : "et",
    ),
    [settings, setSettings] = useState<Settings>(),
    [products, setProducts] = useState<Product[]>([]),
    [closures, setClosures] = useState<{ from: string; to: string }[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [booking, setBooking] = useState<Product>(),
    [confirmation, setConfirmation] = useState<any>(),
    [category, setCategory] = useState("all");
  const bookingKey = useRef(crypto.randomUUID()),
    lastBooking = useRef(""),
    lightbox = useRef<HTMLDialogElement>(null);
  const path = location.pathname.replace(/\/$/, "") || "/";
  const t = (et: string, en: string) => (lang === "et" ? et : en);
  const [estimate, setEstimate] = useState({
    event: "wedding",
    guests: 72,
    location: "local",
    package: "full",
    decor: "none",
    styling: false,
    dinner: false,
    visit: false,
    website: false,
    extraHours: 0,
    lateHours: 0,
  });
  useEffect(() => {
    let live = true;
    Promise.all([
      api<Settings>("/api/site/public/settings"),
      api<Product[]>("/api/site/public/products"),
      api<{ from: string; to: string }[]>("/api/site/public/events"),
    ])
      .then(([s, p, c]) => {
        if (live) {
          logic.setPricing(s.pricing);
          setSettings(s);
          setProducts(p);
          setClosures(c);
        }
      })
      .catch((e) => {
        if (live) setError(e.message);
      });
    return () => {
      live = false;
    };
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
    const u = new URL(location.href);
    u.searchParams.set("lang", lang);
    history.replaceState({}, "", u);
    document.title = t(
      "EHE Events · Pulmad ja sündmused",
      "EHE Events · Weddings and events",
    );
  }, [lang]);
  const url = (p: string) => p + "?lang=" + lang;
  let quote:
    | { total: number; complete: boolean; rows: Record<string, number | null> }
    | undefined;
  try {
    quote = logic.estimate(estimate);
  } catch {}
  async function book(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const v = Object.fromEntries(new FormData(e.currentTarget)) as Record<
      string,
      string
    >;
    setBusy(true);
    setError("");
    try {
      const input = {
        productId: booking!.id,
        start: tallinnInstant(v.date, v.time),
        quantity: Number(v.quantity),
        extraDays: Number(v.extraDays),
        name: v.name,
        email: v.email,
      };
      const signature = JSON.stringify(input);
      if (lastBooking.current !== signature) {
        bookingKey.current = crypto.randomUUID();
        lastBooking.current = signature;
      }
      setConfirmation(
        await api("/api/site/public/bookings", "POST", {
          ...input,
          requestKey: bookingKey.current,
        }),
      );
      setBooking(undefined);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className={path === "/" ? "photo-home" : ""}>
      <header className="site-header">
        <a className="brand" href={url("/")}>
          ehe<small>EVENTS</small>
        </a>
        <nav aria-label={t("Peamenüü", "Main navigation")}>
          {[
            ["/services/", t("Teenused", "Services")],
            ["/rentals/", t("Rent", "Rentals")],
            ["/portfolio/", t("Portfoolio", "Portfolio")],
            ["/contact/", t("Kontakt", "Contact")],
          ].map(([href, label]) => (
            <a key={href} href={url(href)}>
              {label}
            </a>
          ))}
        </nav>
        <div className="languages">
          <button
            className={lang === "et" ? "active" : ""}
            onClick={() => setLang("et")}
          >
            ET
          </button>
          <span>/</span>
          <button
            className={lang === "en" ? "active" : ""}
            onClick={() => setLang("en")}
          >
            EN
          </button>
        </div>
      </header>
      {error && (
        <p className="notice error public-error" role="alert">
          {t(
            "Ühendus või salvestamine ebaõnnestus. ",
            "Connection or save failed. ",
          )}
          {error}
        </p>
      )}
      {path === "/" ? (
        <main>
          <section className="hero">
            <img
              src="/wedding.jpg"
              alt="Pulmapaar hobustega kuldses õhtuvalguses"
              fetchPriority="high"
            />
            <div className="hero-copy">
              <div className="eyebrow">
                {t(
                  "PULMAD · SÜNDMUSED · KOOSOLEMINE",
                  "WEDDINGS · EVENTS · TOGETHERNESS",
                )}
              </div>
              <h1>
                {"ehe"}
                <span>{"EVENTS"}</span>
              </h1>
              <p>
                {settings?.headline[lang] ||
                  t(
                    "Ehedad hetked. Ehedad emotsioonid.",
                    "Genuine moments. Genuine emotions.",
                  )}
              </p>
            </div>
            <div className="hero-bottom">
              <a className="scroll" href="#about">
                <span>{"↓"}</span>
                <b>{t("MEIE LUGU ALGAB SIIT", "OUR STORY STARTS HERE")}</b>
              </a>
              <div>{t("TEIE PÄEV. TEIE MOODI.", "YOUR DAY. YOUR WAY.")}</div>
            </div>
          </section>
          {"\n"}
          <div className="content-layer">
            <section className="intro" id="about">
              <div>
                <span className="eyebrow">{"EHE EVENTS"}</span>
                <h2>
                  {t("Toome fookuse tagasi sisule.", "Back to what matters.")}
                </h2>
              </div>
              <div>
                <p>
                  {t(
                    "Kaunis sündmus on enamat kui läbimõeldud detailid. See on kohtumine, naer, lähedus ja tunne, mis jääb. Loome ruumi ehedatele hetkedele ja ehedatele emotsioonidele.",
                    "A beautiful event is more than carefully chosen details. It is connection, laughter and a feeling that stays. We make room for genuine moments and genuine emotions.",
                  )}
                </p>
                <p>
                  {t(
                    "Meie hoiame korraldust, teie saate olla kohal.",
                    "We take care of the plans so you can be truly present.",
                  )}
                </p>
                <a className="line-link" href={url("/contact/")}>
                  {t("Räägime teie päevast ↗", "Let’s talk about your day ↗")}
                </a>
              </div>
            </section>
            {"\n"}
            <section className="services">
              <div className="services-top">
                <h2>
                  {t(
                    "Teie hetk. Meie hoole all.",
                    "Your moment. In good hands.",
                  )}
                </h2>
                <span className="eyebrow">
                  {t("IDEEDEST MÄLESTUSTENI", "FROM IDEAS TO MEMORIES")}
                </span>
              </div>
              <div className="cards">
                <article className="card">
                  <span className="number">{"01 /"}</span>
                  <h3>{t("Pulmad", "Weddings")}</h3>
                  <p>
                    {t(
                      "Korraldamine ja koordineerimine, et saaksite nautida oma päeva algusest lõpuni.",
                      "Planning and coordination so you can enjoy your day from beginning to end.",
                    )}
                  </p>
                  <a className="line-link" href={url("/services/")}>
                    {t("Avasta võimalused ↗", "Explore the possibilities ↗")}
                  </a>
                </article>
                <article className="card">
                  <span className="number">{"02 /"}</span>
                  <h3>{t("Sündmused", "Events")}</h3>
                  <p>
                    {t(
                      "Isiklikud tähistamised ja ettevõtete sündmused. Iga kohtumine väärib oma nägu.",
                      "Personal celebrations and company events. Every gathering deserves its own character.",
                    )}
                  </p>
                  <a className="line-link" href={url("/services/")}>
                    {t("Leiame teie lahenduse ↗", "Find your perfect fit ↗")}
                  </a>
                </article>
                <article className="card">
                  <span className="number">{"03 /"}</span>
                  <h3>{t("Detailide rent", "Finishing touches")}</h3>
                  <p>
                    {t(
                      "Loorid, küünlatopsid ja dekoratsioonid. Väikesed detailid, mis loovad suure tunde.",
                      "Veils, candle holders and decorations. Little details that make a lasting impression.",
                    )}
                  </p>
                  <a className="line-link" href={url("/rentals/")}>
                    {t("Vaata kollektsiooni ↗", "View the collection ↗")}
                  </a>
                </article>
              </div>
            </section>
            <section className="closing">
              <span className="eyebrow">
                {t("KÕIK ALGAB ÜHEST MÕTTEST", "IT ALL BEGINS WITH AN IDEA")}
              </span>
              <h2>
                {t("Loome midagi ehedat.", "Let’s create something genuine.")}
              </h2>
              <a href="mailto:karen@eheevents.ee">{"karen@eheevents.ee ↗"}</a>
            </section>
          </div>
        </main>
      ) : (
        <main className="site-page">
          {path === "/services" ? (
            <>
              <p className="eyebrow">EHE EVENTS</p>
              <h1>
                {t("Teie hetk. Meie hoole all.", "Your moment. In good hands.")}
              </h1>
              <p>
                {t(
                  "Pulmade ja sündmuste korraldamine, koordineerimine ning detailide rent.",
                  "Wedding and event planning, coordination and finishing touches.",
                )}
              </p>
              <section className="card">
                <h2>{t("Planeerime teie päeva.", "Let’s plan your day.")}</h2>
                <div className="form-grid">
                  <label>
                    {t("Sündmus", "Event")}
                    <select
                      value={estimate.event}
                      onChange={(e) =>
                        setEstimate((v) => ({ ...v, event: e.target.value }))
                      }
                    >
                      {[
                        ["wedding", "Pulmad", "Wedding"],
                        ["birthday", "Sünnipäev", "Birthday"],
                        ["summer", "Suvepäevad", "Summer event"],
                        ["other", "Muu sündmus", "Other event"],
                      ].map(([v, et, en]) => (
                        <option key={v} value={v}>
                          {t(et, en)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    {t("Külalisi", "Guests")}
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={estimate.guests}
                      onChange={(e) =>
                        setEstimate((v) => ({
                          ...v,
                          guests: Number(e.target.value),
                        }))
                      }
                    />
                  </label>
                  <label>
                    {t("Asukoht", "Location")}
                    <select
                      value={estimate.location}
                      onChange={(e) =>
                        setEstimate((v) => ({ ...v, location: e.target.value }))
                      }
                    >
                      {[
                        ["local", "Saaremaa / Muhumaa / Tartumaa"],
                        [
                          "mainland",
                          t("Muu Mandri-Eesti", "Other mainland Estonia"),
                        ],
                        ["hiiu", "Hiiumaa"],
                        ["islands", t("Muud saared", "Other islands")],
                      ].map(([v, l]) => (
                        <option key={v} value={v}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </label>
                  {estimate.event === "wedding" ? (
                    <>
                      <label>
                        {t("Pulmapakett", "Wedding package")}
                        <select
                          value={estimate.package}
                          onChange={(e) =>
                            setEstimate((v) => ({
                              ...v,
                              package: e.target.value,
                            }))
                          }
                        >
                          <option value="half">
                            {t("Pool päeva", "Half day")}
                          </option>
                          <option value="full">
                            {t("Terve päev", "Full day")}
                          </option>
                          <option value="coordination">
                            {t("Koordineerimine", "Coordination")}
                          </option>
                        </select>
                      </label>
                      <label>
                        {t("Dekoratsioonid", "Decorations")}
                        <select
                          value={estimate.decor}
                          onChange={(e) =>
                            setEstimate((v) => ({
                              ...v,
                              decor: e.target.value,
                            }))
                          }
                        >
                          {["none", "mini", "midi", "maxi"].map((x) => (
                            <option key={x} value={x}>
                              {x === "none" ? t("Ilma", "None") : x}
                            </option>
                          ))}
                        </select>
                      </label>
                      {(["extraHours", "lateHours"] as const).map((key) => (
                        <label key={key}>
                          {key === "extraHours"
                            ? t("Lisatunnid", "Extra hours")
                            : t(
                                "Tunnid pärast südaööd",
                                "Hours after midnight",
                              )}
                          <input
                            type="number"
                            min="0"
                            max="24"
                            step="0.5"
                            value={estimate[key]}
                            onChange={(e) =>
                              setEstimate((v) => ({
                                ...v,
                                [key]: Number(e.target.value),
                              }))
                            }
                          />
                        </label>
                      ))}
                      {(["dinner", "visit", "website"] as const).map((key) => (
                        <label className="checkbox" key={key}>
                          <input
                            type="checkbox"
                            checked={estimate[key]}
                            onChange={(e) =>
                              setEstimate((v) => ({
                                ...v,
                                [key]: e.target.checked,
                              }))
                            }
                          />
                          {
                            {
                              dinner: t(
                                "Pulmaeelne õhtusöök",
                                "Pre-wedding dinner",
                              ),
                              visit: t("Kohakülastus", "Venue visit"),
                              website: t("Pulmaleht", "Wedding website"),
                            }[key]
                          }
                        </label>
                      ))}
                    </>
                  ) : (
                    <label className="checkbox">
                      <input
                        type="checkbox"
                        checked={estimate.styling}
                        onChange={(e) =>
                          setEstimate((v) => ({
                            ...v,
                            styling: e.target.checked,
                          }))
                        }
                      />
                      {t("Dekoratsioonid", "Decorations")}
                    </label>
                  )}
                </div>
                <div
                  className="quote-total"
                  style={{ marginTop: 25 }}
                  aria-live="polite"
                >
                  {settings && quote
                    ? money(quote.total)
                    : t("Hinnad laadimisel…", "Loading prices…")}
                </div>
                <p className="subtle">
                  {t(
                    "Esialgne hinnang. Käibemaksu ei lisata. Lõplik pakkumine valmib pärast teie soovide täpsustamist.",
                    "Initial estimate. No VAT added. Your final quotation follows a discussion of your wishes.",
                  )}
                  {quote &&
                    !quote.complete &&
                    t(
                      " Sündmuse põhiteenus vajab eraldi pakkumist.",
                      " The main service requires a separate quotation.",
                    )}
                </p>
                <a className="btn primary" href={url("/contact/")}>
                  {t("Küsi pakkumist", "Request a quotation")}
                </a>
              </section>
            </>
          ) : path === "/rentals" ? (
            <>
              <p className="eyebrow">EHE EVENTS</p>
              <h1>
                {t(
                  "Väikesed detailid. Suur tunne.",
                  "Little details. A lasting feeling.",
                )}
              </h1>
              <p>
                {t(
                  "Baashind sisaldab 36 tundi kasutust. Iga lisapäev lisab 10% baashinnast.",
                  "Base price includes 36 hours of use. Each extra day adds 10% of the base price.",
                )}
              </p>
              <div className="tabs">
                {[
                  ["all", t("Kõik", "All")],
                  ["table", t("Lauakaunistused", "Table decorations")],
                  ["large", t("Suured dekoratsioonid", "Large decorations")],
                  ["clothes", t("Riided", "Clothing")],
                ].map(([v, l]) => (
                  <button
                    className={"btn " + (category === v ? "active" : "")}
                    key={v}
                    onClick={() => setCategory(v)}
                  >
                    {l}
                  </button>
                ))}
              </div>
              <div className="project-grid">
                {products
                  .filter((p) => category === "all" || p.category === category)
                  .map((p) => (
                    <article className="card" key={p.id}>
                      <span className="eyebrow">
                        {t("DETAILIDE RENT", "FINISHING TOUCHES")}
                      </span>
                      <h2>{p.name[lang]}</h2>
                      <p>{p.description[lang]}</p>
                      <p>{money(p.price)} / 36 h</p>
                      <button
                        className="btn"
                        onClick={() => {
                          setBooking(p);
                          setConfirmation(undefined);
                        }}
                      >
                        {t("Vali kuupäev", "Select date")}
                      </button>
                    </article>
                  ))}
              </div>
              {booking && (
                <section className="card booking">
                  <div className="panel-head">
                    <h2>{booking.name[lang]}</h2>
                    <button
                      className="btn"
                      onClick={() => setBooking(undefined)}
                    >
                      {t("Sulge", "Close")}
                    </button>
                  </div>
                  <form className="form-grid" onSubmit={book}>
                    <label>
                      {t("Alguskuupäev", "Start date")}
                      <input type="date" name="date" required />
                    </label>
                    <label>
                      {t("Kellaaeg Eestis (08–18)", "Time in Estonia (08–18)")}
                      <input
                        type="time"
                        name="time"
                        min="08:00"
                        max="18:00"
                        defaultValue="10:00"
                        required
                      />
                    </label>
                    <label>
                      {t("Kogus", "Quantity")}
                      <input
                        type="number"
                        name="quantity"
                        defaultValue="1"
                        min="1"
                        max="1000"
                        required
                      />
                    </label>
                    <label>
                      {t("Lisapäevi", "Extra days")}
                      <input
                        type="number"
                        name="extraDays"
                        defaultValue="0"
                        min="0"
                        max="30"
                        required
                      />
                    </label>
                    <label>
                      {t("Nimi", "Name")}
                      <input
                        name="name"
                        autoComplete="name"
                        required
                        maxLength={100}
                      />
                    </label>
                    <label>
                      {t("E-post", "Email")}
                      <input
                        type="email"
                        name="email"
                        autoComplete="email"
                        required
                        maxLength={200}
                      />
                    </label>
                    <p className="subtle full">
                      {t(
                        "Saadavus kontrollitakse kinnitamisel. Kinnitus kuvatakse siin; automaatset e-kirja ega makset ei toimu.",
                        "Availability is checked at confirmation. Confirmation appears here; no automatic email or payment is sent.",
                      )}
                    </p>
                    <button className="btn primary full" disabled={busy}>
                      {busy
                        ? t("Salvestan…", "Saving…")
                        : t("Kinnita broneering", "Confirm booking")}
                    </button>
                  </form>
                </section>
              )}
              {confirmation && (
                <div className="notice" role="status">
                  <h2>{t("Broneering kinnitatud", "Booking confirmed")}</h2>
                  <p>
                    {confirmation.reference} · {money(confirmation.total)}
                  </p>
                  <p>
                    {t("Tagastamine", "Return")}:{" "}
                    {new Date(confirmation.customerEnd).toLocaleString(
                      lang === "et" ? "et-EE" : "en-GB",
                      { timeZone: "Europe/Tallinn" },
                    )}
                  </p>
                </div>
              )}
            </>
          ) : path === "/portfolio" ? (
            <>
              <p className="eyebrow">PORTFOOLIO</p>
              <h1>
                {t(
                  "Ehedad hetked. Päris emotsioonid.",
                  "Genuine moments. Real emotions.",
                )}
              </h1>
              <div className="project-grid">
                <article>
                  <a href={url("/portfolio/wedding/")}>
                    <img
                      src="/wedding.jpg"
                      alt={t(
                        "Pulmapaar hobustega",
                        "Wedding couple with horses",
                      )}
                      style={{ width: "100%" }}
                    />
                    <h2>Karen &amp; Rauno</h2>
                  </a>
                  <p>
                    {t(
                      "Koos. Just selles hetkes.",
                      "Together. In this moment.",
                    )}
                  </p>
                </article>
                {[2, 3, 4].map((i) => (
                  <article key={i}>
                    <div className="placeholder-photo">0{i}</div>
                    <h2>{t("Pruut & peigmees", "Bride & groom")}</h2>
                    <p>
                      {t(
                        "Siia lisandub järgmise paari pulmalugu.",
                        "Another couple’s wedding story will appear here.",
                      )}
                    </p>
                  </article>
                ))}
              </div>
            </>
          ) : path === "/portfolio/wedding" ? (
            <>
              <a href={url("/portfolio/")}>
                ← {t("Tagasi portfooliosse", "Back to portfolio")}
              </a>
              <h1 style={{ marginTop: 35 }}>Karen &amp; Rauno</h1>
              <p>
                {t("Koos. Just selles hetkes.", "Together. In this moment.")}
              </p>
              <button
                className="btn"
                onClick={() => lightbox.current?.showModal()}
              >
                <img
                  className="hero-cover"
                  src="/wedding.jpg"
                  alt={t(
                    "Pulmapaar hobustega kuldses õhtuvalguses",
                    "Wedding couple with horses in golden evening light",
                  )}
                />
              </button>
              <h2>
                {t(
                  "Inimesed detailide taga.",
                  "The people behind the details.",
                )}
              </h2>
              <p>
                {t(
                  "Kuupäev, pulmakoht, pulmatiimi nimed ja pruutpaari tagasiside lisanduvad pärast kinnitamist.",
                  "Date, venue, wedding team and the couple’s testimonial will be added once confirmed.",
                )}
              </p>
              <div className="project-grid">
                {Array.from({ length: 9 }, (_, i) => (
                  <div className="placeholder-photo" key={i}>
                    {String(i + 2).padStart(2, "0")}
                  </div>
                ))}
              </div>
              <dialog ref={lightbox}>
                <button
                  className="btn"
                  onClick={() => lightbox.current?.close()}
                >
                  {t("Sulge foto", "Close photograph")}
                </button>
                <img
                  src="/wedding.jpg"
                  alt={t("Pulmapaar hobustega", "Wedding couple with horses")}
                />
              </dialog>
            </>
          ) : path === "/contact" ? (
            <>
              <p className="eyebrow">EHE EVENTS</p>
              <h1>
                {t("Kõik algab ühest mõttest.", "It all begins with an idea.")}
              </h1>
              <div className="dashboard-grid">
                <section>
                  <h2>{settings?.leader.name || "Karen"}</h2>
                  <p>{settings?.leader[lang]}</p>
                  <a href="mailto:karen@eheevents.ee">karen@eheevents.ee ↗</a>
                </section>
                <form
                  className="card form-grid"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const v = Object.fromEntries(new FormData(e.currentTarget));
                    window.location.href =
                      "mailto:karen@eheevents.ee?subject=" +
                      encodeURIComponent("EHE Events – " + v.name) +
                      "&body=" +
                      encodeURIComponent(String(v.message) + "\n\n" + v.email);
                  }}
                >
                  <label>
                    {t("Nimi", "Name")}
                    <input name="name" required maxLength={100} />
                  </label>
                  <label>
                    {t("E-post", "Email")}
                    <input name="email" type="email" required maxLength={200} />
                  </label>
                  <label className="full">
                    {t("Räägi oma päevast", "Tell us about your day")}
                    <textarea name="message" required maxLength={5000} />
                  </label>
                  <button className="btn primary full">
                    {t("Ava e-kirja mustand", "Open email draft")}
                  </button>
                  <p className="subtle full">
                    {t(
                      "Kiri avaneb sinu e-posti rakenduses.",
                      "Your message opens in your email application.",
                    )}
                  </p>
                </form>
              </div>
              {closures.length > 0 && (
                <section className="card">
                  <h2>
                    {t(
                      "Juba broneeritud sündmuste kuupäevad",
                      "Unavailable event dates",
                    )}
                  </h2>
                  {closures.map((c, i) => (
                    <p key={i}>
                      {c.from} – {c.to}
                    </p>
                  ))}
                </section>
              )}
            </>
          ) : (
            <>
              <h1>{t("Lehte ei leitud.", "Page not found.")}</h1>
              <a href={url("/")}>{t("Tagasi avalehele", "Back to home")}</a>
            </>
          )}
        </main>
      )}
      <footer className="site-footer">
        <a className="brand" href={url("/")}>
          ehe<small>EVENTS</small>
        </a>
        <p>
          {t(
            "Ehedad hetked. Ehedad emotsioonid.",
            "Genuine moments. Genuine emotions.",
          )}
        </p>
        <p>eheevents.ee</p>
      </footer>
    </div>
  );
}
