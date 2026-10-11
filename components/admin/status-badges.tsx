import {
  FULFILLMENT_STATUS_LABEL,
  ORDER_STATUS_LABEL,
  paymentLabel,
} from "@/lib/order-labels";
import { cn } from "@/lib/utils";

const base = "inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold";

const ORDER_STYLE: Record<string, string> = {
  PENDING_CONFIRMATION: "bg-amber-50 text-amber-700",
  CONFIRMED: "bg-sky-50 text-sky-700",
  AWAITING_PAYMENT: "bg-orange-50 text-orange-700",
  PROCESSING: "bg-violet-50 text-violet-700",
  READY_FOR_PICKUP: "bg-lime-100 text-lime-800",
  COMPLETED: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-red-50 text-red-700",
};

const PAYMENT_STYLE: Record<string, string> = {
  UNPAID: "bg-stone-100 text-stone-600",
  DP_PARTIAL: "bg-sky-50 text-sky-700",
  PAID: "bg-emerald-50 text-emerald-700",
  REFUNDED: "bg-violet-50 text-violet-700",
  PAYMENT_CANCELLED: "bg-red-50 text-red-700",
};

const FULFILLMENT_STYLE: Record<string, string> = {
  NOT_READY: "bg-stone-100 text-stone-600",
  READY_FOR_PICKUP: "bg-lime-100 text-lime-800",
  PICKED_UP: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-red-50 text-red-700",
};

export function OrderStatusBadge({ status }: { status: string }) {
  return (
    <span className={cn(base, ORDER_STYLE[status] ?? "bg-stone-100 text-stone-600")}>
      {ORDER_STATUS_LABEL[status] ?? status}
    </span>
  );
}

export function PaymentStatusBadge({
  status,
  dpPercentage,
}: {
  status: string;
  dpPercentage: number;
}) {
  return (
    <span className={cn(base, PAYMENT_STYLE[status] ?? "bg-stone-100 text-stone-600")}>
      {paymentLabel(status, dpPercentage)}
    </span>
  );
}

export function FulfillmentBadge({ status }: { status: string }) {
  return (
    <span className={cn(base, FULFILLMENT_STYLE[status] ?? "bg-stone-100 text-stone-600")}>
      {FULFILLMENT_STATUS_LABEL[status] ?? status}
    </span>
  );
}