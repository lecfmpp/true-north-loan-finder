import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';

interface CanadianApplicationData {
  // Business Information
  legal_business_name: string;
  dba_name: string;
  physical_address: string;
  mailing_address: string;
  city: string;
  state: string;
  zip: string;
  business_phone: string;
  business_fax: string;
  type_of_entity: string;
  federal_tax_id: string;
  business_start_date: string;
  number_of_locations: string;
  business_property_type: string;
  monthly_rent_or_mortgage: string;
  landlord_or_bank_company_name: string;
  landlord_or_bank_phone: string;
  annual_gross_sales: string;
  amount_requested: string;
  use_of_funds: string;
  existing_advance: boolean;
  if_so_with_who: string;
  outstanding_balance: string;
  
  // Primary Owner Information
  principal_owner_name: string;
  ownership_percentage: string;
  ssn: string;
  dob: string;
  home_address: string;
  city_owner: string;
  state_owner: string;
  zip_owner: string;
  home_phone: string;
  cell_phone: string;
  email_address: string;
  
  // Secondary Owner Information (optional)
  principal_owner_name_2: string;
  ownership_percentage_2: string;
  ssn_2: string;
  dob_2: string;
  home_address_2: string;
  city_owner_2: string;
  state_owner_2: string;
  zip_owner_2: string;
  home_phone_2: string;
  cell_phone_2: string;
  email_address_2: string;
  
  // Credit Card Processing
  current_credit_card_processor: string;
  annual_credit_card_sales: string;
  average_monthly_cc_volume: string;
  
  // Documents
  document_files: File[];
  
  // Tracking fields
  quiz_response_id: string | null;
}

interface DraftData {
  id?: string;
  form_data: CanadianApplicationData;
  current_step: number;
  quiz_response_id?: string;
}

export const useCanadianApplicationDraft = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);

  // Save draft to database
  const saveDraft = useCallback(async (
    formData: CanadianApplicationData, 
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
        // Note: last_updated is automatically set by database trigger, don't manually set it
      };

      if (draftId) {
        // Update existing draft
        const { error } = await supabase
          .from('canadian_application_drafts')
          .update(draftData)
          .eq('id', draftId);

        if (error) throw error;
      } else {
        // Create new draft
        const { data, error } = await supabase
          .from('canadian_application_drafts')
          .insert([draftData])
          .select('id')
          .single();

        if (error) throw error;
        if (data) setDraftId(data.id);
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error('Failed to save draft');
    }
  }, [user, draftId]);

  // Load draft from database
  const loadDraft = useCallback(async (): Promise<DraftData | null> => {
    if (!user) return null;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('canadian_application_drafts')
        .select('*')
        .eq('user_id', user.id)
        .order('last_updated', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No draft found
          return null;
        }
        throw error;
      }

      if (data) {
        setDraftId(data.id);
        return {
          id: data.id,
          form_data: data.form_data as any as CanadianApplicationData,
          current_step: data.current_step,
          quiz_response_id: data.quiz_response_id,
        };
      }

      return null;
    } catch (error) {
      console.error('Error loading draft:', error);
      toast.error('Failed to load draft');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Delete draft from database
  const deleteDraft = useCallback(async () => {
    if (!user || !draftId) return;

    try {
      const { error } = await supabase
        .from('canadian_application_drafts')
        .delete()
        .eq('id', draftId);

      if (error) throw error;
      setDraftId(null);
    } catch (error) {
      console.error('Error deleting draft:', error);
      toast.error('Failed to delete draft');
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
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No quiz response found
          return null;
        }
        throw error;
      }

      return data?.id || null;
    } catch (error) {
      console.error('Error checking quiz completion:', error);
      return null;
    }
  }, [user]);

  return {
    isLoading,
    draftId,
    saveDraft,
    loadDraft,
    deleteDraft,
    checkQuizCompletion,
  };
};