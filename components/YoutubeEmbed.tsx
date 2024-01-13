import Image, { StaticImageData } from "next/image";
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

  return (<div onClick={activate} className="w-full aspect-video relative cursor-pointer">
    {!active && <>
      <div className="absolute rounded-3xl w-full h-full bg-black z-10 opacity-30 transition hover:opacity-50" />
      <div className="absolute w-24 h-24 left-[50%] -ml-12 top-[50%] -mt-12 z-20">
        <Play />
      </div>
    </>}

    {active && <iframe
      width="100%"
      height="100%"
      src={`https://www.youtube.com/embed/${embedId}?autoplay=1`}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      frameBorder="0"
      allowFullScreen
      title="Embedded youtube"
      className="w-full aspect-video rounded-3xl z-20 absolute"
    />}

    <Image
      src={placeholder}
      quality={100}
      className="h-full object-cover rounded-3xl shadow-md absolute left-0 top-0 z-10"
      alt="nuts video"
    />
  </div>)
}
