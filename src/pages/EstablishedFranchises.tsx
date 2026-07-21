import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  TrendingUp, 
  Store, 
  Users,
  Clock,
  Shield,
  DollarSign,
  FileText,
  Calculator,
  Target,
  HelpCircle,
  ArrowRight
} from "lucide-react";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger 
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { MobileOptimizedImage } from "@/components/MobileOptimizedImage";
import { generateBusinessStructuredData, generateFAQStructuredData, generateIndustryKeywords } from "@/utils/seo-utils";
import franchiseBusinessImage from "@/assets/established-franchises-business.webp";

const EstablishedFranchises = () => {
  const benefits = [
    {
      icon: <Store className="h-6 w-6 text-secondary" />,
      title: "Proven Business Model",
      description: "Established franchises benefit from proven systems and brand recognition"
    },
    {
      icon: <Shield className="h-6 w-6 text-secondary" />,
      title: "Brand Support",
      description: "Access franchisor marketing, training, and operational support"
    },
    {
      icon: <Clock className="h-6 w-6 text-secondary" />,
      title: "Faster Growth",
      description: "Leverage existing brand equity to accelerate expansion"
    },
    {
      icon: <Users className="h-6 w-6 text-secondary" />,
      title: "Network Benefits",
      description: "Learn from other franchisees and share best practices"
    }
  ];

  const cashFlowData = [
    { month: "Q1", withoutFunding: 45000, withFunding: 65000 },
    { month: "Q2", withoutFunding: 48000, withFunding: 85000 },
    { month: "Q3", withoutFunding: 52000, withFunding: 95000 },
    { month: "Q4", withoutFunding: 55000, withFunding: 110000 }
  ];

  const franchiseComparison = [
    {
      aspect: "Initial Investment",
      franchise: "$50K - $500K",
      independent: "$25K - $250K",
      advantage: "Lower risk with proven model"
    },
    {
      aspect: "Brand Recognition",
      franchise: "Immediate",
      independent: "Years to build",
      advantage: "Faster customer acquisition"
    },
    {
      aspect: "Ongoing Support",
      franchise: "Continuous training & support",
      independent: "Self-managed",
      advantage: "Reduced learning curve"
    },
    {
      aspect: "Marketing",
      franchise: "National campaigns included",
      independent: "Full responsibility",
      advantage: "Professional marketing reach"
    },
    {
      aspect: "Growth Potential",
      franchise: "Multi-unit expansion",
      independent: "Unlimited creativity",
      advantage: "Scalable business model"
    }
  ];

  const useCases = [
    {
      icon: <Target className="h-8 w-8 text-primary" />,
      title: "Multi-Unit Expansion",
      description: "Open additional franchise locations in new territories",
      examples: ["New territory licensing", "Multi-unit development", "Market penetration", "Regional expansion"]
    },
    {
      icon: <Store className="h-8 w-8 text-primary" />,
      title: "Location Renovation",
      description: "Upgrade existing locations to meet brand standards",
      examples: ["Brand standard updates", "Equipment replacement", "Interior redesign", "Technology upgrades"]
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-primary" />,
      title: "Inventory & Working Capital",
      description: "Manage seasonal demands and operational cash flow",
      examples: ["Seasonal inventory", "Staff training costs", "Marketing campaigns", "Operating expenses"]
    },
    {
      icon: <Calculator className="h-8 w-8 text-primary" />,
      title: "Equipment Financing",
      description: "Purchase franchise-required equipment and technology",
      examples: ["Kitchen equipment", "POS systems", "Specialized machinery", "Vehicle fleets"]
    }
  ];

  const requirements = [
    "Active franchise agreement in good standing",
    "Minimum 12 months of operational history",
    "Monthly revenue of $50,000+",
    "Personal credit score of 650+",
    "Compliance with franchisor requirements",
    "Clear expansion or improvement plan"
  ];

  const faqData = [
    {
      question: "Can I get business loans for franchise expansion?",
      answer: "Yes, established franchises are excellent candidates for business loans. Lenders appreciate the proven business model, brand recognition, and franchisor support that reduces risk compared to independent businesses."
    },
    {
      question: "What makes franchise financing different?",
      answer: "Franchise financing often has more favorable terms because of the reduced risk profile. Lenders can evaluate the franchise concept's track record, the franchisor's support system, and your specific location's performance."
    },
    {
      question: "Do I need franchisor approval for loans?",
      answer: "Most franchise agreements require franchisor approval for certain types of financing, especially for expansion or major renovations. It's important to review your franchise agreement and coordinate with your franchisor."
    },
    {
      question: "How does cash flow work in franchise businesses?",
      answer: "Franchise cash flow typically includes revenue from sales, minus cost of goods sold, franchise royalties (usually 4-8%), marketing fees (2-4%), and operational expenses. The predictable nature of franchise operations often leads to more stable cash flow."
    },
    {
      question: "What loan amounts are available for franchises?",
      answer: "Loan amounts vary based on the franchise concept, location performance, and expansion plans. Established franchises can often secure $50K to $2M+ for multi-unit expansion or major renovations."
    }
  ];

  const businessModelSection = {
    title: "Understanding the Franchise Business Model",
    description: "Franchise businesses operate under a proven system where franchisees pay initial fees and ongoing royalties in exchange for brand rights, operational systems, and ongoing support. This model creates predictable revenue streams but requires careful cash flow management."
  };

  const cashFlowSection = {
    title: "How Franchise Cash Flow Typically Works",
    points: [
      "Revenue from daily sales operations",
      "Franchise royalty payments (4-8% of gross revenue)",
      "Marketing fund contributions (2-4% of gross revenue)",
      "Cost of goods sold and operational expenses",
      "Seasonal fluctuations based on industry and location",
      "Growth investments for expansion and improvements"
    ]
  };

  const businessSchema = {
    name: "Established Franchises",
    industry: "Franchise Operations", 
    description: "Specialized financing solutions for established franchise operations with proven business models and growth potential.",
    services: ["Franchise expansion loans", "Multi-unit financing", "Equipment upgrades", "Working capital"],
    location: "Canada",
    benefits: ["Fast approval process", "Flexible terms", "Competitive rates", "Franchise-specific expertise"]
  };

  const structuredData = generateBusinessStructuredData(businessSchema, "/established-franchises");
  const faqStructuredData = generateFAQStructuredData(faqData);
  const keywords = generateIndustryKeywords("franchise");

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Business Loans for Established Franchises | Franchise Financing Canada"
        description="Get business loans for established franchises. Expand your franchise locations, renovate existing stores, and manage working capital with specialized franchise financing in Canada."
        keywords={keywords}
        canonicalUrl="https://truenorthbusinessloan.ca/established-franchises"
        structuredData={[structuredData, faqStructuredData]}
      />
      <Header />
      
      {/* Hero Section */}
      <section className="py-12 md:py-16 lg:py-20 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4 md:mb-6 px-3 md:px-4 py-1 md:py-2 text-xs md:text-sm font-medium">
              Franchise Business Financing
            </Badge>
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold font-sans text-primary mb-4 md:mb-6 leading-tight">
              Business Loans for
              <span className="text-secondary"> Established Franchises</span>
            </h1>
            
            <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground mb-6 md:mb-8 max-w-3xl mx-auto font-serif px-2">
              Expand your franchise empire with $50K to $2M+ in financing. Fund new locations, renovations, and working capital for your established franchise business.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center mb-8 md:mb-12 px-4">
              <Button asChild variant="cta" size="lg" className="text-base md:text-lg px-6 md:px-8 w-full sm:w-auto">
                <Link to="/loan-estimator">Get My Franchise Loan Quote</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-base md:text-lg px-6 md:px-8 w-full sm:w-auto">
                <Link to="/how-it-works">How It Works</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Business Overview Section */}
      <section className="py-12 md:py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
              <div className="order-2 lg:order-1">
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold font-sans text-primary mb-4 md:mb-6">
                  Established Franchise Success
                </h2>
                <p className="text-base md:text-lg text-muted-foreground mb-4 md:mb-6 font-serif">
                  Franchise businesses benefit from proven business models, established brand recognition, and ongoing corporate support. With the right financing, franchise owners can expand locations, renovate existing stores, and optimize operations for maximum profitability.
                </p>
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div className="bg-background rounded-lg p-3 md:p-4 border">
                    <div className="text-xl md:text-2xl font-bold text-secondary mb-1">85%</div>
                    <div className="text-xs md:text-sm text-muted-foreground">Success Rate</div>
                  </div>
                  <div className="bg-background rounded-lg p-3 md:p-4 border">
                    <div className="text-xl md:text-2xl font-bold text-secondary mb-1">2.5x</div>
                    <div className="text-xs md:text-sm text-muted-foreground">ROI Potential</div>
                  </div>
                </div>
              </div>
              <div className="relative order-1 lg:order-2">
                <MobileOptimizedImage 
                  src={franchiseBusinessImage} 
                  alt="Established franchise business storefront with professional branding and customer activity"
                  className="w-full aspect-[4/3] rounded-xl shadow-xl"
                  priority={true}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Business Model Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold font-sans text-primary mb-4">
                {businessModelSection.title}
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-serif">
                {businessModelSection.description}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-16">
              <Card className="border-0 shadow-[var(--shadow-card)]">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold font-sans text-primary">
                    {cashFlowSection.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {cashFlowSection.points.map((point, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-secondary mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground font-serif">{point}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Cash Flow Chart */}
              <Card className="border-0 shadow-[var(--shadow-card)]">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold font-sans text-primary">
                    Franchise Growth with Funding
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={{ 
                    withoutFunding: { label: "Without Funding", color: "hsl(var(--muted))" },
                    withFunding: { label: "With Funding", color: "hsl(var(--secondary))" }
                  }} className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={cashFlowData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="withoutFunding" fill="var(--color-withoutFunding)" />
                        <Bar dataKey="withFunding" fill="var(--color-withFunding)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-12 md:py-16 lg:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold font-sans text-primary mb-3 md:mb-4">
              Why Established Franchises Get Better Loan Terms
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-serif px-2">
              Proven business models and franchisor support reduce lender risk
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8 max-w-6xl mx-auto">
            {benefits.map((benefit, index) => (
              <Card key={index} className="text-center border-0 shadow-[var(--shadow-card)] hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-4 md:p-6">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-secondary/10 rounded-lg flex items-center justify-center mx-auto mb-3 md:mb-4">
                    {benefit.icon}
                  </div>
                  <h3 className="text-base md:text-lg font-semibold font-sans text-primary mb-2 md:mb-3">
                    {benefit.title}
                  </h3>
                  <p className="text-muted-foreground font-serif text-sm">
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold font-sans text-primary mb-4">
                Franchise vs Independent Business Comparison
              </h2>
              <p className="text-xl text-muted-foreground font-serif">
                Understanding the advantages of franchise business models
              </p>
            </div>

            <Card className="border-0 shadow-[var(--shadow-card)] overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">Aspect</TableHead>
                    <TableHead className="font-semibold">Franchise Business</TableHead>
                    <TableHead className="font-semibold">Independent Business</TableHead>
                    <TableHead className="font-semibold">Franchise Advantage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {franchiseComparison.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.aspect}</TableCell>
                      <TableCell>{item.franchise}</TableCell>
                      <TableCell>{item.independent}</TableCell>
                      <TableCell className="text-secondary font-medium">{item.advantage}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold font-sans text-primary mb-4">
              What Can Franchise Loans Fund?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-serif">
              Strategic financing options for franchise growth and operations
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {useCases.map((useCase, index) => (
              <Card key={index} className="border-0 shadow-[var(--shadow-card)] hover:shadow-lg transition-all duration-300">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    {useCase.icon}
                  </div>
                  <CardTitle className="text-lg font-semibold font-sans text-primary">
                    {useCase.title}
                  </CardTitle>
                  <p className="text-muted-foreground font-serif text-sm">
                    {useCase.description}
                  </p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {useCase.examples.map((example, idx) => (
                      <li key={idx} className="flex items-center text-sm text-muted-foreground">
                        <CheckCircle className="h-3 w-3 text-secondary mr-2 flex-shrink-0" />
                        {example}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold font-sans text-primary mb-4">
                Franchise Loan Requirements
              </h2>
              <p className="text-xl text-muted-foreground font-serif">
                Qualification criteria for established franchise financing
              </p>
            </div>
            
            <Card className="border-0 shadow-[var(--shadow-card)]">
              <CardHeader>
                <CardTitle className="text-xl font-semibold font-sans text-primary flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-secondary" />
                  Franchise Business Requirements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {requirements.map((requirement, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-secondary mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground font-serif">{requirement}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold font-sans text-primary mb-4">
                Franchise Financing FAQ
              </h2>
              <p className="text-xl text-muted-foreground font-serif">
                Common questions about business loans for established franchises
              </p>
            </div>
            
            <Accordion type="single" collapsible className="w-full">
              {faqData.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border-b">
                  <AccordionTrigger className="text-left hover:no-underline py-6">
                    <div className="flex items-center">
                      <HelpCircle className="h-5 w-5 text-secondary mr-3 flex-shrink-0" />
                      <span className="font-semibold text-primary">{faq.question}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-6">
                    <p className="text-muted-foreground font-serif leading-relaxed pl-8">
                      {faq.answer}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-secondary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold font-sans mb-4">
            Ready to Expand Your Franchise Business?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto font-serif">
            Get specialized financing for your established franchise. Fund expansion, renovations, or working capital with competitive rates.
          </p>
          <Button asChild size="lg" variant="secondary">
            <Link to="/loan-estimator">
              Get My Franchise Loan Quote
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default EstablishedFranchises;