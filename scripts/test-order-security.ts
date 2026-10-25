/**
 * Security and Validation Test Suite for Namma Bakery Ordering Flow (Step 3.7)
 *
 * Verifies:
 * 1. Zod input schemas reject invalid customer data (name, phone, email, notes).
 * 2. Zod schemas reject invalid product/variant identifiers (non-UUIDs).
 * 3. Zod schemas reject invalid quantities (<=0, >20, fractions).
 * 4. Zod schemas strictly reject arbitrary injected fields (forged prices, forged totals, extra attributes).
 * 5. Zod schemas reject invalid/past/far-future pickup times.
 * 6. Rate limiter correctly enforces sliding window limits and rejects abusive bursts.
 */

import { placeOrderInputSchema, lookupOrderTokenSchema } from "../lib/orders/validation";
import {
  customCakeFormSchema,
  validateReferenceImageFile,
  validateImageMagicBytes,
} from "../lib/custom-cake/validation";
import { checkRateLimit } from "../lib/security/rate-limiter";
import {
  adminCategorySchema,
  adminProductSchema,
  adminVariantSchema,
  adminPriceTierRuleSchema,
  adminStoreSettingsSchema,
  adminStaffRoleSchema,
} from "../lib/admin/validation";
import { publicStoreStatusSchema } from "../lib/pickup/validation";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    passedCount++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    failedCount++;
    console.error(`  ✗ FAIL: ${testName}${detail ? ` - ${detail}` : ""}`);
  }
}

console.log("\n========================================================");
console.log("NAMMA BAKERY: ORDERING FLOW SECURITY TESTS");
console.log("========================================================\n");

// --- 1. Customer Name Validation ---
console.log("--- 1. Customer Name Boundaries ---");

const validBaseOrder = {
  customerDetails: {
    customerName: "Vinay Kumar",
    customerPhone: "9845012345",
    customerEmail: "vinay@example.com",
    customerNotes: "Happy Birthday text on cake",
  },
  pickupSlotStart: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  items: [
    {
      productId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      kind: "TIERED_CAKE" as const,
      quantity: 1,
      cakeConfig: {
        weightGrams: 1000,
        eggType: "EGGLESS" as const,
        finish: "STANDARD" as const,
      },
    },
  ],
};

const parseResult = placeOrderInputSchema.safeParse(validBaseOrder);
assert(
  parseResult.success,
  "Valid baseline order payload accepted",
  !parseResult.success ? JSON.stringify(parseResult.error.format()) : undefined
);

assert(
  !placeOrderInputSchema.safeParse({
    ...validBaseOrder,
    customerDetails: { ...validBaseOrder.customerDetails, customerName: "A" },
  }).success,
  "Reject customer name < 2 characters"
);

assert(
  !placeOrderInputSchema.safeParse({
    ...validBaseOrder,
    customerDetails: { ...validBaseOrder.customerDetails, customerName: "A".repeat(85) },
  }).success,
  "Reject customer name > 80 characters"
);

// --- 2. Customer Phone Validation ---
console.log("\n--- 2. Phone Number Validation & Normalization ---");

assert(
  !placeOrderInputSchema.safeParse({
    ...validBaseOrder,
    customerDetails: { ...validBaseOrder.customerDetails, customerPhone: "12345" },
  }).success,
  "Reject short phone number"
);

assert(
  !placeOrderInputSchema.safeParse({
    ...validBaseOrder,
    customerDetails: { ...validBaseOrder.customerDetails, customerPhone: "1234567890" },
  }).success,
  "Reject phone number starting with invalid prefix (e.g. 1)"
);

assert(
  placeOrderInputSchema.safeParse({
    ...validBaseOrder,
    customerDetails: { ...validBaseOrder.customerDetails, customerPhone: "+91 98450-12345" },
  }).success,
  "Accept and normalize valid Indian mobile with +91 and hyphens"
);

// --- 3. Forged Client Prices and Arbitrary Injected Fields ---
console.log("\n--- 3. Forged Client Prices & Strict Payload Rejection ---");

assert(
  !placeOrderInputSchema.safeParse({
    ...validBaseOrder,
    forgedTotalPaise: 100, // Injected malicious client price
  }).success,
  "Reject order payload with injected forged total field (.strict())"
);

assert(
  !placeOrderInputSchema.safeParse({
    ...validBaseOrder,
    items: [
      {
        ...validBaseOrder.items[0],
        unitPricePaise: 100, // Injected forged unit price
      },
    ],
  }).success,
  "Reject item with injected client price field (.strict())"
);

// --- 4. Quantities and Item Limits ---
console.log("\n--- 4. Quantities & Item Limits ---");

assert(
  !placeOrderInputSchema.safeParse({
    ...validBaseOrder,
    items: [],
  }).success,
  "Reject empty items array (0 items)"
);

assert(
  !placeOrderInputSchema.safeParse({
    ...validBaseOrder,
    items: [{ ...validBaseOrder.items[0], quantity: 0 }],
  }).success,
  "Reject quantity of 0"
);

assert(
  !placeOrderInputSchema.safeParse({
    ...validBaseOrder,
    items: [{ ...validBaseOrder.items[0], quantity: -5 }],
  }).success,
  "Reject negative quantity"
);

assert(
  !placeOrderInputSchema.safeParse({
    ...validBaseOrder,
    items: [{ ...validBaseOrder.items[0], quantity: 1.5 }],
  }).success,
  "Reject fractional/decimal quantity"
);

assert(
  !placeOrderInputSchema.safeParse({
    ...validBaseOrder,
    items: [{ ...validBaseOrder.items[0], quantity: 25 }],
  }).success,
  "Reject quantity exceeding maximum line limit (> 20)"
);

// --- 5. Identifier Validation ---
console.log("\n--- 5. Product & Variant UUID Validation ---");

assert(
  !placeOrderInputSchema.safeParse({
    ...validBaseOrder,
    items: [{ ...validBaseOrder.items[0], productId: "invalid-product-id" }],
  }).success,
  "Reject non-UUID productId"
);

assert(
  !placeOrderInputSchema.safeParse({
    ...validBaseOrder,
    items: [
      {
        productId: "11111111-1111-1111-1111-111111111111",
        kind: "SIMPLE" as const,
        variantId: "not-a-uuid",
        quantity: 1,
      },
    ],
  }).success,
  "Reject non-UUID variantId on simple product"
);

// --- 6. Pickup Time Window ---
console.log("\n--- 6. Pickup Time Boundaries ---");

assert(
  !placeOrderInputSchema.safeParse({
    ...validBaseOrder,
    pickupSlotStart: "not-a-date",
  }).success,
  "Reject unparseable date string"
);

assert(
  !placeOrderInputSchema.safeParse({
    ...validBaseOrder,
    pickupSlotStart: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  }).success,
  "Reject pickup date in the past (> 2 hours ago)"
);

assert(
  !placeOrderInputSchema.safeParse({
    ...validBaseOrder,
    pickupSlotStart: new Date(Date.now() + 100 * 24 * 60 * 60 * 1000).toISOString(),
  }).success,
  "Reject pickup date too far in the future (> 60 days)"
);

// --- 7. Order Token Lookup Validation ---
console.log("\n--- 7. Order Lookup Security Boundaries ---");

assert(
  lookupOrderTokenSchema.safeParse({ orderNumber: "NB1001", phone: "9845012345" }).success,
  "Accept valid order reference NB1001 with 10-digit phone"
);

assert(
  !lookupOrderTokenSchema.safeParse({ orderNumber: "1001", phone: "9845012345" }).success,
  "Reject order number missing NB prefix"
);

assert(
  !lookupOrderTokenSchema.safeParse({ orderNumber: "NB1001", phone: "12345" }).success,
  "Reject lookup with invalid/short phone"
);

assert(
  !lookupOrderTokenSchema.safeParse({
    orderNumber: "NB1001",
    phone: "9845012345",
    extra: "injected",
  }).success,
  "Reject lookup payload with extra fields (.strict())"
);

// --- 8. Rate Limiter ---
console.log("\n--- 8. In-Memory Sliding Window Rate Limiter ---");

const testKey = `test:rl:${Date.now()}`;
const maxAllowed = 3;
const windowMs = 5000;

const r1 = checkRateLimit({ key: testKey, maxRequests: maxAllowed, windowMs });
const r2 = checkRateLimit({ key: testKey, maxRequests: maxAllowed, windowMs });
const r3 = checkRateLimit({ key: testKey, maxRequests: maxAllowed, windowMs });
const r4 = checkRateLimit({ key: testKey, maxRequests: maxAllowed, windowMs });

assert(r1.allowed && r2.allowed && r3.allowed, "Allow requests within rate limit (1, 2, 3)");
assert(!r4.allowed, "Block request exceeding maxRequests (4th attempt rejected)");
assert(r4.retryAfterSeconds > 0, "Provide positive retryAfterSeconds when blocked");

// --- 9. Custom Cake Validation & Security ---
console.log("\n--- 9. Custom Cake Boundaries & File Constraints ---");

const validCustomCake = {
  customerName: "Priya Sharma",
  customerPhone: "9845012345",
  customerEmail: "priya@example.com",
  cakeType: "Birthday Celebration",
  flavour: "Dutch Chocolate Truffle",
  eggType: "EGGLESS" as const,
  weightGrams: 1500,
  shape: "Round",
  preferredPickupDate: "2026-10-25",
  preferredPickupTime: "2:00 PM – 4:00 PM",
  description: "Peppa pig themed 2-tier cake with pastel clouds and rainbow piping",
  messageOnCake: "Happy 3rd Birthday Anaya!",
  additionalNotes: "Less sugar in frosting please",
};

assert(
  customCakeFormSchema.safeParse(validCustomCake).success,
  "Valid custom cake baseline accepted"
);

assert(
  !customCakeFormSchema.safeParse({ ...validCustomCake, customerName: "P" }).success,
  "Reject custom cake customer name < 2 characters"
);

assert(
  !customCakeFormSchema.safeParse({ ...validCustomCake, customerPhone: "12345" }).success,
  "Reject custom cake invalid phone number"
);

assert(
  !customCakeFormSchema.safeParse({ ...validCustomCake, description: "cake" }).success,
  "Reject custom cake description < 10 characters"
);

assert(
  !customCakeFormSchema.safeParse({ ...validCustomCake, weightGrams: 100 }).success,
  "Reject custom cake weight below 250 grams"
);

assert(
  !customCakeFormSchema.safeParse({ ...validCustomCake, weightGrams: 25000 }).success,
  "Reject custom cake weight above 20,000 grams"
);

assert(
  !customCakeFormSchema.safeParse({
    ...validCustomCake,
    messageOnCake: "A".repeat(61),
  }).success,
  "Reject custom cake message > 60 characters"
);

assert(
  !customCakeFormSchema.safeParse({
    ...validCustomCake,
    injectedPrice: 500,
  }).success,
  "Reject custom cake payload with injected pricing fields (.strict())"
);

// File validation checks
assert(
  validateReferenceImageFile(null).valid,
  "Allow null reference image file (optional upload)"
);

const fakeValidFile = {
  size: 2 * 1024 * 1024,
  type: "image/jpeg",
} as File;
assert(
  validateReferenceImageFile(fakeValidFile).valid,
  "Allow valid JPEG file under 5MB"
);

const fakeOversizedFile = {
  size: 6 * 1024 * 1024,
  type: "image/png",
} as File;
assert(
  !validateReferenceImageFile(fakeOversizedFile).valid,
  "Reject oversized reference photo (> 5MB)"
);

const fakeInvalidMimeFile = {
  size: 1024 * 1024,
  type: "application/pdf",
} as File;
assert(
  !validateReferenceImageFile(fakeInvalidMimeFile).valid,
  "Reject disallowed MIME type (e.g. PDF/executable)"
);

// --- 10. Admin Area Validation & Security Boundaries (Step 6) ---
console.log("\n--- 10. Admin Area Validation & Authorization Boundaries ---");

// Categories
const validCategory = {
  name: "Signature Cakes",
  name_kn: "ಸಿಗ್ನೇಚರ್ ಕೇಕ್ಗಳು",
  slug: "signature-cakes",
  description: "Handcrafted celebration bakes",
  sort_order: 10,
  is_visible: true,
};
assert(
  adminCategorySchema.safeParse(validCategory).success,
  "Admin: Accept valid category payload"
);
assert(
  !adminCategorySchema.safeParse({ ...validCategory, name: "A" }).success,
  "Admin: Reject category name < 2 characters"
);
assert(
  !adminCategorySchema.safeParse({ ...validCategory, slug: "Invalid Slug with spaces" }).success,
  "Admin: Reject malformed category slug with spaces/caps"
);

// Products
const validSimpleProduct = {
  category_id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  name: "Dilpasand",
  slug: "dilpasand",
  description: "Traditional coconut and tutti frutti pastry",
  kind: "SIMPLE" as const,
  price_tier_id: null,
  is_available: true,
  orderable_online: true,
  requires_confirmation: false,
  is_featured: true,
  is_best_seller: false,
  is_new_arrival: false,
  is_seasonal: false,
  lead_time_minutes: 60,
  sort_order: 1,
};
assert(
  adminProductSchema.safeParse(validSimpleProduct).success,
  "Admin: Accept valid Simple product without price tier"
);
assert(
  !adminProductSchema.safeParse({
    ...validSimpleProduct,
    price_tier_id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  }).success,
  "Admin: Enforce database constraint: SIMPLE product cannot have price_tier_id"
);

const validTieredProduct = {
  category_id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  name: "Black Forest Cake",
  slug: "black-forest-cake",
  kind: "TIERED_CAKE" as const,
  price_tier_id: "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
  is_available: true,
  orderable_online: true,
  requires_confirmation: true,
  is_featured: false,
  is_best_seller: true,
  is_new_arrival: false,
  is_seasonal: false,
  lead_time_minutes: 240,
  sort_order: 2,
};
assert(
  adminProductSchema.safeParse(validTieredProduct).success,
  "Admin: Accept valid Tiered Cake with price tier"
);
assert(
  !adminProductSchema.safeParse({
    ...validTieredProduct,
    price_tier_id: null,
  }).success,
  "Admin: Enforce database constraint: TIERED_CAKE must have a price_tier_id"
);

// Variants
const validVariant = {
  product_id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  label: "Pack of 4",
  price_paise: 16000,
  is_available: true,
  sort_order: 10,
};
assert(
  adminVariantSchema.safeParse(validVariant).success,
  "Admin: Accept valid variant with integer paise"
);
assert(
  !adminVariantSchema.safeParse({ ...validVariant, price_paise: -100 }).success,
  "Admin: Reject variant with negative price"
);
assert(
  !adminVariantSchema.safeParse({ ...validVariant, price_paise: 0 }).success,
  "Admin: Reject variant with zero price"
);
assert(
  !adminVariantSchema.safeParse({ ...validVariant, price_paise: 150.5 }).success,
  "Admin: Enforce integer paise (reject floating point prices)"
);

// Cake Price Tier Rules
const validTierRule = {
  tier_id: "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
  weight_grams: 1000,
  egg_type: "EGGLESS" as const,
  finish: "STANDARD" as const,
  price_paise: 75000,
  is_active: true,
};
assert(
  adminPriceTierRuleSchema.safeParse(validTierRule).success,
  "Admin: Accept valid cake tier pricing rule"
);
assert(
  !adminPriceTierRuleSchema.safeParse({ ...validTierRule, weight_grams: 0 }).success,
  "Admin: Reject cake tier rule with weight <= 0"
);

// Store Settings
const validStoreSettings = {
  location_id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  slot_minutes: 30 as const,
  max_orders_per_slot: 6,
  max_custom_per_day: 4,
  quote_validity_hours: 24,
  cancel_cutoff_hours: 4,
  pending_alert_minutes: 15,
};
assert(
  adminStoreSettingsSchema.safeParse(validStoreSettings).success,
  "Admin: Accept valid store slot & capacity settings"
);
assert(
  !adminStoreSettingsSchema.safeParse({ ...validStoreSettings, slot_minutes: 45 as unknown as 15 }).success,
  "Admin: Enforce valid slot_minutes enum (must be 15, 30, or 60)"
);
assert(
  !adminStoreSettingsSchema.safeParse({ ...validStoreSettings, max_orders_per_slot: -1 }).success,
  "Admin: Reject negative orders per slot"
);

// Staff Roles
const validStaffUpdate = {
  user_id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  role: "ADMIN" as const,
  is_active: true,
};
assert(
  adminStaffRoleSchema.safeParse(validStaffUpdate).success,
  "Admin: Accept valid staff role update"
);
assert(
  !adminStaffRoleSchema.safeParse({ ...validStaffUpdate, role: "SUPER_ADMIN" as unknown as "EMPLOYEE" }).success,
  "Admin: Reject unsupported staff role value"
);
assert(
  !adminStaffRoleSchema.safeParse({ ...validStaffUpdate, user_id: "not-a-uuid" }).success,
  "Admin: Reject non-UUID staff user ID"
);

// --- 7. File Upload & Magic Bytes Verification ---
console.log("\n--- 7. File Upload Magic Bytes Security ---");

const fakeJpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
const fakePng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
const fakeWebp = Buffer.from([0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50]);
const maliciousHtml = Buffer.from("<script>alert('xss')</script>");

assert(validateImageMagicBytes(fakeJpeg), "File Upload: Accept valid JPEG binary signature");
assert(validateImageMagicBytes(fakePng), "File Upload: Accept valid PNG binary signature");
assert(validateImageMagicBytes(fakeWebp), "File Upload: Accept valid WebP binary signature");
assert(!validateImageMagicBytes(maliciousHtml), "File Upload: Reject HTML/script disguised as image");
assert(!validateImageMagicBytes(Buffer.from([0x00, 0x01])), "File Upload: Reject truncated buffer (<12 bytes)");

// --- 8. Staff Authentication Rate Limiting ---
console.log("\n--- 8. Staff Authentication Brute Force Rate Limiting ---");
const staffKey = `staff_login:ip:192.168.1.100`;
const staffMax = 5;
const staffWindow = 5 * 60 * 1000;

for (let i = 0; i < staffMax; i++) {
  checkRateLimit({ key: staffKey, maxRequests: staffMax, windowMs: staffWindow });
}
const staffBlocked = checkRateLimit({ key: staffKey, maxRequests: staffMax, windowMs: staffWindow });
assert(!staffBlocked.allowed, "Staff Login: Reject 6th login attempt within 5 minutes (brute-force defense)");

// --- 9. Public Store Status Exposure Boundaries ---
console.log("\n--- 9. Public Store Status Exposure Boundaries ---");

const validPublicStatus = {
  location_id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  orders_paused_until: "2026-10-25T16:00:00.000Z",
  pause_message: "Taking orders shortly!",
  slot_minutes: 30,
};

assert(
  publicStoreStatusSchema.safeParse(validPublicStatus).success,
  "Store Status: Accept valid public store status payload"
);

assert(
  publicStoreStatusSchema.safeParse({
    orders_paused_until: null,
    pause_message: null,
    slot_minutes: 30,
  }).success,
  "Store Status: Accept unpaused store status with null pause info"
);

assert(
  !publicStoreStatusSchema.safeParse({
    ...validPublicStatus,
    max_orders_per_slot: 6, // Leaked internal capacity
  }).success,
  "Store Status: Reject payload exposing internal capacity (max_orders_per_slot)"
);

assert(
  !publicStoreStatusSchema.safeParse({
    ...validPublicStatus,
    max_custom_per_day: 4, // Leaked internal capacity
  }).success,
  "Store Status: Reject payload exposing internal capacity (max_custom_per_day)"
);

assert(
  !publicStoreStatusSchema.safeParse({
    ...validPublicStatus,
    quote_validity_hours: 24, // Leaked business rule
  }).success,
  "Store Status: Reject payload exposing quote_validity_hours"
);

assert(
  !publicStoreStatusSchema.safeParse({
    ...validPublicStatus,
    max_open_orders_per_phone: 3, // Leaked anti-abuse threshold
  }).success,
  "Store Status: Reject payload exposing max_open_orders_per_phone"
);

assert(
  !publicStoreStatusSchema.safeParse({
    ...validPublicStatus,
    cancel_cutoff_hours: 4, // Leaked operational threshold
  }).success,
  "Store Status: Reject payload exposing cancel_cutoff_hours"
);

assert(
  !publicStoreStatusSchema.safeParse({
    ...validPublicStatus,
    pending_alert_minutes: 15, // Leaked operational threshold
  }).success,
  "Store Status: Reject payload exposing pending_alert_minutes"
);


console.log("\n========================================================");
console.log(`TEST SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
console.log("========================================================\n");

if (failedCount > 0) {
  process.exit(1);
}
