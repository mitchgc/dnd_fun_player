-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Core character data table
CREATE TABLE IF NOT EXISTS public.characters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  race TEXT NOT NULL,
  character_class TEXT NOT NULL,
  level INTEGER DEFAULT 1 CHECK (level >= 1 AND level <= 20),
  ability_scores JSONB NOT NULL DEFAULT '{
    "strength": 10,
    "dexterity": 10,
    "constitution": 10,
    "intelligence": 10,
    "wisdom": 10,
    "charisma": 10
  }'::jsonb,
  current_hp INTEGER NOT NULL,
  max_hp INTEGER NOT NULL,
  temp_hp INTEGER DEFAULT 0,
  armor_class INTEGER NOT NULL DEFAULT 10,
  initiative_bonus INTEGER DEFAULT 0,
  speed INTEGER DEFAULT 30,
  is_hidden BOOLEAN DEFAULT false,
  conditions JSONB DEFAULT '[]'::jsonb,
  last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dynamic equipment/weapons table
CREATE TABLE IF NOT EXISTS public.character_weapons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  character_id UUID REFERENCES public.characters(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  weapon_data JSONB NOT NULL,
  is_equipped BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Class features and abilities table
CREATE TABLE IF NOT EXISTS public.character_abilities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  character_id UUID REFERENCES public.characters(id) ON DELETE CASCADE NOT NULL,
  ability_name TEXT NOT NULL,
  ability_type TEXT NOT NULL CHECK (ability_type IN ('action', 'bonus_action', 'reaction', 'passive')),
  ability_data JSONB NOT NULL,
  uses_remaining INTEGER,
  max_uses INTEGER,
  recharge_type TEXT CHECK (recharge_type IN ('short_rest', 'long_rest', 'turn', 'encounter')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Session management table
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  active_character_id UUID REFERENCES public.characters(id) ON DELETE SET NULL,
  party_members UUID[] DEFAULT ARRAY[]::UUID[],
  session_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Character resources tracking
CREATE TABLE IF NOT EXISTS public.character_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  character_id UUID REFERENCES public.characters(id) ON DELETE CASCADE NOT NULL,
  resource_name TEXT NOT NULL,
  current_value INTEGER NOT NULL DEFAULT 0,
  max_value INTEGER NOT NULL,
  resource_type TEXT CHECK (resource_type IN ('spell_slot', 'ki_point', 'sorcery_point', 'rage', 'superiority_die', 'custom')),
  level INTEGER, -- For spell slots
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(character_id, resource_name, level)
);

-- Create indexes for performance
CREATE INDEX idx_characters_user_id ON public.characters(user_id);
CREATE INDEX idx_character_weapons_character_id ON public.character_weapons(character_id);
CREATE INDEX idx_character_abilities_character_id ON public.character_abilities(character_id);
CREATE INDEX idx_character_resources_character_id ON public.character_resources(character_id);
CREATE INDEX idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX idx_sessions_active_character ON public.sessions(active_character_id);
CREATE INDEX idx_characters_last_accessed ON public.characters(last_accessed DESC);

-- Enable Row Level Security
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_weapons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_abilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_resources ENABLE ROW LEVEL SECURITY;

-- RLS Policies for characters
CREATE POLICY "Users can view own characters"
  ON public.characters
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own characters"
  ON public.characters
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own characters"
  ON public.characters
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own characters"
  ON public.characters
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for character_weapons
CREATE POLICY "Users can manage weapons of own characters"
  ON public.character_weapons
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.characters
      WHERE characters.id = character_weapons.character_id
      AND characters.user_id = auth.uid()
    )
  );

-- RLS Policies for character_abilities
CREATE POLICY "Users can manage abilities of own characters"
  ON public.character_abilities
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.characters
      WHERE characters.id = character_abilities.character_id
      AND characters.user_id = auth.uid()
    )
  );

-- RLS Policies for character_resources
CREATE POLICY "Users can manage resources of own characters"
  ON public.character_resources
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.characters
      WHERE characters.id = character_resources.character_id
      AND characters.user_id = auth.uid()
    )
  );

-- RLS Policies for sessions
CREATE POLICY "Users can view own sessions"
  ON public.sessions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own sessions"
  ON public.sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own sessions"
  ON public.sessions
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own sessions"
  ON public.sessions
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Helper function to check character ownership
CREATE OR REPLACE FUNCTION public.owns_character(char_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.characters 
    WHERE id = char_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_characters_updated_at
  BEFORE UPDATE ON public.characters
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON public.sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to update last_accessed when character is used
CREATE OR REPLACE FUNCTION public.update_character_last_accessed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.active_character_id IS NOT NULL AND NEW.active_character_id != OLD.active_character_id THEN
    UPDATE public.characters
    SET last_accessed = NOW()
    WHERE id = NEW.active_character_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_character_last_accessed_trigger
  AFTER UPDATE ON public.sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_character_last_accessed();