import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  TrendingUp, 
  Leaf, 
  Users,
  Clock,
  Shield,
  DollarSign,
  FileText,
  Calculator,
  Target,
  HelpCircle,
  ArrowRight,
  Store,
  Package
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
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar } from "recharts";
import cannabisDispensaryBusinessImage from "@/assets/cannabis-dispensary-business.webp";

const CannabisDispensary = () => {
  const benefits = [
    {
      icon: <Leaf className="h-6 w-6 text-secondary" />,
      title: "Industry Expertise",
      description: "Specialized financing for cannabis dispensary and marihuana dispensary operations"
    },
    {
      icon: <Shield className="h-6 w-6 text-secondary" />,
      title: "Compliance Support",
      description: "Fund regulatory compliance and licensing requirements for marihuana dispensary"
    },
    {
      icon: <Package className="h-6 w-6 text-secondary" />,
      title: "Inventory Financing",
      description: "Finance cannabis product inventory for your marihuana dispensary business"
    },
    {
      icon: <Store className="h-6 w-6 text-secondary" />,
      title: "Expansion Ready",
      description: "Scale your cannabis dispensary operations across multiple locations"
    }
  ];

  const revenueData = [
    { month: "Jan", dispensaryRevenue: 185000, costs: 125000, netProfit: 60000 },
    { month: "Feb", dispensaryRevenue: 195000, costs: 130000, netProfit: 65000 },
    { month: "Mar", dispensaryRevenue: 220000, costs: 140000, netProfit: 80000 },
    { month: "Apr", dispensaryRevenue: 240000, costs: 150000, netProfit: 90000 },
    { month: "May", dispensaryRevenue: 265000, costs: 160000, netProfit: 105000 },
    { month: "Jun", dispensaryRevenue: 285000, costs: 170000, netProfit: 115000 }
  ];

  const complianceInvestmentData = [
    { category: "Licensing", initial: 50000, ongoing: 15000 },
    { category: "Security Systems", initial: 75000, ongoing: 8000 },
    { category: "Inventory Tracking", initial: 25000, ongoing: 5000 },
    { category: "Legal Compliance", initial: 30000, ongoing: 12000 }
  ];

  const cannabisBusinessComparison = [
    {
      type: "Retail Dispensary",
      description: "Marihuana dispensary storefront operations",
      investment: "$200K-800K",
      monthlyRevenue: "$150K-500K"
    },
    {
      type: "Medical Cannabis", 
      description: "Licensed medical marihuana dispensary",
      investment: "$300K-1M",
      monthlyRevenue: "$100K-400K"
    },
    {
      type: "Cultivation Facility",
      description: "Cannabis growing and production operations",
      investment: "$500K-5M",
      monthlyRevenue: "$200K-2M"
    },
    {
      type: "Processing & Manufacturing",
      description: "Cannabis product manufacturing for dispensary",
      investment: "$300K-2M",
      monthlyRevenue: "$150K-1M"
    }
  ];

  const useCases = [
    {
      icon: <Target className="h-8 w-8 text-primary" />,
      title: "Dispensary Launch",
      description: "Start your marihuana dispensary with comprehensive funding",
      examples: ["Licensing fees", "Initial inventory", "Store buildout", "Security systems"]
    },
    {
      icon: <Store className="h-8 w-8 text-primary" />,
      title: "Location Expansion",
      description: "Open additional cannabis dispensary locations",
      examples: ["New store permits", "Multi-location setup", "Regional expansion", "Franchise development"]
    },
    {
      icon: <Package className="h-8 w-8 text-primary" />,
      title: "Inventory & Products",
      description: "Finance cannabis product inventory for your marihuana dispensary",
      examples: ["Cannabis flower inventory", "Edibles and concentrates", "Accessories and supplies", "Seasonal stock buildup"]
    },
    {
      icon: <Shield className="h-8 w-8 text-primary" />,
      title: "Compliance & Technology",
      description: "Meet regulatory requirements for marihuana dispensary operations",
      examples: ["Seed-to-sale tracking", "Security upgrades", "POS systems", "Compliance consulting"]
    }
  ];

  const requirements = [
    "Valid cannabis/marihuana dispensary licenses",
    "Operating dispensary business for 6+ months",
    "Monthly revenue of $50,000+ for marihuana dispensary",
    "Compliance with state cannabis regulations",
    "Seed-to-sale tracking system in place",
    "Clean regulatory and compliance history"
  ];

  const faqData = [
    {
      question: "How does cannabis dispensary and marihuana dispensary financing work?",
      answer: "Cannabis dispensary financing requires specialized lenders familiar with the industry. Due to federal regulations, traditional banks often can't serve cannabis businesses, but alternative lenders provide business loans for marihuana dispensary operations including inventory, expansion, and working capital."
    },
    {
      question: "What makes marihuana dispensary cash flow unique?",
      answer: "Marihuana dispensary businesses typically operate with high cash volumes due to banking restrictions. Cash flow includes retail sales, wholesale distribution, and product margins. Cannabis dispensary operations require careful cash management and compliance with state tracking requirements."
    },
    {
      question: "Can I get equipment financing for my cannabis dispensary?",
      answer: "Yes, equipment financing is available for cannabis dispensary operations including security systems, POS equipment, cultivation equipment, and processing machinery. Marihuana dispensary businesses can finance both retail and production equipment."
    },
    {
      question: "How do compliance costs affect cannabis dispensary loans?",
      answer: "Compliance represents a significant cost for marihuana dispensary operations, typically 15-25% of revenue. Lenders understand these regulatory requirements and can structure loans to help cannabis dispensary businesses meet licensing, security, and tracking system requirements."
    },
    {
      question: "What loan amounts are available for marihuana dispensary businesses?",
      answer: "Cannabis dispensary loan amounts vary based on business size and compliance status: $100K-500K for established dispensaries, $500K-2M for multi-location operations, and $2M+ for cultivation and processing facilities serving marihuana dispensary networks."
    }
  ];

  const businessModelSection = {
    title: "Understanding Cannabis Dispensary & Marihuana Dispensary Business Models",
    description: "Cannabis dispensary and marihuana dispensary businesses operate in a highly regulated environment, providing legal cannabis products to consumers. Success requires strict compliance, quality inventory management, and understanding of local regulations governing marihuana dispensary operations."
  };

  const cashFlowSection = {
    title: "Cannabis Dispensary Cash Flow Dynamics",
    points: [
      "Retail sales from cannabis dispensary and marihuana dispensary operations",
      "High cash transactions due to banking limitations",
      "Inventory costs for cannabis products (typically 40-60% of revenue)",
      "Compliance and regulatory costs (15-25% of revenue)",
      "State and local taxes specific to marihuana dispensary business",
      "Security and operational expenses for safe dispensary operations"
    ]
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Business Loans for Cannabis Dispensary & Marihuana Dispensary | Cannabis Business Financing Canada & US"
        description="Get business loans for cannabis dispensary and marihuana dispensary operations. Finance inventory, compliance, and expansion with specialized cannabis business funding in Canada and US."
        keywords={["cannabis dispensary loans", "marihuana dispensary financing", "cannabis business loans", "dispensary financing", "cannabis industry funding", "marihuana business loans"]}
        canonicalUrl="https://truenorthbusinessloan.ca/cannabis-dispensary"
      />
      <Header />
      
      {/* Hero Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm font-medium">
              Cannabis Dispensary & Marihuana Dispensary Financing
            </Badge>
            
            <h1 className="text-4xl lg:text-6xl font-bold font-sans text-primary mb-6 leading-tight">
              Business Loans for
              <span className="text-secondary"> Cannabis Dispensary & Marihuana Dispensary</span>
            </h1>
            
            <p className="text-xl lg:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto font-serif">
              Grow your cannabis dispensary and marihuana dispensary business with $100K to $5M+ in specialized financing. Fund inventory, compliance, expansion, and working capital for your dispensary operations.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button asChild variant="cta" size="xl" className="text-lg px-8">
                <Link to="/loan-estimator">Get My Cannabis Dispensary Quote</Link>
              </Button>
              <Button asChild variant="outline" size="xl" className="text-lg px-8">
                <Link to="/how-it-works">How It Works</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Business Overview Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl lg:text-4xl font-bold font-sans text-primary mb-6">
                  Cannabis Dispensary & Marihuana Dispensary Growth
                </h2>
                <p className="text-lg text-muted-foreground mb-6 font-serif">
                  The cannabis dispensary and marihuana dispensary industry represents one of the fastest-growing sectors in North America. With proper financing, dispensary owners can ensure compliance, maintain quality inventory, and expand their marihuana dispensary operations to capture market opportunities in this regulated industry.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-background rounded-lg p-4 border">
                    <div className="text-2xl font-bold text-secondary mb-1">25%</div>
                    <div className="text-sm text-muted-foreground">Annual Growth</div>
                  </div>
                  <div className="bg-background rounded-lg p-4 border">
                    <div className="text-2xl font-bold text-secondary mb-1">35-45%</div>
                    <div className="text-sm text-muted-foreground">Profit Margins</div>
                  </div>
                </div>
              </div>
              <div className="relative">
                <img 
                  src={cannabisDispensaryBusinessImage} 
                  alt="Cannabis dispensary and marihuana dispensary business interior with professional retail environment"
                  className="w-full h-auto rounded-xl shadow-xl object-cover"
                  loading="lazy"
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

              {/* Revenue Chart */}
              <Card className="border-0 shadow-[var(--shadow-card)]">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold font-sans text-primary">
                    Marihuana Dispensary Revenue Growth
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={{ 
                    dispensaryRevenue: { label: "Dispensary Revenue ($)", color: "hsl(var(--secondary))" },
                    costs: { label: "Operating Costs ($)", color: "hsl(var(--muted))" },
                    netProfit: { label: "Net Profit ($)", color: "hsl(var(--primary))" }
                  }} className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={revenueData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line type="monotone" dataKey="dispensaryRevenue" stroke="var(--color-dispensaryRevenue)" strokeWidth={2} />
                        <Line type="monotone" dataKey="costs" stroke="var(--color-costs)" strokeWidth={2} />
                        <Line type="monotone" dataKey="netProfit" stroke="var(--color-netProfit)" strokeWidth={3} />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>

            {/* Compliance Investment Chart */}
            <Card className="border-0 shadow-[var(--shadow-card)]">
              <CardHeader>
                <CardTitle className="text-xl font-semibold font-sans text-primary text-center">
                  Cannabis Dispensary & Marihuana Dispensary Compliance Investment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{ 
                  initial: { label: "Initial Investment ($)", color: "hsl(var(--primary))" },
                  ongoing: { label: "Annual Ongoing Costs ($)", color: "hsl(var(--secondary))" }
                }} className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={complianceInvestmentData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="initial" fill="var(--color-initial)" />
                      <Bar dataKey="ongoing" fill="var(--color-ongoing)" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold font-sans text-primary mb-4">
              Why Cannabis Dispensary & Marihuana Dispensary Need Specialized Financing
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-serif">
              Unique industry challenges require specialized funding solutions
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {benefits.map((benefit, index) => (
              <Card key={index} className="text-center border-0 shadow-[var(--shadow-card)] hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                    {benefit.icon}
                  </div>
                  <h3 className="text-lg font-semibold font-sans text-primary mb-3">
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

      {/* Cannabis Business Types Comparison */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold font-sans text-primary mb-4">
                Cannabis Business Types & Investment Requirements
              </h2>
              <p className="text-xl text-muted-foreground font-serif">
                Different cannabis operations require different financing approaches
              </p>
            </div>

            <Card className="border-0 shadow-[var(--shadow-card)] overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">Business Type</TableHead>
                    <TableHead className="font-semibold">Description</TableHead>
                    <TableHead className="font-semibold">Typical Investment</TableHead>
                    <TableHead className="font-semibold">Monthly Revenue Range</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cannabisBusinessComparison.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.type}</TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell className="text-secondary font-medium">{item.investment}</TableCell>
                      <TableCell>{item.monthlyRevenue}</TableCell>
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
              Cannabis Dispensary & Marihuana Dispensary Financing Use Cases
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-serif">
              Strategic funding for cannabis dispensary business growth and compliance
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
                Cannabis Dispensary & Marihuana Dispensary Loan Requirements
              </h2>
              <p className="text-xl text-muted-foreground font-serif">
                Qualification criteria for cannabis dispensary business financing
              </p>
            </div>
            
            <Card className="border-0 shadow-[var(--shadow-card)]">
              <CardHeader>
                <CardTitle className="text-xl font-semibold font-sans text-primary flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-secondary" />
                  Cannabis Dispensary & Marihuana Dispensary Business Requirements
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
                Cannabis Dispensary & Marihuana Dispensary Financing FAQ
              </h2>
              <p className="text-xl text-muted-foreground font-serif">
                Common questions about business loans for cannabis dispensary and marihuana dispensary operations
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
            Ready to Grow Your Cannabis Dispensary & Marihuana Dispensary Business?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto font-serif">
            Get specialized financing for your cannabis dispensary and marihuana dispensary. Fund inventory, compliance, expansion, and working capital with competitive rates.
          </p>
          <Button asChild size="lg" variant="secondary">
            <Link to="/loan-estimator">
              Get My Cannabis Dispensary Quote
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CannabisDispensary;