import { useCallback, useEffect, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Boxes,
  CheckCircle2,
  ChevronDown,
  Download,
  Clock3,
  Command,
  Factory,
  LayoutDashboard,
  Menu,
  Moon,
  Network,
  Package,
  Printer,
  RefreshCw,
  Search,
  ShieldAlert,
  Ship,
  Sun,
  Truck,
  X,
  Zap,
  SlidersHorizontal,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import {
  inventoryService,
  replenishmentService,
  riskService,
  shipmentService,
  supplierService,
} from './api/services'
import type {
  InventoryItem,
  InventoryRisk,
  ReplenishmentRecommendation,
  RiskAlert,
  Shipment,
  SupplierRisk,
} from './api/types'
import { useTheme } from './theme/theme-context'
import './App.css'
import { exportCsv, printReport } from './utils/export'
import SimulatorPage from './pages/SimulatorPage'

const navigation = [
  { label: 'Overview', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Network explorer', path: '/network', icon: Network },
  { label: 'Shipments', path: '/shipments', icon: Ship },
  { label: 'Inventory', path: '/inventory', icon: Boxes },
  { label: 'Risk intelligence', path: '/risks', icon: ShieldAlert },
  { label: 'Suppliers', path: '/suppliers', icon: Factory },
  { label: 'Replenishment', path: '/replenishment', icon: Package },
  { label: 'Disruption simulator', path: '/simulator', icon: SlidersHorizontal },
]

type DashboardData = {
  shipments: Shipment[]
  inventory: InventoryItem[]
  alerts: RiskAlert[]
  inventoryRisks: InventoryRisk[]
  suppliers: SupplierRisk[]
  replenishment: ReplenishmentRecommendation[]
}

const emptyData: DashboardData = {
  shipments: [],
  inventory: [],
  alerts: [],
  inventoryRisks: [],
  suppliers: [],
  replenishment: [],
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(value?: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function statusClass(status: string) {
  const normalized = status.toLowerCase().replaceAll('_', '-')
  if (['delivered', 'resolved', 'closed', 'low'].includes(normalized)) {
    return 'status status-success'
  }
  if (['delayed', 'critical', 'high', 'open'].includes(normalized)) {
    return 'status status-danger'
  }
  if (['medium', 'in-transit', 'pending'].includes(normalized)) {
    return 'status status-warning'
  }
  return 'status status-neutral'
}

function Status({ value }: { value: string }) {
  return <span className={statusClass(value)}>{value.replaceAll('_', ' ')}</span>
}

function App() {
  const { theme, toggleTheme } = useTheme()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [data, setData] = useState<DashboardData>(emptyData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const location = useLocation()
  const navigate = useNavigate()

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')

    const results = await Promise.allSettled([
      shipmentService.getAll(),
      inventoryService.getAll(),
      riskService.getShipmentAlerts(),
      riskService.getInventoryRisks(),
      supplierService.getRisks(),
      replenishmentService.getRecommendations(),
    ])

    const [shipments, inventory, alerts, inventoryRisks, suppliers, replenishment] =
      results

    const failed = results.filter((result) => result.status === 'rejected')
    setData({
      shipments: shipments.status === 'fulfilled' ? shipments.value : [],
      inventory: inventory.status === 'fulfilled' ? inventory.value : [],
      alerts: alerts.status === 'fulfilled' ? alerts.value : [],
      inventoryRisks:
        inventoryRisks.status === 'fulfilled' ? inventoryRisks.value : [],
      suppliers: suppliers.status === 'fulfilled' ? suppliers.value : [],
      replenishment:
        replenishment.status === 'fulfilled' ? replenishment.value : [],
    })

    if (failed.length === results.length) {
      setError('The backend could not be reached. Check that Spring Boot is running on port 8080.')
    } else if (failed.length > 0) {
      setError(`${failed.length} data source(s) could not be loaded. Available data is still shown.`)
    }

    setLastUpdated(new Date())
    setLoading(false)
  }, [])

  useEffect(() => {
    // Loading data updates React state as part of this effect's purpose.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData()
  }, [loadData])

  const allRisks = [...data.alerts, ...data.inventoryRisks]
  const openRisks = allRisks.filter((risk) => risk.status === 'OPEN')
  const delayedShipments = data.shipments.filter(
    (shipment) => shipment.status === 'DELAYED',
  )
  const lowStockItems = data.inventory.filter((item) => item.lowStock)
  const criticalOrders = data.replenishment.filter(
    (item) => item.priority === 'CRITICAL',
  )
  const totalOrderValue = data.replenishment.reduce(
    (sum, item) => sum + item.estimatedOrderCost,
    0,
  )
  const deliveredShipments = data.shipments.filter(
    (shipment) => shipment.status === 'DELIVERED',
  ).length
  const activeShipments = data.shipments.filter((shipment) =>
    ['PENDING', 'IN_TRANSIT', 'DELAYED'].includes(shipment.status),
  ).length

  const chartData = [
    { day: 'Mon', shipments: 12, risk: 4 },
    { day: 'Tue', shipments: 18, risk: 6 },
    { day: 'Wed', shipments: 15, risk: 3 },
    { day: 'Thu', shipments: 23, risk: 8 },
    { day: 'Fri', shipments: 19, risk: 5 },
    { day: 'Sat', shipments: 27, risk: 7 },
    { day: 'Sun', shipments: data.shipments.length, risk: openRisks.length },
  ]

  const pageTitle =
    navigation.find((item) => item.path === location.pathname)?.label ??
    (location.pathname === '/' ? 'Supply chain overview' : 'Operations')

  return (
    <div className="app-shell">
      {sidebarOpen && (
        <button
          className="sidebar-scrim"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <NavLink to="/" className="brand-lockup" aria-label="SupplyChain Sentinel home">
          <span className="brand-mark"><Activity size={22} strokeWidth={2.4} /></span>
          <span className="brand-copy">
            <strong>SUPPLYCHAIN</strong>
            <span>SENTINEL <i>INTELLIGENCE</i></span>
          </span>
          <button
            className="icon-button sidebar-close"
            aria-label="Close menu"
            onClick={(event) => {
              event.preventDefault()
              setSidebarOpen(false)
            }}
          >
            <X size={18} />
          </button>
        </NavLink>

        <div className="workspace-switcher">
          <span className="workspace-avatar">SC</span>
          <span className="workspace-copy">
            <strong>Global Operations</strong>
            <small>Supply network · India</small>
          </span>
          <ChevronDown size={15} />
        </div>

        <div className="nav-label">WORKSPACE</div>
        <nav className="primary-nav" aria-label="Main navigation">
          {navigation.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `nav-link ${isActive ? 'nav-link-active' : ''}`
              }
            >
              <Icon size={18} strokeWidth={1.8} />
              <span>{label}</span>
              {label === 'Risk intelligence' && openRisks.length > 0 && (
                <span className="nav-count">{openRisks.length}</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-spacer" />

        <div className="sidebar-insight">
          <div className="insight-icon"><Zap size={17} /></div>
          <span className="eyebrow">SENTINEL INSIGHT</span>
          <strong>Stay ahead of disruption.</strong>
          <p>Turn operational signals into earlier decisions.</p>
          <NavLink to="/risks" className="insight-link">
            Explore risk signals <ArrowRight size={14} />
          </NavLink>
        </div>

        <div className="sidebar-footer">
          <span className="connection-dot" />
          <span>API connection</span>
          <strong>{error && data.shipments.length === 0 ? 'Check' : 'Connected'}</strong>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-button mobile-menu"
              aria-label="Open navigation"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            <div className="breadcrumb">
              <span>Workspace</span><span className="breadcrumb-slash">/</span>
              <strong>{pageTitle}</strong>
            </div>
          </div>

          <div className="topbar-actions">
            <button className="search-trigger" onClick={() => {
              const search = document.querySelector<HTMLInputElement>('#global-search')
              search?.focus()
            }}>
              <Search size={16} />
              <input
                id="global-search"
                aria-label="Search shipments and inventory"
                placeholder="Search operations..."
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    const query = event.currentTarget.value.toLowerCase()
                    const match = navigation.find((item) =>
                      item.label.toLowerCase().includes(query),
                    )
                    if (match) window.location.href = match.path
                  }
                }}
              />
              <kbd><Command size={11} /> K</kbd>
            </button>
            <button
              className="icon-button"
              title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              aria-label="Toggle theme"
              onClick={toggleTheme}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

<div className="notification-container">
  <button
    type="button"
    className="icon-button notification-button"
    title={`${openRisks.length} open risk signals`}
    aria-label={`${openRisks.length} open risk signals`}
    aria-expanded={notificationsOpen}
    aria-haspopup="dialog"
    onClick={() => setNotificationsOpen((current) => !current)}
  >
    <Bell size={18} />
    {openRisks.length > 0 && (
      <span className="notification-dot" />
    )}
  </button>

  {notificationsOpen && (
    <div className="notification-popover" role="dialog" aria-label="Risk notifications">
      <div className="notification-popover-header">
        <div>
          <span className="eyebrow">OPERATIONS CENTER</span>
          <h3>Risk notifications</h3>
        </div>
        <button
          type="button"
          className="icon-button"
          aria-label="Close notifications"
          onClick={() => setNotificationsOpen(false)}
        >
          <X size={16} />
        </button>
      </div>

      <div className="notification-summary">
        <span className="notification-summary-count">{openRisks.length}</span>
        <span>Open risk signals from backend data</span>
      </div>

      <div className="notification-list">
        {openRisks.length === 0 ? (
          <div className="notification-empty">
            <CheckCircle2 size={22} />
            <strong>No open risks</strong>
            <span>There are no open risk records in the latest data.</span>
          </div>
        ) : (
          openRisks.slice(0, 8).map((risk) => {
            const isShipmentRisk = 'shipmentReference' in risk
            const title = isShipmentRisk
              ? risk.shipmentReference
              : risk.itemName
            const destination = isShipmentRisk ? '/risks' : '/inventory'

            return (
              <button
                type="button"
                className="notification-item"
                key={`${isShipmentRisk ? 'shipment' : 'inventory'}-${risk.id}`}
                onClick={() => {
                  setNotificationsOpen(false)
                  navigate(destination)
                }}
              >
                <span className="notification-item-icon">
                  <AlertTriangle size={16} />
                </span>
                <span className="notification-item-copy">
                  <strong>{title}</strong>
                  <span>{risk.message || risk.riskType.replaceAll('_', ' ')}</span>
                  <small>{risk.riskType.replaceAll('_', ' ')}</small>
                </span>
                <Status value={risk.severity} />
              </button>
            )
          })
        )}
      </div>

      <button
        type="button"
        className="notification-view-all"
        onClick={() => {
          setNotificationsOpen(false)
          navigate('/risks')
        }}
      >
        View all risk intelligence <ArrowRight size={15} />
      </button>
    </div>
  )}
</div>
            <div className="user-avatar" title="Operations analyst">OA</div>
          </div>
        </header>

        <div className="page-content">
          {error && (
            <div className="inline-notice">
              <AlertTriangle size={16} />
              <span>{error}</span>
              <button onClick={() => void loadData()}>Retry</button>
            </div>
          )}

          <Routes>
          <Route
            path="/simulator"
            element={
              <SimulatorPage
                inventory={data.inventory}
                shipments={data.shipments}
                loading={loading}
              />
            }
          />
            <Route
              path="/"
              element={
                <Dashboard
                  data={data}
                  loading={loading}
                  lastUpdated={lastUpdated}
                  onRefresh={() => void loadData()}
                  chartData={chartData}
                  openRisks={openRisks.length}
                  delayedShipments={delayedShipments.length}
                  lowStockItems={lowStockItems.length}
                  criticalOrders={criticalOrders.length}
                  totalOrderValue={totalOrderValue}
                  activeShipments={activeShipments}
                  deliveredShipments={deliveredShipments}
                />
              }
            />
            <Route
              path="/dashboard"
              element={
                <Dashboard
                  data={data}
                  loading={loading}
                  lastUpdated={lastUpdated}
                  onRefresh={() => void loadData()}
                  chartData={chartData}
                  openRisks={openRisks.length}
                  delayedShipments={delayedShipments.length}
                  lowStockItems={lowStockItems.length}
                  criticalOrders={criticalOrders.length}
                  totalOrderValue={totalOrderValue}
                  activeShipments={activeShipments}
                  deliveredShipments={deliveredShipments}
                />
              }
            />
            <Route
               path="/network"
                  element={
                      <NetworkPage
                         shipments={data.shipments}
                         inventory={data.inventory}
                         suppliers={data.suppliers}
                         loading={loading}
                      />
                 }
             />
            <Route path="/shipments" element={<ShipmentsPage shipments={data.shipments} loading={loading} />} />
            <Route path="/inventory" element={<InventoryPage inventory={data.inventory} loading={loading} />} />
            <Route path="/risks" element={<RisksPage alerts={data.alerts} inventoryRisks={data.inventoryRisks} loading={loading} />} />
            <Route path="/suppliers" element={<SuppliersPage suppliers={data.suppliers} loading={loading} />} />
            <Route path="/replenishment" element={<ReplenishmentPage recommendations={data.replenishment} loading={loading} />} />
            <Route path="*" element={<NotFound />} />
          </Routes>

          <footer className="page-footer">
            <span>SUPPLYCHAIN SENTINEL <span className="footer-separator">/</span> OPERATIONS INTELLIGENCE</span>
            <span>Live operational data <span className="footer-separator">·</span> Local environment</span>
          </footer>
        </div>
      </main>
    </div>
  )
}

type DashboardProps = {
  data: DashboardData
  loading: boolean
  lastUpdated: Date | null
  onRefresh: () => void
  chartData: { day: string; shipments: number; risk: number }[]
  openRisks: number
  delayedShipments: number
  lowStockItems: number
  criticalOrders: number
  totalOrderValue: number
  activeShipments: number
  deliveredShipments: number
}

function Dashboard({
  data,
  loading,
  lastUpdated,
  onRefresh,
  chartData,
  openRisks,
  delayedShipments,
  lowStockItems,
  criticalOrders,
  totalOrderValue,
  activeShipments,
  deliveredShipments,
}: DashboardProps) {
  const [activityRange, setActivityRange] = useState('7D')

  return (
    <>
      <section className="welcome-row">
        <div>
          <div className="section-kicker"><span className="kicker-line" /> OPERATIONS CONTROL TOWER</div>
          <h1>See the signal.<br /><span>Stay ahead.</span></h1>
          <p className="welcome-description">
            Your supply network, in focus. Detect disruptions early and make
            confident operational decisions.
          </p>
        </div>
        <div className="welcome-actions">
          <div className="live-indicator"><span /> LIVE OPERATIONS</div>
          <button className="button button-secondary" onClick={onRefresh} disabled={loading}>
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
            {loading ? 'Refreshing' : 'Refresh data'}
          </button>
        </div>
        <div className="hero-orbit hero-orbit-one" />
        <div className="hero-orbit hero-orbit-two" />
        <div className="hero-node hero-node-one" />
        <div className="hero-node hero-node-two" />
        <div className="hero-node hero-node-three" />
        <div className="hero-signal"><Activity size={19} /></div>
        <span className="hero-coordinate">28.6139° N / 77.2090° E</span>
      </section>

      <div className="dashboard-meta">
        <div className="meta-left">
          <span className="meta-status-dot" />
          <span>Network status</span>
          <strong>{loading ? 'Synchronizing' : 'Monitoring active'}</strong>
        </div>
        <span className="updated-label">
          {lastUpdated ? `Last synced ${lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : 'Waiting for first sync'}
        </span>
      </div>

      <section className="metrics-grid" aria-label="Operational summary">
        <MetricCard
          label="Active shipments"
          value={String(activeShipments)}
          detail={`${deliveredShipments} delivered`}
          icon={<Truck size={18} />}
          trend="Operational"
          tone="neutral"
          loading={loading}
        />
        <MetricCard
          label="Open risk signals"
          value={String(openRisks)}
          detail={`${delayedShipments} delayed shipments`}
          icon={<ShieldAlert size={18} />}
          trend={openRisks > 0 ? 'Needs attention' : 'Clear'}
          tone={openRisks > 0 ? 'danger' : 'success'}
          loading={loading}
        />
        <MetricCard
          label="Low-stock items"
          value={String(lowStockItems)}
          detail={`${criticalOrders} critical orders`}
          icon={<Boxes size={18} />}
          trend={lowStockItems > 0 ? 'Below threshold' : 'Healthy'}
          tone={lowStockItems > 0 ? 'warning' : 'success'}
          loading={loading}
        />
        <MetricCard
          label="Suggested order value"
          value={formatCurrency(totalOrderValue)}
          detail="Estimated replenishment cost"
          icon={<Package size={18} />}
          trend="Planning"
          tone="neutral"
          loading={loading}
        />
      </section>

      <section className="dashboard-grid">
        <article className="panel activity-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">NETWORK ACTIVITY</span>
              <h2>Operational pulse</h2>
              <p>Shipment volume and risk signals</p>
            </div>
            <div className="range-switcher" aria-label="Chart time range">
              {['24H', '7D', '30D'].map((range) => (
                <button
                  key={range}
                  className={activityRange === range ? 'range-active' : ''}
                  onClick={() => setActivityRange(range)}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
          <div className="chart-legend">
            <span><i className="legend-shipments" /> Shipment activity</span>
            <span><i className="legend-risk" /> Risk signals</span>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="shipmentGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#C62840" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#C62840" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#D7A65A" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#D7A65A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} dy={10} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-primary)', fontSize: 12 }}
                  labelStyle={{ color: 'var(--text-secondary)', marginBottom: 5 }}
                />
                <Area type="monotone" dataKey="shipments" name="Shipment activity" stroke="#C62840" strokeWidth={2} fill="url(#shipmentGradient)" />
                <Area type="monotone" dataKey="risk" name="Risk signals" stroke="#D7A65A" strokeWidth={1.8} fill="url(#riskGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-footnote">
            <span><Activity size={14} /> Illustrative activity trend</span>
            <span>Risk counts use current API data</span>
          </div>
        </article>

        <article className="panel risk-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">PRIORITY QUEUE</span>
              <h2>Needs attention</h2>
              <p>Signals requiring operational review</p>
            </div>
            <NavLink to="/risks" className="text-link">View all <ArrowRight size={14} /></NavLink>
          </div>
          {loading && data.alerts.length === 0 && data.inventoryRisks.length === 0 ? (
            <LoadingState />
          ) : (
            <div className="risk-list">
              {[
                ...data.alerts.map((item) => ({
                  id: `s-${item.id}`,
                  title: item.shipmentReference,
                  detail: item.message,
                  severity: item.severity,
                  type: 'Shipment delay',
                  date: item.createdAt,
                })),
                ...data.inventoryRisks.map((item) => ({
                  id: `i-${item.id}`,
                  title: item.itemName,
                  detail: item.message,
                  severity: item.severity,
                  type: item.riskType.replaceAll('_', ' '),
                  date: item.createdAt,
                })),
              ].slice(0, 4).map((risk) => (
                <div className="risk-item" key={risk.id}>
                  <span className={`risk-symbol ${risk.severity.toLowerCase()}`}>
                    <AlertTriangle size={16} />
                  </span>
                  <div className="risk-copy">
                    <div className="risk-title-row">
                      <strong>{risk.title}</strong>
                      <Status value={risk.severity} />
                    </div>
                    <p>{risk.detail}</p>
                    <span className="risk-type">{risk.type} <span>·</span> {formatDate(risk.date)}</span>
                  </div>
                </div>
              ))}
              {data.alerts.length + data.inventoryRisks.length === 0 && (
                <EmptyState title="No open risk signals" detail="New alerts will appear here when detected by the backend." />
              )}
            </div>
          )}
          <NavLink to="/risks" className="panel-bottom-link">
            Open risk intelligence <ArrowRight size={14} />
          </NavLink>
        </article>
      </section>

      <section className="lower-grid">
        <article className="panel table-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">MOVEMENT VISIBILITY</span>
              <h2>Recent shipments</h2>
              <p>Latest records from the shipment service</p>
            </div>
            <NavLink to="/shipments" className="text-link">All shipments <ArrowRight size={14} /></NavLink>
          </div>
          <ShipmentsTable shipments={data.shipments.slice(0, 4)} loading={loading} compact />
        </article>

        <article className="panel inventory-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">STOCK INTELLIGENCE</span>
              <h2>Inventory health</h2>
              <p>Coverage against supplier lead times</p>
            </div>
            <NavLink to="/inventory" className="text-link">Details <ArrowRight size={14} /></NavLink>
          </div>
          {loading && data.inventory.length === 0 ? (
            <LoadingState />
          ) : data.inventory.length === 0 ? (
            <EmptyState title="No inventory records" detail="Inventory will appear when the API returns records." />
          ) : (
            data.inventory.slice(0, 3).map((item) => {
              const coverage = item.leadTimeDays > 0
                ? Math.min((item.estimatedDaysOfStock / item.leadTimeDays) * 100, 100)
                : 100
              return (
                <div className="inventory-health-row" key={item.id}>
                  <div className="inventory-product-mark"><Boxes size={18} /></div>
                  <div className="inventory-health-copy">
                    <div className="inventory-name-row">
                      <strong>{item.name}</strong>
                      <Status value={item.lowStock ? 'LOW STOCK' : 'HEALTHY'} />
                    </div>
                    <span>{item.sku} <span className="dot-separator">·</span> {item.warehouseLocation}</span>
                    <div className="stock-bar-track">
                      <div className={`stock-bar-fill ${coverage < 50 ? 'stock-bar-low' : ''}`} style={{ width: `${coverage}%` }} />
                    </div>
                    <div className="stock-meta">
                      <span>{item.quantityOnHand} units available</span>
                      <strong>{item.estimatedDaysOfStock.toFixed(1)} days coverage</strong>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </article>
      </section>

      <section className="bottom-summary">
        <div className="summary-icon"><Clock3 size={19} /></div>
        <div className="summary-copy">
          <span className="eyebrow">REPLENISHMENT OUTLOOK</span>
          <strong>{criticalOrders > 0 ? `${criticalOrders} critical replenishment ${criticalOrders === 1 ? 'recommendation' : 'recommendations'}` : 'Replenishment outlook'}</strong>
          <p>
            {data.replenishment.length > 0
              ? `${data.replenishment.length} recommendation(s) are available, with an estimated order value of ${formatCurrency(totalOrderValue)}.`
              : 'No replenishment recommendations are currently available.'}
          </p>
        </div>
        <NavLink to="/replenishment" className="button button-primary">
          Review orders <ArrowRight size={15} />
        </NavLink>
      </section>
    </>
  )
}

function MetricCard({
  label,
  value,
  detail,
  icon,
  trend,
  tone,
  loading,
}: {
  label: string
  value: string
  detail: string
  icon: React.ReactNode
  trend: string
  tone: string
  loading: boolean
}) {
  return (
    <article className="metric-card">
      <div className="metric-topline">
        <span className="metric-icon">{icon}</span>
        <span className={`metric-trend trend-${tone}`}>
          {tone === 'danger' ? <ArrowUpRight size={13} /> : tone === 'success' ? <CheckCircle2 size={13} /> : <ArrowDownRight size={13} />}
          {trend}
        </span>
      </div>
      <span className="metric-label">{label}</span>
      <strong className={`metric-value ${loading ? 'skeleton-text' : ''}`}>{value}</strong>
      <span className="metric-detail">{detail}</span>
    </article>
  )
}

function ShipmentsTable({
  shipments,
  loading,
  compact = false,
}: {
  shipments: Shipment[]
  loading: boolean
  compact?: boolean
}) {
  if (loading && shipments.length === 0) return <LoadingState />
  if (shipments.length === 0) {
    return <EmptyState title="No shipment records" detail="Shipment data will appear here when available." />
  }

  return (
    <div className="table-scroll">
      <table className={`data-table ${compact ? 'data-table-compact' : ''}`}>
        <thead>
          <tr>
            <th>SHIPMENT</th>
            <th>ROUTE</th>
            <th>EXPECTED DELIVERY</th>
            <th>STATUS</th>
          </tr>
        </thead>
        <tbody>
          {shipments.map((shipment) => (
            <tr key={shipment.id}>
              <td>
                <strong className="table-primary">{shipment.reference}</strong>
                <span className="table-secondary">{shipment.supplierName ?? 'Supplier not assigned'}</span>
              </td>
              <td>
                <span className="route-cell">{shipment.origin} <ArrowRight size={12} /> {shipment.destination}</span>
              </td>
              <td>{formatDate(shipment.expectedDelivery)}</td>
              <td><Status value={shipment.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function PageHeading({
  kicker,
  title,
  description,
}: {
  kicker: string
  title: string
  description: string
}) {
  return (
    <div className="page-heading">
      <span className="eyebrow">{kicker}</span>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  )
}
function ExportActions({
  filename,
  rows,
}: {
  filename: string
  rows: object[]
}) {
  return (
    <div className="export-actions">
      <button
        type="button"
        className="button button-secondary"
        onClick={() => exportCsv(filename, rows)}
      >
        <Download size={15} />
        Export CSV
      </button>
      <button
        type="button"
        className="button button-secondary"
        onClick={printReport}
      >
        <Printer size={15} />
        Print report
      </button>
    </div>
  )
}

function ShipmentsPage({ shipments, loading }: { shipments: Shipment[]; loading: boolean }) {
  const [filter, setFilter] = useState('ALL')
  const filtered = filter === 'ALL' ? shipments : shipments.filter((item) => item.status === filter)

  return (
    <>
      <PageHeading kicker="MOVEMENT VISIBILITY" title="Shipments" description="Track shipment movement, delivery commitments, and exceptions across your network." />
      <ExportActions filename="supplychain-shipments.csv" rows={shipments} />
      <div className="page-stats">
        <MiniStat label="Total records" value={shipments.length} />
        <MiniStat label="In progress" value={shipments.filter((s) => ['PENDING', 'IN_TRANSIT'].includes(s.status)).length} />
        <MiniStat label="Delayed" value={shipments.filter((s) => s.status === 'DELAYED').length} />
        <MiniStat label="Delivered" value={shipments.filter((s) => s.status === 'DELIVERED').length} />
      </div>
      <section className="panel full-table-panel">
        <div className="panel-heading">
          <div><span className="eyebrow">SHIPMENT REGISTER</span><h2>All shipment records</h2></div>
          <select className="filter-select" value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="Filter shipment status">
            <option value="ALL">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="IN_TRANSIT">In transit</option>
            <option value="DELAYED">Delayed</option>
            <option value="DELIVERED">Delivered</option>
          </select>
        </div>
        <ShipmentsTable shipments={filtered} loading={loading} />
      </section>
    </>
  )
}

function InventoryPage({ inventory, loading }: { inventory: InventoryItem[]; loading: boolean }) {
  return (
    <>
      <PageHeading kicker="STOCK INTELLIGENCE" title="Inventory" description="Monitor available stock, demand velocity, and the gap between stock coverage and supplier lead time." />
      <ExportActions filename="supplychain-inventory.csv" rows={inventory} />
      <div className="page-stats">
        <MiniStat label="Tracked items" value={inventory.length} />
        <MiniStat label="Below reorder point" value={inventory.filter((i) => i.lowStock).length} />
        <MiniStat label="Units on hand" value={inventory.reduce((s, i) => s + i.quantityOnHand, 0)} />
        <MiniStat label="Warehouse locations" value={new Set(inventory.map((i) => i.warehouseLocation)).size} />
      </div>
      <section className="panel full-table-panel">
        <div className="panel-heading"><div><span className="eyebrow">INVENTORY REGISTER</span><h2>Stock positions</h2></div><span className="table-record-count">{inventory.length} records</span></div>
        {loading && inventory.length === 0 ? <LoadingState /> : inventory.length === 0 ? <EmptyState title="No inventory data" detail="Check the inventory API response." /> : (
          <div className="table-scroll">
            <table className="data-table">
              <thead><tr><th>ITEM</th><th>WAREHOUSE</th><th>ON HAND</th><th>REORDER POINT</th><th>STOCK COVERAGE</th><th>STATUS</th></tr></thead>
              <tbody>{inventory.map((item) => (
                <tr key={item.id}>
                  <td><strong className="table-primary">{item.name}</strong><span className="table-secondary">{item.sku} · {item.category}</span></td>
                  <td>{item.warehouseLocation}</td>
                  <td><strong>{item.quantityOnHand}</strong> units</td>
                  <td>{item.reorderPoint} units</td>
                  <td><strong>{item.estimatedDaysOfStock.toFixed(1)} days</strong><span className="table-secondary">{item.leadTimeDays}-day supplier lead time</span></td>
                  <td><Status value={item.lowStock ? 'LOW STOCK' : 'HEALTHY'} /></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>
    </>
  )
}

function RisksPage({
  alerts,
  inventoryRisks,
  loading,
}: {
  alerts: RiskAlert[]
  inventoryRisks: InventoryRisk[]
  loading: boolean
}) {
  const risks = [
    ...alerts.map((risk) => ({ id: `a-${risk.id}`, name: risk.shipmentReference, kind: risk.riskType, message: risk.message, severity: risk.severity, status: risk.status, date: risk.createdAt })),
    ...inventoryRisks.map((risk) => ({ id: `i-${risk.id}`, name: risk.itemName, kind: risk.riskType, message: risk.message, severity: risk.severity, status: risk.status, date: risk.createdAt })),
  ]

  return (
    <>
      <PageHeading kicker="EARLY-WARNING SYSTEM" title="Risk intelligence" description="Review shipment exceptions and inventory risks before they become supply interruptions." />
      <ExportActions
        filename="supplychain-risks.csv"
        rows={risks.map((risk) => ({
          id: risk.id,
          entity: risk.name,
          riskType: risk.kind,
          message: risk.message,
          severity: risk.severity,
          status: risk.status,
          detectedAt: risk.date,
        }))}
      />
      <div className="page-stats">
        <MiniStat label="Risk signals" value={risks.length} />
        <MiniStat label="Open signals" value={risks.filter((r) => r.status === 'OPEN').length} />
        <MiniStat label="High severity" value={risks.filter((r) => ['HIGH', 'CRITICAL'].includes(r.severity)).length} />
        <MiniStat label="Data sources" value={2} />
      </div>
      <section className="panel full-table-panel">
        <div className="panel-heading"><div><span className="eyebrow">DETECTED EXCEPTIONS</span><h2>Risk signal register</h2></div><span className="table-record-count">Live API data</span></div>
        {loading && risks.length === 0 ? <LoadingState /> : risks.length === 0 ? <EmptyState title="No risk signals detected" detail="Risk records will appear here when available." /> : (
          <div className="table-scroll">
            <table className="data-table">
              <thead><tr><th>ENTITY</th><th>RISK TYPE</th><th>DETAIL</th><th>SEVERITY</th><th>STATUS</th><th>DETECTED</th></tr></thead>
              <tbody>{risks.map((risk) => (
                <tr key={risk.id}>
                  <td><strong className="table-primary">{risk.name}</strong></td>
                  <td>{risk.kind.replaceAll('_', ' ')}</td>
                  <td className="risk-message-cell">{risk.message}</td>
                  <td><Status value={risk.severity} /></td>
                  <td><Status value={risk.status} /></td>
                  <td>{formatDate(risk.date)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>
      <div className="disclaimer-note"><AlertTriangle size={16} /><p>Risk scores and alerts are decision-support signals. Review their supporting data before taking action.</p></div>
    </>
  )
}

function SuppliersPage({ suppliers, loading }: { suppliers: SupplierRisk[]; loading: boolean }) {
  return (
    <>
      <PageHeading kicker="PARTNER PERFORMANCE" title="Suppliers" description="Understand supplier delivery reliability, late deliveries, and the confidence level of available evidence." />
      <ExportActions filename="supplychain-suppliers.csv" rows={suppliers} />
      <div className="page-stats">
        <MiniStat label="Suppliers assessed" value={suppliers.length} />
        <MiniStat label="Completed deliveries" value={suppliers.reduce((s, v) => s + v.completedDeliveries, 0)} />
        <MiniStat label="Late deliveries" value={suppliers.reduce((s, v) => s + v.lateDeliveries, 0)} />
        <MiniStat label="Average on-time rate" value={`${suppliers.length ? (suppliers.reduce((s, v) => s + v.onTimeDeliveryRate, 0) / suppliers.length).toFixed(1) : '0.0'}%`} />
      </div>
      <section className="supplier-grid">
        {loading && suppliers.length === 0 ? <div className="panel"><LoadingState /></div> : suppliers.length === 0 ? <div className="panel"><EmptyState title="No supplier assessments" detail="Supplier risk data will appear here when available." /></div> : suppliers.map((supplier) => (
          <article className="panel supplier-card" key={supplier.supplierName}>
            <div className="supplier-card-top"><span className="supplier-logo"><Factory size={21} /></span><Status value={supplier.riskLevel} /></div>
            <span className="eyebrow">SUPPLIER PROFILE</span>
            <h2>{supplier.supplierName}</h2>
            <div className="supplier-score"><strong>{supplier.riskScore}</strong><span>/ 100 risk score</span></div>
            <div className="supplier-meter"><div style={{ width: `${Math.min(supplier.riskScore, 100)}%` }} /></div>
            <div className="supplier-kpis">
              <div><span>On-time delivery</span><strong>{supplier.onTimeDeliveryRate.toFixed(1)}%</strong></div>
              <div><span>Late deliveries</span><strong>{supplier.lateDeliveries} / {supplier.completedDeliveries}</strong></div>
              <div><span>Average delay</span><strong>{supplier.averageDelayDays.toFixed(2)} days</strong></div>
            </div>
            <div className="supplier-reasons"><span className="eyebrow">ASSESSMENT NOTES</span>{supplier.reasons.map((reason) => <p key={reason}><span />{reason}</p>)}</div>
            <div className="data-quality"><AlertTriangle size={14} /><span>Evidence quality: {supplier.dataQuality.replaceAll('_', ' ')}</span></div>
          </article>
        ))}
      </section>
    </>
  )
}

function ReplenishmentPage({ recommendations, loading }: { recommendations: ReplenishmentRecommendation[]; loading: boolean }) {
  const total = recommendations.reduce((sum, item) => sum + item.estimatedOrderCost, 0)
  const units = recommendations.reduce((sum, item) => sum + item.recommendedOrderQuantity, 0)

  return (
    <>
      <PageHeading kicker="DEMAND & SUPPLY PLANNING" title="Replenishment" description="Review suggested order quantities calculated from available stock, daily demand, and supplier lead times." />
      <ExportActions filename="supplychain-replenishment.csv" rows={recommendations} />
      <div className="page-stats">
        <MiniStat label="Recommendations" value={recommendations.length} />
        <MiniStat label="Suggested units" value={units} />
        <MiniStat label="Estimated order value" value={formatCurrency(total)} />
        <MiniStat label="Critical priorities" value={recommendations.filter((r) => r.priority === 'CRITICAL').length} />
      </div>
      <section className="panel full-table-panel">
        <div className="panel-heading"><div><span className="eyebrow">ORDER PLANNING</span><h2>Recommended replenishment</h2></div><span className="table-record-count">Advisory recommendations</span></div>
        {loading && recommendations.length === 0 ? <LoadingState /> : recommendations.length === 0 ? <EmptyState title="No recommendations available" detail="Replenishment recommendations will appear when the backend returns them." /> : (
          <div className="table-scroll">
            <table className="data-table">
              <thead><tr><th>ITEM</th><th>AVAILABLE</th><th>STOCK COVERAGE</th><th>ORDER QTY</th><th>ESTIMATED COST</th><th>PRIORITY</th></tr></thead>
              <tbody>{recommendations.map((item) => (
                <tr key={item.inventoryItemId}>
                  <td><strong className="table-primary">{item.itemName}</strong><span className="table-secondary">{item.sku} · {item.supplierName}</span></td>
                  <td>{item.quantityOnHand} units</td>
                  <td><strong>{item.estimatedDaysOfStock.toFixed(1)} days</strong><span className="table-secondary">{item.leadTimeDays}-day lead time</span></td>
                  <td><strong className="order-quantity">{item.recommendedOrderQuantity}</strong> units</td>
                  <td><strong>{formatCurrency(item.estimatedOrderCost)}</strong></td>
                  <td><Status value={item.priority} /></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>
      {recommendations.map((item) => (
        <div className="recommendation-explanation" key={item.inventoryItemId}>
          <span className="recommendation-icon"><Package size={18} /></span>
          <div><strong>{item.itemName}: planning rationale</strong><p>{item.explanation}</p></div>
          <span className="advisory-label">ADVISORY ONLY</span>
        </div>
      ))}
      <div className="disclaimer-note"><AlertTriangle size={16} /><p>These are backend-generated recommendations, not purchase orders. Validate demand, supplier terms, and budget before placing an order.</p></div>
    </>
  )
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return <div className="mini-stat"><span>{label}</span><strong>{value}</strong></div>
}

function LoadingState() {
  return <div className="empty-state"><RefreshCw size={18} className="spin" /><span>Loading operational data…</span></div>
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return <div className="empty-state"><CheckCircle2 size={20} /><strong>{title}</strong><span>{detail}</span></div>
}

function NotFound() {
  return (
    <div className="not-found panel">
      <span className="eyebrow">404 / ROUTE NOT FOUND</span>
      <h1>This route is off the map.</h1>
      <p>The page you requested doesn't exist in this workspace.</p>
      <NavLink to="/dashboard" className="button button-primary">Return to overview <ArrowRight size={15} /></NavLink>
    </div>
  )
}

function NetworkPage({
  shipments,
  inventory,
  suppliers,
  loading,
}: {
  shipments: Shipment[]
  inventory: InventoryItem[]
  suppliers: SupplierRisk[]
  loading: boolean
}) {
  const [selectedShipment, setSelectedShipment] = useState<string | null>(null)

  const selected = shipments.find(
    (shipment) => shipment.reference === selectedShipment,
  )

  const locations = Array.from(
    new Set(
      shipments.flatMap((shipment) => [
        shipment.origin,
        shipment.destination,
      ]),
    ),
  )

  return (
    <>
      <PageHeading
        kicker="NETWORK INTELLIGENCE"
        title="Supply network explorer"
        description="Explore observed shipment routes, network locations, supplier reliability, and inventory exposure."
      />

      <div className="page-stats">
        <MiniStat label="Tracked shipments" value={shipments.length} />
        <MiniStat label="Observed locations" value={locations.length} />
        <MiniStat label="Suppliers assessed" value={suppliers.length} />
        <MiniStat
          label="Low-stock items"
          value={inventory.filter((item) => item.lowStock).length}
        />
      </div>

      <section className="panel network-panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">OBSERVED CONNECTIONS</span>
            <h2>Shipment route map</h2>
            <p>
              Routes are derived from shipment origin and destination fields.
            </p>
          </div>
          <span className="status status-neutral">
            {loading ? 'SYNCING' : 'LIVE DATA'}
          </span>
        </div>

        {shipments.length === 0 ? (
          <div className="network-empty">
            {loading
              ? 'Loading shipment connections…'
              : 'No shipment routes are available yet.'}
          </div>
        ) : (
          <div className="network-routes">
            {shipments.map((shipment, index) => {
              const active = selectedShipment === shipment.reference

              return (
                <button
                  type="button"
                  key={shipment.id}
                  className={`network-route ${active ? 'network-route-selected' : ''}`}
                  onClick={() =>
                    setSelectedShipment(
                      active ? null : shipment.reference,
                    )
                  }
                >
                  <span className="network-route-number">
                    {String(index + 1).padStart(2, '0')}
                  </span>

                  <span className="network-route-location">
                    <span className="network-node-dot" />
                    <strong>{shipment.origin}</strong>
                    <small>Origin</small>
                  </span>

                  <span className="network-route-connector">
                    <span />
                    <Truck size={17} />
                    <span />
                  </span>

                  <span className="network-route-location">
                    <span className="network-node-dot destination" />
                    <strong>{shipment.destination}</strong>
                    <small>Destination</small>
                  </span>

                  <span className="network-route-meta">
                    <strong>{shipment.reference}</strong>
                    <Status value={shipment.status} />
                  </span>
                  <ArrowRight size={16} className="network-route-arrow" />
                </button>
              )
            })}
          </div>
        )}

        {selected && (
          <div className="network-detail">
            <span className="eyebrow">SELECTED SHIPMENT</span>
            <h3>{selected.reference}</h3>
            <p>
              {selected.origin} → {selected.destination}
            </p>
            <div className="network-detail-grid">
              <div>
                <small>Supplier</small>
                <strong>{selected.supplierName || 'Not recorded'}</strong>
              </div>
              <div>
                <small>Expected delivery</small>
                <strong>{formatDate(selected.expectedDelivery)}</strong>
              </div>
              <div>
                <small>Actual delivery</small>
                <strong>{formatDate(selected.actualDelivery)}</strong>
              </div>
              <div>
                <small>Current status</small>
                <Status value={selected.status} />
              </div>
            </div>
          </div>
        )}
      </section>

      <div className="network-support-grid">
        <section className="panel network-support-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">PARTNER INTELLIGENCE</span>
              <h2>Supplier exposure</h2>
            </div>
            <Factory size={19} />
          </div>

          {suppliers.length === 0 ? (
            <p className="network-muted">No supplier assessments available.</p>
          ) : (
            suppliers.map((supplier) => (
              <div
                className="network-entity-row"
                key={supplier.supplierName}
              >
                <span className="network-entity-icon">
                  <Factory size={17} />
                </span>
                <div className="network-entity-copy">
                  <strong>{supplier.supplierName}</strong>
                  <small>
                    {supplier.completedDeliveries} completed deliveries
                    {' · '}
                    {supplier.onTimeDeliveryRate}% on time
                  </small>
                </div>
                <Status value={supplier.riskLevel} />
              </div>
            ))
          )}
        </section>

        <section className="panel network-support-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">STOCK EXPOSURE</span>
              <h2>Warehouse inventory</h2>
            </div>
            <Boxes size={19} />
          </div>

          {inventory.length === 0 ? (
            <p className="network-muted">No inventory records available.</p>
          ) : (
            inventory.map((item) => (
              <div className="network-entity-row" key={item.id}>
                <span className="network-entity-icon">
                  <Package size={17} />
                </span>
                <div className="network-entity-copy">
                  <strong>{item.name}</strong>
                  <small>
                    {item.sku} · {item.warehouseLocation}
                  </small>
                  <small>
                    {item.quantityOnHand} units on hand · reorder at{' '}
                    {item.reorderPoint}
                  </small>
                </div>
                <Status value={item.lowStock ? 'LOW' : 'HEALTHY'} />
              </div>
            ))
          )}
        </section>
      </div>

      <div className="network-disclaimer">
        <Activity size={17} />
        <p>
          <strong>Data integrity note</strong>
          This explorer displays recorded shipment routes and separately
          lists supplier and inventory assessments. A supplier-to-warehouse
          dependency is not inferred unless the backend explicitly records it.
        </p>
      </div>
    </>
  )
}

export default App