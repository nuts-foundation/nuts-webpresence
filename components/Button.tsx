import React from "react"

// De standaardknop van nuts.nl. Gebruik altijd deze component (of knopStijl) voor knoppen,
// zodat vorm, kleur, maat en hover overal gelijk zijn. Zie README, sectie "Style".

export type KnopVariant =
  | "primair"    // Nuts-rood, witte tekst: de hoofdactie
  | "secundair"  // omlijnd op een lichte achtergrond
  | "geel"       // geel met donkere tekst: tweede actie op rood of donkerblauw
  | "op-donker"; // omlijnd wit op rood of donkerblauw

const BASIS =
  "inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-full px-5 py-2.5 " +
  "text-center text-sm font-semibold transition-colors " +
  "focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-dark-gray";

const VARIANT: Record<KnopVariant, string> = {
  primair: "bg-brand text-white hover:bg-dark",
  secundair: "border border-zand-donker text-inkt hover:border-brand hover:text-brand",
  geel: "bg-button text-text hover:bg-button-hover",
  "op-donker": "border border-white/50 text-white hover:border-white hover:bg-white/10",
};

/** De klassen van de standaardknop, voor als het element geen link is (bijv. een <button> met onClick). */
export function knopStijl(variant: KnopVariant = "primair", extra = "") {
  return `${BASIS} ${VARIANT[variant]} ${extra}`.trim();
}

/** Klassen voor een filter- of keuzeknopje (pil), met een actieve stand in Nuts-rood. */
export function keuzeStijl(actief: boolean, extra = "") {
  return (
    "inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-colors " +
    "focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-dark-gray " +
    (actief ? "border-brand bg-brand text-white" : "border-zand bg-white text-inkt hover:border-brand") +
    (extra ? " " + extra : "")
  );
}

/** Een adres buiten nuts.nl (opent in een nieuw tabblad). */
export const isExtern = (href: string) => /^https?:\/\//.test(href) && !/^https?:\/\/(www\.)?nuts\.nl(\/|$)/.test(href);

/**
 * De pijl achter een link of knop: → naar een pagina op nuts.nl, ↗ naar een externe site (nieuw tabblad).
 * Altijd deze gebruiken in plaats van zelf een pijl te typen (zie README, sectie "Style").
 */
export function Pijl({ href, className = "" }: { href: string; className?: string }) {
  const extern = isExtern(href);
  return (
    <>
      {/* inline-block: de pijl wordt nooit meeonderstreept met de linktekst */}
      <span aria-hidden="true" className={`inline-block ${className}`.trim()}>{extern ? "↗" : "→"}</span>
      {extern && <span className="sr-only">(opent in een nieuw tabblad)</span>}
    </>
  );
}

interface Props extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "className"> {
  href: string;
  variant?: KnopVariant;
  /** Oude prop: `secondary` is de gele knop. Gebruik liever variant="geel". */
  secondary?: boolean;
  /** Opent in een nieuw tabblad. Standaard voor adressen die met http beginnen. */
  extern?: boolean;
  /** Alleen voor plaatsing (marge, uitlijning, breedte), niet voor kleur of vorm. */
  className?: string;
  children?: React.ReactNode;
}

export default function Button({ href, variant, secondary, extern, className = "", children, ...rest }: Props) {
  const v: KnopVariant = variant ?? (secondary ? "geel" : "primair");
  const nieuwTabblad = extern ?? isExtern(href);
  return (
    <a href={href} className={knopStijl(v, className)} {...(nieuwTabblad ? { target: "_blank", rel: "noopener noreferrer" } : {})} {...rest}>
      {children}
    </a>
  );
}

interface InputButtonProps {
  inputName: string,
  buttonText: string,
  placeholderText: string,
  buttonType: "submit" | "button";
}

export function InputButton({ inputName, buttonText, placeholderText, buttonType }: InputButtonProps) {
  return (<div className="flex w-full">
    <input name={inputName} className="w-0 grow rounded-full rounded-r-none text-sm font-inter px-6 py-3 border border-t-button border-l-button border-b-button border-r-0" placeholder={placeholderText} />
    <button type={buttonType} className="text-center w-48 py-3 shrink-0 cursor-pointer rounded-full rounded-l-none text-sm font-inter transition-colors bg-button hover:bg-button-hover">
      {buttonText}
    </button>
  </div>)
}
