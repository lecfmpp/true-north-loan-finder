import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight,
  TrendingUp,
  DollarSign,
  CreditCard,
  FileText,
  Hammer,
  ChefHat,
  ShoppingCart,
  Stethoscope,
  Users
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";

// Import industry images
import constructionImage from "@/assets/construction-industry.jpg";
import restaurantImage from "@/assets/restaurant-industry.jpg";
import retailImage from "@/assets/retail-industry.jpg";
import medicalImage from "@/assets/medical-industry.jpg";
import b2bServicesImage from "@/assets/b2b-services-industry.jpg";

const IndustriesWeServe = () => {
  // Cash flow chart data (simplified representation)
  const cashFlowData = [
    { month: "Month 1", before: 15000, after: 15000 },
    { month: "Month 2", before: 12000, after: 12000 },
    { month: "Month 3", before: 8000, after: 35000 }, // Funded month
    { month: "Month 4", before: 10000, after: 42000 },
    { month: "Month 5", before: 14000, after: 48000 },
    { month: "Month 6", before: 16000, after: 52000 }
  ];

  const industries = [
    {
      id: "construction",
      title: "Construction & Skilled Trades",
      image: constructionImage,
      icon: <Hammer className="h-6 w-6 text-secondary" />,
      challenge: {
        headline: "Business Loans for Construction in Canada & US",
        description: "Securing a **small business loan in Canada or the US** is often the key to bidding on bigger construction projects. We provide the capital needed to purchase equipment and manage cash flow with confidence."
      },
      solutions: [
        { title: "Equipment Financing", description: "The ideal business loan for new or used machinery." },
        { title: "Working Capital Loans", description: "Flexible funding to cover payroll during slow seasons." },
        { title: "Invoice Factoring", description: "Get immediate cash from outstanding project invoices." }
      ],
      ctaButton: "Estimate My Construction Funding"
    },
    {
      id: "restaurants",
      title: "Restaurants & Hospitality",
      image: restaurantImage,
      icon: <ChefHat className="h-6 w-6 text-secondary" />,
      challenge: {
        headline: "Business Loans for Restaurants in Canada & US",
        description: "The restaurant industry faces unique cash flow challenges. Our **business loan** solutions help you manage seasonal fluctuations, upgrade equipment, and expand your operations in Canada and the United States."
      },
      solutions: [
        { title: "Equipment Financing", description: "Fund kitchen equipment, POS systems, and renovations." },
        { title: "Working Capital Loans", description: "Bridge cash flow gaps during slower periods." },
        { title: "Merchant Cash Advances", description: "Fast funding based on your daily sales volume." }
      ],
      ctaButton: "Estimate My Restaurant Funding"
    },
    {
      id: "retail",
      title: "Retail & E-commerce",
      image: retailImage,
      icon: <ShoppingCart className="h-6 w-6 text-secondary" />,
      challenge: {
        headline: "Business Loans for Retail in Canada & US",
        description: "Whether you're expanding inventory or launching online, **business financing in Canada and the US** for retail businesses helps you stay competitive and grow your customer base."
      },
      solutions: [
        { title: "Inventory Financing", description: "Stock up for peak seasons and new product lines." },
        { title: "E-commerce Loans", description: "Fund online marketing and platform development." },
        { title: "Equipment Financing", description: "Upgrade POS systems and store fixtures." }
      ],
      ctaButton: "Estimate My Retail Funding"
    },
    {
      id: "medical",
      title: "Medical & Dental Practices",
      image: medicalImage,
      icon: <Stethoscope className="h-6 w-6 text-secondary" />,
      challenge: {
        headline: "Business Loans for Medical Practices in Canada & US",
        description: "Medical practices require specialized equipment and often face long payment cycles. Our **small business loan** options are designed for healthcare professionals' unique needs in both Canada and the United States."
      },
      solutions: [
        { title: "Equipment Financing", description: "Fund medical equipment and technology upgrades." },
        { title: "Practice Expansion Loans", description: "Open new locations or expand services." },
        { title: "Working Capital Loans", description: "Manage cash flow between insurance payments." }
      ],
      ctaButton: "Estimate My Practice Funding"
    },
    {
      id: "b2b-services",
      title: "B2B Services",
      image: b2bServicesImage,
      icon: <Users className="h-6 w-6 text-secondary" />,
      challenge: {
        headline: "Business Loans for B2B Services in Canada & US",
        description: "Service businesses like staffing agencies and consulting firms need capital to scale operations and manage client payment delays. Our **business loan** solutions provide the flexibility you need in Canada and the United States."
      },
      solutions: [
        { title: "Working Capital Loans", description: "Cover payroll and operating expenses during growth." },
        { title: "Invoice Factoring", description: "Get immediate cash from outstanding client invoices." },
        { title: "Business Lines of Credit", description: "Access funds as needed for new opportunities." }
      ],
      ctaButton: "Estimate My Service Business Funding"
    }
  ];

  // Structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Industries We Serve - Small Business Loans in Canada & US",
    "description": "Specialized business financing in Canada and the United States for construction, restaurants, retail, medical practices, and B2B services. Get a business loan tailored for your industry.",
    "url": "https://truenorthbusinessloan.ca/industries-we-serve",
    "mainEntity": {
      "@type": "Service",
      "name": "Small Business Loans in Canada & US",
      "provider": {
        "@type": "Organization",
        "name": "True North Business Loan"
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Industries We Serve - Small Business Loans in Canada & US | True North Business Loan"
        description="Specialized business financing in Canada and the United States for construction, restaurants, retail, medical practices, and B2B services. Get a business loan tailored for your industry."
        keywords={["small business loans canada", "small business loans usa", "business financing canada", "business financing usa", "construction loans", "restaurant financing", "retail loans", "medical practice loans"]}
        canonicalUrl="https://truenorthbusinessloan.ca/industries-we-serve"
        structuredData={structuredData}
      />
      <Header />
      
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl lg:text-5xl font-bold font-sans text-primary mb-6">
              Industries We Serve
            </h1>
            <h2 className="text-2xl lg:text-3xl font-bold font-sans text-secondary mb-6">
              Small Business Loans in Canada & US, Tailored for Your Industry
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-serif mb-8">
              We provide specialized <strong>business financing in Canada and the United States</strong> to help entrepreneurs overcome their unique challenges. From a <strong>business loan for expansion</strong> to equipment financing, we have the right funding for your company.
            </p>
            <Button asChild size="lg" variant="cta">
              <Link to="/loan-estimator">
                Get Your Free Estimate
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Industries Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="space-y-16 max-w-7xl mx-auto">
            {industries.map((industry, index) => (
              <Card key={industry.id} className="overflow-hidden border-0 shadow-[var(--shadow-card)] hover:shadow-lg transition-all duration-300">
                <div className="flex flex-col lg:grid lg:grid-cols-2 lg:gap-0">
                  {/* Industry Image */}
                  <div className={`relative h-48 md:h-64 lg:h-auto ${index % 2 === 1 ? 'lg:order-2' : 'lg:order-1'}`}>
                    <img 
                      src={industry.image} 
                      alt={`${industry.title} business financing`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <div className="absolute bottom-3 md:bottom-4 left-3 md:left-4 right-3 md:right-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center flex-shrink-0">
                          {industry.icon}
                        </div>
                        <h3 className="text-white font-bold text-base md:text-lg lg:text-xl break-words">{industry.title}</h3>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className={`p-4 md:p-6 lg:p-12 w-full ${index % 2 === 1 ? 'lg:order-1' : 'lg:order-2'}`}>
                    {/* The Challenge */}
                    <div className="mb-6 md:mb-8">
                      <h3 className="text-xl lg:text-2xl font-bold font-sans text-primary mb-4 break-words leading-tight">
                        {industry.challenge.headline}
                      </h3>
                      <p className="text-muted-foreground text-base lg:text-lg font-serif leading-relaxed break-words">
                        {industry.challenge.description.split('**').map((part, i) => 
                          i % 2 === 1 ? <strong key={i} className="text-primary">{part}</strong> : part
                        )}
                      </p>
                    </div>

                    {/* Recommended Solutions */}
                    <div className="mb-6 md:mb-8">
                      <h4 className="text-lg lg:text-xl font-bold font-sans text-primary mb-4 break-words leading-tight">
                        Recommended Business Financing for {industry.title.split(' &')[0]}
                      </h4>
                      <div className="space-y-4">
                        {industry.solutions.map((solution, solutionIndex) => (
                          <div key={solutionIndex} className="flex items-start space-x-3">
                            <div className="w-2 h-2 bg-secondary rounded-full mt-2 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <h5 className="font-semibold text-primary text-base break-words">{solution.title}</h5>
                              <p className="text-muted-foreground text-sm break-words leading-relaxed">{solution.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Cash Flow Impact */}
                    <div className="mb-6 md:mb-8">
                      <h4 className="text-lg lg:text-xl font-bold font-sans text-primary mb-4 break-words leading-tight">
                        How a Business Loan Transforms Your Cash Flow
                      </h4>
                      <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg p-6 w-full">
                        <div className="flex items-end justify-between h-32 space-x-2">
                          {cashFlowData.map((data, chartIndex) => (
                            <div key={chartIndex} className="flex-1 flex flex-col items-center space-y-2 min-w-0">
                              <div className="flex flex-col items-center space-y-1 h-24 justify-end w-full">
                                {/* After funding bar */}
                                <div 
                                  className="w-full bg-secondary rounded-t max-w-full"
                                  style={{ height: `${Math.min((data.after / 52000) * 40, 40)}px` }}
                                />
                                {/* Before funding bar (if different) */}
                                {data.before !== data.after && (
                                  <div 
                                    className="w-full bg-muted/40 border-2 border-dashed border-muted-foreground/30 max-w-full"
                                    style={{ height: `${Math.min((data.before / 52000) * 40, 40)}px` }}
                                  />
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground font-medium truncate">{data.month.replace('Month ', 'M')}</span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 flex flex-wrap items-center justify-center gap-6 text-sm">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-secondary rounded" />
                            <span className="text-muted-foreground">With Funding</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-muted/40 border border-dashed border-muted-foreground/30 rounded" />
                            <span className="text-muted-foreground">Without Funding</span>
                          </div>
                          {cashFlowData[2] && (
                            <Badge variant="secondary" className="text-xs">
                              <TrendingUp className="w-3 h-3 mr-1" />
                              Funded
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="border-t border-muted/20 pt-6">
                      <h4 className="text-lg font-bold font-sans text-primary mb-3 break-words leading-tight">
                        Get Your {industry.title.split(' &')[0]} Loan Estimate
                      </h4>
                      <p className="text-muted-foreground mb-4 font-serif text-base break-words leading-relaxed">
                        Use our free <strong className="text-primary">business loan estimator</strong> to see how much funding your {industry.title.toLowerCase()} can get. This simple tool helps you understand your options for a <strong className="text-primary">small business loan in Canada or the US</strong>.
                      </p>
                      <Button asChild className="w-full lg:w-auto bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-base">
                        <Link to="/loan-estimator">
                          <DollarSign className="w-4 h-4 mr-2" />
                          {industry.ctaButton}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-secondary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold font-sans mb-4">
            Ready to Get Your Industry-Specific Funding?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto font-serif">
            Don&apos;t let cash flow challenges hold your business back. Our <strong>business loan estimator</strong> will show you exactly what funding options are available for your industry.
          </p>
          <Button asChild size="lg" variant="secondary">
            <Link to="/loan-estimator">
              Get My Free Loan Estimate
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default IndustriesWeServe;