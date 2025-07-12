import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useState } from 'react';

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

interface SEOFieldsProps {
  formData: BlogPost;
  setFormData: React.Dispatch<React.SetStateAction<BlogPost>>;
}

const SEOFields = ({ formData, setFormData }: SEOFieldsProps) => {
  const [keywordInput, setKeywordInput] = useState('');

  const addKeyword = () => {
    if (keywordInput.trim() && !formData.meta_keywords?.includes(keywordInput.trim())) {
      setFormData(prev => ({
        ...prev,
        meta_keywords: [...(prev.meta_keywords || []), keywordInput.trim()]
      }));
      setKeywordInput('');
    }
  };

  const removeKeyword = (keywordToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      meta_keywords: prev.meta_keywords?.filter(keyword => keyword !== keywordToRemove) || []
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>SEO Settings</CardTitle>
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

        <div>
          <Label>Meta Keywords</Label>
          <div className="flex gap-2 mb-2">
            <Input
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              placeholder="Add a keyword"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addKeyword();
                }
              }}
            />
            <Button type="button" onClick={addKeyword}>Add</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.meta_keywords?.map((keyword) => (
              <Badge key={keyword} variant="outline" className="cursor-pointer">
                {keyword}
                <X 
                  className="w-3 h-3 ml-1" 
                  onClick={() => removeKeyword(keyword)}
                />
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SEOFields;