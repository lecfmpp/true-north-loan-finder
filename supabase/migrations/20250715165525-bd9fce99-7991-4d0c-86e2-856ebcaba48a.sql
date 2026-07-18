-- Update Q&A links to use existing URLs and add contact form fallbacks
UPDATE public.chat_widget_qa SET 
  related_links = '[{"title": "Equipment Financing", "url": "/equipment-financing"}, {"title": "Small Business Loans", "url": "/small-business-loans"}, {"title": "Merchant Cash Advance", "url": "/merchant-cash-advance"}, {"title": "Invoice Factoring", "url": "/invoice-factoring"}]'::jsonb
WHERE question = 'What types of loans do you offer?';

UPDATE public.chat_widget_qa SET 
  related_links = '[{"title": "How It Works", "url": "/how-it-works"}]'::jsonb
WHERE question = 'How does this work?';

UPDATE public.chat_widget_qa SET 
  related_links = '[{"title": "Loan Estimator", "url": "/loan-estimator"}]'::jsonb
WHERE question = 'How much can I borrow?';

UPDATE public.chat_widget_qa SET 
  related_links = '[{"title": "Loan Estimator", "url": "/loan-estimator"}]'::jsonb
WHERE question = 'What are your interest rates?';

UPDATE public.chat_widget_qa SET 
  related_links = '[{"title": "About Us", "url": "/about"}]'::jsonb
WHERE question = 'Who are you?';

UPDATE public.chat_widget_qa SET 
  related_links = '[{"title": "Loan Estimator", "url": "/loan-estimator"}]'::jsonb
WHERE question = 'Am I eligible for a loan?';

UPDATE public.chat_widget_qa SET 
  related_links = '[{"title": "Loan Estimator", "url": "/loan-estimator"}]'::jsonb
WHERE question = 'Can I get a loan with bad credit?';

UPDATE public.chat_widget_qa SET 
  related_links = '[{"title": "Home", "url": "/"}]'::jsonb
WHERE question = 'Do I need to be in business for a long time?';

UPDATE public.chat_widget_qa SET 
  related_links = '[{"title": "How It Works", "url": "/how-it-works"}]'::jsonb
WHERE question = 'What documents are required to apply?';

UPDATE public.chat_widget_qa SET 
  related_links = '[{"title": "Home", "url": "/"}]'::jsonb
WHERE question = 'Do you fund startups?';

UPDATE public.chat_widget_qa SET 
  related_links = '[{"title": "Loan Estimator", "url": "/loan-estimator"}]'::jsonb
WHERE question = 'How do I apply?';

UPDATE public.chat_widget_qa SET 
  related_links = '[{"title": "How It Works", "url": "/how-it-works"}]'::jsonb
WHERE question = 'How long does it take to get funded?';

UPDATE public.chat_widget_qa SET 
  related_links = '[{"title": "Privacy Policy", "url": "/privacy"}]'::jsonb
WHERE question = 'Is my information secure?';

UPDATE public.chat_widget_qa SET 
  related_links = '[{"title": "Equipment Financing", "url": "/equipment-financing"}, {"title": "Small Business Loans", "url": "/small-business-loans"}, {"title": "Merchant Cash Advance", "url": "/merchant-cash-advance"}, {"title": "Invoice Factoring", "url": "/invoice-factoring"}]'::jsonb
WHERE question = 'What are the repayment terms?';

UPDATE public.chat_widget_qa SET 
  related_links = '[{"title": "Home", "url": "/"}]'::jsonb
WHERE question = 'Can I speak to a person?';

UPDATE public.chat_widget_qa SET 
  related_links = '[{"title": "Home", "url": "/"}]'::jsonb
WHERE question = 'What are your business hours?';

UPDATE public.chat_widget_qa SET 
  related_links = '[{"title": "About Us", "url": "/about"}]'::jsonb
WHERE question = 'Where are you located?';