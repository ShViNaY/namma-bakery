export type CustomCakeStatus =
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "NEEDS_CLARIFICATION"
  | "QUOTED"
  | "CUSTOMER_ACCEPTED"
  | "DECLINED"
  | "CUSTOMER_DECLINED"
  | "EXPIRED"
  | "WITHDRAWN";

export type CustomCakeEggType = "EGGLESS" | "REGULAR";

export interface CustomCakeImage {
  id: string;
  request_id: string;
  storage_path: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
  signed_url?: string | null;
}

export interface CustomCakeQuote {
  id: string;
  request_id: string;
  price_paise: number;
  estimated_prep_minutes: number;
  confirmed_pickup_at: string;
  bakery_note?: string | null;
  valid_until: string;
  created_at: string;
}

export interface CustomCakeMessage {
  id: string;
  request_id: string;
  sender: "CUSTOMER" | "STAFF";
  staff_id?: string | null;
  body: string;
  created_at: string;
}

export interface CustomCakeRequest {
  id: string;
  request_number: string;
  public_token: string;
  location_id?: string;
  customer_id?: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  flavour: string;
  egg_type: CustomCakeEggType;
  weight_grams: number;
  shape?: string | null;
  cake_type?: string | null;
  message_on_cake?: string | null;
  description?: string | null;
  preferred_pickup_at: string;
  additional_notes?: string | null;
  status: CustomCakeStatus;
  decline_reason?: string | null;
  created_at: string;
  updated_at: string;
  custom_cake_images?: CustomCakeImage[];
  custom_cake_quotes?: CustomCakeQuote[];
  request_messages?: CustomCakeMessage[];
}

export interface CustomCakePublicView {
  request_number: string;
  status: CustomCakeStatus;
  first_name: string;
  flavour: string;
  egg_type: CustomCakeEggType;
  weight_grams: number;
  shape?: string | null;
  cake_type?: string | null;
  message_on_cake?: string | null;
  description?: string | null;
  preferred_pickup_at: string;
  additional_notes?: string | null;
  decline_reason?: string | null;
  created_at?: string;
  reference_image_url?: string | null;
  quote?: {
    price_paise: number;
    confirmed_pickup_at: string;
    bakery_note?: string | null;
    valid_until: string;
  } | null;
  messages?: Array<{
    sender: "CUSTOMER" | "STAFF";
    body: string;
    at: string;
  }>;
  order_token?: string | null;
}

export interface CustomCakeOperationalSummary {
  total: number;
  pending: number;
  underReview: number;
  quoted: number;
  confirmed: number;
  declinedOrCancelled: number;
}

export interface CustomCakeTrackingItem {
  id: string;
  request_number: string;
  public_token: string;
  customer_name: string;
  status: CustomCakeStatus;
  flavour: string;
  egg_type: CustomCakeEggType;
  weight_grams: number;
  shape?: string | null;
  cake_type?: string | null;
  message_on_cake?: string | null;
  description?: string | null;
  preferred_pickup_at: string;
  additional_notes?: string | null;
  decline_reason?: string | null;
  created_at: string;
  updated_at: string;
  reference_image_url?: string | null;
  quote?: {
    price_paise: number;
    confirmed_pickup_at: string;
    bakery_note?: string | null;
    valid_until?: string;
  } | null;
  messages?: Array<{
    sender: "CUSTOMER" | "STAFF";
    body: string;
    created_at: string;
  }>;
}
