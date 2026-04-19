import { lazy } from "react";

type Importer<T extends React.ComponentType<any>> = () => Promise<{ default: T }>;

function lazyWithPreload<T extends React.ComponentType<any>>(importer: Importer<T>) {
  const Component = lazy(importer) as React.LazyExoticComponent<T> & {
    preload: Importer<T>;
  };
  Component.preload = importer;
  return Component;
}

export const RouteModules = {
  Index: lazyWithPreload(() => import("../pages/Index")),
  RegisterPage: lazyWithPreload(() => import("../pages/RegisterPage")),
  ResetPasswordPage: lazyWithPreload(() => import("../pages/ResetPasswordPage")),
  AboutPage: lazyWithPreload(() => import("../pages/AboutPage")),
  HelpPage: lazyWithPreload(() => import("../pages/HelpPage")),
  ContactPage: lazyWithPreload(() => import("../pages/ContactPage")),
  TermsPage: lazyWithPreload(() => import("../pages/TermsPage")),
  PrivacyPage: lazyWithPreload(() => import("../pages/PrivacyPage")),
  HelpBotPage: lazyWithPreload(() => import("../pages/HelpBotPage")),
  SellPage: lazyWithPreload(() => import("../pages/SellPage")),
  CartPage: lazyWithPreload(() => import("../pages/CartPageCompact")),
  Dashboard: lazyWithPreload(() => import("../pages/Dashboard")),
  AdminDashboard: lazyWithPreload(() => import("../pages/AdminDashboard")),
  ProductDetail: lazyWithPreload(() => import("../pages/ProductDetail")),
  NotFound: lazyWithPreload(() => import("../pages/NotFound")),
};

export function preloadRouteChunk(name: keyof typeof RouteModules) {
  void RouteModules[name].preload();
}

export function preloadCommonRoutes() {
  preloadRouteChunk("AboutPage");
  preloadRouteChunk("HelpPage");
  preloadRouteChunk("ContactPage");
  preloadRouteChunk("TermsPage");
  preloadRouteChunk("PrivacyPage");
  preloadRouteChunk("RegisterPage");
  preloadRouteChunk("SellPage");
  preloadRouteChunk("CartPage");
  preloadRouteChunk("Dashboard");
  preloadRouteChunk("ProductDetail");
}
