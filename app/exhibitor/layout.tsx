import ExhibitorSideNav from "@/components/layouts/ExhibitorSideNav";
import RoleGate from "@/components/auth/RoleGate";

export default function ExhibitorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGate allow="exhibitor">
      <div className="flex min-h-screen">
        <ExhibitorSideNav />
        <main className="flex-1 bg-[#F4F4F4] p-8">{children}</main>
      </div>
    </RoleGate>
  );
}
