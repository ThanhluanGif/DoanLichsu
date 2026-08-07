"use client";

import { useState } from "react";
import { CheckIcon,LinkIcon } from "@/components/icons";

export function CopyLinkButton({label,copiedLabel}:{label:string;copiedLabel:string}) {
  const [copied,setCopied]=useState(false);
  return <button className="copy-link" type="button" onClick={async()=>{await navigator.clipboard.writeText(window.location.href);setCopied(true);window.setTimeout(()=>setCopied(false),1800);}}>
    {copied?<CheckIcon/>:<LinkIcon/>}<span aria-live="polite">{copied?copiedLabel:label}</span>
  </button>;
}
