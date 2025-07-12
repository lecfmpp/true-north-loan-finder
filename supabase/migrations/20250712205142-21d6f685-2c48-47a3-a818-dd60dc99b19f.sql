-- Create quiz responses table to store lead information
CREATE TABLE public.quiz_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  loan_amount INTEGER NOT NULL,
  use_of_funds TEXT NOT NULL,
  time_in_business TEXT NOT NULL,
  monthly_revenue INTEGER NOT NULL,
  credit_score TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  score INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create blog posts table for content management
CREATE TABLE public.blog_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL,
  featured_image_url TEXT,
  published BOOLEAN NOT NULL DEFAULT false,
  author TEXT NOT NULL DEFAULT 'True North Team',
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create analytics table for tracking user behavior
CREATE TABLE public.analytics_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  page_path TEXT,
  user_agent TEXT,
  referrer TEXT,
  session_id TEXT,
  properties JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.quiz_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Create policies for quiz responses (admin can view all, users can only insert)
CREATE POLICY "Anyone can submit quiz responses" 
ON public.quiz_responses 
FOR INSERT 
WITH CHECK (true);

-- Create policies for blog posts (public can read published posts)
CREATE POLICY "Anyone can view published blog posts" 
ON public.blog_posts 
FOR SELECT 
USING (published = true);

-- Create policies for analytics (anyone can insert, admins can view)
CREATE POLICY "Anyone can submit analytics events" 
ON public.analytics_events 
FOR INSERT 
WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_quiz_responses_updated_at
  BEFORE UPDATE ON public.quiz_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample blog posts
INSERT INTO public.blog_posts (title, slug, excerpt, content, published, tags) VALUES
('Equipment Financing: A Complete Guide for Canadian Businesses', 'equipment-financing-guide-canadian-businesses', 'Learn everything you need to know about equipment financing in Canada, including eligibility requirements, rates, and application tips.', '# Equipment Financing: A Complete Guide for Canadian Businesses

Equipment financing is one of the most popular funding options for Canadian businesses looking to acquire machinery, vehicles, technology, or other essential equipment. This comprehensive guide covers everything you need to know about equipment financing in Canada.

## What is Equipment Financing?

Equipment financing is a type of business loan specifically designed to help companies purchase equipment. The equipment itself serves as collateral for the loan, which typically results in lower interest rates and more favorable terms compared to unsecured business loans.

## Benefits of Equipment Financing

### 1. Preserve Working Capital
Instead of using cash reserves to purchase equipment outright, businesses can preserve their working capital for daily operations, unexpected expenses, or growth opportunities.

### 2. Tax Advantages
In Canada, equipment purchases may qualify for capital cost allowance (CCA) deductions, which can provide significant tax benefits.

### 3. Competitive Interest Rates
Since the equipment serves as collateral, lenders typically offer more competitive interest rates compared to unsecured loans.

### 4. Flexible Terms
Equipment financing often comes with flexible repayment terms that can be structured to match your business''s cash flow.

## Eligibility Requirements

Most Canadian lenders require:
- Business operating for at least 6 months
- Minimum monthly revenue of $10,000
- Good credit score (typically 650+)
- Clear business purpose for the equipment

## Application Process

1. **Determine Your Needs**: Calculate exactly how much financing you need
2. **Gather Documentation**: Financial statements, tax returns, equipment quotes
3. **Compare Lenders**: Shop around for the best rates and terms
4. **Submit Application**: Complete the application with all required documents
5. **Equipment Inspection**: Some lenders may require equipment inspection
6. **Funding**: Receive funds and purchase your equipment

## Tips for Success

- **Shop Around**: Different lenders offer different rates and terms
- **Consider Total Cost**: Look beyond just the interest rate
- **Plan for Maintenance**: Factor in ongoing maintenance costs
- **Read the Fine Print**: Understand all terms and conditions

Equipment financing can be an excellent way to grow your business while preserving cash flow. Take our quiz to see if you qualify for equipment financing today!', true, ARRAY['equipment financing', 'business loans', 'canadian business']),

('5 Signs Your Business is Ready for Growth Financing', 'signs-business-ready-growth-financing', 'Discover the key indicators that show your business is ready to take on growth financing and scale to the next level.', '# 5 Signs Your Business is Ready for Growth Financing

Growing a business requires capital, but how do you know when you''re ready to take on financing for expansion? Here are five key signs that indicate your business is prepared for growth financing.

## 1. Consistent Revenue Growth

Your business should demonstrate steady revenue growth over at least 6-12 months. This shows lenders that you have a proven business model and the ability to generate increased income to service debt.

**What to look for:**
- Month-over-month revenue increases
- Expanding customer base
- Higher average transaction values

## 2. Strong Cash Flow Management

Positive cash flow is crucial for any financing decision. You should have a clear understanding of your cash flow patterns and demonstrate that you can manage money effectively.

**Key indicators:**
- Positive operating cash flow
- Predictable revenue cycles
- Effective accounts receivable management

## 3. Clear Growth Plan

Before seeking financing, you should have a detailed plan for how you''ll use the funds and how they''ll generate returns.

**Your plan should include:**
- Specific growth objectives
- Market analysis
- Financial projections
- Risk assessment

## 4. Adequate Financial Records

Lenders want to see organized, accurate financial records that demonstrate your business''s performance and potential.

**Essential documents:**
- Profit and loss statements
- Balance sheets
- Cash flow statements
- Tax returns

## 5. Management Experience

Your team''s experience and track record play a crucial role in financing decisions. Lenders want to see that you have the expertise to execute your growth plans successfully.

**What lenders evaluate:**
- Industry experience
- Previous business success
- Management team depth
- Advisory board presence

## Conclusion

If your business demonstrates these five signs, you may be ready to explore growth financing options. Remember that timing is crucial – taking on debt too early or too late can impact your success.

Ready to see what financing options are available for your business? Take our quick quiz to get matched with the right lenders!', true, ARRAY['business growth', 'financing', 'small business loans']),

('Understanding Your Credit Score Impact on Business Loans', 'credit-score-impact-business-loans', 'Learn how your personal and business credit scores affect your ability to secure business financing and get better rates.', '# Understanding Your Credit Score Impact on Business Loans

Your credit score plays a crucial role in determining not only whether you''ll qualify for business financing, but also the terms and interest rates you''ll receive. Understanding how credit scores affect business loans can help you prepare for the application process and potentially save thousands of dollars.

## Personal vs. Business Credit Scores

### Personal Credit Score
For small businesses and startups, lenders often rely heavily on the business owner''s personal credit score, especially if the business has limited credit history.

**Personal credit score ranges:**
- Excellent: 750+
- Good: 700-749
- Fair: 650-699
- Poor: Below 650

### Business Credit Score
Established businesses should also build a separate business credit profile through:
- Business credit cards
- Trade credit with suppliers
- Business loans and lines of credit

## How Credit Scores Affect Loan Terms

### Interest Rates
Higher credit scores typically result in lower interest rates:
- Excellent credit: Prime rates + 1-3%
- Good credit: Prime rates + 3-6%
- Fair credit: Prime rates + 6-10%
- Poor credit: Prime rates + 10%+

### Loan Amounts
Better credit scores often qualify for higher loan amounts and longer terms.

### Collateral Requirements
Lower credit scores may require additional collateral or personal guarantees.

## Improving Your Credit Score

### For Personal Credit:
1. Pay all bills on time
2. Keep credit utilization below 30%
3. Don''t close old credit accounts
4. Monitor your credit report regularly
5. Pay down existing debt

### For Business Credit:
1. Establish business credit accounts
2. Pay suppliers on time
3. Keep business and personal finances separate
4. Monitor your business credit report
5. Build relationships with vendors

## Alternative Options for Poor Credit

If your credit score is below ideal, consider:
- Asset-based lending
- Invoice factoring
- Merchant cash advances
- Alternative lenders
- Revenue-based financing

## Conclusion

While credit scores are important, they''re not the only factor lenders consider. Strong revenue, cash flow, and business fundamentals can help offset lower credit scores.

Want to see what financing options are available based on your credit profile? Take our quiz to get matched with lenders who work with businesses like yours!', true, ARRAY['credit score', 'business financing', 'loan approval']);