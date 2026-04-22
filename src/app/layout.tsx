import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { LangProvider } from "@/context/LangContext";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "JackStudio OS",
  description: "JackStudio Operating System — Decision · Data · Execution",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen bg-[#f8f7f4]">
        <AuthProvider>
          <LangProvider>
            <Sidebar />
            <main className="flex-1 ml-[240px] min-h-screen overflow-x-hidden">
              <div className="max-w-7xl mx-auto p-6">{children}</div>
            </main>
          </LangProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
