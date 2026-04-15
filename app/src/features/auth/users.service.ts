import { api } from '@/shared/api/http';
import { User } from './auth.schemas';

export const usersService = {
  /**
   * Get all commercial and manager users for impersonation
   */
  async getCommercialUsers(): Promise<User[]> {
    const response = await api.get('/users/commercial');
    return response.data;
  },
};
