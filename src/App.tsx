import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, BrowserRouter } from "react-router-dom";
import { ChatWidget } from "@/components/ChatWidget";
import ConsentBanner from "@/components/ConsentBanner";

import ScrollToTop from "@/components/ScrollToTop";
import { AuthProvider } from "@/hooks/use-auth";
import Home from "./pages/Home";
import Quiz from "./pages/Quiz";
import HowItWorks from "./pages/HowItWorks";
import About from "./pages/About";
import Partners from "./pages/Partners";
import IndustriesWeServe from "./pages/IndustriesWeServe";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import EquipmentFinancing from "./pages/EquipmentFinancing";
import SmallBusinessLoans from "./pages/SmallBusinessLoans";
import MerchantCashAdvance from "./pages/MerchantCashAdvance";
import InvoiceFactoring from "./pages/InvoiceFactoring";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Results from "./pages/Results";
import Compare from "./pages/Compare";
import Application from "./pages/Application";
import ApplicationSuccess from "./pages/ApplicationSuccess";
import ApplicationStatus from "./pages/ApplicationStatus";
import CanadianApplication from "./pages/CanadianApplication";
import NotFound from "./pages/NotFound";

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
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/about" element={<About />} />
            <Route path="/partners" element={<Partners />} />
            <Route path="/industries-we-serve" element={<IndustriesWeServe />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/equipment-financing" element={<EquipmentFinancing />} />
            <Route path="/small-business-loans" element={<SmallBusinessLoans />} />
            <Route path="/merchant-cash-advance" element={<MerchantCashAdvance />} />
            <Route path="/invoice-factoring" element={<InvoiceFactoring />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/application-usa" element={<Application />} />
            <Route path="/application-canadian" element={<CanadianApplication />} />
            <Route path="/application-success" element={<ApplicationSuccess />} />
            <Route path="/application-status" element={<ApplicationStatus />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin" element={<Admin />} />
            
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
