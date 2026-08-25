import { useState, useEffect, useMemo } from "react";
import { 
  ToggleLeft, 
  RefreshCw, 
  AlertTriangle, 
  Plus, 
  Filter,
  Eye,
  Edit,
  Trash2,
  Pause,
  Play,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { BankZeroUploader } from "./components/BankZeroUploader";

// Define types for our data
type SubscriptionDirection = "IN" | "OUT";
type SubscriptionStatus = "active" | "paused" | "cancelled" | "pending" | "trial" | "expired";

interface Subscription {
  id: string;
  service_name: string;
  category: string;
  monthly_zar: number | null;
  monthly_usd: number | null;
  billing_cycle: string | null;
  status: SubscriptionStatus;
  renewal_date: string | null;
  payment_method: string | null;
  notes: string | null;
  tier: string | null;
  direction: SubscriptionDirection;
  email_tag: string | null;
  created_at: string;
  updated_at: string;
}

// Mock data for email ingestion tracker
const mockEmailIngestionData = [
  { id: "1", invoiceNumber: "INV-001", date: "2026-08-20", amount: 1250, status: "processed" },
  { id: "2", invoiceNumber: "INV-002", date: "2026-08-22", amount: 890, status: "detected" },
  { id: "3", invoiceNumber: "INV-003", date: "2026-08-24", amount: 2450, status: "processed" },
];

// Mock data for recent statements
const mockRecentStatements = [
  { id: "1", fileName: "bankzero_statement_2026-08.csv", date: "2026-08-24", transactions: 42, status: "processed" },
  { id: "2", fileName: "bankzero_statement_2026-08.csv", date: "2026-08-17", transactions: 38, status: "processed" },
  { id: "3", fileName: "bankzero_statement_2026-07.csv", date: "2026-07-20", transactions: 45, status: "processed" },
];

// Mock data for unlinked debits/credits
const mockUnlinkedTransactions = [
  { id: "1", date: "2026-08-24", description: "Amazon Web Services", amount: 125.50, type: "debit" },
  { id: "2", date: "2026-08-23", description: "Salary Deposit", amount: 15000.00, type: "credit" },
  { id: "3", date: "2026-08-22", description: "Netflix Subscription", amount: 149.99, type: "debit" },
];

export default function SubscriptionsPage() {
  const [rows, setRows] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "incoming" | "outgoing" | "active" | "paused" | "bankzero" | "email">("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [filter, setFilter] = useState<"all" | "incoming" | "outgoing" | "active" | "paused">("all");
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // Load subscriptions from database
  async function load() {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("hub_subscriptions")
      .select("*")
      .order("category", { ascending: true, nullsFirst: false })
      .order("service_name", { ascending: true });
    if (err) {
      setError(err.message);
    } else {
      setRows((data as Subscription[]) ?? []);
      setLastRefresh(new Date());
    }
    setLoading(false);
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      load();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Calculate key metrics
  const totals = useMemo(() => {
    const activeSubscriptions = rows.filter((r) => (r.status ?? "").toLowerCase() === "active");
    const monthlyOutflow = activeSubscriptions
      .filter(s => s.direction === "OUT")
      .reduce((sum, r) => sum + (r.monthly_zar || 0), 0);
    const monthlyInflow = activeSubscriptions
      .filter(s => s.direction === "IN")
      .reduce((sum, r) => sum + (r.monthly_zar || 0), 0);
    const netBalance = monthlyInflow - monthlyOutflow;
    const active = activeSubscriptions.length;
    const cancelled = rows.filter((r) => {
      const s = (r.status ?? "").toLowerCase();
      return s === "cancelled" || s === "canceled" || s === "expired";
    }).length;
    
    return { 
      monthlyOutflow, 
      monthlyInflow, 
      netBalance, 
      active, 
      cancelled, 
      count: rows.length 
    };
  }, [rows]);

  // Filter subscriptions based on active tab
  const filteredRows = useMemo(() => {
    let filtered = [...rows];
    
    switch (activeTab) {
      case "incoming":
        filtered = filtered.filter(s => s.direction === "IN");
        break;
      case "outgoing":
        filtered = filtered.filter(s => s.direction === "OUT");
        break;
      case "active":
        filtered = filtered.filter(s => s.status === "active");
        break;
      case "paused":
        filtered = filtered.filter(s => s.status === "paused");
        break;
      default:
        break;
    }
    
    return filtered;
  }, [rows, activeTab]);

  // Group subscriptions by category
  const grouped = useMemo(() => {
    const by = new Map<string, Subscription[]>();
    for (const r of filteredRows) {
      const k = r.category ?? "Uncategorised";
      const arr = by.get(k) ?? [];
      arr.push(r);
      by.set(k, arr);
    }
    return Array.from(by.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredRows]);

  // Toggle category expansion
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Format money with ZAR currency
  const fmtMoney = (n?: number | null, currency?: string | null): string => {
    if (n == null) return "—";
    const cur = (currency ?? "ZAR").toUpperCase();
    try {
      return new Intl.NumberFormat("en-ZA", {
        style: "currency",
        currency: cur,
        maximumFractionDigits: 0,
      }).format(n);
    } catch {
      return `${cur} ${n}`;
    }
  };

  // Format date
  const fmtDate = (iso?: string | null): string => {
    if (!iso) return "—";
    try {
      return format(new Date(iso), "dd MMM yy");
    } catch {
      return "—";
    }
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: SubscriptionStatus }) => {
    const statusClasses = {
      active: "bg-emerald-100 text-emerald-800 border-emerald-200",
      paused: "bg-cyan-100 text-cyan-800 border-cyan-200",
      cancelled: "bg-rose-100 text-rose-800 border-rose-200",
      pending: "bg-amber-100 text-amber-800 border-amber-200",
      trial: "bg-amber-100 text-amber-800 border-amber-200",
      expired: "bg-rose-100 text-rose-800 border-rose-200",
    };
    
    const statusText = {
      active: "Active",
      paused: "Paused",
      cancelled: "Cancelled",
      pending: "Pending",
      trial: "Trial",
      expired: "Expired",
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${statusClasses[status]}`}>
        {statusText[status]}
      </span>
    );
  };

  // Direction badge component
  const DirectionBadge = ({ direction }: { direction: SubscriptionDirection }) => {
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
        direction === "IN" 
          ? "bg-green-100 text-green-800 border-green-200" 
          : "bg-red-100 text-red-800 border-red-200"
      } border`}>
        {direction === "IN" ? "Income" : "Expense"}
      </span>
    );
  };

  // Action buttons for subscription row
  const ActionButtons = ({ subscription }: { subscription: Subscription }) => {
    return (
      <div className="flex items-center space-x-2">
        <button className="p-1 text-gray-500 hover:text-gray-700">
          <Eye className="h-4 w-4" />
        </button>
        <button className="p-1 text-gray-500 hover:text-gray-700">
          <Edit className="h-4 w-4" />
        </button>
        <button className="p-1 text-gray-500 hover:text-gray-700">
          <Trash2 className="h-4 w-4" />
        </button>
        {subscription.status === "active" ? (
          <button className="p-1 text-gray-500 hover:text-gray-700">
            <Pause className="h-4 w-4" />
          </button>
        ) : (
          <button className="p-1 text-gray-500 hover:text-gray-700">
            <Play className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-50">
            <ToggleLeft className="h-6 w-6 text-cyan-600" strokeWidth={1.5} />
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-bold tracking-wide text-gray-900">
              Subscriptions
            </h1>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-gray-600">
              Manage all your recurring subscriptions, expenses, and income streams.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 md:shrink-0">
          {lastRefresh && (
            <span className="rounded-sm border border-gray-200 bg-gray-50 px-2.5 py-1 font-mono text-[11px] text-gray-500">
              last sync {format(lastRefresh, "HH:mm · dd MMM")}
            </span>
          )}
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-sm border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:border-cyan-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} strokeWidth={1.75} />
            Refresh
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 rounded-sm border border-transparent bg-cyan-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-cyan-700"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={1.75} />
            Add Subscription
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center">
            <div className="rounded-full bg-red-100 p-2">
              <div className="h-5 w-5 text-red-600">↓</div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Monthly Outflow</p>
              <p className="text-2xl font-bold text-gray-900">{fmtMoney(totals.monthlyOutflow, "ZAR")}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center">
            <div className="rounded-full bg-green-100 p-2">
              <div className="h-5 w-5 text-green-600">↑</div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Monthly Inflow</p>
              <p className="text-2xl font-bold text-gray-900">{fmtMoney(totals.monthlyInflow, "ZAR")}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center">
            <div className={`rounded-full p-2 ${totals.netBalance >= 0 ? 'bg-emerald-100' : 'bg-rose-100'}`}>
              <div className={`h-5 w-5 ${totals.netBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {totals.netBalance >= 0 ? '↗' : '↘'}
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Net Balance</p>
              <p className={`text-2xl font-bold ${totals.netBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {fmtMoney(totals.netBalance, "ZAR")}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center">
            <div className="rounded-full bg-blue-100 p-2">
              <div className="h-5 w-5 text-blue-600">📊</div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Active Subscriptions</p>
              <p className="text-2xl font-bold text-gray-900">{totals.active}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center">
            <div className="rounded-full bg-purple-100 p-2">
              <div className="h-5 w-5 text-purple-600">📋</div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Subscriptions</p>
              <p className="text-2xl font-bold text-gray-900">{totals.count}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mt-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("all")}
            className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium ${
              activeTab === "all"
                ? "border-cyan-500 text-cyan-600"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            All Subscriptions
          </button>
          <button
            onClick={() => setActiveTab("incoming")}
            className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium ${
              activeTab === "incoming"
                ? "border-cyan-500 text-cyan-600"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            Incoming (MRR)
          </button>
          <button
            onClick={() => setActiveTab("outgoing")}
            className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium ${
              activeTab === "outgoing"
                ? "border-cyan-500 text-cyan-600"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            Outgoing (SaaS/Bills)
          </button>
          <button
            onClick={() => setActiveTab("active")}
            className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium ${
              activeTab === "active"
                ? "border-cyan-500 text-cyan-600"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setActiveTab("paused")}
            className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium ${
              activeTab === "paused"
                ? "border-cyan-500 text-cyan-600"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            Paused
          </button>
          <button
            onClick={() => setActiveTab("bankzero")}
            className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium ${
              activeTab === "bankzero"
                ? "border-cyan-500 text-cyan-600"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            Bank Zero Sync
          </button>
          <button
            onClick={() => setActiveTab("email")}
            className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium ${
              activeTab === "email"
                ? "border-cyan-500 text-cyan-600"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            Email Ingestion
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {/* All Subscriptions Table */}
        {activeTab === "all" || activeTab === "incoming" || activeTab === "outgoing" || activeTab === "active" || activeTab === "paused" ? (
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="px-4 py-3 sm:px-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">Subscriptions</h2>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Filter className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                    <select
                      value={filter}
                      onChange={(e) => setFilter(e.target.value as string)}
                      className="pl-8 pr-10 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    >
                      <option value="all">All</option>
                      <option value="incoming">Incoming</option>
                      <option value="outgoing">Outgoing</option>
                      <option value="active">Active</option>
                      <option value="paused">Paused</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            
            {loading && rows.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="animate-spin h-8 w-8 text-gray-500" />
              </div>
            ) : grouped.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <p className="text-gray-500">No subscriptions found</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {grouped.map(([category, list]) => (
                  <div key={category} className="border-b border-gray-200">
                    <div 
                      className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer hover:bg-gray-100"
                      onClick={() => toggleCategory(category)}
                    >
                      <h3 className="font-medium text-gray-900">{category}</h3>
                      <div className="flex items-center">
                        <span className="mr-2 text-sm text-gray-500">{list.length} items</span>
                        {expandedCategories[category] ? (
                          <ChevronUp className="h-4 w-4 text-gray-500" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-gray-500" />
                        )}
                      </div>
                    </div>
                    
                    {expandedCategories[category] && (
                      <div className="divide-y divide-gray-200">
                        {list.map((subscription, idx) => (
                          <div 
                            key={subscription.id} 
                            className={`px-4 py-3 ${idx > 0 ? '' : ''}`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="flex-shrink-0">
                                  <div className={`h-3 w-3 rounded-full ${
                                    subscription.status === "active" ? "bg-emerald-400" :
                                    subscription.status === "paused" ? "bg-cyan-400" :
                                    subscription.status === "cancelled" ? "bg-gray-400" :
                                    "bg-gray-400"
                                  }`} />
                                </div>
                                <div>
                                  <div className="flex items-baseline space-x-2">
                                    <h4 className="text-sm font-medium text-gray-900">{subscription.service_name}</h4>
                                    {subscription.tier && (
                                      <span className="text-xs text-gray-500">{subscription.tier}</span>
                                    )}
                                  </div>
                                  <div className="mt-1 flex flex-wrap gap-2">
                                    {subscription.billing_cycle && (
                                      <span className="text-xs text-gray-500">{subscription.billing_cycle}</span>
                                    )}
                                    {subscription.renewal_date && (
                                      <span className="text-xs text-gray-500">· renews {fmtDate(subscription.renewal_date)}</span>
                                    )}
                                    {subscription.payment_method && (
                                      <span className="text-xs text-gray-500">· {subscription.payment_method}</span>
                                    )}
                                  </div>
                                  {subscription.notes && (
                                    <p className="mt-1 text-xs text-gray-500 line-clamp-1">{subscription.notes}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center space-x-4">
                                <div className="text-right">
                                  <div className="text-sm font-medium text-gray-900">
                                    {subscription.direction === "IN" ? "+" : "-"}{fmtMoney(subscription.monthly_zar || subscription.monthly_usd, "ZAR")}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {subscription.email_tag ? `Tag: ${subscription.email_tag}` : ''}
                                  </div>
                                </div>
                                <div className="flex flex-col items-end space-y-2">
                                  <DirectionBadge direction={subscription.direction} />
                                  <StatusBadge status={subscription.status} />
                                </div>
                                <ActionButtons subscription={subscription} />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}

        {/* Bank Zero Statement Sync Tab */}
        {activeTab === "bankzero" && (
          <div className="space-y-6">
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Bank Zero Statement Sync</h2>
              <p className="text-gray-600 mb-4">
                Upload Bank Zero CSV or PDF statements to automatically categorize transactions and reconcile with subscriptions.
              </p>
              <BankZeroUploader />
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-md font-medium text-gray-900 mb-4">Recent Statements</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transactions</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {mockRecentStatements.map((statement) => (
                      <tr key={statement.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{statement.fileName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{statement.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{statement.transactions}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            {statement.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button className="text-cyan-600 hover:text-cyan-900">View</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-md font-medium text-gray-900 mb-4">Unlinked Debits/Credits</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {mockUnlinkedTransactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{transaction.description}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {transaction.type === 'credit' ? '+' : '-'}R{transaction.amount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            transaction.type === 'credit' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {transaction.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button className="text-cyan-600 hover:text-cyan-900">Link</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Email Ingestion Tracker Tab */}
        {activeTab === "email" && (
          <div className="space-y-6">
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Email Ingestion Tracker</h2>
              <p className="text-gray-600 mb-4">
                Track invoices automatically detected from subscriptions@jonoblackburn.com
              </p>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {mockEmailIngestionData.map((invoice) => (
                      <tr key={invoice.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{invoice.invoiceNumber}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{invoice.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">R{invoice.amount.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            invoice.status === 'processed' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {invoice.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button className="text-cyan-600 hover:text-cyan-900">View</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Subscription Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setShowAddModal(false)}></div>
            </div>
            
            <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block transform overflow-hidden rounded-lg border border-gray-200 bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
              <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">Add New Subscription</h3>
                    <div className="mt-4 space-y-4">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Service Name</label>
                        <input
                          type="text"
                          id="name"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
                          placeholder="e.g. Netflix, AWS"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Amount (ZAR)</label>
                          <input
                            type="number"
                            id="amount"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
                            placeholder="0.00"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="frequency" className="block text-sm font-medium text-gray-700">Frequency</label>
                          <select
                            id="frequency"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
                          >
                            <option>Monthly</option>
                            <option>Quarterly</option>
                            <option>Yearly</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="direction" className="block text-sm font-medium text-gray-700">Direction</label>
                          <select
                            id="direction"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
                          >
                            <option value="IN">Income</option>
                            <option value="OUT">Expense</option>
                          </select>
                        </div>
                        
                        <div>
                          <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
                          <input
                            type="text"
                            id="category"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
                            placeholder="e.g. Entertainment, Cloud"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Associated Email</label>
                        <input
                          type="email"
                          id="email"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
                          placeholder="subscriptions@jonoblackburn.com"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <button
                  type="button"
                  className="inline-flex w-full justify-center rounded-md border border-transparent bg-cyan-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowAddModal(false)}
                >
                  Add Subscription
                </button>
                <button
                  type="button"
                  className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 flex items-start gap-3 rounded-lg border border-rose-500/30 bg-rose-500/5 px-4 py-3 text-sm text-rose-300">
          <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={2} />
          <span className="font-mono text-xs">{error}</span>
        </div>
      )}
    </div>
  );
}
