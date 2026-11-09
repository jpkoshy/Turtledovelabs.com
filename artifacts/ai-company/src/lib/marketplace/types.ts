export type Role = 'buyer' | 'seller' | 'admin';
export type Tier = 'basic' | 'standard' | 'premium';
export type SellerLevel = 'new' | 'level1' | 'level2' | 'top';
export type GigStatus = 'draft' | 'active' | 'paused' | 'rejected';
export type OrderStatus = 'pending' | 'active' | 'delivered' | 'revision' | 'completed' | 'cancelled' | 'disputed';

export interface User { id: string; email: string; username: string; displayName: string; avatarUrl?: string; role: Role; bio?: string; country?: string; languages: string[]; skills: string[]; level: SellerLevel; createdAt: string }
export interface Category { id: string; slug: string; name: string; parentId?: string; icon: string }
export interface Package { tier: Tier; name: string; description: string; priceCents: number; deliveryDays: number; revisions: number; features: string[] }
export interface Faq { question: string; answer: string }
export interface Gig { id: string; sellerId: string; categoryId: string; slug: string; title: string; description: string; tags: string[]; images: string[]; status: GigStatus; ratingAvg: number; ratingCount: number; ordersCompleted: number; packages: Package[]; faqs: Faq[]; createdAt: string }
export interface Delivery { id: string; message: string; files: string[]; createdAt: string }
export interface Order { id: string; gigId: string; buyerId: string; sellerId: string; tier: Tier; priceCents: number; feeCents: number; status: OrderStatus; requirements?: string; deliveries: Delivery[]; dueAt: string; createdAt: string }
export interface Review { id: string; orderId: string; gigId: string; buyerId: string; rating: number; comment: string; sellerReply?: string; createdAt: string }
export interface Conversation { id: string; participantIds: [string, string]; gigId?: string; lastMessageAt: string }
export interface Message { id: string; conversationId: string; senderId: string; body: string; createdAt: string }
export type TransactionType = 'charge' | 'escrow_release' | 'payout' | 'refund' | 'fee';
export interface Transaction { id: string; orderId: string; type: TransactionType; amountCents: number; status: 'pending' | 'completed' | 'failed'; createdAt: string }
export type DisputeStatus = 'open' | 'resolved_buyer' | 'resolved_seller';
export interface Dispute { id: string; orderId: string; openedBy: string; reason: string; status: DisputeStatus; resolution?: string }
export interface Notification { id: string; userId: string; kind: string; body: string; read: boolean; createdAt: string }

export interface GigQuery { q?: string; categoryId?: string; minPriceCents?: number; maxPriceCents?: number; maxDeliveryDays?: number; minRating?: number; sellerLevel?: SellerLevel; sort?: 'relevance' | 'rating' | 'price_asc' | 'price_desc' | 'newest'; page?: number; pageSize?: number }
export interface Page<T> { items: T[]; total: number; page: number; pageSize: number }
export const PLATFORM_FEE_RATE = 0.2;
