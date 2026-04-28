import { useState, useEffect } from "react";

const ADMIN_PASSWORD = "admin123";

const CONSOMMABLES = [
  "Gants latex S", "Gants latex M", "Gants latex L",
  "Masques chirurgicaux", "Masques FFP2",
  "Compresses stériles 10x10", "Compresses stériles 5x5",
  "Bandes élastiques", "Sparadrap",
  "Seringues 5ml", "Seringues 10ml", "Seringues 20ml",
  "Aiguilles IM", "Aiguilles IV",
  "Cathéters IV 14G", "Cathéters IV 18G", "Cathéters IV 20G",
  "Perfusions NaCl 500ml", "Perfusions NaCl 1L",
  "Désinfectant mains", "Alcool 70°",
  "Électrodes ECG", "Gel échographique",
  "Couverture de survie", "Sac poubelle DASRI",
  "Canules de Guedel", "Masque O2 adulte", "Masque O2 enfant",
  "Sonde aspiration", "Gaze hémostatique",
];

const VEHICULES = ["VSL-01", "VSL-02", "AMBU-01", "AMBU-02", "AMBU-03", "UMH-01"];

const STORAGE_KEY = "ambulance_stock_sorties";

function loadSorties() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveSorties(sorties) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sorties));
}

// ─── FORM PAGE ───────────────────────────────────────────────────────────────
function FormPage({ onSuccess }) {
  const [form, setForm] = useState({
    initiales: "",
    vehicule: "",
    consommable: "",
    quantite: 1,
    date: new Date().toISOString().slice(0, 10),
    note: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = () => {
    if (!form.initiales.trim()) return setError("Veuillez entrer vos initiales.");
    if (!form.vehicule) return setError("Veuillez sélectionner un véhicule.");
    if (!form.consommable) return setError("Veuillez sélectionner un consommable.");
    if (!form.quantite || form.quantite < 1) return setError("Quantité invalide.");
    setError("");
    const entry = { ...form, id: Date.now(), initiales: form.initiales.toUpperCase().trim() };
    const sorties = loadSorties();
    saveSorties([entry, ...sorties]);
    setSubmitted(true);
  };

  if (submitted) return (
    <div style={styles.successScreen}>
      <div style={styles.successIcon}>✓</div>
      <h2 style={styles.successTitle}>Sortie enregistrée !</h2>
      <p style={styles.successSub}>
        <b>{form.quantite}×</b> {form.consommable}<br />
        Véhicule <b>{form.vehicule}</b> · {form.initiales} · {form.date}
      </p>
      <button style={styles.btnPrimary} onClick={() => { setSubmitted(false); setForm({ initiales: "", vehicule: "", consommable: "", quantite: 1, date: new Date().toISOString().slice(0, 10), note: "" }); }}>
        Nouvelle sortie
      </button>
    </div>
  );

  return (
    <div style={styles.formContainer}>
      <div style={styles.formHeader}>
        <div style={styles.redCross}>🚑</div>
        <h1 style={styles.formTitle}>Sortie de stock</h1>
        <p style={styles.formSub}>Remplissez le formulaire pour enregistrer votre sortie</p>
      </div>

      <div style={styles.card}>
        {error && <div style={styles.errorBanner}>{error}</div>}

        <Field label="Vos initiales *">
          <input
            style={styles.input}
            placeholder="ex: JD"
            maxLength={4}
            value={form.initiales}
            onChange={e => set("initiales", e.target.value.toUpperCase())}
          />
        </Field>

        <Field label="Véhicule *">
          <select style={styles.input} value={form.vehicule} onChange={e => set("vehicule", e.target.value)}>
            <option value="">— Sélectionner —</option>
            {VEHICULES.map(v => <option key={v}>{v}</option>)}
          </select>
        </Field>

        <Field label="Consommable *">
          <select style={styles.input} value={form.consommable} onChange={e => set("consommable", e.target.value)}>
            <option value="">— Sélectionner —</option>
            {CONSOMMABLES.map(c => <option key={c}>{c}</option>)}
          </select>
        </Field>

        <Field label="Quantité *">
          <div style={styles.qtyRow}>
            <button style={styles.qtyBtn} onClick={() => set("quantite", Math.max(1, form.quantite - 1))}>−</button>
            <input
              style={{ ...styles.input, ...styles.qtyInput }}
              type="number" min={1}
              value={form.quantite}
              onChange={e => set("quantite", parseInt(e.target.value) || 1)}
            />
            <button style={styles.qtyBtn} onClick={() => set("quantite", form.quantite + 1)}>+</button>
          </div>
        </Field>

        <Field label="Date *">
          <input style={styles.input} type="date" value={form.date} onChange={e => set("date", e.target.value)} />
        </Field>

        <Field label="Note (optionnel)">
          <input style={styles.input} placeholder="Commentaire libre…" value={form.note} onChange={e => set("note", e.target.value)} />
        </Field>

        <button style={styles.btnPrimary} onClick={handleSubmit}>
          Enregistrer la sortie
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>
      {children}
    </div>
  );
}

// ─── ADMIN PAGE ───────────────────────────────────────────────────────────────
function AdminPage() {
  const [auth, setAuth] = useState(false);
  const [pwd, setPwd] = useState("");
  const [pwdError, setPwdError] = useState(false);
  const [sorties, setSorties] = useState([]);
  const [filter, setFilter] = useState({ vehicule: "", consommable: "", initiales: "" });
  const [tab, setTab] = useState("log");

  useEffect(() => {
    if (auth) setSorties(loadSorties());
  }, [auth]);

  const handleLogin = () => {
    if (pwd === ADMIN_PASSWORD) { setAuth(true); setPwdError(false); }
    else setPwdError(true);
  };

  if (!auth) return (
    <div style={styles.formContainer}>
      <div style={styles.formHeader}>
        <div style={styles.redCross}>🔐</div>
        <h1 style={styles.formTitle}>Accès Admin</h1>
        <p style={styles.formSub}>Tableau de bord des sorties de stock</p>
      </div>
      <div style={styles.card}>
        {pwdError && <div style={styles.errorBanner}>Mot de passe incorrect</div>}
        <Field label="Mot de passe admin">
          <input style={styles.input} type="password" placeholder="••••••••" value={pwd}
            onChange={e => setPwd(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleLogin()} />
        </Field>
        <button style={styles.btnPrimary} onClick={handleLogin}>Connexion</button>
      </div>
    </div>
  );

  const filtered = sorties.filter(s =>
    (!filter.vehicule || s.vehicule === filter.vehicule) &&
    (!filter.consommable || s.consommable === filter.consommable) &&
    (!filter.initiales || s.initiales.includes(filter.initiales.toUpperCase()))
  );

  // Stats
  const statsConsommable = {};
  filtered.forEach(s => {
    statsConsommable[s.consommable] = (statsConsommable[s.consommable] || 0) + Number(s.quantite);
  });
  const topConsommables = Object.entries(statsConsommable).sort((a, b) => b[1] - a[1]).slice(0, 8);

  const statsVehicule = {};
  filtered.forEach(s => {
    statsVehicule[s.vehicule] = (statsVehicule[s.vehicule] || 0) + Number(s.quantite);
  });

  const handleDelete = (id) => {
    const updated = sorties.filter(s => s.id !== id);
    saveSorties(updated);
    setSorties(updated);
  };

  const handleExportCSV = () => {
    const header = "Date,Initiales,Véhicule,Consommable,Quantité,Note";
    const rows = filtered.map(s => `${s.date},${s.initiales},${s.vehicule},"${s.consommable}",${s.quantite},"${s.note || ""}"`);
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "stock-sorties.csv"; a.click();
  };

  return (
    <div style={styles.adminContainer}>
      <div style={styles.adminHeader}>
        <div>
          <h1 style={styles.adminTitle}>📋 Tableau de bord</h1>
          <p style={styles.adminSub}>{filtered.length} sortie(s) enregistrée(s)</p>
        </div>
        <button style={styles.btnExport} onClick={handleExportCSV}>⬇ Export CSV</button>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        {["log", "stats"].map(t => (
          <button key={t} style={{ ...styles.tab, ...(tab === t ? styles.tabActive : {}) }} onClick={() => setTab(t)}>
            {t === "log" ? "📝 Journal" : "📊 Statistiques"}
          </button>
        ))}
      </div>

      {tab === "log" && (
        <>
          {/* Filters */}
          <div style={styles.filters}>
            <select style={styles.filterInput} value={filter.vehicule} onChange={e => setFilter(f => ({ ...f, vehicule: e.target.value }))}>
              <option value="">Tous véhicules</option>
              {VEHICULES.map(v => <option key={v}>{v}</option>)}
            </select>
            <select style={styles.filterInput} value={filter.consommable} onChange={e => setFilter(f => ({ ...f, consommable: e.target.value }))}>
              <option value="">Tous consommables</option>
              {CONSOMMABLES.map(c => <option key={c}>{c}</option>)}
            </select>
            <input style={styles.filterInput} placeholder="Initiales…" value={filter.initiales}
              onChange={e => setFilter(f => ({ ...f, initiales: e.target.value }))} maxLength={4} />
          </div>

          {filtered.length === 0 ? (
            <div style={styles.emptyState}>Aucune sortie enregistrée pour l'instant.</div>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    {["Date", "Initiales", "Véhicule", "Consommable", "Qté", "Note", ""].map(h => (
                      <th key={h} style={styles.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s, i) => (
                    <tr key={s.id} style={i % 2 === 0 ? styles.trEven : styles.trOdd}>
                      <td style={styles.td}>{s.date}</td>
                      <td style={{ ...styles.td, ...styles.badge }}>{s.initiales}</td>
                      <td style={styles.td}>{s.vehicule}</td>
                      <td style={styles.td}>{s.consommable}</td>
                      <td style={{ ...styles.td, fontWeight: 700, color: "#e53e3e" }}>{s.quantite}</td>
                      <td style={{ ...styles.td, color: "#888", fontSize: 13 }}>{s.note || "—"}</td>
                      <td style={styles.td}>
                        <button style={styles.btnDelete} onClick={() => handleDelete(s.id)}>✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === "stats" && (
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <h3 style={styles.statTitle}>Top consommables sortis</h3>
            {topConsommables.map(([name, qty]) => (
              <div key={name} style={styles.statRow}>
                <span style={styles.statName}>{name}</span>
                <div style={styles.barOuter}>
                  <div style={{ ...styles.barInner, width: `${Math.round((qty / topConsommables[0][1]) * 100)}%` }} />
                </div>
                <span style={styles.statQty}>{qty}</span>
              </div>
            ))}
          </div>
          <div style={styles.statCard}>
            <h3 style={styles.statTitle}>Sorties par véhicule</h3>
            {Object.entries(statsVehicule).sort((a, b) => b[1] - a[1]).map(([v, qty]) => (
              <div key={v} style={styles.statRow}>
                <span style={styles.statName}>{v}</span>
                <div style={styles.barOuter}>
                  <div style={{ ...styles.barInner, background: "#3182ce", width: `${Math.round((qty / Math.max(...Object.values(statsVehicule))) * 100)}%` }} />
                </div>
                <span style={styles.statQty}>{qty}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("form");

  return (
    <div style={styles.root}>
      <nav style={styles.nav}>
        <span style={styles.navBrand}>🚑 StockAmbu</span>
        <div style={styles.navLinks}>
          <button style={{ ...styles.navBtn, ...(page === "form" ? styles.navBtnActive : {}) }} onClick={() => setPage("form")}>Sortie</button>
          <button style={{ ...styles.navBtn, ...(page === "admin" ? styles.navBtnActive : {}) }} onClick={() => setPage("admin")}>Admin</button>
        </div>
      </nav>
      {page === "form" ? <FormPage /> : <AdminPage />}
    </div>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = {
  root: { minHeight: "100vh", background: "#f0f4f8", fontFamily: "'Segoe UI', system-ui, sans-serif" },
  nav: { background: "#1a202c", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 },
  navBrand: { color: "#fff", fontWeight: 800, fontSize: 18, letterSpacing: "-0.5px" },
  navLinks: { display: "flex", gap: 8 },
  navBtn: { background: "transparent", border: "1px solid #4a5568", color: "#a0aec0", borderRadius: 8, padding: "6px 16px", cursor: "pointer", fontSize: 14, fontWeight: 600, transition: "all 0.15s" },
  navBtnActive: { background: "#e53e3e", border: "1px solid #e53e3e", color: "#fff" },

  formContainer: { maxWidth: 480, margin: "0 auto", padding: "24px 16px 48px" },
  formHeader: { textAlign: "center", marginBottom: 24 },
  redCross: { fontSize: 48, marginBottom: 8 },
  formTitle: { margin: 0, fontSize: 26, fontWeight: 800, color: "#1a202c" },
  formSub: { margin: "6px 0 0", color: "#718096", fontSize: 14 },

  card: { background: "#fff", borderRadius: 16, padding: "24px 20px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" },
  field: { marginBottom: 16 },
  label: { display: "block", fontSize: 13, fontWeight: 700, color: "#4a5568", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" },
  input: { width: "100%", padding: "10px 14px", border: "1.5px solid #e2e8f0", borderRadius: 10, fontSize: 15, color: "#1a202c", background: "#f7fafc", boxSizing: "border-box", outline: "none", fontFamily: "inherit" },

  qtyRow: { display: "flex", alignItems: "center", gap: 8 },
  qtyBtn: { width: 40, height: 40, borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#edf2f7", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#2d3748", flexShrink: 0 },
  qtyInput: { textAlign: "center", width: "auto", flex: 1 },

  btnPrimary: { width: "100%", padding: "13px", background: "#e53e3e", color: "#fff", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 800, cursor: "pointer", marginTop: 8, letterSpacing: "0.02em" },
  errorBanner: { background: "#fff5f5", border: "1px solid #fc8181", color: "#c53030", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 14 },

  successScreen: { textAlign: "center", padding: "80px 24px" },
  successIcon: { width: 80, height: 80, borderRadius: "50%", background: "#38a169", color: "#fff", fontSize: 40, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" },
  successTitle: { fontSize: 28, fontWeight: 800, color: "#1a202c", margin: "0 0 12px" },
  successSub: { color: "#718096", lineHeight: 1.7, marginBottom: 32 },

  adminContainer: { maxWidth: 900, margin: "0 auto", padding: "24px 16px 48px" },
  adminHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 },
  adminTitle: { margin: 0, fontSize: 24, fontWeight: 800, color: "#1a202c" },
  adminSub: { margin: "4px 0 0", color: "#718096", fontSize: 14 },
  btnExport: { background: "#2b6cb0", color: "#fff", border: "none", borderRadius: 10, padding: "10px 18px", cursor: "pointer", fontSize: 14, fontWeight: 700 },

  tabs: { display: "flex", gap: 8, marginBottom: 20 },
  tab: { padding: "8px 18px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 14, color: "#4a5568" },
  tabActive: { background: "#1a202c", color: "#fff", border: "1.5px solid #1a202c" },

  filters: { display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" },
  filterInput: { flex: 1, minWidth: 130, padding: "8px 12px", border: "1.5px solid #e2e8f0", borderRadius: 10, fontSize: 14, background: "#fff", fontFamily: "inherit" },

  tableWrapper: { overflowX: "auto", borderRadius: 14, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" },
  table: { width: "100%", borderCollapse: "collapse", background: "#fff", borderRadius: 14 },
  th: { padding: "12px 14px", textAlign: "left", fontSize: 12, fontWeight: 800, color: "#718096", textTransform: "uppercase", letterSpacing: "0.06em", background: "#f7fafc", borderBottom: "2px solid #e2e8f0" },
  td: { padding: "11px 14px", fontSize: 14, color: "#2d3748", borderBottom: "1px solid #f0f4f8" },
  trEven: { background: "#fff" },
  trOdd: { background: "#f7fafc" },
  badge: { fontWeight: 800, color: "#1a202c" },
  btnDelete: { background: "none", border: "none", color: "#fc8181", cursor: "pointer", fontSize: 16, padding: "2px 6px", borderRadius: 6 },
  emptyState: { textAlign: "center", padding: "60px 20px", color: "#a0aec0", fontSize: 16 },

  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 },
  statCard: { background: "#fff", borderRadius: 14, padding: "20px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" },
  statTitle: { margin: "0 0 16px", fontSize: 14, fontWeight: 800, color: "#4a5568", textTransform: "uppercase", letterSpacing: "0.06em" },
  statRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 10 },
  statName: { fontSize: 13, color: "#2d3748", width: 140, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  barOuter: { flex: 1, height: 8, background: "#edf2f7", borderRadius: 4, overflow: "hidden" },
  barInner: { height: "100%", background: "#e53e3e", borderRadius: 4, transition: "width 0.4s" },
  statQty: { fontSize: 13, fontWeight: 800, color: "#1a202c", width: 32, textAlign: "right" },
};
