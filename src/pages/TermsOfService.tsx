
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";

const TermsOfService = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Terms of Service - True North Business Loan",
    "description": "Terms of service for True North Business Loan - the rules and conditions for using our business loan platform.",
    "url": "https://truenorthbusinessloan.ca/terms",
    "mainEntity": {
      "@type": "Organization",
      "name": "True North Business Loan",
      "url": "https://truenorthbusinessloan.ca"
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Terms of Service - True North Business Loan"
        description="Terms of service for True North Business Loan - the rules and conditions for using our business loan platform in Canada."
        keywords={["terms of service", "user agreement", "business loan terms", "legal terms"]}
        canonicalUrl="https://truenorthbusinessloan.ca/terms"
        structuredData={structuredData}
      />
      <Header />
      
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl lg:text-5xl font-bold font-sans text-primary mb-6">
              Terms of Service
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-serif">
              Please read these terms carefully before using our services.
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
                <h2 className="text-2xl font-bold text-primary mb-4">Acceptance of Terms</h2>
                <p className="text-muted-foreground">
                  By accessing and using True North Business Loan's platform, you accept and agree 
                  to be bound by the terms and provision of this agreement. If you do not agree 
                  to abide by the above, please do not use this service.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-primary mb-4">Use License</h2>
                <p className="text-muted-foreground mb-4">
                  Permission is granted to temporarily access our platform for personal, 
                  non-commercial transitory viewing only. This is the grant of a license, 
                  not a transfer of title, and under this license you may not:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Modify or copy the materials</li>
                  <li>Use the materials for any commercial purpose or for any public display</li>
                  <li>Attempt to reverse engineer any software contained on the platform</li>
                  <li>Remove any copyright or other proprietary notations from the materials</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-primary mb-4">Platform Services</h2>
                <p className="text-muted-foreground mb-4">
                  True North Business Loan provides a platform that connects business owners 
                  with potential lenders. We do not:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Guarantee loan approval</li>
                  <li>Act as a lender ourselves</li>
                  <li>Control the terms offered by lenders</li>
                  <li>Provide financial advice</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-primary mb-4">User Responsibilities</h2>
                <p className="text-muted-foreground mb-4">
                  As a user of our platform, you agree to:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Provide accurate and truthful information</li>
                  <li>Keep your account information secure</li>
                  <li>Comply with all applicable laws and regulations</li>
                  <li>Not use the platform for illegal activities</li>
                  <li>Respect the intellectual property rights of others</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-primary mb-4">Disclaimer</h2>
                <p className="text-muted-foreground">
                  The materials on True North Business Loan's platform are provided on an 'as is' basis. 
                  True North Business Loan makes no warranties, expressed or implied, and hereby 
                  disclaims and negates all other warranties including without limitation, 
                  implied warranties or conditions of merchantability, fitness for a particular 
                  purpose, or non-infringement of intellectual property or other violation of rights.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-primary mb-4">Limitations</h2>
                <p className="text-muted-foreground">
                  In no event shall True North Business Loan or its suppliers be liable for any 
                  damages (including, without limitation, damages for loss of data or profit, 
                  or due to business interruption) arising out of the use or inability to use 
                  the materials on our platform, even if True North Business Loan or its 
                  authorized representative has been notified orally or in writing of the 
                  possibility of such damage.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-primary mb-4">Accuracy of Materials</h2>
                <p className="text-muted-foreground">
                  The materials appearing on our platform could include technical, typographical, 
                  or photographic errors. True North Business Loan does not warrant that any of 
                  the materials on its platform are accurate, complete, or current. We may make 
                  changes to the materials contained on our platform at any time without notice.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-primary mb-4">Modifications</h2>
                <p className="text-muted-foreground">
                  True North Business Loan may revise these terms of service at any time without notice. 
                  By using this platform, you are agreeing to be bound by the then current version 
                  of these terms of service.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-primary mb-4">Governing Law</h2>
                <p className="text-muted-foreground">
                  These terms and conditions are governed by and construed in accordance with the 
                  laws of Ontario, Canada, and you irrevocably submit to the exclusive jurisdiction 
                  of the courts in that state or location.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-primary mb-4">Contact Information</h2>
                <p className="text-muted-foreground">
                  If you have any questions about these Terms of Service, please contact us at:
                </p>
                <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                  <p className="text-muted-foreground">
                    <strong>Email:</strong> legal@email.truenorthbusinessloan.ca<br />
                    <strong>Phone:</strong> 1-800-TRUE-NORTH<br />
                    <strong>Address:</strong> Kitchener, Ontario, Canada
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground italic">
                  These Terms of Service were last updated on January 21, 2025.
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

export default TermsOfService;
