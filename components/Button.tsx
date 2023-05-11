import React from "react"
import Link from "next/link"

interface Props {
  href: string;
  secondary?: boolean;
  children?: React.ReactNode;
}

export default function Button({ secondary, href, children }: Props) {
  return (<Link href={href}>
    <a href={""}
      className={`inline-block px-6 py-3 rounded-full text-sm font-inter transition-colors ${secondary ? "bg-button hover:bg-button-hover" : "bg-brand hover:bg-dark text-white"}`}>
      {children}
    </a>
  </Link>);
}

interface InputButtonProps {
  inputName: string,
  buttonText: string,
  placeholderText: string,
  buttonType: "submit" | "button";
}

export function InputButton({ inputName, buttonText, placeholderText, buttonType }: InputButtonProps) {
  return (<div className="flex w-full">
    <input name={inputName} className="w-0 grow rounded-full rounded-r-none text-sm font-inter px-6 py-3 border border-t-button border-l-button border-b-button border-r-0" placeholder={placeholderText} />
    <button type={buttonType} className="text-center w-48 py-3 shrink-0 rounded-full rounded-l-none text-sm font-inter transaction-colors bg-button hover:bg-button-hover">
      {buttonText}
    </button>
  </div>)
}
