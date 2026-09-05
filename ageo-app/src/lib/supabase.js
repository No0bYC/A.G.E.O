import { createClient } from "@supabase/supabase-js";

// Ces deux valeurs sont volontairement en dur plutôt que dans des variables
// d'environnement Vercel : ce sont des identifiants PUBLICS (la clé
// publishable, comme l'ancienne clé anon, est faite pour être exposée côté
// client). La vraie barrière de sécurité, c'est la Row Level Security côté
// Postgres — voir ageo-schema-multitenant.sql. Si un jour vous gérez
// plusieurs environnements (staging/production), migrez ces deux valeurs
// vers import.meta.env.VITE_SUPABASE_URL / VITE_SUPABASE_KEY à ce moment-là.
const SUPABASE_URL = "https://deuruwxvcunkvatvyqjz.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_rCePAjE2vFBtXMYRKX0SfQ_f5k9s6W8";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Garantit qu'une session existe (anonyme si besoin) avant tout appel RPC
// voyageur — verify_access_code/create_guest_account s'appuient sur auth.uid().
export async function ensureSession() {
  const { data } = await supabase.auth.getSession();
  if (data.session) return data.session;
  const { data: anon, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  return anon.session;
}
