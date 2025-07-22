UPDATE blog_posts 
SET content = REPLACE(content, '<div class="mt-8 p-6 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg text-center border border-primary/10">
  <h3 class="text-xl font-bold text-primary mb-3">Ready to Secure Equipment Financing?</h3>
  <p class="text-muted-foreground mb-4">Get competitive rates and fast approval for your equipment financing needs.</p>
  <a href="/quiz" class="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
    Get your free equipment financing quote today!
  </a>
</div>', ''),
updated_at = now()
WHERE slug = 'equipment-financing-guide-canadian-businesses';