import React, { useContext } from "react"

import menu from "../config/menu.json"
import participants from "../config/participants.json"
import footer from "../config/menu.json"
import podcast from "../config/menu.json"

interface Config {
  menu: typeof menu,
  footer: typeof footer,
  podcast: typeof podcast,
  participants: typeof participants
}

export const config: Config = {
  menu,
  footer,
  podcast,
  participants
}

export const ConfigContext = React.createContext<Config | null>(null)

export function useConfig(): Config {
  const config = useContext(ConfigContext)
  return config!
}
