import Header from "@/components/Header";
import Footer from "@/components/Footer";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl lg:text-5xl font-bold font-sans text-primary mb-6">
              Privacy Policy
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-serif">
              Your privacy is important to us. This policy explains how we collect, use, and protect your information.
            </p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto prose prose-lg">
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-primary mb-4">Information We Collect</h2>
                <p className="text-muted-foreground mb-4">
                  We collect information you provide directly to us, such as when you create an account, 
                  fill out a form, or contact us. This may include:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Personal information (name, email address, phone number)</li>
                  <li>Business information (company name, industry, revenue)</li>
                  <li>Financial information (credit score, loan requirements)</li>
                  <li>Usage data (how you interact with our platform)</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-primary mb-4">How We Use Your Information</h2>
                <p className="text-muted-foreground mb-4">
                  We use the information we collect to:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Provide and improve our services</li>
                  <li>Connect you with suitable lenders</li>
                  <li>Process loan applications and requests</li>
                  <li>Communicate with you about our services</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-primary mb-4">Information Sharing</h2>
                <p className="text-muted-foreground mb-4">
                  We may share your information with:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Lenders and financial institutions you choose to work with</li>
                  <li>Service providers who help us operate our platform</li>
                  <li>Legal authorities when required by law</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  We never sell your personal information to third parties.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-primary mb-4">Data Security</h2>
                <p className="text-muted-foreground">
                  We implement appropriate security measures to protect your information against 
                  unauthorized access, alteration, disclosure, or destruction. This includes 
                  encryption, secure servers, and regular security audits.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-primary mb-4">Your Rights</h2>
                <p className="text-muted-foreground mb-4">
                  You have the right to:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Access your personal information</li>
                  <li>Correct inaccurate information</li>
                  <li>Request deletion of your information</li>
                  <li>Opt out of marketing communications</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-primary mb-4">Contact Us</h2>
                <p className="text-muted-foreground">
                  If you have any questions about this Privacy Policy, please contact us at:
                </p>
                <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                  <p className="text-muted-foreground">
                    <strong>Email:</strong> privacy@truenorthbusinessloan.ca<br />
                    <strong>Phone:</strong> 1-800-TRUE-NORTH<br />
                    <strong>Address:</strong> Kitchener, Ontario, Canada
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground italic">
                  This Privacy Policy was last updated on January 13, 2025.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;