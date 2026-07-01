/*
-- Migration: Create merchants table
-- Description: Creates the identity layer table for multiple real merchants/sellers.

CREATE TABLE IF NOT EXISTS merchants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number TEXT UNIQUE NOT NULL,
    business_name TEXT,
    language_pref TEXT DEFAULT 'hinglish',
    status TEXT DEFAULT 'onboarding',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
*/

-- Actual executable SQL for dashboard copy-paste:
CREATE TABLE IF NOT EXISTS merchants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number TEXT UNIQUE NOT NULL,
    business_name TEXT,
    language_pref TEXT DEFAULT 'hinglish',
    status TEXT DEFAULT 'onboarding',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
