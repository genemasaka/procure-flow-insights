-- Fix all deadline generation triggers and function
-- Drop all existing deadline-related triggers first
DROP TRIGGER IF EXISTS trigger_contract_deadlines ON public.contracts;
DROP TRIGGER IF EXISTS generate_deadlines_on_contract_insert ON public.contracts;  
DROP TRIGGER IF EXISTS generate_deadlines_on_contract_update ON public.contracts;

-- Now drop the trigger function
DROP FUNCTION IF EXISTS public.trigger_generate_contract_deadlines() CASCADE;

-- Recreate the trigger function with proper schema references
CREATE OR REPLACE FUNCTION public.trigger_generate_contract_deadlines()
RETURNS TRIGGER AS $$
BEGIN
  -- Generate deadlines for the contract using explicit schema reference
  PERFORM public.generate_contract_deadlines(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '';

-- Recreate a single trigger for both INSERT and UPDATE
CREATE TRIGGER trigger_contract_deadlines
    AFTER INSERT OR UPDATE OF expiration_date, renewal_notice_days ON public.contracts
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_generate_contract_deadlines();