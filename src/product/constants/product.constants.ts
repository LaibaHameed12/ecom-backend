// dto/constants.ts
export const PURCHASE_TYPES = ['money', 'points', 'hybrid'] as const;
export type PurchaseType = typeof PURCHASE_TYPES[number];

export const DISCOUNT_TYPES = ['percent', 'flat'] as const;
export type DiscountType = typeof DISCOUNT_TYPES[number];

export const DRESS_STYLES = ['casual', 'party', 'gym', 'formal'] as const;
export type DressStyle = typeof DRESS_STYLES[number];

export const SIZES = ['small','medium','large'] as const;
export type Sizes = typeof SIZES[number];

export const COLORS = ['green','white','black'] as const;
export type Colors = typeof COLORS[number];

export const GARMENTS = ['t-shirt','shorts','hoodie','shirt','jeans'] as const;
export type Garment = typeof GARMENTS[number];
