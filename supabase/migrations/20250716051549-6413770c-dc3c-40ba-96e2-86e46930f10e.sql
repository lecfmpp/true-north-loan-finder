-- Create the admin notification email template in the existing follow_up sequence
INSERT INTO public.email_templates (
  sequence_id,
  email_order,
  delay_hours,
  subject_line,
  email_content,
  purpose,
  is_active
) VALUES (
  '7473795a-4822-49ef-9f5f-d1b35857277a', -- follow_up sequence id
  99, -- High order number so it doesn't interfere with regular lead emails
  0,
  '🎯 New Lead Alert: {{user_name}} - ${{loan_amount}}',
  'Hey there! 🎉

Great news - we just got a new lead through the loan estimator!

LEAD DETAILS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 Name: {{user_name}}
📧 Email: {{user_email}}
📱 Phone: {{user_phone}}
💰 Loan Amount: ${{loan_amount}}
📊 Monthly Revenue: ${{monthly_revenue}}
⭐ Credit Score: {{credit_score}}
⏰ Time in Business: {{time_in_business}}
🎯 Use of Funds: {{use_of_funds}}
🌐 Website: {{website}}
📈 Qualification Score: {{score}}/100
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NEXT STEPS:
✅ Lead automatically enrolled in follow-up sequence
🔍 Review lead details in admin dashboard
📞 Consider personal outreach for high-scoring leads (80+)
📝 Update lead status as needed

This lead is ready for your review and follow-up action!

---
True North Business Loan Team
Automated Lead Notification System',
  'Admin notification for new leads',
  true
);