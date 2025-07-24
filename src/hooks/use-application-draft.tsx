import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';

interface ApplicationData {
  // Company Information
  legal_corporation_name: string;
  dba_name: string;
  physical_address: string;
  city: string;
  state: string;
  zip: string;
  entity_type: string;
  telephone_number: string;
  fax_number: string;
  website: string;
  email_address: string;
  
  // Federal & State Information
  federal_tax_id: string;
  state_tax_id: string;
  state_of_incorporation: string;
  date_incorporated: string;
  
  // Principal Information
  principal_name: string;
  principal_title: string;
  principal_ssn: string;
  principal_date_of_birth: string;
  principal_home_address: string;
  principal_city: string;
  principal_state: string;
  principal_zip: string;
  principal_home_phone: string;
  principal_cell_phone: string;
  principal_email: string;
  principal_ownership_percentage: string;
  
  // Business Information
  years_in_business: string;
  months_in_business: string;
  number_of_employees: string;
  business_type: string;
  business_description: string;
  
  // Bank Information
  bank_name: string;
  bank_account_type: string;
  bank_routing_number: string;
  bank_account_number: string;
  months_with_bank: string;
  
  // Financial Information
  average_monthly_deposits: string;
  monthly_rent_mortgage: string;
  
  // Processing Information
  accept_cards: string[];
  current_processor: string;
  mid_number: string;
  monthly_processing_volume: string;
  average_ticket: string;
  high_ticket: string;
  
  // Loan Information
  loan_amount_requested: string;
  use_of_funds: string;
  
  // Document Files
  document_files: File[];
}

interface DraftData {
  id?: string;
  form_data: ApplicationData;
  current_step: number;
  quiz_response_id?: string;
}

export const useApplicationDraft = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);

  // Save draft to database
  const saveDraft = useCallback(async (
    formData: ApplicationData, 
    currentStep: number, 
    quizResponseId?: string
  ) => {
    if (!user) return;

    try {
      const draftData = {
        user_id: user.id,
        form_data: formData as any, // Cast to any for JSON storage
        current_step: currentStep,
        quiz_response_id: quizResponseId || null,
      };

      if (draftId) {
        // Update existing draft
        const { error } = await supabase
          .from('usa_application_drafts')
          .update(draftData)
          .eq('id', draftId);

        if (error) throw error;
      } else {
        // Create new draft
        const { data, error } = await supabase
          .from('usa_application_drafts')
          .insert([draftData])
          .select('id')
          .single();

        if (error) throw error;
        if (data) setDraftId(data.id);
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      // Don't show error toast for draft saves to avoid interrupting user flow
    }
  }, [user, draftId]);

  // Load existing draft
  const loadDraft = useCallback(async (): Promise<DraftData | null> => {
    if (!user) return null;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('usa_application_drafts')
        .select('*')
        .eq('user_id', user.id)
        .order('last_updated', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setDraftId(data.id);
        return {
          id: data.id,
          form_data: data.form_data as unknown as ApplicationData, // Cast from JSON
          current_step: data.current_step,
          quiz_response_id: data.quiz_response_id,
        };
      }

      return null;
    } catch (error) {
      console.error('Error loading draft:', error);
      toast.error('Failed to load saved progress');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Delete draft (called after successful submission)
  const deleteDraft = useCallback(async () => {
    if (!user || !draftId) return;

    try {
      const { error } = await supabase
        .from('usa_application_drafts')
        .delete()
        .eq('id', draftId);

      if (error) throw error;
      setDraftId(null);
    } catch (error) {
      console.error('Error deleting draft:', error);
    }
  }, [user, draftId]);

  // Check if user has completed quiz
  const checkQuizCompletion = useCallback(async (): Promise<string | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('quiz_responses')
        .select('id')
        .eq('email', user.email)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data?.id || null;
    } catch (error) {
      console.error('Error checking quiz completion:', error);
      return null;
    }
  }, [user]);

  return {
    saveDraft,
    loadDraft,
    deleteDraft,
    checkQuizCompletion,
    isLoading,
    draftId,
  };
};