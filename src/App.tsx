import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  ProspectStatus,
  TaskStatus,
} from './types/index';
import { DataRepository } from './lib/storage';
import {
  DEFAULT_PRICING_RULES,
  DEFAULT_PRESET_BUNDLES,
  convertProspectToClient,
} from './lib/calculations';
import { LockScreen } from './components/LockScreen';
import { Navbar, AppSection, GeneralSubTab } from './components/Navbar';
import { DashboardCharts } from './components/general/DashboardCharts';
import { MonthCalendar } from './components/general/MonthCalendar';
import { ClientsTable } from './components/ClientsTable';
import { ClientDetailView } from './components/ClientDetailView';
import { ProspectsTable } from './components/ProspectsTable';
import { TasksTracker } from './components/general/TasksTracker';
import { ScriptsTracker } from './components/general/ScriptsTracker';
import { TeamDirectory } from './components/general/TeamDirectory';
import { NotesMemoryView } from './components/general/NotesMemoryView';
import { AIAssistantDrawer } from './components/general/AIAssistantDrawer';
import { GlobalSearchModal } from './components/general/GlobalSearchModal';
import { AdminView } from './components/admin/AdminView';
import { AddClientForm } from './components/AddClientForm';
import { AddProspectForm } from './components/AddProspectForm';
import { NamayWelcomeBanner } from './components/general/NamayWelcomeBanner';

export default function App() {
  // Theme state: default dark mode
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('tracker_theme');
      if (stored) return stored === 'dark';
      return true; // Default dark mode as requested
    }
    return true;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('tracker_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('tracker_theme', 'light');
    }
  }, [isDarkMode]);

  // 1. PASSWORD GATE STATE
  // Check localStorage for "tracker_unlocked". If not "true", render ONLY LockScreen.
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => DataRepository.isAppUnlocked());

  // Navigation State
  const [section, setSection] = useState<AppSection>('general');
  const [generalTab, setGeneralTab] = useState<GeneralSubTab>('dashboard');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  // Application Data State
  const [clients, setClients] = useState<Client[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [scripts, setScripts] = useState<SalesScript[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [dashboardConfig, setDashboardConfig] = useState<DashboardConfig>({
    showRevenueChart: true,
    showProfitChart: true,
    showTopSellers: true,
    showTopClients: true,
    showCalendar: true,
    showQuickStats: true,
    showPendingTasks: true,
    showInventoryAlerts: true,
  });
  const [pricingRules, setPricingRules] = useState<PricingRules>(DEFAULT_PRICING_RULES);
  const [presetBundles, setPresetBundles] = useState<PresetBundle[]>(DEFAULT_PRESET_BUNDLES);

  // UI state
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals & Panels
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [showAddProspectModal, setShowAddProspectModal] = useState(false);
  const [editingProspect, setEditingProspect] = useState<Prospect | null>(null);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showAiDrawer, setShowAiDrawer] = useState(false);

  // Load data ONLY after unlock
  const loadData = useCallback(async () => {
    if (!isUnlocked) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const [
        loadedClients,
        loadedOrders,
        loadedProspects,
        loadedCategories,
        loadedInventory,
        loadedTasks,
        loadedScripts,
        loadedEmployees,
        loadedNotes,
        loadedDashConfig,
        loadedRules,
        loadedBundles,
      ] = await Promise.all([
        DataRepository.getClients(),
        DataRepository.getOrders(),
        DataRepository.getProspects(),
        DataRepository.getCategories(),
        DataRepository.getInventoryItems(),
        DataRepository.getTasks(),
        DataRepository.getScripts(),
        DataRepository.getEmployees(),
        DataRepository.getNotes(),
        DataRepository.getDashboardConfig(),
        DataRepository.getPricingRules(),
        DataRepository.getBundles(),
      ]);

      setClients(loadedClients);
      setOrders(loadedOrders);
      setProspects(loadedProspects);
      setCategories(loadedCategories);
      setInventoryItems(loadedInventory);
      setTasks(loadedTasks);
      setScripts(loadedScripts);
      setEmployees(loadedEmployees);
      setNotes(loadedNotes);
      setDashboardConfig(loadedDashConfig);
      setPricingRules(loadedRules);
      setPresetBundles(loadedBundles);
    } catch (err: any) {
      console.error('Data loading error:', err);
      setErrorMessage(err.message || 'Database error occurred');
    } finally {
      setLoading(false);
    }
  }, [isUnlocked]);

  useEffect(() => {
    if (isUnlocked) {
      loadData();
    }
  }, [isUnlocked, loadData]);

  // Lock session handler
  const handleLockSession = () => {
    DataRepository.setAppUnlocked(false);
    setIsUnlocked(false);
  };

  // If locked, render ONLY the lock screen
  if (!isUnlocked) {
    return (
      <LockScreen
        onUnlock={() => {
          setIsUnlocked(true);
        }}
      />
    );
  }

  // ================= CLIENT HANDLERS =================
  const handleAddClient = async (
    clientData: Omit<Client, 'id' | 'created_at'>,
    initialOrder?: { item_type: string; amount: number; notes: string }
  ) => {
    setErrorMessage(null);
    try {
      const newClientId = crypto.randomUUID();
      const newClient: Client = {
        ...clientData,
        id: newClientId,
        created_at: new Date().toISOString(),
      };

      const createdClient = await DataRepository.createClient(newClient);
      setClients(prev => [createdClient, ...prev]);

      if (initialOrder) {
        const newOrder: Order = {
          id: crypto.randomUUID(),
          client_id: newClientId,
          item_type: initialOrder.item_type,
          amount: initialOrder.amount,
          order_date: new Date().toISOString().split('T')[0],
          notes: initialOrder.notes,
          created_at: new Date().toISOString(),
        };
        const createdOrder = await DataRepository.createOrder(newOrder);
        setOrders(prev => [createdOrder, ...prev]);
      }

      setShowAddClientModal(false);
      setSelectedClientId(newClientId);
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const handleUpdateClient = async (updatedClient: Client) => {
    setErrorMessage(null);
    try {
      const saved = await DataRepository.updateClient(updatedClient);
      setClients(prev => prev.map(c => (c.id === saved.id ? saved : c)));
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const handleDeleteClient = async (clientId: string, clientName: string) => {
    if (confirm(`Delete client "${clientName}" and all associated orders?`)) {
      setErrorMessage(null);
      try {
        await DataRepository.deleteClient(clientId);
        setClients(prev => prev.filter(c => c.id !== clientId));
        setOrders(prev => prev.filter(o => o.client_id !== clientId));
        if (selectedClientId === clientId) {
          setSelectedClientId(null);
        }
      } catch (err: any) {
        setErrorMessage(err.message);
      }
    }
  };

  // ================= ORDER HANDLERS =================
  const handleAddOrder = async (orderData: Omit<Order, 'id' | 'created_at'>) => {
    setErrorMessage(null);
    try {
      const newOrder: Order = {
        ...orderData,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      };

      const created = await DataRepository.createOrder(newOrder);
      setOrders(prev => [created, ...prev]);

      // Sync client tags if applicable
      const targetClient = clients.find(c => c.id === orderData.client_id);
      if (targetClient) {
        let needsUpdate = false;
        const updatedClient = { ...targetClient };
        const labelLower = orderData.item_type.toLowerCase();

        if (labelLower.includes('website') && !updatedClient.bought_website) {
          updatedClient.bought_website = true;
          needsUpdate = true;
        }
        if ((labelLower.includes('nfc') || labelLower.includes('accessory')) && !updatedClient.bought_accessory) {
          updatedClient.bought_accessory = true;
          needsUpdate = true;
        }
        if (needsUpdate) {
          await handleUpdateClient(updatedClient);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    setErrorMessage(null);
    try {
      await DataRepository.deleteOrder(orderId);
      setOrders(prev => prev.filter(o => o.id !== orderId));
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  // ================= PROSPECT HANDLERS =================
  const handleAddProspect = async (prospectData: Omit<Prospect, 'id' | 'created_at'>) => {
    setErrorMessage(null);
    try {
      const newProspect: Prospect = {
        ...prospectData,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      };
      const created = await DataRepository.createProspect(newProspect);
      setProspects(prev => [created, ...prev]);
      setShowAddProspectModal(false);
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const handleUpdateProspect = async (prospectData: Omit<Prospect, 'id' | 'created_at'>) => {
    if (!editingProspect) return;
    setErrorMessage(null);
    try {
      const updated = { ...editingProspect, ...prospectData };
      const saved = await DataRepository.updateProspect(updated);
      setProspects(prev => prev.map(p => (p.id === saved.id ? saved : p)));
      setEditingProspect(null);
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const handleUpdateProspectStatus = async (prospectId: string, newStatus: ProspectStatus) => {
    setErrorMessage(null);
    try {
      const target = prospects.find(p => p.id === prospectId);
      if (!target) return;
      const updated = { ...target, status: newStatus };
      const saved = await DataRepository.updateProspect(updated);
      setProspects(prev => prev.map(p => (p.id === saved.id ? saved : p)));
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const handleDeleteProspect = async (prospectId: string, name: string) => {
    if (confirm(`Delete prospect "${name}"?`)) {
      setErrorMessage(null);
      try {
        await DataRepository.deleteProspect(prospectId);
        setProspects(prev => prev.filter(p => p.id !== prospectId));
      } catch (err: any) {
        setErrorMessage(err.message);
      }
    }
  };

  const handleConvertToClient = async (prospect: Prospect) => {
    setErrorMessage(null);
    try {
      const convertedClient = convertProspectToClient(prospect);
      const createdClient = await DataRepository.createClient(convertedClient);
      await DataRepository.deleteProspect(prospect.id);

      setClients(prev => [createdClient, ...prev]);
      setProspects(prev => prev.filter(p => p.id !== prospect.id));

      setSection('general');
      setGeneralTab('clients');
      setSelectedClientId(createdClient.id);
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  // ================= ADMIN & CONFIG HANDLERS =================
  const handleSaveCategory = async (cat: Category) => {
    const existing = categories.find(c => c.id === cat.id);
    if (existing) {
      const updated = await DataRepository.updateCategory(cat);
      setCategories(prev => prev.map(c => (c.id === updated.id ? updated : c)));
    } else {
      const created = await DataRepository.createCategory(cat);
      setCategories(prev => [...prev, created]);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    await DataRepository.deleteCategory(id);
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  const handleSaveInventoryItem = async (
    item: InventoryItem | Omit<InventoryItem, 'id' | 'updated_at'>
  ) => {
    if ('id' in item) {
      const updated = await DataRepository.updateInventoryItem(item as InventoryItem);
      setInventoryItems(prev => prev.map(i => (i.id === updated.id ? updated : i)));
    } else {
      const created = await DataRepository.createInventoryItem(item);
      setInventoryItems(prev => [created, ...prev]);
    }
  };

  const handleDeleteInventoryItem = async (id: string) => {
    await DataRepository.deleteInventoryItem(id);
    setInventoryItems(prev => prev.filter(i => i.id !== id));
  };

  const handleSaveDashboardConfig = async (cfg: DashboardConfig) => {
    setDashboardConfig(cfg);
    await DataRepository.saveDashboardConfig(cfg);
  };

  const handleSavePricingRules = async (rules: PricingRules) => {
    setPricingRules(rules);
    await DataRepository.savePricingRules(rules);
  };

  const handleSaveBundles = async (bundles: PresetBundle[]) => {
    setPresetBundles(bundles);
    await DataRepository.saveBundles(bundles);
  };

  // ================= TASK HANDLERS =================
  const handleCreateTask = async (task: Omit<TaskItem, 'id' | 'created_at' | 'status'>) => {
    const created = await DataRepository.createTask(task);
    setTasks(prev => [created, ...prev]);
  };

  const handleToggleTaskStatus = async (id: string, newStatus: TaskStatus) => {
    await DataRepository.updateTaskStatus(id, newStatus);
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, status: newStatus } : t)));
  };

  const handleDeleteTask = async (id: string) => {
    await DataRepository.deleteTask(id);
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  // ================= SCRIPT HANDLERS =================
  const handleCreateScript = async (script: Omit<SalesScript, 'id' | 'updated_at'>) => {
    const created = await DataRepository.createScript(script);
    setScripts(prev => [created, ...prev]);
  };

  const handleUpdateScript = async (script: SalesScript) => {
    const updated = await DataRepository.updateScript(script);
    setScripts(prev => prev.map(s => (s.id === updated.id ? updated : s)));
  };

  const handleDeleteScript = async (id: string) => {
    await DataRepository.deleteScript(id);
    setScripts(prev => prev.filter(s => s.id !== id));
  };

  // ================= EMPLOYEE HANDLERS =================
  const handleCreateEmployee = async (emp: Omit<Employee, 'id' | 'created_at'>) => {
    const created = await DataRepository.createEmployee(emp);
    setEmployees(prev => [created, ...prev]);
  };

  const handleUpdateEmployee = async (emp: Employee) => {
    const updated = await DataRepository.updateEmployee(emp);
    setEmployees(prev => prev.map(e => (e.id === updated.id ? updated : e)));
  };

  const handleDeleteEmployee = async (id: string) => {
    await DataRepository.deleteEmployee(id);
    setEmployees(prev => prev.filter(e => e.id !== id));
  };

  // ================= NOTE HANDLERS =================
  const handleCreateNote = async (note: Omit<NoteItem, 'id' | 'created_at' | 'updated_at'>) => {
    const created = await DataRepository.createNote(note);
    setNotes(prev => [created, ...prev]);
  };

  const handleUpdateNote = async (note: NoteItem) => {
    const updated = await DataRepository.updateNote(note);
    setNotes(prev => prev.map(n => (n.id === updated.id ? updated : n)));
  };

  const handleDeleteNote = async (id: string) => {
    await DataRepository.deleteNote(id);
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  // ================= BACKUP HANDLERS =================
  const handleExportBackup = async () => {
    const json = await DataRepository.exportFullBackupJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = async (jsonString: string) => {
    const success = await DataRepository.importFullBackupJSON(jsonString);
    if (success) {
      await loadData();
    }
    return success;
  };

  const selectedClient = clients.find(c => c.id === selectedClientId) || null;
  const openTasksCount = tasks.filter(t => t.status === 'open').length;
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.amount || 0), 0);
  const websiteCount = clients.filter(c => c.bought_website).length;
  const accessoryCount = clients.filter(c => c.bought_accessory).length;

  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 font-sans antialiased selection:bg-zinc-900 dark:selection:bg-zinc-700 selection:text-white transition-colors duration-200">
      {/* Navigation Header */}
      <Navbar
        section={section}
        onSectionChange={setSection}
        generalTab={generalTab}
        onGeneralTabChange={setGeneralTab}
        clientsCount={clients.length}
        prospectsCount={prospects.length}
        openTasksCount={openTasksCount}
        onOpenSearch={() => setShowSearchModal(true)}
        onOpenAiAssistant={() => setShowAiDrawer(true)}
        selectedClientId={selectedClientId}
        onClearSelectedClient={() => setSelectedClientId(null)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(prev => !prev)}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 py-5 sm:py-6">
        {/* Error notification banner */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-900 dark:text-red-200 text-xs sm:text-sm rounded-xl flex items-start justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Notice:</span>
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="font-mono text-red-600 dark:text-red-400 hover:text-red-800 text-xs px-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {loading ? (
          <div className="py-24 text-center text-zinc-400 dark:text-zinc-600 font-mono text-sm">
            Loading workspace...
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {section === 'admin' ? (
              <motion.div
                key="admin-section"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-6"
              >
                <AdminView
                  categories={categories}
                  inventoryItems={inventoryItems}
                  dashboardConfig={dashboardConfig}
                  pricingRules={pricingRules}
                  presetBundles={presetBundles}
                  onSaveCategory={handleSaveCategory}
                  onDeleteCategory={handleDeleteCategory}
                  onSaveInventoryItem={handleSaveInventoryItem}
                  onDeleteInventoryItem={handleDeleteInventoryItem}
                  onSaveDashboardConfig={handleSaveDashboardConfig}
                  onSavePricingRules={handleSavePricingRules}
                  onSaveBundles={handleSaveBundles}
                  onExportBackup={handleExportBackup}
                  onImportBackup={handleImportBackup}
                  onLockSession={handleLockSession}
                />
              </motion.div>
            ) : (
              <motion.div
                key={selectedClientId ? `client-${selectedClientId}` : `tab-${generalTab}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-6"
              >
                {/* 1. DASHBOARD */}
                {generalTab === 'dashboard' && (
                  <div className="space-y-6">
                    <NamayWelcomeBanner
                      totalRevenue={totalRevenue}
                      clientsCount={clients.length}
                      prospectsCount={prospects.length}
                      openTasksCount={openTasksCount}
                      websiteCount={websiteCount}
                      accessoryCount={accessoryCount}
                      onOpenAddClient={() => setShowAddClientModal(true)}
                      onOpenAddProspect={() => setShowAddProspectModal(true)}
                      onOpenAiAssistant={() => setShowAiDrawer(true)}
                      onNavigateToTab={(tab) => {
                        if (tab === 'admin') {
                          setSection('admin');
                        } else {
                          setGeneralTab(tab as GeneralSubTab);
                        }
                      }}
                    />

                    <DashboardCharts
                      orders={orders}
                      clients={clients}
                      categories={categories}
                      inventoryItems={inventoryItems}
                      tasks={tasks}
                      showRevenueChart={dashboardConfig.showRevenueChart !== false}
                      showProfitChart={dashboardConfig.showProfitChart !== false}
                      showTopSellers={dashboardConfig.showTopSellers !== false}
                      showTopClients={dashboardConfig.showTopClients !== false}
                      showQuickStats={dashboardConfig.showQuickStats !== false}
                      showInventoryAlerts={dashboardConfig.showInventoryAlerts !== false}
                      isDark={isDarkMode}
                      onNavigateToTab={tab => {
                        if (tab === 'admin') setSection('admin');
                      }}
                    />

                    {dashboardConfig.showCalendar !== false && (
                      <MonthCalendar
                        orders={orders}
                        tasks={tasks}
                        clients={clients}
                        onSelectClient={id => {
                          setSelectedClientId(id);
                          setGeneralTab('clients');
                        }}
                      />
                    )}
                  </div>
                )}

                {/* 2. CLIENTS */}
                {generalTab === 'clients' && (
                  <>
                    {selectedClient ? (
                      <ClientDetailView
                        client={selectedClient}
                        orders={orders}
                        categories={categories}
                        pricingRules={pricingRules}
                        presetBundles={presetBundles}
                        onBack={() => setSelectedClientId(null)}
                        onAddOrder={handleAddOrder}
                        onDeleteOrder={handleDeleteOrder}
                        onUpdateClient={handleUpdateClient}
                        onDeleteClient={handleDeleteClient}
                        onOpenPricingSettings={() => {
                          setSection('admin');
                        }}
                      />
                    ) : (
                      <ClientsTable
                        clients={clients}
                        orders={orders}
                        onSelectClient={id => setSelectedClientId(id)}
                        onOpenAddClient={() => setShowAddClientModal(true)}
                        onDeleteClient={handleDeleteClient}
                      />
                    )}
                  </>
                )}

                {/* 3. PROSPECTS */}
                {generalTab === 'prospects' && (
                  <ProspectsTable
                    prospects={prospects}
                    onOpenAddProspect={() => setShowAddProspectModal(true)}
                    onUpdateStatus={handleUpdateProspectStatus}
                    onConvertToClient={handleConvertToClient}
                    onDeleteProspect={handleDeleteProspect}
                    onEditProspect={prospect => setEditingProspect(prospect)}
                  />
                )}

                {/* 4. TASKS */}
                {generalTab === 'tasks' && (
                  <TasksTracker
                    tasks={tasks}
                    clients={clients}
                    inventoryItems={inventoryItems}
                    onCreateTask={handleCreateTask}
                    onToggleStatus={handleToggleTaskStatus}
                    onDeleteTask={handleDeleteTask}
                    onNavigateToAdmin={() => setSection('admin')}
                  />
                )}

                {/* 5. SCRIPTS */}
                {generalTab === 'scripts' && (
                  <ScriptsTracker
                    scripts={scripts}
                    categories={categories}
                    onCreateScript={handleCreateScript}
                    onUpdateScript={handleUpdateScript}
                    onDeleteScript={handleDeleteScript}
                  />
                )}

                {/* 6. TEAM */}
                {generalTab === 'team' && (
                  <TeamDirectory
                    employees={employees}
                    onCreateEmployee={handleCreateEmployee}
                    onUpdateEmployee={handleUpdateEmployee}
                    onDeleteEmployee={handleDeleteEmployee}
                  />
                )}

                {/* 7. NOTES & AI MEMORY */}
                {generalTab === 'notes' && (
                  <NotesMemoryView
                    notes={notes}
                    onCreateNote={handleCreateNote}
                    onUpdateNote={handleUpdateNote}
                    onDeleteNote={handleDeleteNote}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>

      {/* Global Modals & Drawers */}
      <GlobalSearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        clients={clients}
        prospects={prospects}
        employees={employees}
        scripts={scripts}
        notes={notes}
        onSelectClient={id => {
          setSection('general');
          setGeneralTab('clients');
          setSelectedClientId(id);
        }}
        onNavigateTab={tab => {
          setSection('general');
          setGeneralTab(tab as GeneralSubTab);
        }}
      />

      <AIAssistantDrawer
        isOpen={showAiDrawer}
        onClose={() => setShowAiDrawer(false)}
        clients={clients}
        orders={orders}
        tasks={tasks}
        inventoryItems={inventoryItems}
      />

      {showAddClientModal && (
        <AddClientForm
          categories={categories}
          pricingRules={pricingRules}
          presetBundles={presetBundles}
          onSave={handleAddClient}
          onCancel={() => setShowAddClientModal(false)}
        />
      )}

      {showAddProspectModal && (
        <AddProspectForm
          onSave={handleAddProspect}
          onCancel={() => setShowAddProspectModal(false)}
        />
      )}

      {editingProspect && (
        <AddProspectForm
          initialData={editingProspect}
          onSave={handleUpdateProspect}
          onCancel={() => setEditingProspect(null)}
        />
      )}
    </div>
  );
}
