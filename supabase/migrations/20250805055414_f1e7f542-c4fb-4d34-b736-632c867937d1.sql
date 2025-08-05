-- Fix security warnings by setting search_path on functions
ALTER FUNCTION generate_contract_deadlines(UUID) SET search_path = '';
ALTER FUNCTION generate_all_contract_deadlines() SET search_path = '';
ALTER FUNCTION trigger_generate_contract_deadlines() SET search_path = '';