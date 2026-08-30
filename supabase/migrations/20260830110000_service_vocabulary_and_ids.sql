-- Keep the vocabulary shared by the UI, API and catalogue enforceable at the
-- storage boundary, and make generated opaque ids unpredictable.

alter table public.catalog_categories
    add constraint catalog_categories_service_known check (
        service in ('wash-fold', 'wash-iron', 'dry-cleaning', 'premium-care')
    );

create or replace function public.gen_ulid() returns text as $$
declare
    alphabet constant text := '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
    ms bigint := (extract(epoch from clock_timestamp()) * 1000)::bigint;
    -- gen_random_uuid is backed by PostgreSQL's cryptographic random source.
    -- Hashing one value spreads its random bits uniformly across all 16 bytes;
    -- modulo 32 is unbiased because a byte has exactly eight groups of 32.
    entropy bytea := decode(md5(gen_random_uuid()::text), 'hex');
    result text := '';
begin
    for _ in 1..10 loop
        result := substr(alphabet, (ms % 32)::int + 1, 1) || result;
        ms := ms / 32;
    end loop;
    for byte_index in 0..15 loop
        result := result || substr(alphabet, (get_byte(entropy, byte_index) % 32) + 1, 1);
    end loop;
    return result;
end;
$$ language plpgsql volatile;
