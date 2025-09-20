import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  TrendingUp, 
  Factory, 
  Users,
  Clock,
  Shield,
  DollarSign,
  FileText,
  Calculator,
  Target,
  HelpCircle,
  ArrowRight,
  Cog,
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

const Manufacturing = () => {
  const benefits = [
    {
      icon: <Factory className="h-6 w-6 text-secondary" />,
      title: "Production Scaling",
      description: "Finance equipment and facilities to increase manufacturing capacity"
    },
    {
      icon: <Cog className="h-6 w-6 text-secondary" />,
      title: "Technology Upgrades",
      description: "Modernize operations with automation and advanced manufacturing tech"
    },
    {
      icon: <Package className="h-6 w-6 text-secondary" />,
      title: "Inventory Management",
      description: "Fund raw materials and work-in-progress inventory efficiently"
    },
    {
      icon: <Shield className="h-6 w-6 text-secondary" />,
      title: "Quality Assurance",
      description: "Invest in quality control systems and certification processes"
    }
  ];

  const productionData = [
    { month: "Jan", production: 1200, revenue: 180000, costs: 135000 },
    { month: "Feb", production: 1350, revenue: 202500, costs: 148000 },
    { month: "Mar", production: 1400, revenue: 210000, costs: 155000 },
    { month: "Apr", production: 1600, revenue: 240000, costs: 170000 },
    { month: "May", production: 1750, revenue: 262500, costs: 182000 },
    { month: "Jun", production: 1900, revenue: 285000, costs: 195000 }
  ];

  const capacityGrowthData = [
    { phase: "Current", capacity: 100, investment: 0 },
    { phase: "Phase 1", capacity: 150, investment: 250000 },
    { phase: "Phase 2", capacity: 225, investment: 500000 },
    { phase: "Phase 3", capacity: 300, investment: 750000 }
  ];

  const manufacturingComparison = [
    {
      type: "Light Manufacturing",
      examples: "Electronics, Textiles, Food Processing",
      investment: "$100K-500K",
      monthlyRevenue: "$50K-200K"
    },
    {
      type: "Heavy Manufacturing", 
      examples: "Automotive Parts, Machinery, Metal Fabrication",
      investment: "$500K-2M",
      monthlyRevenue: "$200K-1M"
    },
    {
      type: "Specialized Manufacturing",
      examples: "Medical Devices, Aerospace Components",
      investment: "$1M-5M+",
      monthlyRevenue: "$500K-5M+"
    },
    {
      type: "Custom Manufacturing",
      examples: "Job Shop, Prototype Production",
      investment: "$200K-1M",
      monthlyRevenue: "$100K-500K"
    }
  ];

  const useCases = [
    {
      icon: <Target className="h-8 w-8 text-primary" />,
      title: "Equipment Acquisition",
      description: "Purchase manufacturing machinery and production equipment",
      examples: ["CNC machines", "Assembly lines", "Quality testing equipment", "Automation systems"]
    },
    {
      icon: <Factory className="h-8 w-8 text-primary" />,
      title: "Facility Expansion",
      description: "Expand or upgrade manufacturing facilities and infrastructure",
      examples: ["Warehouse expansion", "Production floor upgrades", "Clean room facilities", "Energy systems"]
    },
    {
      icon: <Package className="h-8 w-8 text-primary" />,
      title: "Inventory & Materials",
      description: "Finance raw materials, components, and work-in-progress inventory",
      examples: ["Raw material purchases", "Component inventory", "Seasonal stock buildup", "Supply chain optimization"]
    },
    {
      icon: <Cog className="h-8 w-8 text-primary" />,
      title: "Technology Integration",
      description: "Implement advanced manufacturing technologies and systems",
      examples: ["ERP systems", "IoT sensors", "Robotics integration", "Digital workflow systems"]
    }
  ];

  const requirements = [
    "Manufacturing business operating for 12+ months",
    "Monthly revenue of $100,000+",
    "Proper manufacturing licenses and certifications",
    "Environmental compliance documentation",
    "Equipment maintenance and safety records",
    "Quality control processes in place"
  ];

  const faqData = [
    {
      question: "How does manufacturing cash flow typically work?",
      answer: "Manufacturing cash flow involves purchasing raw materials, processing them into finished goods, and selling to customers. The cycle typically takes 60-120 days from material purchase to payment collection. Working capital is crucial to maintain production while waiting for customer payments."
    },
    {
      question: "What financing options work best for manufacturers?",
      answer: "Equipment financing is ideal for machinery purchases, while asset-based lending can fund inventory. Term loans work well for facility expansion, and lines of credit help manage working capital needs during production cycles."
    },
    {
      question: "Can I finance used manufacturing equipment?",
      answer: "Yes, many lenders finance used manufacturing equipment that's in good condition and less than 10-15 years old. Used equipment financing often requires appraisals and maintenance records to verify value and condition."
    },
    {
      question: "How do inventory cycles affect manufacturing loans?",
      answer: "Manufacturing businesses typically carry 60-90 days of inventory including raw materials, work-in-progress, and finished goods. Lenders consider inventory turnover rates and seasonal fluctuations when structuring working capital facilities."
    },
    {
      question: "What loan amounts are available for manufacturing businesses?",
      answer: "Manufacturing loan amounts vary widely: $100K-500K for small operations, $500K-2M for mid-size manufacturers, and $2M+ for large-scale operations. Equipment financing can range from $50K to several million depending on the machinery."
    }
  ];

  const businessModelSection = {
    title: "Understanding Manufacturing Business Models",
    description: "Manufacturing businesses transform raw materials into finished products through various production processes. Success depends on efficient operations, quality control, supply chain management, and the ability to scale production to meet demand while maintaining profitability."
  };

  const cashFlowSection = {
    title: "Manufacturing Cash Flow Cycle",
    points: [
      "Purchase raw materials and components (30-60 days payment terms)",
      "Production process (labor, overhead, equipment costs)",
      "Quality control and finished goods inventory",
      "Sales to customers (often 30-90 day payment terms)",
      "Accounts receivable collection period",
      "Working capital requirements for continuous production"
    ]
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Business Loans for Manufacturing Companies | Equipment Financing Canada & US"
        description="Get business loans for manufacturing companies. Finance equipment purchases, facility expansion, and working capital with specialized manufacturing business funding in Canada and US."
        keywords={["manufacturing loans", "equipment financing", "manufacturing business loans", "industrial equipment financing", "production facility loans", "manufacturing working capital"]}
        canonicalUrl="https://truenorthbusinessloan.ca/manufacturing"
      />
      <Header />
      
      {/* Hero Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm font-medium">
              Manufacturing Business Financing
            </Badge>
            
            <h1 className="text-4xl lg:text-6xl font-bold font-sans text-primary mb-6 leading-tight">
              Business Loans for
              <span className="text-secondary"> Manufacturing Companies</span>
            </h1>
            
            <p className="text-xl lg:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto font-serif">
              Scale your manufacturing operations with $100K to $5M+ in specialized financing. Fund equipment, facilities, inventory, and working capital for your manufacturing business.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button asChild variant="cta" size="xl" className="text-lg px-8">
                <Link to="/loan-estimator">Get My Manufacturing Loan Quote</Link>
              </Button>
              <Button asChild variant="outline" size="xl" className="text-lg px-8">
                <Link to="/how-it-works">How It Works</Link>
              </Button>
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

              {/* Production Chart */}
              <Card className="border-0 shadow-[var(--shadow-card)]">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold font-sans text-primary">
                    Production Growth & Revenue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={{ 
                    production: { label: "Units Produced", color: "hsl(var(--secondary))" },
                    revenue: { label: "Revenue ($)", color: "hsl(var(--primary))" }
                  }} className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={productionData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line type="monotone" dataKey="production" stroke="var(--color-production)" strokeWidth={2} />
                        <Line type="monotone" dataKey="revenue" stroke="var(--color-revenue)" strokeWidth={3} />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>

            {/* Capacity Investment Chart */}
            <Card className="border-0 shadow-[var(--shadow-card)]">
              <CardHeader>
                <CardTitle className="text-xl font-semibold font-sans text-primary text-center">
                  Manufacturing Capacity Expansion ROI
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{ 
                  capacity: { label: "Production Capacity (%)", color: "hsl(var(--primary))" },
                  investment: { label: "Investment Required ($)", color: "hsl(var(--secondary))" }
                }} className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={capacityGrowthData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="phase" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="capacity" fill="var(--color-capacity)" />
                      <Bar dataKey="investment" fill="var(--color-investment)" />
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
              Why Manufacturing Companies Choose Specialized Financing
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-serif">
              Address unique manufacturing challenges with tailored funding solutions
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

      {/* Manufacturing Types Comparison */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold font-sans text-primary mb-4">
                Manufacturing Types & Investment Requirements
              </h2>
              <p className="text-xl text-muted-foreground font-serif">
                Different manufacturing sectors require different financing approaches
              </p>
            </div>

            <Card className="border-0 shadow-[var(--shadow-card)] overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">Manufacturing Type</TableHead>
                    <TableHead className="font-semibold">Examples</TableHead>
                    <TableHead className="font-semibold">Typical Investment</TableHead>
                    <TableHead className="font-semibold">Monthly Revenue Range</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {manufacturingComparison.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.type}</TableCell>
                      <TableCell>{item.examples}</TableCell>
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
              Manufacturing Financing Use Cases
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-serif">
              Strategic funding for manufacturing business growth and operations
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
                Manufacturing Loan Requirements
              </h2>
              <p className="text-xl text-muted-foreground font-serif">
                Qualification criteria for manufacturing business financing
              </p>
            </div>
            
            <Card className="border-0 shadow-[var(--shadow-card)]">
              <CardHeader>
                <CardTitle className="text-xl font-semibold font-sans text-primary flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-secondary" />
                  Manufacturing Business Requirements
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
                Manufacturing Financing FAQ
              </h2>
              <p className="text-xl text-muted-foreground font-serif">
                Common questions about business loans for manufacturing companies
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
            Ready to Scale Your Manufacturing Operations?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto font-serif">
            Get specialized financing for your manufacturing business. Fund equipment, facility expansion, and working capital with competitive rates.
          </p>
          <Button asChild size="lg" variant="secondary">
            <Link to="/loan-estimator">
              Get My Manufacturing Loan Quote
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Manufacturing;