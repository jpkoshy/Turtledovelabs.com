import type * as T from './types';
import { createLocalApi } from './local-api';

/** The single data-access contract for all marketplace UI. Implemented by local-api.ts (localStorage + seed). */
export interface MarketplaceApi {
  // auth / users
  currentUser(): Promise<T.User | null>;
  signUp(input: { email: string; displayName: string; username: string; role: T.Role }): Promise<T.User>;
  signIn(email: string): Promise<T.User>;
  signOut(): Promise<void>;
  updateProfile(patch: Partial<Pick<T.User, 'displayName' | 'bio' | 'avatarUrl' | 'country' | 'languages' | 'skills' | 'role'>>): Promise<T.User>;
  getUserByUsername(username: string): Promise<T.User | null>;
  getUser(id: string): Promise<T.User | null>;
  // catalog
  listCategories(): Promise<T.Category[]>;
  searchGigs(query: T.GigQuery): Promise<T.Page<T.Gig>>;
  getGigBySlug(slug: string): Promise<T.Gig | null>;
  getGig(id: string): Promise<T.Gig | null>;
  listGigsBySeller(sellerId: string): Promise<T.Gig[]>;
  createGig(input: Omit<T.Gig, 'id' | 'sellerId' | 'slug' | 'ratingAvg' | 'ratingCount' | 'ordersCompleted' | 'createdAt'>): Promise<T.Gig>;
  updateGig(id: string, patch: Partial<T.Gig>): Promise<T.Gig>;
  // favorites
  listFavorites(): Promise<T.Gig[]>;
  toggleFavorite(gigId: string): Promise<boolean>;
  // orders
  placeOrder(input: { gigId: string; tier: T.Tier; requirements?: string }): Promise<T.Order>;
  listOrders(as: 'buyer' | 'seller'): Promise<T.Order[]>;
  getOrder(id: string): Promise<T.Order | null>;
  deliverOrder(id: string, message: string, files?: string[]): Promise<T.Order>;
  requestRevision(id: string, note: string): Promise<T.Order>;
  completeOrder(id: string): Promise<T.Order>;
  cancelOrder(id: string): Promise<T.Order>;
  // reviews
  listReviewsForGig(gigId: string): Promise<T.Review[]>;
  createReview(input: { orderId: string; rating: number; comment: string }): Promise<T.Review>;
  replyToReview(reviewId: string, reply: string): Promise<T.Review>;
  // messaging
  listConversations(): Promise<T.Conversation[]>;
  startConversation(otherUserId: string, gigId?: string): Promise<T.Conversation>;
  listMessages(conversationId: string): Promise<T.Message[]>;
  sendMessage(conversationId: string, body: string): Promise<T.Message>;
  // money
  listTransactions(): Promise<T.Transaction[]>;
  // disputes + admin
  openDispute(orderId: string, reason: string): Promise<T.Dispute>;
  listDisputes(): Promise<T.Dispute[]>;
  resolveDispute(id: string, outcome: 'resolved_buyer' | 'resolved_seller', resolution: string): Promise<T.Dispute>;
  moderateGig(id: string, status: 'active' | 'rejected'): Promise<T.Gig>;
  // notifications
  listNotifications(): Promise<T.Notification[]>;
  markNotificationRead(id: string): Promise<void>;
}

export const api: MarketplaceApi = createLocalApi();
