import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  CheckCircle, 
  TrendingUp, 
  Users, 
  Shield,
  Clock,
  Search,
  FileText,
  Handshake,
  Star,
  ArrowRight
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const HowItWorks = () => {
  const steps = [
    {
      number: "1",
      title: "Use the Business Loan Estimator",
      description: "Answer straightforward questions about your business, funding needs, and financial situation so we can calculate your funding potential.",
      details: [
        "Loan amount and purpose",
        "Time in business and revenue",
        "Credit score estimation",
        "Basic contact information"
      ],
      icon: <CheckCircle className="h-12 w-12 text-accent" />,
      color: "from-secondary/10 to-secondary/5"
    },
    {
      number: "2",
      title: "Get Your Instant Results",
      description: "Receive your personalized Loan Readiness Score and see exactly which lenders you pre-qualify for based on our advanced matching algorithm.",
      details: [
        "Loan Readiness Score (0-100)",
        "Personalized profile assessment",
        "Pre-qualified lender matches",
        "Estimated rates and terms"
      ],
      icon: <TrendingUp className="h-12 w-12 text-accent" />,
      color: "from-accent/10 to-accent/5"
    },
    {
      number: "3",
      title: "You Choose to Connect",
      description: "Review your matches and decide which lenders to connect with. You're in complete control - your information is only shared when you click 'Submit'.",
      details: [
        "Review lender profiles",
        "Compare rates and terms",
        "Select preferred lenders",
        "Submit with confidence"
      ],
      icon: <Users className="h-12 w-12 text-accent" />,
      color: "from-primary/10 to-primary/5"
    },
    {
      number: "4",
      title: "Lenders Reach Out",
      description: "Your selected lenders will contact you directly to complete the application process and provide competitive offers tailored to your business.",
      details: [
        "Direct lender contact",
        "Competitive offers",
        "Personalized service",
        "Fast funding decisions"
      ],
      icon: <Handshake className="h-12 w-12 text-accent" />,
      color: "from-secondary/10 to-secondary/5"
    }
  ];

  const benefits = [
    {
      icon: <Shield className="h-8 w-8 text-secondary" />,
      title: "100% Transparent",
      description: "No hidden fees, no surprises. You know exactly what to expect at every step."
    },
    {
      icon: <Clock className="h-8 w-8 text-accent" />,
      title: "Save Time",
      description: "One application connects you with multiple lenders instead of applying everywhere separately."
    },
    {
      icon: <Search className="h-8 w-8 text-primary" />,
      title: "Better Matches",
      description: "Our algorithm ensures you only see lenders who are likely to approve your application."
    },
    {
      icon: <Star className="h-8 w-8 text-secondary" />,
      title: "Top-Rated Lenders",
      description: "We only work with reputable, licensed lenders with proven track records."
    }
  ];

  const faqs = [
    {
      question: "Is the Business Loan Estimator really free?",
      answer: "Yes, completely free. There are no hidden fees or costs to use our matching service."
    },
    {
      question: "Will this affect my credit score?",
      answer: "No, our Business Loan Estimator and matching process uses a soft credit inquiry that doesn't impact your credit score."
    },
    {
      question: "How accurate is the Loan Readiness Score?",
      answer: "Our scoring algorithm is based on real lending criteria from our partner lenders, providing highly accurate pre-qualification assessments."
    },
    {
      question: "What if I don't qualify with any lenders?",
      answer: "Even if you don't initially qualify, we provide guidance on improving your business profile and can match you with specialized lenders who work with challenging situations."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl lg:text-5xl font-bold font-sans text-primary mb-6">
              How True North Business Loan Works
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto font-serif">
              We've simplified business lending by connecting you directly with the right lenders. 
              Here's exactly how our transparent process works.
            </p>
            <Button asChild variant="cta" size="lg">
              <Link to="/loan-estimator">Start Your Application</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Process Steps */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold font-sans text-primary mb-4">
                Your Path to Business Funding
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-serif">
                Four simple steps from application to funding
              </p>
            </div>

            <div className="relative max-w-7xl mx-auto">
              {/* Desktop Horizontal Layout */}
              <div className="hidden lg:block">
                <div className="flex items-start justify-between gap-6 relative">
                  {steps.map((step, index) => (
                    <div key={index} className="flex items-center flex-1">
                      {/* Step Card */}
                      <div className="relative flex-1 max-w-xs">
                        <Card className="border-0 shadow-[var(--shadow-card)] hover:shadow-lg transition-all duration-300 hover:-translate-y-2 h-48 bg-gradient-to-r from-primary to-secondary">
                          <CardContent className="p-4 h-full flex flex-col items-center justify-center text-center text-primary-foreground">
                            {/* Large Step Number */}
                            <div className="w-12 h-12 bg-accent text-accent-foreground rounded-full flex items-center justify-center mb-3 text-xl font-bold shadow-[var(--shadow-button)]">
                              {step.number}
                            </div>
                            
                            {/* Icon */}
                            <div className="mb-3">
                              <div className="w-8 h-8 flex items-center justify-center text-primary-foreground">
                                {step.icon}
                              </div>
                            </div>
                            
                            {/* Title Only */}
                            <h3 className="text-lg font-bold font-sans text-primary-foreground leading-tight">
                              {step.title}
                            </h3>
                          </CardContent>
                        </Card>
                      </div>
                      
                      {/* Arrow */}
                      {index < steps.length - 1 && (
                        <div className="flex-shrink-0 px-4">
                          <ArrowRight className="h-6 w-6 text-primary animate-pulse" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Mobile/Tablet Vertical Layout */}
              <div className="lg:hidden space-y-8">
                {steps.map((step, index) => (
                  <div key={index} className="relative">
                    {/* Connector Line for mobile */}
                    {index < steps.length - 1 && (
                      <div className="absolute left-1/2 -bottom-4 w-0.5 h-8 bg-border transform -translate-x-0.5 z-10"></div>
                    )}
                    
                    <Card className="border-0 shadow-[var(--shadow-card)] hover:shadow-lg transition-all duration-300">
                      <div className={`bg-gradient-to-r ${step.color} p-1 rounded-lg`}>
                        <CardContent className="bg-background p-6 rounded-md">
                          <div className="flex items-start gap-6">
                            {/* Step Number and Icon */}
                            <div className="flex-shrink-0 text-center">
                              <div className="w-12 h-12 bg-accent text-accent-foreground rounded-full flex items-center justify-center mb-3 text-xl font-bold shadow-[var(--shadow-button)]">
                                {step.number}
                              </div>
                              <div className="flex justify-center">
                                {step.icon}
                              </div>
                            </div>
                            
                            {/* Content */}
                            <div className="flex-1">
                              <h3 className="text-xl font-bold font-sans text-primary mb-3">
                                {step.title}
                              </h3>
                              <p className="text-muted-foreground mb-4 font-serif">
                                {step.description}
                              </p>
                              <ul className="space-y-2">
                                {step.details.map((detail, detailIndex) => (
                                  <li key={detailIndex} className="flex items-center text-sm text-muted-foreground">
                                    <CheckCircle className="h-4 w-4 text-secondary mr-2 flex-shrink-0" />
                                    <span>{detail}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </CardContent>
                      </div>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold font-sans text-primary mb-4">
                Why Choose True North Business Loan?
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-serif">
                We're more than just a loan marketplace - we're your partner in business growth
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {benefits.map((benefit, index) => (
                <Card key={index} className="text-center border-0 shadow-[var(--shadow-card)] hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
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
        </div>
      </section>

      {/* FAQs Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold font-sans text-primary mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-xl text-muted-foreground font-serif">
                Get answers to common questions about our process
              </p>
            </div>

            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left text-lg font-semibold font-sans text-primary">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground font-serif">
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
            Ready to Get Started?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto font-serif">
            Use our Business Loan Estimator and discover your funding options today
          </p>
          <Button asChild size="xl" variant="secondary" className="text-lg px-8">
            <Link to="/loan-estimator">
              Start Your Application
              <ArrowRight className="h-5 w-5 ml-2" />
            </Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HowItWorks;