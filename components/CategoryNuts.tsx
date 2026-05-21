import { useState, useMemo } from "react";
import config from "../config/category.json";

type Toepassing = {
  name: string;
  category: string | string[];
  phase: string;
  text: string;
  links?: { label: string; url: string }[];
};

type Category = { id: string; label: string; abbr: string; description: string };
type Phase = { id: string; label: string };

export default function CategoryNuts() {
  const { categories, phases, toepassingen } = config as {
    categories: Category[];
    phases: Phase[];
    toepassingen: Toepassing[];
  };

  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [activePhase, setActivePhase] = useState<string>("all");

  const filtered = useMemo(
    () =>
      toepassingen.filter((t) => {
        const cats = Array.isArray(t.category) ? t.category : [t.category];
        return (
          (activeCategory === "all" || cats.includes(activeCategory)) &&
          (activePhase === "all" || t.phase === activePhase)
        );
      }),
    [toepassingen, activeCategory, activePhase]
  );

  const categoryLabel = (id: string) =>
    categories.find((c) => c.id === id)?.label ?? id;

  const phaseLabel = (id: string) =>
    phases.find((p) => p.id === id)?.label ?? id;

  const phaseDot: Record<string, string> = {
    idee: "bg-[#8B97A8]",
    poc: "bg-[#D15949]",
    ontwikkeling: "bg-[#FEC248]",
    productie: "bg-[#2E8A4F]",
  };

  const total = toepassingen.length;
  const shown = filtered.length;

  return (
    <div className="mt-12 space-y-10">
      <div>
        <h2 className="text-2xl font-bold text-[#1C2A39] mb-2">
          Soorten toepassingen binnen het Nuts‑netwerk
        </h2>
        <p className="text-[#1C2A39] mb-6">
          We hebben de Nuts‑toepassingen ingedeeld in categorieën. Hieronder leggen we uit wat elke categorie inhoudt en waarin ze van elkaar verschillen — steeds met een eigen manier waarop zorgorganisaties digitaal samenwerken en gegevens uitwisselen.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map((c) => (
            <div
              key={c.id}
              className="bg-[#FBF6F4] border border-[#F0E7E5] rounded-xl p-6"
            >
              <div className="w-10 h-10 rounded-full bg-[#D15949] text-white flex items-center justify-center font-bold mb-4">
                {c.abbr}
              </div>
              <h3 className="text-lg font-bold text-[#1C2A39] mb-2 leading-tight">
                {c.label}
              </h3>
              <p className="text-sm text-[#1C2A39] leading-relaxed">
                {c.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-[#1C2A39] mb-2">
          Alle toepassingen
        </h2>
        <p className="text-[#1C2A39] mb-6">
          Filter op categorie of op de fase waarin een toepassing zich bevindt.
        </p>

        <div className="bg-[#FBF6F4] border border-[#F0E7E5] rounded-xl p-5 space-y-4">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#1C2A39] w-24 shrink-0">
              Categorie
            </span>
            <div className="flex flex-wrap gap-2">
              <FilterChip
                active={activeCategory === "all"}
                onClick={() => setActiveCategory("all")}
              >
                Alle
              </FilterChip>
              {categories.map((c) => (
                <FilterChip
                  key={c.id}
                  active={activeCategory === c.id}
                  onClick={() => setActiveCategory(c.id)}
                >
                  {c.label}
                </FilterChip>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#1C2A39] w-24 shrink-0">
              Fase
            </span>
            <div className="flex flex-wrap gap-2">
              <FilterChip
                active={activePhase === "all"}
                onClick={() => setActivePhase("all")}
              >
                Alle
              </FilterChip>
              {phases.map((p) => (
                <FilterChip
                  key={p.id}
                  active={activePhase === p.id}
                  onClick={() => setActivePhase(p.id)}
                >
                  {p.label}
                </FilterChip>
              ))}
            </div>
          </div>
        </div>

        <p className="text-xs text-[#6B7686] mt-3 mb-6">
          {shown === total
            ? `${total} toepassingen`
            : `${shown} van ${total} toepassingen`}
        </p>

        {filtered.length === 0 ? (
          <div className="bg-[#F0E7E5] text-[#1C2A39] rounded-xl p-10 text-center">
            Geen toepassingen gevonden bij deze filtercombinatie.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((t) => (
              <article
                key={t.name}
                className="bg-white p-6 rounded-xl shadow-sm border border-[#F0E7E5] flex flex-col"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-[#D15949] mb-2">
                  {Array.isArray(t.category)
                    ? t.category.map((c) => categoryLabel(c)).join(", ")
                    : categoryLabel(t.category)}
                </p>

                <h3 className="text-xl font-bold text-[#1C2A39] mb-2 leading-tight">
                  {t.name}
                </h3>

                <p className="text-[#1C2A39] leading-relaxed mb-4 text-sm">
                  {t.text}
                </p>

                {t.links && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {t.links.map((link, i) => (
                      <a
                        key={i}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block bg-[#D15949] hover:bg-[#B84A3C] text-white text-xs font-medium px-4 py-2 rounded transition-colors duration-150"
                      >
                        {link.label}
                      </a>
                    ))}
                  </div>
                )}

                <div className="mt-auto pt-3 border-t border-[#F0E7E5] flex items-center gap-2">
                  <span
                    className={`inline-block w-2.5 h-2.5 rounded-full ${phaseDot[t.phase]}`}
                  />
                  <span className="text-xs text-[#1C2A39]">
                    {phaseLabel(t.phase)}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FilterChip({ active, onClick, children }: any) {
  return (
    <button
      onClick={onClick}
      className={`text-sm font-medium px-4 py-2 rounded-full border transition-colors duration-150 ${
        active
          ? "bg-[#D15949] text-white border-[#D15949]"
          : "bg-white text-[#1C2A39] border-[#F0E7E5] hover:border-[#D15949]"
      }`}
    >
      {children}
    </button>
  );
}
