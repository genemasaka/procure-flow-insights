-- Recreate the trigger for contract deadline generation
DROP TRIGGER IF EXISTS trigger_contract_deadlines ON public.contracts;

CREATE TRIGGER trigger_contract_deadlines
    AFTER INSERT OR UPDATE OF expiration_date, renewal_notice_days ON public.contracts
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_generate_contract_deadlines();