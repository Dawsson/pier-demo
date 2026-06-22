"use client";

import * as React from "react";
import { Separator as BaseSeparator } from "@base-ui/react/separator";

import { cn } from "../../utils";

type SeparatorProps = React.ComponentProps<typeof BaseSeparator> & {
  readonly decorative?: boolean;
};

function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  ...props
}: SeparatorProps) {
  return (
    <BaseSeparator
      data-slot="separator"
      orientation={orientation}
      role={decorative ? "none" : "separator"}
      className={cn(
        "shrink-0 bg-border data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:w-px data-[orientation=vertical]:self-stretch",
        className,
      )}
      {...props}
    />
  );
}

export { Separator };
