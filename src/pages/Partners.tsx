import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowRight, Clock, DollarSign, Users, CheckCircle, Zap, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Partners = () => {
  const lenders = [
    {
      id: "iou-financial",
      name: "IOU Financial",
      logo: "/lovable-uploads/4daec7dc-f9e2-47a6-bb40-c02284d1869c.png",
      tagline: "Best for established businesses seeking significant term loans up to $1.5M",
      description: "A prominent online lender specializing in straightforward term loans for established small to medium-sized businesses, with a business model that is almost entirely partner-driven.",
      products: ["Business Loans"],
      fundingRange: "$15,000 to $1,500,000",
      termLength: "6 to 36 months",
      fundingSpeed: "Often within 24 hours",
      minTimeInBusiness: "1 year",
      minRevenue: "$120,000 / year",
      minCreditScore: null,
      idealProfile: "A business operating for over a year with stable annual revenue that needs a significant, straightforward term loan.",
      badge: "Large Amounts",
      badgeVariant: "secondary" as const,
      icon: DollarSign,
      borderColor: "border-l-secondary",
      bgGradient: "from-secondary/5 to-transparent"
    },
    {
      id: "driven",
      name: "Driven (formerly Thinking Capital)",
      logo: "/lovable-uploads/4619ca1e-cb30-44d9-a5b7-108a170d0e29.png",
      tagline: "Perfect for fast, digital applications and businesses operating for at least 6 months",
      description: "A major Canadian FinTech lender known for its fast, entirely digital application process and flexible repayment terms.",
      products: ["Small Business Loan", "Driven Express Funding"],
      fundingRange: "Up to $300,000",
      termLength: "3 to 24 months",
      fundingSpeed: "Fast (implied by all-digital process)",
      minTimeInBusiness: "6 months",
      minRevenue: "$120,000 / year",
      minCreditScore: "600+ FICO",
      idealProfile: "A business with at least 6 months of history and fair credit, whose owner values a quick, seamless digital experience.",
      badge: "Fast Digital",
      badgeVariant: "outline" as const,
      icon: Zap,
      borderColor: "border-l-primary",
      bgGradient: "from-primary/5 to-transparent"
    },
    {
      id: "greenbox-capital",
      name: "Greenbox Capital",
      logo: "/lovable-uploads/1369dfac-857f-43a9-8c07-79fde96a5512.png",
      tagline: "Excellent option for businesses with lower credit scores but strong monthly sales",
      description: "A flexible alternative lender that focuses on a business's overall potential, not just credit scores. They are known for funding businesses in high-risk industries and can provide capital within one business day.",
      products: ["Merchant Cash Advances", "Invoice Factoring", "Collateral Loans"],
      fundingRange: "$3,000 to $500,000",
      termLength: null,
      fundingSpeed: "Within one business day",
      minTimeInBusiness: "5 months",
      minRevenue: "$10,000 / month",
      minCreditScore: null,
      idealProfile: "Businesses with strong monthly sales but lower credit scores, including those in industries that traditional banks might avoid.",
      badge: "Flexible",
      badgeVariant: "default" as const,
      icon: Shield,
      borderColor: "border-l-accent",
      bgGradient: "from-accent/10 to-transparent"
    },
    {
      id: "merchant-growth",
      name: "Merchant Growth",
      logo: "/lovable-uploads/77b173e0-4da2-4b65-a106-fddb77e38ed9.png",
      tagline: "A great all-around option with specialized financing for E-commerce businesses",
      description: "A Canadian lender providing a variety of financing solutions, including specialized e-commerce financing, with an emphasis on a fast and simple application process.",
      products: ["Term Financing", "Line of Credit", "E-commerce Financing"],
      fundingRange: "$5,000 to $800,000",
      termLength: null,
      fundingSpeed: null,
      minTimeInBusiness: "6 months",
      minRevenue: "$10,000 / month",
      minCreditScore: null,
      idealProfile: "A good all-around option for many SMEs, but particularly strong for e-commerce businesses needing capital for ad spend or inventory.",
      badge: "E-commerce",
      badgeVariant: "secondary" as const,
      icon: Users,
      borderColor: "border-l-secondary",
      bgGradient: "from-secondary/5 to-transparent"
    },
    {
      id: "2m7-financial",
      name: "2M7 Financial Solutions",
      logo: "/lovable-uploads/7076f51c-91be-4e0f-9ca9-1d7b58a2102f.png",
      tagline: "Specializes in Merchant Cash Advances for newer businesses with strong revenue",
      description: "An independent direct funder that focuses exclusively on Merchant Cash Advances (MCAs) with very accessible qualification criteria.",
      products: ["Merchant Cash Advances"],
      fundingRange: "$5,000 to $300,000",
      termLength: null,
      fundingSpeed: null,
      minTimeInBusiness: "3 months",
      minRevenue: "$15,000 / month",
      minCreditScore: null,
      idealProfile: "A newer business (operating as little as 3 months) that has strong, consistent monthly revenue and needs fast access to capital.",
      badge: "MCA Specialist",
      badgeVariant: "outline" as const,
      icon: Clock,
      borderColor: "border-l-primary",
      bgGradient: "from-primary/5 to-transparent"
    },
    {
      id: "northpoint-commercial",
      name: "Northpoint Commercial Finance",
      logo: "/lovable-uploads/2fda5b2f-b4ca-46ae-b567-6bfdeeaf3c3e.png",
      tagline: "A leading specialist for financing new or used commercial equipment",
      description: "A key player in the equipment financing vertical, working directly with equipment vendors and brokers to finance the acquisition of physical assets.",
      products: ["Equipment Leasing & Financing"],
      fundingRange: "Varies based on equipment cost",
      termLength: "Varies based on asset life",
      fundingSpeed: null,
      minTimeInBusiness: null,
      minRevenue: null,
      minCreditScore: null,
      idealProfile: "Any business in a capital-intensive industry (like construction or transportation) that needs to purchase a specific piece of new or used equipment.",
      badge: "Equipment",
      badgeVariant: "default" as const,
      icon: DollarSign,
      borderColor: "border-l-accent",
      bgGradient: "from-accent/10 to-transparent"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary/10 to-secondary/10 py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl lg:text-6xl font-bold font-sans text-primary mb-6 leading-tight">
            Meet Our Trusted
            <span className="text-secondary"> Lending Partners</span>
          </h1>
          <p className="text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto font-serif mb-8">
            We've carefully vetted each lender to ensure they offer competitive rates, transparent terms, and excellent service to Canadian businesses.
          </p>
          <Button asChild size="lg" variant="cta">
            <Link to="/quiz">
              Find Your Perfect Match
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Partners Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold font-sans text-primary mb-4">
              Choose from Canada's Top Business Lenders
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Each partner has been selected for their expertise, reliability, and commitment to helping Canadian businesses succeed.
            </p>
          </div>

          {/* Responsive Grid: 2 columns on desktop, 1 on mobile */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
            {lenders.map((lender) => (
              <Card key={lender.id} className="bg-white hover:shadow-xl transition-all duration-300 overflow-hidden border-0 shadow-md">
                <CardContent className="p-6">
                  {/* Logo */}
                  <div className="flex justify-center mb-6">
                    {lender.logo ? (
                      <div className="w-32 h-20 flex items-center justify-center">
                        <img 
                          src={lender.logo} 
                          alt={`${lender.name} logo`} 
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <lender.icon className="h-8 w-8 text-primary" />
                      </div>
                    )}
                  </div>

                  {/* Lender Name */}
                  <h3 className="text-xl font-bold text-primary text-center mb-3">
                    {lender.name}
                  </h3>

                  {/* "Best For" Tagline */}
                  <div className="flex justify-center mb-6">
                    <Badge variant="secondary" className="text-sm font-medium px-4 py-2 bg-secondary text-secondary-foreground">
                      {lender.badge}
                    </Badge>
                  </div>

                  {/* Key Metrics Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center space-x-2 text-sm">
                      <DollarSign className="h-4 w-4 text-primary shrink-0" />
                      <div>
                        <div className="font-semibold text-primary">{lender.fundingRange}</div>
                        <div className="text-muted-foreground text-xs">Funding Amount</div>
                      </div>
                    </div>
                    
                    {lender.fundingSpeed && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Zap className="h-4 w-4 text-primary shrink-0" />
                        <div>
                          <div className="font-semibold text-primary">{lender.fundingSpeed}</div>
                          <div className="text-muted-foreground text-xs">Funding Speed</div>
                        </div>
                      </div>
                    )}
                    
                    {lender.minTimeInBusiness && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Clock className="h-4 w-4 text-primary shrink-0" />
                        <div>
                          <div className="font-semibold text-primary">{lender.minTimeInBusiness}</div>
                          <div className="text-muted-foreground text-xs">Min. Time in Business</div>
                        </div>
                      </div>
                    )}
                    
                    {lender.minRevenue && (
                      <div className="flex items-center space-x-2 text-sm">
                        <DollarSign className="h-4 w-4 text-primary shrink-0" />
                        <div>
                          <div className="font-semibold text-primary">{lender.minRevenue}</div>
                          <div className="text-muted-foreground text-xs">Min. Revenue</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Products */}
                  <div className="mb-6">
                    <div className="flex flex-wrap gap-2 justify-center">
                      {lender.products.slice(0, 2).map((product, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {product}
                        </Badge>
                      ))}
                      {lender.products.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{lender.products.length - 2} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* CTA Button */}
                  <div className="text-center">
                    <Button asChild className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold py-3">
                      <Link to="/quiz">
                        See My Loan Options
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold font-sans text-primary mb-4">
              Quick Comparison Guide
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Compare our lending partners at a glance to find the best fit for your business needs.
            </p>
          </div>

          <div className="overflow-x-auto">
            <Table className="w-full bg-background rounded-lg shadow-sm">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px] font-semibold">Lender</TableHead>
                  <TableHead className="font-semibold">Products</TableHead>
                  <TableHead className="font-semibold">Funding Range</TableHead>
                  <TableHead className="font-semibold">Min. Time in Business</TableHead>
                  <TableHead className="font-semibold">Min. Revenue</TableHead>
                  <TableHead className="font-semibold">Best For</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lenders.map((lender) => (
                  <TableRow key={lender.id} className="hover:bg-muted/20">
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-3">
                        {lender.logo ? (
                          <img 
                            src={lender.logo} 
                            alt={`${lender.name} logo`} 
                            className="w-20 h-20 object-contain"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded bg-primary/10 flex items-center justify-center">
                            <lender.icon className="h-6 w-6 text-primary" />
                          </div>
                        )}
                        <span className="text-sm font-medium">{lender.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {lender.products.slice(0, 2).map((product, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {product}
                          </Badge>
                        ))}
                        {lender.products.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{lender.products.length - 2} more
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{lender.fundingRange}</TableCell>
                    <TableCell className="text-sm">{lender.minTimeInBusiness || "N/A"}</TableCell>
                    <TableCell className="text-sm">{lender.minRevenue || "N/A"}</TableCell>
                    <TableCell className="text-sm max-w-[200px]">
                      <div className="truncate" title={lender.idealProfile}>
                        {lender.idealProfile}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary to-secondary py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold font-sans text-primary-foreground mb-4">
            Ready to Connect with the Right Lender?
          </h2>
          <p className="text-lg text-primary-foreground/90 max-w-2xl mx-auto mb-8">
            Take our 60-second quiz to get matched with lenders who are actively seeking businesses like yours.
          </p>
          <Button asChild size="lg" variant="secondary" className="shadow-lg">
            <Link to="/quiz">
              Start Your Loan Readiness Quiz
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Partners;