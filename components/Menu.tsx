import Link from "next/link"
import React, { useEffect, useState } from "react"
import Router, { useRouter } from "next/router"

import Logo from "/public/logo.svg"
import Close from "/icons/close.svg"
import ChevronDown from "/icons/chevron-down.svg"
import ChevronRight from "/icons/chevron-right.svg"

export interface MenuLink {
  name: string;
  href: string;
}

export interface MenuItem {
  name: string;
  children: MenuLink[];
}

interface Props {
  items: MenuItem[],
  onOpen?: () => void;
  onClose?: () => void;
}

function Hamburger() {
  return (<svg width="20" height="14" viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M1.5 1C1.22386 1 1 1.22386 1 1.5C1 1.77614 1.22386 2 1.5 2H18.5C18.7761 2 19 1.77614 19 1.5C19 1.22386 18.7761 1 18.5 1H1.5Z"
      fill="white" />
    <path
      d="M1 7C1 6.72386 1.22386 6.5 1.5 6.5H18.5C18.7761 6.5 19 6.72386 19 7C19 7.27614 18.7761 7.5 18.5 7.5H1.5C1.22386 7.5 1 7.27614 1 7Z"
      fill="white" />
    <path
      d="M1 12.5C1 12.2239 1.22386 12 1.5 12H18.5C18.7761 12 19 12.2239 19 12.5C19 12.7761 18.7761 13 18.5 13H1.5C1.22386 13 1 12.7761 1 12.5Z"
      fill="white" />
    <path
      d="M1.5 1C1.22386 1 1 1.22386 1 1.5C1 1.77614 1.22386 2 1.5 2H18.5C18.7761 2 19 1.77614 19 1.5C19 1.22386 18.7761 1 18.5 1H1.5Z"
      stroke="white" strokeWidth="0.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
    <path
      d="M1 7C1 6.72386 1.22386 6.5 1.5 6.5H18.5C18.7761 6.5 19 6.72386 19 7C19 7.27614 18.7761 7.5 18.5 7.5H1.5C1.22386 7.5 1 7.27614 1 7Z"
      stroke="white" strokeWidth="0.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
    <path
      d="M1 12.5C1 12.2239 1.22386 12 1.5 12H18.5C18.7761 12 19 12.2239 19 12.5C19 12.7761 18.7761 13 18.5 13H1.5C1.22386 13 1 12.7761 1 12.5Z"
      stroke="white" strokeWidth="0.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
  </svg>);
}

export default function Menu({ items, onOpen, onClose }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState<string | null>(null)
  const isEnglish = router.asPath.startsWith("/en/")

  useEffect(() => {
    if (open) {
      onOpen && onOpen()
    } else {
      onClose && onClose()
    }
  }, [open, onOpen, onClose])

  useEffect(() => {
    Router.beforePopState(() => {
      setOpen(false)
      setActive(null)

      return true
    })
  }, [])

  useEffect(() => {
    function handleChange() {
      setOpen(false)
      setActive(null)

      return true
    }
    router.events.on('routeChangeComplete', handleChange)
    return () => {
      router.events.off('routeChangeComplete', handleChange)
    }
  }, [])

  function click() {
    setOpen(!open);
  }

  function close(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault()

    setOpen(false)
  }

  return (<div className="bg-brand relative py-4 h-16 backdrop-filter-none md:h-auto">
    <div className="container mx-auto flex justify-between items-center">
      <Link href="/">
        <Logo />
      </Link>

      <div className="md:hidden" onClick={click}>
        <Hamburger />
      </div>

      <div
        className={`bg-[rgba(45,45,45,0.7)] hidden z-[30] fixed h-[100vh] w-full top-0 left-0 md:h-auto md:w-auto md:bg-brand md:static md:block ${open && "!block"}`}>
        <div className={`ml-auto max-w-[70vw] bg-white px-8 h-full shadow-lg rounded-l-xl md:bg-transparent md:shadow-none`}>
          <div className="flex flex-col pt-6 mb-12 md:hidden">
            <a href="#" className="place-self-end" onClick={close}>
              <Close />
            </a>
          </div>
          <div className={`grid grid-flow-row items-center gap-6 md:!grid md:!grid-flow-col md:gap-12`}>
            {items.map(item => (<Dropdown
              active={active === item.name}
              key={item.name}
              name={item.name}
              onClick={() => setActive(active === item.name ? null : item.name)}
            >
              {item.children.map(child => (<Link
                href={child.href}
                key={child.href}
                className="block px-3.5 py-3 md:py-4 text-dark-gray align-baseline text-sm md:transition-colors md:bg-white md:hover:bg-menu-hover md:hover:text-brand">
                  {child.name}
              </Link>))}
            </Dropdown>))}
            <div className="text-white text-sm">
              <Link href="/" className={`font-semibold ${!isEnglish ? "underline" : ""}`}>NL</Link>
              &nbsp;|&nbsp;
              <Link href="/en" className={`font-semibold ${isEnglish ? "underline" : ""}`}>EN</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>);
}

interface DropdownProps {
  name: string,
  active: boolean,
  onClick: () => void,
  children: React.ReactNode
}

function Dropdown({ name, children, active, onClick }: DropdownProps) {
  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    onClick && onClick()
  }

  return (<div className="root relative text-dark-gray md:text-white">
    <div className="label flex justify-between cursor-pointer border-b border-stroke md:border-none" onClick={toggle}>
      {name}
      <span className={`inline-block md:hidden ${active ? "w-3" : "w-2"}`}>
        {active ? <ChevronDown /> : <ChevronRight />}
      </span>
    </div>

    <div className={`children z-20 right-[-30px] md:absolute md:w-[200px]`}>
      <div className="md:pt-4" />
      <div className="rounded-b-lg overflow-hidden md:rounded-lg md:shadow-lg cursor-pointer">{children}</div>
    </div>

    <style jsx>{`
      .children {
        display: ${!active && "none"};
      }

      /* Little triangle pointing up */
      .children:before {
        content: '';
        display: block;
        position: absolute;
        right: 55px;
        top: 6px;
        width: 0;
        height: 0;
        border: 13px solid transparent;
        border-top: 0;
        border-bottom: 10px solid white;
      }

      .root:hover .children {
        display: block;
      }
    `}</style>
  </div>)
}
