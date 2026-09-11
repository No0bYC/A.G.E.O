import React, { useState } from "react";
import { supabase } from "../../lib/supabase.js";
import { C, Field, PrimaryButton, inputCls, inputStyle } from "../ui.jsx";

export default function SettingsPanel({ property, onUpdated }) {
  const [name, setName] = useState(property.name || "");
  const [address, setAddress] = useState(property.address || "");
  const [airbnbLink, setAirbnbLink] = useState(property.airbnb_link || "");
  const [weatherLocation, setWeatherLocation] = useState(property.weather_location || "");
  const [notes, setNotes] = useState(property.notes || "");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError(""); setSaved(false);
    try {
      const { data, error: updError } = await supabase.from("properties").update({
        name: name.trim(), address: address.trim() || null, airbnb_link: airbnbLink.trim() || null,
        weather_location: weatherLocation.trim() || null, notes: notes.trim() || null,
      }).eq("id", property.id).select().single();
      if (updError) throw updError;
      onUpdated(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) { console.error(err); setError("Une erreur est survenue."); }
    finally { setBusy(false); }
  }

  return (
    <div style={{ maxWidth: 480 }}>
      <h2 className="ageo-display text-xl mb-1" style={{ color: C.ink }}>Réglages</h2>
      <p className="text-xs mb-5" style={{ color: C.ink, opacity: 0.6 }}>Informations générales de votre propriété.</p>
      <form onSubmit={submit}>
        <Field label="Nom de la propriété"><input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} style={inputStyle} /></Field>
        <Field label="Adresse"><input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Ex. Grand Baie, Maurice" className={inputCls} style={inputStyle} /></Field>
        <Field label="Lien Airbnb (pour rediriger les avis positifs)"><input value={airbnbLink} onChange={(e) => setAirbnbLink(e.target.value)} placeholder="https://airbnb.com/..." className={inputCls} style={inputStyle} /></Field>
        <Field label="Localisation météo"><input value={weatherLocation} onChange={(e) => setWeatherLocation(e.target.value)} placeholder="Ex. Grand Baie" className={inputCls} style={inputStyle} /></Field>
        <Field label="Notes internes (non visibles des voyageurs)"><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className={inputCls} style={{ ...inputStyle, resize: "none" }} /></Field>
        {error && <p className="text-xs mb-3" style={{ color: C.danger }}>{error}</p>}
        {saved && <p className="text-xs mb-3 font-semibold" style={{ color: C.sage }}>Enregistré ✓</p>}
        <PrimaryButton type="submit" full disabled={busy}>{busy ? "..." : "Enregistrer"}</PrimaryButton>
      </form>
    </div>
  );
}
