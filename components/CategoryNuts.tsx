import { useMemo, useState } from "react";
import config from "../config/category.json";
import KennisbankIcon from "./KennisbankIcon";

// Naam → adres: accenten eraf (cliëntbeeld → clientbeeld), de rest wordt een streepje.
function nameToSlug(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type Toepassing = {
  name: string;
  category: string | string[];
  phase: string;
  text: string;
  links?: { label: string; url: string }[];
};

type Category = { id: string; label: string; abbr: string; icon?: string; description: string };
type Phase = { id: string; label: string };

// Kleur van het statusbolletje per fase (huisstijl-tokens fase-*). Altijd met tekstlabel.
const FASE_KLEUR: Record<string, string> = {
  idee: "#8B97A8",
  poc: "#D15949",
  ontwikkeling: "#FEC248",
  productie: "#2E8A4F",
};

const catsVan = (t: Toepassing) => (Array.isArray(t.category) ? t.category : [t.category]);

export default function CategoryNuts({ availableSlugs = [] }: { availableSlugs?: string[] }) {
  const slugSet = new Set(availableSlugs);
  const { categories, phases, toepassingen } = config as {
    categories: Category[];
    phases: Phase[];
    toepassingen: Toepassing[];
  };

  const [activeCategory, setActiveCategory] = useState("all");
  const [activePhase, setActivePhase] = useState("all");

  const filtered = useMemo(
    () => toepassingen.filter((t) =>
      (activeCategory === "all" || catsVan(t).includes(activeCategory)) &&
      (activePhase === "all" || t.phase === activePhase)
    ),
    [toepassingen, activeCategory, activePhase]
  );

  const categoryLabel = (id: string) => categories.find((c) => c.id === id)?.label ?? id;
  const phaseLabel = (id: string) => phases.find((p) => p.id === id)?.label ?? id;
  const isGefilterd = activeCategory !== "all" || activePhase !== "all";

  const toonCategorie = (id: string) => {
    setActiveCategory(id);
    setActivePhase("all");
    document.getElementById("alle-toepassingen")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="space-y-12 md:space-y-[72px]">
      <section id="categorieen" className="scroll-mt-8">
        <h2 className="mb-2.5 font-redhat text-2xl font-bold leading-tight text-[#1C2A39] md:text-[30px]">
          Soorten toepassingen binnen het Nuts‑netwerk
        </h2>
        <p className="mb-7 max-w-[72ch] leading-[1.7] text-[#1C2A39]">
          We hebben de Nuts‑toepassingen ingedeeld in categorieën. Hieronder leggen we uit wat elke categorie inhoudt en waarin ze van elkaar verschillen — steeds met een eigen manier waarop zorgorganisaties digitaal samenwerken en gegevens uitwisselen.
        </p>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {categories.map((category) => {
            return (
              <article key={category.id} className="flex items-start gap-[18px] rounded-xl border border-[#F0E7E5] bg-[#FBF6F4] p-6">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#B84A3C] text-sm font-bold text-white">
                  {category.icon ? <KennisbankIcon name={category.icon} size={22} /> : category.abbr}
                </span>
                <div className="flex min-w-0 flex-col gap-2">
                  <h3 className="font-redhat text-[19px] font-bold leading-tight text-[#1C2A39]">{category.label}</h3>
                  <p className="text-sm leading-[1.65] text-[#1C2A39]">{category.description}</p>
                  <button
                    type="button"
                    onClick={() => toonCategorie(category.id)}
                    className="mt-1 self-start text-sm font-semibold text-[#B84A3C] hover:text-[#7D352C] hover:underline"
                  >
                    {/* Geen aantal: een toepassing kan in meer categorieën vallen (Geboortezorg), dan klopt de som niet met het totaal. */}
                    Toon toepassingen &rarr;
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section id="alle-toepassingen" className="scroll-mt-8">
        <h2 className="mb-2.5 font-redhat text-2xl font-bold leading-tight text-[#1C2A39] md:text-[30px]">Alle toepassingen</h2>
        <p className="mb-6 leading-[1.7] text-[#1C2A39]">Filter op categorie of op de fase waarin een toepassing zich bevindt.</p>

        <div className="flex flex-col gap-4 rounded-xl border border-[#F0E7E5] bg-[#FBF6F4] p-5">
          <div role="group" aria-label="Filter op categorie" className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="w-24 shrink-0 text-xs font-semibold uppercase tracking-[0.04em] text-[#1C2A39]">Categorie</span>
            <div className="flex flex-wrap gap-2">
              <FilterChip active={activeCategory === "all"} onClick={() => setActiveCategory("all")}>Alle</FilterChip>
              {categories.map((category) => (
                <FilterChip key={category.id} active={activeCategory === category.id} onClick={() => setActiveCategory(category.id)}>
                  {category.label}
                </FilterChip>
              ))}
            </div>
          </div>

          <div role="group" aria-label="Filter op fase" className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="w-24 shrink-0 text-xs font-semibold uppercase tracking-[0.04em] text-[#1C2A39]">Fase</span>
            <div className="flex flex-wrap gap-2">
              <FilterChip active={activePhase === "all"} onClick={() => setActivePhase("all")}>Alle</FilterChip>
              {phases.map((phase) => (
                <FilterChip key={phase.id} active={activePhase === phase.id} onClick={() => setActivePhase(phase.id)} dot={FASE_KLEUR[phase.id]}>
                  {phase.label}
                </FilterChip>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-5 mt-3.5 flex flex-wrap items-center justify-between gap-2">
          <p aria-live="polite" className="text-[13px] text-[#5B6470]">
            {filtered.length === toepassingen.length
              ? `${toepassingen.length} toepassingen`
              : `${filtered.length} van ${toepassingen.length} toepassingen`}
          </p>
          {isGefilterd && (
            <button
              type="button"
              onClick={() => { setActiveCategory("all"); setActivePhase("all"); }}
              className="px-1 py-2 text-[13px] font-semibold text-[#B84A3C] underline"
            >
              Filters wissen
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-xl bg-[#F0E7E5] p-10 text-center text-[15px] text-[#1C2A39]">
            Geen toepassingen gevonden bij deze filtercombinatie.
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-4">
            {filtered.map((toepassing) => {
              const slug = nameToSlug(toepassing.name);
              return (
                <article key={toepassing.name} className="flex flex-col rounded-xl border border-[#F0E7E5] bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.025em] text-[#B84A3C]">
                    {catsVan(toepassing).map(categoryLabel).join(", ")}
                  </p>
                  <h3 className="mb-2 font-redhat text-xl font-bold leading-tight text-[#1C2A39]">{toepassing.name}</h3>
                  <p className="mb-4 text-sm leading-[1.65] text-[#1C2A39]">{toepassing.text}</p>

                  {slugSet.has(slug) && (
                    <a
                      href={`/toepassingen/${slug}`}
                      className="mb-4 self-start rounded bg-[#B84A3C] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#7D352C]"
                    >
                      Lees meer
                    </a>
                  )}
                  {toepassing.links?.map((link) => (
                    <a
                      key={link.url}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mb-4 inline-flex items-center gap-1 self-start text-sm font-semibold text-[#B84A3C] hover:text-[#7D352C] hover:underline"
                    >
                      {link.label} <span aria-hidden="true">&nearr;</span>
                    </a>
                  ))}

                  <div className="mt-auto flex items-center gap-2 border-t border-[#F0E7E5] pt-3">
                    <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{ background: FASE_KLEUR[toepassing.phase] ?? "#8B97A8" }} />
                    <span className="text-xs text-[#1C2A39]">{phaseLabel(toepassing.phase)}</span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function FilterChip({ active, onClick, dot, children }: { active: boolean; onClick: () => void; dot?: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex min-h-[44px] items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-colors duration-150 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#101828] ${
        active ? "border-[#B84A3C] bg-[#B84A3C] text-white" : "border-[#F0E7E5] bg-white text-[#1C2A39] hover:border-[#B84A3C]"
      }`}
    >
      {dot && <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full shadow-[0_0_0_2px_#fff]" style={{ background: dot }} />}
      {children}
    </button>
  );
}
