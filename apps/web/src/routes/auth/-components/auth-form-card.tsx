import type { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/card";

type AuthFormCardProps = {
  children: ReactNode;
  description: string;
  footer: ReactNode;
  title: string;
};

export function AuthFormCard({ children, description, footer, title }: AuthFormCardProps) {
  return (
    <div className="grid w-full gap-4">
      <CardHeader className="items-center px-0 text-center">
        <CardTitle className="font-bold text-2xl leading-tight">{title}</CardTitle>
        <CardDescription className="text-[0.9375rem] leading-relaxed">
          {description}
        </CardDescription>
      </CardHeader>

      <Card className="w-full bg-background [--card-spacing:--spacing(5)]">
        <CardContent>
          <div className="grid gap-[18px]">{children}</div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-center gap-1.5 px-5 text-center">
        {footer}
      </div>
    </div>
  );
}
