import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase.js";
import { signedPhotoUrl, uploadPropertyPhoto } from "../../lib/media.js";
import { C, IconBadge, Field, PrimaryButton, SecondaryButton, inputCls, inputStyle, SHADOW_MD } from "../ui.jsx";
import FloorPlanPanel from "./FloorPlanPanel.jsx";
import {
  Plus, Trash2, X, ImagePlus, Camera, Package, Sofa, BedDouble, Bath, UtensilsCrossed,
  Shirt, Wine, Car, Settings as SettingsIcon, Wrench, Leaf, Sun, Waves, Dumbbell, Tv,
  Sparkles, Gamepad2, Home as HomeIcon, ChevronDown, MapPin,
} from "lucide-react";

const ROOM_ICONS = {
  Sofa, BedDouble, Bath, UtensilsCrossed, Shirt, Wine, Car, Settings: SettingsIcon, Wrench,
  Leaf, Sun, Waves, Dumbbell, Tv, Sparkles, Gamepad2, Home: HomeIcon, Package,
};
const ROOM_ICON_CHOICES = Object.keys(ROOM_ICONS);
const ITEM_TYPES = ["Électronique", "Cuisine", "Salle de bain", "Jeux", "Mobilier", "Extérieur", "Autre"];

function RoomPhoto({ path, size = 90 }) {
  const [url, setUrl] = useState(null);
  useEffect(() => { if (path) signedPhotoUrl(path).then(setUrl); else setUrl(null); }, [path]);
  return url ? <img src={url} alt="" className="w-full h-full object-cover" /> : null;
}

function RoomFormModal({ propertyId, room, onClose, onSaved }) {
  const isEdit = !!room;
  const [name, setName] = useState(room?.name || "");
  const [icon, setIcon] = useState(room?.icon || "Sofa");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function handleFile(e) {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    setFile(f); setPreview(URL.createObjectURL(f));
  }

  async function submit(e) {
    e.preventDefault();
    if (!name.trim()) { setError("Donnez un nom à la pièce."); return; }
    setBusy(true); setError("");
    try {
      let photoPath = room?.photo_path || null;
      if (file) photoPath = await uploadPropertyPhoto(propertyId, "rooms", file);
      if (isEdit) {
        const { error: updError } = await supabase.from("rooms").update({ name: name.trim(), icon, photo_path: photoPath }).eq("id", room.id);
        if (updError) throw updError;
      } else {
        const { error: insError } = await supabase.from("rooms").insert({ property_id: propertyId, name: name.trim(), icon, photo_path: photoPath, plan_rect: { x: 0, y: 0, w: 3, h: 3 } });
        if (insError) throw insError;
      }
      onSaved();
    } catch (err) { console.error(err); setError("Une erreur est survenue."); }
    finally { setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(28,31,38,0.5)" }} onClick={onClose}>
      <form onSubmit={submit} className="rounded-3xl w-full overflow-y-auto ageo-scroll" style={{ background: C.white, maxWidth: 440, maxHeight: "88vh" }} onClick={(e) => e.stopPropagation()}>
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="ageo-display text-lg" style={{ color: C.ink }}>{isEdit ? "Modifier la pièce" : "Nouvelle pièce"}</span>
            <button onClick={onClose} type="button" aria-label="Fermer"><X size={18} color={C.ink} style={{ opacity: 0.5 }} /></button>
          </div>

          <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: C.sky }}>Photo</p>
          <label className="rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer mb-4 overflow-hidden" style={{ aspectRatio: "16/9", background: C.skyWash, border: (preview || room?.photo_path) ? "none" : `1.5px dashed ${C.sky}` }}>
            {preview ? <img src={preview} alt="" className="w-full h-full object-cover" /> : room?.photo_path ? <RoomPhoto path={room.photo_path} /> : (<><ImagePlus size={26} color={C.sky} /><span className="text-xs font-bold" style={{ color: C.sky }}>Ajouter une photo</span></>)}
            <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
          </label>

          <Field label="Nom de la pièce"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex. Chambre 1" className={inputCls} style={inputStyle} /></Field>

          <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: C.sky }}>Logo</p>
          <div className="flex gap-2 overflow-x-auto ageo-scroll mb-5 pb-1">
            {ROOM_ICON_CHOICES.map((k) => {
              const IconComp = ROOM_ICONS[k]; const active = icon === k;
              return (
                <button key={k} type="button" onClick={() => setIcon(k)} className="rounded-full flex items-center justify-center shrink-0" style={{ width: 38, height: 38, background: active ? C.sky : C.skyWash }}>
                  <IconComp size={17} color={active ? C.white : C.sky} />
                </button>
              );
            })}
          </div>

          {error && <p className="text-xs mb-3" style={{ color: C.danger }}>{error}</p>}
          <PrimaryButton type="submit" full disabled={busy}>{busy ? "..." : isEdit ? "Enregistrer" : "Créer la pièce"}</PrimaryButton>
        </div>
      </form>
    </div>
  );
}

function RoomInventory({ room }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", type: ITEM_TYPES[0], quantity: 1, description: "" });

  async function reload() {
    const { data } = await supabase.from("items").select("*").eq("room_id", room.id).order("created_at");
    setItems(data || []); setLoading(false);
  }
  useEffect(() => { reload(); }, [room.id]);

  async function addItem(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    const { error } = await supabase.from("items").insert({ property_id: room.property_id, room_id: room.id, name: form.name.trim(), type: form.type, quantity: Number(form.quantity) || 1, description: form.description.trim() || null });
    if (!error) { setForm({ name: "", type: ITEM_TYPES[0], quantity: 1, description: "" }); reload(); }
  }
  async function removeItem(id) { await supabase.from("items").delete().eq("id", id); reload(); }

  return (
    <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${C.line}` }}>
      <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: C.sky }}>Inventaire</p>
      {loading ? <p className="text-xs" style={{ color: C.ink, opacity: 0.5 }}>Chargement...</p> : (
        <div className="space-y-1.5 mb-3">
          {items.length === 0 && <p className="text-xs" style={{ color: C.ink, opacity: 0.5 }}>Aucun objet pour l'instant.</p>}
          {items.map((it) => (
            <div key={it.id} className="flex items-center justify-between rounded-xl border px-3 py-1.5" style={{ borderColor: C.line }}>
              <span className="text-sm" style={{ color: C.ink }}>{it.name} <span style={{ opacity: 0.5 }}>× {it.quantity} · {it.type}</span></span>
              <button onClick={() => removeItem(it.id)} aria-label="Supprimer"><Trash2 size={13} color={C.danger} /></button>
            </div>
          ))}
        </div>
      )}
      <form onSubmit={addItem} className="flex gap-1.5">
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nouvel objet..." className="flex-1 text-xs rounded-lg border px-2 py-1.5 outline-none" style={{ borderColor: C.line, color: C.ink }} />
        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="text-xs rounded-lg border px-1 py-1.5 outline-none" style={{ borderColor: C.line, color: C.ink }}>
          {ITEM_TYPES.map((t) => (<option key={t} value={t}>{t}</option>))}
        </select>
        <input type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="rounded-lg border px-1 py-1.5 outline-none text-center text-xs" style={{ borderColor: C.line, width: 42, color: C.ink }} />
        <button type="submit" className="rounded-lg px-2.5 shrink-0" style={{ background: C.canary }} aria-label="Ajouter"><Plus size={14} color={C.ink} /></button>
      </form>
    </div>
  );
}

function RoomCard({ room, onEdit, onDelete, expanded, onToggle }) {
  const RIcon = ROOM_ICONS[room.icon] || Package;
  return (
    <div className="rounded-3xl overflow-hidden ageo-card">
      <button onClick={onToggle} className="w-full text-left">
        <div className="flex items-center justify-center relative" style={{ height: 110, background: C.skyWash }}>
          {room.photo_path ? <RoomPhoto path={room.photo_path} /> : <RIcon size={30} color={C.sky} />}
        </div>
        <div className="px-4 py-3 flex items-center justify-between">
          <p className="text-sm font-bold" style={{ color: C.ink }}>{room.name}</p>
          <ChevronDown size={15} color={C.ink} style={{ opacity: 0.4, transform: expanded ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
        </div>
      </button>
      {expanded && (
        <div className="px-4 pb-4">
          <div className="flex gap-2 mb-1">
            <SecondaryButton onClick={onEdit}>Modifier</SecondaryButton>
            <button onClick={onDelete} className="rounded-full font-bold text-sm py-2.5 px-5 border" style={{ borderColor: C.danger, color: C.danger }}>Supprimer</button>
          </div>
          <RoomInventory room={room} />
        </div>
      )}
    </div>
  );
}

export default function RoomsPanel({ propertyId }) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [showFloorPlan, setShowFloorPlan] = useState(false);

  async function reload() {
    const { data } = await supabase.from("rooms").select("*").eq("property_id", propertyId).order("created_at");
    setRooms(data || []); setLoading(false);
  }
  useEffect(() => { reload(); }, [propertyId]);

  async function deleteRoom(id) {
    await supabase.from("rooms").delete().eq("id", id);
    reload();
  }

  if (loading) return <p className="text-sm" style={{ color: C.ink, opacity: 0.5 }}>Chargement...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
        <h2 className="ageo-display text-xl" style={{ color: C.ink }}>Pièces</h2>
        <div className="flex gap-2">
          <SecondaryButton onClick={() => setShowFloorPlan(true)}>Ajouter un plan</SecondaryButton>
          <PrimaryButton onClick={() => { setEditingRoom(null); setShowForm(true); }}>+ Ajouter une pièce</PrimaryButton>
        </div>
      </div>
      <p className="text-xs mb-5" style={{ color: C.ink, opacity: 0.6 }}>{rooms.length} pièce{rooms.length !== 1 ? "s" : ""} — photo, logo et inventaire pour chacune.</p>

      {rooms.length === 0 ? (
        <div className="flex flex-col items-center py-10 text-center rounded-3xl" style={{ background: C.skyWash }}>
          <IconBadge icon={HomeIcon} size={48} />
          <p className="text-sm mt-3 font-bold" style={{ color: C.ink }}>Aucune pièce pour l'instant</p>
        </div>
      ) : (
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
          {rooms.map((r) => (
            <RoomCard key={r.id} room={r} expanded={expandedId === r.id} onToggle={() => setExpandedId(expandedId === r.id ? null : r.id)}
              onEdit={() => { setEditingRoom(r); setShowForm(true); }} onDelete={() => deleteRoom(r.id)} />
          ))}
        </div>
      )}

      {showForm && <RoomFormModal propertyId={propertyId} room={editingRoom} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); reload(); }} />}
      {showFloorPlan && <FloorPlanPanel propertyId={propertyId} onClose={() => setShowFloorPlan(false)} onRoomsChanged={reload} />}
    </div>
  );
}
