import { useAuth } from '@/features/auth/hooks/useAuth';
import { UserRole } from '@/types/auth';

export const usePermissions = () => {
  const { user } = useAuth();

  return {
    isAdmin: user?.role === UserRole.ADMIN,
    canManageUsers: user?.role === UserRole.ADMIN,
    canEditPortfolio: (portfolioUserId: string) =>
      user?.role === UserRole.ADMIN || user?.id === portfolioUserId,
    canEditTrade: (tradeUserId: string) =>
      user?.role === UserRole.ADMIN || user?.id === tradeUserId,
    canDeletePortfolio: (portfolioUserId: string) =>
      user?.role === UserRole.ADMIN || user?.id === portfolioUserId,
    canDeleteTrade: (tradeUserId: string) =>
      user?.role === UserRole.ADMIN || user?.id === tradeUserId,
  };
};
