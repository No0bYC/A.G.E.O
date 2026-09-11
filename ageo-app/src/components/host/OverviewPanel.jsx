import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase.js";
import { C, IconBadge } from "../ui.jsx";
import { Home, Package, KeyRound, Wrench, Star, Users, AlertCircle } from "lucide-react";

function StatCard({ icon, label, value, tone = "sky" }) {
  return (
    <div className="ageo-card rounded-2xl p-4 flex items-center gap-3">
      <IconBadge icon={icon} size={40} tone={tone} />
      <div><p className="ageo-display text-2xl leading-none" style={{ color: C.ink }}>{value}</p><p className="text-xs mt-1" style={{ color: C.ink, opacity: 0.6 }}>{label}</p></div>
    </div>
  );
}

export default function OverviewPanel({ propertyId, onNavigate }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);

  useEffect(() => {
    (async () => {
      const today = new Date().toISOString().slice(0, 10);
      const [rooms, items, codes, guests, requests, feedback] = await Promise.all([
        supabase.from("rooms").select("id", { count: "exact", head: true }).eq("property_id", propertyId),
        supabase.from("items").select("id", { count: "exact", head: true }).eq("property_id", propertyId),
        supabase.from("access_codes").select("id", { count: "exact", head: true }).eq("property_id", propertyId).eq("status", "pending"),
        supabase.from("guest_accounts").select("id, check_in, check_out").eq("property_id", propertyId),
        supabase.from("service_requests").select("*").eq("property_id", propertyId).neq("status", "done").order("created_at", { ascending: false }).limit(5),
        supabase.from("feedback").select("rating").eq("property_id", propertyId),
      ]);
      const activeGuests = (guests.data || []).filter((g) => g.check_in <= today && g.check_out >= today).length;
      const avgRating = feedback.data && feedback.data.length ? (feedback.data.reduce((s, f) => s + f.rating, 0) / feedback.data.length).toFixed(1) : "—";
      setStats({
        rooms: rooms.count || 0, items: items.count || 0, pendingCodes: codes.count || 0,
        activeGuests, avgRating,
      });
      setPendingRequests(requests.data || []);
      setLoading(false);
    })();
  }, [propertyId]);

  if (loading || !stats) return <p className="text-sm" style={{ color: C.ink, opacity: 0.5 }}>Chargement...</p>;

  return (
    <div>
      <h2 className="ageo-display text-xl mb-1" style={{ color: C.ink }}>Vue d'ensemble</h2>
      <p className="text-xs mb-5" style={{ color: C.ink, opacity: 0.6 }}>L'essentiel de votre propriété en un coup d'œil.</p>

      <div className="grid gap-3 mb-6" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        <StatCard icon={Users} label="Voyageurs actuellement sur place" value={stats.activeGuests} tone="canary" />
        <StatCard icon={Home} label="Pièces configurées" value={stats.rooms} />
        <StatCard icon={Package} label="Objets d'inventaire" value={stats.items} />
        <StatCard icon={KeyRound} label="Codes en attente" value={stats.pendingCodes} tone="canary" />
        <StatCard icon={Star} label="Note moyenne" value={stats.avgRating} />
      </div>

      <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: C.sky }}>Demandes à traiter</p>
      {pendingRequests.length === 0 ? (
        <p className="text-xs" style={{ color: C.ink, opacity: 0.5 }}>Rien en attente — tout est à jour.</p>
      ) : (
        <div className="space-y-2">
          {pendingRequests.map((r) => (
            <button key={r.id} onClick={() => onNavigate("services")} className="w-full text-left rounded-2xl border p-3 flex items-center gap-3" style={{ borderColor: C.line, background: C.white }}>
              <IconBadge icon={r.urgent ? AlertCircle : Wrench} size={32} tone={r.urgent ? "canary" : "sky"} />
              <div className="flex-1 min-w-0"><p className="text-sm font-bold truncate" style={{ color: C.ink }}>{r.service_type_key}</p><p className="text-xs truncate" style={{ color: C.ink, opacity: 0.6 }}>{r.description}</p></div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
