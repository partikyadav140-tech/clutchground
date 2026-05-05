import React from "react";

export function GodCoin({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 ${className}`}
      style={{ filter: "drop-shadow(0 0 6px rgba(234, 179, 8, 0.4))" }}
    >
      <circle cx="12" cy="12" r="11" fill="url(#goldOuter)" stroke="#FEF08A" strokeWidth="0.5" />
      <circle cx="12" cy="12" r="8.5" fill="url(#goldInner)" />
      <text
        x="12.5"
        y="16.5"
        fontFamily="Orbitron, Impact, sans-serif"
        fontSize="12"
        fontWeight="900"
        fill="#451a03"
        textAnchor="middle"
        style={{ textShadow: "0px 1px 0px rgba(254, 240, 138, 0.8)" }}
      >
        G
      </text>
      <defs>
        <linearGradient id="goldOuter" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FDE047" />
          <stop offset="0.5" stopColor="#EAB308" />
          <stop offset="1" stopColor="#854D0E" />
        </linearGradient>
        <linearGradient id="goldInner" x1="0" y1="24" x2="24" y2="0" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FEF08A" />
          <stop offset="0.5" stopColor="#EAB308" />
          <stop offset="1" stopColor="#713F12" />
        </linearGradient>
      </defs>
    </svg>
  );
}
