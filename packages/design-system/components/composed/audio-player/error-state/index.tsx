"use client";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@repo/design-system/components/ui/alert";
import { Button } from "@repo/design-system/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ErrorStateProps {
  message: string;
  onReload: () => void;
}

export function ErrorState({ message, onReload }: ErrorStateProps) {
  return (
    <Alert variant="destructive">
      <AlertTriangle className="size-4" />
      <AlertTitle>Playback error</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
      <div className="col-start-2 mt-2">
        <Button onClick={onReload} size="sm" variant="outline">
          Reload
        </Button>
      </div>
    </Alert>
  );
}
