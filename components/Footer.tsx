import Logo from "/public/logo.svg"

import Button from "./Button"
import { MenuItem } from "./Menu"

interface Props {
  items: MenuItem[];
}

export default function Footer({ items }: Props) {
  return (<div>
    <div className="bg-brand font-inter">
      <div className="text-center sm:text-left container mx-auto py-6 md:py-24 grid grid-cols-12 gap-4 md:gap-12">
        {items.map((group, i) => (<div key={i} className="col-span-12 sm:col-span-6 md:col-span-3 space-y-5">
          {group.children.map(({ name, href }) => (<div key={name}>
            <a href={href} className="text-white hover:underline">{name}</a>
          </div>))}
        </div>))}
        <div className="text-center sm:text-left col-span-12 pt-5 md:pt-0 sm:col-span-6 md:col-span-3 space-y-5">
          <div>
            <a href="https://linkedin.com/company/stichting-nuts" className="text-white hover:underline">Nuts op LinkedIn</a>
          </div>
          <div>
            <a href="https://www.youtube.com/channel/UCJtbrUe2TphkzDi2lPY5yYQ" className="text-white hover:underline">Nuts op YouTube</a>
          </div>
          <div>
            <a href="https://nuts.nl/podcast" className="text-white hover:underline">Going Nuts podcast</a>
          </div>
        </div>
      </div>
    </div>
    <div className="bg-dark py-8">
      <div className="text-white container mx-auto flex justify-between items-center">
        <p></p>
        <div className="shrink-0">
          <Logo />
        </div>
      </div>
    </div>
  </div>)
}
