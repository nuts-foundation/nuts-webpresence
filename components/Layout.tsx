import React from "react"

import Menu from "../components/Menu"
import Footer from "../components/Footer"
import { SearchQuery } from "../components/SearchField"
import { useConfig } from "../lib/config"

interface Props {
  children?: React.ReactNode;
  // On the search page: its query, which the search field in the menu then edits.
  search?: SearchQuery;
}

export default function Layout({ children, search }: Props) {
  const config = useConfig()

  return (<div className="flex flex-col h-screen">
    <Menu items={config.menu.links} search={search} />
    <div className="grow">
      {children}
    </div>
    <Footer items={config.footer.links} socials={config.footer.socials} />
  </div>);
}
