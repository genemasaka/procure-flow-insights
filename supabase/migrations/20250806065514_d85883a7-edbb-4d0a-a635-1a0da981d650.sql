-- Fix the function to explicitly reference the public schema
CREATE OR REPLACE FUNCTION public.generate_contract_deadlines(contract_id_param UUID)
RETURNS void AS $$
DECLARE
  contract_record RECORD;
  renewal_deadline_date DATE;
  review_deadline_date DATE;
BEGIN
  -- Get the contract details with explicit schema reference
  SELECT * INTO contract_record FROM public.contracts WHERE id = contract_id_param;
  
  IF contract_record.id IS NULL THEN
    RETURN; -- Contract not found
  END IF;
  
  -- Clear existing auto-generated deadlines for this contract
  DELETE FROM public.deadlines WHERE contract_id = contract_id_param AND type IN ('expiration', 'renewal_notice', 'review');
  
  -- Generate expiration deadline if expiration_date exists
  IF contract_record.expiration_date IS NOT NULL THEN
    INSERT INTO public.deadlines (
      contract_id, 
      title, 
      description, 
      due_date, 
      type, 
      priority,
      status
    ) VALUES (
      contract_id_param,
      'Contract Expiration - ' || contract_record.title,
      'Contract expires and needs renewal or termination decision',
      contract_record.expiration_date,
      'expiration',
      CASE 
        WHEN contract_record.expiration_date - CURRENT_DATE <= 7 THEN 'critical'
        WHEN contract_record.expiration_date - CURRENT_DATE <= 30 THEN 'high'
        WHEN contract_record.expiration_date - CURRENT_DATE <= 90 THEN 'medium'
        ELSE 'low'
      END,
      CASE 
        WHEN contract_record.expiration_date < CURRENT_DATE THEN 'overdue'
        ELSE 'pending'
      END
    );
  END IF;
  
  -- Generate renewal notice deadline if renewal_notice_days is set
  IF contract_record.expiration_date IS NOT NULL AND contract_record.renewal_notice_days IS NOT NULL THEN
    renewal_deadline_date := contract_record.expiration_date - INTERVAL '1 day' * contract_record.renewal_notice_days;
    
    INSERT INTO public.deadlines (
      contract_id, 
      title, 
      description, 
      due_date, 
      type, 
      priority,
      status
    ) VALUES (
      contract_id_param,
      'Renewal Notice Required - ' || contract_record.title,
      'Send renewal notice to counterparty (' || contract_record.renewal_notice_days || ' days before expiration)',
      renewal_deadline_date,
      'renewal_notice',
      CASE 
        WHEN renewal_deadline_date - CURRENT_DATE <= 7 THEN 'critical'
        WHEN renewal_deadline_date - CURRENT_DATE <= 30 THEN 'high'
        WHEN renewal_deadline_date - CURRENT_DATE <= 90 THEN 'medium'
        ELSE 'low'
      END,
      CASE 
        WHEN renewal_deadline_date < CURRENT_DATE THEN 'overdue'
        ELSE 'pending'
      END
    );
  END IF;
  
  -- Generate review deadline (6 months before expiration)
  IF contract_record.expiration_date IS NOT NULL THEN
    review_deadline_date := contract_record.expiration_date - INTERVAL '6 months';
    
    -- Only add if the review date is in the future or recent past (within 30 days)
    IF review_deadline_date >= CURRENT_DATE - INTERVAL '30 days' THEN
      INSERT INTO public.deadlines (
        contract_id, 
        title, 
        description, 
        due_date, 
        type, 
        priority,
        status
      ) VALUES (
        contract_id_param,
        'Contract Review - ' || contract_record.title,
        'Quarterly review of contract performance and terms',
        review_deadline_date,
        'review',
        CASE 
          WHEN review_deadline_date - CURRENT_DATE <= 7 THEN 'critical'
          WHEN review_deadline_date - CURRENT_DATE <= 30 THEN 'high'
          WHEN review_deadline_date - CURRENT_DATE <= 90 THEN 'medium'
          ELSE 'low'
        END,
        CASE 
          WHEN review_deadline_date < CURRENT_DATE THEN 'overdue'
          ELSE 'pending'
        END
      );
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';