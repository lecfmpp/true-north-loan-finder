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
        headline: "Business Loans for Construction in Canada",
        description: "Securing a **small business loan in Canada** is often the key to bidding on bigger construction projects. We provide the capital needed to purchase equipment and manage cash flow with confidence."
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
        headline: "Business Loans for Restaurants in Canada",
        description: "The restaurant industry faces unique cash flow challenges. Our **Canadian business loan** solutions help you manage seasonal fluctuations, upgrade equipment, and expand your operations."
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
        headline: "Business Loans for Retail in Canada",
        description: "Whether you're expanding inventory or launching online, **business financing in Canada** for retail businesses helps you stay competitive and grow your customer base."
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
        headline: "Business Loans for Medical Practices in Canada",
        description: "Medical practices require specialized equipment and often face long payment cycles. Our **small business loan in Canada** options are designed for healthcare professionals' unique needs."
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
        headline: "Business Loans for B2B Services in Canada",
        description: "Service businesses like staffing agencies and consulting firms need capital to scale operations and manage client payment delays. Our **Canadian business loan** solutions provide the flexibility you need."
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
    "name": "Industries We Serve - Small Business Loans in Canada",
    "description": "Specialized business financing in Canada for construction, restaurants, retail, medical practices, and B2B services. Get a Canadian business loan tailored for your industry.",
    "url": "https://truenorthbusinessloan.ca/industries-we-serve",
    "mainEntity": {
      "@type": "Service",
      "name": "Small Business Loans in Canada",
      "provider": {
        "@type": "Organization",
        "name": "True North Business Loan"
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Industries We Serve - Small Business Loans in Canada | True North Business Loan"
        description="Specialized business financing in Canada for construction, restaurants, retail, medical practices, and B2B services. Get a Canadian business loan tailored for your industry."
        keywords={["small business loans canada", "canadian business loan", "business financing canada", "construction loans", "restaurant financing", "retail loans", "medical practice loans"]}
        canonicalUrl="https://truenorthbusinessloan.ca/industries-we-serve"
        structuredData={structuredData}
      />
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary/10 to-secondary/10 py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl lg:text-6xl font-bold font-sans text-primary mb-6 leading-tight">
            Industries We Serve
          </h1>
          <h2 className="text-2xl lg:text-3xl font-bold font-sans text-secondary mb-6">
            Small Business Loans in Canada, Tailored for Your Industry
          </h2>
          <p className="text-lg lg:text-xl text-muted-foreground max-w-4xl mx-auto font-serif mb-8">
            We provide specialized <strong>business financing in Canada</strong> to help entrepreneurs overcome their unique challenges. From a <strong>Canadian business loan</strong> for expansion to equipment financing, we have the right funding for your company.
          </p>
          <Button asChild size="lg" variant="cta">
            <Link to="/loan-estimator">
              Get Your Free Estimate
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Industries Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="space-y-16 max-w-7xl mx-auto">
            {industries.map((industry, index) => (
              <Card key={industry.id} className="overflow-hidden border border-muted/20 shadow-lg">
                <div className={`grid lg:grid-cols-2 gap-0 ${index % 2 === 1 ? 'lg:grid-flow-col-dense' : ''}`}>
                  {/* Industry Image */}
                  <div className={`relative h-64 lg:h-auto ${index % 2 === 1 ? 'lg:col-start-2' : ''}`}>
                    <img 
                      src={industry.image} 
                      alt={`${industry.title} business financing`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <div className="absolute bottom-4 left-4 flex items-center space-x-2">
                      <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                        {industry.icon}
                      </div>
                      <h3 className="text-white font-bold text-xl">{industry.title}</h3>
                    </div>
                  </div>

                  {/* Content */}
                  <div className={`p-8 lg:p-12 ${index % 2 === 1 ? 'lg:col-start-1' : ''}`}>
                    {/* The Challenge */}
                    <div className="mb-8">
                      <h3 className="text-2xl font-bold font-sans text-primary mb-4">
                        {industry.challenge.headline}
                      </h3>
                      <p className="text-muted-foreground text-lg font-serif leading-relaxed">
                        {industry.challenge.description.split('**').map((part, i) => 
                          i % 2 === 1 ? <strong key={i} className="text-primary">{part}</strong> : part
                        )}
                      </p>
                    </div>

                    {/* Recommended Solutions */}
                    <div className="mb-8">
                      <h4 className="text-xl font-bold font-sans text-primary mb-4">
                        Recommended Business Financing for {industry.title.split(' &')[0]}
                      </h4>
                      <div className="space-y-4">
                        {industry.solutions.map((solution, solutionIndex) => (
                          <div key={solutionIndex} className="flex items-start space-x-3">
                            <div className="w-2 h-2 bg-secondary rounded-full mt-2 flex-shrink-0" />
                            <div>
                              <h5 className="font-semibold text-primary">{solution.title}</h5>
                              <p className="text-muted-foreground text-sm">{solution.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Cash Flow Impact */}
                    <div className="mb-8">
                      <h4 className="text-xl font-bold font-sans text-primary mb-4">
                        How a Canadian Business Loan Transforms Your Cash Flow
                      </h4>
                      <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg p-6">
                        <div className="flex items-end justify-between h-32 space-x-2">
                          {cashFlowData.map((data, chartIndex) => (
                            <div key={chartIndex} className="flex-1 flex flex-col items-center space-y-2">
                              <div className="flex flex-col items-center space-y-1 h-24 justify-end">
                                {/* After funding bar */}
                                <div 
                                  className="w-full bg-secondary rounded-t"
                                  style={{ height: `${(data.after / 52000) * 80}px` }}
                                />
                                {/* Before funding bar (if different) */}
                                {data.before !== data.after && (
                                  <div 
                                    className="w-full bg-muted/40 border-2 border-dashed border-muted-foreground/30"
                                    style={{ height: `${(data.before / 52000) * 80}px` }}
                                  />
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground font-medium">{data.month.replace('Month ', 'M')}</span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 flex items-center justify-center space-x-6 text-sm">
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
                      <h4 className="text-lg font-bold font-sans text-primary mb-3">
                        Get Your {industry.title.split(' &')[0]} Loan Estimate
                      </h4>
                      <p className="text-muted-foreground mb-4 font-serif">
                        Use our free <strong className="text-primary">business loan estimator</strong> to see how much funding your {industry.title.toLowerCase()} can get. This simple tool helps you understand your options for a <strong className="text-primary">small business loan in Canada</strong>.
                      </p>
                      <Button asChild className="w-full lg:w-auto bg-accent hover:bg-accent/90 text-accent-foreground font-bold">
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
      <section className="py-16 bg-gradient-to-r from-primary/10 to-secondary/10">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold font-sans text-primary mb-4">
            Ready to Get Your Industry-Specific Funding?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8 font-serif">
            Don't let cash flow challenges hold your business back. Our <strong className="text-primary">business loan estimator</strong> will show you exactly what funding options are available for your industry.
          </p>
          <Button asChild size="lg" variant="cta">
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