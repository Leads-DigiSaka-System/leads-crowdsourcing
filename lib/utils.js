// Calculate funded percent (with decimals, max 100)
export function getFundedPercent(pledged, goal) {
  const p = Number(pledged) || 0;
  const g = Number(goal) || 0;
  if (g <= 0) return 0;
  return Math.min((p / g) * 100, 100);
}

// Format percentage for better UX - shows meaningful progress for small amounts
export function formatFundedPercent(pledged, goal) {
  const percentage = getFundedPercent(pledged, goal);

  if (percentage === 0) {
    return '0%';
  }

  if (percentage < 0.01) {
    return '0.01%';
  }

  if (percentage < 1) {
    return `${percentage.toFixed(2)}%`;
  }

  if (percentage < 10) {
    return `${percentage.toFixed(1)}%`;
  }

  return `${Math.round(percentage)}%`;
}
import { clsx } from "clsx";
import { Calendar, CheckCircle, Clock, Eye, XCircle } from "lucide-react";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Generate URL-friendly slug from string
export function slugify(str) {
  if (!str) return '';
  return str
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars except -
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}

// Smart title case for titles: preserve common acronyms and all-caps tokens (len>=2)
export function smartTitle(str = "") {
  if (!str) return ""
  const ACRONYMS = new Set(["GIS", "AI", "ML", "IOT", "R&D"])
  return str
    .toString()
    .split(/\s+/)
    .map((w) => {
      const upper = w.toUpperCase()
      if (ACRONYMS.has(upper)) return upper
      if (/^[A-Z0-9]{2,}$/.test(w)) return w
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
    })
    .join(" ");
}


// Capitalize only the first non-space letter, keep the rest intact
export function capitalizeFirstWordOnly(s = "") {
  if (!s) return ""
  return s.replace(/^(\s*)([a-zA-Z])/, (m, ws, c) => ws + c.toUpperCase());
}

// Title case for names (handles hyphens, preserves all-caps tokens)
export function nameTitleCase(name = "") {
  if (!name) return ""
  return name
    .split(/\s+/)
    .map((part) =>
      part
        .split('-')
        .map((seg) => (/^[A-Z0-9]{2,}$/.test(seg) ? seg : seg.charAt(0).toUpperCase() + seg.slice(1).toLowerCase()))
        .join('-')
    )
    .join(' ');
}


export function getProjectDaysLeft(createdAt, durationDays) {
  if (!createdAt || typeof durationDays !== 'number') return null;
  const created = new Date(createdAt);
  if (isNaN(created.getTime())) return null;
  const now = new Date();
  // Calculate days passed
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysPassed = Math.floor((now - created) / msPerDay);
  const daysLeft = durationDays - daysPassed;
  if (daysLeft <= 0) {
    return 0;
  }
  return daysLeft;
}


export const shortSig = sig => sig ? sig.slice(0, 4) + '...' + sig.slice(-3) : '';


export const statusConfig = {
  PENDING: { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Pending', icon: Clock },
  READ: { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Read', icon: Eye },
  SCHEDULED: { color: 'bg-green-100 text-green-800 border-green-200', label: 'Scheduled', icon: Calendar },
  COMPLETED: { color: 'bg-green-200 text-green-900 border-green-300', label: 'Completed', icon: CheckCircle },
  REJECTED: { color: 'bg-red-100 text-red-800 border-red-200', label: 'Rejected', icon: XCircle }
};

// Compute allocated amount for a budget item from multiple possible shapes
export function getBudgetItemAllocated(item) {
  if (!item) return 0;
  const direct = Number(item.allocated);
  if (!Number.isNaN(direct) && direct > 0) return direct;
  if (Array.isArray(item.donations)) {
    return item.donations.reduce((s, d) => s + (Number(d?.amount) || 0), 0);
  }
  if (Array.isArray(item.allocations)) {
    return item.allocations.reduce((s, a) => s + (Number(a?.amount) || 0), 0);
  }
  return 0;
}

// Return first budget item by position that is not fully allocated; fallback to first by position
export function getActiveBudgetItemByOrder(budgetItems = []) {
  if (!Array.isArray(budgetItems) || budgetItems.length === 0) return null;
  const items = budgetItems.slice().sort((a, b) => {
    const pa = Number.isFinite(a?.position) ? a.position : Number.MAX_SAFE_INTEGER;
    const pb = Number.isFinite(b?.position) ? b.position : Number.MAX_SAFE_INTEGER;
    if (pa !== pb) return pa - pb;
    // stable tie-breaker on numeric id if available
    const ai = typeof a?.id === 'number' ? a.id : 0;
    const bi = typeof b?.id === 'number' ? b.id : 0;
    return ai - bi;
  });
  const candidate = items.find(it => getBudgetItemAllocated(it) < (Number(it?.value) || 0));
  return candidate || items[0];
}
