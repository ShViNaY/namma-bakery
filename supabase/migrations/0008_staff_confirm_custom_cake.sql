-- Migration: 0008_staff_confirm_custom_cake.sql
-- 1. Allow 'CUSTOMER_ACCEPTED' in staff_review_request so bakery staff can confirm
--    custom cake requests directly via the Staff Portal confirmation modal.
-- 2. Grant least-privilege UPDATE on custom_cake_requests and INSERT on request_messages, audit_logs
--    to service_role for backend administrative updates.

create or replace function public.staff_review_request(
  p_request_id uuid,
  p_to request_status,
  p_message text default null
) returns custom_cake_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  r custom_cake_requests;
begin
  if not is_staff() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if p_to not in ('UNDER_REVIEW', 'NEEDS_CLARIFICATION', 'DECLINED', 'CUSTOMER_ACCEPTED') then
    raise exception 'INVALID_TRANSITION' using errcode = 'P0001';
  end if;

  select * into r from custom_cake_requests where id = p_request_id for update;
  if not found then
    raise exception 'REQUEST_NOT_FOUND';
  end if;

  if r.status not in ('SUBMITTED', 'UNDER_REVIEW', 'NEEDS_CLARIFICATION', 'QUOTED') then
    raise exception 'INVALID_TRANSITION: %', r.status using errcode = 'P0001';
  end if;

  if p_to in ('NEEDS_CLARIFICATION', 'DECLINED') and nullif(trim(coalesce(p_message, '')), '') is null then
    raise exception 'MESSAGE_REQUIRED' using errcode = 'P0001';
  end if;

  update custom_cake_requests
     set status = p_to,
         decline_reason = case when p_to = 'DECLINED' then p_message else null end,
         updated_at = now()
   where id = r.id
  returning * into r;

  if nullif(trim(coalesce(p_message, '')), '') is not null then
    insert into request_messages (request_id, sender, staff_id, body)
    values (r.id, 'STAFF', auth.uid(), left(p_message, 1000));
  end if;

  insert into audit_logs (actor_id, actor_role, action, entity_type, entity_id, after_data)
  values (
    auth.uid(),
    current_actor_role(),
    'request.status_changed',
    'custom_cake_requests',
    r.id::text,
    jsonb_build_object('to', p_to, 'note', p_message)
  );

  return r;
end;
$$;

-- Least-privilege administrative updates for service_role
grant update (status, updated_at, decline_reason) on table public.custom_cake_requests to service_role;
grant insert on table public.request_messages to service_role;
grant insert on table public.audit_logs to service_role;
