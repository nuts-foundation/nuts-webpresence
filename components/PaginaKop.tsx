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

export default function PaginaKop({ terug, eyebrow, titel, introHtml, primair, secundair, beeld, aside, variant = "warm", children }: Props) {
  const v = VARIANT[variant];
  return (
    <header className="mx-auto max-w-[1440px] px-4 pt-5 md:pt-8">
      <div className={`grid overflow-hidden rounded-[2rem] border shadow-sm lg:grid-cols-2 ${v.kaart}`}>
        <div className="flex flex-col justify-center px-6 py-10 sm:px-9 md:px-12 lg:px-16 lg:py-14">
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
        {aside && <div className="flex flex-col justify-center px-6 pb-10 sm:px-9 md:px-12 lg:py-14 lg:pl-0 lg:pr-16">{aside}</div>}
      </div>
    </header>
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
