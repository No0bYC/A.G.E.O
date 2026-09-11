import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase.js";
import { C, IconBadge, PrimaryButton, SecondaryButton, inputCls, inputStyle } from "../ui.jsx";
import { Plus, Wrench, Check, Clock, AlertCircle, X } from "lucide-react";

const STATUS_LABEL = { pending: "En attente", in_progress: "En cours", done: "Terminé" };
const STATUS_TONE = { pending: C.canaryDeep, in_progress: C.sky, done: C.sage };

function ServiceTypeChip({ st, onToggle }) {
  return (
    <button onClick={onToggle} className="flex items-center gap-2 rounded-full pl-2 pr-3 py-1.5 border" style={{ borderColor: st.enabled ? C.sky : C.line, background: st.enabled ? C.skyWash : C.white }}>
      <IconBadge icon={Wrench} size={22} />
      <span className="text-xs font-bold" style={{ color: st.enabled ? C.sky : C.ink, opacity: st.enabled ? 1 : 0.5 }}>{st.label}</span>
      <span className="text-xs font-bold" style={{ color: st.enabled ? C.sage : C.ink, opacity: st.enabled ? 1 : 0.35 }}>{st.enabled ? "Activé" : "Désactivé"}</span>
    </button>
  );
}

function RequestRow({ req, onUpdateStatus }) {
  return (
    <div className="rounded-2xl border p-3" style={{ borderColor: C.line, background: C.white }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <IconBadge icon={req.urgent ? AlertCircle : Wrench} size={32} tone={req.urgent ? "canary" : "sky"} />
          <div>
            <p className="text-sm font-bold" style={{ color: C.ink }}>{req.service_type_key}</p>
            <p className="text-xs mt-0.5" style={{ color: C.ink, opacity: 0.65 }}>{req.description}</p>
          </div>
        </div>
        <span className="text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap" style={{ background: `${STATUS_TONE[req.status]}22`, color: STATUS_TONE[req.status] }}>{STATUS_LABEL[req.status]}</span>
      </div>
      {req.status !== "done" && (
        <div className="flex gap-2 mt-3">
          {req.status === "pending" && <SecondaryButton onClick={() => onUpdateStatus(req.id, "in_progress")}>Prendre en charge</SecondaryButton>}
          <button onClick={() => onUpdateStatus(req.id, "done")} className="rounded-full font-bold text-sm py-2.5 px-5" style={{ background: C.sage, color: C.white }}>Marquer terminé</button>
        </div>
      )}
    </div>
  );
}

export default function ServicesPanel({ propertyId }) {
  const [loading, setLoading] = useState(true);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [requests, setRequests] = useState([]);
  const [newLabel, setNewLabel] = useState("");

  async function reload() {
    const [{ data: sts }, { data: reqs }] = await Promise.all([
      supabase.from("service_types").select("*").eq("property_id", propertyId).order("label"),
      supabase.from("service_requests").select("*").eq("property_id", propertyId).order("created_at", { ascending: false }),
    ]);
    setServiceTypes(sts || []); setRequests(reqs || []); setLoading(false);
  }
  useEffect(() => { reload(); }, [propertyId]);

  async function toggleType(st) {
    await supabase.from("service_types").update({ enabled: !st.enabled }).eq("id", st.id);
    reload();
  }
  async function addType(e) {
    e.preventDefault();
    if (!newLabel.trim()) return;
    const key = newLabel.trim().toLowerCase().replace(/\s+/g, "_");
    await supabase.from("service_types").insert({ property_id: propertyId, key, label: newLabel.trim(), enabled: true });
    setNewLabel(""); reload();
  }
  async function updateStatus(id, status) {
    await supabase.from("service_requests").update({ status }).eq("id", id);
    reload();
  }

  if (loading) return <p className="text-sm" style={{ color: C.ink, opacity: 0.5 }}>Chargement...</p>;

  const pending = requests.filter((r) => r.status !== "done");
  const done = requests.filter((r) => r.status === "done");

  return (
    <div>
      <h2 className="ageo-display text-xl mb-1" style={{ color: C.ink }}>Services</h2>
      <p className="text-xs mb-5" style={{ color: C.ink, opacity: 0.6 }}>Types de services proposés et demandes de vos voyageurs.</p>

      <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: C.sky }}>Types activés</p>
      <div className="flex flex-wrap gap-2 mb-3">
        {serviceTypes.map((st) => (<ServiceTypeChip key={st.id} st={st} onToggle={() => toggleType(st)} />))}
      </div>
      <form onSubmit={addType} className="flex gap-2 mb-6">
        <input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Nouveau type de service..." className={inputCls} style={inputStyle} />
        <button type="submit" className="rounded-full px-3 shrink-0" style={{ background: C.canary }} aria-label="Ajouter"><Plus size={16} color={C.ink} /></button>
      </form>

      <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: C.sky }}>Demandes en cours ({pending.length})</p>
      <div className="space-y-2 mb-6">
        {pending.length === 0 && <p className="text-xs" style={{ color: C.ink, opacity: 0.5 }}>Aucune demande en attente.</p>}
        {pending.map((r) => (<RequestRow key={r.id} req={r} onUpdateStatus={updateStatus} />))}
      </div>

      {done.length > 0 && (
        <>
          <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: C.sky }}>Historique</p>
          <div className="space-y-2">{done.slice(0, 10).map((r) => (<RequestRow key={r.id} req={r} onUpdateStatus={updateStatus} />))}</div>
        </>
      )}
    </div>
  );
}
