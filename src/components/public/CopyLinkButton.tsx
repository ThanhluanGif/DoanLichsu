"use client";

import { useState } from "react";
import { CheckIcon,LinkIcon } from "@/components/icons";

async function copyText(value:string){
  try{
    if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(value);return;}
  }catch{}
  const field=document.createElement("textarea");
  field.value=value;
  field.setAttribute("readonly","");
  field.style.position="fixed";
  field.style.opacity="0";
  document.body.append(field);
  field.select();
  const copied=document.execCommand("copy");
  field.remove();
  if(!copied)throw new Error("Clipboard copy was rejected");
}

export function CopyLinkButton({label,copiedLabel}:{label:string;copiedLabel:string}) {
  const [copied,setCopied]=useState(false);
  return <button className="copy-link" type="button" data-copied={copied} onClick={async()=>{await copyText(window.location.href);setCopied(true);window.setTimeout(()=>setCopied(false),1800);}}>
    {copied?<CheckIcon/>:<LinkIcon/>}<span aria-live="polite">{copied?copiedLabel:label}</span>
  </button>;
}
