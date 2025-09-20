-- Remove duplicate blog posts (keeping the newer ones)
DELETE FROM public.blog_posts 
WHERE id IN (
  '1fa293b8-d4a0-448c-80f1-f18cb123d54c', -- Cannabis Business Loans (older)
  '4ff67191-e5d3-470c-8657-4d30a8d56d48', -- Invoice Factoring Cash Flow (older)
  '9be4b21c-1d54-47dc-8a69-bd86c4ef7b9e', -- Heavy Equipment Financing (older)
  'e35c8609-8979-4e66-96e1-059148852868', -- Invoice Factoring Candidate (older)
  '893b303f-abd8-4162-b29c-8deaface1a21', -- What Lenders Look For (older)
  '40cdecac-a1a8-4030-8b1b-7f3e7c8e2f5d'  -- Bad Credit Business Loan (older)
);