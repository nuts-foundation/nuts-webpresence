import React from "react";
import KennisbankIcon from "./KennisbankIcon";

// Paginakop volgens de Nuts-huisstijl: een afgeronde kaart binnen de paginabreedte,
// tekst links en een beeld (of ander blok) rechts. Variant "blauw" is voor de kennisbank.

interface Knop {
  href: string;
  label: string;
}

interface Props {
  terug?: Knop;
  eyebrow: { icon: string; label: string };
  titel: string;
  introHtml?: string;
  primair?: Knop;
  secundair?: Knop;
  beeld?: { src: string; alt: string };
  aside?: React.ReactNode;
  variant?: "warm" | "blauw";
  /** Het Nuts-motief als lichte vorm in de kaart (zoals "Hoe werkt Nuts?" op de homepage). */
  motief?: boolean;
  children?: React.ReactNode;
}

const VARIANT = {
  warm: {
    kaart: "bg-[#FBF6F4] border-[#F0E7E5]",
    eyebrow: "text-[#B84A3C]",
    icoonVlak: "bg-[#FCE5D3] text-[#D15949]",
    primair: "bg-[#B84A3C] hover:bg-[#7D352C]",
    secundairHover: "hover:border-[#B84A3C] hover:text-[#B84A3C]",
    terugHover: "hover:text-[#B84A3C]",
  },
  blauw: {
    kaart: "bg-[#F1F9FB] border-[#DCEBEF]",
    eyebrow: "text-[#245371]",
    icoonVlak: "bg-white text-[#245371]",
    primair: "bg-[#245371] hover:bg-[#0B122C]",
    secundairHover: "hover:border-[#245371] hover:text-[#245371]",
    terugHover: "hover:text-[#245371]",
  },
};

export default function PaginaKop({ terug, eyebrow, titel, introHtml, primair, secundair, beeld, aside, variant = "warm", motief = false, children }: Props) {
  const v = VARIANT[variant];
  return (
    <header className="mx-auto max-w-[1440px] px-4 pt-5 md:pt-8">
      <div className={`relative grid overflow-hidden rounded-[2rem] border shadow-sm lg:grid-cols-2 ${v.kaart}`}>
        {motief && <NutsMotief className="pointer-events-none absolute -bottom-[30%] -right-[6%] h-[130%] text-[#D15949] opacity-[0.07]" />}
        <div className="relative flex flex-col justify-center px-6 py-10 sm:px-9 md:px-12 lg:px-16 lg:py-14">
          {terug && (
            <a href={terug.href} className={`mb-7 self-start text-sm font-medium text-[#5B6470] transition-colors ${v.terugHover}`}>
              &larr; {terug.label}
            </a>
          )}
          <div className={`mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] ${v.eyebrow}`}>
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${v.icoonVlak}`}>
              <KennisbankIcon name={eyebrow.icon} size={16} />
            </span>
            {eyebrow.label}
          </div>
          <h1 className="font-redhat text-4xl font-bold leading-tight text-[#1C2A39] lg:text-5xl">{titel}</h1>
          {introHtml && <div className="paginakop-intro mt-5 max-w-[65ch]" dangerouslySetInnerHTML={{ __html: introHtml }} />}
          {(primair || secundair) && (
            <div className="mt-7 flex flex-wrap gap-3">
              {primair && (
                <a href={primair.href} className={`inline-block rounded-full px-5 py-3 text-sm font-semibold text-white transition-colors ${v.primair}`}>
                  {primair.label}
                </a>
              )}
              {secundair && (
                <a href={secundair.href} className={`inline-block rounded-full border border-[#D6C9C4] px-5 py-3 text-sm font-semibold text-[#1C2A39] transition-colors ${v.secundairHover}`}>
                  {secundair.label}
                </a>
              )}
            </div>
          )}
          {children}
        </div>
        {beeld && (
          <div className="flex items-center justify-center p-6">
            <img src={beeld.src} alt={beeld.alt} className="block h-auto w-full rounded-3xl" loading="eager" />
          </div>
        )}
        {aside && <div className="relative flex flex-col justify-center px-6 pb-10 sm:px-9 md:px-12 lg:py-14 lg:pl-0 lg:pr-16">{aside}</div>}
      </div>
    </header>
  );
}

/** De "n" uit het Nuts-logo, als achtergrondvorm (kleur via currentColor). */
export function NutsMotief({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 152.31 119.71" aria-hidden="true" focusable="false" className={className}>
      <path fill="currentColor" d="M128.49,30.76V72.81q0,25.62-20.23,25.62-19.61,0-20.18-24.13V46.37q0-14.19-3-21.39a36.52,36.52,0,0,0-10.48-14.5Q62.57,0,44,0T13.34,10.48A35.94,35.94,0,0,0,3.07,25,66.37,66.37,0,0,0,0,46.37v73.31c.64-.7,1.26-1.4,2-2.06A40.69,40.69,0,0,1,23.82,107V46.9q0-25.62,20.22-25.62,19.62,0,20.18,24.13V73.34q0,14.19,3,21.39a36.42,36.42,0,0,0,10.48,14.5q12.06,10.49,30.59,10.48T139,109.23a35.94,35.94,0,0,0,10.27-14.5,66.65,66.65,0,0,0,3.07-21.39V30.76Z" />
    </svg>
  );
}

// Inhoud onder de Paginakop: zelfde buitenbreedte en binnenmarge als de kaart,
// zodat alles op één lijn met de koptekst begint (+1px voor de rand van de kaart).
export function PaginaInhoud({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`mx-auto max-w-[1440px] px-4 ${className}`}>
      <div className="px-[calc(1.5rem+1px)] sm:px-[calc(2.25rem+1px)] md:px-[calc(3rem+1px)] lg:px-[calc(4rem+1px)]">{children}</div>
    </div>
  );
}
