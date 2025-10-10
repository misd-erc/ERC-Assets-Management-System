import { useAuthStore } from '../store/auth';

export const useAuth = () => {
  const auth = useAuthStore();

  return {
    ...auth,
    isLoading: auth.loading,
    hasError: !!auth.error,
  };
};
