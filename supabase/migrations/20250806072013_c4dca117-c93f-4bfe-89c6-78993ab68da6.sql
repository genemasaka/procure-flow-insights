-- Fix the generate_contract_deadlines function call issue
-- Drop and recreate the trigger function to ensure proper function calling
DROP TRIGGER IF EXISTS trigger_contract_deadlines ON public.contracts;
DROP FUNCTION IF EXISTS public.trigger_generate_contract_deadlines();

-- Recreate the trigger function with explicit function call
CREATE OR REPLACE FUNCTION public.trigger_generate_contract_deadlines()
RETURNS TRIGGER AS $$
BEGIN
  -- Generate deadlines for the contract using explicit function call
  PERFORM public.generate_contract_deadlines(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '';

-- Recreate the trigger
CREATE TRIGGER trigger_contract_deadlines
    AFTER INSERT OR UPDATE OF expiration_date, renewal_notice_days ON public.contracts
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_generate_contract_deadlines();