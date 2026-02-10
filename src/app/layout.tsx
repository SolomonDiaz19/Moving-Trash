import "./globals.css";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="bg-white overflow-x-hidden">
      <body className="min-h-screen bg-white text-zinc-900 overflow-x-hidden">
        <Header />

        <main className="w-full">
          {children}
        </main>

        <Footer />
      </body>
    </html>
  );
}