CREATE OR REPLACE FUNCTION public.trigger_bitrix24_sync()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  sync_record RECORD;
BEGIN
  -- Only trigger if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Check if this order has a Bitrix24 deal linked
    SELECT * INTO sync_record FROM bitrix24_sync WHERE order_id = NEW.id LIMIT 1;
    
    -- Also check if deal_id is set directly on the order
    IF sync_record IS NOT NULL OR NEW.bitrix24_deal_id IS NOT NULL THEN
      -- Insert a sync request that will be processed
      INSERT INTO bitrix24_sync (order_id, deal_id, sync_status, last_synced_at)
      VALUES (
        NEW.id, 
        COALESCE(sync_record.deal_id, NEW.bitrix24_deal_id),
        'pending',
        now()
      )
      ON CONFLICT (order_id) 
      DO UPDATE SET 
        sync_status = 'pending',
        last_synced_at = now();
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$
