"use client";

import { useState } from "react";
import { truncateTxHash, explorerTxUrl } from "@/lib/utils";

export function TxHash({ hash, className = "" }: { hash: string; className?: string }) {
  const short = truncateTxHash(hash);
  const [copied, setCopied] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <a
      href={explorerTxUrl(hash)}
      target="_blank"
      rel="noreferrer"
      title={hash}
      onClick={handleClick}
      className={`inline-flex items-center gap-1 font-mono text-inherit underline-offset-2 hover:underline ${className}`}
    >
      <span className="truncate">{copied ? "Copied!" : short}</span>
    </a>
  );
}
