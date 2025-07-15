import React from 'react';

export interface BlogTemplate {
  id: string;
  name: string;
  description: string;
  structure: TemplateSection[];
}

export interface TemplateSection {
  id: string;
  type: 'h1' | 'h2' | 'h3' | 'p' | 'ul' | 'table' | 'cta' | 'formula';
  label: string;
  placeholder: string;
  required: boolean;
}

export const blogTemplates: BlogTemplate[] = [
  {
    id: 'financial-guide',
    name: 'Financial Product Guide',
    description: 'Comprehensive guide template for financial products and services',
    structure: [
      {
        id: 'h1-title',
        type: 'h1',
        label: 'Main Title',
        placeholder: '[Product Name] Canada: The Ultimate Guide',
        required: true
      },
      {
        id: 'intro-paragraph',
        type: 'p',
        label: 'Introduction Paragraph',
        placeholder: 'Is your Canadian business facing [specific challenge]? This guide covers everything you need to know about [product/service]...',
        required: true
      },
      {
        id: 'what-is-section',
        type: 'h2',
        label: 'What Is Section',
        placeholder: 'What is [Product] and How Does it Work?',
        required: true
      },
      {
        id: 'benefits-section',
        type: 'h2',
        label: 'Benefits Section',
        placeholder: 'The Top [X] Benefits of [Product] for Canadian Businesses',
        required: true
      },
      {
        id: 'comparison-table',
        type: 'table',
        label: 'Comparison Table',
        placeholder: 'Create a comparison table showing different options or features',
        required: false
      },
      {
        id: 'eligibility-section',
        type: 'h2',
        label: 'Eligibility Requirements',
        placeholder: 'Am I Eligible for [Product]?',
        required: true
      },
      {
        id: 'process-section',
        type: 'h2',
        label: 'Application Process',
        placeholder: 'How to Apply for [Product]: A [X]-Step Process',
        required: true
      },
      {
        id: 'faq-section',
        type: 'h2',
        label: 'FAQ Section',
        placeholder: 'Frequently Asked Questions (FAQ)',
        required: true
      },
      {
        id: 'conclusion',
        type: 'h2',
        label: 'Conclusion',
        placeholder: 'Conclusion: Grow Your Business with Smart [Product]',
        required: true
      },
      {
        id: 'cta-button',
        type: 'cta',
        label: 'Call-to-Action Button',
        placeholder: 'Get Your Free [Product] Quote Today!',
        required: true
      }
    ]
  },
  {
    id: 'how-to-guide',
    name: 'How-To Guide',
    description: 'Step-by-step instructional content template',
    structure: [
      {
        id: 'h1-title',
        type: 'h1',
        label: 'Main Title',
        placeholder: 'How to [Achieve Goal]: A Complete Guide for Canadian Businesses',
        required: true
      },
      {
        id: 'intro-paragraph',
        type: 'p',
        label: 'Introduction',
        placeholder: 'Learn how to [achieve goal] with this comprehensive guide...',
        required: true
      },
      {
        id: 'overview-section',
        type: 'h2',
        label: 'Overview Section',
        placeholder: 'Why [Topic] Matters for Your Business',
        required: true
      },
      {
        id: 'step-by-step',
        type: 'h2',
        label: 'Step-by-Step Process',
        placeholder: 'Step-by-Step Guide to [Goal]',
        required: true
      },
      {
        id: 'tips-section',
        type: 'h2',
        label: 'Tips and Best Practices',
        placeholder: 'Expert Tips for Success',
        required: false
      },
      {
        id: 'common-mistakes',
        type: 'h2',
        label: 'Common Mistakes',
        placeholder: 'Common Mistakes to Avoid',
        required: false
      },
      {
        id: 'conclusion',
        type: 'h2',
        label: 'Conclusion',
        placeholder: 'Take Action Today',
        required: true
      },
      {
        id: 'cta-button',
        type: 'cta',
        label: 'Call-to-Action',
        placeholder: 'Get Started Now!',
        required: true
      }
    ]
  },
  {
    id: 'industry-insight',
    name: 'Industry Insights',
    description: 'Template for industry analysis and trends',
    structure: [
      {
        id: 'h1-title',
        type: 'h1',
        label: 'Main Title',
        placeholder: '[Industry] in Canada: [Year] Trends and Insights',
        required: true
      },
      {
        id: 'intro-paragraph',
        type: 'p',
        label: 'Introduction',
        placeholder: 'The [industry] landscape in Canada is evolving rapidly...',
        required: true
      },
      {
        id: 'current-state',
        type: 'h2',
        label: 'Current State',
        placeholder: 'The Current State of [Industry] in Canada',
        required: true
      },
      {
        id: 'key-trends',
        type: 'h2',
        label: 'Key Trends',
        placeholder: 'Key Trends Shaping [Industry]',
        required: true
      },
      {
        id: 'opportunities',
        type: 'h2',
        label: 'Opportunities',
        placeholder: 'Opportunities for Canadian Businesses',
        required: true
      },
      {
        id: 'challenges',
        type: 'h2',
        label: 'Challenges',
        placeholder: 'Challenges to Watch Out For',
        required: false
      },
      {
        id: 'future-outlook',
        type: 'h2',
        label: 'Future Outlook',
        placeholder: 'What to Expect in the Coming Years',
        required: true
      },
      {
        id: 'cta-button',
        type: 'cta',
        label: 'Call-to-Action',
        placeholder: 'Learn How We Can Help Your Business',
        required: true
      }
    ]
  }
];

export const generateTemplateContent = (template: BlogTemplate, values: Record<string, string>): string => {
  let content = '';
  
  template.structure.forEach((section) => {
    const value = values[section.id] || section.placeholder;
    
    switch (section.type) {
      case 'h1':
        content += `<h1>${value}</h1>\n\n`;
        break;
      case 'h2':
        content += `<h2>${value}</h2>\n\n`;
        break;
      case 'h3':
        content += `<h3>${value}</h3>\n\n`;
        break;
      case 'p':
        content += `<p>${value}</p>\n\n`;
        break;
      case 'ul':
        content += `<ul>\n<li>${value}</li>\n</ul>\n\n`;
        break;
      case 'table':
        content += `<table style="width:100%; border-collapse: collapse;">\n  <thead>\n    <tr style="background-color:#f2f2f2;">\n      <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Feature</th>\n      <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Option 1</th>\n      <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Option 2</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td style="border: 1px solid #ddd; padding: 8px;"><strong>Example</strong></td>\n      <td style="border: 1px solid #ddd; padding: 8px;">${value}</td>\n      <td style="border: 1px solid #ddd; padding: 8px;">Update this content</td>\n    </tr>\n  </tbody>\n</table>\n\n`;
        break;
      case 'cta':
        content += `<br>\n\n<a href="/quiz" class="cta-button" style="display:inline-block; background-color:#007bff; color:#ffffff; padding:15px 25px; text-align:center; text-decoration:none; font-weight:bold; border-radius:5px;">${value}</a>\n\n`;
        break;
      case 'formula':
        content += `<p>Formula example: $${value}$</p>\n\n`;
        break;
      default:
        content += `<p>${value}</p>\n\n`;
    }
  });
  
  return content;
};

export const canadianBusinessKeywords = [
  'Canadian business',
  'Canada Revenue Agency (CRA)',
  'Capital Cost Allowance (CCA)',
  'GST/HST',
  'Business Number (BN)',
  'Canadian-controlled private corporation (CCPC)',
  'Employment Insurance (EI)',
  'Canada Pension Plan (CPP)',
  'Workplace Safety and Insurance Board (WSIB)',
  'Canadian Commercial Corporation (CCC)',
  'Export Development Canada (EDC)',
  'Business Development Bank of Canada (BDC)',
  'Innovation, Science and Economic Development Canada (ISED)',
  'Canadian Environmental Assessment Agency',
  'Competition Bureau Canada'
];

export const seoOptimizationTips = [
  'Include target keywords in the first paragraph',
  'Use Canadian-specific terminology and references',
  'Add location-based keywords (Canada, Canadian, provincial)',
  'Include relevant regulatory information (CRA, provincial regulations)',
  'Use numbered lists and bullet points for better readability',
  'Add internal links to related services/pages',
  'Include a clear call-to-action',
  'Optimize for mobile reading with short paragraphs',
  'Use descriptive headings with keywords',
  'Add relevant statistics and data for Canadian market'
];