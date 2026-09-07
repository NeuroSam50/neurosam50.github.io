insert into public.admin_profiles (user_id, login)
values ('00000000-0000-0000-0000-000000000000', 'author-login')
on conflict (user_id) do update set login = excluded.login;
