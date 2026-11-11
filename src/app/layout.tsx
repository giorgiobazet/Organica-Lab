import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";
import { SITE } from "@/config/site";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { LeveProvider } from "@/context/LeveContext";
import { leveInitScript, themeInitScript } from "@/lib/scriptsIniciais";

export const metadata: Metadata = {
  title: SITE.nome,
  description: SITE.descricao,
  authors: [{ name: SITE.autor.nome, url: SITE.autor.url }],
  creator: SITE.autor.nome,
};

export const viewport: Viewport = {
  themeColor: "#0B0F19",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript + leveInitScript }} />
      </head>
      <body className="min-h-screen font-sans">
        <ThemeProvider>
          <LeveProvider>
            <AuthProvider>{children}</AuthProvider>
          </LeveProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
