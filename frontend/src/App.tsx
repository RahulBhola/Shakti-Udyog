import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { Roles } from "./auth/roles";
import { PublicLayout } from "./components/PublicLayout";
import { CustomerLayout } from "./portal/CustomerLayout";
import { Navigate } from "react-router-dom";
import { Loading } from "./components/ui";
import { LoginPage } from "./features/auth/LoginPage";
import { AccessDeniedPage, UnauthorizedPage } from "./features/auth/ErrorPages";
import { PortalPlaceholder } from "./features/shared/PortalPlaceholder";
import "./styles/site.css";

// Route-level code splitting: each public page is its own chunk.
const HomePage = lazy(() => import("./pages/HomePage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const ProductsPage = lazy(() => import("./pages/ProductsPage"));
const ProductDetailPage = lazy(() => import("./pages/ProductDetailPage"));
const CapabilitiesPage = lazy(() => import("./pages/CapabilitiesPage"));
const QualityPage = lazy(() => import("./pages/QualityPage"));
const IndustriesPage = lazy(() => import("./pages/IndustriesPage"));
const ResourcesPage = lazy(() => import("./pages/ResourcesPage"));
const ResourceDetailPage = lazy(() => import("./pages/ResourceDetailPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const RequestQuotePage = lazy(() => import("./pages/RequestQuotePage"));
const LegalPage = lazy(() => import("./pages/LegalPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

// Customer portal chunks
const DashboardPage = lazy(() => import("./portal/pages/DashboardPage"));
const RfqListPage = lazy(() => import("./portal/pages/RfqListPage"));
const RfqNewPage = lazy(() => import("./portal/pages/RfqNewPage"));
const RfqDetailPage = lazy(() => import("./portal/pages/RfqDetailPage"));
const RfqEditPage = lazy(() => import("./portal/pages/RfqEditPage"));
const QuotationListPage = lazy(() =>
  import("./portal/pages/QuotationsPage").then((m) => ({ default: m.QuotationListPage })));
const QuotationDetailPage = lazy(() =>
  import("./portal/pages/QuotationsPage").then((m) => ({ default: m.QuotationDetailPage })));
const OrderListPage = lazy(() =>
  import("./portal/pages/OrdersPage").then((m) => ({ default: m.OrderListPage })));
const OrderDetailPage = lazy(() =>
  import("./portal/pages/OrdersPage").then((m) => ({ default: m.OrderDetailPage })));
const OrderTimelinePage = lazy(() =>
  import("./portal/pages/OrdersPage").then((m) => ({ default: m.OrderTimelinePage })));
const InvoiceListPage = lazy(() =>
  import("./portal/pages/InvoicesPage").then((m) => ({ default: m.InvoiceListPage })));
const InvoiceDetailPage = lazy(() =>
  import("./portal/pages/InvoicesPage").then((m) => ({ default: m.InvoiceDetailPage })));
const DocumentsPage = lazy(() => import("./portal/pages/DocumentsPage"));
const NotificationsPage = lazy(() => import("./portal/pages/NotificationsPage"));
const ProfilePage = lazy(() => import("./portal/pages/ProfilePage"));
const SupportPage = lazy(() => import("./portal/pages/SupportPage"));
const UpdaterQuotationLayout = lazy(() => import("./portal/pages/updater/UpdaterQuotationLayout"));
const UpdaterQuotationList = lazy(() => import("./portal/pages/updater/QuotationListPage"));
const CreateQuotationPage = lazy(() => import("./portal/pages/updater/CreateQuotationPage"));
const AdminQuotationDetailPage = lazy(() => import("./portal/pages/AdminQuotationPage"));
const AdminOrderDetailPage = lazy(() => import("./portal/pages/AdminOrderDetailPage"));

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<Loading label="Loading page" />}>
          <Routes>
            {/* Public website */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/products/:slug" element={<ProductDetailPage />} />
              <Route path="/capabilities" element={<CapabilitiesPage />} />
              <Route path="/quality" element={<QualityPage />} />
              <Route path="/industries" element={<IndustriesPage />} />
              <Route path="/resources" element={<ResourcesPage />} />
              <Route path="/resources/:slug" element={<ResourceDetailPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/request-a-quote" element={<RequestQuotePage />} />
              <Route path="/privacy-policy" element={<LegalPage slug="privacy-policy" title="Privacy Policy" />} />
              <Route path="/terms-of-use" element={<LegalPage slug="terms-of-use" title="Terms of Use" />} />
              <Route path="/cookie-policy" element={<LegalPage slug="cookie-policy" title="Cookie Policy" />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>

            {/* Authentication & future portals (Milestone 2 foundation) */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            <Route path="/access-denied" element={<AccessDeniedPage />} />
            {/* Customer portal — role-guarded; backend enforces authorization again. */}
            <Route
              path="/customer"
              element={
                <ProtectedRoute roles={[Roles.Customer]}>
                  <CustomerLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/customer/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="rfqs" element={<RfqListPage />} />
              <Route path="rfqs/new" element={<RfqNewPage />} />
              <Route path="rfqs/:id" element={<RfqDetailPage />} />
              <Route path="rfqs/:id/edit" element={<RfqEditPage />} />
              <Route path="quotations" element={<QuotationListPage />} />
              <Route path="quotations/:id" element={<QuotationDetailPage />} />
              <Route path="orders" element={<OrderListPage />} />
              <Route path="orders/:id" element={<OrderDetailPage />} />
              <Route path="orders/:id/timeline" element={<OrderTimelinePage />} />
              <Route path="invoices" element={<InvoiceListPage />} />
              <Route path="invoices/:id" element={<InvoiceDetailPage />} />
              <Route path="documents" element={<DocumentsPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="support" element={<SupportPage />} />
            </Route>
            <Route path="/portal/customer" element={<Navigate to="/customer" replace />} />
            <Route
              path="/portal/updater"
              element={
                <ProtectedRoute roles={[Roles.DataUpdater, Roles.Admin]}>
                  <PortalPlaceholder title="Data Updater Portal" milestone="Milestone 5" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/portal/updater/quotations"
              element={
                <ProtectedRoute roles={[Roles.DataUpdater, Roles.Admin]}>
                  <UpdaterQuotationLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<UpdaterQuotationList />} />
              <Route path="new" element={<CreateQuotationPage />} />
              <Route path=":id" element={<UpdaterQuotationList />} />
            </Route>
            <Route
              path="/portal/admin"
              element={
                <ProtectedRoute roles={[Roles.Admin]}>
                  <PortalPlaceholder title="Admin Portal" milestone="Milestone 5" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/portal/admin/quotations/:id"
              element={
                <ProtectedRoute roles={[Roles.Admin]}>
                  <AdminQuotationDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/portal/admin/orders/:id"
              element={
                <ProtectedRoute roles={[Roles.Admin]}>
                  <AdminOrderDetailPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
