import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase.js";
import { C, IconBadge, Field, PrimaryButton, inputCls, inputStyle } from "../components/ui.jsx";
import HostActivitiesPanel from "../components/HostActivitiesPanel.jsx";
import { ShieldCheck, LogOut, KeyRound, Home } from "lucide-react";

function todayStr() { return new Date().toISOString().slice(0, 10); }
function addDays(dateStr, n) { const d = new Date(dateStr + "T00:00:00"); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }

export default function HostDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [host, setHost] = useState(null);
  const [properties, setProperties] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [codes, setCodes] = useState([]);
  const [label, setLabel] = useState("");
  const [checkIn, setCheckIn] = useState(todayStr());
  const [checkOut, setCheckOut] = useState(addDays(todayStr(), 3));
  const [lastCode, setLastCode] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState("codes");
  const [newPropertyName, setNewPropertyName] = useState("");
  const [propBusy, setPropBusy] = useState(false);
  const [propError, setPropError] = useState("");

  useEffect(() => {
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) { navigate("/hote"); return; }
      const userId = sessionData.session.user.id;
      const [{ data: hostRow }, { data: propRows, error: propErr }] = await Promise.all([
        supabase.from("hosts").select("*").eq("id", userId).single(),
        supabase.from("properties").select("*").eq("host_id", userId).order("created_at"),
      ]);
      if (propErr) { setError("Impossible de charger vos propriétés."); setLoading(false); return; }
      setHost(hostRow); setProperties(propRows || []);
      if (propRows && propRows.length > 0) setSelectedId(propRows[0].id);
      setLoading(false);
    })();
  }, [navigate]);

  useEffect(() => {
    if (!selectedId) return;
    supabase.from("access_codes").select("id, label, check_in, check_out, status, created_at").eq("property_id", selectedId).order("created_at", { ascending: false }).then(({ data }) => setCodes(data || []));
  }, [selectedId, lastCode]);

  async function generate(e) {
    e.preventDefault(); setError("");
    if (checkOut < checkIn) { setError("La date de départ doit suivre l'arrivée."); return; }
    setBusy(true);
    try {
      const { data, error: rpcError } = await supabase.rpc("generate_access_code", { p_property_id: selectedId, p_label: label.trim(), p_check_in: checkIn, p_check_out: checkOut });
      if (rpcError) throw rpcError;
      if (!data.ok) { setError("Vous n'êtes pas autorisé à générer un code pour cette propriété."); return; }
      setLastCode(data.code); setLabel("");
    } catch (err) { console.error(err); setError("Une erreur est survenue."); }
    finally { setBusy(false); }
  }

  async function createFirstProperty(e) {
    e.preventDefault(); setPropError("");
    if (!newPropertyName.trim()) { setPropError("Donnez un nom à votre propriété."); return; }
    setPropBusy(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session.user.id;
      const { data, error: insertError } = await supabase.from("properties").insert({ host_id: userId, name: newPropertyName.trim() }).select().single();
      if (insertError) throw insertError;
      setProperties([data]); setSelectedId(data.id); setNewPropertyName("");
    } catch (err) { console.error(err); setPropError("Une erreur est survenue."); }
    finally { setPropBusy(false); }
  }

  function logout() { supabase.auth.signOut(); navigate("/"); }

  if (loading) return <div className="flex items-center justify-center" style={{ minHeight: "100vh" }}><p className="text-sm" style={{ color: C.ink, opacity: 0.5 }}>Chargement...</p></div>;

  const selectedProperty = properties.find((p) => p.id === selectedId);

  return (
    <div className="flex flex-col" style={{ minHeight: "100vh" }}>
      <header className="px-5 pt-6 pb-4" style={{ background: C.ink }}>
        <div className="flex items-center justify-between max-w-3xl mx-auto w-full">
          <div className="flex items-center gap-3">
            <IconBadge icon={ShieldCheck} size={40} tone="canary" />
            <div><p className="ageo-display text-lg leading-none" style={{ color: C.white }}>{host ? host.name : "Espace hôte"}</p><p className="text-xs mt-1" style={{ color: C.white, opacity: 0.6 }}>{properties.length} propriété{properties.length !== 1 ? "s" : ""}</p></div>
          </div>
          <button onClick={logout} aria-label="Se déconnecter"><LogOut size={18} color={C.white} style={{ opacity: 0.8 }} /></button>
        </div>
      </header>

      <main className="flex-1 px-5 py-5">
        <div className="max-w-3xl mx-auto">
          {properties.length === 0 ? (
            <div className="flex flex-col items-center text-center py-10 px-6 rounded-3xl" style={{ background: C.skyWash, maxWidth: 360, margin: "0 auto" }}>
              <IconBadge icon={Home} size={52} />
              <h2 className="ageo-display text-lg mt-4" style={{ color: C.ink }}>Créez votre première propriété</h2>
              <p className="text-xs mt-1 mb-5" style={{ color: C.ink, opacity: 0.6 }}>Donnez-lui un nom pour commencer — vous pourrez tout compléter ensuite (pièces, photos, inventaire).</p>
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
              <h2 className="ageo-display text-xl mb-1" style={{ color: C.ink }}>{selectedProperty?.name}</h2>
              <div className="flex gap-2 mb-5 border-b" style={{ borderColor: C.line }}>
                <button onClick={() => setTab("codes")} className="text-sm font-bold pb-2 px-1" style={{ color: tab === "codes" ? C.sky : C.ink, opacity: tab === "codes" ? 1 : 0.45, borderBottom: tab === "codes" ? `2px solid ${C.sky}` : "2px solid transparent" }}>Codes</button>
                <button onClick={() => setTab("activites")} className="text-sm font-bold pb-2 px-1" style={{ color: tab === "activites" ? C.sky : C.ink, opacity: tab === "activites" ? 1 : 0.45, borderBottom: tab === "activites" ? `2px solid ${C.sky}` : "2px solid transparent" }}>Bons plans</button>
              </div>
              {tab === "activites" ? (
                <HostActivitiesPanel propertyId={selectedId} />
              ) : (
                <>
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
                    {codes.map((c) => (
                      <div key={c.id} className="rounded-2xl border p-3 flex items-center justify-between" style={{ borderColor: C.line, background: C.white }}>
                        <div className="flex items-center gap-3"><IconBadge icon={KeyRound} size={32} /><div>{c.label && <p className="text-sm font-bold" style={{ color: C.ink }}>{c.label}</p>}<p className="text-xs" style={{ color: C.ink, opacity: 0.5 }}>{c.check_in} → {c.check_out}</p></div></div>
                        <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: c.status === "used" ? "#3FA37722" : C.canaryWash, color: c.status === "used" ? "#3FA377" : C.canaryDeep }}>{c.status === "used" ? "Actif" : c.status === "revoked" ? "Révoqué" : "En attente"}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
