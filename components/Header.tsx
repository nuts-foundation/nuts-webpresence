import React from "react";

interface Props {
  children?: React.ReactNode;
}

export default function Header({children}: Props) {
  return (<div className="bg-brand py-8 md:py-14">
    {children}
  </div>);
}