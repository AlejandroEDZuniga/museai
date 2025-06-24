# MuseAI – Intelligent Art Discovery Platform

MuseAI is a beautifully designed AI-powered art companion built with **Next.js** and **Supabase**. It enables users to upload artworks, receive intelligent descriptions, listen to audio guides via ElevenLabs, and engage in contextual chat powered by OpenAI.

---

## ✨ Features

* 🎨 Upload and scan artworks with automatic description
* 🧠 GPT-powered intelligent analysis and conversation
* 🔊 Audio narration with ElevenLabs
* 🔐 Email/password and magic link authentication (via Supabase Auth)
* 🖼️ Secure media storage using Supabase Buckets (RLS-protected)

---

## 🧪 Technologies Used

* [Next.js](https://nextjs.org/) (App Router)
* [Supabase](https://supabase.com/) (Auth, Database, Storage)
* [OpenAI](https://openai.com/) API
* [ElevenLabs](https://www.elevenlabs.io/) API
* [Tailwind CSS](https://tailwindcss.com/) for styling
* [Framer Motion](https://www.framer.com/motion/) for animations

---

## 🚀 Getting Started

### 1. Clone the Repo

```bash
git clone https://github.com/your-username/museai.git
cd museai
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Copy the example env file and fill in your values:

```bash
cp .env.example .env.local
```

Then edit `.env.local` with your actual API keys:

```env
# 🔐 ENVIRONMENT CONFIGURATION
# Copy this file to `.env.local` and fill in the actual values for your environment.
# Never commit `.env.local` to version control.

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI Configuration
OPENAI_API_KEY=your-openai-key

# ElevenLabs Configuration
ELEVENLABS_API_KEY=your-elevenlabs-key

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Start the Dev Server

```bash
npm run dev
```

Open your browser at [http://localhost:3000](http://localhost:3000)

---

## 🧾 Supabase SQL Configuration (One-time setup)

Before running the SQL setup below, make sure you:

1. 🧱 [Create a new Supabase project](https://app.supabase.com/).
2. 🔑 Go to **Project Settings → API** and copy:

   * `SUPABASE_URL`
   * `SUPABASE_ANON_KEY`
   * `SERVICE_ROLE_KEY` (for server-side usage if needed)
3. 📦 Enable **Storage** and create a bucket named `artworks`.
4. 🛡️ Go to **Auth → Policies**, and enable **Email Auth** (disable phone if unused).
5. 🧪 Open the **SQL Editor** in Supabase and run the script below.

Run the following SQL statements in Supabase SQL Editor:

```sql
-- Enable UUID support
create extension if not exists "pgcrypto";

-- SCANS table
create table if not exists public.scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  image_url text not null,
  title text not null,
  description text not null,
  audio_url text,
  location text,
  language text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- CHAT_MESSAGES table
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references public.scans(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  message text not null,
  response text not null,
  audio_url text,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.scans enable row level security;
alter table public.chat_messages enable row level security;

-- SCANS policies
drop policy if exists "Allow INSERT if user_id matches auth uid" on public.scans;
drop policy if exists "Allow SELECT if user_id matches auth uid" on public.scans;
drop policy if exists "Allow UPDATE if user_id matches auth uid" on public.scans;

create policy "Allow INSERT if user_id matches auth uid"
  on public.scans for insert
  with check (auth.uid() = user_id);

create policy "Allow SELECT if user_id matches auth uid"
  on public.scans for select
  using (auth.uid() = user_id);

create policy "Allow UPDATE if user_id matches auth uid"
  on public.scans for update
  using (auth.uid() = user_id);

-- CHAT_MESSAGES policies
create policy "Allow INSERT if user_id matches auth uid"
  on public.chat_messages for insert
  with check (auth.uid() = user_id);

create policy "Allow SELECT if user_id matches auth uid"
  on public.chat_messages for select
  using (auth.uid() = user_id);

create policy "Allow UPDATE if user_id matches auth uid"
  on public.chat_messages for update
  using (auth.uid() = user_id);

-- Allow uploads to 'artworks' bucket
create policy "Allow uploads for authenticated users"
  on storage.objects for insert
  with check (bucket_id = 'artworks' AND auth.role() = 'authenticated');


## 📬 License

This project is open-source and available under the MIT License.

---

## 💬 Contact

For issues, open a GitHub issue or reach out at alejandroedzuniga@gmail.com

---

Enjoy your AI-powered museum experience with MuseAI! ✨
