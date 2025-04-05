'use client';

import { Button } from "@/components/ui/button";
import Image from "next/image";

export function LanguageSelector() {
  return (
    <Button variant="ghost" className="flex items-center gap-2">
      <Image
        src="/canada-flag.svg"
        alt="Canada Flag"
        width={24}
        height={16}
        className="rounded shadow-sm"
      />
      <span>English</span>
    </Button>
  );
} 