import { Suspense } from "react";
import { HashRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import { RouteModules } from "./lib/routePreload";

  const {
  Index,
  RegisterPage,
  ResetPasswordPage,
  AboutPage,
  HelpPage,
  ContactPage,
  TermsPage,
  PrivacyPage,
  HelpBotPage,
  SellPage,
  CartPage,
  Dashboard,
  AdminDashboard,
  ProductDetail,
  NotFound,
} = RouteModules;

const RouteLoader = () => (
  <div className="min-h-screen bg-background">
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-md space-y-3 text-center">
        <div className="mx-auto h-4 w-36 animate-pulse rounded-full bg-muted/80" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-32 animate-pulse rounded-2xl bg-muted/70" />
          <div className="h-32 animate-pulse rounded-2xl bg-muted/70" />
        </div>
      </div>
    </div>
  </div>
);

const App = () => (
  <HashRouter>
    <Suspense fallback={<RouteLoader />}>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/college/:collegeParam" element={<Index />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/help-bot" element={<HelpBotPage />} />
        <Route path="/sell" element={<SellPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  </HashRouter>
);

export default App;
