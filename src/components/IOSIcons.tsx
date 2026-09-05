"use client";
import React from "react";
type Props = { size?: number; className?: string };

// iOS 26 (2026) Realistic - Liquid Glass, 3D, Vibrant Gradients
// Each icon uses SVG with gradients, shadows, and depth for true iOS 26 realism

const baseStyle: React.CSSProperties = {
  display: "inline-block",
  filter: "drop-shadow(0 1.5px 3px rgba(0,0,0,0.12)) drop-shadow(0 0.5px 1px rgba(0,0,0,0.08))",
};

export const IconDashboard = ({ size = 18, className = "" }: Props) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={baseStyle}>
    <defs>
      <linearGradient id="g-dash" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#FF8A2A" />
        <stop offset="100%" stopColor="#FF6B1A" />
      </linearGradient>
      <radialGradient id="gd1" cx="0.3" cy="0.3" r="0.8">
        <stop offset="0%" stopColor="white" stopOpacity="0.35" />
        <stop offset="100%" stopColor="white" stopOpacity="0" />
      </radialGradient>
    </defs>
    <rect x="2.5" y="2.5" width="8.2" height="8.2" rx="2.2" fill="url(#g-dash)" />
    <rect x="13.3" y="2.5" width="8.2" height="8.2" rx="2.2" fill="#FFB266" />
    <rect x="2.5" y="13.3" width="8.2" height="8.2" rx="2.2" fill="#FFB266" />
    <rect x="13.3" y="13.3" width="8.2" height="8.2" rx="2.2" fill="url(#g-dash)" />
    <rect x="2.5" y="2.5" width="8.2" height="8.2" rx="2.2" fill="url(#gd1)" />
    <rect x="13.3" y="13.3" width="8.2" height="8.2" rx="2.2" fill="url(#gd1)" />
  </svg>
);

export const IconGraduation = ({ size = 18, className = "" }: Props) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={baseStyle}>
    <defs>
      <linearGradient id="g-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#6A5AE0" />
        <stop offset="100%" stopColor="#3B2FC0" />
      </linearGradient>
    </defs>
    <ellipse cx="12" cy="14.5" rx="8.5" ry="4.2" fill="#E9E6FF" />
    <path d="M2.8 8.8L12 4l9.2 4.8-9.2 4.8z" fill="url(#g-grad)" stroke="#2A1F8A" strokeWidth="0.4" />
    <path d="M6 11.2V15c0 1.4 2.7 2.8 6 2.8s6-1.4 6-2.8v-3.8" stroke="#3B2FC0" strokeWidth="1.2" strokeLinecap="round" fill="none" />
    <circle cx="18.2" cy="9.5" r="1.1" fill="#FFD54F" stroke="#B8960A" strokeWidth="0.3" />
    <path d="M18.2 10.6V13" stroke="#B8960A" strokeWidth="0.8" strokeLinecap="round" />
  </svg>
);

export const IconPeople = ({ size = 18, className = "" }: Props) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={baseStyle}>
    <defs>
      <linearGradient id="g-people" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#4ECDC4" />
        <stop offset="100%" stopColor="#2A9D8F" />
      </linearGradient>
    </defs>
    <circle cx="9" cy="8" r="3.8" fill="url(#g-people)" stroke="#1A6B5A" strokeWidth="0.4" />
    <circle cx="9" cy="8" r="1.5" fill="white" opacity="0.35" />
    <path d="M3.2 16.8c0-2.6 2.1-4.7 4.7-4.7h1.8c2.6 0 4.7 2.1 4.7 4.7" fill="#D0FFF9" stroke="#2A9D8F" strokeWidth="0.7" />
    <circle cx="16.5" cy="9.2" r="2.7" fill="#FFB088" stroke="#C46A2F" strokeWidth="0.4" />
    <path d="M13.8 15.8c1-0.7 2.2-1.1 3.5-1.1 2 0 3.7 1.3 3.7 2.9" stroke="#C46A2F" strokeWidth="0.6" fill="none" />
  </svg>
);

export const IconStudent = ({ size = 18, className = "" }: Props) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={baseStyle}>
    <defs>
      <linearGradient id="g-stu" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#FF8A65" />
        <stop offset="100%" stopColor="#E64A19" />
      </linearGradient>
    </defs>
    <circle cx="12" cy="7.8" r="4" fill="url(#g-stu)" />
    <circle cx="10.5" cy="6.5" r="1.2" fill="white" opacity="0.32" />
    <path d="M5.2 18.2c0-3.2 3-5.5 6.8-5.5s6.8 2.3 6.8 5.5" fill="#FFE8DD" stroke="#C45A2A" strokeWidth="0.6" />
    <path d="M12 11.2l-1.2 1.2h2.4z" fill="#FF6B1A" />
  </svg>
);

export const IconCalendar = ({ size = 18, className = "" }: Props) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={baseStyle}>
    <defs>
      <linearGradient id="g-cal" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#FF6B6B" />
        <stop offset="100%" stopColor="#C0392B" />
      </linearGradient>
    </defs>
    <rect x="3" y="5" width="18" height="14.5" rx="2.8" fill="white" stroke="#E0E0E0" strokeWidth="0.5" />
    <rect x="3" y="5" width="18" height="5" rx="2.8" fill="url(#g-cal)" />
    <rect x="3" y="8" width="18" height="1.5" fill="white" opacity="0.18" />
    <path d="M8 3.5V6M16 3.5V6" stroke="#8B1A0A" strokeWidth="1.4" strokeLinecap="round" />
    <circle cx="8" cy="13.5" r="1" fill="#FF6B6B" />
    <circle cx="12" cy="13.5" r="1" fill="#FF6B6B" />
    <circle cx="16" cy="13.5" r="1" fill="#E0E0E0" />
    <circle cx="8" cy="16.5" r="1" fill="#E0E0E0" />
    <circle cx="12" cy="16.5" r="1" fill="#FF6B1A" />
  </svg>
);

export const IconBook = ({ size = 18, className = "" }: Props) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={baseStyle}>
    <defs>
      <linearGradient id="g-book" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#4A90E2" />
        <stop offset="100%" stopColor="#1A3A6E" />
      </linearGradient>
    </defs>
    <path d="M6 3.5A2.5 2.5 0 0 1 8.5 1H18a1.2 1.2 0 0 1 1.2 1.2V20.5A1.2 1.2 0 0 1 18 21.7H8.5A2.5 2.5 0 0 0 6 24V3.5Z" fill="url(#g-book)" />
    <path d="M6 3.5A2.5 2.5 0 0 1 8.5 1H17.5L6 6.2z" fill="white" opacity="0.18" />
    <path d="M9 9H16M9 12H16M9 15H13" stroke="white" strokeWidth="1" strokeLinecap="round" opacity="0.95" />
    <circle cx="15.5" cy="6" r="0.9" fill="#FFD54F" />
  </svg>
);

export const IconWallet = ({ size = 18, className = "" }: Props) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={baseStyle}>
    <defs>
      <linearGradient id="g-wallet" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#66BB6A" />
        <stop offset="100%" stopColor="#1B5E20" />
      </linearGradient>
    </defs>
    <rect x="2.5" y="6.5" width="19" height="11.5" rx="2.5" fill="url(#g-wallet)" stroke="#0D3A12" strokeWidth="0.4" />
    <rect x="2.5" y="9" width="19" height="1.2" fill="white" opacity="0.14" />
    <rect x="14.5" y="10.2" width="4.5" height="3.6" rx="1" fill="#FFD54F" stroke="#8D6E00" strokeWidth="0.4" />
    <circle cx="16.7" cy="12" r="0.7" fill="#1B5E20" />
    <path d="M7 14.5H11" stroke="white" strokeWidth="0.8" strokeLinecap="round" opacity="0.7" />
  </svg>
);

export const IconReceipt = ({ size = 18, className = "" }: Props) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={baseStyle}>
    <defs>
      <linearGradient id="g-receipt" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#FFF8E1" />
        <stop offset="100%" stopColor="#FFE0B2" />
      </linearGradient>
    </defs>
    <path d="M7 2.5H17a1.2 1.2 0 0 1 1.2 1.2V19.5l-2.2-1.6-2.2 1.6-2.2-1.6-2.2 1.6-2.2-1.6V3.7A1.2 1.2 0 0 1 7 2.5Z" fill="url(#g-receipt)" stroke="#E6A756" strokeWidth="0.6" />
    <path d="M9 8.5H15M9 11.5H15M9 14.5H13" stroke="#8D6E00" strokeWidth="1" strokeLinecap="round" />
    <circle cx="15.5" cy="6" r="1" fill="#4CAF50" stroke="white" strokeWidth="0.6" />
    <path d="M7 2.5H17a1.2 1.2 0 0 1 1.2 1.2V6H7z" fill="white" opacity="0.45" />
  </svg>
);

export const IconKey = ({ size = 18, className = "" }: Props) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={baseStyle}>
    <defs>
      <linearGradient id="g-key" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#FFD54F" />
        <stop offset="100%" stopColor="#FF8F00" />
      </linearGradient>
    </defs>
    <circle cx="8.5" cy="8.5" r="4.2" fill="url(#g-key)" stroke="#8D6E00" strokeWidth="0.5" />
    <circle cx="8.5" cy="8.5" r="1.8" fill="white" />
    <circle cx="8.5" cy="8.5" r="0.9" fill="#8D6E00" />
    <path d="M11.8 11.8L17.5 17.5" stroke="#5D4037" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M14.5 15.2L16.8 17.5L19.2 15.1L16.9 12.8Z" fill="#5D4037" stroke="#3E2723" strokeWidth="0.4" />
  </svg>
);

export const IconSparkles = ({ size = 18, className = "" }: Props) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={baseStyle}>
    <defs>
      <radialGradient id="g-spark" cx="0.5" cy="0.5" r="0.7">
        <stop offset="0%" stopColor="#FF6B1A" />
        <stop offset="100%" stopColor="#FFD54F" />
      </radialGradient>
      <filter id="glow-spark"><feGaussianBlur stdDeviation="0.6" /></filter>
    </defs>
    <path d="M12 3L13.3 7.7L18 9L13.3 10.3L12 15L10.7 10.3L6 9L10.7 7.7Z" fill="url(#g-spark)" stroke="#E65100" strokeWidth="0.5" filter="url(#glow-spark)" />
    <path d="M19 11L19.9 13.2L22 14L19.9 14.8L19 17L18.1 14.8L16 14L18.1 13.2Z" fill="#FFB74D" stroke="#E65100" strokeWidth="0.4" />
    <path d="M5 14.5L5.8 16.7L8 17.5L5.8 18.3L5 20.5L4.2 18.3L2 17.5L4.2 16.7Z" fill="#FFE0B2" stroke="#E65100" strokeWidth="0.4" />
  </svg>
);

export const IconLogout = ({ size = 18, className = "" }: Props) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={baseStyle}>
    <defs>
      <linearGradient id="g-logout" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#EF9A9A" />
        <stop offset="100%" stopColor="#C62828" />
      </linearGradient>
    </defs>
    <rect x="4" y="4" width="13" height="16" rx="2.5" fill="white" stroke="#C62828" strokeWidth="0.6" />
    <rect x="4" y="4" width="13" height="3" rx="1.2" fill="#FFEBEE" />
    <path d="M11 12H19M15 8.5L19 12L15 15.5" stroke="url(#g-logout)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="5.5" cy="6" r="0.7" fill="#C62828" />
  </svg>
);

export const IconSearch = ({ size = 18, className = "" }: Props) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={baseStyle}>
    <defs>
      <linearGradient id="g-search" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#42A5F5" />
        <stop offset="100%" stopColor="#0D47A1" />
      </linearGradient>
    </defs>
    <circle cx="11" cy="11" r="6.2" fill="white" stroke="url(#g-search)" strokeWidth="1.1" />
    <circle cx="11" cy="11" r="2.2" fill="#E3F2FD" />
    <path d="M16.2 16.2L19.5 19.5" stroke="url(#g-search)" strokeWidth="1.7" strokeLinecap="round" />
    <circle cx="11" cy="11" r="6.2" stroke="white" strokeWidth="0.4" opacity="0.5" />
  </svg>
);

export const IconEye = ({ size = 18, className = "" }: Props) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={baseStyle}>
    <defs>
      <radialGradient id="g-eye" cx="0.5" cy="0.5" r="0.7">
        <stop offset="0%" stopColor="#4FC3F7" />
        <stop offset="100%" stopColor="#0277BD" />
      </radialGradient>
    </defs>
    <path d="M2.5 12S5.8 6.5 12 6.5S21.5 12 21.5 12S18.2 17.5 12 17.5S2.5 12 2.5 12Z" fill="white" stroke="#0277BD" strokeWidth="0.7" />
    <circle cx="12" cy="12" r="3.2" fill="url(#g-eye)" stroke="#01579B" strokeWidth="0.5" />
    <circle cx="12" cy="12" r="1.4" fill="white" />
    <circle cx="13.2" cy="11" r="0.6" fill="white" opacity="0.9" />
  </svg>
);

export const IconEdit = ({ size = 16, className = "" }: Props) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={baseStyle}>
    <defs>
      <linearGradient id="g-edit" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#FFB74D" />
        <stop offset="100%" stopColor="#E65100" />
      </linearGradient>
    </defs>
    <path d="M13.8 4.2L18.8 9.2L8.2 19.8H3.2V14.8L13.8 4.2Z" fill="url(#g-edit)" stroke="#BF360C" strokeWidth="0.5" />
    <path d="M13 6.2L17 10.2" stroke="white" strokeWidth="0.7" strokeLinecap="round" opacity="0.85" />
    <path d="M3.2 14.8L3.2 19.8H8.2" stroke="#8D4000" strokeWidth="0.4" />
  </svg>
);

export const IconTrash = ({ size = 16, className = "" }: Props) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={baseStyle}>
    <defs>
      <linearGradient id="g-trash" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#EF5350" />
        <stop offset="100%" stopColor="#B71C1C" />
      </linearGradient>
    </defs>
    <path d="M6 7H18M9 7V4.2H15V7M8 10.5V18.5M16 10.5V18.5M6.5 7L7.5 19.2A2 2 0 0 0 9.5 21.2H14.5A2 2 0 0 0 16.5 19.2L17.5 7" fill="url(#g-trash)" stroke="#7F0000" strokeWidth="0.5" strokeLinejoin="round" />
    <rect x="9" y="4.2" width="6" height="1" rx="0.5" fill="#FFCDD2" />
  </svg>
);

export const IconCamera = ({ size = 16, className = "" }: Props) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={baseStyle}>
    <defs>
      <linearGradient id="g-cam" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#78909C" />
        <stop offset="100%" stopColor="#263238" />
      </linearGradient>
    </defs>
    <rect x="3" y="6.5" width="18" height="11.5" rx="2.5" fill="url(#g-cam)" stroke="#102027" strokeWidth="0.5" />
    <circle cx="12" cy="12.2" r="3.8" fill="#37474F" stroke="white" strokeWidth="0.7" />
    <circle cx="12" cy="12.2" r="2" fill="#263238" stroke="#4FC3F7" strokeWidth="0.4" />
    <circle cx="10.5" cy="10.8" r="0.7" fill="white" opacity="0.85" />
    <path d="M9 6.5L10 5H14L15 6.5" stroke="#102027" strokeWidth="0.7" fill="#546E7A" />
    <circle cx="18.5" cy="8.5" r="1" fill="#FFD54F" stroke="white" strokeWidth="0.4" />
  </svg>
);

export const IconBell = ({ size = 18, className = "" }: Props) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={baseStyle}>
    <defs>
      <linearGradient id="g-bell" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#FFD54F" />
        <stop offset="100%" stopColor="#FF8F00" />
      </linearGradient>
    </defs>
    <path d="M6.5 14V10.2A5.5 5.5 0 0 1 12 4.7A5.5 5.5 0 0 1 17.5 10.2V14L19 16H5L6.5 14Z" fill="url(#g-bell)" stroke="#E65100" strokeWidth="0.6" />
    <path d="M10 18A2 2 0 0 0 14 18" stroke="#E65100" strokeWidth="0.9" strokeLinecap="round" fill="white" />
    <circle cx="12" cy="8.5" r="1" fill="white" opacity="0.45" />
  </svg>
);

export const IconWhatsapp = ({ size = 18, className = "" }: Props) => (
  <svg width={size + 6} height={size + 6} viewBox="0 0 24 24" fill="none" className={className} style={{ ...baseStyle, background: "transparent" }}>
    <defs>
      <linearGradient id="g-wa" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#25D366" />
        <stop offset="100%" stopColor="#128C7E" />
      </linearGradient>
      <filter id="wa-shadow"><feDropShadow dx="0" dy="1" stdDeviation="1.2" floodOpacity="0.25" /></filter>
    </defs>
    <rect x="1" y="1" width="22" height="22" rx="6" fill="url(#g-wa)" filter="url(#wa-shadow)" />
    <path d="M7.2 16.8L8.1 13.5C8.1 13.5 9.3 15.2 12 15.2C14.7 15.2 16.2 13.5 16.2 11.2C16.2 8.9 14.1 7 12 7C9.9 7 7.8 8.9 7.8 11.2C7.8 12 8 12.8 8.4 13.5L7.2 16.8Z" fill="white" />
    <path d="M9.5 10.8C9.5 10.8 9.7 9.5 12 9.5C14.3 9.5 14.8 10.8 14.8 11.2C14.8 12.8 13.5 13.8 12 13.8C10.8 13.8 9.8 13.2 9.2 12.2L9.5 10.8Z" fill="#25D366" />
    <path d="M10.2 11.5L11 12.3L13.2 10.2" stroke="white" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
