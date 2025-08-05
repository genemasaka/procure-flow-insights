-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS generate_deadlines_on_contract_insert ON contracts;
DROP TRIGGER IF EXISTS generate_deadlines_on_contract_update ON contracts;

-- Recreate the triggers
CREATE TRIGGER generate_deadlines_on_contract_insert
  AFTER INSERT ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION trigger_generate_contract_deadlines();

CREATE TRIGGER generate_deadlines_on_contract_update
  AFTER UPDATE ON contracts
  FOR EACH ROW
  WHEN (OLD.expiration_date IS DISTINCT FROM NEW.expiration_date OR 
        OLD.renewal_notice_days IS DISTINCT FROM NEW.renewal_notice_days)
  EXECUTE FUNCTION trigger_generate_contract_deadlines();