CREATE OR REPLACE FUNCTION private.exec_sql(query text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'auth', 'storage'
AS $function$
declare
  result jsonb;
  -- Strip trailing semicolons (and whitespace between/after them).
  -- Pattern: (s*;s*)+ at end of string.
  -- SAFE: only matches ; outside string literals because ; inside 'string'
  --       is never the last token before end-of-string in practice.
  -- KNOWN LIMITATION: queries ending with "; -- comment" still lose RETURNING
  -- because the ; is not at end after the comment, so it's not stripped here.
  -- For that edge case, use db_insert/db_update/db_delete tools instead of raw SQL.
  q text := regexp_replace(query, '(s*;s*)+$', '');
begin
  -- Attempt 1: subquery (SELECT/WITH-read/VALUES/TABLE/SHOW)
  begin
    execute format('select coalesce(jsonb_agg(row_to_json(_t)), ''[]''::jsonb) from ( %s ) as _t', q)
      into result;
    return result;
  exception when others then
    -- Attempt 2: writable CTE (captures RETURNING from DML)
    begin
      execute format('with _cte as ( %s ) select coalesce(jsonb_agg(row_to_json(_cte)), ''[]''::jsonb) from _cte', q)
        into result;
      return result;
    exception when others then
      -- Attempt 3: raw execute (DDL, multi-stmt, writable CTE at top, DML without RETURNING)
      execute q;
      return '[]'::jsonb;
    end;
  end;
end;
$function$
