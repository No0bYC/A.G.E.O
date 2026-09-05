import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, ensureSession } from "../lib/supabase.js";
import { IconBadge, Field, PrimaryButton, SecondaryButton, inputCls, inputStyle, C } from "../components/ui.jsx";
import { KeyRound, ArrowLeft, CalendarDays } from "lucide-react";

export default function GuestAuth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("choice");
  const [codeInput, setCodeInput] = useState("");
  const [pending, setPending] = useState(null);
  const [name, setName] = useState("");
  const [idInput, setIdInput] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [loginId, setLoginId] = useState("");
  const [loginPw, setLoginPw] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    ensureSession().catch((e) => console.error("session error", e));
  }, []);

  function backTo(m) { setError(""); setMode(m); }

  async function submitCode(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await ensureSession();
      const { data, error: rpcError } = await supabase.rpc("verify_access_code", { p_code: codeInput.trim() });
      if (rpcError) throw rpcError;
      if (!data.ok) {
        if (data.error === "rate_limited") setError("Trop de tentatives, réessayez dans quelques minutes.");
        else if (data.error === "invalid_code") setError("Code invalide. Vérifiez et réessayez.");
        else setError("Une erreur est survenue.");
        return;
      }
      setPending(data);
      setMode("setup");
    } catch (err) {
      console.error(err);
      setError("Une erreur est survenue. Réessayez.");
    } finally {
      setBusy(false);
    }
  }

  async function submitSetup(e) {
    e.preventDefault();
    setError("");
    if (!name.trim()) { setError("Indiquez votre prénom."); return; }
    const username = idInput.trim().toLowerCase().replace(/\s+/g, "");
    if (username.length < 3) { setError("Identifiant trop court (3 caractères minimum)."); return; }
    if (pw.length < 4) { setError("Mot de passe trop court (4 caractères minimum)."); return; }
    if (pw !== pw2) { setError("Les mots de passe ne correspondent pas."); return; }
    setBusy(true);
    try {
      const { data, error: rpcError } = await supabase.rpc("create_guest_account", {
        p_access_code_id: pending.access_code_id,
        p_username: username,
        p_password: pw,
        p_display_name: name.trim(),
      });
      if (rpcError) throw rpcError;
      if (!data.ok) {
        if (data.error === "username_taken") setError("Identifiant déjà utilisé, choisissez-en un autre.");
        else if (data.error === "code_already_used") setError("Ce code a déjà été utilisé.");
        else setError("Une erreur est survenue.");
        return;
      }
      localStorage.setItem("ageo_guest_id", data.guest_id);
      localStorage.setItem("ageo_property_id", pending.property_id);
      navigate("/voyageur/app");
    } catch (err) {
      console.error(err);
      setError("Une erreur est survenue. Réessayez.");
    } finally {
      setBusy(false);
    }
  }

  async function submitLogin(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await ensureSession();
      const { data, error: rpcError } = await supabase.rpc("guest_login", {
        p_username: loginId.trim().toLowerCase(),
        p_password: loginPw,
      });
      if (rpcError) throw rpcError;
      if (!data.ok) {
        if (data.error === "rate_limited") setError("Trop de tentatives, réessayez dans quelques minutes.");
        else setError("Identifiant ou mot de passe incorrect.");
        return;
      }
      localStorage.setItem("ageo_guest_id", data.guest_id);
      localStorage.setItem("ageo_property_id", data.property_id);
      navigate("/voyageur/app");
    } catch (err) {
      console.error(err);
      setError("Une erreur est survenue. Réessayez.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center px-6" style={{ minHeight: "100vh" }}>
      <button
        onClick={mode === "choice" ? () => navigate("/") : () => backTo("choice")}
        className="self-start mb-6"
        style={{ color: C.ink, opacity: 0.45 }}
        aria-label="Retour"
      >
        <ArrowLeft size={20} />
      </button>

      {mode === "choice" && (
        <div className="w-full flex flex-col items-center" style={{ maxWidth: 280 }}>
          <IconBadge icon={KeyRound} size={56} />
          <h1 className="ageo-display text-xl mt-4 mb-6 text-center" style={{ color: C.ink }}>Votre espace voyageur</h1>
          <div className="w-full space-y-3">
            <PrimaryButton onClick={() => backTo("code")} full>J'ai un code d'accès</PrimaryButton>
            <SecondaryButton onClick={() => backTo("login")} full>J'ai déjà un compte</SecondaryButton>
          </div>
        </div>
      )}

      {mode === "code" && (
        <form onSubmit={submitCode} className="w-full" style={{ maxWidth: 280 }}>
          <IconBadge icon={KeyRound} size={56} className="mx-auto" />
          <h1 className="ageo-display text-xl mt-4 mb-1 text-center" style={{ color: C.ink }}>Entrez votre code</h1>
          <p className="text-xs mb-5 text-center" style={{ color: C.ink, opacity: 0.6 }}>Le code communiqué par votre hôte avant votre arrivée.</p>
          <input
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value)}
            placeholder="Ex. AB12CD"
            className={inputCls + " text-center tracking-widest font-bold mb-3"}
            style={inputStyle}
            autoCapitalize="characters"
          />
          {error && <p className="text-xs mb-3 text-center" style={{ color: C.danger }}>{error}</p>}
          <PrimaryButton type="submit" full disabled={busy}>{busy ? "..." : "Continuer"}</PrimaryButton>
        </form>
      )}

      {mode === "setup" && pending && (
        <form onSubmit={submitSetup} className="w-full" style={{ maxWidth: 280 }}>
          <IconBadge icon={CalendarDays} size={56} className="mx-auto" />
          <h1 className="ageo-display text-xl mt-4 mb-1 text-center" style={{ color: C.ink }}>Créez votre compte</h1>
          <p className="text-xs mb-5 text-center" style={{ color: C.ink, opacity: 0.6 }}>
            Séjour du {pending.check_in} au {pending.check_out}
          </p>
          <Field label="Prénom">
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} style={inputStyle} />
          </Field>
          <Field label="Identifiant">
            <input value={idInput} onChange={(e) => setIdInput(e.target.value)} placeholder="ex. sophie23" className={inputCls} style={inputStyle} />
          </Field>
          <Field label="Mot de passe">
            <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} className={inputCls} style={inputStyle} />
          </Field>
          <Field label="Confirmer le mot de passe">
            <input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} className={inputCls} style={inputStyle} />
          </Field>
          {error && <p className="text-xs mb-3" style={{ color: C.danger }}>{error}</p>}
          <PrimaryButton type="submit" full disabled={busy}>{busy ? "..." : "Créer mon compte"}</PrimaryButton>
        </form>
      )}

      {mode === "login" && (
        <form onSubmit={submitLogin} className="w-full" style={{ maxWidth: 280 }}>
          <IconBadge icon={KeyRound} size={56} className="mx-auto" />
          <h1 className="ageo-display text-xl mt-4 mb-5 text-center" style={{ color: C.ink }}>Connexion</h1>
          <Field label="Identifiant">
            <input value={loginId} onChange={(e) => setLoginId(e.target.value)} className={inputCls} style={inputStyle} />
          </Field>
          <Field label="Mot de passe">
            <input type="password" value={loginPw} onChange={(e) => setLoginPw(e.target.value)} className={inputCls} style={inputStyle} />
          </Field>
          {error && <p className="text-xs mb-3" style={{ color: C.danger }}>{error}</p>}
          <PrimaryButton type="submit" full disabled={busy}>{busy ? "..." : "Se connecter"}</PrimaryButton>
          <button type="button" onClick={() => backTo("code")} className="w-full text-center text-xs mt-4 underline" style={{ color: C.ink, opacity: 0.5 }}>
            Pas encore de compte ? Utilisez votre code d'accès
          </button>
        </form>
      )}
    </div>
  );
}
