import type { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@repo/ui/card";

type AuthFormCardProps = {
  children: ReactNode;
  description: string;
  footer: ReactNode;
  title: string;
};

export function AuthFormCard({ children, description, footer, title }: AuthFormCardProps) {
  return (
    <Card className="w-full bg-background [--card-spacing:--spacing(5)]">
      <CardHeader className="items-center text-center">
        <CardTitle className="font-bold text-2xl leading-tight">{title}</CardTitle>
        <CardDescription className="text-[0.9375rem] leading-relaxed">
          {description}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="grid gap-[18px]">{children}</div>
      </CardContent>

      <CardFooter className="flex flex-wrap items-center justify-center gap-1.5">
        {footer}
      </CardFooter>
    </Card>
  );
}
