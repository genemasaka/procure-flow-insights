
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useContracts = () => {
  return useQuery({
    queryKey: ['contracts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
};

export const useDeadlines = () => {
  return useQuery({
    queryKey: ['deadlines'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deadlines')
        .select(`
          *,
          contracts (
            title,
            counterparty
          )
        `)
        .order('due_date', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });
};

export const useAIInsights = () => {
  return useQuery({
    queryKey: ['ai_insights'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_insights')
        .select(`
          *,
          contracts (
            title,
            counterparty
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
};
