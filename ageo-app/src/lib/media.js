import { supabase } from "./supabase.js";

// Chemins Storage privés (bucket "property-photos"), jamais d'URL publique —
// même convention que pour les activités et le reste de l'app.
export async function signedPhotoUrl(path) {
  if (!path) return null;
  const { data, error } = await supabase.storage.from("property-photos").createSignedUrl(path, 3600);
  if (error) { console.error(error); return null; }
  return data.signedUrl;
}

// Supabase Storage rejette certaines clés (apostrophes typographiques,
// accents, espaces...) — typiquement les noms par défaut des captures
// d'écran macOS ("Capture d'écran ... à ....png"). On assainit le nom
// avant de construire le chemin, quel que soit le fichier d'origine.
function sanitizeFilename(name) {
  const cleaned = name
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .replace(/_+/g, "_");
  return cleaned || "photo";
}

export async function uploadPropertyPhoto(propertyId, subfolder, file) {
  const path = `${propertyId}/${subfolder}/${Date.now()}_${sanitizeFilename(file.name)}`;
  const { error } = await supabase.storage.from("property-photos").upload(path, file, { upsert: false });
  if (error) throw error;
  return path;
}
