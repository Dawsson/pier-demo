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
    <Frame className="bg-neutral-950 p-1 text-neutral-50 shadow-[0_18px_42px_rgb(0_0_0_/_24%)]">
      <FramePanel className="overflow-hidden border-white/10 bg-neutral-950 p-0 text-neutral-50 shadow-none before:shadow-[inset_0_1px_0_rgb(255_255_255_/_6%)]">
        <FrameHeader className="items-center gap-1.5 px-7 pt-7 pb-5 text-center">
          <div className="font-semibold text-base text-neutral-50 leading-tight">Pier Demo</div>
          <FrameTitle className="font-bold text-2xl text-neutral-50 leading-tight">
            {title}
          </FrameTitle>
          <FrameDescription className="text-[0.9375rem] text-neutral-400 leading-relaxed">
            {description}
          </FrameDescription>
        </FrameHeader>

        <div className="grid gap-[18px] px-7 pb-7">{children}</div>

        <FrameFooter className="flex flex-wrap items-center justify-center gap-1.5 border-white/10 border-t bg-white/[0.035] px-6 py-4">
          {footer}
        </FrameFooter>
      </FramePanel>
    </Frame>
  );
}
