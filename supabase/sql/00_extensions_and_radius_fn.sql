-- ============================================================================
-- RECLAIM Marketplace: Location-based Radius Filtering
-- ============================================================================
-- This SQL file sets up PostGIS extensions and creates a function to filter
-- listings by radius distance from user's location.
--
-- Run this in Supabase SQL Editor ONCE before using radius filtering.
-- ============================================================================

-- Step 1: Enable PostGIS extension for geospatial calculations
-- PostGIS provides distance calculation functions like ST_Distance
CREATE EXTENSION IF NOT EXISTS postgis;

-- Step 2: Add latitude and longitude columns to listings table (if they don't exist)
-- These will store the location of each listing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'listings'
    AND column_name = 'latitude'
  ) THEN
    ALTER TABLE public.listings ADD COLUMN latitude double precision;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'listings'
    AND column_name = 'longitude'
  ) THEN
    ALTER TABLE public.listings ADD COLUMN longitude double precision;
  END IF;
END $$;

-- Step 3: Add persisted geography column for efficient spatial indexing
-- This is the RECOMMENDED approach - stores the geography directly on the table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'listings'
    AND column_name = 'location_geog'
  ) THEN
    ALTER TABLE public.listings ADD COLUMN location_geog geography(Point, 4326);
  END IF;
END $$;

-- Step 4: Populate the geography column for existing rows
UPDATE public.listings
SET location_geog = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
WHERE latitude IS NOT NULL
  AND longitude IS NOT NULL
  AND location_geog IS NULL;

-- Step 5: Create trigger to automatically maintain location_geog on INSERT/UPDATE
-- This ensures location_geog stays in sync with latitude/longitude
CREATE OR REPLACE FUNCTION public.listings_location_geog_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.location_geog := CASE
    WHEN NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL
    THEN ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography
    ELSE NULL
  END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS listings_location_geog_trig ON public.listings;
CREATE TRIGGER listings_location_geog_trig
BEFORE INSERT OR UPDATE ON public.listings
FOR EACH ROW EXECUTE FUNCTION public.listings_location_geog_trigger();

-- Step 6: Create GiST spatial index on the geography column
-- This is MUCH faster than indexing an expression
CREATE INDEX IF NOT EXISTS listings_location_geog_idx
ON public.listings USING GIST (location_geog);

-- Step 7: Create RPC function for radius filtering
-- This function returns listings within a specified radius (in miles) from user's location
--
-- Parameters:
--   user_lat: User's latitude
--   user_lng: User's longitude
--   radius_miles: Search radius in miles
--   category_filter: Optional category to filter by (NULL = all categories)
--
-- Returns: All listing columns plus distance_miles
CREATE OR REPLACE FUNCTION public.filter_by_radius(
  user_lat double precision,
  user_lng double precision,
  radius_miles double precision,
  category_filter text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  title text,
  description text,
  category text,
  price numeric,
  image_urls text[],
  created_at timestamp with time zone,
  condition text,
  features text[],
  brand text,
  color text,
  size text,
  material text,
  latitude double precision,
  longitude double precision,
  distance_miles double precision
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id,
    l.user_id,
    l.title,
    l.description,
    l.category,
    l.price,
    l.image_urls,
    l.created_at,
    l.condition,
    l.features,
    l.brand,
    l.color,
    l.size,
    l.material,
    l.latitude,
    l.longitude,
    -- Calculate distance in miles using ST_Distance (returns meters)
    -- Now using the persisted location_geog column for better performance
    CAST(
      ST_Distance(
        ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
        l.location_geog  -- Using persisted geography column
      ) * 0.000621371 AS double precision  -- Convert meters to miles
    ) AS distance_miles
  FROM public.listings l
  WHERE
    -- Only include listings that have location data
    l.location_geog IS NOT NULL
    -- Filter by radius (convert miles to meters for ST_DWithin)
    -- Using persisted geography column for indexed query
    AND ST_DWithin(
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
      l.location_geog,  -- Using persisted geography column
      radius_miles * 1609.34  -- Convert miles to meters
    )
    -- Optional category filter
    AND (category_filter IS NULL OR l.category = category_filter)
  ORDER BY distance_miles ASC;  -- Return closest listings first
END;
$$;

-- Step 8: Grant execute permission on the function
-- This allows authenticated users to call the function
GRANT EXECUTE ON FUNCTION public.filter_by_radius(double precision, double precision, double precision, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.filter_by_radius(double precision, double precision, double precision, text) TO anon;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify everything is set up correctly:

-- 1. Check if PostGIS extension is enabled
-- SELECT * FROM pg_extension WHERE extname = 'postgis';

-- 2. Check if latitude/longitude columns exist
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'listings' AND column_name IN ('latitude', 'longitude', 'location_geog');

-- 3. Check if spatial index exists
-- SELECT indexname FROM pg_indexes WHERE tablename = 'listings' AND indexname = 'listings_location_geog_idx';

-- 4. Check if trigger exists
-- SELECT trigger_name FROM information_schema.triggers
-- WHERE event_object_table = 'listings' AND trigger_name = 'listings_location_geog_trig';

-- 5. Test the radius function (example: 10 miles from NYC)
-- SELECT id, title, distance_miles FROM public.filter_by_radius(40.7128, -74.0060, 10, NULL);

-- 6. Verify location_geog is populated
-- SELECT COUNT(*) FROM public.listings WHERE location_geog IS NOT NULL;

-- ============================================================================
-- SAMPLE DATA (for testing)
-- ============================================================================
-- Uncomment and run this to add test location data to existing listings:
--
-- UPDATE public.listings
-- SET
--   latitude = 40.7128 + (random() * 0.5 - 0.25),  -- Random lat near NYC
--   longitude = -74.0060 + (random() * 0.5 - 0.25) -- Random lng near NYC
-- WHERE latitude IS NULL;
--
-- Note: The trigger will automatically populate location_geog when you update lat/lng

-- ============================================================================
-- MIGRATION NOTES
-- ============================================================================
--
-- Changes from original version:
-- 1. Added persisted `location_geog` geography column (RECOMMENDED approach)
-- 2. Added trigger to automatically maintain location_geog
-- 3. Changed index to use location_geog column (fixes :: cast error)
-- 4. Updated filter_by_radius function to use location_geog
-- 5. Much better performance - indexed column vs computed expression
--
-- Why this is better:
-- - Avoids ":: cast not allowed in index" error
-- - Faster queries (indexed column vs expression)
-- - Geography computed once per row, not per query
-- - Trigger keeps it in sync automatically
