import type { Metadata } from 'next';
import { Outfit, Chakra_Petch, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/lib/auth-context';
import { Navbar } from '@/components/Navbar';
import { Toaster } from '@/components/ui/sonner';

const outfit = Outfit({
  variable: '--font-sans',
  subsets: ['latin'],
});

// Chakra Petch: angular, techy, reads as an arcade HUD without going full Orbitron.
const chakraPetch = Chakra_Petch({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['500', '600', '700'],
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  weight: ['500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'SwearJar — Office Arena',
  description: 'The office swear jar, as a game. Leaderboards, levels, and bounties.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${chakraPetch.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-background text-foreground font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-lg focus:bg-hot focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-hot-foreground"
            >
              Skip to content
            </a>
            <Navbar />
            <div className="min-h-dvh flex flex-col lg:pl-24">
              <main id="main" className="flex-1 w-full mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                {children}
              </main>
              <footer className="py-6 text-center text-[11px] text-muted-foreground font-mono tabular">
                <p>© {new Date().getFullYear()} SwearJar Office Arena · keep it clean</p>
              </footer>
            </div>
            <Toaster position="bottom-right" richColors />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
