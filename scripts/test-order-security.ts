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
import { checkRateLimit } from "../lib/security/rate-limiter";

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

console.log("\n========================================================");
console.log(`TEST SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
console.log("========================================================\n");

if (failedCount > 0) {
  process.exit(1);
}
