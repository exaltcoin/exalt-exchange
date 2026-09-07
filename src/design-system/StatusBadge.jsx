import { Badge } from "./Badge.jsx";

/*
  A single, shared mapping from real backend status strings to a
  consistent visual tone - so "FILLED" always reads as success
  green and "REJECTED" always reads as danger red, everywhere in
  the app, rather than each page re-deciding its own colors. This
  is the ONLY place that mapping should live; pages should not
  hardcode their own status-to-color logic.

  This intentionally covers the status vocabulary already used
  across the real backend (orders, deposits, withdrawals, P2P,
  KYC) - confirmed against the actual model/controller status
  enums during the redesign audit, not invented.
*/
const STATUS_TONE_MAP = {
  // generic / orders
  OPEN: "info",
  PENDING: "warning",
  FILLED: "success",
  PARTIALLY_FILLED: "info",
  CANCELLED: "neutral",
  REJECTED: "danger",
  EXPIRED: "neutral",
  FAILED: "danger",
  COMPLETED: "success",
  PROCESSING: "info",
  CONFIRMING: "info",

  // deposits/withdrawals
  CREDITED: "success",
  APPROVED: "success",

  // KYC / P2P / generic review states
  UNDER_REVIEW: "warning",
  IN_ESCROW: "info",
  DISPUTED: "danger",
  RELEASED: "success",
};

/*
  normalizeStatus: real backend status strings vary in case
  ("Pending" vs "pending" vs "PENDING") - this only normalizes
  casing/whitespace for lookup purposes, it never changes what
  status is actually displayed to the user (the raw `status` value
  passed in is always what's shown as the label).
*/
const normalizeStatus = (status) =>
  String(status || "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

export const getStatusTone = (status) =>
  STATUS_TONE_MAP[normalizeStatus(status)] || "neutral";

/*
  StatusBadge: thin convenience wrapper - `status` must be a real
  value from backend data, never a caller's guess.
*/
export const StatusBadge = ({ status, label, ...rest }) => (
  <Badge tone={getStatusTone(status)} {...rest}>
    {label ?? status}
  </Badge>
);

export default StatusBadge;
