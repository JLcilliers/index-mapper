import { MainNav } from "@/components/layout/nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      <main className="p-6">{children}</main>
    </div>
  );
}
