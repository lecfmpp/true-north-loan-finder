import CalendlyInline from "@/components/CalendlyInline";
import SEOHead from "@/components/SEOHead";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const BrokerSignup = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="Broker Partnership Program - True North Business Loan"
        description="Join our broker partnership program and start earning commissions on business loan referrals."
        keywords={["broker partnership", "business loan broker", "earn commissions", "broker program"]}
      />
      
      <Header />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-6">
            Join Our Broker Partnership Program
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8">
            Partner with us and earn competitive commissions by referring quality business loan clients. Schedule a call to learn more about our exclusive broker opportunities.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <CalendlyInline 
            url="https://calendly.com/your-calendly-link" 
            height={700} 
          />
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default BrokerSignup;