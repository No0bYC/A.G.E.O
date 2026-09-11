import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase.js";
import { C, IconBadge, Field, PrimaryButton, inputCls, inputStyle } from "../components/ui.jsx";
import HostActivitiesPanel from "../components/HostActivitiesPanel.jsx";
import OverviewPanel from "../components/host/OverviewPanel.jsx";
import RoomsPanel from "../components/host/RoomsPanel.jsx";
import ServicesPanel from "../components/host/ServicesPanel.jsx";
import ReviewsPanel from "../components/host/ReviewsPanel.jsx";
import SettingsPanel from "../components/host/SettingsPanel.jsx";
import {
  ShieldCheck, LogOut, KeyRound, Home, Wrench, MapPin, Star, Settings as SettingsIcon,
  LayoutDashboard, Copy, Pencil, Ban, Check, X,
} from "lucide-react";

function todayStr() { return new Date().toISOString().slice(0, 10); }
function addDays(dateStr, n) { const d = new Date(dateStr + "T00:00:00"); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }

const TABS = [
  { key: "overview", label: "Vue d'ensemble", icon: LayoutDashboard },
  { key: "rooms", label: "Pièces", icon: Home },
  { key: "services", label: "Services", icon: Wrench },
  { key: "codes", label: "Codes", icon: KeyRound },
  { key: "activites", label: "Bons plans", icon: MapPin },
  { key: "reviews", label: "Avis", icon: Star },
  { key: "settings", label: "Réglages", icon: SettingsIcon },
];

function CodeRow({ c, onChanged }) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(c.label || "");
  const [checkIn, setCheckIn] = useState(c.check_in);
  const [checkOut, setCheckOut] = useState(c.check_out);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  function copyCode() {
    if (!c.code_plain) return;
    navigator.clipboard.writeText(c.code_plain);
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  }
  async function saveEdit(e) {
    e.preventDefault(); setBusy(true);
    const { error } = await supabase.from("access_codes").update({ label: label.trim() || null, check_in: checkIn, check_out: checkOut }).eq("id", c.id);
    setBusy(false);
    if (!error) { setEditing(false); onChanged(); }
  }
  async function revoke() {
    await supabase.from("access_codes").update({ status: "revoked" }).eq("id", c.id);
    onChanged();
  }

  const statusLabel = c.status === "used" ? "Actif" : c.status === "revoked" ? "Révoqué" : "En attente";
  const statusColor = c.status === "used" ? C.sage : c.status === "revoked" ? C.danger : C.canaryDeep;
  const statusBg = c.status === "used" ? "#3FA37722" : c.status === "revoked" ? "#C24A2E22" : C.canaryWash;

  if (editing) {
    return (
      <form onSubmit={saveEdit} className="rounded-2xl border p-3" style={{ borderColor: C.sky, background: C.white }}>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className={inputCls} style={inputStyle} />
          <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className={inputCls} style={inputStyle} />
        </div>
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Note" className={inputCls} style={{ ...inputStyle, marginBottom: 8 }} />
        <div className="flex gap-2">
          <button type="button" onClick={() => setEditing(false)} className="rounded-full font-bold text-xs px-4 py-2 border" style={{ borderColor: C.line, color: C.ink }}>Annuler</button>
          <PrimaryButton type="submit" full disabled={busy}>{busy ? "..." : "Enregistrer"}</PrimaryButton>
        </div>
      </form>
    );
  }

  return (
    <div className="rounded-2xl border p-3" style={{ borderColor: C.line, background: C.white }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <IconBadge icon={KeyRound} size={32} />
          <div>{c.label && <p className="text-sm font-bold" style={{ color: C.ink }}>{c.label}</p>}<p className="text-xs" style={{ color: C.ink, opacity: 0.5 }}>{c.check_in} → {c.check_out}</p></div>
        </div>
        <span className="text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap" style={{ background: statusBg, color: statusColor }}>{statusLabel}</span>
      </div>
      <div className="flex items-center justify-between pt-2" style={{ borderTop: `1px solid ${C.line}` }}>
        {c.code_plain ? (
          <button onClick={copyCode} className="flex items-center gap-2">
            <span className="ageo-display text-lg tracking-widest" style={{ color: C.sky }}>{c.code_plain}</span>
            {copied ? <Check size={14} color={C.sage} /> : <Copy size={13} color={C.sky} style={{ opacity: 0.6 }} />}
          </button>
        ) : (
          <span className="text-xs" style={{ color: C.ink, opacity: 0.4 }}>Code généré avant cette mise à jour — non disponible</span>
        )}
        <div className="flex gap-3">
          <button onClick={() => setEditing(true)} aria-label="Modifier"><Pencil size={14} color={C.ink} style={{ opacity: 0.5 }} /></button>
          {c.status !== "revoked" && <button onClick={revoke} aria-label="Révoquer"><Ban size={14} color={C.danger} /></button>}
        </div>
      </div>
    </div>
  );
}

function CodesTab({ propertyId }) {
  const [codes, setCodes] = useState([]);
  const [label, setLabel] = useState("");
  const [checkIn, setCheckIn] = useState(todayStr());
  const [checkOut, setCheckOut] = useState(addDays(todayStr(), 3));
  const [lastCode, setLastCode] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function reload() {
    supabase.from("access_codes").select("id, label, check_in, check_out, status, code_plain, created_at").eq("property_id", propertyId).order("created_at", { ascending: false }).then(({ data }) => setCodes(data || []));
  }
  useEffect(reload, [propertyId, lastCode]);

  async function generate(e) {
    e.preventDefault(); setError("");
    if (checkOut < checkIn) { setError("La date de départ doit suivre l'arrivée."); return; }
    setBusy(true);
    try {
      const { data, error: rpcError } = await supabase.rpc("generate_access_code", { p_property_id: propertyId, p_label: label.trim(), p_check_in: checkIn, p_check_out: checkOut });
      if (rpcError) throw rpcError;
      if (!data.ok) { setError("Vous n'êtes pas autorisé à générer un code pour cette propriété."); return; }
      setLastCode(data.code); setLabel("");
    } catch (err) { console.error(err); setError("Une erreur est survenue."); }
    finally { setBusy(false); }
  }

  return (
    <div style={{ maxWidth: 480 }}>
      <h2 className="ageo-display text-xl mb-1" style={{ color: C.ink }}>Codes</h2>
      <p className="text-xs mb-4" style={{ color: C.ink, opacity: 0.6 }}>Générez un code par réservation, à transmettre avant l'arrivée.</p>
      <form onSubmit={generate} className="rounded-2xl border p-4 mb-6" style={{ borderColor: C.line, background: C.white }}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Arrivée"><input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className={inputCls} style={inputStyle} /></Field>
          <Field label="Départ"><input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className={inputCls} style={inputStyle} /></Field>
        </div>
        <Field label="Note (optionnel)"><input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ex. Famille Dupont" className={inputCls} style={inputStyle} /></Field>
        {error && <p className="text-xs mb-3" style={{ color: C.danger }}>{error}</p>}
        <PrimaryButton type="submit" full disabled={busy}>{busy ? "..." : "Générer un code"}</PrimaryButton>
      </form>
      {lastCode && (<div className="rounded-2xl p-4 mb-6 text-center" style={{ background: C.skyWash }}><p className="text-xs font-bold mb-1" style={{ color: C.sky }}>Nouveau code à transmettre</p><p className="ageo-display text-3xl tracking-widest" style={{ color: C.sky }}>{lastCode}</p></div>)}
      <h3 className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: C.sky }}>Codes générés</h3>
      <div className="space-y-2">
        {codes.length === 0 && <p className="text-xs" style={{ color: C.ink, opacity: 0.5 }}>Aucun code pour le moment.</p>}
        {codes.map((c) => (<CodeRow key={c.id} c={c} onChanged={reload} />))}
      </div>
    </div>
  );
}

export default function HostDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [host, setHost] = useState(null);
  const [properties, setProperties] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("overview");
  const [newPropertyName, setNewPropertyName] = useState("");
  const [propBusy, setPropBusy] = useState(false);
  const [propError, setPropError] = useState("");

  useEffect(() => {
    (async () => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) { navigate("/hote"); return; }
      const user = userData.user;
      let { data: hostRow } = await supabase.from("hosts").select("*").eq("id", user.id).maybeSingle();
      if (!hostRow) {
        const fallbackName = (user.email || "Hôte").split("@")[0];
        const { data: created, error: createHostError } = await supabase.from("hosts").insert({ id: user.id, name: fallbackName, email: user.email }).select().single();
        if (!createHostError) hostRow = created;
      }
      const { data: propRows, error: propErr } = await supabase.from("properties").select("*").eq("host_id", user.id).order("created_at");
      if (propErr) { setError("Impossible de charger vos propriétés."); setLoading(false); return; }
      setHost(hostRow); setProperties(propRows || []);
      if (propRows && propRows.length > 0) setSelectedId(propRows[0].id);
      setLoading(false);
    })();
  }, [navigate]);

  async function createFirstProperty(e) {
    e.preventDefault(); setPropError("");
    if (!newPropertyName.trim()) { setPropError("Donnez un nom à votre propriété."); return; }
    setPropBusy(true);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) { navigate("/hote"); return; }
      const { data, error: insertError } = await supabase.from("properties").insert({ host_id: userData.user.id, name: newPropertyName.trim() }).select().single();
      if (insertError) throw insertError;
      setProperties([data]); setSelectedId(data.id); setNewPropertyName("");
    } catch (err) { console.error(err); setPropError("Une erreur est survenue."); }
    finally { setPropBusy(false); }
  }

  function updatePropertyLocal(updated) { setProperties((prev) => prev.map((p) => (p.id === updated.id ? updated : p))); }
  function logout() { supabase.auth.signOut(); navigate("/"); }

  if (loading) return <div className="flex items-center justify-center" style={{ minHeight: "100vh" }}><p className="text-sm" style={{ color: C.ink, opacity: 0.5 }}>Chargement...</p></div>;

  const selectedProperty = properties.find((p) => p.id === selectedId);

  return (
    <div className="flex flex-col" style={{ minHeight: "100vh" }}>
      <header className="px-5 pt-6 pb-4" style={{ background: C.ink }}>
        <div className="flex items-center justify-between max-w-5xl mx-auto w-full">
          <div className="flex items-center gap-3">
            <IconBadge icon={ShieldCheck} size={40} tone="canary" />
            <div><p className="ageo-display text-lg leading-none" style={{ color: C.white }}>{host ? host.name : "Espace hôte"}</p><p className="text-xs mt-1" style={{ color: C.white, opacity: 0.6 }}>{properties.length} propriété{properties.length !== 1 ? "s" : ""}</p></div>
          </div>
          <button onClick={logout} aria-label="Se déconnecter"><LogOut size={18} color={C.white} style={{ opacity: 0.8 }} /></button>
        </div>
      </header>

      <main className="flex-1 px-5 py-5">
        <div className="max-w-5xl mx-auto">
          {properties.length === 0 ? (
            <div className="flex flex-col items-center text-center py-10 px-6 rounded-3xl" style={{ background: C.skyWash, maxWidth: 360, margin: "0 auto" }}>
              <IconBadge icon={Home} size={52} />
              <h2 className="ageo-display text-lg mt-4" style={{ color: C.ink }}>Créez votre première propriété</h2>
              <p className="text-xs mt-1 mb-5" style={{ color: C.ink, opacity: 0.6 }}>Donnez-lui un nom pour commencer — vous pourrez tout compléter ensuite.</p>
              <form onSubmit={createFirstProperty} className="w-full text-left">
                <Field label="Nom de la propriété"><input value={newPropertyName} onChange={(e) => setNewPropertyName(e.target.value)} placeholder="Ex. Villa Lagon Bleu" className={inputCls} style={inputStyle} /></Field>
                {propError && <p className="text-xs mb-3" style={{ color: C.danger }}>{propError}</p>}
                <PrimaryButton type="submit" full disabled={propBusy}>{propBusy ? "..." : "Créer ma propriété"}</PrimaryButton>
              </form>
            </div>
          ) : (
            <>
              {properties.length > 1 && (
                <div className="flex gap-2 mb-4 overflow-x-auto ageo-scroll pb-1">
                  {properties.map((p) => (<button key={p.id} onClick={() => setSelectedId(p.id)} className="text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap border" style={{ borderColor: selectedId === p.id ? C.sky : C.line, background: selectedId === p.id ? C.sky : C.white, color: selectedId === p.id ? C.white : C.ink }}>{p.name}</button>))}
                </div>
              )}
              <h2 className="ageo-display text-2xl mb-4" style={{ color: C.ink }}>{selectedProperty?.name}</h2>

              <div className="flex gap-1.5 mb-6 overflow-x-auto ageo-scroll pb-1">
                {TABS.map((t) => {
                  const active = tab === t.key; const Icon = t.icon;
                  return (
                    <button key={t.key} onClick={() => setTab(t.key)} className="flex items-center gap-1.5 rounded-full px-3.5 py-2 whitespace-nowrap shrink-0" style={{ background: active ? C.sky : C.white, border: active ? "none" : `1px solid ${C.line}`, boxShadow: active ? "none" : "0 1px 2px rgba(16,24,32,0.04)" }}>
                      <Icon size={14} color={active ? C.white : C.ink} style={{ opacity: active ? 1 : 0.55 }} />
                      <span className="text-xs font-bold" style={{ color: active ? C.white : C.ink, opacity: active ? 1 : 0.75 }}>{t.label}</span>
                    </button>
                  );
                })}
              </div>

              {tab === "overview" && <OverviewPanel propertyId={selectedId} onNavigate={setTab} />}
              {tab === "rooms" && <RoomsPanel propertyId={selectedId} />}
              {tab === "services" && <ServicesPanel propertyId={selectedId} />}
              {tab === "codes" && <CodesTab propertyId={selectedId} />}
              {tab === "activites" && <HostActivitiesPanel propertyId={selectedId} />}
              {tab === "reviews" && <ReviewsPanel propertyId={selectedId} />}
              {tab === "settings" && selectedProperty && <SettingsPanel property={selectedProperty} onUpdated={updatePropertyLocal} />}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
