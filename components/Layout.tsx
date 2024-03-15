import React from "react"

import Menu from "../components/Menu"
import Footer from "../components/Footer"
import { useConfig } from "../lib/config"

interface Props {
  children?: React.ReactNode;
}

export default function Layout({ children }: Props) {
  const config = useConfig()

  return (<div className="flex flex-col h-screen">
    <Menu items={config.menu.links} />
    <div className="grow">
      {children}
    </div>
    <Footer items={config.footer.links} socials={config.footer.socials} />
  </div>);
}
