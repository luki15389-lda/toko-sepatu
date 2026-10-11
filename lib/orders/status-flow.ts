export const ORDER_STATUSES = [
  "PENDING_CONFIRMATION",
  "CONFIRMED",
  "AWAITING_PAYMENT",
  "PROCESSING",
  "READY_FOR_PICKUP",
  "COMPLETED",
  "CANCELLED",
] as const;

export type OrderStatusValue = (typeof ORDER_STATUSES)[number];

export const NEXT_STATUSES: Record<OrderStatusValue, readonly OrderStatusValue[]> = {
  PENDING_CONFIRMATION: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["AWAITING_PAYMENT", "PROCESSING", "CANCELLED"],
  AWAITING_PAYMENT: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["READY_FOR_PICKUP", "CANCELLED"],
  READY_FOR_PICKUP: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export const STATUS_ACTION_LABEL: Partial<Record<OrderStatusValue, string>> = {
  CONFIRMED: "Konfirmasi pesanan",
  AWAITING_PAYMENT: "Minta pembayaran",
  PROCESSING: "Mulai proses",
  READY_FOR_PICKUP: "Tandai siap diambil",
  COMPLETED: "Selesaikan pesanan",
};

export function isOrderStatus(value: string): value is OrderStatusValue {
  return (ORDER_STATUSES as readonly string[]).includes(value);
}

export function canTransition(from: string, to: string): boolean {
  return isOrderStatus(from) && isOrderStatus(to) && NEXT_STATUSES[from].includes(to);
}