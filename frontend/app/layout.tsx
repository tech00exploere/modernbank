import "../styles/globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Modern Bank",
  description: "A modern bank management interface with role-based dashboards.",
};
  
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-sand text-ink">
        {children}
      </body>
    </html>
  );
}
