import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MainNav } from "@/components/layout/nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      <main className="p-6">{children}</main>
    </div>
  );
}
