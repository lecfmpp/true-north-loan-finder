import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, Circle, AlertCircle, RefreshCw, Lightbulb, Link, Tags, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface BlogPost {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: string;
  status: string;
  tags: string[];
  featured_image_url?: string;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string[];
  reading_time?: number;
}

interface SEOAnalyzerProps {
  formData: BlogPost;
  setFormData: React.Dispatch<React.SetStateAction<BlogPost>>;
}

interface SEOCheck {
  id: string;
  label: string;
  status: 'pass' | 'warning' | 'fail';
  description: string;
  suggestion?: string;
}

interface SuggestionData {
  internalLinks: Array<{ title: string; slug: string; url: string }>;
  keywordSuggestions: string[];
  metaDescriptions: string[];
}

const SEOAnalyzer = ({ formData, setFormData }: SEOAnalyzerProps) => {
  const [businessKeywords, setBusinessKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [seoScore, setSeoScore] = useState(0);
  const [checks, setChecks] = useState<SEOCheck[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestionData>({
    internalLinks: [],
    keywordSuggestions: [],
    metaDescriptions: []
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Extract text content from HTML
  const extractTextFromHTML = (html: string): string => {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  };

  // Count words in content
  const getWordCount = (): number => {
    const textContent = extractTextFromHTML(formData.content);
    return textContent.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  // Count keyword occurrences for all business keywords
  const getKeywordDensity = (): { total: number; details: Array<{ keyword: string; count: number }> } => {
    if (businessKeywords.length === 0) return { total: 0, details: [] };
    const textContent = extractTextFromHTML(formData.content + ' ' + formData.title + ' ' + formData.excerpt).toLowerCase();
    
    const details = businessKeywords.map(keyword => {
      const count = (textContent.match(new RegExp(keyword.toLowerCase(), 'g')) || []).length;
      return { keyword, count };
    });
    
    const total = details.reduce((sum, item) => sum + item.count, 0);
    return { total, details };
  };

  // Check if keywords appear in headings
  const hasKeywordInHeadings = (): boolean => {
    if (businessKeywords.length === 0) return false;
    const headingRegex = /<h[2-6][^>]*>(.*?)<\/h[2-6]>/gi;
    const headings = formData.content.match(headingRegex) || [];
    const headingText = headings.join(' ').toLowerCase();
    return businessKeywords.some(keyword => headingText.includes(keyword.toLowerCase()));
  };

  // Check heading structure
  const getHeadingStructure = (): { hasH2: boolean; hasH3: boolean; count: number } => {
    const h2Count = (formData.content.match(/<h2[^>]*>/gi) || []).length;
    const h3Count = (formData.content.match(/<h3[^>]*>/gi) || []).length;
    return {
      hasH2: h2Count >= 2,
      hasH3: h3Count > 0,
      count: h2Count + h3Count
    };
  };

  // Check for links
  const getLinkInfo = (): { internal: number; external: number } => {
    const linkRegex = /<a\s+[^>]*href\s*=\s*["']([^"']+)["'][^>]*>/gi;
    const links = Array.from(formData.content.matchAll(linkRegex));
    
    let internal = 0;
    let external = 0;
    
    links.forEach(link => {
      const href = link[1];
      if (href.startsWith('http') && !href.includes(window.location.hostname)) {
        external++;
      } else if (href.startsWith('/') || href.includes(window.location.hostname)) {
        internal++;
      }
    });
    
    return { internal, external };
  };

  // Check for images with alt text
  const hasImagesWithAlt = (): boolean => {
    const imgRegex = /<img[^>]+>/gi;
    const images = formData.content.match(imgRegex) || [];
    return images.every(img => img.includes('alt='));
  };

  // Fetch internal links for suggestions
  const fetchInternalLinks = async () => {
    try {
      const { data: blogPosts, error } = await supabase
        .from('blog_posts')
        .select('title, slug')
        .eq('status', 'published')
        .neq('slug', formData.slug)
        .limit(10);

      if (error) throw error;

      const internalLinks = blogPosts?.map(post => ({
        title: post.title,
        slug: post.slug,
        url: `/blog/${post.slug}`
      })) || [];

      return internalLinks;
    } catch (error) {
      console.error('Error fetching internal links:', error);
      return [];
    }
  };

  // Generate keyword suggestions based on content
  const generateKeywordSuggestions = (): string[] => {
    const textContent = extractTextFromHTML(formData.content + ' ' + formData.title).toLowerCase();
    const commonBusinessKeywords = [
      'business loan', 'equipment financing', 'working capital', 'cash flow',
      'small business', 'financing options', 'business funding', 'merchant cash advance',
      'invoice factoring', 'business credit', 'startup funding', 'business expansion'
    ];
    
    return commonBusinessKeywords.filter(keyword => 
      !businessKeywords.includes(keyword) && 
      textContent.includes(keyword.toLowerCase())
    ).slice(0, 5);
  };

  // Generate meta description suggestions
  const generateMetaDescriptions = (): string[] => {
    const primaryKeyword = businessKeywords[0] || 'business financing';
    return [
      `Discover ${primaryKeyword} solutions for your business. Expert guidance and competitive rates. Apply online today for fast approval.`,
      `Looking for ${primaryKeyword}? Get the funding your business needs with our comprehensive guide and application process.`,
      `Learn everything about ${primaryKeyword} - requirements, rates, and how to qualify. Start your application now.`
    ];
  };

  // Add keyword function
  const addKeyword = () => {
    if (keywordInput.trim() && !businessKeywords.includes(keywordInput.trim())) {
      setBusinessKeywords(prev => [...prev, keywordInput.trim()]);
      setKeywordInput('');
    }
  };

  // Remove keyword function
  const removeKeyword = (keywordToRemove: string) => {
    setBusinessKeywords(prev => prev.filter(keyword => keyword !== keywordToRemove));
  };

  // Refresh SEO analysis
  const refreshAnalysis = async () => {
    setIsRefreshing(true);
    try {
      const internalLinks = await fetchInternalLinks();
      const keywordSuggestions = generateKeywordSuggestions();
      const metaDescriptions = generateMetaDescriptions();
      
      setSuggestions({
        internalLinks,
        keywordSuggestions,
        metaDescriptions
      });
    } catch (error) {
      console.error('Error refreshing analysis:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Update SEO analysis
  useEffect(() => {
    const wordCount = getWordCount();
    const keywordData = getKeywordDensity();
    const headingStructure = getHeadingStructure();
    const linkInfo = getLinkInfo();
    const hasKeywordInH = hasKeywordInHeadings();
    const hasAltText = hasImagesWithAlt();

    const primaryKeyword = businessKeywords[0];
    const hasKeywordInMeta = primaryKeyword && formData.meta_title?.toLowerCase().includes(primaryKeyword.toLowerCase());
    const hasKeywordInDesc = primaryKeyword && formData.meta_description?.toLowerCase().includes(primaryKeyword.toLowerCase());

    const newChecks: SEOCheck[] = [
      {
        id: 'word-count',
        label: `Word Count: ${wordCount} words`,
        status: wordCount >= 1200 ? 'pass' : wordCount >= 800 ? 'warning' : 'fail',
        description: 'Target: 1,200+ words for better SEO',
        suggestion: wordCount < 800 ? 'Add more detailed explanations, examples, or related topics to reach the target word count.' : undefined
      },
      {
        id: 'keyword-density',
        label: `Business Keywords: ${keywordData.total} total mentions`,
        status: keywordData.total >= 8 && keywordData.total <= 15 ? 'pass' : keywordData.total > 0 ? 'warning' : 'fail',
        description: 'Target: 8-15 total keyword mentions across all business keywords',
        suggestion: keywordData.total < 8 ? 'Naturally incorporate your business keywords more throughout the content.' : undefined
      },
      {
        id: 'meta-title',
        label: 'Keyword in Meta Title',
        status: hasKeywordInMeta ? 'pass' : 'fail',
        description: 'Include primary keyword in meta title',
        suggestion: !hasKeywordInMeta && primaryKeyword ? `Include "${primaryKeyword}" in your meta title for better search visibility.` : undefined
      },
      {
        id: 'meta-description',
        label: 'Keyword in Meta Description',
        status: hasKeywordInDesc ? 'pass' : 'fail',
        description: 'Include primary keyword in meta description',
        suggestion: !hasKeywordInDesc && primaryKeyword ? `Add "${primaryKeyword}" to your meta description naturally.` : undefined
      },
      {
        id: 'heading-structure',
        label: `H2 Headings Used: ${headingStructure.count}`,
        status: headingStructure.hasH2 ? 'pass' : 'fail',
        description: 'Use at least 2 H2 headings to structure content',
        suggestion: !headingStructure.hasH2 ? 'Break your content into logical sections using H2 headings for better readability and SEO.' : undefined
      },
      {
        id: 'keyword-in-headings',
        label: 'Keywords in Subheadings',
        status: hasKeywordInH ? 'pass' : 'warning',
        description: 'Include business keywords in at least one H2 or H3 heading',
        suggestion: !hasKeywordInH ? 'Add your main business keywords to section headings naturally.' : undefined
      },
      {
        id: 'internal-links',
        label: `Internal Links: ${linkInfo.internal}`,
        status: linkInfo.internal >= 3 ? 'pass' : linkInfo.internal >= 1 ? 'warning' : 'fail',
        description: 'Target: 3+ internal links to other relevant pages',
        suggestion: linkInfo.internal < 3 ? 'Add more internal links to related blog posts or service pages.' : undefined
      },
      {
        id: 'external-links',
        label: `External Links: ${linkInfo.external}`,
        status: linkInfo.external >= 1 ? 'pass' : 'warning',
        description: 'Target: 1-2 external links to authoritative sources',
        suggestion: linkInfo.external < 1 ? 'Add links to credible external sources to support your content.' : undefined
      },
      {
        id: 'image-alt-text',
        label: 'Image Alt Text',
        status: hasAltText ? 'pass' : 'warning',
        description: 'All images should have descriptive alt text with keywords',
        suggestion: !hasAltText ? 'Add descriptive alt text to all images, including relevant keywords where appropriate.' : undefined
      }
    ];

    setChecks(newChecks);

    // Calculate SEO score
    const passCount = newChecks.filter(check => check.status === 'pass').length;
    const warningCount = newChecks.filter(check => check.status === 'warning').length;
    const score = Math.round(((passCount * 1 + warningCount * 0.5) / newChecks.length) * 100);
    setSeoScore(score);
  }, [formData, businessKeywords]);

  // Load suggestions on mount
  useEffect(() => {
    refreshAnalysis();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'fail':
        return <Circle className="w-4 h-4 text-red-500" />;
      default:
        return <Circle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Business Keywords Input */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Tags className="w-5 h-5" />
            Business Keywords
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="business-keywords">Add Business Keywords</Label>
            <div className="flex gap-2">
              <Input
                id="business-keywords"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                placeholder="e.g., equipment financing, business loans"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addKeyword();
                  }
                }}
              />
              <Button type="button" onClick={addKeyword} size="sm">Add</Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Add multiple keywords related to your business and services
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {businessKeywords.map((keyword) => (
              <Badge key={keyword} variant="secondary" className="cursor-pointer">
                {keyword}
                <button
                  onClick={() => removeKeyword(keyword)}
                  className="ml-2 text-muted-foreground hover:text-foreground"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>

          <div className="flex justify-between items-center">
            <div className="text-center flex-1">
              <div className={`text-3xl font-bold ${getScoreColor(seoScore)}`}>
                {seoScore}/100
              </div>
              <p className="text-sm text-muted-foreground">SEO Score</p>
              <Progress value={seoScore} className="mt-2" />
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshAnalysis}
              disabled={isRefreshing}
              className="ml-4"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* SEO Checklist with Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">SEO Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {checks.map((check) => (
              <div key={check.id} className="p-3 rounded-lg bg-muted/50">
                <div className="flex items-start gap-3">
                  {getStatusIcon(check.status)}
                  <div className="flex-1">
                    <div className="font-medium text-sm">{check.label}</div>
                    <div className="text-xs text-muted-foreground">{check.description}</div>
                    {check.suggestion && (
                      <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/30 rounded text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2">
                        <Lightbulb className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <span>{check.suggestion}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            AI Suggestions
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowSuggestions(!showSuggestions)}
          >
            {showSuggestions ? 'Hide' : 'Show'} Suggestions
          </Button>
        </CardHeader>
        {showSuggestions && (
          <CardContent className="space-y-4">
            {/* Internal Links Suggestions */}
            <div>
              <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                <Link className="w-4 h-4" />
                Suggested Internal Links
              </h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {suggestions.internalLinks.map((link) => (
                  <div key={link.slug} className="text-xs p-2 bg-muted rounded flex justify-between items-center">
                    <span>{link.title}</span>
                    <code className="text-xs bg-background px-1 rounded">{link.url}</code>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Select text in your content and use the link tool to add these internal links
              </p>
            </div>

            {/* Keyword Suggestions */}
            <div>
              <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                <Tags className="w-4 h-4" />
                Related Keywords to Include
              </h4>
              <div className="flex flex-wrap gap-2">
                {suggestions.keywordSuggestions.map((keyword) => (
                  <Badge 
                    key={keyword} 
                    variant="outline" 
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => setBusinessKeywords(prev => [...prev, keyword])}
                  >
                    + {keyword}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Meta Description Suggestions */}
            <div>
              <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Meta Description Ideas
              </h4>
              <div className="space-y-2">
                {suggestions.metaDescriptions.map((desc, index) => (
                  <div 
                    key={index}
                    className="text-xs p-2 bg-muted rounded cursor-pointer hover:bg-muted/80"
                    onClick={() => setFormData(prev => ({ ...prev, meta_description: desc }))}
                  >
                    {desc}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Meta Fields */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Meta Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="meta-title">Meta Title</Label>
            <Input
              id="meta-title"
              value={formData.meta_title || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, meta_title: e.target.value }))}
              placeholder="SEO title for search engines"
              maxLength={60}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {(formData.meta_title || '').length}/60 characters
            </p>
          </div>

          <div>
            <Label htmlFor="meta-description">Meta Description</Label>
            <Textarea
              id="meta-description"
              value={formData.meta_description || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, meta_description: e.target.value }))}
              placeholder="Brief description for search engine results"
              maxLength={160}
              rows={3}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {(formData.meta_description || '').length}/160 characters
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SEOAnalyzer;