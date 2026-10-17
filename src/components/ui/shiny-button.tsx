"use client";

import type React from "react";
import { useId, useSyncExternalStore } from "react";

import { useStudyStore } from '../../store/useStudyStore';

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.(REDUCED_MOTION_QUERY)?.matches ?? false;
}

function subscribeToReducedMotion(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const mediaQueryList = window.matchMedia(REDUCED_MOTION_QUERY);
  mediaQueryList.addEventListener("change", callback);
  return () => mediaQueryList.removeEventListener("change", callback);
}

function getServerReducedMotionSnapshot() {
  return false;
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeToReducedMotion,
    prefersReducedMotion,
    getServerReducedMotionSnapshot,
  );
}

export interface ShinyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
  children?: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  activeAnimation?: boolean;
  fillColor?: string;
  labelColor?: string;
  accentColor?: string;
  accentSoftColor?: string;
  sweepDuration?: number;
  easeDuration?: number;
  arcWidth?: number;
  cornerRadius?: number;
  showSpeckle?: boolean;
  showSheen?: boolean;
  speckleOpacity?: number;
}

export type BorderMagicButtonProps = ShinyButtonProps;

export function ShinyButton({
  label,
  children,
  onClick,
  className = "",
  style,
  variant = "primary",
  activeAnimation,
  fillColor,
  labelColor = "#ffffff",
  accentColor = "#e9762b",
  accentSoftColor = "#ffaa6b",
  sweepDuration = 3.2,
  easeDuration = 0.5,
  arcWidth = 14,
  cornerRadius = 9999, // default sleek pill geometry
  showSpeckle,
  showSheen = true,
  speckleOpacity = 0.5,
  type = "button",
  disabled = false,
  ...props
}: ShinyButtonProps) {
  const storeTheme = useStudyStore((s) => s.theme);
  const isLight = storeTheme === 'light';
  const reducedMotion = usePrefersReducedMotion();
  const rawId = useId();
  const instanceId = rawId.replace(/[^a-zA-Z0-9]/g, "");
  const scope = `gleam-edge-${instanceId}`;

  const isPrimary = variant === "primary";
  const shouldAnimateAlways = activeAnimation !== undefined ? activeAnimation : isPrimary;
  
  // Dynamic fallback based on light/dark mode
  const resolvedFillColor = fillColor || (
    isLight
      ? (isPrimary ? "#e9762b" : "rgba(255, 246, 236, 0.95)")
      : (isPrimary ? "#0d0d0c" : "rgba(18, 18, 17, 0.95)")
  );
  const resolvedShowSpeckle = showSpeckle !== undefined ? showSpeckle : isPrimary;
  const resolvedAccent = isLight
    ? (isPrimary ? "#ffbe82" : "#e9762b")
    : (isPrimary ? accentColor : "rgba(233, 118, 43, 0.75)");

  const css = `
    @property --gradient-angle-${instanceId} {
      syntax: "<angle>";
      initial-value: 0deg;
      inherits: false;
    }
    @property --gradient-angle-offset-${instanceId} {
      syntax: "<angle>";
      initial-value: 0deg;
      inherits: false;
    }
    @property --gradient-percent-${instanceId} {
      syntax: "<percentage>";
      initial-value: ${arcWidth}%;
      inherits: false;
    }
    @property --gradient-shine-${instanceId} {
      syntax: "<color>";
      initial-value: #ffffff;
      inherits: false;
    }

    .${scope} {
      --gleam-base: ${resolvedFillColor};
      --gleam-inset: rgba(255, 255, 255, 0.12);
      --gleam-label: ${labelColor};
      --gleam-accent: ${resolvedAccent};
      --gleam-accent-soft: ${accentSoftColor};
      --animation: gradient-angle-${instanceId} ${sweepDuration}s linear infinite;
      --transition: ${easeDuration}s cubic-bezier(0.25, 1, 0.5, 1);

      isolation: isolate;
      position: relative;
      overflow: hidden;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.875rem 2.25rem;
      font-size: 0.8125rem;
      line-height: 1.2;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      border: 1px solid transparent;
      border-radius: ${cornerRadius}px;
      color: var(--gleam-label);
      background:
        linear-gradient(var(--gleam-base), var(--gleam-base)) padding-box,
        conic-gradient(
          from calc(var(--gradient-angle-${instanceId}) - var(--gradient-angle-offset-${instanceId})),
          transparent,
          var(--gleam-accent) var(--gradient-percent-${instanceId}),
          var(--gradient-shine-${instanceId}) calc(var(--gradient-percent-${instanceId}) * 2),
          var(--gleam-accent) calc(var(--gradient-percent-${instanceId}) * 3),
          transparent calc(var(--gradient-percent-${instanceId}) * 4)
        ) border-box;
      box-shadow: 
        inset 0 1px 1px 0 rgba(255, 255, 255, 0.22),
        inset 0 0 0 1px var(--gleam-inset),
        ${isPrimary ? "0 0 24px -2px rgba(233, 118, 43, 0.38), 0 6px 20px -2px rgba(0, 0, 0, 0.6)" : "0 4px 16px -2px rgba(0, 0, 0, 0.5)"};
      transition: var(--transition);
      transition-property:
        --gradient-angle-offset-${instanceId},
        --gradient-percent-${instanceId},
        --gradient-shine-${instanceId},
        box-shadow,
        transform,
        filter;
      ${shouldAnimateAlways ? `animation: var(--animation);` : ""}
    }

    .${scope}::before,
    .${scope}::after {
      content: "";
      pointer-events: none;
      position: absolute;
      inset: 0;
      border-radius: inherit;
    }

    .${scope}:active:not(:disabled) {
      transform: scale(0.96);
    }

    .${scope}:disabled {
      opacity: 0.45;
      cursor: not-allowed;
      pointer-events: none;
    }

    /* Halftone dot matrix speckle overlay along the edge */
    .${scope}::before {
      background: radial-gradient(
        circle at 2px 2px,
        rgba(255, 255, 255, 0.95) 0.65px,
        transparent 0
      ) padding-box;
      background-size: 4px 4px;
      mask-image: conic-gradient(
        from calc(var(--gradient-angle-${instanceId}) + 45deg),
        black,
        transparent 14% 86%,
        black
      );
      -webkit-mask-image: conic-gradient(
        from calc(var(--gradient-angle-${instanceId}) + 45deg),
        black,
        transparent 14% 86%,
        black
      );
      opacity: ${resolvedShowSpeckle ? speckleOpacity : 0};
      z-index: 1;
      ${shouldAnimateAlways ? `animation: var(--animation);` : ""}
    }

    /* Ambient surface sheen reflection */
    .${scope}::after {
      background: linear-gradient(
        -55deg,
        transparent 20%,
        var(--gleam-accent) 50%,
        transparent 80%
      );
      mask-image: radial-gradient(circle at bottom, transparent 35%, black 90%);
      -webkit-mask-image: radial-gradient(circle at bottom, transparent 35%, black 90%);
      opacity: ${showSheen ? (isPrimary ? 0.42 : 0.2) : 0};
      z-index: 1;
    }

    .${scope}:is(:hover, :focus-visible) {
      --gradient-percent-${instanceId}: 22%;
      --gradient-angle-offset-${instanceId}: 95deg;
      --gradient-shine-${instanceId}: var(--gleam-accent-soft);
      box-shadow: 
        inset 0 1px 1px 0 rgba(255, 255, 255, 0.3),
        inset 0 0 0 1px var(--gleam-inset),
        0 0 32px 0 rgba(233, 118, 43, 0.55),
        0 8px 24px -2px rgba(0, 0, 0, 0.7);
      animation-play-state: running;
      transform: translateY(-1px);
    }

    .${scope}:is(:hover, :focus-visible)::before {
      animation-play-state: running;
      opacity: ${resolvedShowSpeckle ? speckleOpacity * 1.3 : 0.4};
    }

    /* Light Mode Theme Harmony: Radiant brand focus orange with animated gleam edge */
    html.light .${scope},
    html:not(.dark) .${scope},
    [data-theme="light"] .${scope} {
      --gleam-base: ${fillColor || (isPrimary ? "#e9762b" : "rgba(255, 246, 236, 0.95)")};
      --gleam-inset: rgba(255, 255, 255, 0.45);
      --gleam-label: #ffffff;
      --gleam-accent: ${isPrimary ? "#ffbe82" : "#e9762b"};
      --gleam-accent-soft: #ffffff;
      color: #ffffff !important;
      box-shadow: 
        inset 0 1px 1px 0 rgba(255, 255, 255, 0.6),
        inset 0 0 0 1px rgba(255, 255, 255, 0.35),
        ${isPrimary 
          ? "0 0 28px -2px rgba(233, 118, 43, 0.5), 0 8px 22px -2px rgba(233, 118, 43, 0.35)" 
          : "0 4px 16px -2px rgba(180, 80, 20, 0.15)"};
    }

    html.light .${scope} *,
    html:not(.dark) .${scope} *,
    [data-theme="light"] .${scope} * {
      color: #ffffff !important;
    }

    html.light .${scope} svg,
    html:not(.dark) .${scope} svg,
    [data-theme="light"] .${scope} svg {
      fill: #ffffff !important;
      stroke: #ffffff !important;
      color: #ffffff !important;
    }

    html.light .${scope}:is(:hover, :focus-visible),
    html:not(.dark) .${scope}:is(:hover, :focus-visible),
    [data-theme="light"] .${scope}:is(:hover, :focus-visible) {
      box-shadow: 
        inset 0 1px 1px 0 rgba(255, 255, 255, 0.75),
        inset 0 0 0 1px rgba(255, 255, 255, 0.5),
        0 0 35px 0 rgba(233, 118, 43, 0.7),
        0 10px 26px -2px rgba(233, 118, 43, 0.45);
    }

    @keyframes gradient-angle-${instanceId} {
      to {
        --gradient-angle-${instanceId}: 360deg;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .${scope},
      .${scope}::before {
        animation: none !important;
      }

      .${scope} {
        transition: none;
      }
    }
  `;

  return (
    <>
      <style>{css}</style>
      <button
        type={type}
        disabled={disabled}
        className={`${scope} ${className}`}
        style={style}
        onClick={onClick}
        aria-label={typeof label === "string" ? label : undefined}
        data-reduced-motion={reducedMotion ? "true" : undefined}
        {...props}
      >
        <span className="relative z-10 inline-flex items-center justify-center gap-2 select-none">
          {children || label}
        </span>
      </button>
    </>
  );
}

export const BorderMagicButton = ShinyButton;
export default ShinyButton;
