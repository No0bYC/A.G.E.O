import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase.js";
import { C, IconBadge, PrimaryButton, inputCls, inputStyle } from "../ui.jsx";
import { Star, MessageCircle } from "lucide-react";

function StarRow({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (<Star key={i} size={14} fill={i <= rating ? C.canary : "none"} color={i <= rating ? C.canary : C.line} />))}
    </div>
  );
}

function ReviewRow({ fb, onRespond }) {
  const [response, setResponse] = useState(fb.response || "");
  const [editing, setEditing] = useState(!fb.response);
  async function submit(e) {
    e.preventDefault();
    await onRespond(fb.id, response.trim());
    setEditing(false);
  }
  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: C.line, background: C.white }}>
      <div className="flex items-center justify-between mb-1">
        <StarRow rating={fb.rating} />
        <span className="text-xs" style={{ color: C.ink, opacity: 0.45 }}>{fb.category}</span>
      </div>
      <p className="text-sm mt-2" style={{ color: C.ink, opacity: 0.85 }}>{fb.message}</p>
      {!editing && fb.response && (
        <div className="mt-3 pt-3 rounded-xl px-3 py-2" style={{ background: C.skyWash }}>
          <p className="text-xs font-bold mb-0.5" style={{ color: C.sky }}>Votre réponse</p>
          <p className="text-xs" style={{ color: C.ink, opacity: 0.75 }}>{fb.response}</p>
          <button onClick={() => setEditing(true)} className="text-xs font-bold underline mt-1" style={{ color: C.sky }}>Modifier</button>
        </div>
      )}
      {editing && (
        <form onSubmit={submit} className="mt-3 flex gap-2">
          <input value={response} onChange={(e) => setResponse(e.target.value)} placeholder="Répondre à cet avis..." className={inputCls} style={inputStyle} />
          <button type="submit" className="rounded-full font-bold text-xs px-4 shrink-0" style={{ background: C.canary, color: C.ink }}>Envoyer</button>
        </form>
      )}
    </div>
  );
}

export default function ReviewsPanel({ propertyId }) {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);

  async function reload() {
    const { data } = await supabase.from("feedback").select("*").eq("property_id", propertyId).order("created_at", { ascending: false });
    setFeedback(data || []); setLoading(false);
  }
  useEffect(() => { reload(); }, [propertyId]);

  async function respond(id, response) {
    await supabase.from("feedback").update({ response }).eq("id", id);
    reload();
  }

  if (loading) return <p className="text-sm" style={{ color: C.ink, opacity: 0.5 }}>Chargement...</p>;

  const avg = feedback.length ? (feedback.reduce((s, f) => s + f.rating, 0) / feedback.length).toFixed(1) : null;

  return (
    <div>
      <h2 className="ageo-display text-xl mb-1" style={{ color: C.ink }}>Avis</h2>
      <p className="text-xs mb-5" style={{ color: C.ink, opacity: 0.6 }}>Retours de vos voyageurs, avec réponse possible.</p>

      {avg && (
        <div className="rounded-2xl p-4 mb-5 flex items-center gap-4" style={{ background: C.canaryWash }}>
          <p className="ageo-display text-3xl" style={{ color: C.canaryDeep }}>{avg}</p>
          <div><StarRow rating={Math.round(avg)} /><p className="text-xs mt-1" style={{ color: C.ink, opacity: 0.6 }}>{feedback.length} avis</p></div>
        </div>
      )}

      {feedback.length === 0 ? (
        <div className="flex flex-col items-center py-10 text-center rounded-3xl" style={{ background: C.skyWash }}>
          <IconBadge icon={MessageCircle} size={48} />
          <p className="text-sm mt-3 font-bold" style={{ color: C.ink }}>Aucun avis pour l'instant</p>
        </div>
      ) : (
        <div className="space-y-2">{feedback.map((fb) => (<ReviewRow key={fb.id} fb={fb} onRespond={respond} />))}</div>
      )}
    </div>
  );
}
