import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, BrowserRouter } from "react-router-dom";
import { ChatWidget } from "@/components/ChatWidget";
import ConsentBanner from "@/components/ConsentBanner";
import { lazy, Suspense } from "react";

import ScrollToTop from "@/components/ScrollToTop";
import { AuthProvider } from "@/hooks/use-auth";

// Critical pages loaded immediately for better UX
import Home from "./pages/Home";
import Quiz from "./pages/Quiz";
import Results from "./pages/Results";

// Lazy load non-critical pages for better performance
const HowItWorks = lazy(() => import("./pages/HowItWorks"));
const About = lazy(() => import("./pages/About"));
const Partners = lazy(() => import("./pages/Partners"));
const IndustriesWeServe = lazy(() => import("./pages/IndustriesWeServe"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const EquipmentFinancing = lazy(() => import("./pages/EquipmentFinancing"));
const SmallBusinessLoans = lazy(() => import("./pages/SmallBusinessLoans"));
const MerchantCashAdvance = lazy(() => import("./pages/MerchantCashAdvance"));
const InvoiceFactoring = lazy(() => import("./pages/InvoiceFactoring"));
const Auth = lazy(() => import("./pages/Auth"));
const Admin = lazy(() => import("./pages/Admin"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const Compare = lazy(() => import("./pages/Compare"));
const Application = lazy(() => import("./pages/Application"));
const ApplicationSuccess = lazy(() => import("./pages/ApplicationSuccess"));
const ApplicationStatus = lazy(() => import("./pages/ApplicationStatus"));
const CanadianApplication = lazy(() => import("./pages/CanadianApplication"));
const BrokerSignup = lazy(() => import("./pages/BrokerSignup"));
const BrokerPaymentSuccess = lazy(() => import("./pages/BrokerPaymentSuccess"));
const ConfirmPartner = lazy(() => import("./pages/ConfirmPartner"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Loading component for lazy routes
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <ChatWidget />
        <ConsentBanner />
        
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/loan-estimator" element={<Quiz />} />
            <Route path="/results/:responseId" element={<Results />} />
            <Route path="/how-it-works" element={
              <Suspense fallback={<PageLoader />}>
                <HowItWorks />
              </Suspense>
            } />
            <Route path="/about" element={
              <Suspense fallback={<PageLoader />}>
                <About />
              </Suspense>
            } />
            <Route path="/partners" element={
              <Suspense fallback={<PageLoader />}>
                <Partners />
              </Suspense>
            } />
            <Route path="/industries-we-serve" element={
              <Suspense fallback={<PageLoader />}>
                <IndustriesWeServe />
              </Suspense>
            } />
            <Route path="/blog" element={
              <Suspense fallback={<PageLoader />}>
                <Blog />
              </Suspense>
            } />
            <Route path="/blog/:slug" element={
              <Suspense fallback={<PageLoader />}>
                <BlogPost />
              </Suspense>
            } />
            <Route path="/equipment-financing" element={
              <Suspense fallback={<PageLoader />}>
                <EquipmentFinancing />
              </Suspense>
            } />
            <Route path="/small-business-loans" element={
              <Suspense fallback={<PageLoader />}>
                <SmallBusinessLoans />
              </Suspense>
            } />
            <Route path="/merchant-cash-advance" element={
              <Suspense fallback={<PageLoader />}>
                <MerchantCashAdvance />
              </Suspense>
            } />
            <Route path="/invoice-factoring" element={
              <Suspense fallback={<PageLoader />}>
                <InvoiceFactoring />
              </Suspense>
            } />
            <Route path="/compare" element={
              <Suspense fallback={<PageLoader />}>
                <Compare />
              </Suspense>
            } />
            <Route path="/application-usa" element={
              <Suspense fallback={<PageLoader />}>
                <Application />
              </Suspense>
            } />
            <Route path="/application-canadian" element={
              <Suspense fallback={<PageLoader />}>
                <CanadianApplication />
              </Suspense>
            } />
            <Route path="/application-success" element={
              <Suspense fallback={<PageLoader />}>
                <ApplicationSuccess />
              </Suspense>
            } />
            <Route path="/application-status" element={
              <Suspense fallback={<PageLoader />}>
                <ApplicationStatus />
              </Suspense>
            } />
            <Route path="/auth" element={
              <Suspense fallback={<PageLoader />}>
                <Auth />
              </Suspense>
            } />
            <Route path="/admin" element={
              <Suspense fallback={<PageLoader />}>
                <Admin />
              </Suspense>
            } />
            <Route path="/broker-signup" element={
              <Suspense fallback={<PageLoader />}>
                <BrokerSignup />
              </Suspense>
            } />
            <Route path="/broker-payment-success" element={
              <Suspense fallback={<PageLoader />}>
                <BrokerPaymentSuccess />
              </Suspense>
            } />
            <Route path="/confirm-partner" element={
              <Suspense fallback={<PageLoader />}>
                <ConfirmPartner />
              </Suspense>
            } />
            
            <Route path="/privacy" element={
              <Suspense fallback={<PageLoader />}>
                <PrivacyPolicy />
              </Suspense>
            } />
            <Route path="/terms" element={
              <Suspense fallback={<PageLoader />}>
                <TermsOfService />
              </Suspense>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={
              <Suspense fallback={<PageLoader />}>
                <NotFound />
              </Suspense>
            } />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
