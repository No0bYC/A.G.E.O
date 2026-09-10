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

export function typeInfo(key) {
  return ACTIVITY_TYPES.find((t) => t.key === key) || ACTIVITY_TYPES[0];
}

// Les activités (catalogue et personnalisées) stockent un chemin Storage
// privé (photo_path), jamais une URL publique — même convention que le
// reste de l'app. On résout en URL signée à l'affichage.
export async function signedActivityPhotoUrl(path) {
  if (!path) return null;
  const { data, error } = await supabase.storage.from("property-photos").createSignedUrl(path, 3600);
  if (error) { console.error(error); return null; }
  return data.signedUrl;
}

export async function uploadActivityPhoto(propertyId, file) {
  const path = `${propertyId}/activities/${Date.now()}_${file.name}`;
  const { error } = await supabase.storage.from("property-photos").upload(path, file, { upsert: false });
  if (error) throw error;
  return path;
}
