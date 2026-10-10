export type CartSizeOption = { variantId: string; size: string; stock: number };

export type CartLineDetail = {
  variantId: string;
  status: "ok" | "unavailable";
  productSlug: string;
  productName: string;
  brandName: string;
  imageUrl: string | null;
  size: string;
  unitPrice: number;
  stock: number;
  sizes: CartSizeOption[];
};