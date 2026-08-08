import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import { useCurrentRole } from '@/services/useCurrentRole';
import UserPanel from './components/UserPanel';

export function UsersPage() {
  const { auth } = useAuthStore();
  const role = useCurrentRole();
  if (!auth) return null;
  if (role !== 'admin') return <Navigate to="/" replace />;

  return <UserPanel isAdmin />;
}
