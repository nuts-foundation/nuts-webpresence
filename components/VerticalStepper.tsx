import config from "../config/steps.json";
import KennisbankIcon from "./KennisbankIcon";

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

const extern = (url: string) => /^https?:\/\//.test(url);

// De stappen op /starten: een rustige tijdlijn met per stap een kaart.
// Eén duidelijke hoofdknop per stap; overige links als tekstlink, zodat het niet druk wordt.
export default function VerticalStepper() {
  return (
    <ol className="relative">
      {/* De lijn loopt van het eerste tot het laatste nummer. */}
      <span aria-hidden="true" className="absolute bottom-8 left-[23px] top-8 hidden w-0.5 bg-[#F0E7E5] sm:block" />
      {STAPPEN.map((stap) => {
        const [hoofd, ...rest] = stap.links ?? [];
        return (
          <li key={stap.number} id={stapId(stap)} className="relative scroll-mt-8 pb-5 last:pb-0 sm:pb-8 sm:pl-20">
            <span
              aria-hidden="true"
              className="absolute left-0 top-5 hidden h-12 w-12 items-center justify-center rounded-full bg-[#D15949] font-redhat text-lg font-bold text-white shadow-sm ring-4 ring-white sm:flex"
            >
              {stap.number}
            </span>
            <article className="rounded-2xl border border-[#F0E7E5] bg-white p-5 shadow-sm sm:p-8">
              <div className="flex items-start gap-4">
                {stap.icon && (
                  <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#FCE5D3] text-[#D15949]">
                    <KennisbankIcon name={stap.icon} size={20} />
                  </span>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#B84A3C]">Stap {stap.number}</p>
                  <h2 className="mt-1 font-redhat text-xl font-bold leading-tight text-[#1C2A39] md:text-2xl">{stap.title}</h2>
                </div>
              </div>
              <p className="mt-4 max-w-[68ch] text-[15px] leading-relaxed text-[#1C2A39]">{stap.text}</p>
              {stap.bullets && (
                <ul className="mt-5 grid gap-2.5 md:grid-cols-2">
                  {stap.bullets.map((b) => (
                    <li key={b} className="flex gap-2.5 rounded-xl bg-[#FBF6F4] px-4 py-3 text-sm leading-snug text-[#1C2A39]">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#D15949" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mt-0.5 shrink-0">
                        <path d="m5 12 5 5L20 7" />
                      </svg>
                      {b}
                    </li>
                  ))}
                </ul>
              )}
              {hoofd && (
                <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
                  <a
                    href={hoofd.url}
                    {...(extern(hoofd.url) ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[#B84A3C] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#7D352C]"
                  >
                    {hoofd.label}
                    <span aria-hidden="true">{extern(hoofd.url) ? "↗" : "→"}</span>
                  </a>
                  {rest.map((l) => (
                    <a
                      key={l.url}
                      href={l.url}
                      {...(extern(l.url) ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#B84A3C] underline decoration-[#F0C9C2] decoration-2 underline-offset-4 hover:text-[#7D352C] hover:decoration-[#B84A3C]"
                    >
                      {l.label}
                      <span aria-hidden="true">{extern(l.url) ? "↗" : "→"}</span>
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
