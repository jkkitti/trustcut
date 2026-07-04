# TrustCut

TrustCut is a Next.js web app for salon and barber owners to verify hairdresser history, competency, aptitude, behavior scores, comments, and style updates before hiring.

## Stack

- React + Next.js App Router
- Tailwind CSS
- Supabase Auth, Postgres, RLS-ready schema
- Google OAuth and email magic link
- GPS geofence verification API
- Vercel deployment-ready

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Without Supabase env values, the app runs with demo data and demo GPS policy. Add real values to `.env.local` when ready.

## Environment

Copy `.env.example` to `.env.local`.

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
TRUSTCUT_ALLOWED_GEOFENCES=[{"name":"Sukhumvit Cut Lab","lat":13.736717,"lng":100.560067,"radiusMeters":150}]
```

`TRUSTCUT_ALLOWED_GEOFENCES` is enforced by `/api/geo/verify`. Omit it only for local demo mode.

## Supabase Setup

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the Supabase SQL editor.
3. Optional: run `supabase/seed.sql` to load mock hairdressers, comments, style posts, PDPA consent records, and usage events.
4. In Google Cloud Console, create an OAuth 2.0 Client ID for a web app.
5. In Google Cloud Console, add authorized JavaScript origins:
   - `http://localhost:3000`
   - `https://your-vercel-domain.vercel.app`
6. Add this Google authorized redirect URI:
   - `https://YOUR_SUPABASE_PROJECT_REF.supabase.co/auth/v1/callback`
7. In Supabase Auth providers, enable Google and paste the Google Client ID and Client Secret.
8. In Supabase Auth URL configuration, set the Site URL and add redirect URLs:
   - `http://localhost:3000`
   - `https://your-vercel-domain.vercel.app`
   - `http://localhost:3000/auth/callback`
   - `https://your-vercel-domain.vercel.app/auth/callback`
9. For Vercel preview deployments, add a wildcard redirect URL only if you use preview links:
   - `https://*.vercel.app/auth/callback`
10. Add environment variables to `.env.local` and Vercel.

## Vercel OAuth Checklist

If Google OAuth works locally but not on Vercel, verify these production settings:

- Vercel Environment Variables include `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` for Production, then redeploy.
- Supabase Authentication > URL Configuration uses your production Vercel URL as the Site URL.
- Supabase Redirect URLs include the exact callback URL: `https://your-vercel-domain.vercel.app/auth/callback`.
- Google Cloud Console Authorized JavaScript origins include your Vercel origin: `https://your-vercel-domain.vercel.app`.
- Google Cloud Console Authorized redirect URIs include the Supabase callback URL, not your app callback URL: `https://YOUR_SUPABASE_PROJECT_REF.supabase.co/auth/v1/callback`.
- If you switch to a custom domain, add that custom domain in both Supabase Redirect URLs and Google JavaScript origins.

## Google OAuth Flow

- The owner clicks `Continue with Google`.
- Supabase redirects to Google and then back to `/auth/callback`.
- `/auth/callback` exchanges the OAuth code for a Supabase session.
- `src/proxy.ts` refreshes the Supabase session cookies during navigation.
- The app unlocks protected data only after Google OAuth, PDPA consent, and GPS verification are all complete.
- If `SUPABASE_SERVICE_ROLE_KEY` is set, the callback creates a pending `profiles` row for new Google users so admins can approve them later.

## App Areas

- Owner frontend: protected candidate search, full profile, masked TrustCut ID, contact details, ID photo, radar charts, comments, and hairstyle feed.
- Admin console: member CRUD state, usage statistics, and comment approval queue.
- Database: Supabase schema with RLS policies for members, admins, comments, style posts, PDPA consent, and usage events.
