import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateTotalPaid,
  getLastOrderDate,
  getClientStats,
  formatCurrency,
  convertProspectToClient,
  computeClientListWithStats,
  filterAndSortClients,
  filterAndSortProspects,
  calculateNfcPricing,
  calculateCustomBundle,
  DEFAULT_PRICING_RULES,
} from './calculations';
import { Client, Order, Prospect } from '../types/index';

test('calculateTotalPaid sums orders dynamically and returns 0 when no orders exist', () => {
  const orders: Order[] = [
    {
      id: 'o1',
      client_id: 'client-1',
      item_type: 'website',
      amount: 1500,
      order_date: '2026-01-10',
      notes: 'Initial deposit',
      created_at: '2026-01-10T10:00:00Z',
    },
    {
      id: 'o2',
      client_id: 'client-1',
      item_type: 'accessory',
      amount: 79,
      order_date: '2026-02-15',
      notes: 'NFC card reorder',
      created_at: '2026-02-15T14:00:00Z',
    },
    {
      id: 'o3',
      client_id: 'client-2',
      item_type: 'website',
      amount: 2000,
      order_date: '2026-03-01',
      notes: 'Full build',
      created_at: '2026-03-01T09:00:00Z',
    },
  ];

  assert.equal(calculateTotalPaid(orders, 'client-1'), 1579);
  assert.equal(calculateTotalPaid(orders, 'client-2'), 2000);
  assert.equal(calculateTotalPaid(orders, 'client-999'), 0);
  assert.equal(calculateTotalPaid([], 'client-1'), 0);
});

test('calculateNfcPricing calculates tiered pricing correctly', () => {
  const rules = { first_nfc_price: 79, second_nfc_price: 60, additional_nfc_price: 40 };

  // 0 cards
  assert.equal(calculateNfcPricing(0, rules).total, 0);

  // 1 card
  assert.equal(calculateNfcPricing(1, rules).total, 79);

  // 2 cards ($79 + $60 = $139)
  assert.equal(calculateNfcPricing(2, rules).total, 139);

  // 3 cards: every 3rd card is additional $40 ($79 + $60 + $40 = $179)
  assert.equal(calculateNfcPricing(3, rules).total, 179);

  // 4 cards: ($79 + $60 + $40 + $40 = $219)
  assert.equal(calculateNfcPricing(4, rules).total, 219);
});

test('calculateCustomBundle computes website + 2 NFC bundle with discounts', () => {
  const res = calculateCustomBundle({
    hasWebsite: true,
    websitePrice: 1500,
    nfcCount: 2,
    rules: DEFAULT_PRICING_RULES, // 1500 + 139 - 50 = 1589
  });

  assert.equal(res.websiteAmount, 1500);
  assert.equal(res.nfcAmount, 139);
  assert.equal(res.bundleDiscount, 50);
  assert.equal(res.finalTotal, 1589);
  assert.equal(res.summaryTitle, 'Website + 2 NFC');
});

test('calculateCustomBundle computes infinite addon combinations', () => {
  const res = calculateCustomBundle({
    hasWebsite: true,
    websitePrice: 1200,
    nfcCount: 3,
    rules: {
      website_price: 1200,
      first_nfc_price: 80,
      second_nfc_price: 60,
      additional_nfc_price: 45,
      bundle_discount: 100,
    },
    addons: [
      { name: 'Google Profile Setup', price: 250 },
      { name: 'Drone Photography', price: 300 },
    ],
    customDiscount: 50,
  });

  // Website: 1200
  // NFC (3): 80 + 60 + 45 = 185
  // Addons: 250 + 300 = 550
  // Bundle discount: -100
  // Custom discount: -50
  // Total = 1200 + 185 + 550 - 100 - 50 = 1785
  assert.equal(res.finalTotal, 1785);
  assert.ok(res.summaryTitle.includes('Website + 3 NFC + Google Profile Setup + Drone Photography'));
});

test('getLastOrderDate correctly identifies the most recent order date', () => {
  const orders: Order[] = [
    {
      id: 'o1',
      client_id: 'c1',
      item_type: 'accessory',
      amount: 79,
      order_date: '2026-01-10',
      notes: '',
      created_at: '',
    },
    {
      id: 'o2',
      client_id: 'c1',
      item_type: 'website',
      amount: 1500,
      order_date: '2026-03-22',
      notes: '',
      created_at: '',
    },
    {
      id: 'o3',
      client_id: 'c1',
      item_type: 'accessory',
      amount: 79,
      order_date: '2026-02-05',
      notes: '',
      created_at: '',
    },
  ];

  assert.equal(getLastOrderDate(orders, 'c1'), '2026-03-22');
  assert.equal(getLastOrderDate(orders, 'c2'), null);
});

test('getClientStats computes totals, counts, averages, and sorted order list', () => {
  const orders: Order[] = [
    {
      id: 'o1',
      client_id: 'c1',
      item_type: 'accessory',
      amount: 100,
      order_date: '2026-01-01',
      notes: '',
      created_at: '',
    },
    {
      id: 'o2',
      client_id: 'c1',
      item_type: 'website',
      amount: 300,
      order_date: '2026-02-01',
      notes: '',
      created_at: '',
    },
  ];

  const stats = getClientStats(orders, 'c1');
  assert.equal(stats.totalPaid, 400);
  assert.equal(stats.count, 2);
  assert.equal(stats.averageOrder, 200);
  assert.equal(stats.lastOrderDate, '2026-02-01');
  assert.equal(stats.orders[0].id, 'o2'); // sorted descending
});

test('formatCurrency formats USD amounts cleanly', () => {
  assert.equal(formatCurrency(1500), '$1,500.00');
  assert.equal(formatCurrency(79.5), '$79.50');
  assert.equal(formatCurrency(0), '$0.00');
});

test('convertProspectToClient properly retains contact information and notes', () => {
  const prospect: Prospect = {
    id: 'p1',
    business_name: 'Metro Barber Shop',
    contact_name: 'Mike Vance',
    contact_phone: '555-0192',
    contact_email: 'mike@metrobarber.com',
    notes: 'Interested in review cards for 3 chairs',
    status: 'follow_up',
    created_at: '2026-01-01T00:00:00Z',
  };

  const client = convertProspectToClient(prospect, 'one_time_upsell_later', () => 'custom-uuid-1');
  assert.equal(client.id, 'custom-uuid-1');
  assert.equal(client.business_name, 'Metro Barber Shop');
  assert.equal(client.contact_name, 'Mike Vance');
  assert.equal(client.contact_phone, '555-0192');
  assert.equal(client.contact_email, 'mike@metrobarber.com');
  assert.equal(client.deal_type, 'one_time_upsell_later');
  assert.equal(client.bought_website, false);
  assert.equal(client.bought_accessory, false);
  assert.ok(client.notes.includes('Interested in review cards'));
});

test('filterAndSortClients sorts and filters accurately', () => {
  const clients: Client[] = [
    {
      id: 'c1',
      business_name: 'Alpha Dental',
      contact_name: 'Dr. John',
      contact_phone: '111',
      contact_email: 'john@alpha.com',
      website_url: 'https://alphadental.com',
      bought_website: true,
      bought_accessory: false,
      deal_type: 'one_time_flat',
      notes: '',
      created_at: '2026-01-01T00:00:00Z',
    },
    {
      id: 'c2',
      business_name: 'Zeta Auto Spa',
      contact_name: 'Frank',
      contact_phone: '222',
      contact_email: 'frank@zeta.com',
      website_url: '',
      bought_website: false,
      bought_accessory: true,
      deal_type: 'recurring',
      notes: '',
      created_at: '2026-02-01T00:00:00Z',
    },
  ];

  const orders: Order[] = [
    { id: 'o1', client_id: 'c1', item_type: 'website', amount: 1500, order_date: '2026-01-05', notes: '', created_at: '' },
    { id: 'o2', client_id: 'c2', item_type: 'accessory', amount: 2500, order_date: '2026-02-10', notes: '', created_at: '' },
  ];

  const withStats = computeClientListWithStats(clients, orders);
  assert.equal(withStats.find(c => c.id === 'c1')?.total_paid, 1500);
  assert.equal(withStats.find(c => c.id === 'c2')?.total_paid, 2500);

  // Filter by query
  const filtered = filterAndSortClients(withStats, 'Zeta', 'all', 'business_name', true);
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].business_name, 'Zeta Auto Spa');

  // Sort by total_paid descending
  const sortedPaidDesc = filterAndSortClients(withStats, '', 'all', 'total_paid', false);
  assert.equal(sortedPaidDesc[0].id, 'c2'); // 2500 > 1500
});
