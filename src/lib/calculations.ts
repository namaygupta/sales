import {
  Client,
  Order,
  Prospect,
  ClientWithComputedStats,
  DealType,
  ProspectStatus,
  PricingRules,
  PresetBundle,
} from '../types/index';

export const DEFAULT_PRICING_RULES: PricingRules = {
  website_price: 1500,
  first_nfc_price: 79,
  second_nfc_price: 60,
  additional_nfc_price: 40, // every 3rd card onwards is $40
  bundle_discount: 50, // discount when bundling website with NFC
};

export const DEFAULT_PRESET_BUNDLES: PresetBundle[] = [
  {
    id: 'bundle_website_1nfc',
    name: 'Website + 1 NFC Card',
    description: 'Custom business website plus 1 programmed Google review stand',
    has_website: true,
    nfc_count: 1,
    tags: ['Popular', 'Full Setup'],
  },
  {
    id: 'bundle_website_2nfc',
    name: 'Website + 2 NFC Cards',
    description: 'Custom website plus 2 review cards (front counter + checkout)',
    has_website: true,
    nfc_count: 2,
    tags: ['Best Value'],
  },
  {
    id: 'bundle_2nfc',
    name: '2 NFC Review Cards',
    description: 'Pair of contactless NFC stands with multi-card discount',
    has_website: false,
    nfc_count: 2,
    tags: ['Accessory Pack'],
  },
  {
    id: 'bundle_website_only',
    name: 'Website Only',
    description: 'Full custom responsive website build and launch',
    has_website: true,
    nfc_count: 0,
  },
  {
    id: 'bundle_1nfc_only',
    name: '1 NFC Review Card',
    description: 'Single contactless tap-to-review Google stand',
    has_website: false,
    nfc_count: 1,
  },
];

/**
 * Calculates tiered NFC pricing:
 * 1st card = first_nfc_price
 * 2nd card = second_nfc_price
 * 3rd card onwards = additional_nfc_price each
 */
export function calculateNfcPricing(
  count: number,
  rules: Pick<PricingRules, 'first_nfc_price' | 'second_nfc_price' | 'additional_nfc_price'>
): { total: number; breakdown: string } {
  const safeCount = Math.max(0, Math.floor(count || 0));
  if (safeCount <= 0) {
    return { total: 0, breakdown: '0 NFC cards' };
  }
  if (safeCount === 1) {
    return { total: rules.first_nfc_price, breakdown: `1x NFC ($${rules.first_nfc_price})` };
  }
  if (safeCount === 2) {
    const total = rules.first_nfc_price + rules.second_nfc_price;
    return {
      total,
      breakdown: `2x NFC ($${rules.first_nfc_price} + $${rules.second_nfc_price})`,
    };
  }
  const extraCount = safeCount - 2;
  const extraTotal = extraCount * rules.additional_nfc_price;
  const total = rules.first_nfc_price + rules.second_nfc_price + extraTotal;
  return {
    total,
    breakdown: `${safeCount}x NFC ($${rules.first_nfc_price} + $${rules.second_nfc_price} + ${extraCount}x$${rules.additional_nfc_price})`,
  };
}

/**
 * Computes custom bundle total with live reactive pricing, optional addons and overrides.
 */
export function calculateCustomBundle(params: {
  hasWebsite: boolean;
  websitePrice: number;
  nfcCount: number;
  rules: PricingRules;
  customDiscount?: number;
  addons?: { name: string; price: number }[];
}): {
  websiteAmount: number;
  nfcAmount: number;
  addonsAmount: number;
  bundleDiscount: number;
  subtotal: number;
  finalTotal: number;
  summaryTitle: string;
  notesDescription: string;
} {
  const websiteAmount = params.hasWebsite ? Number(params.websitePrice) || 0 : 0;
  const { total: nfcAmount, breakdown: nfcBreakdown } = calculateNfcPricing(
    params.nfcCount,
    params.rules
  );

  const addonsAmount = (params.addons || []).reduce((sum, a) => sum + (Number(a.price) || 0), 0);

  // Apply bundle discount when website is paired with NFC accessories
  const bundleDiscount =
    params.hasWebsite && params.nfcCount > 0 ? params.rules.bundle_discount || 0 : 0;

  const subtotal = websiteAmount + nfcAmount + addonsAmount - bundleDiscount;
  const customDiscount = Number(params.customDiscount) || 0;
  const finalTotal = Math.max(0, subtotal - customDiscount);

  // Auto-compose summary label
  const parts: string[] = [];
  if (params.hasWebsite) parts.push('Website');
  if (params.nfcCount > 0) parts.push(`${params.nfcCount} NFC`);
  (params.addons || []).forEach(a => parts.push(a.name));

  const summaryTitle = parts.length > 0 ? parts.join(' + ') : 'Custom Order';

  const notesList: string[] = [];
  if (params.hasWebsite) notesList.push(`Website ($${websiteAmount})`);
  if (params.nfcCount > 0) notesList.push(nfcBreakdown);
  (params.addons || []).forEach(a => notesList.push(`${a.name} ($${a.price})`));
  if (bundleDiscount > 0) notesList.push(`Bundle discount (-$${bundleDiscount})`);
  if (customDiscount > 0) notesList.push(`Discount (-$${customDiscount})`);

  return {
    websiteAmount,
    nfcAmount,
    addonsAmount,
    bundleDiscount,
    subtotal,
    finalTotal,
    summaryTitle,
    notesDescription: notesList.join(', '),
  };
}

/**
 * Computes the total paid by a client by dynamically summing all matching orders.
 * Never stores running total in client table to prevent data drift.
 */
export function calculateTotalPaid(orders: Order[], clientId: string): number {
  if (!Array.isArray(orders) || !clientId) return 0;
  return orders
    .filter(order => order.client_id === clientId)
    .reduce((sum, order) => {
      const val = typeof order.amount === 'number' ? order.amount : parseFloat(order.amount as any);
      return sum + (isNaN(val) ? 0 : val);
    }, 0);
}

/**
 * Retrieves the most recent order date for a given client.
 */
export function getLastOrderDate(orders: Order[], clientId: string): string | null {
  if (!Array.isArray(orders) || !clientId) return null;
  const clientOrders = orders.filter(order => order.client_id === clientId && order.order_date);
  if (clientOrders.length === 0) return null;

  // Sort descending by order_date
  const sorted = [...clientOrders].sort((a, b) => b.order_date.localeCompare(a.order_date));
  return sorted[0].order_date;
}

/**
 * Computes full order statistics for a client.
 */
export function getClientStats(orders: Order[], clientId: string) {
  const clientOrders = orders.filter(order => order.client_id === clientId);
  const totalPaid = calculateTotalPaid(orders, clientId);
  const count = clientOrders.length;
  const lastOrderDate = getLastOrderDate(orders, clientId);
  const averageOrder = count > 0 ? totalPaid / count : 0;

  return {
    totalPaid,
    count,
    lastOrderDate,
    averageOrder,
    orders: clientOrders.sort((a, b) => b.order_date.localeCompare(a.order_date)),
  };
}

/**
 * Formats a number as a standard USD currency string ($1,250.00).
 */
export function formatCurrency(amount: number): string {
  const val = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
}

/**
 * Converts a prospect into a client preserving all contact info and notes.
 */
export function convertProspectToClient(
  prospect: Prospect,
  dealType: DealType = 'one_time_flat',
  idGenerator: () => string = () => crypto.randomUUID()
): Client {
  return {
    id: idGenerator(),
    business_name: prospect.business_name.trim(),
    contact_name: prospect.contact_name?.trim() || '',
    contact_phone: prospect.contact_phone?.trim() || '',
    contact_email: prospect.contact_email?.trim() || '',
    website_url: '',
    bought_website: false,
    bought_accessory: false,
    deal_type: dealType,
    notes: prospect.notes ? `[Converted from Prospect]: ${prospect.notes}` : '',
    created_at: new Date().toISOString(),
  };
}

/**
 * Merges computed stats into client objects for fast tabular rendering and sorting.
 */
export function computeClientListWithStats(
  clients: Client[],
  orders: Order[]
): ClientWithComputedStats[] {
  return clients.map(client => {
    const total_paid = calculateTotalPaid(orders, client.id);
    const last_order_date = getLastOrderDate(orders, client.id);
    const orders_count = orders.filter(o => o.client_id === client.id).length;

    return {
      ...client,
      total_paid,
      last_order_date,
      orders_count,
    };
  });
}

/**
 * Filters and sorts the clients list.
 */
export function filterAndSortClients(
  clientsWithStats: ClientWithComputedStats[],
  query: string,
  dealTypeFilter: string,
  sortField: keyof ClientWithComputedStats | 'total_paid' | 'last_order_date',
  sortAsc: boolean
): ClientWithComputedStats[] {
  let list = [...clientsWithStats];

  if (query.trim()) {
    const q = query.toLowerCase().trim();
    list = list.filter(
      c =>
        c.business_name.toLowerCase().includes(q) ||
        (c.contact_name && c.contact_name.toLowerCase().includes(q)) ||
        (c.contact_email && c.contact_email.toLowerCase().includes(q)) ||
        (c.contact_phone && c.contact_phone.includes(q)) ||
        (c.website_url && c.website_url.toLowerCase().includes(q)) ||
        (c.notes && c.notes.toLowerCase().includes(q))
    );
  }

  if (dealTypeFilter && dealTypeFilter !== 'all') {
    list = list.filter(c => c.deal_type === dealTypeFilter);
  }

  list.sort((a, b) => {
    let valA: any = a[sortField];
    let valB: any = b[sortField];

    if (sortField === 'total_paid') {
      valA = a.total_paid || 0;
      valB = b.total_paid || 0;
    } else if (sortField === 'last_order_date') {
      valA = a.last_order_date || '';
      valB = b.last_order_date || '';
    } else if (typeof valA === 'string') {
      valA = valA.toLowerCase();
      valB = (valB || '').toLowerCase();
    }

    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  return list;
}

/**
 * Filters and sorts the prospects list.
 */
export function filterAndSortProspects(
  prospects: Prospect[],
  query: string,
  statusFilter: string,
  sortField: keyof Prospect,
  sortAsc: boolean
): Prospect[] {
  let list = [...prospects];

  if (query.trim()) {
    const q = query.toLowerCase().trim();
    list = list.filter(
      p =>
        p.business_name.toLowerCase().includes(q) ||
        (p.contact_name && p.contact_name.toLowerCase().includes(q)) ||
        (p.contact_email && p.contact_email.toLowerCase().includes(q)) ||
        (p.contact_phone && p.contact_phone.includes(q)) ||
        (p.notes && p.notes.toLowerCase().includes(q))
    );
  }

  if (statusFilter && statusFilter !== 'all') {
    list = list.filter(p => p.status === statusFilter);
  }

  list.sort((a, b) => {
    let valA: any = a[sortField] || '';
    let valB: any = b[sortField] || '';

    if (typeof valA === 'string') {
      valA = valA.toLowerCase();
      valB = valB.toLowerCase();
    }

    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  return list;
}
