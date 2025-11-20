export interface User {
  id: string;
  email: string;
  display_name: string;
  university_domain: string;
  created_at: string;
  seller_rating?: number;
  total_sales?: number;
  verified_seller?: boolean;
  stripe_account_id?: string;
  stripe_onboarding_completed?: boolean;
}

export type ListingCondition = 'New' | 'Like New' | 'Used' | 'Refurbished';

export interface Listing {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  image_urls: string[];
  created_at: string;
  condition?: ListingCondition;
  features?: string[];
  brand?: string;
  color?: string;
  size?: string;
  material?: string;
  user?: User;
}

export interface Message {
  id: string;
  listing_id: string;
  sender_id: string;
  receiver_id: string;
  body: string;
  read: boolean;
  created_at: string;
  sender?: User;
  receiver?: User;
  listing?: Listing;
}

export interface Report {
  id: string;
  reporter_id: string;
  listing_id: string;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  created_at: string;
  reporter?: User;
  listing?: Listing;
}

export type ListingCategory =
  | 'Dorm and Decor'
  | 'Fun and Craft'
  | 'Transportation'
  | 'Tech and Gadgets'
  | 'Books'
  | 'Clothing and Accessories'
  | 'Giveaways'
  | 'Other';

export type OrderStatus = 'pending' | 'paid' | 'processing' | 'completed' | 'refunded' | 'cancelled';

export interface Order {
  id: string;
  buyer_id: string;
  seller_id: string;
  listing_id: string;
  stripe_checkout_session_id?: string;
  stripe_payment_intent_id?: string;
  stripe_charge_id?: string;
  stripe_refund_id?: string;
  amount_cents: number;
  currency: string;
  platform_fee_cents: number;
  seller_amount_cents: number;
  status: OrderStatus;
  payment_method?: string;
  buyer_email?: string;
  buyer_name?: string;
  completed_at?: string;
  refunded_at?: string;
  created_at: string;
  updated_at: string;
  buyer?: User;
  seller?: User;
  listing?: Listing;
}
