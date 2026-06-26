"use client";

import { Loader } from "lucide-react";

interface SpinProps {
  text?: string;
}

export const Spin = ({ text = "Loading..." }: SpinProps) => {
  return (
    <div className="flex items-center gap-2">
      <Loader className="size-4 animate-spin" />
      <p className="text-muted-foreground text-sm">{text}</p>
    </div>
  );
};
