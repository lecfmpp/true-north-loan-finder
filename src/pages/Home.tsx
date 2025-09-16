import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  Shield, 
  Clock, 
  Users, 
  TrendingUp, 
  CreditCard,
  Star,
  Quote,
  Phone,
  Flag
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import OptimizedImage from "@/components/OptimizedImage";



const Home = () => {
  const trustIndicators = [
    { icon: "🔒", text: "Secure" },
    { icon: "⚡", text: "Fast Funding" }
  ];

  const steps = [
    {
      number: "1",
      title: "Start Your Application",
      description: "Tell us about your business in 60 seconds. No waiting rooms, no lengthy forms - just the essentials we need to find your perfect match.",
      icon: <CheckCircle className="h-8 w-8 text-secondary" />
    },
    {
      number: "2", 
      title: "Receive Your Pre-Offer",
      description: "Get matched with pre-screened lenders who actually want your business. See real offers with real terms - not vague estimates.",
      icon: <TrendingUp className="h-8 w-8 text-secondary" />
    },
    {
      number: "3",
      title: "Funds Deposited in Your Bank", 
      description: "Accept your offer and watch the money hit your account. Often same-day, always transparent - because your business can't wait for bureaucracy.",
      icon: <Phone className="h-8 w-8 text-secondary" />
    }
  ];

  const loanCategories = [
    {
      title: "Equipment Financing",
      description: "Finance vehicles, machinery, and equipment with competitive rates",
      amount: "$5K - $500K",
      icon: <CreditCard className="h-6 w-6 text-secondary" />,
      link: "/equipment-financing"
    },
    {
      title: "Small Business Loans",
      description: "Flexible term loans for growth, inventory, and working capital",
      amount: "$10K - $800K", 
      icon: <TrendingUp className="h-6 w-6 text-secondary" />,
      link: "/small-business-loans"
    }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      business: "Chen's Bakery",
      location: "Toronto, ON",
      country: "Canada",
      quote: "The Business Loan Estimator was so simple, and I had three lender matches within minutes. We got our equipment loan approved in just 5 days!",
      rating: 5,
      flag: "🇨🇦"
    },
    {
      name: "Mike Rodriguez", 
      business: "Rodriguez Construction",
      location: "Austin, TX",
      country: "United States",
      quote: "True North connected us with the perfect lender for our truck financing. The process was seamless and we got funded fast.",
      rating: 5,
      flag: "🇺🇸"
    },
    {
      name: "Jennifer Thompson",
      business: "Digital Marketing Pro",
      location: "Vancouver, BC", 
      country: "Canada",
      quote: "As a tech startup, finding the right financing was crucial. The Business Loan Estimator matched us with lenders who understood our business model.",
      rating: 5,
      flag: "🇨🇦"
    },
    {
      name: "David Johnson",
      business: "Johnson's Auto Repair",
      location: "Phoenix, AZ",
      country: "United States", 
      quote: "I needed equipment financing fast, and True North delivered. Got approved in 3 days with competitive rates. Highly recommend!",
      rating: 5,
      flag: "🇺🇸"
    }
  ];

  // Structured data for homepage
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "True North Business Loan",
    "url": "https://truenorthbusinessloan.ca",
    "logo": "https://truenorthbusinessloan.ca/lovable-uploads/eae8a3b3-6d86-4fe4-9e17-17b808de0d2e.png",
    "description": "Trusted business loan marketplace helping small businesses in the US and Canada find the right financing from $5K to $800K.",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": ["US", "CA"]
    },
    "sameAs": [],
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://truenorthbusinessloan.ca/loan-estimator",
      "query-input": "required name=search_term_string"
    },
    "offers": {
      "@type": "Offer",
      "description": "Business loans from $5,000 to $800,000 for small businesses in the US and Canada",
      "priceRange": "$5,000 - $800,000"
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Find the Right Business Loan for Your Small Business | True North Business Loan"
        description="Take our 60-second quiz to see your loan options from top lenders in the US and Canada. Get $5K to $800K for your small business. Equipment financing, working capital, and more."
        keywords={[
          "business loans",
          "small business loans",
          "equipment financing",
          "small business financing",
          "business loan calculator", 
          "business funding",
          "commercial loans",
          "business line of credit",
          "merchant cash advance",
          "working capital loans",
          "business loans USA",
          "business loans Canada"
        ]}
        canonicalUrl="https://truenorthbusinessloan.ca"
        structuredData={structuredData}
      />
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-12 lg:py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5"></div>
        <div className="container mx-auto px-4 relative">
          <div className="grid lg:grid-cols-5 gap-12 items-center max-w-7xl mx-auto">
            {/* Left Column - Text Content (60% width) */}
            <div className="lg:col-span-3 text-left lg:pl-8 lg:pr-12">
              <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm font-medium bg-yellow-400 text-black">
                Your Trusted Business Loan Provider
              </Badge>
              
              <h1 className="text-4xl lg:text-6xl font-bold font-sans text-primary mb-6 leading-tight">
                Need <span className="text-accent">business loan</span>, like, <span className="text-accent">yesterday</span>?
              </h1>
              
              <p className="text-xl lg:text-2xl text-muted-foreground mb-8 font-serif">
                Stop chasing paperwork and waiting weeks for an answer. Get the capital you need to cover payroll, buy inventory, or seize your next big opportunity. Apply in minutes, get a decision today.
              </p>
              
              <div className="mb-6">
                <Button asChild variant="cta" size="xl" className="text-lg px-8 bg-accent hover:bg-accent/90 text-accent-foreground">
                  <Link to="/loan-estimator">Get My Funding Estimate</Link>
                </Button>
              </div>
              
              {/* Funding Criteria */}
              <div className="mb-6 space-y-3">
                <div className="flex items-center gap-3 text-primary">
                  <CheckCircle className="h-5 w-5 text-secondary flex-shrink-0" />
                  <span className="font-medium">Business Bank Account</span>
                </div>
                <div className="flex items-center gap-3 text-primary">
                  <CheckCircle className="h-5 w-5 text-secondary flex-shrink-0" />
                  <span className="font-medium">6+ Months in Business</span>
                </div>
                <div className="flex items-center gap-3 text-primary">
                  <CheckCircle className="h-5 w-5 text-secondary flex-shrink-0" />
                  <span className="font-medium">$10k+ Average Monthly Revenue</span>
                </div>
              </div>
              
              {/* Trust Indicators */}
              <div className="flex items-center justify-start gap-6 text-sm text-muted-foreground mb-12">
                {trustIndicators.map((item, index) => (
                  <div key={index} className="flex items-center gap-1.5">
                    <span className="text-base">{item.icon}</span>
                    <span className="font-medium">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Right Column - Image (40% width) */}
            <div className="lg:col-span-2">
              <div className="relative">
                <OptimizedImage
                  src="/lovable-uploads/b490bc99-b9b3-432b-aac9-6a6af67fd9fc.png"
                  alt="Professional business owner working on laptop - True North Business Loan helps small businesses get funding fast"
                  width={600}
                  height={400}
                  priority={true}
                  className="w-full h-auto rounded-2xl shadow-[var(--shadow-card)]"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 40vw"
                  responsive={true}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold font-sans text-primary mb-4">
              How It Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-serif">
              Get your funding in three simple steps
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {steps.map((step, index) => (
              <Card key={index} className="text-center border-0 shadow-[var(--shadow-card)] hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-8">
                   <div className="w-[90px] h-[90px] bg-accent text-accent-foreground rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-2xl">
                     {step.number}
                   </div>
                  <h3 className="text-xl font-semibold font-sans text-primary mb-3">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground font-serif">
                    {step.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Loan Categories Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold font-sans text-primary mb-4">
              Our Top-Rated Loan Categories
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-serif">
              Explore financing options tailored to your business needs
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {loanCategories.map((category, index) => (
              <Card key={index} className="group border-0 shadow-[var(--shadow-card)] hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-8">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                      {category.icon}
                    </div>
                    <Badge variant="secondary" className="text-xs font-medium">
                      {category.amount}
                    </Badge>
                  </div>
                  <h3 className="text-xl font-semibold font-sans text-primary mb-3">
                    {category.title}
                  </h3>
                  <p className="text-muted-foreground mb-6 font-serif">
                    {category.description}
                  </p>
                  <Button asChild variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Link to={category.link}>Learn More</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Button asChild variant="cta" size="lg">
              <Link to="/loan-estimator">Use the Loan Estimator</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold font-sans text-primary mb-4">
              What Business Owners Say
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-serif">
              Real stories from businesses we've helped secure funding across the US and Canada
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-[var(--shadow-card)] hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                      ))}
                    </div>
                    <span className="text-2xl">{testimonial.flag}</span>
                  </div>
                  <Quote className="h-6 w-6 text-accent mb-3" />
                  <p className="text-muted-foreground mb-4 font-serif italic text-sm">
                    "{testimonial.quote}"
                  </p>
                  <div>
                    <div className="font-semibold font-sans text-primary text-sm">
                      {testimonial.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {testimonial.business}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {testimonial.location}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-secondary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold font-sans mb-4">
            Worried About Cash Flow? Let's Fix That.
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto font-serif">
            We get it. Payroll, inventory, and unexpected costs can't wait. We provide fast, direct funding from $5,000 to $800K so you can get back to what matters: running your business.
          </p>
          <Button asChild size="xl" variant="secondary" className="text-lg px-8">
            <Link to="/loan-estimator">Check My Eligibility Now</Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;