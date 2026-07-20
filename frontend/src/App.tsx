import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { Roles } from "./auth/roles";
import { PublicLayout } from "./components/PublicLayout";
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
            <Route
              path="/portal/customer"
              element={
                <ProtectedRoute roles={[Roles.Customer, Roles.Admin]}>
                  <PortalPlaceholder title="Customer Portal" milestone="Milestone 4" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/portal/updater"
              element={
                <ProtectedRoute roles={[Roles.DataUpdater, Roles.Admin]}>
                  <PortalPlaceholder title="Data Updater Portal" milestone="Milestone 5" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/portal/admin"
              element={
                <ProtectedRoute roles={[Roles.Admin]}>
                  <PortalPlaceholder title="Admin Portal" milestone="Milestone 5" />
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
