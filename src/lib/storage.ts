import {
  Client,
  Order,
  Prospect,
  Category,
  PricingRules,
  PresetBundle,
  InventoryItem,
  TaskItem,
  SalesScript,
  Employee,
  NoteItem,
  DashboardConfig,
  TaskType,
  TaskStatus,
  ScriptEffectiveness,
} from '../types/index';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { DEFAULT_PRICING_RULES, DEFAULT_PRESET_BUNDLES } from './calculations';

const STORAGE_KEYS = {
  CLIENTS: 'sales_tracker_clients_v3',
  ORDERS: 'sales_tracker_orders_v3',
  PROSPECTS: 'sales_tracker_prospects_v3',
  CATEGORIES: 'sales_tracker_categories_v3',
  INVENTORY: 'sales_tracker_inventory_v3',
  TASKS: 'sales_tracker_tasks_v3',
  SCRIPTS: 'sales_tracker_scripts_v3',
  EMPLOYEES: 'sales_tracker_employees_v3',
  NOTES: 'sales_tracker_notes_v3',
  DASHBOARD_CONFIG: 'sales_tracker_dashboard_config_v3',
  PRICING_RULES: 'sales_tracker_pricing_rules_v3',
  BUNDLES: 'sales_tracker_bundles_v3',
  LOCK_STATE: 'tracker_unlocked',
};

// Local storage fallback helpers (no fake seed data, starts completely clean)
function getLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function setLocal<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Failed to write to localStorage for key ${key}:`, err);
  }
}

export class DataRepository {
  // ================= PASSWORD GATE =================
  static async verifyPassword(enteredPassword: string): Promise<boolean> {
    if (!enteredPassword) return false;
    try {
      // 1. Hash with Web Crypto API SHA-256
      const msgUint8 = new TextEncoder().encode(enteredPassword);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const enteredHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('app_settings')
          .select('password_hash')
          .eq('id', 1)
          .maybeSingle();

        if (!error && data && data.password_hash) {
          if (data.password_hash.trim().toLowerCase() === enteredHash.toLowerCase()) {
            return true;
          }
        }
      }

      // Check VITE_PASSWORD if passed in environment or GitHub Pages deploy
      const envPassword = (import.meta as any).env?.VITE_PASSWORD;
      if (envPassword && enteredPassword === envPassword) {
        return true;
      }

      // Fallback matching against pre-computed valid admin hashes
      const validHashes = [
        'cf68b9959735eab32a85987b4da9e62f9813ba6c45b0cf0c3aea7999d76a7ca8',
        'abd2de6fb16229e0b94ab620930d9ed6df792ad52764a03cbd3da5145aeccbc0',
      ];
      if (validHashes.includes(enteredHash.toLowerCase())) {
        return true;
      }

      return false;
    } catch (err) {
      console.error('Error during password verification:', err);
      return false;
    }
  }

  static isAppUnlocked(): boolean {
    try {
      return localStorage.getItem(STORAGE_KEYS.LOCK_STATE) === 'true';
    } catch {
      return false;
    }
  }

  static setAppUnlocked(unlocked: boolean): void {
    try {
      if (unlocked) {
        localStorage.setItem(STORAGE_KEYS.LOCK_STATE, 'true');
      } else {
        localStorage.removeItem(STORAGE_KEYS.LOCK_STATE);
      }
    } catch (err) {
      console.error('Error writing unlock state:', err);
    }
  }

  // ================= CLIENTS =================
  static async getClients(): Promise<Client[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('Supabase clients fetch notice:', error.message);
          return getLocal<Client[]>(STORAGE_KEYS.CLIENTS, []);
        }

        const clients: Client[] = (data || []).map((row: any) => ({
          id: row.id,
          business_name: row.business_name || '',
          contact_name: row.contact_name || '',
          contact_phone: row.contact_phone || '',
          contact_email: row.contact_email || '',
          website_url: row.website_url || '',
          bought_website: Boolean(row.bought_website),
          bought_accessory: Boolean(row.bought_accessory),
          deal_type: row.deal_type || 'one_time_flat',
          notes: row.notes || '',
          created_at: row.created_at || new Date().toISOString(),
        }));

        setLocal(STORAGE_KEYS.CLIENTS, clients);
        return clients;
      } catch (err) {
        console.warn('Supabase clients exception:', err);
        return getLocal<Client[]>(STORAGE_KEYS.CLIENTS, []);
      }
    }

    return getLocal<Client[]>(STORAGE_KEYS.CLIENTS, []);
  }

  static async createClient(client: Client): Promise<Client> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('clients')
        .insert({
          id: client.id,
          business_name: client.business_name,
          contact_name: client.contact_name || null,
          contact_phone: client.contact_phone || null,
          contact_email: client.contact_email || null,
          website_url: client.website_url || null,
          bought_website: client.bought_website,
          bought_accessory: client.bought_accessory,
          deal_type: client.deal_type,
          notes: client.notes || null,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Supabase error creating client: ${error.message}`);
      }

      const created: Client = {
        id: data.id,
        business_name: data.business_name,
        contact_name: data.contact_name || '',
        contact_phone: data.contact_phone || '',
        contact_email: data.contact_email || '',
        website_url: data.website_url || '',
        bought_website: Boolean(data.bought_website),
        bought_accessory: Boolean(data.bought_accessory),
        deal_type: data.deal_type,
        notes: data.notes || '',
        created_at: data.created_at,
      };

      const existing = getLocal<Client[]>(STORAGE_KEYS.CLIENTS, []);
      setLocal(STORAGE_KEYS.CLIENTS, [created, ...existing]);
      return created;
    }

    const current = getLocal<Client[]>(STORAGE_KEYS.CLIENTS, []);
    const updated = [client, ...current];
    setLocal(STORAGE_KEYS.CLIENTS, updated);
    return client;
  }

  static async updateClient(client: Client): Promise<Client> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('clients')
        .update({
          business_name: client.business_name,
          contact_name: client.contact_name || null,
          contact_phone: client.contact_phone || null,
          contact_email: client.contact_email || null,
          website_url: client.website_url || null,
          bought_website: client.bought_website,
          bought_accessory: client.bought_accessory,
          deal_type: client.deal_type,
          notes: client.notes || null,
        })
        .eq('id', client.id)
        .select()
        .single();

      if (error) {
        throw new Error(`Supabase error updating client: ${error.message}`);
      }

      const updated: Client = {
        id: data.id,
        business_name: data.business_name,
        contact_name: data.contact_name || '',
        contact_phone: data.contact_phone || '',
        contact_email: data.contact_email || '',
        website_url: data.website_url || '',
        bought_website: Boolean(data.bought_website),
        bought_accessory: Boolean(data.bought_accessory),
        deal_type: data.deal_type,
        notes: data.notes || '',
        created_at: data.created_at,
      };

      const current = getLocal<Client[]>(STORAGE_KEYS.CLIENTS, []);
      setLocal(
        STORAGE_KEYS.CLIENTS,
        current.map(c => (c.id === client.id ? updated : c))
      );
      return updated;
    }

    const current = getLocal<Client[]>(STORAGE_KEYS.CLIENTS, []);
    setLocal(
      STORAGE_KEYS.CLIENTS,
      current.map(c => (c.id === client.id ? client : c))
    );
    return client;
  }

  static async deleteClient(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) {
        throw new Error(`Supabase error deleting client: ${error.message}`);
      }
    }

    const currentClients = getLocal<Client[]>(STORAGE_KEYS.CLIENTS, []);
    const currentOrders = getLocal<Order[]>(STORAGE_KEYS.ORDERS, []);
    setLocal(
      STORAGE_KEYS.CLIENTS,
      currentClients.filter(c => c.id !== id)
    );
    setLocal(
      STORAGE_KEYS.ORDERS,
      currentOrders.filter(o => o.client_id !== id)
    );
  }

  // ================= ORDERS =================
  static async getOrders(): Promise<Order[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .order('order_date', { ascending: false });

        if (error) {
          console.warn('Supabase orders fetch notice:', error.message);
          return getLocal<Order[]>(STORAGE_KEYS.ORDERS, []);
        }

        const orders: Order[] = (data || []).map((row: any) => ({
          id: row.id,
          client_id: row.client_id,
          item_type: row.item_type || 'other',
          amount: Number(row.amount) || 0,
          order_date: row.order_date || new Date().toISOString().split('T')[0],
          notes: row.notes || '',
          created_at: row.created_at || new Date().toISOString(),
        }));

        setLocal(STORAGE_KEYS.ORDERS, orders);
        return orders;
      } catch (err) {
        console.warn('Supabase orders exception:', err);
        return getLocal<Order[]>(STORAGE_KEYS.ORDERS, []);
      }
    }

    return getLocal<Order[]>(STORAGE_KEYS.ORDERS, []);
  }

  static async createOrder(order: Order): Promise<Order> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('orders')
        .insert({
          id: order.id,
          client_id: order.client_id,
          item_type: order.item_type,
          amount: order.amount,
          order_date: order.order_date,
          notes: order.notes || null,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Supabase error creating order: ${error.message}`);
      }

      const created: Order = {
        id: data.id,
        client_id: data.client_id,
        item_type: data.item_type,
        amount: Number(data.amount) || 0,
        order_date: data.order_date,
        notes: data.notes || '',
        created_at: data.created_at,
      };

      const existing = getLocal<Order[]>(STORAGE_KEYS.ORDERS, []);
      setLocal(STORAGE_KEYS.ORDERS, [created, ...existing]);
      return created;
    }

    const current = getLocal<Order[]>(STORAGE_KEYS.ORDERS, []);
    setLocal(STORAGE_KEYS.ORDERS, [order, ...current]);
    return order;
  }

  static async deleteOrder(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('orders').delete().eq('id', id);
      if (error) {
        throw new Error(`Supabase error deleting order: ${error.message}`);
      }
    }

    const current = getLocal<Order[]>(STORAGE_KEYS.ORDERS, []);
    setLocal(
      STORAGE_KEYS.ORDERS,
      current.filter(o => o.id !== id)
    );
  }

  // ================= PROSPECTS =================
  static async getProspects(): Promise<Prospect[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('prospects')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('Supabase prospects fetch notice:', error.message);
          return getLocal<Prospect[]>(STORAGE_KEYS.PROSPECTS, []);
        }

        const prospects: Prospect[] = (data || []).map((row: any) => ({
          id: row.id,
          business_name: row.business_name || '',
          contact_name: row.contact_name || '',
          contact_phone: row.contact_phone || '',
          contact_email: row.contact_email || '',
          notes: row.notes || '',
          status: row.status || 'not_contacted',
          created_at: row.created_at || new Date().toISOString(),
        }));

        setLocal(STORAGE_KEYS.PROSPECTS, prospects);
        return prospects;
      } catch (err) {
        console.warn('Supabase prospects exception:', err);
        return getLocal<Prospect[]>(STORAGE_KEYS.PROSPECTS, []);
      }
    }

    return getLocal<Prospect[]>(STORAGE_KEYS.PROSPECTS, []);
  }

  static async createProspect(prospect: Prospect): Promise<Prospect> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('prospects')
        .insert({
          id: prospect.id,
          business_name: prospect.business_name,
          contact_name: prospect.contact_name || null,
          contact_phone: prospect.contact_phone || null,
          contact_email: prospect.contact_email || null,
          notes: prospect.notes || null,
          status: prospect.status,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Supabase error creating prospect: ${error.message}`);
      }

      const created: Prospect = {
        id: data.id,
        business_name: data.business_name,
        contact_name: data.contact_name || '',
        contact_phone: data.contact_phone || '',
        contact_email: data.contact_email || '',
        notes: data.notes || '',
        status: data.status,
        created_at: data.created_at,
      };

      const existing = getLocal<Prospect[]>(STORAGE_KEYS.PROSPECTS, []);
      setLocal(STORAGE_KEYS.PROSPECTS, [created, ...existing]);
      return created;
    }

    const current = getLocal<Prospect[]>(STORAGE_KEYS.PROSPECTS, []);
    setLocal(STORAGE_KEYS.PROSPECTS, [prospect, ...current]);
    return prospect;
  }

  static async updateProspect(prospect: Prospect): Promise<Prospect> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('prospects')
        .update({
          business_name: prospect.business_name,
          contact_name: prospect.contact_name || null,
          contact_phone: prospect.contact_phone || null,
          contact_email: prospect.contact_email || null,
          notes: prospect.notes || null,
          status: prospect.status,
        })
        .eq('id', prospect.id)
        .select()
        .single();

      if (error) {
        throw new Error(`Supabase error updating prospect: ${error.message}`);
      }

      const updated: Prospect = {
        id: data.id,
        business_name: data.business_name,
        contact_name: data.contact_name || '',
        contact_phone: data.contact_phone || '',
        contact_email: data.contact_email || '',
        notes: data.notes || '',
        status: data.status,
        created_at: data.created_at,
      };

      const current = getLocal<Prospect[]>(STORAGE_KEYS.PROSPECTS, []);
      setLocal(
        STORAGE_KEYS.PROSPECTS,
        current.map(p => (p.id === prospect.id ? updated : p))
      );
      return updated;
    }

    const current = getLocal<Prospect[]>(STORAGE_KEYS.PROSPECTS, []);
    setLocal(
      STORAGE_KEYS.PROSPECTS,
      current.map(p => (p.id === prospect.id ? prospect : p))
    );
    return prospect;
  }

  static async deleteProspect(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('prospects').delete().eq('id', id);
      if (error) {
        throw new Error(`Supabase error deleting prospect: ${error.message}`);
      }
    }

    const current = getLocal<Prospect[]>(STORAGE_KEYS.PROSPECTS, []);
    setLocal(
      STORAGE_KEYS.PROSPECTS,
      current.filter(p => p.id !== id)
    );
  }

  // ================= CATEGORIES / PRODUCTS =================
  static async getCategories(): Promise<Category[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('categories').select('*').order('name');
        if (error) {
          console.warn('Supabase categories fetch notice:', error.message);
          return getLocal<Category[]>(STORAGE_KEYS.CATEGORIES, []);
        }
        const loaded: Category[] = (data || []).map((c: any) => ({
          id: c.id,
          name: c.name,
          icon: c.icon || 'tag',
          description: c.description || '',
          default_amount: c.default_amount != null ? Number(c.default_amount) : undefined,
          cost_amount: c.cost_amount != null ? Number(c.cost_amount) : 0,
        }));
        setLocal(STORAGE_KEYS.CATEGORIES, loaded);
        return loaded;
      } catch (err) {
        console.warn('Supabase categories exception:', err);
        return getLocal<Category[]>(STORAGE_KEYS.CATEGORIES, []);
      }
    }

    return getLocal<Category[]>(STORAGE_KEYS.CATEGORIES, []);
  }

  static async createCategory(category: Category): Promise<Category> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('categories')
        .insert({
          id: category.id,
          name: category.name,
          icon: category.icon,
          description: category.description || null,
          default_amount: category.default_amount ?? null,
          cost_amount: category.cost_amount ?? 0,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Supabase error creating category: ${error.message}`);
      }

      const created: Category = {
        id: data.id,
        name: data.name,
        icon: data.icon,
        description: data.description || '',
        default_amount: data.default_amount != null ? Number(data.default_amount) : undefined,
        cost_amount: data.cost_amount != null ? Number(data.cost_amount) : 0,
      };

      const existing = getLocal<Category[]>(STORAGE_KEYS.CATEGORIES, []);
      setLocal(STORAGE_KEYS.CATEGORIES, [...existing, created]);
      return created;
    }

    const existing = getLocal<Category[]>(STORAGE_KEYS.CATEGORIES, []);
    setLocal(STORAGE_KEYS.CATEGORIES, [...existing, category]);
    return category;
  }

  static async updateCategory(category: Category): Promise<Category> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('categories')
        .update({
          name: category.name,
          icon: category.icon,
          description: category.description || null,
          default_amount: category.default_amount ?? null,
          cost_amount: category.cost_amount ?? 0,
        })
        .eq('id', category.id)
        .select()
        .single();

      if (error) {
        throw new Error(`Supabase error updating category: ${error.message}`);
      }

      const updated: Category = {
        id: data.id,
        name: data.name,
        icon: data.icon,
        description: data.description || '',
        default_amount: data.default_amount != null ? Number(data.default_amount) : undefined,
        cost_amount: data.cost_amount != null ? Number(data.cost_amount) : 0,
      };

      const existing = getLocal<Category[]>(STORAGE_KEYS.CATEGORIES, []);
      setLocal(
        STORAGE_KEYS.CATEGORIES,
        existing.map(c => (c.id === category.id ? updated : c))
      );
      return updated;
    }

    const existing = getLocal<Category[]>(STORAGE_KEYS.CATEGORIES, []);
    setLocal(
      STORAGE_KEYS.CATEGORIES,
      existing.map(c => (c.id === category.id ? category : c))
    );
    return category;
  }

  static async deleteCategory(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) {
        throw new Error(`Supabase error deleting category: ${error.message}`);
      }
    }

    const existing = getLocal<Category[]>(STORAGE_KEYS.CATEGORIES, []);
    setLocal(
      STORAGE_KEYS.CATEGORIES,
      existing.filter(c => c.id !== id)
    );
  }

  // ================= INVENTORY ITEMS =================
  static async getInventoryItems(): Promise<InventoryItem[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('inventory_items')
          .select('*')
          .order('item_name');

        if (error) {
          console.warn('Supabase inventory fetch notice:', error.message);
          return getLocal<InventoryItem[]>(STORAGE_KEYS.INVENTORY, []);
        }

        const items: InventoryItem[] = (data || []).map((row: any) => ({
          id: row.id,
          category_id: row.category_id || null,
          item_name: row.item_name || '',
          quantity_on_hand: Number(row.quantity_on_hand) || 0,
          reorder_threshold: Number(row.reorder_threshold) || 5,
          notes: row.notes || '',
          updated_at: row.updated_at || new Date().toISOString(),
        }));

        setLocal(STORAGE_KEYS.INVENTORY, items);
        return items;
      } catch (err) {
        console.warn('Supabase inventory exception:', err);
        return getLocal<InventoryItem[]>(STORAGE_KEYS.INVENTORY, []);
      }
    }

    return getLocal<InventoryItem[]>(STORAGE_KEYS.INVENTORY, []);
  }

  static async createInventoryItem(item: Omit<InventoryItem, 'id' | 'updated_at'>): Promise<InventoryItem> {
    const id = crypto.randomUUID();
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('inventory_items')
        .insert({
          id,
          item_name: item.item_name,
          category_id: item.category_id || null,
          quantity_on_hand: item.quantity_on_hand ?? 0,
          reorder_threshold: item.reorder_threshold ?? 5,
          notes: item.notes || null,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Supabase error creating inventory item: ${error.message}`);
      }

      const created: InventoryItem = {
        id: data.id,
        category_id: data.category_id,
        item_name: data.item_name,
        quantity_on_hand: Number(data.quantity_on_hand) || 0,
        reorder_threshold: Number(data.reorder_threshold) || 5,
        notes: data.notes || '',
        updated_at: data.updated_at,
      };

      const existing = getLocal<InventoryItem[]>(STORAGE_KEYS.INVENTORY, []);
      setLocal(STORAGE_KEYS.INVENTORY, [created, ...existing]);
      return created;
    }

    const newItem: InventoryItem = {
      ...item,
      id,
      updated_at: new Date().toISOString(),
    };
    const existing = getLocal<InventoryItem[]>(STORAGE_KEYS.INVENTORY, []);
    setLocal(STORAGE_KEYS.INVENTORY, [newItem, ...existing]);
    return newItem;
  }

  static async updateInventoryItem(item: InventoryItem): Promise<InventoryItem> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('inventory_items')
        .update({
          item_name: item.item_name,
          category_id: item.category_id || null,
          quantity_on_hand: item.quantity_on_hand,
          reorder_threshold: item.reorder_threshold,
          notes: item.notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.id)
        .select()
        .single();

      if (error) {
        throw new Error(`Supabase error updating inventory: ${error.message}`);
      }

      const updated: InventoryItem = {
        id: data.id,
        category_id: data.category_id,
        item_name: data.item_name,
        quantity_on_hand: Number(data.quantity_on_hand) || 0,
        reorder_threshold: Number(data.reorder_threshold) || 5,
        notes: data.notes || '',
        updated_at: data.updated_at,
      };

      const existing = getLocal<InventoryItem[]>(STORAGE_KEYS.INVENTORY, []);
      setLocal(
        STORAGE_KEYS.INVENTORY,
        existing.map(i => (i.id === item.id ? updated : i))
      );
      return updated;
    }

    const existing = getLocal<InventoryItem[]>(STORAGE_KEYS.INVENTORY, []);
    setLocal(
      STORAGE_KEYS.INVENTORY,
      existing.map(i => (i.id === item.id ? item : i))
    );
    return item;
  }

  static async deleteInventoryItem(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('inventory_items').delete().eq('id', id);
      if (error) {
        throw new Error(`Supabase error deleting inventory item: ${error.message}`);
      }
    }

    const existing = getLocal<InventoryItem[]>(STORAGE_KEYS.INVENTORY, []);
    setLocal(
      STORAGE_KEYS.INVENTORY,
      existing.filter(i => i.id !== id)
    );
  }

  // ================= TASKS =================
  static async getTasks(): Promise<TaskItem[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('Supabase tasks fetch notice:', error.message);
          return getLocal<TaskItem[]>(STORAGE_KEYS.TASKS, []);
        }

        const tasks: TaskItem[] = (data || []).map((row: any) => ({
          id: row.id,
          client_id: row.client_id || null,
          task_type: (row.task_type as TaskType) || 'other',
          description: row.description || '',
          due_date: row.due_date || null,
          status: (row.status as TaskStatus) || 'open',
          created_at: row.created_at || new Date().toISOString(),
        }));

        setLocal(STORAGE_KEYS.TASKS, tasks);
        return tasks;
      } catch (err) {
        console.warn('Supabase tasks exception:', err);
        return getLocal<TaskItem[]>(STORAGE_KEYS.TASKS, []);
      }
    }

    return getLocal<TaskItem[]>(STORAGE_KEYS.TASKS, []);
  }

  static async createTask(task: Omit<TaskItem, 'id' | 'created_at' | 'status'>): Promise<TaskItem> {
    const id = crypto.randomUUID();
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          id,
          client_id: task.client_id || null,
          task_type: task.task_type,
          description: task.description,
          due_date: task.due_date || null,
          status: 'open',
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Supabase error creating task: ${error.message}`);
      }

      const created: TaskItem = {
        id: data.id,
        client_id: data.client_id,
        task_type: data.task_type,
        description: data.description,
        due_date: data.due_date,
        status: data.status,
        created_at: data.created_at,
      };

      const existing = getLocal<TaskItem[]>(STORAGE_KEYS.TASKS, []);
      setLocal(STORAGE_KEYS.TASKS, [created, ...existing]);
      return created;
    }

    const newTask: TaskItem = {
      ...task,
      id,
      status: 'open',
      created_at: new Date().toISOString(),
    };
    const existing = getLocal<TaskItem[]>(STORAGE_KEYS.TASKS, []);
    setLocal(STORAGE_KEYS.TASKS, [newTask, ...existing]);
    return newTask;
  }

  static async updateTaskStatus(id: string, status: TaskStatus): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('tasks').update({ status }).eq('id', id);
      if (error) {
        throw new Error(`Supabase error updating task: ${error.message}`);
      }
    }

    const existing = getLocal<TaskItem[]>(STORAGE_KEYS.TASKS, []);
    setLocal(
      STORAGE_KEYS.TASKS,
      existing.map(t => (t.id === id ? { ...t, status } : t))
    );
  }

  static async deleteTask(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) {
        throw new Error(`Supabase error deleting task: ${error.message}`);
      }
    }

    const existing = getLocal<TaskItem[]>(STORAGE_KEYS.TASKS, []);
    setLocal(
      STORAGE_KEYS.TASKS,
      existing.filter(t => t.id !== id)
    );
  }

  // ================= SALES SCRIPTS =================
  static async getScripts(): Promise<SalesScript[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('scripts')
          .select('*')
          .order('title');

        if (error) {
          console.warn('Supabase scripts fetch notice:', error.message);
          return getLocal<SalesScript[]>(STORAGE_KEYS.SCRIPTS, []);
        }

        const scripts: SalesScript[] = (data || []).map((row: any) => ({
          id: row.id,
          title: row.title || '',
          content: row.content || '',
          category_id: row.category_id || null,
          effectiveness: (row.effectiveness as ScriptEffectiveness) || 'testing',
          notes: row.notes || '',
          updated_at: row.updated_at || new Date().toISOString(),
        }));

        setLocal(STORAGE_KEYS.SCRIPTS, scripts);
        return scripts;
      } catch (err) {
        console.warn('Supabase scripts exception:', err);
        return getLocal<SalesScript[]>(STORAGE_KEYS.SCRIPTS, []);
      }
    }

    return getLocal<SalesScript[]>(STORAGE_KEYS.SCRIPTS, []);
  }

  static async createScript(script: Omit<SalesScript, 'id' | 'updated_at'>): Promise<SalesScript> {
    const id = crypto.randomUUID();
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('scripts')
        .insert({
          id,
          title: script.title,
          content: script.content,
          category_id: script.category_id || null,
          effectiveness: script.effectiveness,
          notes: script.notes || null,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Supabase error creating script: ${error.message}`);
      }

      const created: SalesScript = {
        id: data.id,
        title: data.title,
        content: data.content,
        category_id: data.category_id,
        effectiveness: data.effectiveness,
        notes: data.notes || '',
        updated_at: data.updated_at,
      };

      const existing = getLocal<SalesScript[]>(STORAGE_KEYS.SCRIPTS, []);
      setLocal(STORAGE_KEYS.SCRIPTS, [created, ...existing]);
      return created;
    }

    const newScript: SalesScript = {
      ...script,
      id,
      updated_at: new Date().toISOString(),
    };
    const existing = getLocal<SalesScript[]>(STORAGE_KEYS.SCRIPTS, []);
    setLocal(STORAGE_KEYS.SCRIPTS, [newScript, ...existing]);
    return newScript;
  }

  static async updateScript(script: SalesScript): Promise<SalesScript> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('scripts')
        .update({
          title: script.title,
          content: script.content,
          category_id: script.category_id || null,
          effectiveness: script.effectiveness,
          notes: script.notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', script.id)
        .select()
        .single();

      if (error) {
        throw new Error(`Supabase error updating script: ${error.message}`);
      }

      const updated: SalesScript = {
        id: data.id,
        title: data.title,
        content: data.content,
        category_id: data.category_id,
        effectiveness: data.effectiveness,
        notes: data.notes || '',
        updated_at: data.updated_at,
      };

      const existing = getLocal<SalesScript[]>(STORAGE_KEYS.SCRIPTS, []);
      setLocal(
        STORAGE_KEYS.SCRIPTS,
        existing.map(s => (s.id === script.id ? updated : s))
      );
      return updated;
    }

    const existing = getLocal<SalesScript[]>(STORAGE_KEYS.SCRIPTS, []);
    setLocal(
      STORAGE_KEYS.SCRIPTS,
      existing.map(s => (s.id === script.id ? script : s))
    );
    return script;
  }

  static async deleteScript(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('scripts').delete().eq('id', id);
      if (error) {
        throw new Error(`Supabase error deleting script: ${error.message}`);
      }
    }

    const existing = getLocal<SalesScript[]>(STORAGE_KEYS.SCRIPTS, []);
    setLocal(
      STORAGE_KEYS.SCRIPTS,
      existing.filter(s => s.id !== id)
    );
  }

  // ================= EMPLOYEES =================
  static async getEmployees(): Promise<Employee[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('employees')
          .select('*')
          .order('name');

        if (error) {
          console.warn('Supabase employees fetch notice:', error.message);
          return getLocal<Employee[]>(STORAGE_KEYS.EMPLOYEES, []);
        }

        const employees: Employee[] = (data || []).map((row: any) => ({
          id: row.id,
          name: row.name || '',
          role: row.role || '',
          contact_phone: row.contact_phone || '',
          contact_email: row.contact_email || '',
          notes: row.notes || '',
          created_at: row.created_at || new Date().toISOString(),
        }));

        setLocal(STORAGE_KEYS.EMPLOYEES, employees);
        return employees;
      } catch (err) {
        console.warn('Supabase employees exception:', err);
        return getLocal<Employee[]>(STORAGE_KEYS.EMPLOYEES, []);
      }
    }

    return getLocal<Employee[]>(STORAGE_KEYS.EMPLOYEES, []);
  }

  static async createEmployee(emp: Omit<Employee, 'id' | 'created_at'>): Promise<Employee> {
    const id = crypto.randomUUID();
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('employees')
        .insert({
          id,
          name: emp.name,
          role: emp.role || null,
          contact_phone: emp.contact_phone || null,
          contact_email: emp.contact_email || null,
          notes: emp.notes || null,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Supabase error creating employee: ${error.message}`);
      }

      const created: Employee = {
        id: data.id,
        name: data.name,
        role: data.role || '',
        contact_phone: data.contact_phone || '',
        contact_email: data.contact_email || '',
        notes: data.notes || '',
        created_at: data.created_at,
      };

      const existing = getLocal<Employee[]>(STORAGE_KEYS.EMPLOYEES, []);
      setLocal(STORAGE_KEYS.EMPLOYEES, [created, ...existing]);
      return created;
    }

    const created: Employee = {
      ...emp,
      id,
      created_at: new Date().toISOString(),
    };
    const existing = getLocal<Employee[]>(STORAGE_KEYS.EMPLOYEES, []);
    setLocal(STORAGE_KEYS.EMPLOYEES, [created, ...existing]);
    return created;
  }

  static async updateEmployee(emp: Employee): Promise<Employee> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('employees')
        .update({
          name: emp.name,
          role: emp.role || null,
          contact_phone: emp.contact_phone || null,
          contact_email: emp.contact_email || null,
          notes: emp.notes || null,
        })
        .eq('id', emp.id)
        .select()
        .single();

      if (error) {
        throw new Error(`Supabase error updating employee: ${error.message}`);
      }

      const updated: Employee = {
        id: data.id,
        name: data.name,
        role: data.role || '',
        contact_phone: data.contact_phone || '',
        contact_email: data.contact_email || '',
        notes: data.notes || '',
        created_at: data.created_at,
      };

      const existing = getLocal<Employee[]>(STORAGE_KEYS.EMPLOYEES, []);
      setLocal(
        STORAGE_KEYS.EMPLOYEES,
        existing.map(e => (e.id === emp.id ? updated : e))
      );
      return updated;
    }

    const existing = getLocal<Employee[]>(STORAGE_KEYS.EMPLOYEES, []);
    setLocal(
      STORAGE_KEYS.EMPLOYEES,
      existing.map(e => (e.id === emp.id ? emp : e))
    );
    return emp;
  }

  static async deleteEmployee(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('employees').delete().eq('id', id);
      if (error) {
        throw new Error(`Supabase error deleting employee: ${error.message}`);
      }
    }

    const existing = getLocal<Employee[]>(STORAGE_KEYS.EMPLOYEES, []);
    setLocal(
      STORAGE_KEYS.EMPLOYEES,
      existing.filter(e => e.id !== id)
    );
  }

  // ================= NOTES (AI Memory & User Action Items) =================
  static async getNotes(): Promise<NoteItem[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('notes')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          const notes: NoteItem[] = data.map((row: any) => ({
            id: row.id,
            title: row.title || '',
            content: row.content || '',
            tags: row.tags || [],
            is_pinned: Boolean(row.is_pinned),
            created_at: row.created_at || new Date().toISOString(),
            updated_at: row.updated_at || new Date().toISOString(),
          }));
          setLocal(STORAGE_KEYS.NOTES, notes);
          return notes;
        }
      } catch {
        // Fall through to local fallback
      }
    }

    return getLocal<NoteItem[]>(STORAGE_KEYS.NOTES, []);
  }

  static async createNote(note: Omit<NoteItem, 'id' | 'created_at' | 'updated_at'>): Promise<NoteItem> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const newNote: NoteItem = {
      ...note,
      id,
      title: note.title || 'Untitled Note',
      tags: note.tags || [],
      is_pinned: note.is_pinned || false,
      created_at: now,
      updated_at: now,
    };

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('notes').insert({
          id,
          title: newNote.title,
          content: newNote.content,
          tags: newNote.tags,
          is_pinned: newNote.is_pinned,
        });
      } catch {
        // Cached locally
      }
    }

    const existing = getLocal<NoteItem[]>(STORAGE_KEYS.NOTES, []);
    setLocal(STORAGE_KEYS.NOTES, [newNote, ...existing]);
    return newNote;
  }

  static async updateNote(note: NoteItem): Promise<NoteItem> {
    const updated = { ...note, updated_at: new Date().toISOString() };
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('notes')
          .update({
            title: updated.title,
            content: updated.content,
            tags: updated.tags,
            is_pinned: updated.is_pinned,
            updated_at: updated.updated_at,
          })
          .eq('id', updated.id);
      } catch {
        // Cached locally
      }
    }

    const existing = getLocal<NoteItem[]>(STORAGE_KEYS.NOTES, []);
    setLocal(
      STORAGE_KEYS.NOTES,
      existing.map(n => (n.id === updated.id ? updated : n))
    );
    return updated;
  }

  static async deleteNote(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('notes').delete().eq('id', id);
      } catch {
        // Deleted locally
      }
    }

    const existing = getLocal<NoteItem[]>(STORAGE_KEYS.NOTES, []);
    setLocal(
      STORAGE_KEYS.NOTES,
      existing.filter(n => n.id !== id)
    );
  }

  // ================= DASHBOARD CONFIG =================
  static async getDashboardConfig(): Promise<DashboardConfig> {
    const defaults: DashboardConfig = {
      showRevenueChart: true,
      showProfitChart: true,
      showTopSellers: true,
      showTopClients: true,
      showCalendar: true,
      showQuickStats: true,
      showPendingTasks: true,
      showInventoryAlerts: true,
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('dashboard_config')
          .select('config')
          .eq('id', 1)
          .single();

        if (!error && data && data.config) {
          const merged = { ...defaults, ...data.config };
          setLocal(STORAGE_KEYS.DASHBOARD_CONFIG, merged);
          return merged;
        }
      } catch {
        // Fallback to local
      }
    }

    return getLocal<DashboardConfig>(STORAGE_KEYS.DASHBOARD_CONFIG, defaults);
  }

  static async saveDashboardConfig(config: DashboardConfig): Promise<void> {
    setLocal(STORAGE_KEYS.DASHBOARD_CONFIG, config);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('dashboard_config')
          .upsert({
            id: 1,
            config,
          });
      } catch (err) {
        console.error('Error saving dashboard config to Supabase:', err);
      }
    }
  }

  // ================= PRICING RULES & BUNDLES =================
  static async getPricingRules(): Promise<PricingRules> {
    return getLocal<PricingRules>(STORAGE_KEYS.PRICING_RULES, DEFAULT_PRICING_RULES);
  }

  static async savePricingRules(rules: PricingRules): Promise<void> {
    setLocal(STORAGE_KEYS.PRICING_RULES, rules);
  }

  static async getBundles(): Promise<PresetBundle[]> {
    return getLocal<PresetBundle[]>(STORAGE_KEYS.BUNDLES, DEFAULT_PRESET_BUNDLES);
  }

  static async saveBundles(bundles: PresetBundle[]): Promise<void> {
    setLocal(STORAGE_KEYS.BUNDLES, bundles);
  }

  // ================= BACKUP & EXPORT =================
  static async exportFullBackupJSON(): Promise<string> {
    const [
      clients,
      orders,
      prospects,
      categories,
      inventory,
      tasks,
      scripts,
      employees,
      notes,
      dashboardConfig,
      pricingRules,
      bundles,
    ] = await Promise.all([
      this.getClients(),
      this.getOrders(),
      this.getProspects(),
      this.getCategories(),
      this.getInventoryItems(),
      this.getTasks(),
      this.getScripts(),
      this.getEmployees(),
      this.getNotes(),
      this.getDashboardConfig(),
      this.getPricingRules(),
      this.getBundles(),
    ]);

    return JSON.stringify(
      {
        exported_at: new Date().toISOString(),
        clients,
        orders,
        prospects,
        categories,
        inventory,
        tasks,
        scripts,
        employees,
        notes,
        dashboardConfig,
        pricingRules,
        bundles,
      },
      null,
      2
    );
  }

  static async importFullBackupJSON(jsonString: string): Promise<boolean> {
    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed.clients)) {
        for (const c of parsed.clients) {
          await this.createClient(c).catch(() => {});
        }
      }
      if (Array.isArray(parsed.orders)) {
        for (const o of parsed.orders) {
          await this.createOrder(o).catch(() => {});
        }
      }
      if (Array.isArray(parsed.prospects)) {
        for (const p of parsed.prospects) {
          await this.createProspect(p).catch(() => {});
        }
      }
      if (Array.isArray(parsed.categories)) {
        for (const cat of parsed.categories) {
          await this.createCategory(cat).catch(() => {});
        }
      }
      if (Array.isArray(parsed.inventory)) {
        for (const inv of parsed.inventory) {
          await this.createInventoryItem(inv).catch(() => {});
        }
      }
      if (Array.isArray(parsed.tasks)) {
        for (const t of parsed.tasks) {
          await this.createTask(t).catch(() => {});
        }
      }
      if (Array.isArray(parsed.scripts)) {
        for (const s of parsed.scripts) {
          await this.createScript(s).catch(() => {});
        }
      }
      if (Array.isArray(parsed.employees)) {
        for (const e of parsed.employees) {
          await this.createEmployee(e).catch(() => {});
        }
      }
      if (Array.isArray(parsed.notes)) {
        for (const n of parsed.notes) {
          await this.createNote(n).catch(() => {});
        }
      }
      if (parsed.dashboardConfig) {
        await this.saveDashboardConfig(parsed.dashboardConfig);
      }
      if (parsed.pricingRules) {
        await this.savePricingRules(parsed.pricingRules);
      }
      if (Array.isArray(parsed.bundles)) {
        await this.saveBundles(parsed.bundles);
      }
      return true;
    } catch {
      return false;
    }
  }
}
