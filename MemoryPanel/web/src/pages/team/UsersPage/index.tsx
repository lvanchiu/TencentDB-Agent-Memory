import { useAuthStore } from '@/stores/auth';
import { useCurrentRole } from '@/services/useCurrentRole';
import UserPanel from './components/UserPanel';

export function UsersPage() {
  const { auth } = useAuthStore();
  const role = useCurrentRole();
  if (!auth) return null;

  return <UserPanel isAdmin={role === 'admin'} />;
}
