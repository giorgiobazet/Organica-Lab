import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider, themeInitScript } from "@/context/ThemeContext";

export const metadata: Metadata = {
  title: "ChemPharm Hub",
  description:
    "Laboratório virtual de Química Orgânica para estudantes de Farmácia: jogos com moléculas 3D reais e fórmulas em bastão IUPAC.",
};

export const viewport: Viewport = {
  themeColor: "#0B0F19",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen font-sans">
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
