import { useState } from "react";
import Layout from "../../components/Layout";
import NewsCard from "../../components/NewsCard";
import { getNewsArticles, NewsArticle, NewsCategory } from "../../lib/api";

const CATEGORIES: { value: NewsCategory | "alle"; label: string }[] = [
  { value: "alle", label: "Alle berichten" },
  { value: "algemeen", label: "Algemeen" },
  { value: "toepassing", label: "Toepassingen" },
  { value: "persbericht", label: "Persberichten" },
];

const ARTICLES_PER_PAGE = 9;

interface Props {
  articles: NewsArticle[];
}

export default function NieuwsOverzicht({ articles }: Props) {
  const [activeCategory, setActiveCategory] = useState<NewsCategory | "alle">("alle");
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = activeCategory === "alle"
    ? articles
    : articles.filter(a => a.category === activeCategory);

  const totalPages = Math.ceil(filtered.length / ARTICLES_PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * ARTICLES_PER_PAGE,
    currentPage * ARTICLES_PER_PAGE
  );

  const handleCategory = (cat: NewsCategory | "alle") => {
    setActiveCategory(cat);
    setCurrentPage(1);
  };

  const handlePage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <Layout>
      <div className="container mx-auto max-w-5xl px-4 py-16">
        <h1 className="font-redhat text-4xl font-bold text-dark-gray mb-2">
          Nieuws &amp; Persberichten
        </h1>
        <p className="font-inter text-text mb-10">
          Schrijf je zelf over Nuts? Kijk dan eens op onze{" "}
          <a href="/pers" className="text-link hover:underline">perspagina</a>.
        </p>

        {/* Categorie filters */}
        <div className="flex flex-wrap gap-2 mb-10">
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => handleCategory(cat.value)}
              className={`px-4 py-1.5 rounded-full text-sm font-inter font-medium border transition-colors ${
                activeCategory === cat.value
                  ? "bg-brand text-white border-brand"
                  : "bg-white text-text border-stroke hover:border-brand hover:text-brand"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Artikelen */}
        {paginated.length === 0 ? (
          <p className="font-inter text-text">Geen berichten gevonden in deze categorie.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginated.map(article => (
              <NewsCard
                key={article.slug}
                {...article}
                href={`/nieuws/${article.slug}`}
              />
            ))}
          </div>
        )}

        {/* Paginering */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1 mt-12">
            <button
              onClick={() => handlePage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-2 rounded-lg font-inter text-sm border border-stroke text-text hover:border-brand hover:text-brand disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              ← Vorige
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => handlePage(page)}
                className={`w-9 h-9 rounded-lg font-inter text-sm font-medium border transition-colors ${
                  page === currentPage
                    ? "bg-brand text-white border-brand"
                    : "bg-white text-text border-stroke hover:border-brand hover:text-brand"
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => handlePage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-2 rounded-lg font-inter text-sm border border-stroke text-text hover:border-brand hover:text-brand disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Volgende →
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}

export async function getStaticProps() {
  const articles = await getNewsArticles();
  return { props: { articles } };
}
