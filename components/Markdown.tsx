import React from "react";

interface Props {
  html: string;
  className?: string;
}

export default function Markdown({html, className}: Props) {
  return (<div className={className} dangerouslySetInnerHTML={{__html: html}}/>);
}