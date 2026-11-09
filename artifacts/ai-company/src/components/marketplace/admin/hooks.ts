import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/marketplace/api';
import type { Order, User } from '@/lib/marketplace/types';

export const useAdminGigs = () =>
  useQuery({ queryKey: ['mp', 'admin', 'gigs'], queryFn: async () => (await api.searchGigs({ pageSize: 500, sort: 'newest' })).items });

export const useAdminOrders = () =>
  useQuery({
    queryKey: ['mp', 'admin', 'orders'],
    queryFn: async (): Promise<Order[]> => {
      const [b, s] = await Promise.all([api.listOrders('buyer'), api.listOrders('seller')]);
      return [...new Map([...b, ...s].map((o) => [o.id, o])).values()];
    },
  });

export const useAdminTransactions = () => useQuery({ queryKey: ['mp', 'admin', 'transactions'], queryFn: () => api.listTransactions() });
export const useAdminDisputes = () => useQuery({ queryKey: ['mp', 'admin', 'disputes'], queryFn: () => api.listDisputes() });

/** No listUsers in the api contract: derive known users from ids seen in gigs, orders and disputes. */
export const useAdminUsers = (me: User | null) => {
  const gigs = useAdminGigs();
  const orders = useAdminOrders();
  const disputes = useAdminDisputes();
  const ids = [...new Set([...(gigs.data ?? []).map((g) => g.sellerId), ...(orders.data ?? []).flatMap((o) => [o.buyerId, o.sellerId]), ...(disputes.data ?? []).map((d) => d.openedBy), ...(me ? [me.id] : [])])].sort();
  const q = useQuery({
    queryKey: ['mp', 'admin', 'users', ids.join(',')],
    queryFn: async () => (await Promise.all(ids.map((id) => api.getUser(id)))).filter((u): u is User => !!u),
    enabled: ids.length > 0,
  });
  return { ...q, isLoading: q.isLoading || gigs.isLoading || orders.isLoading || disputes.isLoading };
};
