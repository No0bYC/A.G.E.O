import React from "react";
import { useNavigate } from "react-router-dom";
import { SunMark, PrimaryButton, C } from "../components/ui.jsx";

export default function Home() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center px-6" style={{ minHeight: "100vh" }}>
      <SunMark size={76} />
      <h1 className="ageo-display text-3xl mt-6" style={{ color: C.ink }}>AGEO</h1>
      <p className="text-sm mt-2 text-center" style={{ color: C.ink, opacity: 0.65, maxWidth: 280 }}>
        Le carnet de bord de votre séjour à Maurice
      </p>
      <div className="w-full mt-10" style={{ maxWidth: 280 }}>
        <PrimaryButton onClick={() => navigate("/voyageur")} full>Accéder à mon séjour</PrimaryButton>
      </div>
      <button onClick={() => navigate("/hote")} className="mt-14 text-xs font-semibold underline" style={{ color: C.ink, opacity: 0.4 }}>
        Espace hôte
      </button>
    </div>
  );
}
