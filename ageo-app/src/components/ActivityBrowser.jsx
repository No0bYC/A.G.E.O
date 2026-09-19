import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase.js";
import { ACTIVITY_TYPES, REGIONS, typeInfo, accessInfo, activityPhotoUrl } from "../lib/activities.js";
import { C, IconBadge, EmptyState } from "./ui.jsx";
import { MapPin, ExternalLink, X, Waves, Clock, Users, CloudSun, Backpack, Navigation } from "lucide-react";

function Chip({ active, onClick, children, icon: Icon }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1.5 rounded-full px-3 py-1.5 border whitespace-nowrap shrink-0"
      style={{ borderColor: active ? C.sky : C.line, background: active ? C.sky : C.white }}>
      {Icon && <Icon size={13} color={active ? C.white : C.ink} style={{ opacity: active ? 1 : 0.55 }} />}
      <span className="text-xs font-bold" style={{ color: active ? C.white : C.ink, opacity: active ? 1 : 0.75 }}>{children}</span>
    </button>
  );
}

function ActivityCard({ activity, onOpen }) {
  const info = typeInfo(activity.type); const TIcon = info.icon;
  return (
    <button onClick={onOpen} className="text-left rounded-3xl overflow-hidden ageo-card">
      <div className="flex items-center justify-center relative" style={{ height: 100, background: C.skyWash }}>
        {activity.photoUrl ? <img src={activity.photoUrl} alt={activity.name} className="w-full h-full object-cover" /> : <TIcon size={28} color={C.sky} />}
        {activity.duration && (
          <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full px-2 py-1" style={{ background: "rgba(28,31,38,0.65)" }}>
            <Clock size={10} color={C.white} />
            <span className="text-xs font-bold" style={{ color: C.white }}>{activity.duration.split(" ")[0]}</span>
          </span>
        )}
      </div>
      <div className="px-3 py-2.5">
        <p className="text-sm font-bold leading-snug" style={{ color: C.ink }}>{activity.name}</p>
        <div className="flex items-center gap-1 mt-1.5 min-w-0">
          <span className="text-xs font-bold px-1.5 py-0.5 rounded-full shrink-0" style={{ background: C.canaryWash, color: C.canaryDeep }}>{activity.region}</span>
          <span className="text-xs truncate" style={{ color: C.ink, opacity: 0.45 }}>{info.label}</span>
        </div>
      </div>
    </button>
  );
}

function InfoRow({ icon: Icon, label, value, muted }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2.5">
      <IconBadge icon={Icon} size={30} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold uppercase tracking-wide" style={{ color: C.sky, opacity: 0.8 }}>{label}</p>
        <p className="text-sm mt-0.5" style={{ color: C.ink, opacity: muted ? 0.4 : 0.85, fontStyle: muted ? "italic" : "normal" }}>{value}</p>
      </div>
    </div>
  );
}

function ActivityDetailSheet({ activity, onClose }) {
  const info = typeInfo(activity.type); const TIcon = info.icon;
  const access = accessInfo(activity.access_level);
  const hasPracticalInfo = activity.duration || activity.access_level || activity.optimal_weather || activity.equipment;
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" style={{ background: "rgba(28,31,38,0.4)" }} onClick={onClose}>
      <div className="ageo-sheet rounded-t-3xl" style={{ background: C.white, maxHeight: "88vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto mt-3 rounded-full" style={{ width: 36, height: 4, background: C.line }} />
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wide" style={{ color: C.sky }}>Bon plan</span>
            <button onClick={onClose} aria-label="Fermer"><X size={18} color={C.ink} style={{ opacity: 0.5 }} /></button>
          </div>
          <div className="rounded-2xl overflow-hidden mb-4" style={{ aspectRatio: "16/9", background: C.skyWash }}>
            {activity.photoUrl ? <img src={activity.photoUrl} alt="" className="w-full h-full object-cover" /> : (<div className="w-full h-full flex items-center justify-center"><TIcon size={40} color={C.sky} /></div>)}
          </div>
          <h2 className="ageo-display text-xl mb-2" style={{ color: C.ink }}>{activity.name}</h2>
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: C.canaryWash, color: C.canaryDeep }}>{activity.region}</span>
            <span className="text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1" style={{ background: C.skyWash, color: C.sky }}><TIcon size={12} /> {info.label}</span>
          </div>
          {activity.description && <p className="text-sm mb-5" style={{ color: C.ink, opacity: 0.75, lineHeight: 1.5 }}>{activity.description}</p>}

          {hasPracticalInfo && (
            <>
              <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: C.ink, opacity: 0.4 }}>Infos pratiques</p>
              <div className="rounded-2xl mb-5" style={{ background: C.neutral, padding: "4px 14px" }}>
                <InfoRow icon={Clock} label="Durée" value={activity.duration} />
                <InfoRow icon={Users} label="Accessibilité" value={activity.access_level && access.label} />
                <InfoRow icon={CloudSun} label="Météo optimale" value={activity.optimal_weather} />
                <InfoRow icon={Backpack} label="À prévoir" value={activity.equipment} />
                <InfoRow icon={Navigation} label="Distance du logement" value="Calculée à l'arrivée" muted />
              </div>
            </>
          )}

          <div className="space-y-2">
            {activity.maps_url && <a href={activity.maps_url} target="_blank" rel="noreferrer" className="w-full flex items-center justify-center gap-2 rounded-full font-bold text-sm py-2.5" style={{ background: C.canary, color: C.ink }}><MapPin size={15} /> Voir sur Google Maps</a>}
            {activity.ref_url && <a href={activity.ref_url} target="_blank" rel="noreferrer" className="w-full flex items-center justify-center gap-2 rounded-full font-bold text-sm py-2.5 border" style={{ borderColor: C.sky, color: C.sky }}><ExternalLink size={14} /> Site de référence</a>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ActivityBrowser({ propertyId }) {
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState([]);
  const [regionFilter, setRegionFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [openId, setOpenId] = useState(null);
  useEffect(() => {
    if (!propertyId) return;
    (async () => {
      const [{ data: picks, error: pickErr }, { data: custom, error: customErr }] = await Promise.all([
        supabase.from("property_activity_picks").select("activity_catalog(*)").eq("property_id", propertyId),
        supabase.from("property_custom_activities").select("*").eq("property_id", propertyId),
      ]);
      if (pickErr) console.error(pickErr);
      if (customErr) console.error(customErr);
      const fromCatalog = (picks || []).map((p) => ({ ...p.activity_catalog, source: "catalog" }));
      const fromCustom = (custom || []).map((a) => ({ ...a, source: "custom" }));
      const merged = [...fromCatalog, ...fromCustom];
      const withPhotos = await Promise.all(merged.map(async (a) => ({ ...a, photoUrl: await activityPhotoUrl(a) })));
      setActivities(withPhotos); setLoading(false);
    })();
  }, [propertyId]);
  const filtered = activities.filter((a) => (regionFilter === "all" || a.region === regionFilter) && (typeFilter === "all" || a.type === typeFilter));
  const openActivity = activities.find((a) => a.id === openId);
  if (loading) return <p className="text-sm text-center py-10" style={{ color: C.ink, opacity: 0.5 }}>Chargement...</p>;
  if (activities.length === 0) return <EmptyState icon={MapPin} title="Aucun bon plan pour l'instant" subtitle="Votre hôte n'a pas encore sélectionné d'activités." />;
  return (
    <>
      <h2 className="ageo-display text-xl mb-1" style={{ color: C.ink }}>Bons plans</h2>
      <p className="text-xs mb-4" style={{ color: C.ink, opacity: 0.6 }}>Les incontournables sélectionnés par votre hôte.</p>
      <div className="flex gap-2 overflow-x-auto ageo-scroll pb-1 mb-2">
        <Chip active={regionFilter === "all"} onClick={() => setRegionFilter("all")}>Toutes régions</Chip>
        {REGIONS.map((r) => (<Chip key={r} active={regionFilter === r} onClick={() => setRegionFilter(r)}>{r}</Chip>))}
      </div>
      <div className="flex gap-2 overflow-x-auto ageo-scroll pb-1 mb-4">
        <Chip active={typeFilter === "all"} onClick={() => setTypeFilter("all")}>Tous types</Chip>
        {ACTIVITY_TYPES.map((t) => (<Chip key={t.key} active={typeFilter === t.key} onClick={() => setTypeFilter(t.key)} icon={t.icon}>{t.label}</Chip>))}
      </div>
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center py-10 text-center"><IconBadge icon={Waves} size={48} /><p className="text-sm mt-3" style={{ color: C.ink, opacity: 0.5 }}>Aucune activité pour cette combinaison de filtres.</p></div>
      ) : (
        <div className="grid grid-cols-2 gap-3">{filtered.map((a) => (<ActivityCard key={a.id} activity={a} onOpen={() => setOpenId(a.id)} />))}</div>
      )}
      {openActivity && <ActivityDetailSheet activity={openActivity} onClose={() => setOpenId(null)} />}
    </>
  );
}
