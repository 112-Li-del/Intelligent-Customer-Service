-- Catalog facts belong to Medusa. Curated product and policy documents have their own paths.
create or replace function laicai_knowledge.sync_catalog_product(target_id text)
returns void language plpgsql set search_path = pg_catalog, public as $$
declare
  item public.product%rowtype;
  specifications text;
begin
  select * into item from public.product where id = target_id;
  if not found or item.deleted_at is not null or item.status <> 'published' or item.handle is null then
    delete from laicai_knowledge.chunks
    where product_id = target_id and document_path like 'catalog/%';
    return;
  end if;

  select string_agg(left(entry ->> 0, 80) || '：' || left(entry ->> 1, 240), E'\n' order by position)
  into specifications
  from jsonb_array_elements(
    case when jsonb_typeof(item.metadata #> '{preview_details,specs}') = 'array'
         then item.metadata #> '{preview_details,specs}'
         when jsonb_typeof(item.metadata #> '{preview_details,specs}') = 'object'
         then (select jsonb_agg(jsonb_build_array(key, value) order by key)
               from jsonb_each(item.metadata #> '{preview_details,specs}'))
         else '[]'::jsonb end
  ) with ordinality as specs(entry, position)
  where jsonb_typeof(entry -> 0) = 'string' and jsonb_typeof(entry -> 1) = 'string'
    and btrim(entry ->> 0) <> '' and btrim(entry ->> 1) <> '';

  if specifications is null then
    delete from laicai_knowledge.chunks
    where id = 'catalog:' || target_id || ':specs' and document_path like 'catalog/%';
  end if;

  insert into laicai_knowledge.chunks as existing
    (id, document_path, title, section, content, content_hash, keyword_text, product_id, product_handle,
     categories, region_code, locale, source_paths, source_updated_at)
  select 'catalog:' || target_id || ':' || section_key, 'catalog/' || item.handle, item.title, section,
         content, md5(content), content || ' ' || coalesce(bigrams, ''), target_id, item.handle,
         '{}'::text[], 'cn', 'zh-CN', array['/cn/products/' || item.handle], item.updated_at
  from (
    values
      ('overview', '商品介绍', concat_ws(E'\n', left(item.title, 250), nullif(left(item.description, 1200), ''),
        case when nullif(btrim(item.material), '') is not null then '材质：' || left(item.material, 200) end)),
      ('specs', '商品规格', case when specifications is not null then left(item.title, 250) || E'\n' || specifications end)
  ) sections(section_key, section, content)
  cross join lateral (
    select string_agg(distinct substr(phrase[1], position, 2), ' ') as bigrams
    from regexp_matches(normalize(content, NFKC), '[㐀-䶿一-鿿]+', 'g') as matches(phrase)
    cross join generate_series(1, char_length(phrase[1]) - 1) as positions(position)
  ) keywords
  where content is not null
  on conflict (id) do update set
    document_path = excluded.document_path, title = excluded.title, content = excluded.content,
    content_hash = excluded.content_hash, keyword_text = excluded.keyword_text,
    product_handle = excluded.product_handle, source_paths = excluded.source_paths,
    source_updated_at = excluded.source_updated_at,
    embedding = case when existing.content_hash = excluded.content_hash then existing.embedding end,
    embedding_provider = case when existing.content_hash = excluded.content_hash then existing.embedding_provider end,
    embedding_model = case when existing.content_hash = excluded.content_hash then existing.embedding_model end
  where (existing.content_hash, existing.document_path, existing.title)
        is distinct from (excluded.content_hash, excluded.document_path, excluded.title);
end;
$$;

create or replace function laicai_knowledge.sync_catalog_product_trigger()
returns trigger language plpgsql set search_path = pg_catalog, public as $$
begin
  if tg_op = 'DELETE' then
    perform laicai_knowledge.sync_catalog_product(old.id);
  else
    perform laicai_knowledge.sync_catalog_product(new.id);
  end if;
  return null;
end;
$$;

create or replace trigger laicai_sync_catalog_product
after insert or update of title, handle, description, material, metadata, status, deleted_at or delete
on public.product for each row execute function laicai_knowledge.sync_catalog_product_trigger();

select laicai_knowledge.sync_catalog_product(product.id) from public.product;
