"use client";

import { Button } from "@repo/design-system/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@repo/design-system/components/ui/empty";
import { AlertTriangle } from "lucide-react";

interface ErrorProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

const ErrorBoundary = ({ error, reset }: ErrorProps) => (
  <div className="flex min-h-svh flex-1 items-center justify-center p-4">
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <AlertTriangle />
        </EmptyMedia>
        <EmptyTitle>Something went wrong</EmptyTitle>
        <EmptyDescription>
          {error.message ||
            "An unexpected error occurred. Try again, and if it keeps happening, contact support."}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button onClick={reset}>Try again</Button>
      </EmptyContent>
    </Empty>
  </div>
);

export default ErrorBoundary;
