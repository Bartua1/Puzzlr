# Master Agent Instructions: Daily Puzzle League

You are the primary AI software engineer for this project. You must strictly adhere to the technical architecture, legal guardrails, and feature rules defined below.

---

## 1. Legal & Intellectual Property Guardrails
To prevent trademark infringement, you must enforce these rules in all UI generation, code, and text copy:

*   **No Trademarked Names in UI:** Never display names like "Wordle", "LinkedIn", "Queens", or "Connections" in headers, buttons, or metadata. Always use generic equivalents:
    *   *Wordle* ➔ "Daily Word Grid" or "5-Letter Word Game"
    *   *Connections* ➔ "Group Categorization Game"
    *   *Queens* ➔ "Queen's Grid" or "Chess Puzzle"
*   **External Browser Only:** Do not render games inside an `iframe` or `webview`. Open all third-party game links in the native system browser via the `@capacitor/browser` plugin [2.1.5].
*   **Safe Parsing:** The backend can parse copied score formats (e.g., `"Wordle 123"`) to categorize them, but the frontend must only display them under generic game names.
*   **No UI Cloning:** Do not visually clone official game layouts, fonts, or trademarked assets.
*   **Mandatory Disclaimer:** Ensure this footer disclaimer is visible on the Login screen, main dashboard, and Settings:
    > *"Unofficial score-tracking utility. Not affiliated with, sponsored by, or endorsed by The New York Times Company, LinkedIn, or any third-party game publisher."*

---

## 2. Tech Stack & Directory Structure
*   **Frontend:** React (Vite) + Tailwind CSS (Responsive mobile-first)
*   **Mobile Engine:** Capacitor (iOS & Android)
*   **Backend:** Supabase (Database, Auth, Row Level Security)

```text
├── src/
│   ├── components/       # UI (AvatarViewer, ClipboardAutoSubmitter, CreateGroupModal, DisclaimerFooter, GameCardView, Logo, Splash)
│   ├── hooks/            # useAuth, useDailyScores, useGroups, useNotifications, useShop
│   ├── pages/            # Login, Dashboard, GroupDetails, GroupSettings, GroupStats, ManageGames, Settings, Shop
│   ├── services/         # supabase.ts (client), parser.ts (Regex parser for clipboard results)
│   ├── utils/            # haptics.ts (wrapper for capacitor haptics)
│   ├── App.tsx           # Router & auth layout wrapper
│   ├── i18n.ts           # Internationalization config (En/Es translations)
│   └── main.tsx          # App entry
```

---

## 3. Database Schema (Supabase)

```sql
-- 1. Profiles (Linked to Supabase Auth, handles customization, streaks, and currency)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  language TEXT DEFAULT 'en' NOT NULL,
  lifetime_points INTEGER DEFAULT 0 NOT NULL,
  spendable_points INTEGER DEFAULT 0 NOT NULL,
  equipped_character_id UUID REFERENCES cosmetics(id) ON DELETE SET NULL, -- Deprecated/set to NULL
  equipped_badge_id UUID REFERENCES cosmetics(id) ON DELETE SET NULL,
  streak_count INTEGER DEFAULT 0 NOT NULL,
  last_played_date DATE,
  streak_protectors INTEGER DEFAULT 0 NOT NULL,
  is_admin BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Cosmetics Shop (Only type = 'badge' is currently active/used)
CREATE TABLE cosmetics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('badge', 'character', 'costume')),
  price INTEGER NOT NULL,
  asset_key TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL
);

-- 3. User Unlocked Cosmetics
CREATE TABLE user_cosmetics (
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  cosmetic_id UUID REFERENCES cosmetics(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (profile_id, cosmetic_id)
);

-- 4. Games Configuration
CREATE TABLE games (
  id TEXT PRIMARY KEY, -- e.g., 'word_grid', 'word_group', 'chess_grid', 'la_palabra', 'wordle_es'
  display_name TEXT NOT NULL,
  reset_time_utc TIME NOT NULL, -- Defines daily reset schedule (defaults to 08:00:00 UTC)
  base_points INTEGER DEFAULT 10 NOT NULL
);

-- 5. Groups (Leagues)
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_by UUID REFERENCES profiles(id),
  invite_code TEXT UNIQUE NOT NULL,
  image_url TEXT,
  invite_code_expires_at TIMESTAMP WITH TIME ZONE DEFAULT (timezone('utc'::text, now()) + interval '7 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Group Members
CREATE TABLE group_members (
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  is_muted BOOLEAN DEFAULT false NOT NULL,
  PRIMARY KEY (group_id, profile_id)
);

-- 7. Seasons
CREATE TABLE seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL
);

-- 8. Daily Scores
CREATE TABLE daily_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  game_id TEXT REFERENCES games(id) ON DELETE CASCADE,
  raw_text TEXT NOT NULL,
  score INTEGER NOT NULL,
  max_score INTEGER NOT NULL,
  solved_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_user_game_date UNIQUE (profile_id, game_id, solved_date)
);

-- 9. Group Season Standings
CREATE TABLE group_season_points (
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  season_id UUID REFERENCES seasons(id) ON DELETE CASCADE,
  points INTEGER DEFAULT 0 NOT NULL,
  PRIMARY KEY (group_id, profile_id, season_id)
);

-- 10. Group Active Games
CREATE TABLE group_games (
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  game_id TEXT REFERENCES games(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (group_id, game_id)
);

-- 11. Group Chat Messages (Chat & game completion notifications)
CREATE TABLE group_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  message_type TEXT NOT NULL CHECK (message_type IN ('user', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. Streak Freezes (Track days on which a user's streak was protected)
CREATE TABLE streak_freezes (
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  freeze_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (profile_id, freeze_date)
);
```

---

## 4. Key Logic & Flows to Implement

### A. Point Distribution & Streak Transaction (Supabase Function)
When a valid score is submitted via `submit_daily_score_rpc`, you must run a single transactional SQL function to ensure data consistency:
1.  Verify that `solved_date` is valid and the user hasn't already submitted a score for that game today.
2.  Award 15 flat points to `profiles.lifetime_points` and `profiles.spendable_points`.
3.  Calculate and update the user's consecutive play streak:
    *   **New Streak / Consecutiveness:** If it is the user's first game or consecutive (1 day difference), increment `streak_count` and update `last_played_date`.
    *   **Streak Protection:** If the user missed one or more days, check if they have enough `streak_protectors`. If yes, deduct the protectors, increment the streak, log the freeze dates in `streak_freezes`, and keep the streak alive. If no, reset `streak_count` to 1.
4.  Construct game completion messages as a JSON string payload (e.g. including guesses/time/score) and insert them as `system` messages into `group_messages` (if the game is active in that group).
5.  Identify all of the user's active group `seasons` and increment points in `group_season_points` for each season.

### B. Purchase Transaction (Supabase Function)
When buying a cosmetic item from the shop via `purchase_cosmetic_rpc`:
1.  Read `cosmetics.price` and verify the buyer has enough `spendable_points` in their `profiles` row.
2.  Deduct the price from `spendable_points`.
3.  Insert a row linking the user and the item in `user_cosmetics`.

### C. Game Reset Countdown Flow
*   Query the `games` table to fetch each game's `reset_time_utc`.
*   On the UI, construct a countdown clock showing the remaining time until the next puzzle window starts.
*   Disable the "Paste Score" button for that specific game category if a row for `(profile_id, game_id, current_solved_date)` already exists.

### D. Admin Operations (Supabase Functions)
*   **Admin Purchase (`admin_purchase_cosmetic_rpc`):** Allows users with `profiles.is_admin = true` to unlock any active cosmetic for free (skipping point deduction).
*   **Admin Inventory Reset (`admin_reset_inventory_rpc`):** Allows admins to reset their cosmetic inventory, clearing unlocked user cosmetics and un-equipping items.

---

## 5. Pre-Commit Checklist
Before finalizing code or DB migrations, verify:
*   [ ] No trademarked strings are output in UI code.
*   [ ] Mobile layouts incorporate CSS/Tailwind safe-area padding (`pt-[safe]`, `pb-[safe]`) [2.1.5].
*   [ ] Row-Level Security (RLS) is enabled on all tables.
*   [ ] Disclaimers are displayed clearly at the base of the viewport.

---

## 6. UI, UX, and Styling Guidelines

### A. Haptic Feedback System
You must import and use `@capacitor/haptics` (packaged in `src/utils/haptics.ts`) to provide subtle physical confirmation for user actions:
*   **Standard Clicks & Navigation:** Trigger `Haptics.impact({ style: ImpactStyle.Light })` on menu tabs, generic buttons, and toggles.
*   **Pasting/Score Submission:** Trigger `Haptics.notification({ type: NotificationType.Success })` upon a successful parsing match. Trigger `NotificationType.Error` if the clipboard string cannot be parsed.
*   **Shop Purchases:** Trigger a `Medium` impact or `Success` notification when points are successfully spent on items.
*   **Drag-and-Drop / List Reorders:** Trigger `Haptics.selectionChanged()` continuously while lists or positions are adjusted dynamically.

### B. Modern Minimalist UI & Card Reduction
*   **Reduce Container Clutter:** Avoid nesting multiple cards inside other cards. Instead of boxed cards with solid borders, use **whitespace, subtle dividing lines (`divide-y`), and varied font weights** to separate visual content.
*   **Flat Elevated Elements:** Rely on flat background panels with very soft rounded corners (`rounded-2xl` or `rounded-3xl`) and tiny, soft drop-shadows (e.g., `shadow-sm`) instead of high-contrast cards.
*   **Fluid Visual Transitions:** When state changes (e.g., score is submitted or cosmetic is equipped), animate elements using CSS transitions or standard UI animations. Avoid sudden jumps or layout shifts.

### C. Pastel Color Palette Reference
Use a friendly, low-stress, pastel-themed Tailwind color configuration:
*   **Main Backgrounds:** Very light neutrals (e.g., `bg-slate-50`, `bg-zinc-50`).
*   **Accents & Categories:** 
    *   *Mint Green (Success/Primary):* `bg-emerald-50 text-emerald-700 hover:bg-emerald-100`
    *   *Pale Yellow (Warning/Highlight):* `bg-amber-50 text-amber-700`
    *   *Soft Lavender (Badges/Rankings):* `bg-purple-50 text-purple-700`
    *   *Soft Sky Blue (Default buttons):* `bg-sky-50 text-sky-700`
*   **Dark Mode Contrast Compatibility:** If dark mode is supported, do not use absolute black. Use dark slate (`bg-slate-900`) and desaturated, high-contrast pastels (e.g., `#BBF7D0` text with dark backgrounds) to remain WCAG accessible.

### D. Character Shop UX
*   **Interactive Preview Panel:** Include a simple, clean playground area at the top of the shop page. 
*   **Instant Feedback:** Let users tap on un-purchased badges to "preview" them instantly on their profile/character base before confirming their spend points. Note that characters/costumes are deprecated and badges are the primary cosmetic item.

When sharing the result of a game, it should suggest this app as a sharing option.