import { HashRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import Index from "./pages/Index";
import AboutPage from "./pages/AboutPage";
import HelpPage from "./pages/HelpPage";
import ContactPage from "./pages/ContactPage";
import TermsPage from "./pages/TermsPage";
import PrivacyPage from "./pages/PrivacyPage";
import HelpBotPage from "./pages/HelpBotPage";
import SellPage from "./pages/SellPage";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ProductDetail from "./pages/ProductDetail";
import NotFound from "./pages/NotFound";

const App = () => (
  <HashRouter>
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/help" element={<HelpPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/help-bot" element={<HelpBotPage />} />
      <Route path="/sell" element={<SellPage />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/product/:id" element={<ProductDetail />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </HashRouter>
);

export default App;
