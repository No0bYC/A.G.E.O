import React, { useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabase.js";
import { signedPhotoUrl, uploadPropertyPhoto } from "../../lib/media.js";
import { C, IconBadge, PrimaryButton, SecondaryButton, inputCls, inputStyle } from "../ui.jsx";
import {
  X, Plus, Trash2, ImagePlus, Sofa, BedDouble, Bath, UtensilsCrossed, Shirt, Wine, Car,
  Settings as SettingsIcon, Wrench, Leaf, Sun, Waves, Dumbbell, Tv, Sparkles, Gamepad2,
  Home as HomeIcon, Package,
} from "lucide-react";

const ROOM_ICONS = {
  Sofa, BedDouble, Bath, UtensilsCrossed, Shirt, Wine, Car, Settings: SettingsIcon, Wrench,
  Leaf, Sun, Waves, Dumbbell, Tv, Sparkles, Gamepad2, Home: HomeIcon, Package,
};
const ROOM_ICON_CHOICES = Object.keys(ROOM_ICONS);

// Facteur de conversion des coordonnées normalisées (0-1, fidèles au plan
// importé) vers les unités de grille utilisées par le plan isométrique
// voyageur — préserve les proportions et positions relatives réelles.
const GRID_SCALE = 20;

export default function FloorPlanPanel({ propertyId, onClose, onRoomsChanged }) {
  const [floors, setFloors] = useState([]);
  const [activeFloorId, setActiveFloorId] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadPreview, setUploadPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [drawing, setDrawing] = useState(null);
  const [pendingRect, setPendingRect] = useState(null);
  const [pendingName, setPendingName] = useState("");
  const [pendingIcon, setPendingIcon] = useState("Sofa");
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [savedFlash, setSavedFlash] = useState(false);

  const containerRef = useRef(null);
  const dragRef = useRef(null);

  async function reloadFloors(selectId) {
    const { data } = await supabase.from("property_floors").select("*").eq("property_id", propertyId).order("floor_index");
    setFloors(data || []);
    if (data && data.length) setActiveFloorId(selectId || data[0].id);
    setLoading(false);
  }
  async function reloadRooms() {
    const { data } = await supabase.from("rooms").select("*").eq("property_id", propertyId).not("floor_id", "is", null);
    setRooms(data || []);
  }
  useEffect(() => { reloadFloors(); reloadRooms(); }, [propertyId]);

  const activeFloor = floors.find((f) => f.id === activeFloorId);
  const floorRooms = rooms.filter((r) => r.floor_id === activeFloorId);

  useEffect(() => {
    setImageUrl(null);
    if (activeFloor?.plan_image_path) signedPhotoUrl(activeFloor.plan_image_path).then(setImageUrl);
  }, [activeFloor?.plan_image_path]);

  async function addFloor() {
    const nextIndex = floors.length;
    const { data, error } = await supabase.from("property_floors").insert({ property_id: propertyId, floor_index: nextIndex, label: `Étage ${nextIndex + 1}` }).select().single();
    if (!error) reloadFloors(data.id);
  }

  function handleFile(e) {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    setUploadFile(f);
    setUploadPreview(URL.createObjectURL(f));
  }

  async function confirmUpload() {
    if (!uploadFile || !activeFloor) return;
    setUploading(true);
    const img = new Image();
    img.onload = async () => {
      try {
        const path = await uploadPropertyPhoto(propertyId, "floors", uploadFile);
        const { error } = await supabase.from("property_floors").update({ plan_image_path: path, image_width: img.width, image_height: img.height }).eq("id", activeFloor.id);
        if (error) throw error;
        setUploadFile(null); setUploadPreview(null);
        reloadFloors(activeFloor.id);
      } catch (err) { console.error(err); }
      finally { setUploading(false); }
    };
    img.src = uploadPreview;
  }

  function relPos(e) {
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    return { x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) };
  }
  function onOverlayPointerDown(e) {
    if (e.target.dataset.roomRect) return;
    const p = relPos(e);
    dragRef.current = { startX: p.x, startY: p.y };
    setDrawing({ x: p.x, y: p.y, w: 0, h: 0 });
    setSelectedRoomId(null);
  }
  function onOverlayPointerMove(e) {
    if (!dragRef.current) return;
    const p = relPos(e);
    const x = Math.min(dragRef.current.startX, p.x), y = Math.min(dragRef.current.startY, p.y);
    const w = Math.abs(p.x - dragRef.current.startX), h = Math.abs(p.y - dragRef.current.startY);
    setDrawing({ x, y, w, h });
  }
  function onOverlayPointerUp() {
    if (!dragRef.current) return;
    dragRef.current = null;
    setDrawing((prev) => {
      if (prev && prev.w > 0.02 && prev.h > 0.02) { setPendingRect(prev); setPendingName(""); setPendingIcon("Sofa"); }
      return null;
    });
  }

  async function saveNewRoom(e) {
    e.preventDefault();
    if (!pendingName.trim() || !pendingRect) return;
    const plan_rect = { x: pendingRect.x * GRID_SCALE, y: pendingRect.y * GRID_SCALE, w: pendingRect.w * GRID_SCALE, h: pendingRect.h * GRID_SCALE };
    const { error } = await supabase.from("rooms").insert({ property_id: propertyId, floor_id: activeFloorId, name: pendingName.trim(), icon: pendingIcon, trace_rect: pendingRect, plan_rect });
    if (!error) {
      setPendingRect(null); reloadRooms(); onRoomsChanged && onRoomsChanged();
      setSavedFlash(true); setTimeout(() => setSavedFlash(false), 2000);
    }
  }

  async function deleteSelectedRoom() {
    if (!selectedRoomId) return;
    await supabase.from("rooms").delete().eq("id", selectedRoomId);
    setSelectedRoomId(null); reloadRooms(); onRoomsChanged && onRoomsChanged();
  }

  const selectedRoom = floorRooms.find((r) => r.id === selectedRoomId);

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: C.white }}>
      <div className="px-5 pt-6 pb-3" style={{ boxShadow: "0 1px 0 rgba(16,24,32,0.07)" }}>
        <div className="flex items-center justify-between mb-3">
          <span className="ageo-display text-lg" style={{ color: C.ink }}>Ajouter un plan</span>
          <button onClick={onClose} aria-label="Fermer"><X size={20} color={C.ink} style={{ opacity: 0.6 }} /></button>
        </div>
        {!loading && (
          <div className="flex items-center gap-2 overflow-x-auto ageo-scroll pb-1">
            {floors.map((f) => (
              <button key={f.id} onClick={() => setActiveFloorId(f.id)} className="text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap border"
                style={{ borderColor: activeFloorId === f.id ? C.sky : C.line, background: activeFloorId === f.id ? C.sky : C.white, color: activeFloorId === f.id ? C.white : C.ink }}>
                {f.label}
              </button>
            ))}
            <button onClick={addFloor} className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full border shrink-0" style={{ borderColor: C.line, color: C.sky }}>
              <Plus size={13} /> Étage
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto ageo-scroll px-5 py-5">
        <div className="max-w-2xl mx-auto">
          {loading ? (
            <p className="text-sm" style={{ color: C.ink, opacity: 0.5 }}>Chargement...</p>
          ) : floors.length === 0 ? (
            <div className="flex flex-col items-center text-center py-10">
              <IconBadge icon={ImagePlus} size={48} />
              <p className="text-sm mt-3 mb-4" style={{ color: C.ink, opacity: 0.6 }}>Commencez par ajouter votre premier étage.</p>
              <PrimaryButton onClick={addFloor}>+ Ajouter un étage</PrimaryButton>
            </div>
          ) : !activeFloor?.plan_image_path ? (
            <div>
              <p className="text-sm font-bold mb-1" style={{ color: C.ink }}>{activeFloor.label}</p>
              <p className="text-xs mb-4" style={{ color: C.ink, opacity: 0.6 }}>Importez le plan de cet étage (image). Vous tracerez les pièces dessus ensuite.</p>
              {!uploadPreview ? (
                <label className="rounded-3xl flex flex-col items-center justify-center gap-2 cursor-pointer py-14" style={{ background: C.skyWash, border: `1.5px dashed ${C.sky}` }}>
                  <ImagePlus size={28} color={C.sky} />
                  <span className="text-sm font-bold" style={{ color: C.sky }}>Choisir une image</span>
                  <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
                </label>
              ) : (
                <div className="ageo-card rounded-3xl p-3">
                  <img src={uploadPreview} alt="" className="w-full rounded-2xl object-contain" style={{ maxHeight: 320, background: C.neutral }} />
                  <div className="flex gap-2 mt-3">
                    <SecondaryButton onClick={() => { setUploadFile(null); setUploadPreview(null); }}>Changer</SecondaryButton>
                    <PrimaryButton onClick={confirmUpload} full disabled={uploading}>{uploading ? "..." : "Utiliser ce plan"}</PrimaryButton>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              <p className="text-xs mb-3" style={{ color: C.ink, opacity: 0.6 }}>Dessinez un rectangle sur le plan pour créer une pièce, au plus proche des vrais murs.</p>
              <div
                ref={containerRef}
                className="relative rounded-2xl overflow-hidden select-none touch-none"
                style={{ aspectRatio: activeFloor.image_width && activeFloor.image_height ? `${activeFloor.image_width}/${activeFloor.image_height}` : "4/3", background: C.neutral, cursor: "crosshair" }}
                onPointerDown={onOverlayPointerDown}
                onPointerMove={onOverlayPointerMove}
                onPointerUp={onOverlayPointerUp}
              >
                {imageUrl && <img src={imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover pointer-events-none" />}
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
                  {floorRooms.map((r) => {
                    const tr = r.trace_rect;
                    if (!tr) return null;
                    const active = selectedRoomId === r.id;
                    return (
                      <g key={r.id}>
                        <rect
                          data-room-rect="1"
                          x={tr.x * 100} y={tr.y * 100} width={tr.w * 100} height={tr.h * 100}
                          fill={active ? "rgba(255,203,61,0.35)" : "rgba(20,144,199,0.25)"}
                          stroke={active ? C.canaryDeep : C.sky} strokeWidth="0.6"
                          onClick={(e) => { e.stopPropagation(); setSelectedRoomId(r.id); }}
                          style={{ cursor: "pointer" }}
                        />
                        <text x={tr.x * 100 + tr.w * 50} y={tr.y * 100 + tr.h * 50} fontSize="3.2" textAnchor="middle" fill={C.ink} style={{ pointerEvents: "none", fontWeight: 700 }}>
                          {r.name}
                        </text>
                      </g>
                    );
                  })}
                  {drawing && (
                    <rect x={drawing.x * 100} y={drawing.y * 100} width={drawing.w * 100} height={drawing.h * 100} fill="rgba(255,203,61,0.3)" stroke={C.canaryDeep} strokeWidth="0.6" strokeDasharray="1.5" />
                  )}
                </svg>
              </div>

              {selectedRoom && (
                <div className="flex items-center justify-between rounded-2xl border p-3 mt-3" style={{ borderColor: C.line, background: C.white }}>
                  <span className="text-sm font-bold" style={{ color: C.ink }}>{selectedRoom.name}</span>
                  <button onClick={deleteSelectedRoom} className="flex items-center gap-1 text-xs font-bold" style={{ color: C.danger }}><Trash2 size={14} /> Supprimer</button>
                </div>
              )}

              <p className="text-xs font-bold uppercase tracking-wide mt-5 mb-2 flex items-center gap-2" style={{ color: C.sky }}>
                Pièces tracées sur {activeFloor.label} ({floorRooms.length})
                {savedFlash && <span className="text-xs font-bold normal-case" style={{ color: C.sage }}>· Pièce enregistrée ✓</span>}
              </p>
              <div className="flex flex-wrap gap-2">
                {floorRooms.length === 0 && <p className="text-xs" style={{ color: C.ink, opacity: 0.5 }}>Aucune pièce tracée pour l'instant.</p>}
                {floorRooms.map((r) => {
                  const RIcon = ROOM_ICONS[r.icon] || Package;
                  return (
                    <button key={r.id} onClick={() => setSelectedRoomId(r.id)} className="flex items-center gap-1.5 rounded-full pl-2 pr-3 py-1.5 border" style={{ borderColor: selectedRoomId === r.id ? C.sky : C.line }}>
                      <RIcon size={13} color={C.sky} /><span className="text-xs font-bold" style={{ color: C.ink }}>{r.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {!loading && floors.length > 0 && (
        <div className="px-5 py-4" style={{ boxShadow: "0 -1px 0 rgba(16,24,32,0.06)" }}>
          <div className="max-w-2xl mx-auto">
            <PrimaryButton onClick={onClose} full>Terminé — retour aux pièces</PrimaryButton>
          </div>
        </div>
      )}

      {pendingRect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(28,31,38,0.5)" }} onClick={() => setPendingRect(null)}>
          <form onSubmit={saveNewRoom} className="rounded-3xl w-full p-5" style={{ background: C.white, maxWidth: 380 }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <span className="ageo-display text-lg" style={{ color: C.ink }}>Nommer cette pièce</span>
              <button onClick={() => setPendingRect(null)} type="button" aria-label="Annuler"><X size={18} color={C.ink} style={{ opacity: 0.5 }} /></button>
            </div>
            <input value={pendingName} onChange={(e) => setPendingName(e.target.value)} placeholder="Ex. Chambre 1" className={inputCls + " mb-4"} style={inputStyle} autoFocus />
            <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: C.sky }}>Logo</p>
            <div className="flex gap-2 overflow-x-auto ageo-scroll mb-5 pb-1">
              {ROOM_ICON_CHOICES.map((k) => {
                const IconComp = ROOM_ICONS[k]; const active = pendingIcon === k;
                return (
                  <button key={k} type="button" onClick={() => setPendingIcon(k)} className="rounded-full flex items-center justify-center shrink-0" style={{ width: 36, height: 36, background: active ? C.sky : C.skyWash }}>
                    <IconComp size={16} color={active ? C.white : C.sky} />
                  </button>
                );
              })}
            </div>
            <PrimaryButton type="submit" full>Créer la pièce</PrimaryButton>
          </form>
        </div>
      )}
    </div>
  );
}
