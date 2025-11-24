import { ReactNode } from "react";
import ClientPageWrapper from "@/components/ClientPageWrapper";

export default function MarketingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <ClientPageWrapper>{children}</ClientPageWrapper>;
}

