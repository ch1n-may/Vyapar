-- 1. Merchants Identity Table
CREATE TABLE IF NOT EXISTS merchants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number TEXT UNIQUE NOT NULL,
    business_name TEXT,
    language_pref TEXT DEFAULT 'hinglish',
    status TEXT DEFAULT 'onboarding',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY, -- OD-xxxxx
    merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
    platform TEXT NOT NULL, -- Amazon, Flipkart, Meesho
    product TEXT NOT NULL,
    amount TEXT NOT NULL, -- e.g. "₹2,499"
    status TEXT NOT NULL, -- Delivered, RTO risk, Return, Processing, etc.
    date TEXT NOT NULL DEFAULT to_char(now(), 'DD Month YYYY'),
    rto_risk TEXT NOT NULL DEFAULT 'Low', -- Low, Medium, High
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Products Table
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY DEFAULT 'P-' || substring(md5(random()::text) from 1 for 6),
    merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sku TEXT UNIQUE NOT NULL,
    stock INTEGER DEFAULT 0,
    price TEXT NOT NULL, -- e.g. "₹1,200"
    platforms TEXT[] DEFAULT '{}', -- array of connected platforms
    status TEXT DEFAULT 'Active', -- Active, Draft, Archived
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Alerts Table
CREATE TABLE IF NOT EXISTS alerts (
    id SERIAL PRIMARY KEY,
    merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- rto, stock, price
    message TEXT NOT NULL,
    cta_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. Approvals Table
CREATE TABLE IF NOT EXISTS approvals (
    id TEXT PRIMARY KEY, -- A-xxx
    merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- dispute, stock, price
    title TEXT NOT NULL,
    detail TEXT NOT NULL,
    status TEXT DEFAULT 'Pending', -- Pending, Approved, Rejected
    required_role TEXT DEFAULT 'Owner',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6. Reconciliation Logs Table
CREATE TABLE IF NOT EXISTS recon_logs (
    id SERIAL PRIMARY KEY,
    merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
    order_id TEXT NOT NULL,
    platform TEXT NOT NULL,
    price NUMERIC NOT NULL,
    actual_commission NUMERIC DEFAULT 0,
    expected_commission NUMERIC DEFAULT 0,
    actual_shipping NUMERIC DEFAULT 0,
    expected_shipping NUMERIC DEFAULT 0,
    discrepancy NUMERIC DEFAULT 0,
    status TEXT NOT NULL, -- Discrepancy, Matched
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

