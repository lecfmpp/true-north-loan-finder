import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import { Routes, Route, BrowserRouter } from "react-router-dom";
// Defer heavy widgets to improve LCP/CLS
import { lazy, Suspense } from "react";
const LazyChatWidget = lazy(() => import("@/components/ChatWidget").then(m => ({ default: m.ChatWidget })));
const LazySocialProofWidget = lazy(() => import("@/components/SocialProofWidget"));
import ConsentBanner from "@/components/ConsentBanner";

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
const ApplicationUS = lazy(() => import("./pages/ApplicationUS"));
const ApplicationSuccess = lazy(() => import("./pages/ApplicationSuccess"));
const ApplicationStatus = lazy(() => import("./pages/ApplicationStatus"));
const CanadianApplication = lazy(() => import("./pages/CanadianApplication"));
const BrokerSignup = lazy(() => import("./pages/BrokerSignup"));
const BrokerPaymentSuccess = lazy(() => import("./pages/BrokerPaymentSuccess"));
// Removed ConfirmPartner component
const NotFound = lazy(() => import("./pages/NotFound"));

// Loading component for lazy routes
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);


const App = () => {
  const [widgetsReady, setWidgetsReady] = React.useState(false);
  React.useEffect(() => {
    const onLoad = () => setWidgetsReady(true);
    if (document.readyState === 'complete') setWidgetsReady(true);
    else window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, []);

  return (
    
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <ConsentBanner />
          
          {/* Defer non-critical widgets until after load */}
          <BrowserRouter>
            <ScrollToTop />
            <Suspense fallback={null}>
              {widgetsReady && <LazySocialProofWidget />}
            </Suspense>
            <Suspense fallback={null}>
              {widgetsReady && <LazyChatWidget />}
            </Suspense>
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
                  <ApplicationUS />
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
              {/* Removed confirm-partner route */}
              
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
    
  );
};

export default App;
