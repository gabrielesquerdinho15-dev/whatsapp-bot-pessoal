import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Simple Bot MVP",
  description: "Painel simples para vendedores operarem bot, leads e conversas."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
