import type { MarketplaceApi } from './api';
import type * as T from './types';
import { feeFor } from './format';
import { categories, gigs as seedGigs, seedOrders, seedReviews, seedTransactions, users as seedUsers } from './seed';
import { delay, read, remove, uid, write } from './store/storage';

const DAY = 86400000;
const now = () => new Date().toISOString();
const slugify = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

type Favorite = { userId: string; gigId: string };

function ensureSeeded() {
  if (read<boolean>('seeded:v1', false)) return;
  write('users', seedUsers);
  write('gigs', seedGigs);
  write('orders', seedOrders);
  write('reviews', seedReviews);
  write('transactions', seedTransactions);
  write('conversations', []);
  write('messages', []);
  write('disputes', []);
  write('notifications', []);
  write('favorites', []);
  write('seeded:v1', true);
}

const col = <X,>(k: string) => read<X[]>(k, []);

export function createLocalApi(): MarketplaceApi {
  const run = async <R,>(fn: () => R): Promise<R> => {
    await delay();
    ensureSeeded();
    return fn();
  };
  const me = (): T.User | null => {
    const id = read<string | null>('session', null);
    return id ? col<T.User>('users').find((u) => u.id === id) ?? null : null;
  };
  const need = (): T.User => {
    const u = me();
    if (!u) throw new Error('You must be signed in');
    return u;
  };
  const notify = (userId: string, kind: string, body: string) => {
    const list = col<T.Notification>('notifications');
    list.unshift({ id: uid('ntf'), userId, kind, body, read: false, createdAt: now() });
    write('notifications', list);
  };
  const txn = (orderId: string, type: T.TransactionType, amountCents: number) => {
    const list = col<T.Transaction>('transactions');
    list.push({ id: uid('txn'), orderId, type, amountCents, status: 'completed', createdAt: now() });
    write('transactions', list);
  };
  const saveOrder = (o: T.Order) => {
    write('orders', col<T.Order>('orders').map((x) => (x.id === o.id ? o : x)));
    return o;
  };
  const loadOrder = (id: string): T.Order => {
    const o = col<T.Order>('orders').find((x) => x.id === id);
    if (!o) throw new Error('Order not found');
    return o;
  };
  const participant = (o: T.Order, u: T.User) => {
    if (o.buyerId !== u.id && o.sellerId !== u.id && u.role !== 'admin') throw new Error('Not allowed');
  };
  const recomputeGig = (gigId: string) => {
    const rs = col<T.Review>('reviews').filter((r) => r.gigId === gigId);
    const gigs = col<T.Gig>('gigs').map((g) =>
      g.id === gigId
        ? { ...g, ratingCount: rs.length, ratingAvg: rs.length ? Math.round((rs.reduce((a, r) => a + r.rating, 0) / rs.length) * 10) / 10 : 0 }
        : g,
    );
    write('gigs', gigs);
  };
  const publicGig = (g: T.Gig) => g.status === 'active';
  const canSee = (g: T.Gig, u: T.User | null) => publicGig(g) || (u && (u.id === g.sellerId || u.role === 'admin'));

  return {
    // ---- auth / users
    currentUser: () => run(() => me()),
    signUp: (input) =>
      run(() => {
        const users = col<T.User>('users');
        const email = input.email.trim().toLowerCase();
        if (!email || !input.username.trim()) throw new Error('Email and username are required');
        if (users.some((u) => u.email.toLowerCase() === email)) throw new Error('Email already registered');
        if (users.some((u) => u.username.toLowerCase() === input.username.trim().toLowerCase())) throw new Error('Username already taken');
        if (input.role === 'admin') throw new Error('Cannot sign up as admin');
        const u: T.User = {
          id: uid('usr'), email, username: input.username.trim(), displayName: input.displayName.trim() || input.username,
          avatarUrl: `https://picsum.photos/seed/${encodeURIComponent(input.username)}/200/200`, role: input.role,
          languages: ['English'], skills: [], level: 'new', createdAt: now(),
        };
        write('users', [...users, u]);
        write('session', u.id);
        return u;
      }),
    signIn: (email) =>
      run(() => {
        const u = col<T.User>('users').find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
        if (!u) throw new Error('No account found for that email');
        write('session', u.id);
        return u;
      }),
    signOut: () => run(() => remove('session')),
    updateProfile: (patch) =>
      run(() => {
        const u = need();
        if (patch.role === 'admin') delete patch.role;
        const next = { ...u, ...patch };
        write('users', col<T.User>('users').map((x) => (x.id === u.id ? next : x)));
        return next;
      }),
    getUserByUsername: (username) => run(() => col<T.User>('users').find((u) => u.username.toLowerCase() === username.toLowerCase()) ?? null),
    getUser: (id) => run(() => col<T.User>('users').find((u) => u.id === id) ?? null),

    // ---- catalog
    listCategories: () => run(() => categories),
    searchGigs: (q) =>
      run(() => {
        const users = col<T.User>('users');
        const lvl = { new: 0, level1: 1, level2: 2, top: 3 } as const;
        const term = q.q?.trim().toLowerCase();
        const minOf = (g: T.Gig) => Math.min(...g.packages.map((p) => p.priceCents));
        let items = col<T.Gig>('gigs').filter(publicGig);
        if (term) {
          const words = term.split(/\s+/);
          items = items.filter((g) => {
            const hay = `${g.title} ${g.description} ${g.tags.join(' ')} ${users.find((u) => u.id === g.sellerId)?.displayName ?? ''}`.toLowerCase();
            return words.every((w) => hay.includes(w));
          });
        }
        if (q.categoryId) items = items.filter((g) => g.categoryId === q.categoryId);
        if (q.minPriceCents != null) items = items.filter((g) => minOf(g) >= q.minPriceCents!);
        if (q.maxPriceCents != null) items = items.filter((g) => minOf(g) <= q.maxPriceCents!);
        if (q.maxDeliveryDays != null) items = items.filter((g) => Math.min(...g.packages.map((p) => p.deliveryDays)) <= q.maxDeliveryDays!);
        if (q.minRating != null) items = items.filter((g) => g.ratingAvg >= q.minRating!);
        if (q.sellerLevel) items = items.filter((g) => lvl[users.find((u) => u.id === g.sellerId)?.level ?? 'new'] >= lvl[q.sellerLevel!]);
        const score = (g: T.Gig) => {
          if (!term) return g.ratingAvg * Math.log(2 + g.ratingCount) + g.ordersCompleted / 50;
          return (g.title.toLowerCase().includes(term) ? 10 : 0) + (g.tags.some((t) => t.includes(term)) ? 4 : 0) + g.ratingAvg;
        };
        const sorters: Record<NonNullable<T.GigQuery['sort']>, (a: T.Gig, b: T.Gig) => number> = {
          relevance: (a, b) => score(b) - score(a),
          rating: (a, b) => b.ratingAvg - a.ratingAvg || b.ratingCount - a.ratingCount,
          price_asc: (a, b) => minOf(a) - minOf(b),
          price_desc: (a, b) => minOf(b) - minOf(a),
          newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
        };
        items = [...items].sort(sorters[q.sort ?? 'relevance']);
        const pageSize = Math.max(1, q.pageSize ?? 12);
        const page = Math.max(1, q.page ?? 1);
        return { items: items.slice((page - 1) * pageSize, page * pageSize), total: items.length, page, pageSize };
      }),
    getGigBySlug: (slug) => run(() => { const g = col<T.Gig>('gigs').find((x) => x.slug === slug); return g && canSee(g, me()) ? g : null; }),
    getGig: (id) => run(() => { const g = col<T.Gig>('gigs').find((x) => x.id === id); return g && canSee(g, me()) ? g : null; }),
    listGigsBySeller: (sellerId) =>
      run(() => {
        const u = me();
        return col<T.Gig>('gigs').filter((g) => g.sellerId === sellerId && (publicGig(g) || (u && (u.id === sellerId || u.role === 'admin'))));
      }),
    createGig: (input) =>
      run(() => {
        const u = need();
        if (u.role === 'buyer') throw new Error('Switch to a seller account to create gigs');
        if (input.packages.length !== 3) throw new Error('A gig needs exactly 3 packages');
        const gigs = col<T.Gig>('gigs');
        let slug = slugify(input.title) || 'gig';
        if (gigs.some((g) => g.slug === slug)) slug += '-' + Math.random().toString(36).slice(2, 6);
        const g: T.Gig = { ...input, id: uid('gig'), sellerId: u.id, slug, ratingAvg: 0, ratingCount: 0, ordersCompleted: 0, createdAt: now() };
        write('gigs', [...gigs, g]);
        return g;
      }),
    updateGig: (id, patch) =>
      run(() => {
        const u = need();
        const g = col<T.Gig>('gigs').find((x) => x.id === id);
        if (!g) throw new Error('Gig not found');
        if (g.sellerId !== u.id && u.role !== 'admin') throw new Error('Not allowed');
        const { id: _i, sellerId: _s, ratingAvg: _a, ratingCount: _c, ordersCompleted: _o, createdAt: _d, ...safe } = patch;
        // Sellers cannot self-approve: only admins may set rejected/active after rejection.
        if (u.role !== 'admin' && safe.status === 'active' && g.status === 'rejected') delete safe.status;
        const next = { ...g, ...safe };
        write('gigs', col<T.Gig>('gigs').map((x) => (x.id === id ? next : x)));
        return next;
      }),

    // ---- favorites
    listFavorites: () =>
      run(() => {
        const u = need();
        const ids = col<Favorite>('favorites').filter((f) => f.userId === u.id).map((f) => f.gigId);
        return col<T.Gig>('gigs').filter((g) => ids.includes(g.id) && publicGig(g));
      }),
    toggleFavorite: (gigId) =>
      run(() => {
        const u = need();
        const favs = col<Favorite>('favorites');
        const has = favs.some((f) => f.userId === u.id && f.gigId === gigId);
        write('favorites', has ? favs.filter((f) => !(f.userId === u.id && f.gigId === gigId)) : [...favs, { userId: u.id, gigId }]);
        return !has;
      }),

    // ---- orders
    placeOrder: ({ gigId, tier, requirements }) =>
      run(() => {
        const u = need();
        const g = col<T.Gig>('gigs').find((x) => x.id === gigId);
        if (!g || !publicGig(g)) throw new Error('Gig not available');
        if (g.sellerId === u.id) throw new Error('You cannot order your own gig');
        const pkg = g.packages.find((p) => p.tier === tier);
        if (!pkg) throw new Error('Package not found');
        const o: T.Order = {
          id: uid('ord'), gigId, buyerId: u.id, sellerId: g.sellerId, tier, priceCents: pkg.priceCents, feeCents: feeFor(pkg.priceCents),
          status: 'active', requirements, deliveries: [], dueAt: new Date(Date.now() + pkg.deliveryDays * DAY).toISOString(), createdAt: now(),
        };
        write('orders', [...col<T.Order>('orders'), o]);
        txn(o.id, 'charge', o.priceCents);
        notify(g.sellerId, 'order_placed', `New order from ${u.displayName} for "${g.title}"`);
        return o;
      }),
    listOrders: (as) =>
      run(() => {
        const u = need();
        return col<T.Order>('orders')
          .filter((o) => (as === 'buyer' ? o.buyerId === u.id : o.sellerId === u.id))
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      }),
    getOrder: (id) =>
      run(() => {
        const u = need();
        const o = col<T.Order>('orders').find((x) => x.id === id);
        if (!o) return null;
        participant(o, u);
        return o;
      }),
    deliverOrder: (id, message, files = []) =>
      run(() => {
        const u = need();
        const o = loadOrder(id);
        if (o.sellerId !== u.id) throw new Error('Only the seller can deliver');
        if (o.status !== 'active' && o.status !== 'revision') throw new Error(`Cannot deliver an order that is ${o.status}`);
        const next = saveOrder({ ...o, status: 'delivered', deliveries: [...o.deliveries, { id: uid('dlv'), message, files, createdAt: now() }] });
        notify(o.buyerId, 'order_delivered', 'Your order has been delivered. Review it and accept or request a revision.');
        return next;
      }),
    requestRevision: (id, note) =>
      run(() => {
        const u = need();
        const o = loadOrder(id);
        if (o.buyerId !== u.id) throw new Error('Only the buyer can request a revision');
        if (o.status !== 'delivered') throw new Error(`Cannot request a revision on an order that is ${o.status}`);
        const gig = col<T.Gig>('gigs').find((g) => g.id === o.gigId);
        const allowed = gig?.packages.find((p) => p.tier === o.tier)?.revisions ?? 0;
        const used = o.deliveries.length - 1;
        if (used >= allowed) throw new Error('No revisions remaining for this package');
        notify(o.sellerId, 'revision_requested', `Revision requested: ${note}`);
        return saveOrder({ ...o, status: 'revision', requirements: [o.requirements, `Revision: ${note}`].filter(Boolean).join('\n\n') });
      }),
    completeOrder: (id) =>
      run(() => {
        const u = need();
        const o = loadOrder(id);
        if (o.buyerId !== u.id) throw new Error('Only the buyer can complete the order');
        if (o.status !== 'delivered') throw new Error(`Cannot complete an order that is ${o.status}`);
        const next = saveOrder({ ...o, status: 'completed' });
        txn(o.id, 'fee', o.feeCents);
        txn(o.id, 'escrow_release', o.priceCents - o.feeCents);
        write('gigs', col<T.Gig>('gigs').map((g) => (g.id === o.gigId ? { ...g, ordersCompleted: g.ordersCompleted + 1 } : g)));
        notify(o.sellerId, 'order_completed', 'Order completed. Payment released to your balance.');
        return next;
      }),
    cancelOrder: (id) =>
      run(() => {
        const u = need();
        const o = loadOrder(id);
        participant(o, u);
        if (!['pending', 'active'].includes(o.status)) throw new Error(`Cannot cancel an order that is ${o.status}`);
        const next = saveOrder({ ...o, status: 'cancelled' });
        if (col<T.Transaction>('transactions').some((t) => t.orderId === o.id && t.type === 'charge')) txn(o.id, 'refund', o.priceCents);
        notify(u.id === o.buyerId ? o.sellerId : o.buyerId, 'order_cancelled', 'An order was cancelled and refunded.');
        return next;
      }),

    // ---- reviews
    listReviewsForGig: (gigId) => run(() => col<T.Review>('reviews').filter((r) => r.gigId === gigId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))),
    createReview: ({ orderId, rating, comment }) =>
      run(() => {
        const u = need();
        const o = loadOrder(orderId);
        if (o.buyerId !== u.id) throw new Error('Only the buyer can review');
        if (o.status !== 'completed') throw new Error('You can only review completed orders');
        if (col<T.Review>('reviews').some((r) => r.orderId === orderId)) throw new Error('Order already reviewed');
        if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new Error('Rating must be 1-5');
        const r: T.Review = { id: uid('rev'), orderId, gigId: o.gigId, buyerId: u.id, rating, comment, createdAt: now() };
        write('reviews', [...col<T.Review>('reviews'), r]);
        recomputeGig(o.gigId);
        notify(o.sellerId, 'review_received', `You received a ${rating}-star review`);
        return r;
      }),
    replyToReview: (reviewId, reply) =>
      run(() => {
        const u = need();
        const r = col<T.Review>('reviews').find((x) => x.id === reviewId);
        if (!r) throw new Error('Review not found');
        const gig = col<T.Gig>('gigs').find((g) => g.id === r.gigId);
        if (!gig || gig.sellerId !== u.id) throw new Error('Only the seller can reply');
        const next = { ...r, sellerReply: reply };
        write('reviews', col<T.Review>('reviews').map((x) => (x.id === reviewId ? next : x)));
        return next;
      }),

    // ---- messaging
    listConversations: () =>
      run(() => {
        const u = need();
        return col<T.Conversation>('conversations').filter((c) => c.participantIds.includes(u.id)).sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
      }),
    startConversation: (otherUserId, gigId) =>
      run(() => {
        const u = need();
        if (otherUserId === u.id) throw new Error('Cannot message yourself');
        if (!col<T.User>('users').some((x) => x.id === otherUserId)) throw new Error('User not found');
        const list = col<T.Conversation>('conversations');
        const found = list.find((c) => c.participantIds.includes(u.id) && c.participantIds.includes(otherUserId));
        if (found) return found;
        const c: T.Conversation = { id: uid('cnv'), participantIds: [u.id, otherUserId], gigId, lastMessageAt: now() };
        write('conversations', [...list, c]);
        return c;
      }),
    listMessages: (conversationId) =>
      run(() => {
        const u = need();
        const c = col<T.Conversation>('conversations').find((x) => x.id === conversationId);
        if (!c || !c.participantIds.includes(u.id)) throw new Error('Not allowed');
        return col<T.Message>('messages').filter((m) => m.conversationId === conversationId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      }),
    sendMessage: (conversationId, body) =>
      run(() => {
        const u = need();
        const c = col<T.Conversation>('conversations').find((x) => x.id === conversationId);
        if (!c || !c.participantIds.includes(u.id)) throw new Error('Not allowed');
        if (!body.trim()) throw new Error('Message is empty');
        const m: T.Message = { id: uid('msg'), conversationId, senderId: u.id, body: body.trim(), createdAt: now() };
        write('messages', [...col<T.Message>('messages'), m]);
        write('conversations', col<T.Conversation>('conversations').map((x) => (x.id === c.id ? { ...x, lastMessageAt: m.createdAt } : x)));
        notify(c.participantIds.find((p) => p !== u.id)!, 'message', `New message from ${u.displayName}`);
        return m;
      }),

    // ---- money
    listTransactions: () =>
      run(() => {
        const u = need();
        const orders = col<T.Order>('orders');
        return col<T.Transaction>('transactions')
          .filter((t) => {
            const o = orders.find((x) => x.id === t.orderId);
            if (!o) return false;
            if (u.role === 'admin') return true;
            return o.buyerId === u.id || o.sellerId === u.id;
          })
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      }),

    // ---- disputes + admin
    openDispute: (orderId, reason) =>
      run(() => {
        const u = need();
        const o = loadOrder(orderId);
        if (o.buyerId !== u.id && o.sellerId !== u.id) throw new Error('Not allowed');
        if (!['active', 'delivered', 'revision'].includes(o.status)) throw new Error(`Cannot dispute an order that is ${o.status}`);
        if (col<T.Dispute>('disputes').some((d) => d.orderId === orderId && d.status === 'open')) throw new Error('A dispute is already open');
        const d: T.Dispute = { id: uid('dsp'), orderId, openedBy: u.id, reason, status: 'open' };
        write('disputes', [...col<T.Dispute>('disputes'), d]);
        saveOrder({ ...o, status: 'disputed' });
        notify(u.id === o.buyerId ? o.sellerId : o.buyerId, 'dispute_opened', 'A dispute was opened on one of your orders.');
        return d;
      }),
    listDisputes: () =>
      run(() => {
        const u = need();
        const all = col<T.Dispute>('disputes');
        if (u.role === 'admin') return all;
        const orders = col<T.Order>('orders');
        return all.filter((d) => {
          const o = orders.find((x) => x.id === d.orderId);
          return o && (o.buyerId === u.id || o.sellerId === u.id);
        });
      }),
    resolveDispute: (id, outcome, resolution) =>
      run(() => {
        const u = need();
        if (u.role !== 'admin') throw new Error('Admin only');
        const d = col<T.Dispute>('disputes').find((x) => x.id === id);
        if (!d) throw new Error('Dispute not found');
        if (d.status !== 'open') throw new Error('Dispute already resolved');
        const o = loadOrder(d.orderId);
        if (outcome === 'resolved_buyer') {
          saveOrder({ ...o, status: 'cancelled' });
          txn(o.id, 'refund', o.priceCents);
        } else {
          saveOrder({ ...o, status: 'completed' });
          txn(o.id, 'fee', o.feeCents);
          txn(o.id, 'escrow_release', o.priceCents - o.feeCents);
          write('gigs', col<T.Gig>('gigs').map((g) => (g.id === o.gigId ? { ...g, ordersCompleted: g.ordersCompleted + 1 } : g)));
        }
        const next: T.Dispute = { ...d, status: outcome, resolution };
        write('disputes', col<T.Dispute>('disputes').map((x) => (x.id === id ? next : x)));
        notify(o.buyerId, 'dispute_resolved', `Dispute resolved: ${resolution}`);
        notify(o.sellerId, 'dispute_resolved', `Dispute resolved: ${resolution}`);
        return next;
      }),
    moderateGig: (id, status) =>
      run(() => {
        const u = need();
        if (u.role !== 'admin') throw new Error('Admin only');
        const g = col<T.Gig>('gigs').find((x) => x.id === id);
        if (!g) throw new Error('Gig not found');
        const next = { ...g, status };
        write('gigs', col<T.Gig>('gigs').map((x) => (x.id === id ? next : x)));
        notify(g.sellerId, 'gig_moderated', `Your gig "${g.title}" was ${status === 'active' ? 'approved' : 'rejected'}.`);
        return next;
      }),

    // ---- notifications
    listNotifications: () => run(() => { const u = need(); return col<T.Notification>('notifications').filter((n) => n.userId === u.id); }),
    markNotificationRead: (id) =>
      run(() => {
        const u = need();
        write('notifications', col<T.Notification>('notifications').map((n) => (n.id === id && n.userId === u.id ? { ...n, read: true } : n)));
      }),
  };
}
