import { useState } from "react";

// Knop die een tekst naar het klembord kopieert (bijv. de vraag aan je leverancier) en even "Gekopieerd" toont.
// Met `paginaAdres` kopieert hij het adres van de huidige pagina (om door te sturen).
/** `licht`: voor op een donker vlak (doorschijnend wit). */
export default function KopieerKnop({ tekst, paginaAdres, licht, label = "Kopieer de vraag" }: { tekst?: string; paginaAdres?: boolean; licht?: boolean; label?: string }) {
  const [klaar, setKlaar] = useState(false);
  const kopieer = async () => {
    try {
      const inhoud = paginaAdres ? window.location.href.split("#")[0] : (tekst ?? "");
      await navigator.clipboard.writeText(inhoud);
      setKlaar(true);
      setTimeout(() => setKlaar(false), 2500);
    } catch {
      // Geen klembord (oude browser of geen toestemming): de tekst staat er leesbaar, dus niets aan de hand.
    }
  };
  return (
    <button
      type="button"
      onClick={kopieer}
      className={`inline-flex min-h-[44px] cursor-pointer items-center gap-2 whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-semibold transition-colors ${
        licht
          ? "border border-white/40 bg-white/10 text-white hover:border-white hover:bg-white/20"
          : "border border-[#D6C9C4] bg-white text-inkt hover:border-dark hover:text-dark"
      }`}
    >
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {klaar ? (
          <path d="m5 12 5 5L20 7" />
        ) : paginaAdres ? (
          <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
        ) : (
          <>
            <rect x="9" y="9" width="12" height="12" rx="2" />
            <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
          </>
        )}
      </svg>
      <span aria-live="polite">{klaar ? "Gekopieerd" : label}</span>
    </button>
  );
}
