import { useEffect } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AdminRoute, CustomerRoute } from './components/common/ProtectedRoutes';
import { StoreLayout } from './components/layout/StoreLayout';
import { AuthProvider } from './contexts/AuthContext';
import { StoreProvider } from './contexts/StoreContext';
import { ToastProvider } from './contexts/ToastContext';

// Customer Storefront Pages
import { AccountPage } from './pages/store/AccountPage';
import { CartPage } from './pages/store/CartPage';
import { CategoriesPage } from './pages/store/CategoriesPage';
import { CheckoutPage } from './pages/store/CheckoutPage';
import { CmsPolicyPage } from './pages/store/CmsPolicyPage';
import { CoinsGamesPage } from './pages/store/CoinsGamesPage';
import { ContactPage } from './pages/store/ContactPage';
import { HomePage } from './pages/store/HomePage';
import { LoginPage } from './pages/store/LoginPage';
import { OrderConfirmationPage } from './pages/store/OrderConfirmationPage';
import { OrdersPage } from './pages/store/OrdersPage';
import { ProductDetailsPage } from './pages/store/ProductDetailsPage';
import { ProductsPage } from './pages/store/ProductsPage';
import { RegisterPage } from './pages/store/RegisterPage';
import { SettingsPage } from './pages/store/SettingsPage';
import { TrackOrderPage } from './pages/store/TrackOrderPage';
import { VouchersPage } from './pages/store/VouchersPage';
import { WishlistPage } from './pages/store/WishlistPage';

// Admin Console Pages
import { AdminBackupPage } from './pages/admin/AdminBackupPage';
import { AdminBannersPage } from './pages/admin/AdminBannersPage';
import { AdminCategoriesPage } from './pages/admin/AdminCategoriesPage';
import { AdminCoinsGamesPage } from './pages/admin/AdminCoinsGamesPage';
import { AdminCouponsPage } from './pages/admin/AdminCouponsPage';
import { AdminCustomersPage } from './pages/admin/AdminCustomersPage';
import { AdminDashboardHome } from './pages/admin/AdminDashboardHome';
import { AdminDiscountsPage } from './pages/admin/AdminDiscountsPage';
import { AdminFlashSalesPage } from './pages/admin/AdminFlashSalesPage';
import { AdminHomepagePage } from './pages/admin/AdminHomepagePage';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage';
import { AdminPaymentsPage } from './pages/admin/AdminPaymentsPage';
import { AdminProductFormPage } from './pages/admin/AdminProductFormPage';
import { AdminProductsPage } from './pages/admin/AdminProductsPage';
import { AdminProfilePage } from './pages/admin/AdminProfilePage';
import { AdminQuickStudioPage } from './pages/admin/AdminQuickStudioPage';
import { AdminReportsPage } from './pages/admin/AdminReportsPage';
import { AdminReviewsPage } from './pages/admin/AdminReviewsPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { AdminShippingPage } from './pages/admin/AdminShippingPage';
import { AdminUsersRolesPage } from './pages/admin/AdminUsersRolesPage';

import { savePendingReferralCode } from './lib/searchHistory';

function ScrollToTop() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname, search]);
  return null;
}

function ReferralCapture() {
  const { search } = useLocation();
  useEffect(() => {
    const ref = new URLSearchParams(search).get('ref');
    if (ref) {
      savePendingReferralCode(ref);
    }
  }, [search]);
  return null;
}

function StoreShell() {
  return (
    <StoreLayout>
      <Outlet />
    </StoreLayout>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ScrollToTop />
        <ReferralCapture />
        <ToastProvider>
          <AuthProvider>
            <StoreProvider>
              <Routes>
                {/* Public & Customer Storefront Routes */}
                <Route element={<StoreShell />}>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/categories" element={<CategoriesPage />} />
                  <Route path="/products" element={<ProductsPage />} />
                  <Route path="/product/:productId" element={<ProductDetailsPage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route
                    path="/checkout"
                    element={
                      <CustomerRoute>
                        <CheckoutPage />
                      </CustomerRoute>
                    }
                  />
                  <Route
                    path="/order-confirmation/:orderId"
                    element={
                      <CustomerRoute>
                        <OrderConfirmationPage />
                      </CustomerRoute>
                    }
                  />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/account" element={<AccountPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/vouchers" element={<VouchersPage />} />
                  <Route path="/coins-games" element={<CoinsGamesPage />} />
                  <Route path="/games" element={<CoinsGamesPage />} />
                  <Route
                    path="/orders"
                    element={
                      <CustomerRoute>
                        <OrdersPage />
                      </CustomerRoute>
                    }
                  />
                  <Route path="/track-order" element={<TrackOrderPage />} />
                  <Route path="/wishlist" element={<WishlistPage />} />
                  <Route
                    path="/about"
                    element={<CmsPolicyPage pageKey="aboutUs" title="About AS World" />}
                  />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route
                    path="/privacy"
                    element={<CmsPolicyPage pageKey="privacyPolicy" title="Privacy Policy" />}
                  />
                  <Route
                    path="/terms"
                    element={
                      <CmsPolicyPage pageKey="termsConditions" title="Terms & Conditions" />
                    }
                  />
                  <Route
                    path="/returns"
                    element={<CmsPolicyPage pageKey="returnPolicy" title="Return & Refund Policy" />}
                  />
                </Route>

                {/* Dedicated Admin Authentication & Console Routes */}
                <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="/admin/login" element={<AdminLoginPage />} />
                <Route
                  path="/admin/dashboard"
                  element={
                    <AdminRoute>
                      <AdminLayout />
                    </AdminRoute>
                  }
                >
                  <Route index element={<AdminDashboardHome />} />
                  <Route path="products" element={<AdminProductsPage />} />
                  <Route path="products/new" element={<AdminProductFormPage />} />
                  <Route path="products/edit/:productId" element={<AdminProductFormPage />} />
                  <Route
                    path="categories"
                    element={<AdminCategoriesPage defaultTab="categories" />}
                  />
                  <Route
                    path="subcategories"
                    element={<AdminCategoriesPage defaultTab="subcategories" />}
                  />
                  <Route path="orders" element={<AdminOrdersPage />} />
                  <Route path="customers" element={<AdminCustomersPage />} />
                  <Route path="banners" element={<AdminBannersPage />} />
                  <Route path="flash-sales" element={<AdminFlashSalesPage />} />
                  <Route path="coupons" element={<AdminCouponsPage />} />
                  <Route path="discounts" element={<AdminDiscountsPage />} />
                  <Route path="payments" element={<AdminPaymentsPage />} />
                  <Route path="shipping" element={<AdminShippingPage />} />
                  <Route path="reviews" element={<AdminReviewsPage />} />
                  <Route path="homepage" element={<AdminHomepagePage />} />
                  <Route
                    path="settings"
                    element={<AdminSettingsPage defaultTab="website" />}
                  />
                  <Route path="logo" element={<AdminSettingsPage defaultTab="logo" />} />
                  <Route path="quick-studio" element={<AdminQuickStudioPage />} />
                  <Route path="coins-games" element={<AdminCoinsGamesPage />} />
                  <Route path="profile" element={<AdminProfilePage />} />
                  <Route path="users" element={<AdminUsersRolesPage />} />
                  <Route path="reports" element={<AdminReportsPage />} />
                  <Route path="backup" element={<AdminBackupPage />} />
                </Route>

                {/* Fallback Route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </StoreProvider>
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
