import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Search, 
  FileText, 
  CheckCircle, 
  Loader2, 
  Edit,
  Eye,
  ArrowRight,
  Lightbulb,
  BarChart3,
  Target,
  PenTool,
  Upload
} from 'lucide-react';

interface KeywordOpportunity {
  keyword: string;
  intent: string;
  competition: 'low' | 'medium' | 'high';
}

interface CompetitorResult {
  title: string;
  url: string;
  description: string;
  position: number;
}

interface ContentBrief {
  keyword: string;
  targetAudience: string;
  userIntent: string;
  suggestedH1: string;
  h2Headings: string[];
  keyAngles: string[];
  contentGaps: string[];
  wordCount: number;
}

interface BlogPostData {
  title: string;
  content: string;
  excerpt: string;
  metaTitle: string;
  metaDescription: string;
  tags: string[];
}

const BlogPostCreator = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [seedKeyword, setSeedKeyword] = useState('');
  const [keywords, setKeywords] = useState<KeywordOpportunity[]>([]);
  const [selectedKeyword, setSelectedKeyword] = useState<string>('');
  const [competitors, setCompetitors] = useState<CompetitorResult[]>([]);
  const [contentBrief, setContentBrief] = useState<ContentBrief | null>(null);
  const [blogPost, setBlogPost] = useState<BlogPostData | null>(null);
  const [loading, setLoading] = useState(false);
  const [briefApproved, setBriefApproved] = useState(false);
  const { toast } = useToast();

  const steps = [
    { id: 1, title: "Topic Discovery", icon: Lightbulb, description: "Find keyword opportunities" },
    { id: 2, title: "SERP Analysis", icon: BarChart3, description: "Analyze competitors" },
    { id: 3, title: "Content Brief", icon: Target, description: "Generate strategy" },
    { id: 4, title: "Approve Brief", icon: CheckCircle, description: "Review & approve" },
    { id: 5, title: "Generate Post", icon: PenTool, description: "Write full article" },
    { id: 6, title: "Publish", icon: Upload, description: "Final review & publish" }
  ];

  // Step 1: Topic Opportunity Discovery
  const discoverKeywords = async () => {
    if (!seedKeyword.trim()) {
      toast({
        title: "Error",
        description: "Please enter a seed keyword",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-search', {
        body: { query: seedKeyword, type: 'keyword_discovery' }
      });

      if (error) throw error;

      setKeywords(data.keywords || []);
      setCurrentStep(2);
      toast({
        title: "Success",
        description: `Found ${data.keywords?.length || 0} keyword opportunities`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to discover keywords. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Step 2: SERP Analysis
  const generateBrief = async (keyword: string) => {
    setSelectedKeyword(keyword);
    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('google-search', {
        body: { query: keyword, type: 'serp_analysis' }
      });

      if (error) throw error;

      setCompetitors(data.competitors || []);
      setCurrentStep(3);

      // Automatically generate content brief
      await generateContentBrief(keyword, data.competitors);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to analyze SERP. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Generate SEO Content Brief
  const generateContentBrief = async (keyword: string, competitorData: CompetitorResult[]) => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-content-brief', {
        body: { 
          keyword,
          competitors: competitorData
        }
      });

      if (error) throw error;

      setContentBrief(data.brief);
      setCurrentStep(4);
      toast({
        title: "Success",
        description: "Content brief generated successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate content brief. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Approve Brief
  const approveBrief = () => {
    setBriefApproved(true);
    setCurrentStep(5);
    toast({
      title: "Brief Approved",
      description: "You can now generate the full blog post"
    });
  };

  // Step 5: Generate Full Blog Post
  const generateBlogPost = async () => {
    if (!contentBrief) return;

    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-blog-post', {
        body: { brief: contentBrief }
      });

      if (error) throw error;

      setBlogPost(data.post);
      setCurrentStep(6);
      toast({
        title: "Success",
        description: "Blog post generated successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate blog post. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Step 6: Publish Blog
  const publishBlog = async () => {
    if (!blogPost) return;

    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('blog_posts')
        .insert({
          title: blogPost.title,
          content: blogPost.content,
          excerpt: blogPost.excerpt,
          meta_title: blogPost.metaTitle,
          meta_description: blogPost.metaDescription,
          tags: blogPost.tags,
          slug: blogPost.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
          status: 'draft'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Blog post saved as draft successfully"
      });

      // Reset the workflow
      setCurrentStep(1);
      setSeedKeyword('');
      setKeywords([]);
      setSelectedKeyword('');
      setCompetitors([]);
      setContentBrief(null);
      setBlogPost(null);
      setBriefApproved(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save blog post. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStepStatus = (stepId: number) => {
    if (stepId < currentStep) return 'completed';
    if (stepId === currentStep) return 'current';
    return 'pending';
  };

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PenTool className="w-5 h-5" />
            AI Blog Post Creator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {steps.map((step, index) => {
              const status = getStepStatus(step.id);
              const Icon = step.icon;
              
              return (
                <div key={step.id} className="flex items-center gap-2">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    status === 'completed' ? 'bg-green-100 text-green-800' :
                    status === 'current' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {status === 'completed' ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>
                  <div className="text-sm">
                    <div className="font-medium">{step.title}</div>
                    <div className="text-muted-foreground text-xs">{step.description}</div>
                  </div>
                  {index < steps.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-gray-400 ml-2" />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Step 1: Topic Discovery */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5" />
              Step 1: Topic Opportunity Discovery
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Seed Keyword</label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., AI in marketing"
                  value={seedKeyword}
                  onChange={(e) => setSeedKeyword(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={discoverKeywords} disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  Discover Keywords
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Keywords List & SERP Analysis */}
      {currentStep === 2 && keywords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Step 2: Select Keyword for SERP Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {keywords.map((kw, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{kw.keyword}</div>
                    <div className="text-sm text-muted-foreground">Intent: {kw.intent}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={kw.competition === 'low' ? 'default' : kw.competition === 'medium' ? 'secondary' : 'destructive'}>
                      {kw.competition} competition
                    </Badge>
                    <Button onClick={() => generateBrief(kw.keyword)} disabled={loading} size="sm">
                      {loading && selectedKeyword === kw.keyword ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Generate Brief"
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Competitors Display */}
      {currentStep >= 3 && competitors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>SERP Analysis Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {competitors.slice(0, 5).map((comp, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-sm">#{comp.position} {comp.title}</div>
                      <div className="text-xs text-muted-foreground mt-1">{comp.url}</div>
                      <div className="text-sm mt-2">{comp.description}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Content Brief */}
      {currentStep >= 4 && contentBrief && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Step {currentStep === 4 ? '4: Approve' : ''} Content Brief
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-medium text-sm">Target Keyword</label>
                <p className="text-sm text-muted-foreground">{contentBrief.keyword}</p>
              </div>
              <div>
                <label className="font-medium text-sm">Target Audience</label>
                <p className="text-sm text-muted-foreground">{contentBrief.targetAudience}</p>
              </div>
              <div>
                <label className="font-medium text-sm">User Intent</label>
                <p className="text-sm text-muted-foreground">{contentBrief.userIntent}</p>
              </div>
              <div>
                <label className="font-medium text-sm">Suggested Word Count</label>
                <p className="text-sm text-muted-foreground">{contentBrief.wordCount} words</p>
              </div>
            </div>

            <div>
              <label className="font-medium text-sm">Suggested H1</label>
              <p className="text-sm text-muted-foreground mt-1">{contentBrief.suggestedH1}</p>
            </div>

            <div>
              <label className="font-medium text-sm">H2 Headings Structure</label>
              <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                {contentBrief.h2Headings.map((heading, index) => (
                  <li key={index}>• {heading}</li>
                ))}
              </ul>
            </div>

            <div>
              <label className="font-medium text-sm">Key Angles to Cover</label>
              <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                {contentBrief.keyAngles.map((angle, index) => (
                  <li key={index}>• {angle}</li>
                ))}
              </ul>
            </div>

            <div>
              <label className="font-medium text-sm">Content Gaps to Fill</label>
              <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                {contentBrief.contentGaps.map((gap, index) => (
                  <li key={index}>• {gap}</li>
                ))}
              </ul>
            </div>

            {currentStep === 4 && (
              <div className="flex gap-2 pt-4">
                <Button onClick={approveBrief} disabled={loading}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve Brief
                </Button>
                <Button variant="outline" onClick={() => setCurrentStep(2)}>
                  Back to Keywords
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 5: Generate Blog Post */}
      {currentStep === 5 && briefApproved && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PenTool className="w-5 h-5" />
              Step 5: Generate Full Blog Post
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                Ready to generate a full blog post based on your approved brief.
              </p>
              <Button onClick={generateBlogPost} disabled={loading} size="lg">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating Post...
                  </>
                ) : (
                  <>
                    <PenTool className="w-4 h-4 mr-2" />
                    Generate Blog Post
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 6: Review & Publish */}
      {currentStep === 6 && blogPost && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Step 6: Review & Publish
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="font-medium text-sm">Title</label>
              <p className="text-lg font-medium mt-1">{blogPost.title}</p>
            </div>

            <div>
              <label className="font-medium text-sm">Meta Description</label>
              <p className="text-sm text-muted-foreground mt-1">{blogPost.metaDescription}</p>
            </div>

            <div>
              <label className="font-medium text-sm">Tags</label>
              <div className="flex gap-2 mt-1">
                {blogPost.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary">{tag}</Badge>
                ))}
              </div>
            </div>

            <div>
              <label className="font-medium text-sm">Content Preview</label>
              <div className="mt-2 p-4 border rounded-lg bg-gray-50 max-h-64 overflow-y-auto">
                <div className="prose prose-sm" dangerouslySetInnerHTML={{ __html: blogPost.content.substring(0, 1000) + '...' }} />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={publishBlog} disabled={loading}>
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                Save as Draft
              </Button>
              <Button variant="outline" onClick={() => setCurrentStep(5)}>
                Regenerate Post
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BlogPostCreator;