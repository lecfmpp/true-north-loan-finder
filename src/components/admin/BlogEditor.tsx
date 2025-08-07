import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Save, Eye, Upload, X, FileText, Link } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuillEditor } from '@/hooks/useQuillEditor';
import ImageUpload from './ImageUpload';
import SEOAnalyzer from './SEOAnalyzer';
import { blogTemplates, generateTemplateContent, canadianBusinessKeywords, seoOptimizationTips, type BlogTemplate } from './BlogPostTemplate';

interface BlogPost {
  id?: string;
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

interface BlogEditorProps {
  post?: BlogPost | null;
  onSave: () => void;
  onCancel: () => void;
}

const BlogEditor = ({ post, onSave, onCancel }: BlogEditorProps) => {
  const { ReactQuill, isLoading } = useQuillEditor();
  const [formData, setFormData] = useState<BlogPost>({
    title: post?.title || '',
    slug: post?.slug || '',
    excerpt: post?.excerpt || '',
    content: post?.content || '',
    author: post?.author || 'True North Team',
    status: post?.status || 'draft',
    tags: post?.tags || [],
    featured_image_url: post?.featured_image_url || '',
    meta_title: post?.meta_title || '',
    meta_description: post?.meta_description || '',
    meta_keywords: post?.meta_keywords || [],
    reading_time: post?.reading_time || 0
  });
  
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<BlogTemplate | null>(null);
  const [showTemplateSelector, setShowTemplateSelector] = useState(!post?.id && !formData.content);
  const [availablePages, setAvailablePages] = useState<Array<{ title: string; url: string }>>([]);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [quillRef, setQuillRef] = useState<any>(null);
  const { toast } = useToast();
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const calculateReadingTime = (content: string) => {
    const wordsPerMinute = 200;
    const words = content.trim().split(/\s+/).length;
    return Math.ceil(words / wordsPerMinute);
  };

  const handleTitleChange = (title: string) => {
    const slug = generateSlug(title);
    setFormData(prev => ({
      ...prev,
      title,
      slug,
      meta_title: prev.meta_title || title
    }));
  };

  const handleContentChange = (content: string) => {
    const readingTime = calculateReadingTime(content);
    setFormData(prev => ({
      ...prev,
      content,
      reading_time: readingTime
    }));
  };

  // Fetch available pages for internal linking
  const fetchAvailablePages = async () => {
    try {
      const { data: blogPosts, error } = await supabase
        .from('blog_posts')
        .select('title, slug')
        .eq('status', 'published')
        .neq('slug', formData.slug);

      if (error) throw error;

      const pages = [
        // Static pages
        { title: 'Home', url: '/' },
        { title: 'About Us', url: '/about' },
        { title: 'How It Works', url: '/how-it-works' },
        { title: 'Quiz', url: '/quiz' },
        { title: 'Small Business Loans', url: '/small-business-loans' },
        { title: 'Equipment Financing', url: '/equipment-financing' },
        { title: 'Merchant Cash Advance', url: '/merchant-cash-advance' },
        { title: 'Invoice Factoring', url: '/invoice-factoring' },
        { title: 'Industries We Serve', url: '/industries-we-serve' },
        { title: 'Partners', url: '/partners' },
        { title: 'Compare Options', url: '/compare' },
        // Blog posts
        ...(blogPosts?.map(post => ({
          title: post.title,
          url: `/blog/${post.slug}`
        })) || [])
      ];

      setAvailablePages(pages);
    } catch (error) {
      console.error('Error fetching pages:', error);
    }
  };

  // Custom link handler for ReactQuill
  const handleLinkClick = () => {
    const quill = quillRef;
    if (!quill) return;

    const range = quill.getSelection();
    if (range && range.length > 0) {
      setSelectedText(quill.getText(range.index, range.length));
      setShowLinkModal(true);
    } else {
      toast({
        title: "No text selected",
        description: "Please select text before adding a link",
        variant: "destructive"
      });
    }
  };

  // Insert link into content
  const insertLink = (url: string) => {
    const quill = quillRef;
    if (!quill) return;

    const range = quill.getSelection();
    if (range) {
      quill.format('link', url);
      setShowLinkModal(false);
      setSelectedText('');
    }
  };

  useEffect(() => {
    fetchAvailablePages();
  }, [formData.slug]);

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSave = async (status?: string) => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast({
        title: "Error",
        description: "Title and content are required",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    
    try {
      const saveData = {
        ...formData,
        status: status || formData.status,
        reading_time: calculateReadingTime(formData.content)
      };

      if (post?.id) {
        // Update existing post
        const { error } = await supabase
          .from('blog_posts')
          .update(saveData)
          .eq('id', post.id);

        if (error) throw error;
      } else {
        // Create new post
        const { error } = await supabase
          .from('blog_posts')
          .insert([saveData]);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `Blog post ${post?.id ? 'updated' : 'created'} successfully`
      });
      
      onSave();
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${post?.id ? 'update' : 'create'} blog post`,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  // ReactQuill modules and formats
  const quillModules = {
    toolbar: {
      container: [
        [{ 'header': [2, 3, false] }],
        ['bold', 'italic', 'underline'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        ['link', 'image'],
        ['clean']
      ],
      handlers: {
        'link': handleLinkClick
      }
    },
  };

  const quillFormats = [
    'header', 'bold', 'italic', 'underline', 
    'list', 'bullet', 'link', 'image'
  ];

  const handleTemplateSelect = (template: BlogTemplate) => {
    setSelectedTemplate(template);
    const content = generateTemplateContent(template, {});
    setFormData(prev => ({
      ...prev,
      content,
      title: template.structure.find(s => s.type === 'h1')?.placeholder || '',
      meta_keywords: [...(prev.meta_keywords || []), ...canadianBusinessKeywords.slice(0, 5)]
    }));
    setShowTemplateSelector(false);
  };

  return (
    <div className="flex gap-6 min-h-screen">
      {/* Link Selection Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link className="w-5 h-5" />
                Add Internal Link
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Selected text: "{selectedText}"
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {availablePages.map((page) => (
                  <button
                    key={page.url}
                    onClick={() => insertLink(page.url)}
                    className="w-full text-left p-3 rounded-lg border hover:bg-muted transition-colors"
                  >
                    <div className="font-medium">{page.title}</div>
                    <div className="text-sm text-muted-foreground">{page.url}</div>
                  </button>
                ))}
              </div>
              <div className="flex justify-between mt-4">
                <Button variant="outline" onClick={() => setShowLinkModal(false)}>
                  Cancel
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    const customUrl = prompt('Enter custom URL:');
                    if (customUrl) {
                      insertLink(customUrl);
                    }
                  }}
                >
                  Custom URL
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Template Selector Modal */}
      {showTemplateSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-4xl mx-4 max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Choose a Blog Post Template
              </CardTitle>
              <p className="text-muted-foreground">
                Select a template to get started with a proven structure for Canadian business content
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {blogTemplates.map((template) => (
                  <Card 
                    key={template.id} 
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <CardHeader>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Includes:</p>
                        <ul className="text-xs space-y-1">
                          {template.structure.slice(0, 4).map((section) => (
                            <li key={section.id} className="text-muted-foreground">
                              • {section.label}
                            </li>
                          ))}
                          {template.structure.length > 4 && (
                            <li className="text-muted-foreground">
                              • +{template.structure.length - 4} more sections
                            </li>
                          )}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="flex justify-between mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => setShowTemplateSelector(false)}
                >
                  Skip Templates
                </Button>
                <div className="text-sm text-muted-foreground">
                  You can always change the content after selecting a template
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={onCancel}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-primary">
                {post?.id ? 'Edit Post' : 'New Post'}
              </h2>
              <p className="text-muted-foreground">
                {post?.id ? 'Update existing blog post' : 'Create a new blog post with perfect SEO'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => handleSave('draft')}
              disabled={saving}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Draft
            </Button>
            <Button 
              onClick={() => handleSave('published')}
              disabled={saving}
            >
              <Eye className="w-4 h-4 mr-2" />
              Publish
            </Button>
          </div>
        </div>

        {/* Post Title - Becomes H1 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Post Title 
              <Badge variant="outline" className="text-xs">
                This becomes your H1 tag
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Title (H1 Tag)</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Enter your main blog post title"
                className="text-lg font-semibold"
              />
              <p className="text-xs text-muted-foreground mt-1">
                This will be the single H1 tag on your page - the most important SEO element
              </p>
            </div>

            <div>
              <Label htmlFor="slug">URL Slug</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                placeholder="post-url-slug"
              />
            </div>

            <div>
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea
                id="excerpt"
                value={formData.excerpt}
                onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                placeholder="Brief description that appears in search results"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Main Content Editor */}
        <Card id="editor-container">
          <CardHeader>
            <CardTitle>Main Content - Fully Editable</CardTitle>
            <p className="text-sm text-muted-foreground">
              Complete content editor with full formatting capabilities. Add text, images, videos, links, tables, and any HTML content. No restrictions or limitations.
            </p>
          </CardHeader>
          <CardContent>
            <div className="min-h-[500px]">
              {isLoading ? (
                <div className="flex items-center justify-center h-[400px] border rounded-md bg-background">
                  <div className="animate-pulse flex space-x-4">
                    <div className="rounded-full bg-muted h-10 w-10"></div>
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-4 bg-muted rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ) : (
                <ReactQuill
                  ref={setQuillRef}
                  theme="snow"
                  value={formData.content || ''}
                  onChange={handleContentChange}
                  modules={{
                    toolbar: [
                      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                      ['bold', 'italic', 'underline', 'strike'],
                      [{ 'color': [] }, { 'background': [] }],
                      [{ 'font': [] }],
                      [{ 'align': [] }],
                      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                      [{ 'indent': '-1'}, { 'indent': '+1' }],
                      ['blockquote', 'code-block'],
                      ['link', 'image', 'video'],
                      ['clean']
                    ],
                    clipboard: {
                      matchVisual: false,
                    }
                  }}
                  formats={[
                    'header', 'font', 'size',
                    'bold', 'italic', 'underline', 'strike', 'blockquote',
                    'list', 'bullet', 'indent',
                    'link', 'image', 'video',
                    'color', 'background',
                    'align', 'code-block'
                  ]}
                  placeholder="Write your blog post content here. Full editing capabilities enabled - add any content, formatting, images, links, and more..."
                  style={{ height: '500px', marginBottom: '60px' }}
                  preserveWhitespace={true}
                  bounds={'#editor-container'}
                />
              )}
            </div>
            <div className="flex justify-between text-sm text-muted-foreground mt-16 pt-4 border-t">
              <p>Estimated reading time: {formData.reading_time} minute{formData.reading_time !== 1 ? 's' : ''}</p>
              <p className="text-primary">✓ Full editing enabled - no restrictions</p>
            </div>
          </CardContent>
        </Card>

        {/* Settings and Image */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Featured Image</CardTitle>
            </CardHeader>
            <CardContent>
              <ImageUpload
                currentImageUrl={formData.featured_image_url}
                onImageUploaded={(url) => setFormData(prev => ({ ...prev, featured_image_url: url }))}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Post Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="author">Author</Label>
                <Input
                  id="author"
                  value={formData.author}
                  onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Tags</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add a tag"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                  />
                  <Button type="button" onClick={addTag}>Add</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="cursor-pointer">
                      {tag}
                      <X 
                        className="w-3 h-3 ml-1" 
                        onClick={() => removeTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* SEO Sidebar */}
      <div className="w-80 shrink-0">
        <div className="sticky top-6">
          <SEOAnalyzer
            formData={formData}
            setFormData={setFormData}
          />
        </div>
      </div>
    </div>
  );
};

export default BlogEditor;