-- ====================================================================
-- MedSphere Connect: Supabase Auth Hook & Automatic Profile Provisioning
-- Description: Automatically provisions profiles and patient sovereign records
--              whenever a new user is created in auth.users.
-- ====================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  assigned_role public.user_role;
  user_full_name TEXT;
  user_phone TEXT;
  new_patient_code VARCHAR(20);
BEGIN
  -- 1. Extract role from app_metadata (secure) or fallback to user_metadata or default to 'patient'
  assigned_role := COALESCE(
    NULLIF(NEW.raw_app_meta_data->>'role', '')::public.user_role,
    NULLIF(NEW.raw_user_meta_data->>'role', '')::public.user_role,
    'patient'::public.user_role
  );

  -- 2. Extract profile attributes
  user_full_name := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
    NULLIF(NEW.raw_user_meta_data->>'name', ''),
    split_part(NEW.email, '@', 1)
  );
  
  user_phone := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'phone', ''),
    NEW.phone
  );

  -- 3. Upsert user profile into public.profiles
  INSERT INTO public.profiles (
    id,
    user_id,
    email,
    phone,
    full_name,
    role,
    avatar_url,
    mfa_enabled
  )
  VALUES (
    NEW.id,
    NEW.id,
    NEW.email,
    user_phone,
    user_full_name,
    assigned_role,
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE((NEW.raw_app_meta_data->>'mfa_enabled')::boolean, FALSE)
  )
  ON CONFLICT (id) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    updated_at = NOW();

  -- 4. If new user is a patient, automatically provision sovereign patient record
  IF assigned_role = 'patient' THEN
    -- Generate non-sequential patient code MSC-P-[6 hex digits]
    new_patient_code := 'MSC-P-' || UPPER(SUBSTRING(MD5(NEW.id::text || NOW()::text) FROM 1 FOR 6));

    INSERT INTO public.patients (
      profile_id,
      patient_code,
      dob,
      gender,
      blood_group,
      allergies,
      chronic_conditions,
      address_line,
      city,
      locality,
      pincode,
      emergency_contact_name,
      emergency_contact_phone
    )
    VALUES (
      NEW.id,
      new_patient_code,
      COALESCE(NULLIF(NEW.raw_user_meta_data->>'dob', '')::date, '1995-01-01'::date),
      COALESCE(NEW.raw_user_meta_data->>'gender', 'Female'),
      COALESCE(NEW.raw_user_meta_data->>'blood_group', 'B+'),
      COALESCE(
        ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'allergies')),
        ARRAY[]::TEXT[]
      ),
      COALESCE(
        ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'chronic_conditions')),
        ARRAY[]::TEXT[]
      ),
      NEW.raw_user_meta_data->>'address_line',
      COALESCE(NEW.raw_user_meta_data->>'city', 'New Delhi'),
      NEW.raw_user_meta_data->>'locality',
      COALESCE(NEW.raw_user_meta_data->>'pincode', '110017'),
      NEW.raw_user_meta_data->>'emergency_contact_name',
      NEW.raw_user_meta_data->>'emergency_contact_phone'
    )
    ON CONFLICT (profile_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Attach trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

