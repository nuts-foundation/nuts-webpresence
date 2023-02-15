import Link from "next/link"
import Image, { StaticImageData } from "next/future/image"
import Markdown from "../components/Markdown"

import Arrow from "../icons/arrow.svg"

interface Props {
  slug: string;
  title: string;
  color: string;
  images: {
    small: string | StaticImageData,
    large: string | StaticImageData
  };
}

export default function UseCase({ slug, title, color, images, blurb }: Props) {
  return (<Link href={`/use-case/${slug}`}>
    <a className="grid grid-cols-2 md:grid-cols-none rounded-[20px] mb-4 transition hover:scale-110 hover:shadow-lg" style={{
      backgroundColor: color,
    }}>
      <div className="font-redhat text-white p-5 self-end md:order-last">
        <p className="mb-2 font-bold">{title}</p>
        <Markdown className="font-inter text-sm mb-8" html={blurb} />
        <Arrow />
      </div>
      <div className="rounded-t-[20px] overflow-hidden">
        <div className="md:hidden">
          <Image src={images.small} height={160} alt={`Use case: ${title}`} />
        </div>
        <div className="hidden md:block">
          <Image src={images.large} height={380} alt={`Use case: ${title}`} />
        </div>
      </div>
    </a>
  </Link>)
}
