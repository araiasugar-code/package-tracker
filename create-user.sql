-- 初回ログイン用ユーザーを作成
-- Email: arai.a@sugar-net.com
-- Password: Aki55

INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'arai.a@sugar-net.com',
    crypt('Aki55', gen_salt('bf')),
    NOW(),
    NULL,
    NULL,
    '{"provider": "email", "providers": ["email"]}',
    '{}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
);

-- ユーザーのidentityも作成
INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM auth.users WHERE email = 'arai.a@sugar-net.com'),
    format('{"sub": "%s", "email": "%s"}', (SELECT id FROM auth.users WHERE email = 'arai.a@sugar-net.com'), 'arai.a@sugar-net.com')::jsonb,
    'email',
    (SELECT id FROM auth.users WHERE email = 'arai.a@sugar-net.com')::text,
    NOW(),
    NOW(),
    NOW()
);