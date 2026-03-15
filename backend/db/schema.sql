-- sessions table: one row per uploaded file
create table sessions (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  original_columns jsonb,
  row_count integer,
  created_at timestamp with time zone default now()
);

-- messages table: full chat history per session
create table messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamp with time zone default now()
);

-- index so loading chat history is fast
create index messages_session_id_idx on messages(session_id, created_at asc);