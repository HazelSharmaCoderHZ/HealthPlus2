import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "../context/ThemeContext";
import { AuthProvider } from "src/context/AuthContext";
import {  NutritionProvider } from "../context/NutritionContext";

export const metadata: Metadata = {
  title: "HealthPlus",
  description: "Your Smart Health Companion",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-gray-900">
        <AuthProvider>
          <NutritionProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
          </NutritionProvider>
        </AuthProvider>
      </body>
    </html>
  );
}