import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, User, Share2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import OptimizedImage from "@/components/OptimizedImage";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  author: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  featured_image_url?: string;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string[];
  reading_time?: number;
}

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchPost = async () => {
      if (!slug) return;

      try {
        const { data, error } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('slug', slug)
          .eq('status', 'published')
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            setNotFound(true);
          } else {
            throw error;
          }
        } else {
          setPost(data);
        }
      } catch (error) {
        console.error('Error fetching blog post:', error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

  // Normalize and enhance images inside the HTML content
  useEffect(() => {
    if (!post) return;
    const container = contentRef.current;
    if (!container) return;
    const imgs = container.querySelectorAll('img');
    imgs.forEach((img) => {
      const original = img.getAttribute('src') || '';
      let finalSrc = original;
      if (original && !original.startsWith('http') && !original.startsWith('/')) {
        if (original.startsWith('lovable-uploads/')) {
          finalSrc = `/${original}`;
        } else if (original.startsWith('blog-images/')) {
          const { data } = supabase.storage
            .from('blog-images')
            .getPublicUrl(original.replace(/^blog-images\//, ''));
          finalSrc = data.publicUrl;
        }
      }
      if (finalSrc !== original) img.setAttribute('src', finalSrc);
      img.setAttribute('loading', 'lazy');
      img.setAttribute('decoding', 'async');
      img.onerror = () => { img.setAttribute('src', '/placeholder.svg'); };
      img.classList.add('max-w-full', 'h-auto', 'rounded');
      if (!img.getAttribute('alt')) img.setAttribute('alt', `${post.title} image`);
    });
  }, [post]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-muted rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-muted rounded w-1/2 mb-8"></div>
              <div className="space-y-4">
                <div className="h-4 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl font-bold text-primary mb-4">Post Not Found</h1>
            <p className="text-muted-foreground mb-8">The blog post you're looking for doesn't exist.</p>
            <Button asChild variant="outline">
              <Link to="/blog">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Blog
              </Link>
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!post) return null;

  // SEO data
  const currentUrl = `https://truenorthbusinessloan.ca/blog/${post.slug}`;
  const seoTitle = post.meta_title || `${post.title} | True North Business Loan`;
  const seoDescription = post.meta_description || post.excerpt || post.title;
  const seoKeywords = post.meta_keywords || [...post.tags, 'business loans canada', 'small business financing'];
  
  // Structured data for article
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.title,
    "description": seoDescription,
    "image": post.featured_image_url || "https://truenorthbusinessloan.ca/lovable-uploads/e80bb666-2b36-4875-bd9f-78f3e944d749.png",
    "author": {
      "@type": "Organization",
      "name": post.author,
      "url": "https://truenorthbusinessloan.ca"
    },
    "publisher": {
      "@type": "Organization",
      "name": "True North Business Loan",
      "logo": {
        "@type": "ImageObject",
        "url": "https://truenorthbusinessloan.ca/lovable-uploads/eae8a3b3-6d86-4fe4-9e17-17b808de0d2e.png"
      }
    },
    "datePublished": post.created_at,
    "dateModified": post.updated_at,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": currentUrl
    },
    "keywords": seoKeywords.join(', '),
    "articleSection": "Business Financing",
    "wordCount": post.reading_time ? post.reading_time * 200 : undefined
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        keywords={seoKeywords}
        canonicalUrl={currentUrl}
        ogType="article"
        ogImage={post.featured_image_url}
        article={{
          author: post.author,
          publishedTime: post.created_at,
          modifiedTime: post.updated_at,
          section: "Business Financing",
          tags: post.tags
        }}
        structuredData={structuredData}
      />
      <Header />
      
      <article className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <Button asChild variant="ghost" className="mb-8">
              <Link to="/blog">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Blog
              </Link>
            </Button>

            {/* Featured Image */}
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
                alt={`Featured image for ${post.title} - Canadian business financing guide`}
                className="w-full h-64 md:h-96 rounded-lg mb-8"
                priority
              />
            )}

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-6">
              {post.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>

            {/* Author and Meta Info */}
            <div className="flex items-center justify-between border-b border-border pb-6 mb-8">
              <div className="flex items-center space-x-6 text-muted-foreground">
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  <span className="font-medium">{post.author}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>{formatDate(post.created_at)}</span>
                </div>
                {post.reading_time && (
                  <div className="flex items-center">
                    <span>{post.reading_time} min read</span>
                  </div>
                )}
              </div>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>

            {/* Content Container with new blog-content styling */}
            <div className="blog-content" ref={contentRef}>
              <div dangerouslySetInnerHTML={{ __html: post.content }} />
            </div>

            {/* CTA Section */}
            <div className="mt-16 p-8 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg text-center">
              <h3 className="text-2xl font-bold font-sans text-primary mb-4">
                Ready to Get Started?
              </h3>
              <p className="text-muted-foreground font-serif mb-6">
                Use our Business Loan Estimator to see what financing options are available for your business.
              </p>
              <Button asChild variant="cta" size="lg">
                <Link to="/loan-estimator">Get My Loan Estimate</Link>
              </Button>
            </div>

          </div>
        </div>
      </article>

      <Footer />
    </div>
  );
};

export default BlogPost;