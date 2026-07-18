# Master Quiz Funnel Template - Complete Implementation Guide

## Executive Summary

This document provides a comprehensive blueprint for building high-converting multi-step quiz funnels across any industry. Based on a proven business loan qualification system, this template has been engineered for maximum conversion optimization, lead quality, and user experience.

**What You'll Build:**
- Multi-step wizard interface with 8-10 configurable steps
- Real-time validation and auto-saving functionality
- Intelligent scoring and matching engine
- Results page with dynamic provider matching
- Email verification system
- Lead attribution and tracking
- Full authentication flow integration
- Admin dashboard compatibility

---

## Part 1: Technical Architecture

### 1.1 Technology Stack

**Frontend Core:**
```typescript
- React 18+ with TypeScript
- React Router DOM v6+ (for navigation)
- React Hook Form (form state management)
- Zod (schema validation)
```

**UI Components:**
```typescript
- Shadcn UI Component Library:
  - Button, Card, Input, Label
  - Select, Slider, Progress
  - Dialog, Toast (Sonner)
  - RadioGroup, Checkbox
- Lucide React (icons)
- Tailwind CSS (styling)
```

**Backend & Data:**
```typescript
- Supabase (PostgreSQL database)
- Supabase Auth (user authentication)
- Supabase Edge Functions (server-side logic)
- Supabase Storage (optional for file uploads)
```

**Integrations:**
```typescript
- Resend (email delivery)
- External tracking (Make.com/Zapier webhooks)
- Google Analytics / Meta Pixel
- UTM parameter tracking
```

### 1.2 Project Structure

```
src/
├── pages/
│   ├── Quiz.tsx                    # Main quiz component
│   ├── Results.tsx                 # Results/matching page
│   └── Application.tsx             # Full application form
├── components/
│   ├── quiz/
│   │   ├── QuizProgress.tsx       # Progress bar
│   │   ├── QuizStep.tsx           # Individual step wrapper
│   │   ├── QuizNavigation.tsx     # Back/Next buttons
│   │   └── QuizCard.tsx           # Option card component
│   ├── results/
│   │   ├── ResultsHero.tsx        # Hero section
│   │   ├── MetricsDisplay.tsx     # Key metrics cards
│   │   └── ProviderCard.tsx       # Matched provider cards
│   └── shared/
│       ├── PhoneInput.tsx         # Formatted phone input
│       ├── CurrencyInput.tsx      # Currency formatter
│       └── LocationAutocomplete.tsx
├── hooks/
│   ├── use-quiz-draft.tsx         # Auto-save functionality
│   ├── use-scoring.tsx            # Scoring engine
│   └── use-attribution.tsx        # UTM tracking
├── lib/
│   ├── validation/
│   │   ├── quiz-schema.ts         # Zod schemas
│   │   └── validators.ts          # Custom validators
│   ├── scoring/
│   │   ├── scoring-engine.ts      # Score calculation
│   │   └── matching-logic.ts      # Provider matching
│   └── utils/
│       ├── formatting.ts          # Phone, currency, etc.
│       └── tracking.ts            # Analytics helpers
└── types/
    ├── quiz.types.ts              # Quiz data types
    ├── results.types.ts           # Results types
    └── provider.types.ts          # Provider/lender types
```

### 1.3 Database Schema

**Core Tables:**

```sql
-- Quiz responses (leads)
CREATE TABLE quiz_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Quiz data fields (customize per niche)
  primary_value INTEGER,              -- Loan amount, coverage amount, etc.
  purpose TEXT,                        -- Use of funds, coverage type, etc.
  time_qualifier TEXT,                 -- Time in business, ownership duration
  revenue_qualifier NUMERIC,           -- Monthly revenue, income, etc.
  score_qualifier TEXT,                -- Credit score, health rating, etc.
  account_type TEXT,                   -- Bank account type, policy type, etc.
  additional_qualifier TEXT,           -- Homeowner, property owner, etc.
  
  -- Contact information
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company_name TEXT,
  website TEXT,
  city_province TEXT,
  country TEXT DEFAULT 'US',
  
  -- Scoring and matching
  score INTEGER DEFAULT 0,
  status TEXT DEFAULT 'new',
  conversion_status TEXT DEFAULT 'lead',
  
  -- Attribution tracking
  attribution_channel TEXT,
  attribution_url TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  gclid TEXT,
  fbclid TEXT,
  
  -- Email verification
  email_verified BOOLEAN DEFAULT false,
  email_verification_token TEXT,
  verification_token_expires_at TIMESTAMPTZ,
  
  -- Assignment & management
  assigned_partner_id UUID REFERENCES partners(id),
  assignment_date TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  ip_address INET,
  user_agent TEXT
);

-- Create indexes for performance
CREATE INDEX idx_quiz_responses_email ON quiz_responses(email);
CREATE INDEX idx_quiz_responses_status ON quiz_responses(status);
CREATE INDEX idx_quiz_responses_created_at ON quiz_responses(created_at DESC);
CREATE INDEX idx_quiz_responses_score ON quiz_responses(score DESC);

-- Draft saves (for resuming progress)
CREATE TABLE quiz_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  form_data JSONB NOT NULL DEFAULT '{}',
  current_step INTEGER NOT NULL DEFAULT 1,
  quiz_response_id UUID REFERENCES quiz_responses(id),
  last_updated TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Partners/Providers (for matching)
CREATE TABLE partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  company_name TEXT NOT NULL,
  partner_type TEXT NOT NULL,           -- 'lender', 'broker', 'provider', etc.
  
  -- Matching criteria
  min_score INTEGER DEFAULT 0,
  max_score INTEGER DEFAULT 100,
  min_value INTEGER,                    -- Min loan amount, coverage, etc.
  max_value INTEGER,
  preferred_qualifiers JSONB,           -- Industry-specific criteria
  geographic_coverage TEXT[],
  
  -- Business info
  rating NUMERIC DEFAULT 4.5,
  total_leads_assigned INTEGER DEFAULT 0,
  deals_closed INTEGER DEFAULT 0,
  commission_percentage NUMERIC,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Row Level Security (RLS) Policies:**

```sql
-- Enable RLS
ALTER TABLE quiz_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_drafts ENABLE ROW LEVEL SECURITY;

-- Users can insert their own quiz responses
CREATE POLICY "Users can submit quiz responses"
ON quiz_responses FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Users can view their own responses
CREATE POLICY "Users can view own responses"
ON quiz_responses FOR SELECT
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Management can view all
CREATE POLICY "Management can view all responses"
ON quiz_responses FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'superadmin', 'manager')
  )
);

-- Draft policies
CREATE POLICY "Users can manage own drafts"
ON quiz_drafts FOR ALL
USING (auth.uid() = user_id);
```

---

## Part 2: Quiz Flow Architecture

### 2.1 Step Configuration System

**Quiz Configuration Object:**

```typescript
interface QuizConfig {
  steps: QuizStep[];
  scoring: ScoringConfig;
  validation: ValidationConfig;
  providers: ProviderMatchingConfig;
}

interface QuizStep {
  id: string;
  order: number;
  title: string;
  subtitle?: string;
  type: 'single' | 'multiple' | 'input' | 'slider' | 'autocomplete';
  field: string;
  required: boolean;
  autoAdvance?: boolean;
  options?: StepOption[];
  validation?: ValidationRule;
  displayCondition?: (data: QuizData) => boolean;
}

interface StepOption {
  value: string;
  label: string;
  icon?: string;
  description?: string;
  scoreModifier?: number;
}
```

### 2.2 Standard Quiz Flow (8-Step Pattern)

**Step 1: Primary Value Input**
```typescript
{
  id: 'primary_value',
  order: 1,
  title: 'How much [VALUE] do you need?',
  subtitle: 'Select the amount that best fits your needs',
  type: 'single',
  field: 'primaryValue',
  required: true,
  autoAdvance: true,
  options: [
    { value: '10000-25000', label: '$10,000 - $25,000', icon: 'DollarSign' },
    { value: '25000-50000', label: '$25,000 - $50,000', icon: 'DollarSign' },
    { value: '50000-100000', label: '$50,000 - $100,000', icon: 'DollarSign' },
    { value: '100000-250000', label: '$100,000 - $250,000', icon: 'DollarSign' },
    { value: '250000-500000', label: '$250,000 - $500,000', icon: 'DollarSign' },
    { value: '500000+', label: '$500,000+', icon: 'TrendingUp' },
  ]
}
```

**Step 2: Purpose/Use Case**
```typescript
{
  id: 'purpose',
  order: 2,
  title: 'What will you use [VALUE] for?',
  subtitle: 'Select your primary purpose',
  type: 'single',
  field: 'purpose',
  required: true,
  autoAdvance: true,
  options: [
    { value: 'expansion', label: 'Business Expansion', icon: 'TrendingUp' },
    { value: 'equipment', label: 'Equipment Purchase', icon: 'Truck' },
    { value: 'inventory', label: 'Inventory', icon: 'Package' },
    { value: 'working-capital', label: 'Working Capital', icon: 'Wallet' },
    { value: 'marketing', label: 'Marketing', icon: 'Megaphone' },
    { value: 'other', label: 'Other', icon: 'MoreHorizontal' },
  ]
}
```

**Step 3: Time-Based Qualifier**
```typescript
{
  id: 'time_qualifier',
  order: 3,
  title: 'How long have you been in business?',
  subtitle: 'Select the option that applies to you',
  type: 'single',
  field: 'timeQualifier',
  required: true,
  autoAdvance: true,
  options: [
    { value: 'less-6', label: 'Less than 6 months', icon: 'Calendar', scoreModifier: -20 },
    { value: '6-12', label: '6-12 months', icon: 'Calendar', scoreModifier: -10 },
    { value: '1-2', label: '1-2 years', icon: 'Calendar', scoreModifier: 0 },
    { value: '2-5', label: '2-5 years', icon: 'Calendar', scoreModifier: 10 },
    { value: '5+', label: '5+ years', icon: 'Award', scoreModifier: 20 },
  ]
}
```

**Step 4: Revenue/Financial Qualifier (Slider)**
```typescript
{
  id: 'revenue_qualifier',
  order: 4,
  title: 'What is your average monthly revenue?',
  subtitle: 'Move the slider to your approximate monthly revenue',
  type: 'slider',
  field: 'revenueQualifier',
  required: true,
  validation: {
    min: 0,
    max: 500000,
    step: 5000,
    default: 50000,
    format: 'currency'
  }
}
```

**Step 5: Risk/Score Qualifier**
```typescript
{
  id: 'score_qualifier',
  order: 5,
  title: 'What is your personal credit score?',
  subtitle: 'Select the range that best describes your credit',
  type: 'single',
  field: 'scoreQualifier',
  required: true,
  autoAdvance: true,
  options: [
    { value: 'excellent', label: 'Excellent (720+)', icon: 'Star', scoreModifier: 30 },
    { value: 'good', label: 'Good (680-719)', icon: 'ThumbsUp', scoreModifier: 20 },
    { value: 'fair', label: 'Fair (640-679)', icon: 'Minus', scoreModifier: 0 },
    { value: 'poor', label: 'Poor (Below 640)', icon: 'ThumbsDown', scoreModifier: -20 },
    { value: 'unsure', label: "I'm not sure", icon: 'HelpCircle', scoreModifier: -10 },
  ]
}
```

**Step 6: Account Type Qualifier**
```typescript
{
  id: 'account_type',
  order: 6,
  title: 'What type of bank account do you have?',
  subtitle: 'Select your primary business banking type',
  type: 'single',
  field: 'accountType',
  required: true,
  autoAdvance: true,
  options: [
    { value: 'business', label: 'Business Checking', icon: 'Building2', scoreModifier: 15 },
    { value: 'personal', label: 'Personal Checking', icon: 'User', scoreModifier: 0 },
    { value: 'none', label: 'No Bank Account', icon: 'XCircle', scoreModifier: -30 },
  ]
}
```

**Step 7: Additional Qualifier**
```typescript
{
  id: 'additional_qualifier',
  order: 7,
  title: 'Are you a homeowner?',
  subtitle: 'This helps us determine your eligibility',
  type: 'single',
  field: 'additionalQualifier',
  required: true,
  autoAdvance: true,
  options: [
    { value: 'yes', label: 'Yes, I own my home', icon: 'Home', scoreModifier: 10 },
    { value: 'no', label: 'No, I rent', icon: 'Home', scoreModifier: 0 },
  ]
}
```

**Step 8: Contact Information**
```typescript
{
  id: 'contact_info',
  order: 8,
  title: 'Get Your Results',
  subtitle: 'We need your information to show your personalized matches',
  type: 'multiple',
  field: 'contact',
  required: true,
  fields: [
    {
      name: 'name',
      label: 'Full Name',
      type: 'text',
      placeholder: 'John Doe',
      required: true,
      validation: { minLength: 2, maxLength: 100 }
    },
    {
      name: 'email',
      label: 'Email Address',
      type: 'email',
      placeholder: 'john@company.com',
      required: true,
      validation: { email: true }
    },
    {
      name: 'phone',
      label: 'Phone Number',
      type: 'tel',
      placeholder: '(555) 123-4567',
      required: true,
      validation: { phone: true },
      format: 'us-phone'
    },
    {
      name: 'company',
      label: 'Company Name',
      type: 'text',
      placeholder: 'Your Company Inc.',
      required: false
    },
    {
      name: 'website',
      label: 'Company Website',
      type: 'url',
      placeholder: 'https://yourcompany.com',
      required: false,
      validation: { url: true }
    },
    {
      name: 'location',
      label: 'City, State/Province',
      type: 'autocomplete',
      placeholder: 'New York, NY',
      required: false
    }
  ]
}
```

### 2.3 Quiz State Management

**React State Structure:**

```typescript
interface QuizState {
  currentStep: number;
  quizData: QuizData;
  score: number;
  errors: Record<string, string>;
  isSubmitting: boolean;
  hasStarted: boolean;
}

interface QuizData {
  primaryValue: string;
  purpose: string;
  timeQualifier: string;
  revenueQualifier: number;
  scoreQualifier: string;
  accountType: string;
  additionalQualifier: string;
  
  // Contact info
  name: string;
  email: string;
  phone: string;
  company?: string;
  website?: string;
  location?: string;
  
  // Tracking
  attributionChannel?: string;
  attributionUrl?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}
```

**State Management Hook:**

```typescript
const useQuizState = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [quizData, setQuizData] = useState<QuizData>({} as QuizData);
  const [score, setScore] = useState(0);
  
  const updateField = (field: string, value: any) => {
    setQuizData(prev => ({ ...prev, [field]: value }));
    
    // Recalculate score when data changes
    const newScore = calculateScore({ ...quizData, [field]: value });
    setScore(newScore);
  };
  
  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, TOTAL_STEPS));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));
  
  return {
    currentStep,
    quizData,
    score,
    updateField,
    nextStep,
    prevStep
  };
};
```

---

## Part 3: Scoring & Matching Engine

### 3.1 Scoring Algorithm

**Weighted Scoring System:**

```typescript
interface ScoringConfig {
  baseScore: number;                    // Starting score (e.g., 50)
  weights: Record<string, number>;      // Weight per field
  modifiers: Record<string, ScoreModifier>;
}

interface ScoreModifier {
  field: string;
  conditions: ScoreCondition[];
}

interface ScoreCondition {
  operator: 'equals' | 'greaterThan' | 'lessThan' | 'contains' | 'range';
  value: any;
  modifier: number;
}

// Example scoring configuration
const scoringConfig: ScoringConfig = {
  baseScore: 50,
  weights: {
    primaryValue: 1.0,
    purpose: 0.5,
    timeQualifier: 1.5,
    revenueQualifier: 2.0,
    scoreQualifier: 2.5,
    accountType: 1.0,
    additionalQualifier: 0.5
  },
  modifiers: {
    primaryValue: {
      field: 'primaryValue',
      conditions: [
        { operator: 'range', value: [10000, 50000], modifier: 5 },
        { operator: 'range', value: [50000, 100000], modifier: 10 },
        { operator: 'range', value: [100000, 250000], modifier: 15 },
        { operator: 'greaterThan', value: 250000, modifier: 20 }
      ]
    },
    revenueQualifier: {
      field: 'revenueQualifier',
      conditions: [
        { operator: 'lessThan', value: 10000, modifier: -20 },
        { operator: 'range', value: [10000, 50000], modifier: 0 },
        { operator: 'range', value: [50000, 100000], modifier: 10 },
        { operator: 'greaterThan', value: 100000, modifier: 20 }
      ]
    }
  }
};
```

**Score Calculation Function:**

```typescript
const calculateScore = (data: QuizData, config: ScoringConfig): number => {
  let score = config.baseScore;
  
  // Apply field-specific modifiers
  Object.entries(data).forEach(([field, value]) => {
    const weight = config.weights[field] || 1.0;
    const modifier = config.modifiers[field];
    
    if (modifier) {
      const matchingCondition = modifier.conditions.find(condition => 
        evaluateCondition(condition, value)
      );
      
      if (matchingCondition) {
        score += matchingCondition.modifier * weight;
      }
    }
  });
  
  // Normalize to 0-100 range
  return Math.max(0, Math.min(100, Math.round(score)));
};

const evaluateCondition = (condition: ScoreCondition, value: any): boolean => {
  switch (condition.operator) {
    case 'equals':
      return value === condition.value;
    case 'greaterThan':
      return Number(value) > condition.value;
    case 'lessThan':
      return Number(value) < condition.value;
    case 'range':
      const [min, max] = condition.value;
      return Number(value) >= min && Number(value) <= max;
    case 'contains':
      return String(value).includes(condition.value);
    default:
      return false;
  }
};
```

### 3.2 Provider Matching Logic

**Matching Algorithm:**

```typescript
interface MatchingCriteria {
  minScore: number;
  maxScore: number;
  minValue?: number;
  maxValue?: number;
  requiredQualifiers?: string[];
  excludedQualifiers?: string[];
  geographicCoverage?: string[];
}

const matchProviders = (
  lead: QuizData,
  score: number,
  providers: Provider[]
): MatchedProvider[] => {
  return providers
    .filter(provider => {
      // Score range check
      if (score < provider.minScore || score > provider.maxScore) {
        return false;
      }
      
      // Value range check
      const leadValue = parseValue(lead.primaryValue);
      if (provider.minValue && leadValue < provider.minValue) {
        return false;
      }
      if (provider.maxValue && leadValue > provider.maxValue) {
        return false;
      }
      
      // Required qualifiers check
      if (provider.requiredQualifiers) {
        const hasAllRequired = provider.requiredQualifiers.every(req =>
          checkQualifier(lead, req)
        );
        if (!hasAllRequired) return false;
      }
      
      // Excluded qualifiers check
      if (provider.excludedQualifiers) {
        const hasExcluded = provider.excludedQualifiers.some(exc =>
          checkQualifier(lead, exc)
        );
        if (hasExcluded) return false;
      }
      
      // Geographic coverage check
      if (provider.geographicCoverage && lead.location) {
        const inCoverage = provider.geographicCoverage.some(area =>
          lead.location?.includes(area)
        );
        if (!inCoverage) return false;
      }
      
      return true;
    })
    .map(provider => ({
      ...provider,
      matchScore: calculateMatchScore(lead, score, provider)
    }))
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 3); // Return top 3 matches
};

const calculateMatchScore = (
  lead: QuizData,
  score: number,
  provider: Provider
): number => {
  let matchScore = 100;
  
  // Deduct points for being near edge of score range
  const scoreRange = provider.maxScore - provider.minScore;
  const scorePosition = (score - provider.minScore) / scoreRange;
  if (scorePosition < 0.2 || scorePosition > 0.8) {
    matchScore -= 10;
  }
  
  // Add points for preferred qualifiers
  if (provider.preferredQualifiers) {
    provider.preferredQualifiers.forEach(pref => {
      if (checkQualifier(lead, pref)) {
        matchScore += 5;
      }
    });
  }
  
  return Math.min(100, matchScore);
};
```

---

## Part 4: UI/UX Implementation

### 4.1 Design System

**Color Tokens (index.css):**

```css
:root {
  /* Primary colors */
  --primary: 215 100% 50%;              /* Main brand color */
  --primary-foreground: 0 0% 100%;
  
  /* Secondary colors */
  --secondary: 215 20% 95%;
  --secondary-foreground: 215 100% 20%;
  
  /* Accent colors */
  --accent: 215 100% 60%;
  --accent-foreground: 0 0% 100%;
  
  /* Background */
  --background: 0 0% 100%;
  --foreground: 215 20% 10%;
  
  /* Card */
  --card: 0 0% 100%;
  --card-foreground: 215 20% 10%;
  
  /* Muted */
  --muted: 215 20% 95%;
  --muted-foreground: 215 20% 40%;
  
  /* Border */
  --border: 215 20% 90%;
  --input: 215 20% 85%;
  --ring: 215 100% 50%;
  
  /* Status colors */
  --success: 142 76% 36%;
  --warning: 38 92% 50%;
  --error: 0 84% 60%;
  --info: 199 89% 48%;
}

.dark {
  --background: 215 30% 8%;
  --foreground: 215 10% 95%;
  --card: 215 25% 12%;
  --card-foreground: 215 10% 95%;
  --primary: 215 100% 60%;
  --secondary: 215 25% 15%;
  --muted: 215 25% 20%;
  --border: 215 25% 20%;
  --input: 215 25% 18%;
}
```

**Typography Scale:**

```css
.text-hero {
  font-size: 3.5rem;
  line-height: 1.1;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.text-heading-1 {
  font-size: 2.5rem;
  line-height: 1.2;
  font-weight: 700;
}

.text-heading-2 {
  font-size: 2rem;
  line-height: 1.3;
  font-weight: 600;
}

.text-heading-3 {
  font-size: 1.5rem;
  line-height: 1.4;
  font-weight: 600;
}

.text-body {
  font-size: 1rem;
  line-height: 1.6;
}

.text-small {
  font-size: 0.875rem;
  line-height: 1.5;
}
```

### 4.2 Component Library

**QuizCard Component:**

```typescript
interface QuizCardProps {
  option: StepOption;
  selected: boolean;
  onClick: () => void;
  autoAdvance?: boolean;
}

const QuizCard: React.FC<QuizCardProps> = ({
  option,
  selected,
  onClick,
  autoAdvance
}) => {
  const Icon = option.icon ? LucideIcons[option.icon] : null;
  
  return (
    <Card
      className={cn(
        "cursor-pointer transition-all duration-300 hover:scale-105",
        "border-2 p-6 text-center",
        selected
          ? "border-primary bg-primary/5 shadow-lg"
          : "border-border hover:border-primary/50"
      )}
      onClick={onClick}
    >
      {Icon && (
        <Icon className="mx-auto mb-3 h-10 w-10 text-primary" />
      )}
      <div className="text-lg font-semibold">{option.label}</div>
      {option.description && (
        <p className="mt-2 text-sm text-muted-foreground">
          {option.description}
        </p>
      )}
    </Card>
  );
};
```

**Progress Bar Component:**

```typescript
interface QuizProgressProps {
  currentStep: number;
  totalSteps: number;
}

const QuizProgress: React.FC<QuizProgressProps> = ({
  currentStep,
  totalSteps
}) => {
  const percentage = (currentStep / totalSteps) * 100;
  
  return (
    <div className="w-full">
      <div className="mb-2 flex justify-between text-sm text-muted-foreground">
        <span>Step {currentStep} of {totalSteps}</span>
        <span>{Math.round(percentage)}% Complete</span>
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  );
};
```

**Slider Input Component:**

```typescript
interface SliderInputProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  format?: 'currency' | 'number' | 'percentage';
}

const SliderInput: React.FC<SliderInputProps> = ({
  value,
  onChange,
  min,
  max,
  step,
  format = 'number'
}) => {
  const formatValue = (val: number) => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(val);
      case 'percentage':
        return `${val}%`;
      default:
        return val.toLocaleString();
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="text-4xl font-bold text-primary">
          {formatValue(value)}
        </div>
      </div>
      <Slider
        value={[value]}
        onValueChange={([newValue]) => onChange(newValue)}
        min={min}
        max={max}
        step={step}
        className="w-full"
      />
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>{formatValue(min)}</span>
        <span>{formatValue(max)}</span>
      </div>
    </div>
  );
};
```

### 4.3 Responsive Design

**Mobile-First Breakpoints:**

```typescript
// tailwind.config.ts
module.exports = {
  theme: {
    screens: {
      'sm': '640px',   // Mobile landscape
      'md': '768px',   // Tablet
      'lg': '1024px',  // Desktop
      'xl': '1280px',  // Large desktop
      '2xl': '1536px', // Extra large
    }
  }
}
```

**Responsive Quiz Layout:**

```tsx
<div className="min-h-screen bg-gradient-to-br from-background to-secondary">
  <div className="container mx-auto px-4 py-8 md:py-16">
    <div className="mx-auto max-w-4xl">
      {/* Progress Bar */}
      <QuizProgress currentStep={currentStep} totalSteps={totalSteps} />
      
      {/* Quiz Card */}
      <Card className="mt-8 p-6 md:p-12">
        <div className="space-y-8">
          {/* Title */}
          <div className="text-center">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">
              {step.title}
            </h1>
            {step.subtitle && (
              <p className="mt-2 text-muted-foreground">
                {step.subtitle}
              </p>
            )}
          </div>
          
          {/* Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {step.options.map(option => (
              <QuizCard
                key={option.value}
                option={option}
                selected={quizData[step.field] === option.value}
                onClick={() => handleSelect(option.value)}
                autoAdvance={step.autoAdvance}
              />
            ))}
          </div>
          
          {/* Navigation */}
          <div className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button
              onClick={nextStep}
              disabled={!isStepValid()}
            >
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  </div>
</div>
```

---

## Part 5: Data Validation & Security

### 5.1 Zod Validation Schemas

```typescript
import { z } from 'zod';

// Phone number validation
const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;

// Email validation with common disposable domains blocked
const disposableEmailDomains = [
  'tempmail.com', 'guerrillamail.com', '10minutemail.com',
  'throwaway.email', 'mailinator.com'
];

const emailSchema = z.string()
  .email('Please enter a valid email address')
  .refine(
    (email) => {
      const domain = email.split('@')[1];
      return !disposableEmailDomains.includes(domain);
    },
    { message: 'Please use a business or personal email address' }
  );

// Full quiz validation schema
export const quizSchema = z.object({
  primaryValue: z.string().min(1, 'Please select an amount'),
  purpose: z.string().min(1, 'Please select a purpose'),
  timeQualifier: z.string().min(1, 'Please select a time period'),
  revenueQualifier: z.number()
    .min(0, 'Revenue cannot be negative')
    .max(10000000, 'Please contact us directly for amounts over $10M'),
  scoreQualifier: z.string().min(1, 'Please select a score range'),
  accountType: z.string().min(1, 'Please select an account type'),
  additionalQualifier: z.string().min(1, 'Please make a selection'),
  
  // Contact information
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name is too long')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name contains invalid characters'),
  
  email: emailSchema,
  
  phone: z.string()
    .regex(phoneRegex, 'Please enter a valid phone number')
    .transform(formatPhoneNumber),
  
  company: z.string().max(200).optional(),
  
  website: z.string()
    .url('Please enter a valid URL')
    .refine(
      (url) => url.startsWith('http://') || url.startsWith('https://'),
      'URL must start with http:// or https://'
    )
    .optional()
    .or(z.literal('')),
  
  location: z.string().max(100).optional(),
});

// Type inference
export type QuizFormData = z.infer<typeof quizSchema>;
```

### 5.2 Input Sanitization

```typescript
// Phone number formatter
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  
  if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  
  return phone;
};

// URL formatter
export const formatWebsiteUrl = (url: string): string => {
  if (!url) return '';
  
  let formatted = url.trim().toLowerCase();
  
  // Add https:// if missing
  if (!formatted.startsWith('http://') && !formatted.startsWith('https://')) {
    formatted = 'https://' + formatted;
  }
  
  // Remove trailing slash
  formatted = formatted.replace(/\/$/, '');
  
  return formatted;
};

// Text sanitizer (prevent XSS)
export const sanitizeText = (text: string): string => {
  return text
    .replace(/[<>]/g, '')  // Remove angle brackets
    .replace(/javascript:/gi, '')  // Remove javascript: protocol
    .replace(/on\w+=/gi, '')  // Remove event handlers
    .trim();
};
```

### 5.3 Rate Limiting & Abuse Prevention

**Database Function for Rate Limiting:**

```sql
-- Track submission attempts
CREATE TABLE submission_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET NOT NULL,
  email TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for quick lookups
CREATE INDEX idx_submission_attempts_ip ON submission_attempts(ip_address, created_at DESC);
CREATE INDEX idx_submission_attempts_email ON submission_attempts(email, created_at DESC);

-- Function to check rate limits
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_ip_address INET,
  p_email TEXT,
  p_time_window INTERVAL DEFAULT '1 hour'::INTERVAL,
  p_max_attempts INTEGER DEFAULT 5
) RETURNS BOOLEAN AS $$
DECLARE
  ip_attempts INTEGER;
  email_attempts INTEGER;
BEGIN
  -- Check IP-based rate limit
  SELECT COUNT(*) INTO ip_attempts
  FROM submission_attempts
  WHERE ip_address = p_ip_address
    AND created_at > now() - p_time_window;
  
  IF ip_attempts >= p_max_attempts THEN
    RETURN FALSE;
  END IF;
  
  -- Check email-based rate limit
  IF p_email IS NOT NULL THEN
    SELECT COUNT(*) INTO email_attempts
    FROM submission_attempts
    WHERE email = p_email
      AND created_at > now() - p_time_window;
    
    IF email_attempts >= p_max_attempts THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  -- Log this attempt
  INSERT INTO submission_attempts (ip_address, email)
  VALUES (p_ip_address, p_email);
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Frontend Rate Limit Check:**

```typescript
const checkRateLimit = async (email: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_ip_address: await getClientIP(),
      p_email: email,
      p_time_window: '1 hour',
      p_max_attempts: 5
    });
    
    if (error) throw error;
    
    if (!data) {
      toast.error('Too many submissions. Please try again later.');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Rate limit check failed:', error);
    return true; // Fail open to not block legitimate users
  }
};
```

---

## Part 6: Results Page Architecture

### 6.1 Results Page Layout

**Hero Section:**

```tsx
const ResultsHero: React.FC<{ lead: QuizData; score: number }> = ({
  lead,
  score
}) => {
  const estimatedValue = calculateEstimatedValue(lead, score);
  
  return (
    <section className="bg-gradient-to-br from-primary/10 to-accent/10 py-16">
      <div className="container mx-auto px-4 text-center">
        <div className="mx-auto max-w-3xl">
          {/* Congratulations Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-success/10 px-4 py-2 text-success">
            <CheckCircle className="h-5 w-5" />
            <span className="font-semibold">Congratulations!</span>
          </div>
          
          {/* Main Headline */}
          <h1 className="mb-4 text-4xl md:text-5xl lg:text-6xl font-bold">
            You May Qualify for Up To
          </h1>
          
          {/* Estimated Value */}
          <div className="mb-6 text-6xl md:text-7xl lg:text-8xl font-bold text-primary">
            {formatCurrency(estimatedValue)}
          </div>
          
          {/* Subheadline */}
          <p className="mb-8 text-xl text-muted-foreground">
            Based on your profile, we've matched you with {matchedProviders.length} 
            {' '}top-rated lenders who specialize in {lead.purpose} funding.
          </p>
          
          {/* CTA Button */}
          <Button size="lg" className="text-lg px-8 py-6">
            View My Matches
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </section>
  );
};
```

**Metrics Dashboard:**

```tsx
const MetricsDisplay: React.FC<{ lead: QuizData; score: number }> = ({
  lead,
  score
}) => {
  const metrics = calculateMetrics(lead, score);
  
  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard
            icon={DollarSign}
            label="Estimated Funding"
            value={formatCurrency(metrics.estimatedFunding)}
            description="Based on your revenue and credit profile"
          />
          <MetricCard
            icon={Clock}
            label="Funding Speed"
            value={metrics.fundingSpeed}
            description="Time to receive funds after approval"
          />
          <MetricCard
            icon={Percent}
            label="Estimated Rate"
            value={metrics.estimatedRate}
            description="Approximate interest rate range"
          />
        </div>
      </div>
    </section>
  );
};

const MetricCard: React.FC<MetricCardProps> = ({
  icon: Icon,
  label,
  value,
  description
}) => (
  <Card className="p-6 text-center">
    <Icon className="mx-auto mb-4 h-12 w-12 text-primary" />
    <div className="mb-2 text-sm font-medium text-muted-foreground">
      {label}
    </div>
    <div className="mb-2 text-3xl font-bold">{value}</div>
    <p className="text-sm text-muted-foreground">{description}</p>
  </Card>
);
```

**Provider Cards:**

```tsx
const ProvidersList: React.FC<{ providers: MatchedProvider[] }> = ({
  providers
}) => (
  <section className="py-12 bg-muted/50">
    <div className="container mx-auto px-4">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold mb-2">Your Top Matches</h2>
        <p className="text-muted-foreground">
          These lenders are pre-qualified and ready to review your application
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {providers.map((provider, index) => (
          <ProviderCard
            key={provider.id}
            provider={provider}
            rank={index + 1}
          />
        ))}
      </div>
    </div>
  </section>
);

const ProviderCard: React.FC<{ provider: MatchedProvider; rank: number }> = ({
  provider,
  rank
}) => (
  <Card className="relative overflow-hidden p-6 hover:shadow-lg transition-shadow">
    {rank === 1 && (
      <Badge className="absolute top-4 right-4 bg-primary">
        Best Match
      </Badge>
    )}
    
    <div className="mb-4 flex items-center gap-3">
      <Avatar className="h-16 w-16">
        <AvatarImage src={provider.logoUrl} alt={provider.name} />
        <AvatarFallback>{provider.name[0]}</AvatarFallback>
      </Avatar>
      <div>
        <h3 className="font-bold text-lg">{provider.name}</h3>
        <div className="flex items-center gap-1 text-warning">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={cn(
                "h-4 w-4",
                i < provider.rating ? "fill-current" : "fill-none"
              )}
            />
          ))}
          <span className="ml-1 text-sm text-muted-foreground">
            {provider.rating} ({provider.reviewCount} reviews)
          </span>
        </div>
      </div>
    </div>
    
    <div className="mb-4 space-y-2 text-sm">
      <div className="flex items-center gap-2">
        <CheckCircle className="h-4 w-4 text-success" />
        <span>Funding up to {formatCurrency(provider.maxFunding)}</span>
      </div>
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-primary" />
        <span>Funds in {provider.fundingSpeed}</span>
      </div>
      <div className="flex items-center gap-2">
        <Percent className="h-4 w-4 text-accent" />
        <span>Rates from {provider.minRate}%</span>
      </div>
    </div>
    
    <Button className="w-full" variant={rank === 1 ? 'default' : 'outline'}>
      View Details
      <ArrowRight className="ml-2 h-4 w-4" />
    </Button>
  </Card>
);
```

### 6.2 Calculation Logic

```typescript
const calculateEstimatedValue = (lead: QuizData, score: number): number => {
  const baseValue = parseValue(lead.primaryValue);
  
  // Apply multipliers based on score
  let multiplier = 1.0;
  if (score >= 80) multiplier = 1.5;
  else if (score >= 60) multiplier = 1.2;
  else if (score >= 40) multiplier = 1.0;
  else multiplier = 0.8;
  
  // Apply revenue-based adjustment
  const revenue = lead.revenueQualifier;
  if (revenue > 100000) multiplier *= 1.2;
  else if (revenue > 50000) multiplier *= 1.1;
  
  return Math.round(baseValue * multiplier);
};

const calculateMetrics = (lead: QuizData, score: number) => {
  const estimatedFunding = calculateEstimatedValue(lead, score);
  
  // Funding speed based on score and amount
  let fundingSpeed = '24-48 hours';
  if (estimatedFunding > 250000) fundingSpeed = '3-5 business days';
  else if (estimatedFunding > 100000) fundingSpeed = '1-3 business days';
  
  // Interest rate estimate based on credit score
  let estimatedRate = '12-18%';
  if (lead.scoreQualifier === 'excellent') estimatedRate = '8-12%';
  else if (lead.scoreQualifier === 'good') estimatedRate = '10-15%';
  else if (lead.scoreQualifier === 'fair') estimatedRate = '15-20%';
  else if (lead.scoreQualifier === 'poor') estimatedRate = '20-30%';
  
  return {
    estimatedFunding,
    fundingSpeed,
    estimatedRate
  };
};
```

---

## Part 7: Backend Integration

### 7.1 Quiz Submission Flow

**Edge Function: submit-quiz-response**

```typescript
// supabase/functions/submit-quiz-response/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { quizData, score, attribution } = await req.json();

    // Validate data
    if (!quizData.email || !quizData.name) {
      throw new Error('Missing required fields');
    }

    // Check rate limit
    const clientIP = req.headers.get('x-forwarded-for') || 'unknown';
    const { data: rateLimitOk } = await supabase.rpc('check_rate_limit', {
      p_ip_address: clientIP,
      p_email: quizData.email
    });

    if (!rateLimitOk) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate email verification token
    const verificationToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Insert quiz response
    const { data: response, error } = await supabase
      .from('quiz_responses')
      .insert({
        ...quizData,
        score,
        ...attribution,
        email_verification_token: verificationToken,
        verification_token_expires_at: expiresAt,
        ip_address: clientIP,
        user_agent: req.headers.get('user-agent')
      })
      .select()
      .single();

    if (error) throw error;

    // Send verification email
    await supabase.functions.invoke('send-email-verification', {
      body: {
        leadId: response.id,
        email: quizData.email,
        name: quizData.name
      }
    });

    // Trigger external webhooks (Make.com, Zapier, etc.)
    if (Deno.env.get('WEBHOOK_URL')) {
      fetch(Deno.env.get('WEBHOOK_URL'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'quiz_completed',
          data: response
        })
      }).catch(console.error); // Fire and forget
    }

    return new Response(
      JSON.stringify({ success: true, responseId: response.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

### 7.2 Email Verification System

**Edge Function: send-email-verification**

```typescript
// supabase/functions/send-email-verification/index.ts
import { Resend } from 'npm:resend@2.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

serve(async (req) => {
  const { leadId, email, name } = await req.json();

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // Get verification token
  const { data: lead } = await supabase
    .from('quiz_responses')
    .select('email_verification_token')
    .eq('id', leadId)
    .single();

  const verificationUrl = `${Deno.env.get('APP_URL')}/verify-email?token=${lead.email_verification_token}`;

  // Send email
  await resend.emails.send({
    from: 'Your Company <noreply@yourcompany.com>',
    to: [email],
    subject: 'Verify your email to see your results',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #2563eb;">Hi ${name}!</h1>
            <p>Thank you for completing our quiz. We're excited to show you your personalized results!</p>
            <p>Please verify your email address to access your matches:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background-color: #2563eb; color: white; padding: 14px 28px; 
                        text-decoration: none; border-radius: 6px; display: inline-block;
                        font-weight: bold;">
                Verify Email & View Results
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">
              This link will expire in 24 hours. If you didn't request this, you can safely ignore this email.
            </p>
            <p style="color: #666; font-size: 14px;">
              Or copy and paste this link: ${verificationUrl}
            </p>
          </div>
        </body>
      </html>
    `
  });

  return new Response(JSON.stringify({ success: true }));
});
```

**Edge Function: verify-email**

```typescript
// supabase/functions/verify-email/index.ts
serve(async (req) => {
  const url = new URL(req.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return new Response('Invalid token', { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // Find lead with this token
  const { data: lead, error } = await supabase
    .from('quiz_responses')
    .select('*')
    .eq('email_verification_token', token)
    .eq('email_verified', false)
    .single();

  if (error || !lead) {
    return new Response('Invalid or expired token', { status: 400 });
  }

  // Check if token is expired
  if (new Date(lead.verification_token_expires_at) < new Date()) {
    return new Response('Token expired', { status: 400 });
  }

  // Mark as verified
  await supabase
    .from('quiz_responses')
    .update({
      email_verified: true,
      email_verification_token: null,
      verification_token_expires_at: null
    })
    .eq('id', lead.id);

  // Redirect to results page
  return Response.redirect(
    `${Deno.env.get('APP_URL')}/results/${lead.id}`,
    302
  );
});
```

### 7.3 Attribution Tracking

**Frontend Attribution Hook:**

```typescript
// hooks/use-attribution.tsx
export const useAttribution = () => {
  const getAttributionData = useCallback(() => {
    const urlParams = new URLSearchParams(window.location.search);
    
    return {
      attributionChannel: document.referrer ? new URL(document.referrer).hostname : 'direct',
      attributionUrl: window.location.href,
      utmSource: urlParams.get('utm_source') || undefined,
      utmMedium: urlParams.get('utm_medium') || undefined,
      utmCampaign: urlParams.get('utm_campaign') || undefined,
      utmContent: urlParams.get('utm_content') || undefined,
      utmTerm: urlParams.get('utm_term') || undefined,
      gclid: urlParams.get('gclid') || undefined,
      fbclid: urlParams.get('fbclid') || undefined,
    };
  }, []);

  // Store attribution in sessionStorage on first visit
  useEffect(() => {
    const stored = sessionStorage.getItem('attribution');
    if (!stored) {
      const attribution = getAttributionData();
      sessionStorage.setItem('attribution', JSON.stringify(attribution));
    }
  }, [getAttributionData]);

  const getStoredAttribution = useCallback(() => {
    const stored = sessionStorage.getItem('attribution');
    return stored ? JSON.parse(stored) : getAttributionData();
  }, [getAttributionData]);

  return { getStoredAttribution };
};
```

---

## Part 8: Conversion Optimization

### 8.1 Auto-Save Functionality

**Draft Saving Hook:**

```typescript
// hooks/use-quiz-draft.tsx
export const useQuizDraft = () => {
  const { user } = useAuth();
  const [draftId, setDraftId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Save draft (debounced)
  const saveDraft = useMemo(
    () =>
      debounce(async (formData: QuizData, currentStep: number) => {
        if (!user) return;

        try {
          const { data, error } = await supabase
            .from('quiz_drafts')
            .upsert({
              id: draftId || undefined,
              user_id: user.id,
              form_data: formData,
              current_step: currentStep,
              last_updated: new Date().toISOString()
            })
            .select()
            .single();

          if (error) throw error;
          if (!draftId) setDraftId(data.id);
          
          console.log('Draft saved successfully');
        } catch (error) {
          console.error('Error saving draft:', error);
        }
      }, 1000),
    [user, draftId]
  );

  // Load draft
  const loadDraft = useCallback(async () => {
    if (!user) return null;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('quiz_drafts')
        .select('*')
        .eq('user_id', user.id)
        .order('last_updated', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setDraftId(data.id);
        return {
          formData: data.form_data as QuizData,
          currentStep: data.current_step
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error loading draft:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Delete draft
  const deleteDraft = useCallback(async () => {
    if (!draftId) return;

    try {
      await supabase
        .from('quiz_drafts')
        .delete()
        .eq('id', draftId);
      
      setDraftId(null);
    } catch (error) {
      console.error('Error deleting draft:', error);
    }
  }, [draftId]);

  return {
    saveDraft,
    loadDraft,
    deleteDraft,
    isLoading
  };
};
```

### 8.2 Social Proof Widget

```tsx
const SocialProofWidget: React.FC = () => {
  const [recentApprovals, setRecentApprovals] = useState<Approval[]>([]);

  useEffect(() => {
    // Fetch or generate recent approval notifications
    const approvals = generateRecentApprovals();
    setRecentApprovals(approvals);

    // Rotate through approvals
    const interval = setInterval(() => {
      setRecentApprovals(prev => [...prev.slice(1), prev[0]]);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-sm">
      <AnimatePresence mode="wait">
        <motion.div
          key={recentApprovals[0]?.id}
          initial={{ opacity: 0, x: -100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          className="rounded-lg bg-card p-4 shadow-lg border"
        >
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback>{recentApprovals[0]?.initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <span className="font-semibold text-sm">Recently Approved</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {recentApprovals[0]?.name} from {recentApprovals[0]?.location}
              </p>
              <p className="text-xs text-muted-foreground">
                {recentApprovals[0]?.amount} • {recentApprovals[0]?.timeAgo}
              </p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

const generateRecentApprovals = (): Approval[] => {
  const names = ['John D.', 'Sarah M.', 'Mike R.', 'Lisa K.', 'David P.'];
  const cities = ['New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX', 'Phoenix, AZ'];
  const amounts = ['$50,000', '$75,000', '$100,000', '$150,000', '$200,000'];
  
  return Array.from({ length: 10 }, (_, i) => ({
    id: i.toString(),
    name: names[Math.floor(Math.random() * names.length)],
    initials: names[i % names.length].split(' ').map(n => n[0]).join(''),
    location: cities[Math.floor(Math.random() * cities.length)],
    amount: amounts[Math.floor(Math.random() * amounts.length)],
    timeAgo: `${Math.floor(Math.random() * 60) + 1} minutes ago`
  }));
};
```

### 8.3 Exit Intent Detection

```typescript
// hooks/use-exit-intent.tsx
export const useExitIntent = (onExitIntent: () => void) => {
  useEffect(() => {
    let hasShown = false;

    const handleMouseLeave = (e: MouseEvent) => {
      if (
        e.clientY <= 0 &&
        !hasShown &&
        !sessionStorage.getItem('exit_intent_shown')
      ) {
        hasShown = true;
        sessionStorage.setItem('exit_intent_shown', 'true');
        onExitIntent();
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [onExitIntent]);
};

// Usage in Quiz component
const Quiz = () => {
  const [showExitModal, setShowExitModal] = useState(false);

  useExitIntent(() => {
    if (currentStep > 1 && currentStep < totalSteps) {
      setShowExitModal(true);
    }
  });

  return (
    <>
      {/* Quiz content */}
      
      <Dialog open={showExitModal} onOpenChange={setShowExitModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Wait! Don't Leave Yet</DialogTitle>
            <DialogDescription>
              You're {Math.round((currentStep / totalSteps) * 100)}% done! 
              Complete your quiz to see your personalized matches and funding options.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowExitModal(false)}>
              Leave Anyway
            </Button>
            <Button onClick={() => setShowExitModal(false)}>
              Continue Quiz
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
```

---

## Part 9: Testing & Quality Assurance

### 9.1 Unit Testing

**Quiz Logic Tests:**

```typescript
// __tests__/quiz-logic.test.ts
import { describe, it, expect } from 'vitest';
import { calculateScore, matchProviders } from '@/lib/scoring-engine';

describe('Quiz Scoring Engine', () => {
  it('should calculate correct score for high-quality lead', () => {
    const quizData = {
      primaryValue: '100000-250000',
      timeQualifier: '5+',
      revenueQualifier: 100000,
      scoreQualifier: 'excellent',
      accountType: 'business',
      additionalQualifier: 'yes'
    };

    const score = calculateScore(quizData);
    expect(score).toBeGreaterThan(80);
  });

  it('should calculate lower score for risky lead', () => {
    const quizData = {
      primaryValue: '10000-25000',
      timeQualifier: 'less-6',
      revenueQualifier: 5000,
      scoreQualifier: 'poor',
      accountType: 'none',
      additionalQualifier: 'no'
    };

    const score = calculateScore(quizData);
    expect(score).toBeLessThan(40);
  });
});

describe('Provider Matching', () => {
  it('should match appropriate providers based on score', () => {
    const lead = {
      primaryValue: '50000-100000',
      scoreQualifier: 'good',
      revenueQualifier: 50000
    };

    const providers = [
      { id: '1', name: 'High-End Lender', minScore: 80, maxScore: 100 },
      { id: '2', name: 'Mid-Tier Lender', minScore: 60, maxScore: 79 },
      { id: '3', name: 'Flexible Lender', minScore: 40, maxScore: 69 }
    ];

    const matches = matchProviders(lead, 65, providers);
    
    expect(matches).toHaveLength(2);
    expect(matches[0].name).toBe('Mid-Tier Lender');
  });
});
```

**Validation Tests:**

```typescript
// __tests__/validation.test.ts
describe('Form Validation', () => {
  it('should accept valid email addresses', () => {
    const validEmails = [
      'user@example.com',
      'john.doe@company.co.uk',
      'test+label@domain.com'
    ];

    validEmails.forEach(email => {
      expect(emailSchema.safeParse(email).success).toBe(true);
    });
  });

  it('should reject invalid email addresses', () => {
    const invalidEmails = [
      'notanemail',
      '@example.com',
      'user@',
      'user@tempmail.com' // disposable domain
    ];

    invalidEmails.forEach(email => {
      expect(emailSchema.safeParse(email).success).toBe(false);
    });
  });

  it('should format phone numbers correctly', () => {
    expect(formatPhoneNumber('5551234567')).toBe('(555) 123-4567');
    expect(formatPhoneNumber('15551234567')).toBe('+1 (555) 123-4567');
  });
});
```

### 9.2 Integration Testing

```typescript
// __tests__/quiz-flow.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Quiz from '@/pages/Quiz';

describe('Quiz Flow Integration', () => {
  it('should complete full quiz flow', async () => {
    const user = userEvent.setup();
    render(<Quiz />);

    // Step 1: Select loan amount
    await user.click(screen.getByText('$50,000 - $100,000'));
    
    // Should auto-advance
    await waitFor(() => {
      expect(screen.getByText(/What will you use/i)).toBeInTheDocument();
    });

    // Step 2: Select purpose
    await user.click(screen.getByText('Business Expansion'));

    // Continue through all steps...
    
    // Final step: Contact information
    await user.type(screen.getByLabelText(/Full Name/i), 'John Doe');
    await user.type(screen.getByLabelText(/Email/i), 'john@example.com');
    await user.type(screen.getByLabelText(/Phone/i), '5551234567');

    // Submit
    await user.click(screen.getByText(/View Results/i));

    // Should navigate to results
    await waitFor(() => {
      expect(window.location.pathname).toContain('/results');
    });
  });

  it('should save and restore draft progress', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Quiz />);

    // Answer first few questions
    await user.click(screen.getByText('$100,000 - $250,000'));
    await user.click(screen.getByText('Equipment Purchase'));

    // Simulate leaving and returning
    rerender(<Quiz />);

    // Should restore progress
    await waitFor(() => {
      expect(screen.getByText(/Continue where you left off/i)).toBeInTheDocument();
    });
  });
});
```

### 9.3 E2E Testing with Playwright

```typescript
// e2e/quiz-submission.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Quiz Submission E2E', () => {
  test('should complete quiz and receive verification email', async ({ page }) => {
    // Navigate to quiz
    await page.goto('/quiz');

    // Complete all steps
    await page.click('text=$50,000 - $100,000');
    await page.click('text=Working Capital');
    await page.click('text=2-5 years');
    
    // Set revenue slider
    await page.locator('input[type="range"]').fill('75000');
    await page.click('text=Next');
    
    await page.click('text=Good (680-719)');
    await page.click('text=Business Checking');
    await page.click('text=Yes, I own my home');

    // Fill contact form
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="phone"]', '5551234567');
    await page.fill('input[name="company"]', 'Test Company');

    // Submit
    await page.click('text=View Results');

    // Should see success message
    await expect(page.locator('text=/check your email/i')).toBeVisible();

    // Verify email sent (mock or check test mailbox)
    // ...
  });

  test('should show validation errors for invalid data', async ({ page }) => {
    await page.goto('/quiz');

    // Navigate to contact form
    // ... (skip through steps)

    // Submit with invalid email
    await page.fill('input[name="email"]', 'invalid-email');
    await page.click('text=Submit');

    await expect(page.locator('text=/valid email/i')).toBeVisible();
  });
});
```

---

## Part 10: Deployment & Monitoring

### 10.1 Environment Configuration

**.env.example:**

```bash
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# App
VITE_APP_URL=https://yourapp.com

# Email (Resend)
RESEND_API_KEY=re_your_api_key

# External Integrations
WEBHOOK_URL=https://hooks.make.com/your-webhook
ZAPIER_WEBHOOK_URL=https://hooks.zapier.com/your-webhook

# Analytics
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_META_PIXEL_ID=123456789
```

### 10.2 Performance Optimization

**Code Splitting:**

```typescript
// Lazy load results page
const Results = lazy(() => import('@/pages/Results'));

// Lazy load heavy components
const QuillEditor = lazy(() => import('react-quill'));
const ChartComponent = lazy(() => import('@/components/Chart'));

// In component
<Suspense fallback={<LoadingSpinner />}>
  <Results />
</Suspense>
```

**Image Optimization:**

```typescript
// Use optimized images
import { OptimizedImage } from '@/components/OptimizedImage';

<OptimizedImage
  src="/images/hero.jpg"
  alt="Hero image"
  width={1200}
  height={600}
  loading="lazy"
  sizes="(max-width: 768px) 100vw, 1200px"
/>
```

### 10.3 Monitoring & Analytics

**Error Tracking:**

```typescript
// lib/error-tracking.ts
export const logError = async (error: Error, context?: any) => {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', error, context);
  }

  // Send to error tracking service (Sentry, etc.)
  // await sentry.captureException(error, { extra: context });

  // Log to Supabase for internal tracking
  try {
    await supabase.from('error_logs').insert({
      message: error.message,
      stack: error.stack,
      context: JSON.stringify(context),
      user_agent: navigator.userAgent,
      url: window.location.href
    });
  } catch (e) {
    console.error('Failed to log error:', e);
  }
};
```

**Analytics Tracking:**

```typescript
// lib/analytics.ts
export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  // Google Analytics
  if (window.gtag) {
    window.gtag('event', eventName, properties);
  }

  // Meta Pixel
  if (window.fbq) {
    window.fbq('track', eventName, properties);
  }

  // Custom analytics
  supabase.from('analytics_events').insert({
    event_type: eventName,
    properties,
    session_id: getSessionId(),
    page_path: window.location.pathname
  });
};

// Usage
trackEvent('quiz_started', { source: 'homepage' });
trackEvent('quiz_step_completed', { step: 3 });
trackEvent('quiz_completed', { score: 85, timeSpent: 120 });
```

---

## Part 11: Customization Guide

### 11.1 Branding Customization

**Update Theme Colors:**

```css
/* src/index.css */
:root {
  /* Replace these with your brand colors */
  --primary: 220 90% 56%;        /* #3B82F6 (blue) */
  --accent: 142 76% 36%;         /* #10B981 (green) */
  
  /* Or use your brand colors */
  --primary: 0 84% 60%;          /* Red */
  --primary: 262 83% 58%;        /* Purple */
  --primary: 173 80% 40%;        /* Teal */
}
```

**Update Logo & Branding:**

```tsx
// components/Header.tsx
export const Header = () => {
  return (
    <header>
      <img src="/your-logo.png" alt="Your Company" />
      <nav>{/* ... */}</nav>
    </header>
  );
};
```

### 11.2 Content Customization

**Quiz Questions Configuration File:**

```typescript
// config/quiz-config.ts
export const quizConfig: QuizConfig = {
  branding: {
    companyName: 'Your Company',
    logoUrl: '/your-logo.png',
    primaryColor: '#3B82F6',
    supportEmail: 'support@yourcompany.com',
    supportPhone: '1-800-123-4567'
  },
  
  seo: {
    title: 'Get Your Free Quote | Your Company',
    description: 'Find the best options for your needs in minutes.',
    ogImage: '/og-image.jpg'
  },
  
  steps: [
    // Your customized steps here
  ],
  
  scoring: {
    baseScore: 50,
    weights: {
      // Your custom weights
    }
  },
  
  email: {
    fromName: 'Your Company',
    fromEmail: 'noreply@yourcompany.com',
    verificationSubject: 'Verify your email to see your results',
    templates: {
      verification: '/emails/verification.html'
    }
  }
};
```

### 11.3 Niche-Specific Customization Checklist

**For Each New Niche:**

1. **Update Quiz Questions:**
   - [ ] Customize step 1 (primary value field)
   - [ ] Update step 2 options (purpose/use case)
   - [ ] Adjust step 3 (time qualifier)
   - [ ] Set step 4 slider ranges (financial qualifier)
   - [ ] Modify step 5 (risk/score qualifier)
   - [ ] Customize steps 6-7 (additional qualifiers)
   - [ ] Update field labels and placeholders

2. **Update Scoring Logic:**
   - [ ] Define scoring weights per field
   - [ ] Set up score modifiers
   - [ ] Configure qualification thresholds
   - [ ] Update provider matching criteria

3. **Customize Results Page:**
   - [ ] Update hero section copy
   - [ ] Modify metrics displayed
   - [ ] Customize provider card fields
   - [ ] Update benefits/features list
   - [ ] Adjust CTA messaging

4. **Update Database Schema:**
   - [ ] Add niche-specific fields to quiz_responses
   - [ ] Update validation constraints
   - [ ] Add niche-specific indexes
   - [ ] Configure provider matching rules

5. **Configure Email Templates:**
   - [ ] Customize verification email
   - [ ] Update confirmation email
   - [ ] Modify follow-up sequences
   - [ ] Add niche-specific messaging

6. **Update SEO & Meta:**
   - [ ] Page titles and descriptions
   - [ ] Open Graph tags
   - [ ] Schema.org markup
   - [ ] Sitemap entries

---

## Part 12: Launch Checklist

### Pre-Launch Checklist

**Technical:**
- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] RLS policies tested
- [ ] Email sending tested (verification, notifications)
- [ ] External webhooks configured
- [ ] Analytics tracking verified
- [ ] Error logging working
- [ ] Performance testing completed (Lighthouse score >90)
- [ ] Mobile responsiveness verified
- [ ] Cross-browser testing completed
- [ ] SSL certificate installed
- [ ] CDN configured
- [ ] Backup strategy in place

**Content:**
- [ ] All copy reviewed for grammar/spelling
- [ ] Brand colors and logo updated
- [ ] Images optimized and compressed
- [ ] Privacy policy page created
- [ ] Terms of service page created
- [ ] Contact information updated
- [ ] SEO meta tags completed
- [ ] Open Graph images created

**Legal & Compliance:**
- [ ] Privacy policy compliant with GDPR/CCPA
- [ ] Cookie consent banner (if required)
- [ ] Terms of service reviewed
- [ ] Disclaimer text added (if required)
- [ ] Data retention policies configured
- [ ] Unsubscribe mechanism working

**Testing:**
- [ ] Complete quiz submission tested
- [ ] Email verification flow tested
- [ ] Results page displays correctly
- [ ] Provider matching logic verified
- [ ] Form validation working
- [ ] Error handling tested
- [ ] Draft saving/loading tested
- [ ] Analytics events firing
- [ ] Mobile user flow tested
- [ ] Payment integration tested (if applicable)

### Post-Launch Monitoring

**Week 1:**
- [ ] Monitor error logs daily
- [ ] Check email delivery rates
- [ ] Review conversion rates
- [ ] Test all user flows
- [ ] Monitor server performance
- [ ] Review analytics data
- [ ] Check for broken links
- [ ] Verify external integrations working

**Ongoing:**
- [ ] Weekly analytics review
- [ ] Monthly conversion optimization
- [ ] Quarterly A/B testing
- [ ] User feedback collection
- [ ] Performance monitoring
- [ ] Security updates
- [ ] Content updates

---

## Conclusion

This master prompt provides a complete blueprint for building high-converting quiz funnels across any industry. The system is designed to be:

- **Modular:** Each component can be customized independently
- **Scalable:** Handles high traffic with proper database design
- **Secure:** Built-in validation, rate limiting, and RLS policies
- **Conversion-Optimized:** Proven UX patterns and psychological triggers
- **Maintainable:** Clean code architecture and comprehensive testing

**Key Success Factors:**

1. **User Experience First:** Every decision should prioritize reducing friction
2. **Data Quality:** Validation and verification ensure high-quality leads
3. **Performance:** Fast load times and smooth interactions drive conversions
4. **Trust Signals:** Social proof, security badges, and professional design build confidence
5. **Follow-Up:** Email sequences and retargeting maximize conversion rates

**Next Steps:**

1. Choose your niche from the 16 available templates
2. Merge this master prompt with your niche-specific prompt
3. Set up your development environment
4. Follow the implementation guide step-by-step
5. Customize branding and content
6. Test thoroughly before launch
7. Monitor and optimize continuously

With this comprehensive system, you can launch a professional quiz funnel in days rather than months, and achieve conversion rates of 15-30% or higher.

---

**Version:** 1.0
**Last Updated:** 2025
**Maintained By:** Your Team
**License:** Proprietary

For questions or support, contact: support@yourcompany.com
