import { supabase } from "./supabase.js";

// Chemins Storage privés (bucket "property-photos"), jamais d'URL publique —
// même convention que pour les activités et le reste de l'app.
export async function signedPhotoUrl(path) {
  if (!path) return null;
  const { data, error } = await supabase.storage.from("property-photos").createSignedUrl(path, 3600);
  if (error) { console.error(error); return null; }
  return data.signedUrl;
}

export async function uploadPropertyPhoto(propertyId, subfolder, file) {
  const path = `${propertyId}/${subfolder}/${Date.now()}_${file.name}`;
  const { error } = await supabase.storage.from("property-photos").upload(path, file, { upsert: false });
  if (error) throw error;
  return path;
}
