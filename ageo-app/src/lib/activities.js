import { Waves, Leaf, Mountain, Landmark, Coffee, Anchor, Zap, Flag } from "lucide-react";
import { supabase } from "./supabase.js";

export const ACTIVITY_TYPES = [
  { key: "plages", label: "Plages", icon: Waves },
  { key: "nature", label: "Nature & parcs", icon: Leaf },
  { key: "randonnee", label: "Randonnée & paysages", icon: Mountain },
  { key: "culture", label: "Culture & histoire", icon: Landmark },
  { key: "the_sucre_rhum", label: "Thé, sucre & rhum", icon: Coffee },
  { key: "nautique", label: "Nautique & marin", icon: Anchor },
  { key: "sensations", label: "Sensations fortes", icon: Zap },
  { key: "golf", label: "Golf", icon: Flag },
];
export const REGIONS = ["Nord", "Sud", "Est", "Ouest", "Centre"];
export const ACCESS_LEVELS = [
  { key: "tout_public", label: "Tout public" },
  { key: "adultes", label: "Adultes seulement" },
  { key: "enfants", label: "Idéal enfants" },
];
export function typeInfo(key) { return ACTIVITY_TYPES.find((t) => t.key === key) || ACTIVITY_TYPES[0]; }
export function accessInfo(key) { return ACCESS_LEVELS.find((a) => a.key === key) || ACCESS_LEVELS[0]; }
// Photo d'une activité : priorité à photo_external_url (catalogue, trouvée
// sur le web), sinon photo_path (Storage, upload hôte) résolu en URL signée.
export async function activityPhotoUrl(activity) {
  if (activity.photo_external_url) return activity.photo_external_url;
  if (activity.photo_path) return signedActivityPhotoUrl(activity.photo_path);
  return null;
}
export async function signedActivityPhotoUrl(path) {
  if (!path) return null;
  const { data, error } = await supabase.storage.from("property-photos").createSignedUrl(path, 3600);
  if (error) { console.error(error); return null; }
  return data.signedUrl;
}
function sanitizeFilename(name) {
  const cleaned = name
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .replace(/_+/g, "_");
  return cleaned || "photo";
}
export async function uploadActivityPhoto(propertyId, file) {
  const path = `${propertyId}/activities/${Date.now()}_${sanitizeFilename(file.name)}`;
  const { error } = await supabase.storage.from("property-photos").upload(path, file, { upsert: false });
  if (error) throw error;
  return path;
}
