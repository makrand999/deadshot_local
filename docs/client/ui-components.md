# Deadshot.io Client UI & Component Code Map

This document provides a comprehensive, structured reference mapping every major UI screen, component, dialog, button, and HUD element in the Deadshot.io client (`raw/bundles/VM9.deob.txt`, `gameplay/client/`).

---

## 1. UI Architecture Overview

Deadshot.io renders its UI using a hybrid canvas-over-WebGL architecture driven by Three.js scenes:

```
Three.js Render Hierarchy
 ├── Tm (Main 3D World Scene)
 ├── Mm (Main Menu / Lobby 2D Canvas Scene)
 │    ├── Kq.eglp (Top-Level Challenges Panel: Daily, Weekly, Event)
 │    ├── Party Lobby Cards (Member slots, Ready toggle, Party Code input)
 │    ├── User Profile & Clan Tag Display
 │    ├── Leaderboard / Stats Panel
 │    ├── Shop, Bundles & Lucky Wheel
 │    └── Inventory & Weapon Armory
 ├── Kq.nwxurZsxI (In-Match HUD 2D Canvas Scene)
 │    ├── a6D (Challenge Completed Popup Banner)
 │    ├── a6B (HUD Active Challenge Progress Bar)
 │    ├── Crosshair & Dynamic Spread Bloom
 │    ├── Health Bar & Ammo Counter
 │    ├── In-Game Chat Box
 │    └── Killfeed & Kill Banner
 └── T3 / T5 / T6 (3D World Space Projection Scenes)
      └── Floating Opponent Nametags & Health Bars
```

### 1.1 Core UI Widget Classes

The UI framework constructs visual nodes from the following internal classes:

| Class | Offset in VM9 | Role |
|---|---|---|
| `a3D` | `~2063k` | **Button Component**: Handles hover states, background rectangle, stroke outline, font rendering, and `onclick` callbacks. |
| `a3J` | `~2064k` | **Action / Claim Button**: Special prominent button with secondary price/coin icon (`Lw`) and reward text. |
| `a3k.object` | `~2061k` | **Container Node**: Lightweight display group holding children elements, positions, and opacity hierarchies. |
| `a3k.QtjDeukbWl` | `~2061k` | **Rectangle / Panel Node**: Solid or semi-transparent background fill (`x, y, width, height, color, opacity`). |
| `a3k.ycBClXLTJc` | `~2062k` | **Polygon / Ribbon Node**: Decorative polygon geometry used for badges, tabs, and arrows. |
| `a3k.image` | `~2061k` | **2D Sprite Node**: Renders textures (coins, weapon skins, badges, checkmarks). |
| `Mj(font, text, x, y, size, align)` | `~2061k` | **Text Generator**: Constructs canvas text objects with measurement, scaling, and alignment. |

---

## 2. Complete Step-by-Step UI Component Catalog

---

### Step 1: Main Menu & Lobby System

#### 1.1 Party & Matchmaking Panel
* **Root Object**: `Kq` (Party / Menu Controller at `~2246k`)
* **Party ID Input / Display**: `Kq.psUqMaJVeTK` (displays `"Party ID: <code>"`)
* **Party Member Slots**: `a5B` (Team 0 / Left slot), `a5C` (Team 1 / Right slot) at `~2255k`
* **Invite Slot Buttons**: `a61 = new a3D('+', ...)` (`VM9: ~2258k`), triggers `Kq.OObFmbNOgbm(true)` invite link generator.
* **Ready / Unready Button**: `N9 = new a3J('READY', ...)` (`VM9: ~2285k`), toggles `Kq.MjRyMiPQtOG` ready state and sends `ready`/`unready` msgpack packet.
* **Create Party Button**: `new a3D('Create', ...)` (`VM9: ~2286k`), sends `create` packet to matchmaker.
* **Join Party Button**: `new a3D('Join', ...)` (`VM9: ~2287k`), sends `join` packet with parsed room code.
* **Leave Party Button**: `new a3D('Leave', ...)` (`VM9: ~2285k`), leaves party room and resets slots.
* **Room Privacy Toggle**: `a7O = new a3D('Public', ...)` (`VM9: ~2287k`), toggles between `'Public'` and `'Private'` rooms.
* **Ranked Mode Toggle**: `new a3D('Ranked: On', ...)` (`VM9: ~2289k`).
* **Map / Mode Pool Selector**: `new a3D('Change Playlists', ...)` (`VM9: ~2290k`), opens map vote/selection dialog.
* **Kick Member Button**: `new a3D('KICK', ...)` (`VM9: ~2248k`), leader-only button on party member cards.
* **Switch Teams Button**: `new a3D('Switch Teams', ...)` (`VM9: ~2250k`), swaps slot between Team 0 and Team 1.
* **Share Party / Copy Link Button**: `new a3D('Copy Link', ...)` (`VM9: ~2250k`), copies invite URL to clipboard.

#### 1.2 Daily, Weekly & Event Challenges System
* **Lobby Panel Container**: `Kq.eglp` / `a6h` / `a6g` (`VM9: ~2261k`), attached to `Mm`.
* **Tab Switcher Buttons**: `a6i = ['Daily', 'Weekly']`, instantiated via `a6l = new a3D(...)` (`VM9: ~2261k`).
* **Challenge Card List**: `function a6M(challenges)` (`VM9: ~2268k`), renders title `"Daily Challenges:"` / `"Weekly Challenges:"`, `"Resets In: 0"` (`Ld`), progress bar, and completion badges.
* **Claim Bonus Button**: `a6m = new a3J('Claim Bonus', ...)` (`VM9: ~2262k`), sends `/claimDaily`, `/claimWeekly`, `/claimEvent`.

#### 1.3 Shop, Bundles & Spin Wheel
* **Lucky Spin Button**: `new a3J('Unlock Spin', ...)` (`VM9: ~2323k`), opens daily skin roulette wheel.
* **Bundle Preview Card**: `new a3J('View Bundle', ...)` (`VM9: ~2326k`), opens featured weapon bundle cards.
* **Buy Gems Store**: `new a3J('Buy Gems', ...)` (`VM9: ~2328k`), opens microtransaction gem purchasing modal.
* **Claim Weapon / Claim Bundle**: `new a3J('Claim Weapon', ...)`, `new a3J('Claim Bundle', ...)` (`VM9: ~2331k–2332k`).
* **Store Purchase Confirm**: `new a3J('Purchase', ...)` (`VM9: ~2338k`), executes sku purchase via `/claimSku`.
* **Store Navigation**: `new a3D('< Back', ...)` (`VM9: ~2334k`), closes store/bundle sub-views.

#### 1.4 Inventory & Armory Customization
* **Equip Skin**: `new a3D('Equip', ...)` (`VM9: ~2358k`), applies skin to active loadout and syncs via `msg 44`.
* **Inspect 3D Weapon**: `new a3D('Inspect', ...)` (`VM9: ~2359k`, `~2405k`), opens fullscreen 3D rotating weapon inspection view.
* **Quick Sell**: `new a3D('Sell - <coins>', ...)` (`VM9: ~2361k`), exchanges duplicate weapon skins for coins.
* **Trade Up Crafting**: `new a3J('Trade Up', ...)` (`VM9: ~2399k`, `~2400k`), combines lower-tier skins into higher rarities.

#### 1.5 User Profile, Clan & Authentication
* **Account Login / Auth**:
  * `new a3D('Log In', ...)` (`VM9: ~2291k`)
  * `new a3D('Sign in with Google', ...)` (`VM9: ~2292k`, `~2238k`)
  * `new a3D('Continue As Guest', ...)` (`VM9: ~2237k`)
  * `new a3D('Continue in browser', ...)` (`VM9: ~2239k`)
  * `new a3D('Account', ...)`, `new a3D('Sign Out', ...)` (`VM9: ~2416k`)
* **Profile Management Dialogs**:
  * `new a3D('Change Username', ...)` (`VM9: ~2353k`), opens username input modal (`css/username.css`).
  * `new a3D('Delete Account', ...)` (`VM9: ~2354k`), account deletion confirmation.
  * `new a3D('Change Clan Tag', ...)`, `new a3D('Remove Clan Tag', ...)` (`VM9: ~2357k`), updates player `[TAG]`.
* **Patch Notes**: `new a3D('Patch Notes', ...)` (`VM9: ~2418k`), displays recent update changelog.
* **Referral System**: `new a3D('Copy Referral Link', ...)` (`VM9: ~2402k`), copies personal affiliate link.
* **Rewarded Ads**: `new a3D('Free Gems', ...)` (`VM9: ~2276k`), triggers reward video ad flow.

---

### Step 2: In-Game HUD & Combat Overlays

#### 2.1 Crosshair & Weapon Scopes
* **Dynamic Crosshair (`Um`, `VM9: ~2540k`)**:
  * Procedural SVG/Canvas crosshair lines.
  * Dynamic spread bloom expands while sprinting, jumping, or firing.
  * Dot center toggle and custom color configuration.
* **AWP Sniper Scope Overlay (`SH`, `VM9: ~2545k`)**:
  * Fullscreen DOM overlay with circular scope viewport, black outer vignette, and millimeter reticle cross.
  * Adjusts FOV from 90° down to 25° on right-click ADS.

#### 2.2 Health, Ammo & Stance HUD
* **Health Bar (`T6` / HUD Canvas Scene)**:
  * Health bar fill (`a0r`), current numeric HP (`hkhrYayXI`).
  * Low HP Vignette: Red pulsating border overlay when HP < 30.
* **Ammo & Reload Indicator (`SW.xqItLdaOH`)**:
  * Magazine count / Reserve count (e.g. `30 / 90`).
  * Circular reload timer / dry-fire notification (`dryfire.mp3`).
* **Weapon Name & Type (`SW.DMZbIHLgyk`)**:
  * Displays active weapon title (e.g., `Assault Rifle`, `Submachine Gun`, `Sniper Rifle`, `Shotgun`).

#### 2.3 Combat Feedback & Tactical Overlays
* **Hitmarkers & Headshot Indicator**:
  * White crosshair tick + `hitmark.mp3` on body hit (`msg 31`).
  * Red crosshair tick + `good_headshot.mp3` on critical headshot (`msg 13` / `msg 31`).
* **Directional Damage Indicator**:
  * Curved red screen arcs indicating attacker's angular direction (`msg 31`, `arw=1`).
* **Killfeed (`msg 25`, `Y6805DB31Br`)**:
  * Top-right streaming feed: `[Killer] 🔫 [Weapon Icon] [Victim]`.
* **Multi-Kill / Kill Banner (`msg 23`, `G058FYe8B9`)**:
  * Center-screen gold streak banner (e.g., `DOUBLE KILL`, `HEADSHOT`, `RAMPAGE`).
* **Match Header & Timer**:
  * Top-center game clock (`msg 19`, `ld52k5uY7`).
  * Team Score Header bar (`msg 42`, `P2F7KG88n96`).
* **Full Scoreboard Overlay (`TAB` Key)**:
  * Modal table updating at 10Hz (`msg 24`, `RMFVb5UZGi7`): Player Name, Ping (`round(p/2)ms`), Kills, Deaths, Points, Team.
* **In-Game Chat Box (`msg 40`, `kM86hVW024`)**:
  * Bottom-left scrollable chat feed supporting server announcements (`id < 0`) and player chat.
* **HUD Mini Challenge Tracker (`a6B`, `a6C`, `VM9: ~2264k`)**:
  * Bottom-left progress tracker for active mission.
* **"Challenge Completed" Toast (`a6D`, `a6I`, `VM9: ~2265k`)**:
  * Sliding top-center badge popup notification when a challenge completes mid-match.

---

### Step 3: Pause, Death & Post-Match Menus

#### 3.1 In-Match Pause Menu
* **Trigger**: Pressing `ESC` during an active match (`VM9: ~2428k–2431k`).
* **Buttons**:
  * `new a3D('Resume Game', ...)` (`VM9: ~2428k`): Locks pointer and returns to match.
  * `new a3D('Settings', ...)` (`VM9: ~2430k`): Opens full settings overlay without disconnecting.
  * `new a3D('Leave Match', ...)` (`VM9: ~2428k`): Disconnects socket and returns to lobby.

#### 3.2 Death & Respawn Screen
* **Trigger**: Player death (`msg 20`, `gB4Cncy3f4` $\rightarrow$ `function a35()` at `~2498k`).
* **Elements**:
  * Killer Cam / Killer Info: Killer name, avatar, and remaining HP.
  * Respawn Button: `new a3J('RESPAWN', ...)` (`VM9: ~2228k`).
  * Class Switcher Tabs: `L3[0]` (SMG), `L3[1]` (AR), `L3[2]` (AWP), `L3[3]` (Shotgun).
  * HUD Customizer (Mobile): `new a3D('Save Layout', ...)`, `new a3D('Reset Layout', ...)` (`VM9: ~2229k`).

#### 3.3 Match Over & Victory / Defeat Screen
* **Trigger**: Match timer expiry / point limit reached (`msg 28`, `D522Kq7l5n` $\rightarrow$ `W4()` at `~2551k`).
* **Elements**:
  * Splash Banner: `VICTORY` / `DEFEAT` banner (`MA`, `a3s`).
  * `new a3J('PLAY AGAIN', ...)` (`VM9: ~2219k`): Re-queues with the same party.
  * `new a3D('Return to Lobby', ...)` (`VM9: ~2218k`): Closes match and restores main menu scene `Mm`.
  * `new a3D('Scoreboard', ...)` (`VM9: ~2221k`): Displays final match statistics.
  * `new a3D('Change Class', ...)` (`VM9: ~2222k`): Opens loadout editor before the next match.

---

### Step 4: Settings & Configuration Dialogs

* **Styles & Layout**: Defined in [`gameplay/client/css/settings.css`](file:///home/max/Projects/deadshot/gameplay/client/css/settings.css).
* **Settings Tabs & Controls**:
  1. **Controls / Keybindings**: Forward (`W`), Backward (`S`), Left (`A`), Right (`D`), Jump (`Space`), Sprint (`Shift`), Crouch (`C`), Reload (`R`), Aim Down Sights (`Right Click`).
  2. **Mouse Sensitivity**: X-Sensitivity slider, Y-Sensitivity slider, ADS sensitivity multiplier, Invert Y toggle.
  3. **Audio Settings**: Master Volume, Sound Effects Volume (Gunshots/Footsteps), Hitmarker Volume.
  4. **Graphics & Video**: Field of View (FOV $60^\circ - 110^\circ$), Resolution scale, Shadows toggle, Particle effects quality, Anti-aliasing.
  5. **Crosshair Customizer**: Color picker, line thickness, line length, gap, center dot on/off.

---

## 3. UI Component Summary Reference Table

| UI Category | Primary Identifier / Class | Location in VM9 | Primary Action / Purpose |
|---|---|---|---|
| **Lobby Challenges Panel** | `Kq.eglp` / `a6M()` | `~2261k–2271k` | Daily/Weekly mission list, reward claiming |
| **HUD Challenge Tracker** | `a6B` / `a6C()` | `~2264k` | In-match active challenge progress bar |
| **Challenge Toast** | `a6D` / `a6I()` | `~2265k` | Sliding "Challenge Completed" notification |
| **Party Slots & Invite** | `a5B`, `a5C`, `a61` (`a3D`) | `~2255k–2258k` | 2-player lobby management, invite codes |
| **Ready / Start Button** | `N9` (`a3J`) | `~2285k` | Toggles ready state to start game socket |
| **Create / Join Party** | `a3D('Create')`, `a3D('Join')` | `~2286k–2287k` | Matchmaker room generation / joining |
| **Lucky Spin Wheel** | `a3J('Unlock Spin')` | `~2323k` | Cosmetic daily spin wheel |
| **Shop & Gem Purchase** | `a3J('Buy Gems')`, `a3J('Purchase')`| `~2328k–2338k` | In-game microtransaction store |
| **Armory & Skin Equip** | `a3D('Equip')`, `a3D('Inspect')` | `~2358k–2361k` | 3D weapon viewer, loadout skin configuration |
| **Skin Trade-Up** | `a3J('Trade Up')` | `~2399k` | Upgrades duplicate skins |
| **Account & Clan Tag** | `a3D('Change Username/Clan')` | `~2353k–2357k` | Profile display and `[CLAN]` tag management |
| **Combat Crosshair** | `Um` | `~2540k` | Dynamic recoil bloom crosshair |
| **Sniper Scope** | `SH` | `~2545k` | Fullscreen AWP zoom overlay |
| **HUD Health & Ammo** | `SW.xqItLdaOH`, `a0r` | `~2512k` | Ammo counter, health bar, low-HP vignette |
| **Killfeed & Streaks** | `msg 25`, `msg 23` | Runtime | Combat death notices, streak banners |
| **Scoreboard (TAB)** | `msg 24` (`RMFVb5UZGi7`) | Runtime | 10Hz ping/KDA/points overlay table |
| **Pause Menu (ESC)** | `a3D('Resume/Leave/Settings')`| `~2428k–2431k` | In-game pause menu |
| **Death Screen** | `a35()`, `L3` | `~2498k` | Respawn button & class switcher |
| **Game Over Screen** | `a3J('PLAY AGAIN')`, `W4()` | `~2218k–2223k` | Post-match victory/defeat podium |
| **Settings Overlay** | `css/settings.css` | DOM / HTML | Keybinds, sensitivity, audio, FOV sliders |
