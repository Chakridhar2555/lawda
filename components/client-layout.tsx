'use client';

import { AiAssistant } from "@/components/ai-assistant";
import { Toaster } from "@/components/ui/toaster";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <AiAssistant />
      <Toaster />
    </>
  );
} 