import Logo from "/public/logo.svg"

import Button from "./Button"
import { MenuItem } from "./Menu"

interface Props {
  items: MenuItem[];
  socials: { name: string, href: string, icon: string }[];
}

export default function Footer({ items, socials }: Props) {
  return (<div>
    <div className="bg-brand font-inter">
      <div className="text-center sm:text-left container mx-auto py-6 md:py-20 grid grid-cols-12 gap-4 md:gap-12">
        {items.map((group, i) => (<div key={i} className="col-span-12 sm:col-span-6 md:col-span-3 space-y-5">
          <p className="text-white font-bold text-lg pt-5">{group.name}</p>
          {group.children.map(({ name, href }) => (<div key={name}>
            <a href={href} className="text-white hover:underline">{name}</a>
          </div>))}
        </div>))}
      </div>
      <div className="flex justify-center py-4">
    {socials.map(({ name, href, icon }) => (
      <a target="_blank" href={href}>
        <img src={icon} alt={name} />
      </a>
    ))}
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
