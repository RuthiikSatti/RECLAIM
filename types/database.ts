export interface User {
  id: string;
  email: string;
  display_name: string;
  university_domain: string;
  created_at: string;
}

export interface Listing {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  image_urls: string[];
  created_at: string;
  user?: User;
}

export interface Message {
  id: string;
  listing_id: string;
  sender_id: string;
  receiver_id: string;
  body: string;
  created_at: string;
  sender?: User;
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
  | 'Giveaways';
