import Image, { StaticImageData } from "next/future/image";
import { useState } from "react";

import Play from "../icons/play.svg";

interface Props {
  embedId: string;
  placeholder: StaticImageData;
}

export default function YoutubeEmbed({ placeholder, embedId }: Props) {
  const [active, setActive] = useState(false)

  function activate<T>(e: React.MouseEvent<T>) {
    e.preventDefault()
    setActive(true)
  }

  if (active) {
    return (<iframe
      width="100%"
      height="100%"
      src={`https://www.youtube.com/embed/${embedId}?autoplay=1`}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      frameBorder="0"
      allowFullScreen
      className="w-full aspect-video"
      title="Embedded youtube"
    />)
  }

  return (<div onClick={activate} className="w-full aspect-video relative cursor-pointer">
    <div className="absolute rounded-3xl w-full h-full bg-black z-10 opacity-30 transition hover:opacity-50" />

    <div className="absolute w-24 h-24 left-[50%] -ml-12 top-[50%] -mt-12 z-20">
      <Play />
    </div>

    <Image
      src={placeholder}
      quality={100}
      className="h-full object-cover rounded-3xl shadow-md"
      alt="nuts video"
    />
  </div>)
}
