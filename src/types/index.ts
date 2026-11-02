export type DealType = 'recurring' | 'one_time_flat' | 'one_time_upsell_later';

export type ProspectStatus = 'not_contacted' | 'contacted' | 'follow_up';

export interface Client {
  id: string;
  business_name: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  website_url: string;
  bought_website: boolean;
  bought_accessory: boolean;
  deal_type: DealType;
  notes: string;
  created_at: string;
}

export interface Order {
  id: string;
  client_id: string;
  item_type: string; // e.g. 'website', 'accessory', 'bundle: 2 NFC + Website', etc.
  amount: number;
  order_date: string; // YYYY-MM-DD
  notes: string;
  created_at: string;
}

export interface Prospect {
  id: string;
  business_name: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  notes: string;
  status: ProspectStatus;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  description?: string;
  default_amount?: number;
  cost_amount?: number;
}

export interface ClientWithComputedStats extends Client {
  total_paid: number;
  last_order_date: string | null;
  orders_count: number;
}

export interface PricingRules {
  website_price: number;
  first_nfc_price: number;
  second_nfc_price: number;
  additional_nfc_price: number; // e.g. every third+ card
  bundle_discount: number;
}

export interface PresetBundle {
  id: string;
  name: string;
  description: string;
  has_website: boolean;
  nfc_count: number;
  custom_amount?: number;
  tags?: string[];
}

export interface InventoryItem {
  id: string;
  category_id?: string | null;
  item_name: string;
  quantity_on_hand: number;
  reorder_threshold: number;
  notes?: string | null;
  updated_at?: string;
}

export type TaskType = 'follow_up_call' | 'needs_help' | 'reorder' | 'other';
export type TaskStatus = 'open' | 'done';

export interface TaskItem {
  id: string;
  client_id?: string | null;
  task_type: TaskType;
  description: string;
  due_date?: string | null; // YYYY-MM-DD
  status: TaskStatus;
  created_at: string;
}

export type ScriptEffectiveness = 'working' | 'not_working' | 'testing';

export interface SalesScript {
  id: string;
  title: string;
  content: string;
  category_id?: string | null;
  effectiveness: ScriptEffectiveness;
  notes?: string | null;
  updated_at?: string;
}

export interface Employee {
  id: string;
  name: string;
  role?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface NoteItem {
  id: string;
  title?: string;
  content: string;
  tags?: string[];
  is_pinned?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface DashboardConfig {
  showRevenueChart?: boolean;
  showProfitChart?: boolean;
  showTopSellers?: boolean;
  showTopClients?: boolean;
  showCalendar?: boolean;
  showQuickStats?: boolean;
  showPendingTasks?: boolean;
  showInventoryAlerts?: boolean;
}
