import config from "../config/steps.json";
import KennisbankIcon from "./KennisbankIcon";
import Button, { Pijl, isExtern } from "./Button";

type Stap = {
  number: number;
  title: string;
  icon?: string;
  text: string;
  bullets?: string[];
  links?: { label: string; url: string }[];
};

export const STAPPEN = config.steps as Stap[];

/** Anker per stap, zodat het overzicht bovenaan de pagina ernaar kan springen. */
export const stapId = (s: Stap) => `stap-${s.number}`;


// De stappen op /starten: een rustige tijdlijn met per stap een kaart.
// Eén duidelijke hoofdknop per stap; overige links als tekstlink, zodat het niet druk wordt.
export default function VerticalStepper() {
  return (
    <ol className="relative">
      {/* De lijn loopt van het eerste tot het laatste nummer. */}
      <span aria-hidden="true" className="absolute bottom-8 left-[23px] top-8 hidden w-0.5 bg-zand sm:block" />
      {STAPPEN.map((stap) => {
        const [hoofd, ...rest] = stap.links ?? [];
        return (
          <li key={stap.number} id={stapId(stap)} className="relative scroll-mt-8 pb-5 last:pb-0 sm:pb-8 sm:pl-20">
            <span
              aria-hidden="true"
              className="absolute left-0 top-5 hidden h-12 w-12 items-center justify-center rounded-full bg-brand font-redhat text-lg font-bold text-white ring-4 ring-white sm:flex"
            >
              {stap.number}
            </span>
            <article className="rounded-2xl border border-zand bg-white p-5 sm:p-8">
              <div className="flex items-start gap-4">
                {stap.icon && (
                  <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-perzik text-brand">
                    <KennisbankIcon name={stap.icon} size={20} />
                  </span>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-brand">Stap {stap.number}</p>
                  <h2 className="mt-1 font-redhat text-xl font-bold leading-tight text-inkt md:text-2xl">{stap.title}</h2>
                </div>
              </div>
              <p className="mt-4 max-w-[68ch] text-[15px] leading-relaxed text-inkt">{stap.text}</p>
              {stap.bullets && (
                <ul className="mt-5 grid gap-2.5 md:grid-cols-2">
                  {stap.bullets.map((b) => (
                    <li key={b} className="flex gap-2.5 rounded-xl bg-creme px-4 py-3 text-sm leading-snug text-inkt">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mt-0.5 shrink-0 text-brand">
                        <path d="m5 12 5 5L20 7" />
                      </svg>
                      {b}
                    </li>
                  ))}
                </ul>
              )}
              {hoofd && (
                <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
                  <Button href={hoofd.url}>
                    {hoofd.label}
                    <Pijl href={hoofd.url} />
                  </Button>
                  {rest.map((l) => (
                    <a
                      key={l.url}
                      href={l.url}
                      {...(isExtern(l.url) ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      className="group inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:text-dark"
                    >
                      {/* Alleen de tekst onderstreept, niet het pijltje erachter */}
                      <span className="underline decoration-onderstreep decoration-2 underline-offset-4 group-hover:decoration-dark">{l.label}</span>
                      <Pijl href={l.url} />
                    </a>
                  ))}
                </div>
              )}
            </article>
          </li>
        );
      })}
    </ol>
  );
}
