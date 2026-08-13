"use client";
import { useEffect, useState } from "react";

export function ReconstructionEnhancement({ reducedMotion }: { reducedMotion?: boolean }) {
  const [state, setState] = useState<"idle" | "ready" | "unsupported">(reducedMotion ? "unsupported" : "idle");
  useEffect(() => {
    if (reducedMotion || !("WebGLRenderingContext" in window)) return;
    let active = true;
    import("three").then(() => { if (active) setState("ready"); }).catch(() => { if (active) setState("unsupported"); });
    return () => { active = false; };
  }, [reducedMotion]);
  if (state === "ready") return <span className="reconstruction-enhancement" aria-live="polite">3D enhancement ready</span>;
  return <span className="reconstruction-enhancement" aria-live="polite">{reducedMotion ? "Reduced motion: narrative fallback" : "Narrative fallback active"}</span>;
}
