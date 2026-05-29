import { NewsArticle, NewsCategory } from "../lib/api";

const CATEGORY_LABELS: Record<NewsCategory, string> = {
  algemeen: "Algemeen",
  toepassing: "Toepassing",
  persbericht: "Persbericht",
  overig: "Overig",
};

interface NewsCardProps extends NewsArticle {
  href: string;
}

const MONTHS = ["januari","februari","maart","april","mei","juni","juli","augustus","september","oktober","november","december"];

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  return `${day} ${MONTHS[month - 1]} ${year}`;
}

export default function NewsCard({ date, title, excerpt, category, href }: NewsCardProps) {
  const formattedDate = formatDate(date);

  return (
    <a
      href={href}
      className="group flex flex-col rounded-xl border border-stroke hover:shadow-md transition-all p-6 bg-white"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-inter font-medium text-text bg-light px-2.5 py-1 rounded-full">
          {CATEGORY_LABELS[category]}
        </span>
        <span className="text-xs font-inter text-text opacity-60">{formattedDate}</span>
      </div>
      <h3 className="font-redhat font-bold text-dark-gray text-base leading-snug group-hover:text-brand transition-colors flex-1">
        {title}
      </h3>
      {excerpt && (
        <p className="mt-3 text-text font-inter text-sm leading-relaxed opacity-75">
          {excerpt.length > 120 ? excerpt.substring(0, 120).trimEnd() + "…" : excerpt}
        </p>
      )}
      <div className="mt-4 text-sm font-inter font-medium text-brand">
        Lees meer &rarr;
      </div>
    </a>
  );
}
