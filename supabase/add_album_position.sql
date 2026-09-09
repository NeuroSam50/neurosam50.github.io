alter table public.tracks
	add column if not exists album_position integer not null default 0;

update public.tracks
set album_position = position
where album_position = 0;
