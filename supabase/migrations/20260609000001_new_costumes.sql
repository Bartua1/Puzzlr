-- Seed new costumes into cosmetics table
INSERT INTO cosmetics (id, name, type, price, asset_key, is_active) VALUES
  ('c1111111-1111-1111-1111-111111111111', 'Astronaut Helmet', 'costume', 45, 'cos_astronaut', true),
  ('c2222222-2222-2222-2222-222222222222', 'Pirate Captain', 'costume', 20, 'cos_pirate', true),
  ('c3333333-3333-3333-3333-333333333333', 'Cyberpunk Visor', 'costume', 40, 'cos_cyber', true),
  ('c4444444-4444-4444-4444-444444444444', 'Ninja Mask', 'costume', 25, 'cos_ninja', true),
  ('c5555555-5555-5555-5555-555555555555', 'Royal Crown', 'costume', 50, 'cos_royal', true),
  ('c6666666-6666-6666-6666-666666666666', 'Detective Fedora', 'costume', 30, 'cos_detective', true)
ON CONFLICT (id) DO NOTHING;
