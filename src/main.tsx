import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";

import { AuthProvider } from "@/lib/auth-context";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Layout from "@/components/layout/Layout";

import LoginPage from "@/pages/login";
import AuthCallbackPage from "@/pages/auth-callback";

import HomePage from "@/pages/home";
import BraveheartPage from "@/pages/braveheart";
import BankZeroPage from "@/pages/bankzero";
import WhatsAppPage from "@/pages/whatsapp";
import SubscriptionsPage from "@/pages/subscriptions";
import EcosystemPage from "@/pages/ecosystem";
import ProjectsPage from "@/pages/projects";
import ChroniclePage from "@/pages/chronicle";
import MediaPage from "@/pages/media";
import MarketingPage from "@/pages/marketing";
import NewsPage from "@/pages/news";
import NotesPage from "@/pages/notes";
import LinksPage from "@/pages/links";
import ConfigPage from "@/pages/config";

import ProductivityPanel from "@/components/ProductivityPanel";

/**
 * Route tree for the OS³ Command Centre.
 *
 *   /login            → public, no Layout (no sidebar/topbar/status bar)
 *   /auth/callback    → public, no Layout — landing page after magic link
 *   everything else   → wrapped in <ProtectedRoute><Layout /></ProtectedRoute>
 *
 * AuthProvider lives at the very top so both public and protected routes
 * can call useAuth() (login page needs `session` to redirect away if
 * already signed in).
 */
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes — outside the Layout (no chrome) */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />

          {/* Protected routes — wrapped in auth + Layout */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            {/* Default → /home */}
            <Route index element={<Navigate to="/home" replace />} />

            {/* 14 nav routes (order matches NAV_ITEMS in @/lib/nav-config) */}
            <Route path="/home"          element={<HomePage />} />
            <Route path="/braveheart"    element={<BraveheartPage />} />
            <Route path="/bankzero"      element={<BankZeroPage />} />
            <Route path="/whatsapp"      element={<WhatsAppPage />} />
            <Route path="/subscriptions" element={<SubscriptionsPage />} />
            <Route path="/ecosystem"     element={<EcosystemPage />} />
            <Route path="/projects"      element={<ProjectsPage />} />
            <Route path="/chronicle"     element={<ChroniclePage />} />
            <Route path="/media"         element={<MediaPage />} />
            <Route path="/marketing"     element={<MarketingPage />} />
            <Route path="/news"          element={<NewsPage />} />
            <Route path="/notes"         element={<NotesPage />} />
            <Route path="/links"         element={<LinksPage />} />
            <Route path="/config"        element={<ConfigPage />} />

            {/* Legacy direct route — productivity gadget. Eventually folds into HOME. */}
            <Route path="/productivity"  element={<ProductivityPanel />} />

            {/* Catch-all → /home */}
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
