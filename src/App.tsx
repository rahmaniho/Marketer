import { Suspense, lazy } from 'react';
import { HashRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { ToastProvider } from '@/components/ui';
import { AdminLayout, CustomerLayout, DemoBar } from '@/components/Layout';
import { useStore } from '@/store/useStore';

import Home from '@/pages/Home';
import Catalog from '@/pages/Catalog';
import DetergentHygiene from '@/pages/DetergentHygiene';
import MiscMarket from '@/pages/MiscMarket';
import ProductDetail from '@/pages/ProductDetail';
import Login from '@/pages/Login';
import Cart from '@/pages/Cart';
import Checkout from '@/pages/Checkout';
import Orders from '@/pages/Orders';
import OrderDetail from '@/pages/OrderDetail';
import Favorites from '@/pages/Favorites';
import Compare from '@/pages/Compare';
import Brands from '@/pages/Brands';
import BrandDetail from '@/pages/BrandDetail';
import Categories from '@/pages/Categories';
import Offers from '@/pages/Offers';
import Rfq from '@/pages/Rfq';
import Chat from '@/pages/Chat';
import Loyalty from '@/pages/Loyalty';
import Subscriptions from '@/pages/Subscriptions';
import GroupBuy from '@/pages/GroupBuy';
import Account from '@/pages/Account';
import Academy from '@/pages/Academy';
import AcademyArticle from '@/pages/AcademyArticle';
import Forum from '@/pages/Forum';
import Sustainability from '@/pages/Sustainability';
import About from '@/pages/About';
import NotFound from '@/pages/NotFound';

import RepApp from '@/pages/RepApp';
import DriverApp from '@/pages/DriverApp';
import SupplierPortal from '@/pages/SupplierPortal';

// پنل مدیریت به‌صورت تنبل (Lazy) بارگذاری می‌شود تا حجم صفحه اولِ سایت مشتری کم بماند
const AdminLogin = lazy(() => import('@/pages/admin/AdminLogin'));
const AdminDashboard = lazy(() => import('@/pages/admin/Dashboard'));
const AdminOrders = lazy(() => import('@/pages/admin/OrdersAdmin'));
const AdminCustomers = lazy(() => import('@/pages/admin/CustomersAdmin'));
const AdminOffers = lazy(() => import('@/pages/admin/OffersAdmin'));
const AdminRfq = lazy(() => import('@/pages/admin/RfqAdmin'));
const AdminLeads = lazy(() => import('@/pages/admin/LeadsAdmin'));
const AdminVisits = lazy(() => import('@/pages/admin/VisitsAdmin'));
const AdminContracts = lazy(() => import('@/pages/admin/ContractsAdmin'));
const AdminProducts = lazy(() => import('@/pages/admin/ProductsAdmin'));
const AdminBrands = lazy(() => import('@/pages/admin/BrandsAdmin'));
const AdminWarehouse = lazy(() => import('@/pages/admin/WarehouseAdmin'));
const AdminSuppliers = lazy(() => import('@/pages/admin/SuppliersAdmin'));
const AdminLogistics = lazy(() => import('@/pages/admin/LogisticsAdmin'));
const AdminBi = lazy(() => import('@/pages/admin/BiAdmin'));
const AdminReports = lazy(() => import('@/pages/admin/ReportsAdmin'));
const AdminTickets = lazy(() => import('@/pages/admin/TicketsAdmin'));
const AdminNotifications = lazy(() => import('@/pages/admin/NotificationsAdmin'));
const AdminUsers = lazy(() => import('@/pages/admin/UsersAdmin'));
const AdminAudit = lazy(() => import('@/pages/admin/AuditAdmin'));
const AdminIntegrations = lazy(() => import('@/pages/admin/IntegrationsAdmin'));
const AdminCompliance = lazy(() => import('@/pages/admin/ComplianceAdmin'));
const AdminSettings = lazy(() => import('@/pages/admin/SettingsAdmin'));
const AdminDh = lazy(() => import('@/pages/admin/DhAdmin'));
const AdminMisc = lazy(() => import('@/pages/admin/MiscAdmin'));

const Loading = ({ label = 'در حال بارگذاری…' }: { label?: string }) => (
  <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-ink-400">
    <span className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
    <p className="text-xs font-semibold">{label}</p>
  </div>
);

/** هدایت کاربر وارد‌نشده به صفحه ورود دمو */
const RequireCustomer = ({ children }: { children: React.ReactNode }) => {
  const customer = useStore((s) => s.customer);
  if (!customer) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

/** چیدمان صفحات مستقل (ویزیتور، راننده، پورتال تأمین‌کننده) */
const BareLayout = () => (
  <div className="min-h-dvh bg-ink-50 dark:bg-ink-950">
    <DemoBar />
    <Outlet />
  </div>
);

const App = () => {
  const theme = useStore((s) => s.theme);

  // همگام‌سازی کلاس تم با استور
  if (typeof document !== 'undefined') document.documentElement.classList.toggle('dark', theme === 'dark');

  return (
    <ToastProvider>
      <HashRouter>
        <Suspense fallback={<Loading />}>
          <Routes>
            {/* ───────── سایت مشتری */}
            <Route element={<CustomerLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/catalog" element={<Catalog />} />
              <Route path="/dh" element={<DetergentHygiene />} />
              <Route path="/misc" element={<MiscMarket />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/brands" element={<Brands />} />
              <Route path="/brand/:id" element={<BrandDetail />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/offers" element={<Offers />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/compare" element={<Compare />} />
              <Route path="/academy" element={<Academy />} />
              <Route path="/academy/:id" element={<AcademyArticle />} />
              <Route path="/forum" element={<Forum />} />
              <Route path="/sustainability" element={<Sustainability />} />
              <Route path="/about" element={<About />} />
              <Route path="/login" element={<Login />} />
              <Route
                path="/checkout"
                element={
                  <RequireCustomer>
                    <Checkout />
                  </RequireCustomer>
                }
              />
              <Route
                path="/orders"
                element={
                  <RequireCustomer>
                    <Orders />
                  </RequireCustomer>
                }
              />
              <Route
                path="/orders/:id"
                element={
                  <RequireCustomer>
                    <OrderDetail />
                  </RequireCustomer>
                }
              />
              <Route path="/loyalty" element={<Loyalty />} />
              <Route path="/rfq" element={<Rfq />} />
              <Route path="/subscriptions" element={<Subscriptions />} />
              <Route path="/group-buy" element={<GroupBuy />} />
              <Route
                path="/account"
                element={
                  <RequireCustomer>
                    <Account />
                  </RequireCustomer>
                }
              />
              <Route path="/chat" element={<Chat />} />
              <Route path="*" element={<NotFound />} />
            </Route>

            {/* ───────── اپلیکیشن‌های مستقل */}
            <Route element={<BareLayout />}>
              <Route path="/rep" element={<RepApp />} />
              <Route path="/driver" element={<DriverApp />} />
              <Route path="/supplier" element={<SupplierPortal />} />
            </Route>

            {/* ───────── پنل مدیریت */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="customers" element={<AdminCustomers />} />
              <Route path="offers" element={<AdminOffers />} />
              <Route path="rfq" element={<AdminRfq />} />
              <Route path="leads" element={<AdminLeads />} />
              <Route path="visits" element={<AdminVisits />} />
              <Route path="contracts" element={<AdminContracts />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="brands" element={<AdminBrands />} />
              <Route path="warehouse" element={<AdminWarehouse />} />
              <Route path="suppliers" element={<AdminSuppliers />} />
              <Route path="logistics" element={<AdminLogistics />} />
              <Route path="bi" element={<AdminBi />} />
              <Route path="reports" element={<AdminReports />} />
              <Route path="tickets" element={<AdminTickets />} />
              <Route path="notifications" element={<AdminNotifications />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="audit" element={<AdminAudit />} />
              <Route path="integrations" element={<AdminIntegrations />} />
              <Route path="compliance" element={<AdminCompliance />} />
              <Route path="dh" element={<AdminDh />} />
              <Route path="misc" element={<AdminMisc />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="supplier-portal" element={<SupplierPortal />} />
            </Route>
          </Routes>
        </Suspense>
      </HashRouter>
    </ToastProvider>
  );
};

export default App;
