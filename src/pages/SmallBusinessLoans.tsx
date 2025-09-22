import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  TrendingUp, 
  Building, 
  Users,
  Clock,
  Shield,
  DollarSign,
  FileText,
  Calculator,
  Target,
  HelpCircle
} from "lucide-react";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger 
} from "@/components/ui/accordion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";

const SmallBusinessLoans = () => {
  const benefits = [
    {
      icon: <TrendingUp className="h-6 w-6 text-secondary" />,
      title: "Flexible Use of Funds",
      description: "Use for any business purpose - growth, inventory, working capital, or expansion"
    },
    {
      icon: <Shield className="h-6 w-6 text-secondary" />,
      title: "Competitive Rates",
      description: "Access to competitive interest rates from multiple Canadian lenders"
    },
    {
      icon: <Clock className="h-6 w-6 text-secondary" />,
      title: "Fast Approval",
      description: "Get approved quickly with our streamlined application process"
    },
    {
      icon: <Building className="h-6 w-6 text-secondary" />,
      title: "Build Business Credit",
      description: "Establish and improve your business credit history with timely payments"
    }
  ];

  const useCases = [
    {
      icon: <Target className="h-8 w-8 text-primary" />,
      title: "Business Expansion",
      description: "Open new locations, hire staff, or expand your market reach",
      examples: ["New store locations", "Hiring employees", "Market expansion", "Franchise opportunities"]
    },
    {
      icon: <Building className="h-8 w-8 text-primary" />,
      title: "Working Capital",
      description: "Cover day-to-day operations and manage cash flow",
      examples: ["Payroll expenses", "Rent and utilities", "Seasonal fluctuations", "Inventory purchases"]
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-primary" />,
      title: "Growth Investments",
      description: "Invest in technology, marketing, and business improvements",
      examples: ["Technology upgrades", "Marketing campaigns", "Training programs", "Process improvements"]
    },
    {
      icon: <Calculator className="h-8 w-8 text-primary" />,
      title: "Debt Consolidation",
      description: "Simplify your finances by consolidating existing debts",
      examples: ["Multiple credit cards", "Various business loans", "Vendor payments", "Tax obligations"]
    }
  ];

  const requirements = [
    "Business operating for at least 1 year",
    "Minimum annual revenue of $100,000",
    "Personal credit score of 650+",
    "Clear business plan and purpose for funds",
    "Strong business cash flow",
    "Up-to-date financial statements"
  ];

  const loanTypes = [
    {
      title: "Term Loans",
      description: "Traditional fixed-term loans with regular monthly payments",
      bestFor: "Equipment purchases, expansion, large one-time expenses",
      terms: "1-7 years",
      amounts: "$10K - $800K"
    },
    {
      title: "Lines of Credit",
      description: "Flexible credit line you can draw from as needed",
      bestFor: "Working capital, seasonal cash flow, unexpected expenses",
      terms: "Revolving",
      amounts: "$10K - $250K"
    },
    {
      title: "SBA-Style Loans",
      description: "Government-backed loans with favorable terms",
      bestFor: "Real estate, long-term investments, major expansion",
      terms: "5-25 years",
      amounts: "$50K - $5M"
    }
  ];

  const faqData = [
    {
      question: "What is a small business loan?",
      answer: "A small business loan provides a lump sum of capital that you repay over a set period (the \"term\") with regular, predictable payments. These loans are incredibly versatile and can be used for almost any business purpose, such as expansion, hiring staff, purchasing inventory, or managing day-to-day working capital."
    },
    {
      question: "How do I qualify for a business loan in Canada?",
      answer: "While requirements vary by lender, alternative lenders often have more flexible criteria than major banks. They typically look for: At least 6 months in business, a steady monthly revenue (e.g., over $10,000/month), and a reasonable personal credit score. Many lenders prioritize your business's recent cash flow over a perfect credit history."
    },
    {
      question: "Can I get a business loan with bad credit?",
      answer: "Yes. While a high credit score helps, many of our lending partners specialize in providing business loans for bad credit. They place more emphasis on the health and revenue of your business rather than relying solely on your credit score."
    },
    {
      question: "How quickly can I get a small business loan?",
      answer: "This is a major advantage over traditional banks. The application process is streamlined, and many alternative lenders can approve and deposit funds into your account in as little as 24 to 48 hours."
    },
    {
      question: "What documents do I need to apply?",
      answer: "Typically, the initial application is simple. To finalize the loan, you may need to provide basic documentation like a few months of business bank statements, a valid photo ID, and proof of business ownership. Our quiz funnel requires no documents to get started."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Small Business Loans $10K-$800K | Fast Approval CA"
        description="Get small business loans up to $800K with fast approval. Flexible terms, competitive rates. Equipment, expansion, working capital."
        keywords={[
          "small business loans canada",
          "business term loans", 
          "equipment financing",
          "working capital loans",
          "business expansion loans",
          "canadian business funding",
          "competitive business loan rates",
          "fast business loan approval",
          "flexible business financing",
          "business growth loans"
        ]}
        canonicalUrl="https://truenorthbusinessloan.ca/small-business-loans"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "FinancialProduct",
          "name": "Small Business Loans - True North Business Loan",
          "description": "Get small business loans from $10K to $800K with competitive rates starting at Prime + 2%. Fast approval in 24-48 hours.",
          "provider": {
            "@type": "Organization",
            "name": "True North Business Loan",
            "url": "https://truenorthbusinessloan.ca"
          },
          "offers": {
            "@type": "Offer",
            "priceRange": "$10,000 - $800,000",
            "description": "Business term loans with 1-7 year repayment terms"
          }
        }}
      />
      <Header />
      
      {/* Hero Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm font-medium">
              Small Business Loans for Entrepreneurs
            </Badge>
            
            <h1 className="text-4xl lg:text-6xl font-bold font-sans text-primary mb-6 leading-tight">
              Get Small Business Loans 
              <span className="text-secondary">$10K-$800K Fast</span>
            </h1>
            
            <p className="text-xl lg:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto font-serif">
              Competitive rates from Prime + 2%. Use for expansion, equipment, working capital, or any business purpose. Get approved in 24-48 hours from Canada's top lenders.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button asChild variant="cta" size="xl" className="text-lg px-8 shadow-lg hover:shadow-xl transition-all">
                <Link to="/loan-estimator">Get Pre-Approved Today →</Link>
              </Button>
              <Button asChild variant="outline" size="xl" className="text-lg px-8 border-2 hover:bg-primary hover:text-primary-foreground">
                <Link to="/how-it-works">View Loan Options</Link>
              </Button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">$10K - $800K</div>
                <div className="text-sm text-muted-foreground">Loan Amount</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">1-7 Years</div>
                <div className="text-sm text-muted-foreground">Terms Available</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">24-48 Hours</div>
                <div className="text-sm text-muted-foreground">Decision Time</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">Prime + 2%</div>
                <div className="text-sm text-muted-foreground">Starting From</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold font-sans text-primary mb-4">
              Why Choose Small Business Loans?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-serif">
              Small business loans provide the flexibility and capital you need to grow
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

      {/* Loan Types Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold font-sans text-primary mb-4">
              Types of Small Business Loans
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-serif">
              Choose the right type of financing for your specific business needs
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
            {loanTypes.map((type, index) => (
              <Card key={index} className="border-0 shadow-[var(--shadow-card)] hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold font-sans text-primary">
                    {type.title}
                  </CardTitle>
                  <p className="text-muted-foreground font-serif">
                    {type.description}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <span className="font-semibold text-primary">Best For: </span>
                    <span className="text-muted-foreground font-serif">{type.bestFor}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-primary">Terms: </span>
                    <span className="text-muted-foreground font-serif">{type.terms}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-primary">Amounts: </span>
                    <span className="text-muted-foreground font-serif">{type.amounts}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold font-sans text-primary mb-4">
              What Can You Use Small Business Loans For?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-serif">
              Small business loans offer flexibility for various business needs
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
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold font-sans text-primary mb-4">
                Qualification Requirements
              </h2>
              <p className="text-xl text-muted-foreground font-serif">
                Most small business loan approvals require the following criteria
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="border-0 shadow-[var(--shadow-card)]">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold font-sans text-primary flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-secondary" />
                    Basic Requirements
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

              <Card className="border-0 shadow-[var(--shadow-card)]">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold font-sans text-primary flex items-center">
                    <DollarSign className="h-5 w-5 mr-2 text-secondary" />
                    Typical Terms
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="font-semibold text-primary mb-1">Loan Amount:</div>
                    <div className="text-muted-foreground font-serif">$10,000 - $800,000</div>
                  </div>
                  <div>
                    <div className="font-semibold text-primary mb-1">Interest Rates:</div>
                    <div className="text-muted-foreground font-serif">Prime + 2% to 15% (varies by credit)</div>
                  </div>
                  <div>
                    <div className="font-semibold text-primary mb-1">Repayment Terms:</div>
                    <div className="text-muted-foreground font-serif">12 to 84 months</div>
                  </div>
                  <div>
                    <div className="font-semibold text-primary mb-1">Approval Time:</div>
                    <div className="text-muted-foreground font-serif">24-48 hours for qualified applicants</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold font-sans text-primary mb-4">
                Small Business Loans FAQ
              </h2>
              <p className="text-xl text-muted-foreground font-serif">
                Common questions about small business loans and term loans
              </p>
            </div>
            
            <script type="application/ld+json">
              {JSON.stringify({
                "@context": "https://schema.org",
                "@type": "FAQPage",
                "mainEntity": faqData.map(faq => ({
                  "@type": "Question",
                  "name": faq.question,
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": faq.answer
                  }
                }))
              })}
            </script>
            
            <Accordion type="single" collapsible className="w-full">
              {faqData.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border-b">
                  <AccordionTrigger className="text-left hover:no-underline py-6">
                    <div className="flex items-center">
                      <HelpCircle className="h-5 w-5 text-secondary mr-3 flex-shrink-0" />
                      <span className="font-semibold text-primary">{faq.question}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-6 text-muted-foreground font-serif leading-relaxed">
                    {faq.answer}
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
            Ready to Grow Your Business?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto font-serif">
            Take our quick quiz to see your small business loan options and get matched with the right lenders
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="xl" variant="secondary" className="text-lg px-8">
              <Link to="/loan-estimator">
                <Users className="h-5 w-5 mr-2" />
                Check My Loan Options
              </Link>
            </Button>
            <Button asChild size="xl" variant="outline" className="text-lg px-8 border-primary-foreground text-black hover:bg-primary-foreground hover:text-black active:text-black focus:text-black">
              <Link to="/blog">
                Learn More About Business Loans
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default SmallBusinessLoans;