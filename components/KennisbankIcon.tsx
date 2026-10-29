import React from "react";

const paths: { [name: string]: React.ReactElement } = {
  zorgverlener: <path d="M12 21s-7-4.4-9.3-9A5.2 5.2 0 0 1 12 6.6 5.2 5.2 0 0 1 21.3 12C19 16.6 12 21 12 21Z" />,
  ontwikkelaar: <path d="m8 7-5 5 5 5M16 7l5 5-5 5M14 4l-4 16" />,
  organisatie: <path d="M3 21h18M5 21V10l7-5 7 5v11M9 21v-6h6v6" />,
  toepassingen: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  techniek: (
    <>
      <circle cx="12" cy="12" r="3" />
      <circle cx="4.5" cy="5" r="2" />
      <circle cx="19.5" cy="5" r="2" />
      <circle cx="12" cy="21" r="2" />
      <path d="m6 6.5 4 3.5M18 6.5 14 10M12 15v4" />
    </>
  ),
  wiki: (
    <>
      <path d="M4 19.5V5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2Zm0 0A2 2 0 0 0 6 22h13" />
      <path d="M9 8h6M9 12h4" />
    </>
  ),
  omlaag: <path d="M12 5v14M6 13l6 6 6-6" />,
};

interface Props {
  name: string;
  size?: number;
  className?: string;
}

export default function KennisbankIcon({ name, size = 20, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {paths[name]}
    </svg>
  );
}
