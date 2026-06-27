import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@repo/design-system/components/ui/empty";
import type { LucideIcon } from "lucide-react";

interface ComingSoonProps {
  description?: string;
  icon: LucideIcon;
  title: string;
}

export function ComingSoon({
  title,
  description,
  icon: Icon,
}: ComingSoonProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6">
      <Empty className="max-w-md">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Icon />
          </EmptyMedia>
          <EmptyTitle>{title} — coming soon</EmptyTitle>
          <EmptyDescription>
            {description ??
              "This part of the app is on the roadmap. Check back shortly."}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  );
}
