import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portal do Cliente — Mendonça & Co",
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      {children}
    </div>
  );
}
