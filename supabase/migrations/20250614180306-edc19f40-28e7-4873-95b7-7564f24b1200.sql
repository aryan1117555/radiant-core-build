
-- Insert the users from the provided data with correct column names
INSERT INTO public.users (id, name, email, role, status, "assignedPGs", "lastLogin", created_at, updated_at) VALUES
('52a64086-78e8-4b74-99d5-9f0eec8d6001', 'Nextar', 'nextarbrains@gmail.com', 'admin', 'active', '[]'::json, '2025-06-09T07:03:46.892Z', '2025-05-28 11:43:48.630031+00', '2025-05-28 11:43:48.630031+00'),
('6b6085cc-c1d6-43b4-8f82-64fa668bceef', 'manager', 'manager1@gmail.com', 'manager', 'active', '["June"]'::json, '2025-06-04T08:45:43.339Z', '2025-05-28 11:50:30.2529+00', '2025-05-28 11:50:30.2529+00'),
('83071f4f-9173-4b67-966c-db8fb23099c3', 'accountantmain', 'accountantmain@restay.com', 'accountant', 'active', '["August"]'::json, '2025-05-30T08:56:10.448Z', '2025-05-30 06:55:56.339159+00', '2025-05-30 06:55:56.339159+00'),
('853b276f-c370-4446-8c6b-c4b68400e5ef', 'viewmain', 'viewmain@restay.com', 'viewer', 'active', '["August"]'::json, '2025-06-04T08:45:23.603Z', '2025-06-04 08:39:33.383519+00', '2025-06-04 08:39:33.383519+00'),
('8e832868-2b83-42ca-a1b6-e62fb7fa632a', 'Pal Sunny', 'nextarmain@gmail.com', 'manager', 'active', '["August"]'::json, '2025-06-04T07:02:55.255Z', '2025-05-28 11:44:15.549754+00', '2025-05-28 11:44:15.549754+00')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  status = EXCLUDED.status,
  "assignedPGs" = EXCLUDED."assignedPGs",
  "lastLogin" = EXCLUDED."lastLogin",
  updated_at = EXCLUDED.updated_at;
