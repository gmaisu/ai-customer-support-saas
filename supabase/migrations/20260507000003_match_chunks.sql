-- match_chunks: cosine-similarity vector retrieval, ALWAYS scoped by project_id.
--
-- Returns the top `match_count` chunks from `chunks` ordered by cosine similarity
-- to the query embedding. The function uses the HNSW index from the initial schema
-- (chunks_embedding_idx) for fast retrieval.
--
-- The mandatory project_id filter is the entire reason this function exists — it
-- closes the loop on tenant isolation for retrieval. Without filtering by
-- project_id, one tenant's chatbot could pull chunks from another tenant. RLS
-- backs this up at the row level, but the function-level filter avoids the
-- entire round-trip for chunks the user can't see.
--
-- Returns: id, source_id, content, similarity (0..1), metadata, chunk_index.

create or replace function public.match_chunks(
  query_embedding extensions.vector(1536),
  target_project_id uuid,
  match_count int default 5,
  similarity_threshold float default 0.0
)
returns table (
  id uuid,
  source_id uuid,
  content text,
  chunk_index int,
  metadata jsonb,
  similarity float
)
language plpgsql
stable
security invoker
as $$
begin
  return query
  select
    c.id,
    c.source_id,
    c.content,
    c.chunk_index,
    c.metadata,
    1 - (c.embedding <=> query_embedding) as similarity
  from public.chunks c
  where c.project_id = target_project_id
    and c.embedding is not null
    and 1 - (c.embedding <=> query_embedding) >= similarity_threshold
  order by c.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- Allow authenticated users to call the function. RLS on chunks still applies,
-- but the function's project_id filter will already exclude foreign rows so
-- the RLS check reduces to a no-op.
grant execute on function public.match_chunks to authenticated;
