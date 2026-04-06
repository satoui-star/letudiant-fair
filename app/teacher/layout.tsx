import TeacherSideNav from "@/components/layouts/TeacherSideNav";

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <TeacherSideNav />
      <main className="flex-1 bg-[#F4F4F4] p-8">{children}</main>
    </div>
  );
}
