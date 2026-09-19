import React, { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase.js";
import { ACTIVITY_TYPES, REGIONS, ACCESS_LEVELS, typeInfo, activityPhotoUrl, uploadActivityPhoto, setActivityPickPhoto, clearActivityPickPhoto } from "../lib/activities.js";
import { C, IconBadge, Field, PrimaryButton, SecondaryButton, inputCls, inputStyle } from "./ui.jsx";
import { Trash2, X, Check, Search, ArrowLeft, Waves, ImagePlus, Navigation, Image as ImageIcon, RotateCcw, Loader2 } from "lucide-react";

function Chip({ active, onClick, children, icon: Icon }) {
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-1.5 rounded-full px-3 py-1.5 border whitespace-nowrap shrink-0"
      style={{ borderColor: active ? C.sky : C.line, background: active ? C.sky : C.white }}>
      {Icon && <Icon size={13} color={active ? C.white : C.ink} style={{ opacity: active ? 1 : 0.55 }} />}
      <span className="text-xs font-bold" style={{ color: active ? C.white : C.ink, opacity: active ? 1 : 0.75 }}>{children}</span>
    </button>
  );
}
function mapsLink(name) { return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + " Mauritius")}`; }

function ActivityPickerModal({ catalog, pickedIds, onToggle, onClose }) {
  const [regionFilter, setRegionFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState(null);
  const atMax = pickedIds.length >= 10;
  const filtered = catalog.filter((a) => (regionFilter === "all" || a.region === regionFilter) && (typeFilter === "all" || a.type === typeFilter) && (search.trim() === "" || a.name.toLowerCase().includes(search.trim().toLowerCase())));
  async function handleToggle(activityId, isPicked) { setBusyId(activityId); await onToggle(activityId, isPicked); setBusyId(null); }
  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: C.white }}>
      <div className="px-5 pt-6 pb-3" style={{ boxShadow: "0 1px 0 rgba(16,24,32,0.07)" }}>
        <div className="flex items-center justify-between mb-3">
          <button onClick={onClose} aria-label="Fermer" style={{ color: C.ink, opacity: 0.5 }}><ArrowLeft size={20} /></button>
          <span className="ageo-display text-base" style={{ color: C.ink }}>Choisir dans la liste</span>
          <div style={{ width: 20 }} />
        </div>
        <div className="flex items-center justify-center mb-3">
          <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: atMax ? C.canaryWash : C.skyWash, color: atMax ? C.canaryDeep : C.sky }}>{pickedIds.length} / 10 sélectionnées{atMax ? " — limite atteinte" : ""}</span>
        </div>
        <div className="relative mb-3">
          <Search size={15} color={C.ink} style={{ opacity: 0.4, position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher une activité..." className="w-full rounded-full border pl-9 pr-3 py-2 text-sm outline-none" style={{ borderColor: C.line, color: C.ink, background: C.neutral }} />
        </div>
        <div className="flex gap-2 overflow-x-auto ageo-scroll pb-1 mb-2">
          <Chip active={regionFilter === "all"} onClick={() => setRegionFilter("all")}>Toutes régions</Chip>
          {REGIONS.map((r) => (<Chip key={r} active={regionFilter === r} onClick={() => setRegionFilter(r)}>{r}</Chip>))}
        </div>
        <div className="flex gap-2 overflow-x-auto ageo-scroll pb-1">
          <Chip active={typeFilter === "all"} onClick={() => setTypeFilter("all")}>Tous types</Chip>
          {ACTIVITY_TYPES.map((t) => (<Chip key={t.key} active={typeFilter === t.key} onClick={() => setTypeFilter(t.key)} icon={t.icon}>{t.label}</Chip>))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto ageo-scroll px-5 py-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-center"><IconBadge icon={Search} size={44} /><p className="text-sm mt-3" style={{ color: C.ink, opacity: 0.5 }}>Aucun résultat.</p></div>
        ) : (
          <div className="grid grid-cols-2 gap-3 max-w-3xl mx-auto">
            {filtered.map((a) => {
              const info = typeInfo(a.type); const TIcon = info.icon; const isPicked = pickedIds.includes(a.id); const disabled = (!isPicked && atMax) || busyId === a.id;
              return (
                <button key={a.id} type="button" onClick={() => !disabled && handleToggle(a.id, isPicked)} disabled={disabled} className="text-left rounded-3xl overflow-hidden ageo-card relative" style={{ opacity: !isPicked && atMax ? 0.4 : 1 }}>
                  <div className="flex items-center justify-center relative" style={{ height: 90, background: C.skyWash }}>
                    {a.photo_external_url ? <img src={a.photo_external_url} alt="" className="w-full h-full object-cover" /> : <TIcon size={26} color={C.sky} />}
                    <div className="absolute top-2 right-2 rounded-full flex items-center justify-center" style={{ width: 24, height: 24, background: isPicked ? C.sky : "rgba(255,255,255,0.85)" }}>{isPicked && <Check size={14} color={C.white} />}</div>
                  </div>
                  <div className="px-3 py-2.5"><p className="text-sm font-bold leading-snug" style={{ color: C.ink }}>{a.name}</p>
                    <div className="flex items-center gap-1 mt-1.5"><span className="text-xs font-bold px-1.5 py-0.5 rounded-full" style={{ background: C.canaryWash, color: C.canaryDeep }}>{a.region}</span><span className="text-xs" style={{ color: C.ink, opacity: 0.45 }}>{info.label}</span></div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
      <div className="px-5 py-4" style={{ boxShadow: "0 -1px 0 rgba(16,24,32,0.06)" }}><div className="max-w-3xl mx-auto"><PrimaryButton onClick={onClose} full>Valider ma sélection</PrimaryButton></div></div>
    </div>
  );
}
function ActivityFormModal({ propertyId, onClose, onSaved }) {
  const [name, setName] = useState(""); const [description, setDescription] = useState("");
  const [type, setType] = useState(ACTIVITY_TYPES[0].key); const [region, setRegion] = useState(REGIONS[0]);
  const [duration, setDuration] = useState(""); const [access, setAccess] = useState("tout_public");
  const [weather, setWeather] = useState(""); const [equipment, setEquipment] = useState("");
  const [mapsUrl, setMapsUrl] = useState(""); const [mapsTouched, setMapsTouched] = useState(false);
  const [refUrl, setRefUrl] = useState(""); const [file, setFile] = useState(null); const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  function handleNameChange(v) { setName(v); if (!mapsTouched) setMapsUrl(v ? mapsLink(v) : ""); }
  function handleFile(e) { const f = e.target.files && e.target.files[0]; if (!f) return; setFile(f); setPreview(URL.createObjectURL(f)); }
  async function submit(e) {
    e.preventDefault(); if (!name.trim()) return; setBusy(true); setError("");
    try {
      let photoPath = null; if (file) photoPath = await uploadActivityPhoto(propertyId, file);
      const { error: insertError } = await supabase.from("property_custom_activities").insert({
        property_id: propertyId, name: name.trim(), description: description.trim(), type, region,
        duration: duration.trim(), access_level: access, optimal_weather: weather.trim(), equipment: equipment.trim(),
        maps_url: mapsUrl || mapsLink(name), ref_url: refUrl.trim(), photo_path: photoPath,
      });
      if (insertError) throw insertError;
      onSaved();
    } catch (err) { console.error(err); setError("Une erreur est survenue."); }
    finally { setBusy(false); }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(28,31,38,0.5)" }} onClick={onClose}>
      <form onSubmit={submit} className="rounded-3xl w-full overflow-y-auto ageo-scroll" style={{ background: C.white, maxWidth: 480, maxHeight: "88vh" }} onClick={(e) => e.stopPropagation()}>
        <div className="p-5">
          <div className="flex items-center justify-between mb-4"><span className="ageo-display text-lg" style={{ color: C.ink }}>Nouvelle activité</span><button onClick={onClose} aria-label="Fermer" type="button"><X size={18} color={C.ink} style={{ opacity: 0.5 }} /></button></div>
          <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: C.sky }}>Photo</p>
          <label className="rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer mb-4 overflow-hidden" style={{ aspectRatio: "16/9", background: C.skyWash, border: preview ? "none" : `1.5px dashed ${C.sky}` }}>
            {preview ? <img src={preview} alt="" className="w-full h-full object-cover" /> : (<><ImagePlus size={26} color={C.sky} /><span className="text-xs font-bold" style={{ color: C.sky }}>Ajouter une photo</span></>)}
            <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
          </label>
          <Field label="Nom de l'activité"><input value={name} onChange={(e) => handleNameChange(e.target.value)} placeholder="Ex. Île aux Cerfs" className={inputCls} style={inputStyle} required /></Field>
          <Field label="Description générale"><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Une ou deux phrases pour donner envie..." className={inputCls} style={{ ...inputStyle, resize: "none" }} /></Field>
          <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: C.sky }}>Type d'activité</p>
          <div className="flex flex-wrap gap-2 mb-4">{ACTIVITY_TYPES.map((t) => (<Chip key={t.key} active={type === t.key} onClick={() => setType(t.key)} icon={t.icon}>{t.label}</Chip>))}</div>
          <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: C.sky }}>Région</p>
          <div className="flex flex-wrap gap-2 mb-4">{REGIONS.map((r) => (<Chip key={r} active={region === r} onClick={() => setRegion(r)}>{r}</Chip>))}</div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <Field label="Durée (approx.)"><input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="Ex. 2h à 3h" className={inputCls} style={inputStyle} /></Field>
            <Field label="Météo optimale"><input value={weather} onChange={(e) => setWeather(e.target.value)} placeholder="Ex. Journée sèche" className={inputCls} style={inputStyle} /></Field>
          </div>
          <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: C.sky }}>Accessibilité</p>
          <div className="flex flex-wrap gap-2 mb-4">{ACCESS_LEVELS.map((a) => (<Chip key={a.key} active={access === a.key} onClick={() => setAccess(a.key)}>{a.label}</Chip>))}</div>
          <Field label="Équipements à prévoir"><input value={equipment} onChange={(e) => setEquipment(e.target.value)} placeholder="Ex. Maillot, crème solaire, chaussures fermées" className={inputCls} style={inputStyle} /></Field>

          <div className="rounded-xl px-3 py-2.5 mb-4 flex items-center gap-2" style={{ background: C.neutral }}>
            <Navigation size={15} color={C.ink} style={{ opacity: 0.4 }} />
            <p className="text-xs" style={{ color: C.ink, opacity: 0.5 }}>Distance du logement — calculée automatiquement, rien à saisir ici.</p>
          </div>

          <Field label="Lien Google Maps"><input value={mapsUrl} onChange={(e) => { setMapsUrl(e.target.value); setMapsTouched(true); }} className={inputCls} style={inputStyle} /></Field>
          <Field label="Site de référence"><input value={refUrl} onChange={(e) => setRefUrl(e.target.value)} placeholder="https://..." className={inputCls} style={inputStyle} /></Field>
          {error && <p className="text-xs mb-3" style={{ color: C.danger }}>{error}</p>}
          <PrimaryButton type="submit" full disabled={busy}>{busy ? "..." : "Créer l'activité"}</PrimaryButton>
        </div>
      </form>
    </div>
  );
}
function HostActivityRow({ activity, source, propertyId, onUpdated, onRemove }) {
  const info = typeInfo(activity.type); const TIcon = info.icon; const [photoUrl, setPhotoUrl] = useState(null);
  const fileInputRef = useRef(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  useEffect(() => { activityPhotoUrl(activity).then(setPhotoUrl); }, [activity.photo_path, activity.photo_external_url, activity.override_photo_path]);

  async function handlePhotoChange(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setPhotoBusy(true);
    try {
      await setActivityPickPhoto(propertyId, activity.id, file);
      await onUpdated();
    } catch (err) {
      console.error(err);
      alert("Impossible de mettre à jour la photo pour le moment.");
    } finally {
      setPhotoBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handlePhotoReset() {
    setPhotoBusy(true);
    try {
      await clearActivityPickPhoto(propertyId, activity.id);
      await onUpdated();
    } catch (err) {
      console.error(err);
      alert("Impossible de réinitialiser la photo pour le moment.");
    } finally {
      setPhotoBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border p-3 flex items-center gap-3" style={{ borderColor: C.line, background: C.white }}>
      <div className="rounded-xl overflow-hidden shrink-0 flex items-center justify-center" style={{ width: 52, height: 52, background: C.skyWash }}>{photoUrl ? <img src={photoUrl} alt="" className="w-full h-full object-cover" /> : <TIcon size={20} color={C.sky} />}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold truncate" style={{ color: C.ink }}>{activity.name}</p>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-xs font-bold px-1.5 py-0.5 rounded-full" style={{ background: C.canaryWash, color: C.canaryDeep }}>{activity.region}</span>
          <span className="text-xs" style={{ color: C.ink, opacity: 0.45 }}>{info.label}</span>
          <span className="text-xs font-bold" style={{ color: source === "custom" ? C.sage : C.sky, opacity: 0.8 }}>{source === "custom" ? "· Créée par vous" : "· Depuis la liste"}</span>
        </div>
        {source === "picked" && (
          <div className="flex items-center gap-2 mt-2">
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            <button
              type="button"
              disabled={photoBusy}
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg border"
              style={{ borderColor: C.line, color: C.ink, opacity: photoBusy ? 0.5 : 0.75 }}
            >
              {photoBusy ? <Loader2 size={12} className="animate-spin" /> : <ImageIcon size={12} />}
              {activity.override_photo_path ? "Changer la photo" : "Ajouter une photo"}
            </button>
            {activity.override_photo_path && (
              <button
                type="button"
                disabled={photoBusy}
                onClick={handlePhotoReset}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg border"
                style={{ borderColor: C.line, color: C.ink, opacity: photoBusy ? 0.5 : 0.55 }}
              >
                <RotateCcw size={12} />
                Réinitialiser
              </button>
            )}
          </div>
        )}
      </div>
      <button onClick={onRemove} aria-label="Retirer" className="shrink-0"><Trash2 size={16} color={C.danger} /></button>
    </div>
  );
}
export default function HostActivitiesPanel({ propertyId }) {
  const [loading, setLoading] = useState(true);
  const [catalog, setCatalog] = useState([]); const [pickedIds, setPickedIds] = useState([]); const [pickPhotos, setPickPhotos] = useState({}); const [customActivities, setCustomActivities] = useState([]);
  const [showForm, setShowForm] = useState(false); const [showPicker, setShowPicker] = useState(false);
  async function reload() {
    const [{ data: catalogRows }, { data: picks }, { data: custom }] = await Promise.all([
      supabase.from("activity_catalog").select("*").order("name"),
      supabase.from("property_activity_picks").select("activity_id, photo_path").eq("property_id", propertyId),
      supabase.from("property_custom_activities").select("*").eq("property_id", propertyId).order("created_at", { ascending: false }),
    ]);
    setCatalog(catalogRows || []);
    setPickedIds((picks || []).map((p) => p.activity_id));
    setPickPhotos(Object.fromEntries((picks || []).map((p) => [p.activity_id, p.photo_path])));
    setCustomActivities(custom || []);
    setLoading(false);
  }
  useEffect(() => { if (propertyId) reload(); }, [propertyId]);
  async function togglePick(activityId, isPicked) {
    if (isPicked) { await supabase.rpc("remove_activity_pick", { p_property_id: propertyId, p_activity_id: activityId }); setPickedIds((prev) => prev.filter((id) => id !== activityId)); }
    else { const { data } = await supabase.rpc("add_activity_pick", { p_property_id: propertyId, p_activity_id: activityId }); if (data && data.ok) setPickedIds((prev) => [...prev, activityId]); }
  }
  async function removeCustom(id) { await supabase.from("property_custom_activities").delete().eq("id", id); setCustomActivities((prev) => prev.filter((a) => a.id !== id)); }
  if (loading) return <p className="text-sm" style={{ color: C.ink, opacity: 0.5 }}>Chargement...</p>;
  const pickedActivities = catalog
    .filter((a) => pickedIds.includes(a.id))
    .map((a) => ({ ...a, override_photo_path: pickPhotos[a.id] || null }));
  const combined = [...pickedActivities.map((a) => ({ activity: a, source: "picked" })), ...customActivities.map((a) => ({ activity: a, source: "custom" }))];
  return (
    <div>
      <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
        <h2 className="ageo-display text-xl" style={{ color: C.ink }}>Bons plans</h2>
        <div className="flex gap-2"><SecondaryButton onClick={() => setShowPicker(true)}>Choisir dans la liste</SecondaryButton><PrimaryButton onClick={() => setShowForm(true)}>+ Créer une activité</PrimaryButton></div>
      </div>
      <p className="text-xs mb-5" style={{ color: C.ink, opacity: 0.6 }}>{pickedIds.length}/10 issues de la liste · {customActivities.length} créée{customActivities.length !== 1 ? "s" : ""} par vous · {combined.length} au total pour vos voyageurs</p>
      {combined.length === 0 ? (
        <div className="flex flex-col items-center py-10 text-center rounded-3xl" style={{ background: C.skyWash }}><IconBadge icon={Waves} size={48} /><p className="text-sm mt-3 font-bold" style={{ color: C.ink }}>Aucun bon plan pour l'instant</p><p className="text-xs mt-1" style={{ color: C.ink, opacity: 0.6, maxWidth: 240 }}>Piochez jusqu'à 10 activités dans la liste, ou créez les vôtres.</p></div>
      ) : (
        <div className="space-y-2">{combined.map(({ activity, source }) => (
          <HostActivityRow
            key={activity.id}
            activity={activity}
            source={source}
            propertyId={propertyId}
            onUpdated={reload}
            onRemove={() => (source === "custom" ? removeCustom(activity.id) : togglePick(activity.id, true))}
          />
        ))}</div>
      )}
      {showForm && <ActivityFormModal propertyId={propertyId} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); reload(); }} />}
      {showPicker && <ActivityPickerModal catalog={catalog} pickedIds={pickedIds} onToggle={togglePick} onClose={() => setShowPicker(false)} />}
    </div>
  );
}
