import React from "react";

export function TicketIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 ${className}`}
      style={{ filter: "drop-shadow(0 0 6px rgba(234, 179, 8, 0.4))" }}
    >
      <path
        d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"
        fill="url(#ticketGrad)"
        stroke="#FEF08A"
        strokeWidth="0.5"
      />
      <path
        d="M9 5v14"
        stroke="#451a03"
        strokeWidth="1.2"
        strokeDasharray="2 2"
      />
      <circle cx="15" cy="12" r="1.5" fill="#451a03" />
      <defs>
        <linearGradient id="ticketGrad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FDE047" />
          <stop offset="0.5" stopColor="#EAB308" />
          <stop offset="1" stopColor="#854D0E" />
        </linearGradient>
      </defs>
    </svg>
  );
}
