import React, { useId } from "react";

export const C = {
  sky: "#1490C7",
  skyWash: "#EAF6FC",
  canary: "#FFCB3D",
  canaryDeep: "#C98F00",
  canaryWash: "#FFF6DA",
  ink: "#1C1F26",
  neutral: "#F7F7F5",
  white: "#FFFFFF",
  line: "#E4E2D8",
  sage: "#3FA377",
  danger: "#C24A2E",
};
export const SHADOW_SM = "0 1px 2px rgba(16,24,32,0.06), 0 1px 10px rgba(16,24,32,0.05)";
export const SHADOW_MD = "0 8px 24px rgba(16,24,32,0.16)";

export function SunMark({ size = 44, className = "" }) {
  const clipId = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      <defs>
        <clipPath id={clipId}>
          <circle cx="50" cy="50" r="42" />
        </clipPath>
      </defs>
      <g stroke={C.white} strokeWidth="5" strokeLinecap="round" opacity="0.9">
        <line x1="50" y1="2" x2="50" y2="11" />
        <line x1="17" y1="15" x2="24" y2="21" />
        <line x1="83" y1="15" x2="76" y2="21" />
      </g>
      <circle cx="50" cy="50" r="42" fill={C.canary} />
      <g clipPath={`url(#${clipId})`}>
        <rect x="0" y="60" width="100" height="42" fill={C.sky} />
      </g>
    </svg>
  );
}

export function IconBadge({ icon: Icon, size = 44, tone = "sky", className = "" }) {
  const bg = tone === "sky" ? C.skyWash : C.canaryWash;
  const fg = tone === "sky" ? C.sky : C.canaryDeep;
  return (
    <div className={`rounded-full flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size, background: bg, color: fg }}>
      <Icon size={Math.round(size * 0.46)} strokeWidth={1.8} />
    </div>
  );
}

export function EmptyState({ icon, title, subtitle }) {
  return (
    <div className="flex flex-col items-center text-center py-10 px-6">
      <IconBadge icon={icon} size={52} />
      <p className="ageo-display text-base mt-4" style={{ color: C.ink }}>{title}</p>
      {subtitle && <p className="text-xs mt-1" style={{ color: C.ink, opacity: 0.6 }}>{subtitle}</p>}
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <label className="block mb-3">
      <span className="block text-xs font-semibold mb-1" style={{ color: C.ink, opacity: 0.6 }}>{label}</span>
      {children}
    </label>
  );
}

export const inputCls = "w-full rounded-xl border px-3 py-2 text-sm outline-none";
export const inputStyle = { borderColor: C.line, color: C.ink, background: C.white };

export function PrimaryButton({ children, onClick, type = "button", disabled, full }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full font-bold text-sm py-2.5 px-5 transition-transform active:scale-95 ${full ? "w-full" : ""} ${disabled ? "opacity-50" : ""}`}
      style={{ background: C.canary, color: C.ink }}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({ children, onClick, type = "button", full }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`rounded-full font-bold text-sm py-2.5 px-5 border transition-transform active:scale-95 ${full ? "w-full" : ""}`}
      style={{ borderColor: C.sky, color: C.sky, background: "transparent" }}
    >
      {children}
    </button>
  );
}

export function IsoFloorPlan({ rooms }) {
  const ISO_TILE_W = 60;
  const ISO_TILE_H = 30;
  const ISO_WALL_H = 34;

  function isoProject(gx, gy) {
    return { x: (gx - gy) * (ISO_TILE_W / 2), y: (gx + gy) * (ISO_TILE_H / 2) };
  }
  function faces(rect) {
    const { x, y, w, h } = rect;
    const N = isoProject(x, y);
    const E = isoProject(x + w, y);
    const S = isoProject(x + w, y + h);
    const W = isoProject(x, y + h);
    return {
      top: [N, E, S, W],
      leftWall: [W, S, { x: S.x, y: S.y + ISO_WALL_H }, { x: W.x, y: W.y + ISO_WALL_H }],
      rightWall: [S, E, { x: E.x, y: E.y + ISO_WALL_H }, { x: S.x, y: S.y + ISO_WALL_H }],
    };
  }
  function pts(p) {
    return p.map((pt) => `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`).join(" ");
  }

  const withRect = rooms.filter((r) => r.plan_rect);
  if (withRect.length === 0) {
    return (
      <div className="rounded-2xl flex items-center justify-center py-10" style={{ background: C.skyWash }}>
        <p className="text-xs" style={{ color: C.ink, opacity: 0.5 }}>Le plan apparaîtra ici une fois les pièces positionnées.</p>
      </div>
    );
  }
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  withRect.forEach((r) => {
    const f = faces(r.plan_rect);
    [...f.top, ...f.leftWall, ...f.rightWall].forEach((p) => {
      minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
    });
  });
  const pad = 24;
  const vbX = minX - pad, vbY = minY - pad, vbW = maxX - minX + pad * 2, vbH = maxY - minY + pad * 2;

  return (
    <div className="relative" style={{ aspectRatio: `${vbW} / ${vbH}` }}>
      <svg viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`} width="100%" height="100%">
        {withRect.map((r) => {
          const f = faces(r.plan_rect);
          return (
            <g key={r.id}>
              <polygon points={pts(f.leftWall)} fill="#DBD7CC" />
              <polygon points={pts(f.rightWall)} fill="#EDEAE0" />
              <polygon points={pts(f.top)} fill="#FFFFFF" stroke={C.line} strokeWidth="1" />
            </g>
          );
        })}
      </svg>
      {withRect.map((r) => {
        const f = faces(r.plan_rect);
        const N = f.top[0], S = f.top[2];
        const cx = (N.x + S.x) / 2, cy = (N.y + S.y) / 2;
        const leftPct = ((cx - vbX) / vbW) * 100;
        const topPct = ((cy - vbY) / vbH) * 100;
        return (
          <span
            key={r.id}
            className="absolute text-xs font-bold whitespace-nowrap rounded-full px-2 py-1"
            style={{ left: `${leftPct}%`, top: `${topPct}%`, transform: "translate(-50%,-50%)", background: C.white, border: `1px solid ${C.line}`, color: C.ink }}
          >
            {r.name}
          </span>
        );
      })}
    </div>
  );
}
