import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase.js";
import { C, IconBadge, EmptyState, IsoFloorPlan } from "../components/ui.jsx";
import ActivityBrowser from "../components/ActivityBrowser.jsx";
import { Home, Wrench, MapPin, ThumbsUp, Users, MessageCircle, LogOut, Package } from "lucide-react";

const TABS = [
  { key: "logement", label: "Logement", icon: Home },
  { key: "services", label: "Services", icon: Wrench },
  { key: "plans", label: "Plans", icon: MapPin },
  { key: "recos", label: "Recos", icon: ThumbsUp },
  { key: "social", label: "Social", icon: Users },
  { key: "avis", label: "Avis", icon: MessageCircle },
];

export default function GuestApp() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [guest, setGuest] = useState(null);
  const [property, setProperty] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [tab, setTab] = useState("logement");
  const [error, setError] = useState("");

  useEffect(() => {
    const guestId = localStorage.getItem("ageo_guest_id");
    const propertyId = localStorage.getItem("ageo_property_id");
    if (!guestId || !propertyId) {
      navigate("/voyageur");
      return;
    }
    (async () => {
      try {
        const [{ data: guestRow, error: gErr }, { data: propRow, error: pErr }, { data: roomRows, error: rErr }] = await Promise.all([
          supabase.from("guest_accounts").select("*").eq("id", guestId).single(),
          supabase.from("properties").select("*").eq("id", propertyId).single(),
          supabase.from("rooms").select("*").eq("property_id", propertyId).order("created_at"),
        ]);
        if (gErr) throw gErr;
        if (pErr) throw pErr;
        if (rErr) throw rErr;
        setGuest(guestRow);
        setProperty(propRow);
        setRooms(roomRows || []);
      } catch (err) {
        console.error(err);
        setError("Impossible de charger votre séjour. Reconnectez-vous.");
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  function logout() {
    localStorage.removeItem("ageo_guest_id");
    localStorage.removeItem("ageo_property_id");
    supabase.auth.signOut();
    navigate("/");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: "100vh" }}>
        <p className="text-sm" style={{ color: C.ink, opacity: 0.5 }}>Chargement...</p>
      </div>
    );
  }
  if (error || !guest || !property) {
    return (
      <div className="flex flex-col items-center justify-center px-6" style={{ minHeight: "100vh" }}>
        <p className="text-sm mb-4" style={{ color: C.danger }}>{error || "Séjour introuvable."}</p>
        <button onClick={logout} className="text-xs underline" style={{ color: C.ink }}>Retour à l'accueil</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ minHeight: "100vh" }}>
      <header className="px-5 pt-6 pb-4" style={{ background: C.white, boxShadow: "0 1px 0 rgba(16,24,32,0.07)" }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="ageo-display text-lg" style={{ color: C.ink }}>Bonjour {guest.display_name}</p>
            <p className="text-xs mt-1" style={{ color: C.ink, opacity: 0.6 }}>{property.name}</p>
          </div>
          <button onClick={logout} aria-label="Se déconnecter" className="rounded-full p-2" style={{ background: C.neutral }}>
            <LogOut size={16} color={C.ink} />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto ageo-scroll px-5 pt-5 pb-24">
        {tab === "logement" ? (
          <>
            <h2 className="ageo-display text-xl" style={{ color: C.ink }}>Le logement</h2>
            <p className="text-xs mt-1 mb-4" style={{ color: C.ink, opacity: 0.6 }}>Tout ce qu'il faut savoir pour vous installer.</p>
            {rooms.length === 0 ? (
              <EmptyState icon={Package} title="Aucune pièce renseignée" subtitle="Votre hôte n'a pas encore configuré le logement." />
            ) : (
              <>
                <div className="mb-5">
                  <IsoFloorPlan rooms={rooms} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {rooms.map((r) => (
                    <div key={r.id} className="ageo-card rounded-3xl overflow-hidden">
                      <div className="flex items-center justify-center" style={{ height: 80, background: C.skyWash }}>
                        <IconBadge icon={Package} size={36} />
                      </div>
                      <div className="px-3 py-2.5">
                        <p className="text-sm font-bold" style={{ color: C.ink }}>{r.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        ) : tab === "plans" ? (
          <ActivityBrowser propertyId={property.id} />
        ) : (
          <EmptyState icon={TABS.find((t) => t.key === tab).icon} title="Bientôt disponible" subtitle="Cette section arrive dans la prochaine itération." />
        )}
      </main>

      <nav className="border-t" style={{ background: C.white, borderColor: C.line }}>
        <div className="flex justify-around py-2">
          {TABS.map((t) => {
            const active = tab === t.key;
            const Icon = t.icon;
            return (
              <button key={t.key} onClick={() => setTab(t.key)} className="flex flex-col items-center gap-0.5 px-2 py-1.5">
                <Icon size={18} color={active ? C.sky : C.ink} style={{ opacity: active ? 1 : 0.45 }} />
                <span className="text-xs font-bold" style={{ color: active ? C.sky : C.ink, opacity: active ? 1 : 0.45 }}>{t.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
