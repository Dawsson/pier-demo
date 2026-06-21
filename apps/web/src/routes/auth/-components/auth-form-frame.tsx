import type { ReactNode } from "react";
import {
  Frame,
  FrameDescription,
  FrameFooter,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";

type AuthFormFrameProps = {
  children: ReactNode;
  description: string;
  footer: ReactNode;
  title: string;
};

export function AuthFormFrame({ children, description, footer, title }: AuthFormFrameProps) {
  return (
    <Frame className="w-full">
      <FrameHeader className="items-center text-center">
        <div className="font-semibold text-base text-foreground leading-tight">Pier Demo</div>
        <FrameTitle className="font-bold text-2xl leading-tight">{title}</FrameTitle>
        <FrameDescription className="text-[0.9375rem] leading-relaxed">
          {description}
        </FrameDescription>
      </FrameHeader>

      <FramePanel>
        <div className="grid gap-[18px]">{children}</div>
      </FramePanel>

      <FrameFooter className="flex flex-wrap items-center justify-center gap-1.5">
        {footer}
      </FrameFooter>
    </Frame>
  );
}
