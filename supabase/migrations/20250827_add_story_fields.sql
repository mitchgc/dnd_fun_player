-- Add story-related fields to the dnd_characters table
ALTER TABLE dnd_characters 
ADD COLUMN IF NOT EXISTS background TEXT,
ADD COLUMN IF NOT EXISTS backstory TEXT,
ADD COLUMN IF NOT EXISTS personality_traits TEXT,
ADD COLUMN IF NOT EXISTS ideals TEXT,
ADD COLUMN IF NOT EXISTS bonds TEXT,
ADD COLUMN IF NOT EXISTS flaws TEXT,
ADD COLUMN IF NOT EXISTS motives TEXT,
ADD COLUMN IF NOT EXISTS profile_image TEXT;

-- Add index for faster story data queries (optional, but good for performance)
CREATE INDEX IF NOT EXISTS idx_dnd_characters_story_data 
ON dnd_characters(name, background) 
WHERE background IS NOT NULL;

-- Update the existing characters with some sample story data if needed
-- (This is optional - could be done later through the UI)

-- Add comment for documentation
COMMENT ON COLUMN dnd_characters.background IS 'Character background (e.g., Acolyte, Criminal, etc.)';
COMMENT ON COLUMN dnd_characters.backstory IS 'Character backstory and history';
COMMENT ON COLUMN dnd_characters.personality_traits IS 'Character personality traits';
COMMENT ON COLUMN dnd_characters.ideals IS 'Character ideals and principles';
COMMENT ON COLUMN dnd_characters.bonds IS 'Character bonds and connections';
COMMENT ON COLUMN dnd_characters.flaws IS 'Character flaws and weaknesses';
COMMENT ON COLUMN dnd_characters.motives IS 'Character goals and motivations';
COMMENT ON COLUMN dnd_characters.profile_image IS 'Character profile image URL or base64 data';