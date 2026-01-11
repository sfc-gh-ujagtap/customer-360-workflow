"use client";

import { useState, useEffect } from "react";
import { Users, DollarSign, MessageSquare, TrendingUp, Search, Plus, Pencil, Trash2, Eye, MapPin, Mail, Phone, Calendar, ShoppingBag, AlertTriangle, LayoutDashboard, ShoppingCart, CreditCard, Globe } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis, Pie, PieChart, Cell, Area, AreaChart, Line, LineChart, CartesianGrid, Radar, RadarChart, PolarAngleAxis, PolarGrid } from "recharts";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRangeProvider, useDateRange } from "@/contexts/date-range-context";

interface Customer {
  CUSTOMER_ID: number;
  FIRST_NAME: string;
  LAST_NAME: string;
  EMAIL: string;
  PHONE: string;
  REGISTRATION_DATE: string;
  COUNTRY: string;
  CITY: string;
  CUSTOMER_SEGMENT: string;
  TOTAL_LIFETIME_VALUE: number;
  TOTAL_ORDERS: number;
  LAST_ORDER_DATE: string;
}

interface Transaction {
  TRANSACTION_ID: number;
  CUSTOMER_ID: number;
  PRODUCT_ID: number;
  TRANSACTION_DATE: string;
  QUANTITY: number;
  UNIT_PRICE: number;
  DISCOUNT: number;
  TOTAL_AMOUNT: number;
  PAYMENT_METHOD: string;
  PRODUCT_NAME: string;
  CATEGORY: string;
}

interface Interaction {
  INTERACTION_ID: number;
  CUSTOMER_ID: number;
  INTERACTION_DATE: string;
  INTERACTION_TYPE: string;
  CHANNEL: string;
  SENTIMENT: string;
  RESOLUTION_TIME_MINUTES: number;
}

interface Stats {
  totalCustomers: number;
  totalTransactions: number;
  totalRevenue: number;
  totalInteractions: number;
  segments: { CUSTOMER_SEGMENT: string; COUNT: number }[];
  sentiment: { SENTIMENT: string; COUNT: number }[];
}

interface DashboardData {
  stats: {
    TOTAL_CUSTOMERS: number;
    TOTAL_REVENUE: number;
    TOTAL_ORDERS: number;
    TOTAL_INTERACTIONS: number;
    AVG_ORDER_VALUE: number;
  };
  revenueByMonth: { MONTH: string; REVENUE: number; ORDERS: number }[];
  revenueByCategory: { CATEGORY: string; REVENUE: number }[];
  paymentMethods: { PAYMENT_METHOD: string; COUNT: number; REVENUE: number }[];
  customersByCountry: { COUNTRY: string; COUNT: number; TOTAL_VALUE: number }[];
  monthlyCustomers: { MONTH: string; NEW_CUSTOMERS: number }[];
}

const segmentColors: Record<string, string> = {
  Premium: "bg-violet-100 text-violet-700",
  Gold: "bg-amber-100 text-amber-700",
  Silver: "bg-slate-100 text-slate-700",
  Bronze: "bg-orange-100 text-orange-700",
};

const sentimentColors: Record<string, string> = {
  Positive: "bg-green-100 text-green-700",
  Neutral: "bg-slate-100 text-slate-700",
  Negative: "bg-red-100 text-red-700",
};

const chartColors = {
  blue: "hsl(200, 60%, 50%)",
  green: "hsl(142, 50%, 45%)",
  purple: "hsl(280, 50%, 55%)",
  amber: "hsl(35, 70%, 50%)",
  rose: "hsl(350, 55%, 50%)",
  teal: "hsl(175, 50%, 42%)",
};

const chartConfig: ChartConfig = {
  COUNT: { label: "Count", color: chartColors.blue },
};

const pieColors = [chartColors.blue, chartColors.green, chartColors.purple, chartColors.amber];

const segmentBarColors: Record<string, string> = {
  Premium: "hsl(270, 55%, 55%)",
  Gold: "hsl(45, 75%, 50%)",
  Silver: "hsl(215, 20%, 55%)",
  Bronze: "hsl(25, 65%, 50%)",
};

const revenueChartConfig = {
  REVENUE: { label: "Revenue", color: chartColors.blue },
  ORDERS: { label: "Orders", color: chartColors.green },
} satisfies ChartConfig;

const categoryColors: Record<string, string> = {
  Audio: "hsl(200, 60%, 50%)",
  Accessories: "hsl(142, 50%, 45%)",
  Electronics: "hsl(280, 50%, 55%)",
  Computing: "hsl(35, 70%, 50%)",
  Gaming: "hsl(350, 55%, 50%)",
};

const categoryChartConfig = {
  REVENUE: { label: "Revenue", color: chartColors.teal },
} satisfies ChartConfig;

const paymentChartConfig = {
  visitors: { label: "Orders" },
  "Credit Card": { label: "Credit Card", color: chartColors.blue },
  "Debit Card": { label: "Debit Card", color: chartColors.green },
  "PayPal": { label: "PayPal", color: chartColors.purple },
  "Bank Transfer": { label: "Bank Transfer", color: chartColors.amber },
} satisfies ChartConfig;

const countryChartConfig = {
  TOTAL_VALUE: { label: "Total Value", color: chartColors.amber },
} satisfies ChartConfig;

const customersChartConfig = {
  NEW_CUSTOMERS: { label: "New Customers", color: chartColors.purple },
} satisfies ChartConfig;

function CustomerApp() {
  const { dateRange, setDateRange, isLoading: dateLoading, setIsLoading } = useDateRange();
  const [stats, setStats] = useState<Stats | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [dashLoading, setDashLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [segmentFilter, setSegmentFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [addCustomerOpen, setAddCustomerOpen] = useState(false);
  const [editCustomerOpen, setEditCustomerOpen] = useState(false);
  const [addTransactionOpen, setAddTransactionOpen] = useState(false);
  const [addInteractionOpen, setAddInteractionOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");

  const [customerForm, setCustomerForm] = useState({
    firstName: "", lastName: "", email: "", phone: "", country: "", city: "", segment: "Silver"
  });

  const [transactionForm, setTransactionForm] = useState({
    productName: "", category: "Electronics", quantity: 1, unitPrice: 0, paymentMethod: "Credit Card"
  });

  const [interactionForm, setInteractionForm] = useState({
    type: "Support", channel: "Email", sentiment: "Neutral", resolutionTime: 30
  });

  const refreshData = () => {
    const params = new URLSearchParams();
    if (dateRange?.from) params.set("from", dateRange.from.toISOString().split("T")[0]);
    if (dateRange?.to) params.set("to", dateRange.to.toISOString().split("T")[0]);

    Promise.all([
      fetch(`/api/stats?${params}`).then((r) => r.json()),
      fetch("/api/customers").then((r) => r.json()),
    ]).then(([statsData, customersData]) => {
      setStats(statsData);
      setCustomers(Array.isArray(customersData) ? customersData : []);
    });
  };

  useEffect(() => {
    setDashLoading(true);
    setIsLoading(true);
    const params = new URLSearchParams();
    if (dateRange?.from) params.set("from", dateRange.from.toISOString().split("T")[0]);
    if (dateRange?.to) params.set("to", dateRange.to.toISOString().split("T")[0]);

    Promise.all([
      fetch(`/api/stats?${params}`).then((r) => r.json()),
      fetch(`/api/dashboard?${params}`).then((r) => r.json()),
    ])
      .then(([statsData, dashData]) => {
        if (statsData.error) {
          setError(statsData.error);
        } else {
          setStats(statsData);
          setDashboardData(dashData);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => {
        setDashLoading(false);
        setIsLoading(false);
      });
  }, [dateRange, setIsLoading]);

  useEffect(() => {
    fetch("/api/customers")
      .then((r) => r.json())
      .then((customersData) => {
        setCustomers(Array.isArray(customersData) ? customersData : []);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (segmentFilter !== "all") params.set("segment", segmentFilter);
    if (searchQuery) params.set("search", searchQuery);
    
    const debounce = setTimeout(() => {
      fetch(`/api/customers?${params}`)
        .then((r) => r.json())
        .then(setCustomers);
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchQuery, segmentFilter]);

  const openCustomerDetail = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setDialogOpen(true);
    setDetailLoading(true);

    const [txns, ints] = await Promise.all([
      fetch(`/api/transactions?customerId=${customer.CUSTOMER_ID}`).then((r) => r.json()),
      fetch(`/api/interactions?customerId=${customer.CUSTOMER_ID}`).then((r) => r.json()),
    ]);

    setTransactions(txns);
    setInteractions(ints);
    setDetailLoading(false);
  };

  const handleAddCustomer = async () => {
    setSaving(true);
    await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(customerForm),
    });
    setSaving(false);
    setAddCustomerOpen(false);
    setCustomerForm({ firstName: "", lastName: "", email: "", phone: "", country: "", city: "", segment: "Silver" });
    refreshData();
  };

  const handleEditCustomer = async () => {
    if (!selectedCustomer) return;
    setSaving(true);
    await fetch(`/api/customers/${selectedCustomer.CUSTOMER_ID}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(customerForm),
    });
    setSaving(false);
    setEditCustomerOpen(false);
    setDialogOpen(false);
    refreshData();
  };

  const openDeleteConfirm = (customer: Customer, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCustomerToDelete(customer);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return;
    setSaving(true);
    await fetch(`/api/customers/${customerToDelete.CUSTOMER_ID}`, { method: "DELETE" });
    setSaving(false);
    setDeleteConfirmOpen(false);
    setCustomerToDelete(null);
    setDialogOpen(false);
    refreshData();
  };

  const handleAddTransaction = async () => {
    if (!selectedCustomer) return;
    setSaving(true);
    await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...transactionForm, customerId: selectedCustomer.CUSTOMER_ID }),
    });
    setSaving(false);
    setAddTransactionOpen(false);
    setTransactionForm({ productName: "", category: "Electronics", quantity: 1, unitPrice: 0, paymentMethod: "Credit Card" });
    const txns = await fetch(`/api/transactions?customerId=${selectedCustomer.CUSTOMER_ID}`).then((r) => r.json());
    setTransactions(txns);
    refreshData();
  };

  const handleAddInteraction = async () => {
    if (!selectedCustomer) return;
    setSaving(true);
    await fetch("/api/interactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...interactionForm, customerId: selectedCustomer.CUSTOMER_ID }),
    });
    setSaving(false);
    setAddInteractionOpen(false);
    setInteractionForm({ type: "Support", channel: "Email", sentiment: "Neutral", resolutionTime: 30 });
    const ints = await fetch(`/api/interactions?customerId=${selectedCustomer.CUSTOMER_ID}`).then((r) => r.json());
    setInteractions(ints);
    refreshData();
  };

  const openEditCustomer = (customer: Customer, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedCustomer(customer);
    setCustomerForm({
      firstName: customer.FIRST_NAME,
      lastName: customer.LAST_NAME,
      email: customer.EMAIL,
      phone: customer.PHONE,
      country: customer.COUNTRY,
      city: customer.CITY,
      segment: customer.CUSTOMER_SEGMENT,
    });
    setEditCustomerOpen(true);
  };

  const formatCurrency = (val: number) => `$${val?.toLocaleString() || 0}`;
  const formatCompactCurrency = (val: number) => {
    if (val >= 1e9) return `$${(val / 1e9).toFixed(1)}B`;
    if (val >= 1e6) return `$${(val / 1e6).toFixed(1)}M`;
    if (val >= 1e3) return `$${(val / 1e3).toFixed(0)}K`;
    return `$${val}`;
  };
  const formatDate = (val: string) => new Date(val).toLocaleDateString();

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i}><CardContent className="p-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Connection Error</CardTitle>
            <CardDescription>{error || "Failed to connect. Complete SSO authentication if prompted."}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const paymentData = dashboardData?.paymentMethods?.map((p) => ({
    method: p.PAYMENT_METHOD,
    count: p.COUNT,
    fill: `var(--color-${p.PAYMENT_METHOD.replace(" ", "-")})`,
  })) || [];

  const countryRadarData = dashboardData?.customersByCountry?.slice(0, 6).map((c) => ({
    country: c.COUNTRY,
    value: c.TOTAL_VALUE / 1000,
  })) || [];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Customer 360</h1>
            <p className="text-slate-500 mt-1">Unified customer data platform</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 h-12 p-1 bg-slate-100 border border-slate-200 shadow-sm">
            <TabsTrigger value="dashboard" className="flex items-center gap-2 text-base font-medium data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-blue-500 rounded-md transition-all">
              <LayoutDashboard className="h-5 w-5" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="customers" className="flex items-center gap-2 text-base font-medium data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-blue-500 rounded-md transition-all">
              <Users className="h-5 w-5" />
              Customers
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-6 space-y-6">
            <div className="flex justify-end">
              <DateRangePicker date={dateRange} onDateChange={setDateRange} isLoading={dateLoading} />
            </div>
            {dashLoading ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <Card key={i}><CardContent className="p-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
                  ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {[...Array(4)].map((_, i) => (
                    <Card key={i}><CardContent className="p-6"><Skeleton className="h-[300px] w-full" /></CardContent></Card>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="bg-white border-slate-200">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-slate-600">Total Customers</CardTitle>
                      <Users className="h-5 w-5 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-semibold text-slate-900">{dashboardData?.stats?.TOTAL_CUSTOMERS?.toLocaleString() || 0}</div>
                      <p className="text-xs text-slate-500 mt-1">In selected period</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border-slate-200">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-slate-600">Total Revenue</CardTitle>
                      <DollarSign className="h-5 w-5 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-semibold text-slate-900">{formatCompactCurrency(dashboardData?.stats?.TOTAL_REVENUE || 0)}</div>
                      <p className="text-xs text-slate-500 mt-1">{dashboardData?.stats?.TOTAL_ORDERS?.toLocaleString() || 0} orders</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border-slate-200">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-slate-600">Interactions</CardTitle>
                      <MessageSquare className="h-5 w-5 text-violet-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-semibold text-slate-900">{dashboardData?.stats?.TOTAL_INTERACTIONS?.toLocaleString() || 0}</div>
                      <p className="text-xs text-slate-500 mt-1">Customer touchpoints</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border-slate-200">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-slate-600">Avg Order Value</CardTitle>
                      <TrendingUp className="h-5 w-5 text-amber-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-semibold text-slate-900">
                        {formatCurrency(Math.round(dashboardData?.stats?.AVG_ORDER_VALUE || 0))}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Per order</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-white border-slate-200">
                    <CardHeader>
                      <CardTitle className="text-slate-900">Revenue Trend</CardTitle>
                      <CardDescription>Monthly revenue over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={revenueChartConfig} className="h-[300px] w-full">
                        <AreaChart data={dashboardData?.revenueByMonth || []} margin={{ left: 12, right: 12 }}>
                          <CartesianGrid vertical={false} />
                          <XAxis dataKey="MONTH" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(v) => v?.slice(5) || ""} />
                          <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                          <Area dataKey="REVENUE" type="natural" fill="var(--color-REVENUE)" fillOpacity={0.4} stroke="var(--color-REVENUE)" />
                        </AreaChart>
                      </ChartContainer>
                    </CardContent>
                    <CardFooter>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <TrendingUp className="h-4 w-4" />
                        Filtered by selected date range
                      </div>
                    </CardFooter>
                  </Card>

                  <Card className="bg-white border-slate-200">
                    <CardHeader>
                      <CardTitle className="text-slate-900">Revenue by Category</CardTitle>
                      <CardDescription>Product category performance</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={categoryChartConfig} className="h-[300px] w-full">
                        <BarChart data={dashboardData?.revenueByCategory || []} layout="vertical" margin={{ left: 0 }}>
                          <XAxis type="number" dataKey="REVENUE" hide />
                          <YAxis dataKey="CATEGORY" type="category" tickLine={false} tickMargin={10} axisLine={false} width={100} />
                          <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                          <Bar dataKey="REVENUE" radius={5}>
                            {(dashboardData?.revenueByCategory || []).map((entry, index) => (
                              <Cell key={index} fill={categoryColors[entry.CATEGORY] || chartColors.teal} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border-slate-200">
                    <CardHeader>
                      <CardTitle className="text-slate-900">Payment Methods</CardTitle>
                      <CardDescription>Orders by payment type</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={paymentChartConfig} className="h-[300px] w-full">
                        <PieChart>
                          <ChartTooltip cursor={false} content={<ChartTooltipContent nameKey="method" />} />
                          <Pie data={paymentData} dataKey="count" nameKey="method" innerRadius={60}>
                            {paymentData.map((_, i) => (
                              <Cell key={i} fill={pieColors[i % pieColors.length]} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ChartContainer>
                    </CardContent>
                    <CardFooter className="flex-col items-start gap-2 text-sm">
                      <div className="flex items-center gap-2 leading-none text-muted-foreground">
                        <CreditCard className="h-4 w-4" />
                        Distribution of payment types
                      </div>
                    </CardFooter>
                  </Card>

                  <Card className="bg-white border-slate-200">
                    <CardHeader>
                      <CardTitle className="text-slate-900">Top Countries</CardTitle>
                      <CardDescription>Customer value by country</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={countryChartConfig} className="h-[300px] w-full">
                        <RadarChart data={countryRadarData}>
                          <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                          <PolarAngleAxis dataKey="country" />
                          <PolarGrid />
                          <Radar dataKey="value" fill="var(--color-TOTAL_VALUE)" fillOpacity={0.6} />
                        </RadarChart>
                      </ChartContainer>
                    </CardContent>
                    <CardFooter className="flex-col gap-2 text-sm">
                      <div className="flex items-center gap-2 leading-none text-muted-foreground">
                        <Globe className="h-4 w-4" />
                        Value in thousands
                      </div>
                    </CardFooter>
                  </Card>

                  <Card className="bg-white border-slate-200">
                    <CardHeader>
                      <CardTitle className="text-slate-900">Customer Acquisition</CardTitle>
                      <CardDescription>New customers over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={customersChartConfig} className="h-[300px] w-full">
                        <AreaChart data={dashboardData?.monthlyCustomers || []} margin={{ left: 12, right: 12 }}>
                          <CartesianGrid vertical={false} />
                          <XAxis dataKey="MONTH" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(v) => v?.slice(5) || ""} />
                          <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                          <defs>
                            <linearGradient id="fillCustomers" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={chartColors.purple} stopOpacity={0.8} />
                              <stop offset="95%" stopColor={chartColors.purple} stopOpacity={0.1} />
                            </linearGradient>
                          </defs>
                          <Area dataKey="NEW_CUSTOMERS" type="monotone" fill="url(#fillCustomers)" stroke={chartColors.purple} strokeWidth={2} />
                        </AreaChart>
                      </ChartContainer>
                    </CardContent>
                    <CardFooter>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        Monthly registration trend
                      </div>
                    </CardFooter>
                  </Card>

                  <Card className="bg-white border-slate-200">
                    <CardHeader>
                      <CardTitle className="text-slate-900">Customer Segments</CardTitle>
                      <CardDescription>Distribution by segment</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={chartConfig} className="h-[300px] w-full">
                        <BarChart data={stats.segments} layout="vertical">
                          <XAxis type="number" hide />
                          <YAxis dataKey="CUSTOMER_SEGMENT" type="category" width={70} tickLine={false} axisLine={false} fontSize={12} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="COUNT" radius={4}>
                            {stats.segments.map((entry, index) => (
                              <Cell key={index} fill={segmentBarColors[entry.CUSTOMER_SEGMENT] || "hsl(var(--chart-1))"} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="customers" className="mt-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search customers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-64"
                  />
                </div>
                <Select value={segmentFilter} onValueChange={setSegmentFilter}>
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="All Segments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Segments</SelectItem>
                    <SelectItem value="Premium">Premium</SelectItem>
                    <SelectItem value="Gold">Gold</SelectItem>
                    <SelectItem value="Silver">Silver</SelectItem>
                    <SelectItem value="Bronze">Bronze</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => setAddCustomerOpen(true)} className="bg-blue-400 hover:bg-blue-500 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Add Customer
              </Button>
            </div>

            <Card className="bg-white border-slate-200">
              <CardHeader>
                <CardTitle className="text-slate-900">Customers</CardTitle>
                <CardDescription>View, edit, and delete customers</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Segment</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead className="text-right">Lifetime Value</TableHead>
                      <TableHead className="text-right">Orders</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map((customer) => (
                      <TableRow key={customer.CUSTOMER_ID} className="group">
                        <TableCell>
                          <div className="font-medium text-slate-900">{customer.FIRST_NAME} {customer.LAST_NAME}</div>
                          <div className="text-sm text-slate-500">{customer.EMAIL}</div>
                        </TableCell>
                        <TableCell>
                          <Badge className={segmentColors[customer.CUSTOMER_SEGMENT] || "bg-slate-100 text-slate-700"}>
                            {customer.CUSTOMER_SEGMENT}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-600">{customer.CITY}, {customer.COUNTRY}</TableCell>
                        <TableCell className="text-right font-medium text-slate-900">{formatCurrency(customer.TOTAL_LIFETIME_VALUE)}</TableCell>
                        <TableCell className="text-right text-slate-600">{customer.TOTAL_ORDERS}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                              onClick={() => openCustomerDetail(customer)}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-slate-500 hover:text-amber-600 hover:bg-amber-50"
                              onClick={(e) => openEditCustomer(customer, e)}
                              title="Edit Customer"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-slate-500 hover:text-red-600 hover:bg-red-50"
                              onClick={(e) => openDeleteConfirm(customer, e)}
                              title="Delete Customer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl">Customer Details</DialogTitle>
            </DialogHeader>

            {detailLoading ? (
              <div className="py-8">
                <Skeleton className="h-64 w-full" />
              </div>
            ) : selectedCustomer && (
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xl font-semibold">
                    {selectedCustomer.FIRST_NAME[0]}{selectedCustomer.LAST_NAME[0]}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-slate-900">
                        {selectedCustomer.FIRST_NAME} {selectedCustomer.LAST_NAME}
                      </h3>
                      <Badge className={segmentColors[selectedCustomer.CUSTOMER_SEGMENT] || "bg-slate-100"}>
                        {selectedCustomer.CUSTOMER_SEGMENT}
                      </Badge>
                    </div>
                    <div className="mt-2 flex flex-col gap-1 text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Mail className="h-4 w-4 flex-shrink-0" />
                        {selectedCustomer.EMAIL}
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Phone className="h-4 w-4 flex-shrink-0" />
                        {selectedCustomer.PHONE}
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <MapPin className="h-4 w-4 flex-shrink-0" />
                        {selectedCustomer.CITY}, {selectedCustomer.COUNTRY}
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Calendar className="h-4 w-4 flex-shrink-0" />
                        Customer since {formatDate(selectedCustomer.REGISTRATION_DATE)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-emerald-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-emerald-600">{formatCurrency(selectedCustomer.TOTAL_LIFETIME_VALUE)}</div>
                    <div className="text-sm text-emerald-700 mt-1">Lifetime Value</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{selectedCustomer.TOTAL_ORDERS}</div>
                    <div className="text-sm text-blue-700 mt-1">Total Orders</div>
                  </div>
                  <div className="bg-violet-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-violet-600">{interactions.length}</div>
                    <div className="text-sm text-violet-700 mt-1">Interactions</div>
                  </div>
                </div>

                <Tabs defaultValue="transactions" className="w-full">
                  <div className="flex items-center justify-between mb-4">
                    <TabsList>
                      <TabsTrigger value="transactions">Transactions ({transactions.length})</TabsTrigger>
                      <TabsTrigger value="interactions">Interactions ({interactions.length})</TabsTrigger>
                    </TabsList>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setAddTransactionOpen(true)}>
                        <Plus className="h-4 w-4 mr-1" /> Transaction
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setAddInteractionOpen(true)}>
                        <Plus className="h-4 w-4 mr-1" /> Interaction
                      </Button>
                    </div>
                  </div>

                  <TabsContent value="transactions" className="mt-0">
                    <ScrollArea className="h-[250px] border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Product</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Payment</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {transactions.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center text-slate-500 py-8">
                                <ShoppingBag className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                                No transactions yet
                              </TableCell>
                            </TableRow>
                          ) : (
                            transactions.map((txn) => (
                              <TableRow key={txn.TRANSACTION_ID}>
                                <TableCell className="text-slate-600">{formatDate(txn.TRANSACTION_DATE)}</TableCell>
                                <TableCell className="font-medium">{txn.PRODUCT_NAME}</TableCell>
                                <TableCell><Badge variant="outline">{txn.CATEGORY}</Badge></TableCell>
                                <TableCell className="font-medium">{formatCurrency(txn.TOTAL_AMOUNT)}</TableCell>
                                <TableCell className="text-slate-600">{txn.PAYMENT_METHOD}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="interactions" className="mt-0">
                    <ScrollArea className="h-[250px] border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Channel</TableHead>
                            <TableHead>Sentiment</TableHead>
                            <TableHead className="text-right">Resolution</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {interactions.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center text-slate-500 py-8">
                                <MessageSquare className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                                No interactions yet
                              </TableCell>
                            </TableRow>
                          ) : (
                            interactions.map((int) => (
                              <TableRow key={int.INTERACTION_ID}>
                                <TableCell className="text-slate-600">{formatDate(int.INTERACTION_DATE)}</TableCell>
                                <TableCell className="font-medium">{int.INTERACTION_TYPE}</TableCell>
                                <TableCell className="text-slate-600">{int.CHANNEL}</TableCell>
                                <TableCell>
                                  <Badge className={sentimentColors[int.SENTIMENT] || "bg-slate-100"}>
                                    {int.SENTIMENT}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right text-slate-600">{int.RESOLUTION_TIME_MINUTES} min</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Delete Customer
              </DialogTitle>
              <DialogDescription className="pt-2">
                Are you sure you want to delete <span className="font-semibold text-slate-900">{customerToDelete?.FIRST_NAME} {customerToDelete?.LAST_NAME}</span>? 
                This will permanently remove all their data including transactions and interactions.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDeleteCustomer} disabled={saving}>
                {saving ? "Deleting..." : "Delete Customer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={addCustomerOpen} onOpenChange={setAddCustomerOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
              <DialogDescription>Enter customer details below</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input value={customerForm.firstName} onChange={(e) => setCustomerForm({ ...customerForm, firstName: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input value={customerForm.lastName} onChange={(e) => setCustomerForm({ ...customerForm, lastName: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={customerForm.email} onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={customerForm.phone} onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input value={customerForm.city} onChange={(e) => setCustomerForm({ ...customerForm, city: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Input value={customerForm.country} onChange={(e) => setCustomerForm({ ...customerForm, country: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Segment</Label>
                <Select value={customerForm.segment} onValueChange={(v) => setCustomerForm({ ...customerForm, segment: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Premium">Premium</SelectItem>
                    <SelectItem value="Gold">Gold</SelectItem>
                    <SelectItem value="Silver">Silver</SelectItem>
                    <SelectItem value="Bronze">Bronze</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddCustomerOpen(false)}>Cancel</Button>
              <Button onClick={handleAddCustomer} disabled={saving}>{saving ? "Saving..." : "Add Customer"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={editCustomerOpen} onOpenChange={setEditCustomerOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Customer</DialogTitle>
              <DialogDescription>Update customer details</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input value={customerForm.firstName} onChange={(e) => setCustomerForm({ ...customerForm, firstName: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input value={customerForm.lastName} onChange={(e) => setCustomerForm({ ...customerForm, lastName: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={customerForm.email} onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={customerForm.phone} onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input value={customerForm.city} onChange={(e) => setCustomerForm({ ...customerForm, city: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Input value={customerForm.country} onChange={(e) => setCustomerForm({ ...customerForm, country: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Segment</Label>
                <Select value={customerForm.segment} onValueChange={(v) => setCustomerForm({ ...customerForm, segment: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Premium">Premium</SelectItem>
                    <SelectItem value="Gold">Gold</SelectItem>
                    <SelectItem value="Silver">Silver</SelectItem>
                    <SelectItem value="Bronze">Bronze</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditCustomerOpen(false)}>Cancel</Button>
              <Button onClick={handleEditCustomer} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={addTransactionOpen} onOpenChange={setAddTransactionOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Transaction</DialogTitle>
              <DialogDescription>Record a new transaction for {selectedCustomer?.FIRST_NAME}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Product Name</Label>
                <Input value={transactionForm.productName} onChange={(e) => setTransactionForm({ ...transactionForm, productName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={transactionForm.category} onValueChange={(v) => setTransactionForm({ ...transactionForm, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Electronics">Electronics</SelectItem>
                    <SelectItem value="Clothing">Clothing</SelectItem>
                    <SelectItem value="Home">Home</SelectItem>
                    <SelectItem value="Sports">Sports</SelectItem>
                    <SelectItem value="Books">Books</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input type="number" value={transactionForm.quantity} onChange={(e) => setTransactionForm({ ...transactionForm, quantity: parseInt(e.target.value) || 1 })} />
                </div>
                <div className="space-y-2">
                  <Label>Unit Price</Label>
                  <Input type="number" value={transactionForm.unitPrice} onChange={(e) => setTransactionForm({ ...transactionForm, unitPrice: parseFloat(e.target.value) || 0 })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={transactionForm.paymentMethod} onValueChange={(v) => setTransactionForm({ ...transactionForm, paymentMethod: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Credit Card">Credit Card</SelectItem>
                    <SelectItem value="Debit Card">Debit Card</SelectItem>
                    <SelectItem value="PayPal">PayPal</SelectItem>
                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddTransactionOpen(false)}>Cancel</Button>
              <Button onClick={handleAddTransaction} disabled={saving}>{saving ? "Saving..." : "Add Transaction"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={addInteractionOpen} onOpenChange={setAddInteractionOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Interaction</DialogTitle>
              <DialogDescription>Log an interaction for {selectedCustomer?.FIRST_NAME}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={interactionForm.type} onValueChange={(v) => setInteractionForm({ ...interactionForm, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Support">Support</SelectItem>
                    <SelectItem value="Sales">Sales</SelectItem>
                    <SelectItem value="Inquiry">Inquiry</SelectItem>
                    <SelectItem value="Complaint">Complaint</SelectItem>
                    <SelectItem value="Feedback">Feedback</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Channel</Label>
                <Select value={interactionForm.channel} onValueChange={(v) => setInteractionForm({ ...interactionForm, channel: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Email">Email</SelectItem>
                    <SelectItem value="Phone">Phone</SelectItem>
                    <SelectItem value="Chat">Chat</SelectItem>
                    <SelectItem value="In-Person">In-Person</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Sentiment</Label>
                <Select value={interactionForm.sentiment} onValueChange={(v) => setInteractionForm({ ...interactionForm, sentiment: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Positive">Positive</SelectItem>
                    <SelectItem value="Neutral">Neutral</SelectItem>
                    <SelectItem value="Negative">Negative</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Resolution Time (minutes)</Label>
                <Input type="number" value={interactionForm.resolutionTime} onChange={(e) => setInteractionForm({ ...interactionForm, resolutionTime: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddInteractionOpen(false)}>Cancel</Button>
              <Button onClick={handleAddInteraction} disabled={saving}>{saving ? "Saving..." : "Add Interaction"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <DateRangeProvider>
      <CustomerApp />
    </DateRangeProvider>
  );
}
