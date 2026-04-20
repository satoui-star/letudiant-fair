import RoleGate from '@/components/auth/RoleGate';

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return <RoleGate allow="parent">{children}</RoleGate>;
}
