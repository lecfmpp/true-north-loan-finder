import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Circle, AlertCircle } from 'lucide-react';

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
}

const SEOAnalyzer = ({ formData, setFormData }: SEOAnalyzerProps) => {
  const [primaryKeyword, setPrimaryKeyword] = useState('');
  const [seoScore, setSeoScore] = useState(0);
  const [checks, setChecks] = useState<SEOCheck[]>([]);

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

  // Count keyword occurrences
  const getKeywordDensity = (): number => {
    if (!primaryKeyword) return 0;
    const textContent = extractTextFromHTML(formData.content + ' ' + formData.title + ' ' + formData.excerpt).toLowerCase();
    const keywordCount = (textContent.match(new RegExp(primaryKeyword.toLowerCase(), 'g')) || []).length;
    return keywordCount;
  };

  // Check if keyword appears in headings
  const hasKeywordInHeadings = (): boolean => {
    if (!primaryKeyword) return false;
    const headingRegex = /<h[2-6][^>]*>(.*?)<\/h[2-6]>/gi;
    const headings = formData.content.match(headingRegex) || [];
    const headingText = headings.join(' ').toLowerCase();
    return headingText.includes(primaryKeyword.toLowerCase());
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

  // Update SEO analysis
  useEffect(() => {
    const wordCount = getWordCount();
    const keywordDensity = getKeywordDensity();
    const headingStructure = getHeadingStructure();
    const linkInfo = getLinkInfo();
    const hasKeywordInH = hasKeywordInHeadings();
    const hasAltText = hasImagesWithAlt();

    const newChecks: SEOCheck[] = [
      {
        id: 'word-count',
        label: `Word Count: ${wordCount} words`,
        status: wordCount >= 1200 ? 'pass' : wordCount >= 800 ? 'warning' : 'fail',
        description: 'Target: 1,200+ words for better SEO'
      },
      {
        id: 'keyword-density',
        label: `Primary Keyword: ${keywordDensity} occurrences`,
        status: keywordDensity >= 5 && keywordDensity <= 10 ? 'pass' : keywordDensity > 0 ? 'warning' : 'fail',
        description: 'Target: 5-10 keyword mentions throughout content'
      },
      {
        id: 'meta-title',
        label: 'Keyword in Meta Title',
        status: primaryKeyword && formData.meta_title?.toLowerCase().includes(primaryKeyword.toLowerCase()) ? 'pass' : 'fail',
        description: 'Include primary keyword in meta title'
      },
      {
        id: 'meta-description',
        label: 'Keyword in Meta Description',
        status: primaryKeyword && formData.meta_description?.toLowerCase().includes(primaryKeyword.toLowerCase()) ? 'pass' : 'fail',
        description: 'Include primary keyword in meta description'
      },
      {
        id: 'heading-structure',
        label: `H2 Headings Used: ${headingStructure.count}`,
        status: headingStructure.hasH2 ? 'pass' : 'fail',
        description: 'Use at least 2 H2 headings to structure content'
      },
      {
        id: 'keyword-in-headings',
        label: 'Keyword in Subheadings',
        status: hasKeywordInH ? 'pass' : 'warning',
        description: 'Include keyword in at least one H2 or H3 heading'
      },
      {
        id: 'internal-links',
        label: `Internal Links: ${linkInfo.internal}`,
        status: linkInfo.internal >= 2 ? 'pass' : linkInfo.internal >= 1 ? 'warning' : 'fail',
        description: 'Target: 2+ internal links to other pages'
      },
      {
        id: 'external-links',
        label: `External Links: ${linkInfo.external}`,
        status: linkInfo.external >= 1 ? 'pass' : 'warning',
        description: 'Target: 1-2 external links to authoritative sources'
      },
      {
        id: 'image-alt-text',
        label: 'Image Alt Text',
        status: hasAltText ? 'pass' : 'warning',
        description: 'All images should have descriptive alt text'
      }
    ];

    setChecks(newChecks);

    // Calculate SEO score
    const passCount = newChecks.filter(check => check.status === 'pass').length;
    const warningCount = newChecks.filter(check => check.status === 'warning').length;
    const score = Math.round(((passCount * 1 + warningCount * 0.5) / newChecks.length) * 100);
    setSeoScore(score);
  }, [formData, primaryKeyword]);

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
      {/* Primary Keyword Input */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">SEO Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="primary-keyword">Primary Keyword</Label>
            <Input
              id="primary-keyword"
              value={primaryKeyword}
              onChange={(e) => setPrimaryKeyword(e.target.value)}
              placeholder="e.g., equipment financing"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Enter your main target keyword for SEO analysis
            </p>
          </div>

          <div className="text-center">
            <div className={`text-3xl font-bold ${getScoreColor(seoScore)}`}>
              {seoScore}/100
            </div>
            <p className="text-sm text-muted-foreground">SEO Score</p>
            <Progress value={seoScore} className="mt-2" />
          </div>
        </CardContent>
      </Card>

      {/* SEO Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">SEO Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {checks.map((check) => (
              <div key={check.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                {getStatusIcon(check.status)}
                <div className="flex-1">
                  <div className="font-medium text-sm">{check.label}</div>
                  <div className="text-xs text-muted-foreground">{check.description}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
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
            <Input
              id="meta-description"
              value={formData.meta_description || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, meta_description: e.target.value }))}
              placeholder="Brief description for search engine results"
              maxLength={160}
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