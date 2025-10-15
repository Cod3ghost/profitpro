# Supabase Migration Setup

## Step 1: Get Supabase Credentials

1. Go to https://supabase.com and sign in
2. Create a new project (or use existing)
3. Go to Project Settings → API
4. Copy these values:
   - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
   - **anon public key**: `eyJhbG...` (long JWT token)
   - **service_role key**: `eyJhbG...` (long JWT token - keep this secret!)

## Step 2: Add to Environment Variables

Add these to your `.env.local` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="your-project-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

## Step 3: Database Schema

Run these SQL commands in Supabase SQL Editor (Dashboard → SQL Editor):

### 1. Enable UUID Extension
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### 2. Create Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'agent')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Admins can see all users
CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'admin'
    )
  );

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);
```

### 3. Create Products Table
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  cost_price DECIMAL(10,2) NOT NULL,
  selling_price DECIMAL(10,2) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  image_hint TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read products
CREATE POLICY "Authenticated users can view products"
  ON products FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only admins can modify products
CREATE POLICY "Admins can manage products"
  ON products FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'admin'
    )
  );
```

### 4. Create Sales Table
```sql
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  total_revenue DECIMAL(10,2) NOT NULL,
  total_cost DECIMAL(10,2) NOT NULL,
  profit DECIMAL(10,2) NOT NULL,
  sales_agent_id UUID REFERENCES users(id) ON DELETE CASCADE,
  sale_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- Users can only see their own sales
CREATE POLICY "Users can view own sales"
  ON sales FOR SELECT
  USING (auth.uid() = sales_agent_id);

-- Users can only create their own sales
CREATE POLICY "Users can create own sales"
  ON sales FOR INSERT
  WITH CHECK (auth.uid() = sales_agent_id);

-- Admins can see all sales
CREATE POLICY "Admins can view all sales"
  ON sales FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'admin'
    )
  );
```

### 5. Create Indexes for Performance
```sql
CREATE INDEX idx_sales_agent ON sales(sales_agent_id);
CREATE INDEX idx_sales_date ON sales(sale_date);
CREATE INDEX idx_sales_product ON sales(product_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);
```

## Step 4: Set Up Auth

In Supabase Dashboard → Authentication → Providers:
- Enable Email provider
- Optionally configure email templates

## Next Steps

After completing the above, run the setup script to configure your local environment.
