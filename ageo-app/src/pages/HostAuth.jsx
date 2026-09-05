import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase.js";
import { IconBadge, Field, PrimaryButton, SecondaryButton, inputCls, inputStyle, C } from "../components/ui.jsx";
import { ShieldCheck, ArrowLeft } from "lucide-react";

export default function HostAuth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("choice");
  const [name, setName] = useState("");
  const [propertyName, setPropertyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  function backTo(m) { setError(""); setInfo(""); setMode(m); }

  async function submitSignup(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    if (!name.trim() || !propertyName.trim() || !email.trim() || password.length < 8) {
      setError("Vérifiez les champs — mot de passe : 8 caractères minimum.");
      return;
    }
    setBusy(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({ email: email.trim(), password });
      if (signUpError) throw signUpError;

      if (!data.session) {
        setInfo("Compte créé : vérifiez votre boîte mail pour confirmer votre adresse, puis connectez-vous.");
        setMode("login");
        return;
      }

      const userId = data.user.id;
      const { error: hostError } = await supabase.from("hosts").insert({ id: userId, name: name.trim(), email: email.trim() });
      if (hostError) throw hostError;

      const { error: propError } = await supabase.from("properties").insert({ host_id: userId, name: propertyName.trim() });
      if (propError) throw propError;

      navigate("/hote/app");
    } catch (err) {
      console.error(err);
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setBusy(false);
    }
  }

  async function submitLogin(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { error: loginError } = await supabase.auth.signInWithPassword({ email: loginEmail.trim(), password: loginPassword });
      if (loginError) throw loginError;
      navigate("/hote/app");
    } catch (err) {
      console.error(err);
      setError("E-mail ou mot de passe incorrect.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center px-6" style={{ minHeight: "100vh", background: C.ink }}>
      <button onClick={mode === "choice" ? () => navigate("/") : () => backTo("choice")} className="self-start mb-6" style={{ color: C.white, opacity: 0.6 }} aria-label="Retour">
        <ArrowLeft size={20} />
      </button>
      <IconBadge icon={ShieldCheck} size={60} tone="canary" />
      <h1 className="ageo-display text-2xl mt-5" style={{ color: C.white }}>Espace hôte</h1>

      {mode === "choice" && (
        <div className="w-full mt-8 space-y-3" style={{ maxWidth: 280 }}>
          <PrimaryButton onClick={() => backTo("signup")} full>Créer mon compte hôte</PrimaryButton>
          <SecondaryButton onClick={() => backTo("login")} full>J'ai déjà un compte</SecondaryButton>
        </div>
      )}

      {mode === "signup" && (
        <form onSubmit={submitSignup} className="w-full mt-8" style={{ maxWidth: 280 }}>
          <Field label="Votre nom">
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} style={inputStyle} />
          </Field>
          <Field label="Nom de votre propriété">
            <input value={propertyName} onChange={(e) => setPropertyName(e.target.value)} placeholder="Ex. Villa Lagon Bleu" className={inputCls} style={inputStyle} />
          </Field>
          <Field label="E-mail">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} style={inputStyle} />
          </Field>
          <Field label="Mot de passe">
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} style={inputStyle} />
          </Field>
          {error && <p className="text-xs mb-3" style={{ color: "#F0A98C" }}>{error}</p>}
          {info && <p className="text-xs mb-3" style={{ color: C.white, opacity: 0.8 }}>{info}</p>}
          <PrimaryButton type="submit" full disabled={busy}>{busy ? "..." : "Créer mon compte"}</PrimaryButton>
        </form>
      )}

      {mode === "login" && (
        <form onSubmit={submitLogin} className="w-full mt-8" style={{ maxWidth: 280 }}>
          <Field label="E-mail">
            <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className={inputCls} style={inputStyle} />
          </Field>
          <Field label="Mot de passe">
            <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className={inputCls} style={inputStyle} />
          </Field>
          {error && <p className="text-xs mb-3" style={{ color: "#F0A98C" }}>{error}</p>}
          {info && <p className="text-xs mb-3" style={{ color: C.white, opacity: 0.8 }}>{info}</p>}
          <PrimaryButton type="submit" full disabled={busy}>{busy ? "..." : "Se connecter"}</PrimaryButton>
        </form>
      )}
    </div>
  );
}
