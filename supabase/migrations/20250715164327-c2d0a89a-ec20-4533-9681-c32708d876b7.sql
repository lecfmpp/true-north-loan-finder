-- Insert comprehensive Q&A items for the chat widget
INSERT INTO public.chat_widget_qa (question, answer, related_links, order_index, is_active, fallback_action) VALUES
-- Getting Started
('What types of loans do you offer?', 'We provide a range of financing solutions for Canadian businesses, including Working Capital Loans, Equipment Financing, and Business Lines of Credit. Each is designed to meet different needs.', '[{"title": "Our Loan Products", "url": "/loan-types"}]'::jsonb, 1, true, 'escalate'),

('How does this work?', 'It''s simple! You fill out our quick online application, we review your business''s health (not just your credit score), and provide you with a decision, often within 24 hours. If approved, funds are deposited directly into your account.', '[{"title": "How It Works", "url": "/process"}]'::jsonb, 2, true, 'escalate'),

('How much can I borrow?', 'Loan amounts can range from $5,000 to $500,000+. The final amount depends on your business''s revenue, cash flow, and overall financial health.', '[{"title": "Apply Now", "url": "/apply"}]'::jsonb, 3, true, 'escalate'),

('What are your interest rates?', 'Our rates are competitive and vary based on the loan type, your business''s performance, and the term length. To get a precise quote with no obligation, the best step is to complete our short application.', '[{"title": "Get a Free Quote", "url": "/apply"}]'::jsonb, 4, true, 'escalate'),

('Who are you?', 'We are True North Business Loan, a Canadian financing provider dedicated to helping small and medium-sized businesses across Canada access the capital they need to grow and succeed.', '[{"title": "About Us", "url": "/about"}]'::jsonb, 5, true, 'escalate'),

-- Eligibility & Requirements
('Am I eligible for a loan?', 'Our main requirements are that your business is based in Canada, has been operating for at least 6 months, and has a consistent monthly revenue. We look at the big picture of your business!', '[{"title": "Check Eligibility", "url": "/apply"}]'::jsonb, 6, true, 'escalate'),

('Can I get a loan with bad credit?', 'Yes, it''s possible. We place more emphasis on your recent business performance and cash flow than on your personal credit score. We encourage you to apply so we can review your unique situation.', '[{"title": "Apply Today", "url": "/apply"}]'::jsonb, 7, true, 'escalate'),

('Do I need to be in business for a long time?', 'We typically require a minimum of 6 months in business. This helps us see a clear picture of your revenue and ability to manage repayments.', '[{"title": "Our Requirements", "url": "/faq"}]'::jsonb, 8, true, 'escalate'),

('What documents are required to apply?', 'To start, our online application is very simple and requires no documents. Later in the process, we typically ask for 3-6 months of recent business bank statements to verify your revenue.', '[{"title": "Application Process", "url": "/process"}]'::jsonb, 9, true, 'escalate'),

('Do you fund startups?', 'While we typically require at least 6 months of operating history, we can sometimes review newer businesses with strong initial revenue or a solid business plan. Feel free to contact us to discuss your specific case.', '[{"title": "Contact Us", "url": "/contact"}]'::jsonb, 10, true, 'escalate'),

-- Application Process
('How do I apply?', 'You can start your application right now through our secure online portal. It only takes a few minutes to complete, and there''s no obligation.', '[{"title": "Apply Now", "url": "/apply"}]'::jsonb, 11, true, 'escalate'),

('How long does it take to get funded?', 'Our process is built for speed. After you submit your application, you can receive a decision in as little as 24 hours. Once approved, funds can be in your account in 1-2 business days.', '[{"title": "How It Works", "url": "/process"}]'::jsonb, 12, true, 'escalate'),

('Is there a fee to apply?', 'Absolutely not! There are no fees to apply for a loan and no obligation to accept an offer. You can find out what you qualify for completely free of charge.', '[]'::jsonb, 13, true, 'escalate'),

('Is my information secure?', 'Yes. We use industry-standard encryption and security protocols to protect all the information you share with us. Your privacy and security are our top priorities.', '[{"title": "Privacy Policy", "url": "/privacy-policy"}]'::jsonb, 14, true, 'escalate'),

-- Loan & Repayment Details
('What can I use the loan for?', 'You can use the funds for almost any business purpose: purchasing inventory, hiring staff, upgrading equipment, marketing campaigns, managing cash flow, or funding an expansion. It''s your business, you decide!', '[]'::jsonb, 15, true, 'escalate'),

('What are the repayment terms?', 'Repayment terms are flexible and tailored to your business''s cash flow. We offer daily, weekly, and monthly payment options depending on the loan product.', '[{"title": "Our Loan Products", "url": "/loan-types"}]'::jsonb, 16, true, 'escalate'),

('Can I repay the loan early?', 'Yes, some of our loan products allow for early repayment. We can provide all the details on prepayment options when we present you with your offer.', '[]'::jsonb, 17, true, 'escalate'),

-- Contact & Support
('Can I speak to a person?', 'Of course! Our team of funding specialists is here to help. You can reach us by phone or email during business hours.', '[{"title": "Contact Us", "url": "/contact"}]'::jsonb, 18, true, 'escalate'),

('What are your business hours?', 'Our team is available to assist you Monday to Friday, from 9:00 AM to 6:00 PM EDT.', '[{"title": "Contact Us", "url": "/contact"}]'::jsonb, 19, true, 'escalate'),

('Where are you located?', 'Our head office is in Ontario, but we are proud to serve and fund businesses in every province and territory across Canada.', '[{"title": "About Us", "url": "/about"}]'::jsonb, 20, true, 'escalate');