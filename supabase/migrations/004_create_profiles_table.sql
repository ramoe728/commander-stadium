-- ============================================
-- Profiles Table
-- Stores user profile information
-- ============================================

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Username (unique, randomly generated on signup)
  username TEXT UNIQUE NOT NULL,
  
  -- Display name (optional, can be different from username)
  display_name TEXT,
  
  -- Avatar image URL (stored in Supabase Storage)
  avatar_url TEXT,
  
  -- Profile color (for fallback avatar)
  avatar_color TEXT DEFAULT '#7c3aed',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for username lookups
CREATE INDEX idx_profiles_username ON profiles(username);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Anyone can view profiles (for friend lists, lobbies, etc.)
CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT
  USING (true);

-- Users can only update their own profile
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Only the system can insert profiles (via trigger)
-- Users cannot insert their own profile directly
CREATE POLICY "System can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================
-- Storage bucket for avatars
-- ============================================

-- Note: This needs to be run separately in Supabase Dashboard
-- or via the Supabase CLI storage commands:
-- 
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('avatars', 'avatars', true);
--
-- CREATE POLICY "Anyone can view avatars"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'avatars');
--
-- CREATE POLICY "Authenticated users can upload avatars"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
--
-- CREATE POLICY "Users can update their own avatar"
--   ON storage.objects FOR UPDATE
--   USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
--
-- CREATE POLICY "Users can delete their own avatar"
--   ON storage.objects FOR DELETE
--   USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================
-- Function to generate random username
-- ============================================

CREATE OR REPLACE FUNCTION generate_random_username()
RETURNS TEXT AS $$
DECLARE
  adjectives TEXT[] := ARRAY[
    'Swift', 'Clever', 'Bold', 'Mystic', 'Ancient', 'Cosmic', 'Mighty', 'Noble',
    'Fierce', 'Silent', 'Shadow', 'Golden', 'Silver', 'Crystal', 'Thunder', 'Storm',
    'Fire', 'Ice', 'Dark', 'Light', 'Wild', 'Calm', 'Brave', 'Wise',
    'Lucky', 'Happy', 'Jolly', 'Merry', 'Crafty', 'Sneaky', 'Quick', 'Nimble',
    'Arcane', 'Fabled', 'Epic', 'Legendary', 'Mythic', 'Eternal', 'Primal', 'Radiant',
    'Spectral', 'Phantom', 'Ghostly', 'Astral', 'Celestial', 'Divine', 'Sacred', 'Enchanted',
    'Blazing', 'Frozen', 'Burning', 'Howling', 'Roaring', 'Whispered', 'Hidden', 'Secret'
  ];
  nouns TEXT[] := ARRAY[
    'Wizard', 'Mage', 'Knight', 'Dragon', 'Phoenix', 'Griffin', 'Wolf', 'Raven',
    'Hawk', 'Tiger', 'Lion', 'Bear', 'Sage', 'Oracle', 'Seer', 'Prophet',
    'Warrior', 'Hunter', 'Ranger', 'Paladin', 'Cleric', 'Druid', 'Shaman', 'Warlock',
    'Golem', 'Sphinx', 'Hydra', 'Kraken', 'Wyrm', 'Serpent', 'Basilisk', 'Chimera',
    'Guardian', 'Sentinel', 'Champion', 'Hero', 'Legend', 'Master', 'Lord', 'King',
    'Blade', 'Shield', 'Storm', 'Flame', 'Frost', 'Thunder', 'Shadow', 'Star',
    'Crow', 'Owl', 'Fox', 'Stag', 'Elk', 'Boar', 'Panther', 'Falcon'
  ];
  new_username TEXT;
  username_exists BOOLEAN;
  attempts INT := 0;
  max_attempts INT := 100;
BEGIN
  LOOP
    -- Generate random username
    new_username := adjectives[1 + floor(random() * array_length(adjectives, 1))::int] ||
                    nouns[1 + floor(random() * array_length(nouns, 1))::int];
    
    -- Check if username exists
    SELECT EXISTS(SELECT 1 FROM profiles WHERE username = new_username) INTO username_exists;
    
    -- If unique, return it
    IF NOT username_exists THEN
      RETURN new_username;
    END IF;
    
    -- Add random number suffix after a few attempts
    attempts := attempts + 1;
    IF attempts > 5 THEN
      new_username := new_username || floor(random() * 1000)::int::text;
      SELECT EXISTS(SELECT 1 FROM profiles WHERE username = new_username) INTO username_exists;
      IF NOT username_exists THEN
        RETURN new_username;
      END IF;
    END IF;
    
    -- Safety exit
    IF attempts >= max_attempts THEN
      RETURN 'User' || floor(random() * 1000000)::int::text;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Trigger to auto-create profile on user signup
-- ============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  random_colors TEXT[] := ARRAY[
    '#7c3aed', '#06b6d4', '#f59e0b', '#10b981', '#ef4444',
    '#8b5cf6', '#3b82f6', '#ec4899', '#14b8a6', '#f97316'
  ];
BEGIN
  INSERT INTO public.profiles (id, username, avatar_color)
  VALUES (
    NEW.id,
    generate_random_username(),
    random_colors[1 + floor(random() * array_length(random_colors, 1))::int]
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- Create profiles for existing users
-- ============================================

-- Insert profiles for any existing users who don't have one
INSERT INTO profiles (id, username, avatar_color)
SELECT 
  id,
  generate_random_username(),
  (ARRAY['#7c3aed', '#06b6d4', '#f59e0b', '#10b981', '#ef4444'])[1 + floor(random() * 5)::int]
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles);
