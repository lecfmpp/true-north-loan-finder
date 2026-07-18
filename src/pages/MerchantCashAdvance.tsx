import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  CreditCard, 
  Zap, 
  Users,
  Clock,
  TrendingUp,
  DollarSign,
  FileText,
  Calculator,
  Building,
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

const MerchantCashAdvance = () => {
  const benefits = [
    {
      icon: <Zap className="h-6 w-6 text-secondary" />,
      title: "Fast Funding",
      description: "Get approved and funded in as little as 24 hours"
    },
    {
      icon: <CreditCard className="h-6 w-6 text-secondary" />,
      title: "Based on Sales",
      description: "Qualification based on credit card sales, not just credit score"
    },
    {
      icon: <Clock className="h-6 w-6 text-secondary" />,
      title: "Flexible Repayment",
      description: "Repay automatically from daily credit card sales"
    },
    {
      icon: <Building className="h-6 w-6 text-secondary" />,
      title: "No Fixed Payments",
      description: "Payment amounts fluctuate with your business revenue"
    }
  ];

  const requirements = [
    "Business operating for at least 6 months",
    "Monthly credit card sales of $5,000+",
    "Personal credit score of 550+",
    "Consistent credit card processing history",
    "Valid business bank account",
    "No recent bankruptcies"
  ];

  const howItWorks = [
    {
      step: "1",
      title: "Application",
      description: "Submit basic business information and 3-6 months of processing statements"
    },
    {
      step: "2",
      title: "Review",
      description: "We analyze your credit card sales history and business performance"
    },
    {
      step: "3",
      title: "Approval",
      description: "Get approved for an advance amount based on your sales volume"
    },
    {
      step: "4",
      title: "Funding",
      description: "Receive funds in your account within 24-48 hours"
    },
    {
      step: "5",
      title: "Repayment",
      description: "A small percentage of daily credit card sales automatically repays the advance"
    }
  ];

  const idealBusinesses = [
    {
      type: "Restaurants & Cafes",
      description: "High volume of credit card transactions with consistent daily sales",
      examples: ["Fine dining", "Fast casual", "Coffee shops", "Food trucks"]
    },
    {
      type: "Retail Stores",
      description: "Regular customer transactions with steady credit card processing",
      examples: ["Clothing stores", "Electronics", "Gift shops", "Convenience stores"]
    },
    {
      type: "Service Businesses",
      description: "Professional services that process payments via credit cards",
      examples: ["Hair salons", "Auto repair", "Professional services", "Fitness centers"]
    },
    {
      type: "Seasonal Businesses",
      description: "Businesses with fluctuating revenue that need flexible repayment",
      examples: ["Tourism", "Holiday retail", "Event planning", "Landscaping"]
    }
  ];

  const faqData = [
    {
      question: "What is a Merchant Cash Advance (MCA)?",
      answer: "An MCA is not a loan, but rather the sale of a portion of your future sales at a discount. A funder gives you a lump sum of cash upfront. In return, you agree to pay back that amount by remitting a small, fixed percentage of your daily credit and debit card sales until the advance is settled."
    },
    {
      question: "How is an MCA different from a loan?",
      answer: "The key difference is in the repayment structure. A loan has fixed monthly payments, regardless of your sales. An MCA's repayment is flexible; you pay back more when your sales are strong and less when they are slow, because the payment is tied to a percentage of your daily revenue."
    },
    {
      question: "Is my business eligible for an MCA?",
      answer: "MCAs are an excellent fit for businesses with high volumes of card transactions, like retail stores, restaurants, and e-commerce sites. Eligibility is based more on your sales history than your credit score, making it accessible for businesses with less-than-perfect credit."
    },
    {
      question: "How does repayment work?",
      answer: "A small, agreed-upon percentage (e.g., 10%) is automatically deducted from your daily credit card settlement. This process is automatic, so you never have to worry about missing a payment."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Merchant Cash Advance | $5K-$500K | No Fixed Payments"
        description="Need working capital fast? Get $5K-$500K based on credit card sales. Flexible daily repayments. 24-48hr approval for restaurants & retail."
        keywords={[
          "merchant cash advance",
          "restaurant funding",
          "retail financing", 
          "credit card sales funding",
          "flexible business funding",
          "no fixed payments",
          "daily payment funding",
          "seasonal business funding",
          "merchant funding solutions",
          "fast business cash"
        ]}
        canonicalUrl="https://truenorthbusinessloan.ca/merchant-cash-advance"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "FinancialProduct",
          "name": "Merchant Cash Advance - True North Business Loan",
          "description": "Get working capital based on your credit card sales. Flexible daily repayments, no fixed monthly payments.",
          "provider": {
            "@type": "Organization", 
            "name": "True North Business Loan",
            "url": "https://truenorthbusinessloan.ca"
          },
          "offers": {
            "@type": "Offer",
            "priceRange": "$5,000 - $500,000",
            "description": "Merchant cash advance with flexible daily repayment"
          }
        }}
      />
      <Header />
      
      {/* Hero Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm font-medium">
              Fast Business Funding for Your Business
            </Badge>
            
            <h1 className="text-4xl lg:text-6xl font-bold font-sans text-primary mb-6 leading-tight">
              Working Capital with 
              <span className="text-secondary">No Fixed Payments</span>
            </h1>
            
            <p className="text-xl lg:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto font-serif">
              Get $5K-$500K based on your credit card sales! Perfect for restaurants, retail, and seasonal businesses. Repay from daily sales, not fixed monthly payments. Get approved in 24-48 hours.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button asChild variant="cta" size="xl" className="text-lg px-8 shadow-lg hover:shadow-xl transition-all">
                <Link to="/loan-estimator">Get Approved Today →</Link>
              </Button>
              <Button asChild variant="outline" size="xl" className="text-lg px-8 border-2 hover:bg-primary hover:text-primary-foreground">
                <Link to="/how-it-works">See MCA Benefits</Link>
              </Button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">$5K - $500K</div>
                <div className="text-sm text-muted-foreground">Advance Amount</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">24-48 Hours</div>
                <div className="text-sm text-muted-foreground">Funding Time</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">6-18 Months</div>
                <div className="text-sm text-muted-foreground">Repayment Period</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">10-30%</div>
                <div className="text-sm text-muted-foreground">Repayment Rate</div>
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
              Why Choose Merchant Cash Advance?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-serif">
              Merchant cash advances offer unique advantages for businesses with consistent credit card sales
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

      {/* How It Works Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold font-sans text-primary mb-4">
              How Merchant Cash Advance Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-serif">
              A simple 5-step process to get the working capital you need
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              {howItWorks.map((step, index) => (
                <div key={index} className="flex items-start">
                  <div className="w-12 h-12 bg-accent text-accent-foreground rounded-full flex items-center justify-center font-bold text-lg mr-6 flex-shrink-0">
                    {step.step}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold font-sans text-primary mb-2">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground font-serif">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Ideal Businesses Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold font-sans text-primary mb-4">
              Ideal for These Business Types
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-serif">
              Merchant cash advances work best for businesses with regular credit card sales
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {idealBusinesses.map((business, index) => (
              <Card key={index} className="border-0 shadow-[var(--shadow-card)] hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold font-sans text-primary">
                    {business.type}
                  </CardTitle>
                  <p className="text-muted-foreground font-serif">
                    {business.description}
                  </p>
                </CardHeader>
                <CardContent>
                  <ul className="grid grid-cols-2 gap-2">
                    {business.examples.map((example, idx) => (
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
                Merchant cash advance requirements are more flexible than traditional loans
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
                    <Calculator className="h-5 w-5 mr-2 text-secondary" />
                    Typical Terms
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="font-semibold text-primary mb-1">Advance Amount:</div>
                    <div className="text-muted-foreground font-serif">$5,000 - $500,000</div>
                  </div>
                  <div>
                    <div className="font-semibold text-primary mb-1">Factor Rate:</div>
                    <div className="text-muted-foreground font-serif">1.2 to 1.5 (varies by business)</div>
                  </div>
                  <div>
                    <div className="font-semibold text-primary mb-1">Repayment Period:</div>
                    <div className="text-muted-foreground font-serif">6 to 18 months</div>
                  </div>
                  <div>
                    <div className="font-semibold text-primary mb-1">Holdback Percentage:</div>
                    <div className="text-muted-foreground font-serif">10% to 30% of daily sales</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Important Notice Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="border-2 border-accent bg-accent/5">
              <CardHeader>
                <CardTitle className="text-xl font-semibold font-sans text-primary flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-accent" />
                  Important Considerations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground font-serif">
                  <strong className="text-primary">Cost vs. Speed:</strong> Merchant cash advances typically cost more than traditional loans but provide faster access to capital with more flexible qualification requirements.
                </p>
                <p className="text-muted-foreground font-serif">
                  <strong className="text-primary">Repayment Structure:</strong> Unlike fixed monthly payments, your repayment amount varies with your daily sales, providing more flexibility during slower periods.
                </p>
                <p className="text-muted-foreground font-serif">
                  <strong className="text-primary">Best Use Cases:</strong> Ideal for urgent working capital needs, inventory purchases, equipment repairs, or taking advantage of time-sensitive opportunities.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold font-sans text-primary mb-4">
                Merchant Cash Advance FAQ
              </h2>
              <p className="text-xl text-muted-foreground font-serif">
                Everything you need to know about merchant cash advances
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
            Need Fast Working Capital?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto font-serif">
            See if you qualify for a merchant cash advance and get funded within 24-48 hours
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="xl" variant="secondary" className="text-lg px-8">
              <Link to="/loan-estimator">
                <Zap className="h-5 w-5 mr-2" />
                Check My Advance Options
              </Link>
            </Button>
            <Button asChild size="xl" variant="outline" className="text-lg px-8 border-primary-foreground text-primary hover:bg-primary-foreground hover:text-primary">
              <Link to="/blog">
                Learn More About Cash Advances
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default MerchantCashAdvance;