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
      logo: "/lovable-uploads/c648a402-4252-4e8a-8ec1-ec98595a2b96.png",
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

          <div className="grid gap-8 max-w-6xl mx-auto">
            {lenders.map((lender) => {
              const IconComponent = lender.icon;
              return (
                <Card key={lender.id} className={`border-l-4 ${lender.borderColor} bg-gradient-to-r ${lender.bgGradient} hover:shadow-lg transition-shadow`}>
                  <CardHeader>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        {lender.logo ? (
                          <div className="w-28 h-28 rounded-lg bg-white shadow-sm flex items-center justify-center p-3">
                            <img 
                              src={lender.logo} 
                              alt={`${lender.name} logo`} 
                              className="max-w-full max-h-full object-contain"
                            />
                          </div>
                        ) : (
                          <div className="p-3 rounded-full bg-background shadow-sm">
                            <IconComponent className="h-6 w-6 text-primary" />
                          </div>
                        )}
                        <div>
                          <CardTitle className="text-xl text-primary">{lender.name}</CardTitle>
                          <p className="text-secondary font-semibold mt-1">{lender.tagline}</p>
                        </div>
                      </div>
                      <Badge variant={lender.badgeVariant}>{lender.badge}</Badge>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">{lender.description}</p>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {/* Key Details Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-background/60 rounded-lg p-3">
                        <div className="font-semibold text-primary text-sm">{lender.fundingRange}</div>
                        <div className="text-muted-foreground text-xs">Funding Range</div>
                      </div>
                      {lender.termLength && (
                        <div className="bg-background/60 rounded-lg p-3">
                          <div className="font-semibold text-primary text-sm">{lender.termLength}</div>
                          <div className="text-muted-foreground text-xs">Term Length</div>
                        </div>
                      )}
                      {lender.fundingSpeed && (
                        <div className="bg-background/60 rounded-lg p-3">
                          <div className="font-semibold text-primary text-sm">{lender.fundingSpeed}</div>
                          <div className="text-muted-foreground text-xs">Funding Speed</div>
                        </div>
                      )}
                      {lender.minTimeInBusiness && (
                        <div className="bg-background/60 rounded-lg p-3">
                          <div className="font-semibold text-primary text-sm">{lender.minTimeInBusiness}</div>
                          <div className="text-muted-foreground text-xs">Min. Time in Business</div>
                        </div>
                      )}
                      {lender.minRevenue && (
                        <div className="bg-background/60 rounded-lg p-3">
                          <div className="font-semibold text-primary text-sm">{lender.minRevenue}</div>
                          <div className="text-muted-foreground text-xs">Min. Revenue</div>
                        </div>
                      )}
                      {lender.minCreditScore && (
                        <div className="bg-background/60 rounded-lg p-3">
                          <div className="font-semibold text-primary text-sm">{lender.minCreditScore}</div>
                          <div className="text-muted-foreground text-xs">Min. Credit Score</div>
                        </div>
                      )}
                    </div>

                    {/* Products & Services */}
                    <div>
                      <h4 className="font-semibold text-primary mb-2">Products & Services:</h4>
                      <div className="flex flex-wrap gap-2">
                        {lender.products.map((product, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {product}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Ideal Profile */}
                    <div>
                      <h4 className="font-semibold text-primary mb-2 flex items-center">
                        <CheckCircle className="h-4 w-4 mr-2 text-secondary" />
                        Ideal For:
                      </h4>
                      <p className="text-muted-foreground text-sm leading-relaxed">{lender.idealProfile}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
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
                            className="w-14 h-14 object-contain"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded bg-primary/10 flex items-center justify-center">
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