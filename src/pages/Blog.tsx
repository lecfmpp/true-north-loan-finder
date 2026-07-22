import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, User, ArrowRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { getSsrBlogList } from "@/lib/ssr-data";
import { supabase } from "@/integrations/supabase/client";
import OptimizedImage from "@/components/OptimizedImage";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  author: string;
  tags: string[];
  created_at: string;
  featured_image_url?: string;
}

const Blog = () => {
  // During prerendering the effect below never runs, so the list is preloaded
  // by the build and read synchronously here. In the browser this is always
  // undefined and the fetch behaves exactly as before.
  const ssrPosts = getSsrBlogList();
  const [posts, setPosts] = useState<BlogPost[]>(ssrPosts ?? []);
  const [loading, setLoading] = useState(!ssrPosts);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const { data, error } = await supabase
          .from('blog_posts')
          .select('id, title, slug, excerpt, author, tags, created_at, featured_image_url')
          .eq('status', 'published')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setPosts(data || []);
      } catch (error) {
        console.error('Error fetching blog posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Structured data for blog listing
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "True North Business Loan Blog",
    "description": "Expert guidance, tips, and insights to help Canadian businesses secure the right financing for growth and success.",
    "url": "https://truenorthbusinessloan.ca/blog",
    "publisher": {
      "@type": "Organization",
      "name": "True North Business Loan",
      "logo": {
        "@type": "ImageObject",
        "url": "https://truenorthbusinessloan.ca/lovable-uploads/eae8a3b3-6d86-4fe4-9e17-17b808de0d2e.png"
      }
    },
    "blogPost": posts.map(post => ({
      "@type": "BlogPosting",
      "headline": post.title,
      "description": post.excerpt,
      "url": `https://truenorthbusinessloan.ca/blog/${post.slug}`,
      "datePublished": post.created_at,
      "author": {
        "@type": "Organization",
        "name": post.author
      }
    }))
  };

  // Held in a variable so the loading state below renders it too. Previously the
  // `if (loading)` early return sat above this, so server-side rendering — which
  // never resolves the fetch — emitted the page with no title, description or
  // canonical at all.
  const seoHead = (
    <SEOHead
      title="Business Financing Insights | True North Business Loan Blog"
      description="Expert guidance, tips, and insights to help Canadian businesses secure the right financing for growth and success. Read our latest articles on business loans, equipment financing, and more."
      keywords={[
        "business financing blog",
        "canadian business loans",
        "small business financing tips",
        "equipment financing guide",
        "business loan advice",
        "entrepreneurship canada"
      ]}
      canonicalUrl="https://truenorthbusinessloan.ca/blog"
      structuredData={structuredData}
    />
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        {seoHead}
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-muted rounded w-64 mx-auto mb-4"></div>
              <div className="h-4 bg-muted rounded w-96 mx-auto"></div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {seoHead}
      <Header />
      
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl lg:text-5xl font-bold font-sans text-primary mb-6">
              Business Financing Insights
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto font-serif">
              Expert guidance, tips, and insights to help Canadian businesses secure the right financing for growth and success.
            </p>
          </div>
        </div>
      </section>

      {/* Blog Posts */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          {posts.length === 0 ? (
            <div className="text-center">
              <p className="text-muted-foreground font-serif">No blog posts found.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {posts.map((post) => (
                <Card key={post.id} className="group border-0 shadow-[var(--shadow-card)] hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <CardHeader>
                    {post.featured_image_url && (
                      <OptimizedImage
                        src={(() => {
                          const url = post.featured_image_url || '';
                          if (!url) return '/placeholder.svg';
                          if (url.startsWith('http') || url.startsWith('/')) return url;
                          if (url.startsWith('lovable-uploads/')) return `/${url}`;
                          if (url.startsWith('blog-images/')) {
                            const { data } = supabase.storage
                              .from('blog-images')
                              .getPublicUrl(url.replace(/^blog-images\//, ''));
                            return data.publicUrl;
                          }
                          return url;
                        })()}
                        alt={`${post.title} - Canadian business financing guide`}
                        className="w-full h-48 rounded-lg mb-4"
                        sizes="(max-width: 1024px) 100vw, 33vw"
                      />
                    )}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {post.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <CardTitle className="text-xl font-semibold font-sans text-primary line-clamp-2 group-hover:text-secondary transition-colors">
                      {post.title}
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent>
                    <p className="text-muted-foreground font-serif mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        <span>{post.author}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>{formatDate(post.created_at)}</span>
                      </div>
                    </div>
                    
                    <Button asChild variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Link to={`/blog/${post.slug}`} className="flex items-center justify-center">
                        Read More
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold font-sans text-primary mb-4">
            Ready to Apply What You've Learned?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto font-serif">
            Use our Business Loan Estimator to see what financing options are available for your business based on your unique situation.
          </p>
          <Button asChild variant="cta" size="lg">
            <Link to="/loan-estimator">Get My Loan Estimate</Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Blog;