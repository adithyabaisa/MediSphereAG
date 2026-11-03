import type { Metadata, Viewport } from "next";
import "./globals.css";
import { RoleSwitcher } from "@/components/common/RoleSwitcher";

export const metadata: Metadata = {
  title: "MedSphere Connect | Consent-First Healthcare Platform",
  description:
    "Longitudinal medical records, hospital-anchored verified clinician access, patient consent governance, and source-grounded AI clinical intelligence.",
  keywords: [
    "Healthcare Platform",
    "Consent-First Medical Records",
    "Hospital Portal",
    "Patient Portal",
    "Clinical AI Copilot",
    "DPDP Compliant Health Data",
  ],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-teal-500 selection:text-white">
        {children}
        <RoleSwitcher />
      </body>
    </html>
  );
}
