import AdminSideNav from "@/components/layouts/AdminSideNav";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <AdminSideNav />
      <main className="flex-1 bg-[#F4F4F4] p-8">{children}</main>
    </div>
  );
}
