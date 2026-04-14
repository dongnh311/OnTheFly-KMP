# OnTheFly Stock App — Flow Cases (All Scenarios)

> Even though this is a demo, every flow must be complete. This document covers **every interaction** across all 9 screens (including Splash).
>
> Visual reference: the `screenShotsDesign/` directory contains screenshots of each screen.

---

## 0. SPLASH SCREEN

> Native Compose screen (not JS), shown on app startup.

### 0.1 Display & Progress

| #     | Action               | Expected Result                                                                                                                   |
| ----- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| SP-01 | Open app first time  | Splash shows: "OnTheFly" (36sp bold) + "Dynamic UI Engine" (14sp cyan). Bottom: progress bar + "Ver.1.0.0 \| 0%" + status text   |
| SP-02 | Progress animation   | Progress bar animates smoothly through 4 phases: Checking (0→30%) → Extracting (30→75%) → Downloading (75→95%) → Ready (95→100%) |
| SP-03 | Minimum display time | Splash displays for at least **2 seconds**, even if init completes earlier                                                        |
| SP-04 | Status text changes  | Text below progress bar changes per phase: "Checking version..." → "Updating scripts..." → "Downloading update..." → "Ready"     |
| SP-05 | Init complete        | Auto-navigates to Login screen, no user tap required                                                                              |

### 0.2 Theme Persistence

| #     | Action                                     | Expected Result                                                              |
| ----- | ------------------------------------------ | --------------------------------------------------------------------------- |
| SP-06 | First app open (no saved settings)         | Splash shows **dark theme** (default): bg #0A0E17, white text, blue progress |
| SP-07 | User switched to Light mode → restart app  | Splash shows **light theme**: bg #F8FAFC, dark text, blue progress           |
| SP-08 | User switched back to Dark mode → restart  | Splash shows **dark theme** again                                            |

### 0.3 Language Persistence

| #     | Action                                     | Expected Result                                                                                           |
| ----- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| SP-09 | First app open (no saved settings)         | Status text shows **English**: "Checking version...", "Updating scripts...", "Downloading update..."      |
| SP-10 | User switched to VI → restart app          | Status text shows **Vietnamese**: "Đang kiểm tra phiên bản...", "Đang cập nhật...", "Đang tải bản cập nhật..." |
| SP-11 | User switched back to EN → restart app     | Status text shows English again                                                                           |

### 0.4 Script Initialization

| #     | Action                                              | Expected Result                                                                |
| ----- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| SP-12 | First install (no local scripts)                    | Extract scripts.zip from assets → create scripts/ directory with all bundles   |
| SP-13 | App update with newer scripts.zip version           | Detect bundled version > local version → re-extract (atomic swap)              |
| SP-14 | App update with same or older scripts.zip version   | Skip extraction, keep current local scripts                                    |
| SP-15 | productionServerUrl != null                         | After bundled extract → check remote `/api/version` → download if newer        |
| SP-16 | productionServerUrl == null                         | Skip OTA check, only extract bundled                                           |
| SP-17 | OTA download fails (server offline)                 | App starts normally with existing local scripts                                |

### 0.5 Edge Cases

| #     | Action                            | Expected Result                                                      |
| ----- | --------------------------------- | -------------------------------------------------------------------- |
| SP-18 | Scripts.zip very small (extract <1s) | Progress still animates for full 2s, doesn't jump to 100%         |
| SP-19 | Kill app during splash            | Next open: splash runs from start, scripts remain intact (atomic)    |

---

## 1. LOGIN SCREEN

### 1.1 Happy Path

| #    | Action                                       | Expected Result                                                                                                                              |
| ---- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| L-01 | Enter valid email + password → tap "Sign In" | Navigate to Dashboard, email is saved as userName                                                                                            |
| L-02 | Tap 🌙                                       | Switch to Light theme, icon changes to ☀️, entire UI updates colors immediately                                                              |
| L-03 | Tap ☀️                                       | Switch back to Dark theme, icon changes to 🌙                                                                                                |
| L-04 | Tap "EN" badge                               | Switch to VI, all text changes: "Sign In"→"Đăng Nhập", "Password"→"Mật khẩu", subtitle, placeholder, powered by... Badge changes to "VI"    |
| L-05 | Tap "VI" badge                               | Switch back to EN, all text restored                                                                                                         |

### 1.2 Validation Errors

| #    | Action                                        | Expected Result                                                                                                                                          |
| ---- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| L-06 | Leave both fields empty → tap "Sign In"       | Show 2 error messages: "Email is required" below email field, "Password is required" below password field. Both field borders turn **red** (#EF4444)     |
| L-07 | Leave email empty, enter password → tap "Sign In" | Only show error below email field, password field normal                                                                                             |
| L-08 | Enter email, leave password empty → tap "Sign In" | Only show error below password field, email field normal                                                                                             |
| L-09 | Error showing → start typing in error field   | Error message **disappears immediately** when user starts typing, field border returns to normal color                                                   |
| L-10 | Switch lang to VI while error is showing      | Error messages switch to Vietnamese: "Vui lòng nhập email", "Vui lòng nhập mật khẩu"                                                                    |
| L-11 | Enter email with only spaces → tap "Sign In"  | Still shows error (trim check: `" ".trim() === ""`)                                                                                                      |

### 1.3 Theme + Lang persistence

| #    | Action                                       | Expected Result                                                                                |
| ---- | -------------------------------------------- | --------------------------------------------------------------------------------------------- |
| L-12 | Switch to Light theme + VI on Login → Sign In | Dashboard shows Light theme + Vietnamese (theme/lang is global state)                         |
| L-13 | Toggle theme rapidly in succession (spam click) | UI responsive, no lag, no wrong color flash                                                 |
| L-14a | Switch to Light + VI → kill app → reopen    | Splash shows light theme + Vietnamese. Login shows light + VI (persisted via SharedPreferences) |
| L-14b | Switch to Dark + EN → kill app → reopen     | Splash shows dark theme + English. Login shows dark + EN                                       |

### 1.4 Edge Cases

| #    | Action                                     | Expected Result                                                    |
| ---- | ------------------------------------------ | ----------------------------------------------------------------- |
| L-14 | Enter very long email (100+ characters)    | TextField layout doesn't break, text scrolls horizontally in field |
| L-15 | Enter password with special chars (!@#$%^&\*) | Accepted normally, field shows dots (isPassword)                |
| L-16 | Tap "Don't have an account? Sign Up"       | `NativeAction.showToast("Sign up coming soon!")`                   |
| L-17 | Tap "Powered by OnTheFly Engine"           | No action (purely decorative)                                      |

---

## 2. DASHBOARD SCREEN

### 2.1 Display

| #    | Action                    | Expected Result                                                                                                                                                                          |
| ---- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D-01 | Enter Dashboard after login | Shows full layout: top bar (title + avatar), portfolio card ($125,847.32, +$1,284.56, +1.03%), trending section (5 cards horizontal), top movers (8 stock rows), bottom nav (Home active) |
| D-02 | Portfolio card            | Shows gradient background (card → surfaceAlt), large value 28px bold, change in green (positive), badge +1.03% with light green background                                               |
| D-03 | Trending Stocks section   | First 5 stock cards (AAPL, TSLA, NVDA, MSFT, GOOGL), horizontal scroll                                                                                                                  |
| D-04 | Top Movers section        | All 8 stocks, each row: symbol (bold), name, price, change (green/red)                                                                                                                   |

### 2.2 Navigation

| #    | Action                                   | Expected Result                                      |
| ---- | ---------------------------------------- | --------------------------------------------------- |
| D-05 | Tap avatar 👤 (top right)                | Navigate to Account screen, can go back              |
| D-06 | Tap any trending card (e.g., NVDA)       | Navigate to Stock Detail for NVDA, has back button   |
| D-07 | Tap any stock row in Top Movers          | Navigate to Stock Detail for that stock              |
| D-08 | Tap "See All" next to "Trending Stocks"  | `NativeAction.navigate("search")`                    |

### 2.3 Scrolling

| #    | Action                     | Expected Result                                                                    |
| ---- | -------------------------- | --------------------------------------------------------------------------------- |
| D-09 | Swipe horizontally on Trending cards | Cards scroll horizontally, smooth, no scrollbar shown                     |
| D-10 | Scroll vertically through content    | Portfolio card, trending, top movers scrollable. Top bar + bottom nav **fixed**  |
| D-11 | Scroll all the way down    | Shows all 8 stock rows (AMD is last), has bottom padding                           |

### 2.4 Bottom Nav

| #    | Action                           | Expected Result                                           |
| ---- | -------------------------------- | -------------------------------------------------------- |
| D-12 | Tap Chart 📊 on bottom nav       | Navigate to Chart screen, Chart tab active               |
| D-13 | Tap Watchlist ⭐ on bottom nav   | Navigate to Watchlist, Watchlist tab active               |
| D-14 | Tap Search 🔍                    | Navigate to Search, Search tab active                    |
| D-15 | Tap News 📰                      | Navigate to News, News tab active                        |
| D-16 | Tap Home 🏠 (currently active)   | Nothing happens (already on Home), or scroll to top      |

---

## 3. WATCHLIST SCREEN

### 3.1 Normal State (has stocks)

| #    | Action                       | Expected Result                                                             |
| ---- | ---------------------------- | -------------------------------------------------------------------------- |
| W-01 | Enter Watchlist              | Shows 4 default stocks (AAPL, NVDA, MSFT, AMZN), each row has ✕ remove button |
| W-02 | Tap stock row (e.g., AAPL)  | Navigate to Stock Detail for AAPL                                          |
| W-03 | Tap ✕ button next to NVDA    | Shows **confirmation Dialog**: "Remove from watchlist?" with 2 buttons Cancel/Confirm |

### 3.2 Remove Dialog

| #    | Action                          | Expected Result                                                          |
| ---- | ------------------------------- | ----------------------------------------------------------------------- |
| W-04 | In Dialog → tap "Cancel"        | Dialog closes, stock remains in list                                     |
| W-05 | In Dialog → tap "Confirm"       | Dialog closes, stock removed from list, UI re-renders immediately        |
| W-06 | Remove all 4 stocks one by one  | After each removal, list gets shorter. When no stocks left → shows **empty state** |
| W-07 | Dialog is open → switch lang to VI | Text in dialog changes: "Xóa khỏi danh mục?", "Hủy", "Xác nhận"      |
| W-08 | Tap overlay (outside dialog)    | Closes dialog (onDismiss)                                                |

### 3.3 Empty State

| #    | Action                          | Expected Result                                        |
| ---- | ------------------------------- | ----------------------------------------------------- |
| W-09 | Watchlist empty (all removed)   | Shows centered: icon ⭐ (40px) + text "No stocks in watchlist" |
| W-10 | Empty state + lang VI           | Text: "Chưa có cổ phiếu nào"                          |

### 3.4 Add Stock

| #    | Action                               | Expected Result             |
| ---- | ------------------------------------ | --------------------------- |
| W-11 | Tap "+ Add Stock" button (top right) | Navigate to Search screen   |

### 3.5 Edge Cases

| #    | Action                                     | Expected Result                                           |
| ---- | ------------------------------------------ | -------------------------------------------------------- |
| W-12 | Remove stock → navigate to Detail → back   | Watchlist still missing the removed stock (state persists) |
| W-13 | Tap ✕ rapidly on multiple stocks           | Each tap opens dialog for the corresponding stock, no conflicts |

---

## 4. SEARCH SCREEN

### 4.1 Default State (no input yet)

| #    | Action                      | Expected Result                                                                                                |
| ---- | --------------------------- | ------------------------------------------------------------------------------------------------------------- |
| S-01 | Enter Search screen         | Shows: search bar (🔍 + placeholder), "Recent Searches" (3 chips: AAPL, TSLA, NVDA), "Popular" (first 5 stocks) |
| S-02 | Search bar shows placeholder | "Search stocks, ETFs..." (or VI: "Tìm cổ phiếu, ETF...")                                                     |

### 4.2 Search + Filter

| #    | Action                  | Expected Result                                                              |
| ---- | ----------------------- | --------------------------------------------------------------------------- |
| S-03 | Type "A" in search      | Filter: AAPL, AMZN, AMD (match symbol or name containing "a", case insensitive) |
| S-04 | Type "TSLA"             | Filter: only TSLA                                                            |
| S-05 | Type "Tesla"            | Filter: TSLA (match by name "Tesla, Inc.")                                   |
| S-06 | Type "nvidia" (lowercase) | Filter: NVDA (case insensitive match "NVIDIA Corp.")                       |
| S-07 | Type "xyz" (no match)   | Shows **"No results"** centered                                              |
| S-08 | Type query → clear all  | Returns to default state (Recent Searches + Popular)                         |
| S-09 | Type "M"                | Filter: MSFT, META, AMD, AMZN (symbol/name containing "m")                  |
| S-10 | Type "micro"            | Filter: MSFT ("Microsoft Corp."), AMD ("Advanced Micro")                     |

### 4.3 Recent Search Chips

| #    | Action          | Expected Result                                        |
| ---- | --------------- | ----------------------------------------------------- |
| S-11 | Tap chip "AAPL" | Search field auto-fills "AAPL", filter results show AAPL |
| S-12 | Tap chip "TSLA" | Search field fills "TSLA", shows TSLA                  |
| S-13 | Tap chip "NVDA" | Search field fills "NVDA", shows NVDA                  |

### 4.4 Navigation

| #    | Action                              | Expected Result                         |
| ---- | ----------------------------------- | --------------------------------------- |
| S-14 | Tap stock row in search results     | Navigate to Stock Detail for that stock |
| S-15 | Tap stock row in Popular section    | Navigate to Stock Detail                |

### 4.5 Edge Cases

| #    | Action                      | Expected Result                                      |
| ---- | --------------------------- | --------------------------------------------------- |
| S-16 | Type only spaces            | Treated as empty query, shows default state (trim check) |
| S-17 | Type special characters (!@#) | Filter runs normally, returns "No results"          |
| S-18 | Type very long input (50+ chars) | TextField doesn't break, filter returns "No results" |

---

## 5. NEWS SCREEN

### 5.1 Tab System

| #    | Action                        | Expected Result                                                              |
| ---- | ----------------------------- | --------------------------------------------------------------------------- |
| N-01 | Enter News screen             | Tab "News" active (accent color + underline), shows all 6 news items         |
| N-02 | Tap tab "Breaking"            | Filter: only shows 2 items (Fed + S&P 500), Breaking tab active              |
| N-03 | Tap tab "Latest"              | Filter: only shows 4 items (NVIDIA, Apple, Tesla, Bitcoin), Latest tab active |
| N-04 | Tap tab "News" (back to All)  | Shows all 6 items again                                                      |
| N-05 | Tap currently active tab      | Nothing happens (already selected)                                           |

### 5.2 News Cards

| #    | Action              | Expected Result                                                        |
| ---- | ------------------- | ---------------------------------------------------------------------- |
| N-06 | Breaking news items | **Red** badge ("Breaking"/"Nóng") with background `neg+30`             |
| N-07 | Latest news items   | **Accent green** badge ("Latest"/"Mới nhất") with background `accent+30` |
| N-08 | Each card shows     | Tag badge + title (bold) + source + time + "Read More" link            |
| N-09 | Tap "Read More"     | `NativeAction.showToast("Opening: " + newsTitle)`                      |
| N-10 | Tap news card body  | Same as N-09                                                           |

### 5.3 i18n

| #    | Action                                 | Expected Result                                                               |
| ---- | -------------------------------------- | ---------------------------------------------------------------------------- |
| N-11 | Switch lang to VI (from Account) → enter News | Tabs: "Tin tức" / "Nóng" / "Mới nhất", badges: "Nóng"/"Mới nhất", "Đọc thêm" |
| N-12 | News title                             | "Tin tức" (VI) or "News" (EN)                                                 |

### 5.4 Scrolling

| #    | Action                 | Expected Result                                          |
| ---- | ---------------------- | ------------------------------------------------------- |
| N-13 | Scroll news list       | Cards scrollable, top title + tabs + bottom nav fixed    |
| N-14 | Tab Breaking (2 items) | Little content, no scroll needed                         |
| N-15 | Tab All (6 items)      | Needs scrolling to see all                               |

---

## 6. ACCOUNT SCREEN

### 6.1 Profile Card

| #    | Action                                       | Expected Result                                                                         |
| ---- | -------------------------------------------- | -------------------------------------------------------------------------------------- |
| A-01 | Enter Account                                | Profile card: avatar circle (gradient), user name/email (from login), "PRO Member" badge |
| A-02 | Login with email "dong@gmail.com"            | Avatar shows "D" (first letter uppercase), name shows "dong@gmail.com"                  |
| A-03 | Login with empty email (if bypass validation) | Avatar shows "U" (default), name "User"                                                |

### 6.2 Appearance Section

| #    | Action                         | Expected Result                                      |
| ---- | ------------------------------ | --------------------------------------------------- |
| A-04 | Toggle Dark Mode OFF           | **Entire app** switches to Light theme immediately   |
| A-05 | Toggle Dark Mode ON            | Switches back to Dark theme                          |
| A-06 | Tap "EN" in Language picker    | Already active → no change                           |
| A-07 | Tap "VI" in Language picker    | Switches to Vietnamese: all labels change             |
| A-08 | Tap "EN" after selecting VI    | Switches back to EN                                  |
| A-09 | Theme Light + Lang VI          | Both changes apply simultaneously, UI consistent     |

### 6.3 Notifications Section

| #    | Action                        | Expected Result                             |
| ---- | ----------------------------- | ------------------------------------------ |
| A-10 | Toggle Push Notifications OFF | Toggle switches OFF (grey), state saved locally |
| A-11 | Toggle Push Notifications ON  | Toggle switches ON (accent green)           |
| A-12 | Toggle Price Alerts OFF/ON    | Same behavior, independent toggle           |

### 6.4 Security Section

| #    | Action                        | Expected Result                                          |
| ---- | ----------------------------- | ------------------------------------------------------- |
| A-13 | Tap "Change Password" row (→) | Opens fullscreen Change Password popup with 3 fields: Current Password, New Password, Confirm Password. Validates min 6 chars + match. Shows toast on success. |
| A-14 | Tap "Two-Factor Auth" row (→) | Opens ConfirmDialog to enable/disable 2FA. Shows ON status + arrow when enabled. Toast confirms toggle. |
| A-15 | Toggle Biometric Login ON/OFF | Toggle switches state                                    |

### 6.5 About Section

| #    | Action         | Expected Result                        |
| ---- | -------------- | ------------------------------------- |
| A-16 | Version row    | Shows "1.0.0" on the right (display only) |
| A-17 | Powered by row | Shows "⚡" icon on the right (display only) |

### 6.6 Logout Flow

| #    | Action                   | Expected Result                                                                |
| ---- | ------------------------ | ----------------------------------------------------------------------------- |
| A-18 | Tap "Log Out" button     | Shows **confirmation Dialog**: "Are you sure you want to log out?" + Cancel/Confirm |
| A-19 | Dialog → tap "Cancel"    | Dialog closes, stays on Account                                                |
| A-20 | Dialog → tap "Confirm"   | Clears user state, navigates to **Login screen**, clears navigation stack      |
| A-21 | Logout → Login screen    | Theme + Lang **retain** settings from Account                                  |
| A-22 | Dialog open + lang VI    | "Bạn có chắc muốn đăng xuất?", "Hủy", "Xác nhận"                              |
| A-23 | Tap overlay outside dialog | Closes dialog                                                                |

### 6.7 Back Navigation

| #    | Action            | Expected Result                        |
| ---- | ----------------- | ------------------------------------- |
| A-24 | Tap ← back button | Navigate to previous screen (Dashboard) |

---

## 7. STOCK DETAIL SCREEN

### 7.1 Display

| #     | Action                              | Expected Result                                                                                                                                                                    |
| ----- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SD-01 | Enter Detail for AAPL               | Top: ← AAPL ⭐. Price: $189.84 (32px bold). Change: +2.35 (+1.25%) green. Chart placeholder. Range buttons (1D active). Stats grid (Open/High/Low/Vol/MktCap/PE). Buy/Sell buttons |
| SD-02 | Enter Detail for TSLA               | Price: $248.42. Change: -5.18 (-2.04%) **red**. Stats: TSLA data                                                                                                                  |
| SD-03 | Enter Detail for each stock (8 stocks) | Data correct for each stock                                                                                                                                                     |
| SD-04 | Stats grid                          | 2 columns × 3 rows, each cell: label (grey 11px) + value (white 14px bold)                                                                                                       |

### 7.2 Time Range Selector

| #     | Action                        | Expected Result                              |
| ----- | ----------------------------- | ------------------------------------------- |
| SD-05 | Default                       | "1D" active (accent background, white text)  |
| SD-06 | Tap "1W"/"1M"/"3M"/"1Y"/"ALL" | Selected range active, others inactive      |
| SD-07 | Tap currently active range    | No change                                    |

### 7.3 Bookmark

| #     | Action          | Expected Result                                                                  |
| ----- | --------------- | -------------------------------------------------------------------------------- |
| SD-08 | Tap ⭐ bookmark | Toggle filled/outline, showToast "Added to watchlist" / "Removed from watchlist" |

### 7.4 Buy/Sell

| #     | Action                   | Expected Result                                         |
| ----- | ------------------------ | ------------------------------------------------------ |
| SD-09 | Tap "Buy" button (green) | `NativeAction.showToast("Buy order placed for AAPL")`  |
| SD-10 | Tap "Sell" button (red)  | `NativeAction.showToast("Sell order placed for AAPL")` |

### 7.5 Navigation

| #     | Action                     | Expected Result                                                                           |
| ----- | -------------------------- | ---------------------------------------------------------------------------------------- |
| SD-11 | Tap ← back                 | Navigate to previous screen (Dashboard/Watchlist/Search/Chart — depends on entry point)   |
| SD-12 | Enter from Dashboard → back | Back to Dashboard                                                                        |
| SD-13 | Enter from Watchlist → back | Back to Watchlist                                                                        |
| SD-14 | Enter from Search → back    | Back to Search                                                                           |
| SD-15 | Enter from Chart screen → back | Back to Chart                                                                         |

### 7.6 i18n

| #     | Action                  | Expected Result                                                                                               |
| ----- | ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| SD-16 | Detail screen + lang VI | Buy→"Mua", Sell→"Bán", Open→"Mở cửa", High→"Cao nhất", Low→"Thấp nhất", Volume→"Khối lượng", Mkt Cap→"Vốn hóa" |

### 7.7 Edge Cases

| #     | Action                                   | Expected Result                |
| ----- | ---------------------------------------- | ----------------------------- |
| SD-17 | Navigate Detail for non-existent symbol  | Fallback to stocks[0] (AAPL)  |
| SD-18 | Very large price (NVDA $875.28)          | Layout doesn't break          |

---

## 8. CHART SCREEN (NEW)

> Reference: `screenshots/chart.png`

### 8.1 Stock Picker

| #     | Action                                     | Expected Result                                                                                                                                                     |
| ----- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| CH-01 | Enter Chart screen for the first time      | AAPL pill active (accent bg, white text), shows chart + data for AAPL. Other pills: TSLA, NVDA, MSFT, GOOGL, AMZN, META, AMD (grey, inactive)                      |
| CH-02 | Tap pill "TSLA"                            | TSLA active, AAPL inactive. Price header changes: $248.42, -5.18 (-2.04%) **red**. Chart re-renders TSLA data. OHLC changes: Open 253.60, High 255.10, Low 246.30, Vol 98.7M |
| CH-03 | Tap pill "NVDA"                            | Same behavior: price $875.28, +12.45 (+1.44%) green. Chart + OHLC for NVDA                                                                                         |
| CH-04 | Tap each pill (8 stocks)                   | Chart + price + OHLC update with correct data for that stock                                                                                                        |
| CH-05 | Tap currently active pill                  | Nothing happens                                                                                                                                                     |
| CH-06 | Swipe horizontally on pills                | Pills scroll horizontally (overflow auto), shows all 8 pills                                                                                                        |
| CH-07 | Enter Chart from Stock Detail of TSLA      | TSLA pill auto-activates (receives context.params.symbol if available)                                                                                               |

### 8.2 Price Header

| #     | Action                       | Expected Result                                                |
| ----- | ---------------------------- | ------------------------------------------------------------- |
| CH-08 | Stock positive (AAPL +1.25%) | Price $189.84 (26px bold white) + change green (+2.35 (+1.25%)) |
| CH-09 | Stock negative (TSLA -2.04%) | Price $248.42 + change **red** (-5.18 (-2.04%))                |
| CH-10 | Switch stock                 | Price header updates immediately, no delay                     |

### 8.3 Time Range Selector

| #     | Action                          | Expected Result                                                                                                         |
| ----- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| CH-11 | Default                         | "1M" active (surfaceVariant bg, accent text)                                                                           |
| CH-12 | Tap "1D"                        | 1D active, chart re-renders intraday data (if different mock data exists), range labels change                          |
| CH-13 | Tap "1W"                        | 1W active, chart data for 1 week                                                                                       |
| CH-14 | Tap "3M"                        | 3M active                                                                                                              |
| CH-15 | Tap "6M"                        | 6M active                                                                                                              |
| CH-16 | Tap "1Y"                        | 1Y active                                                                                                              |
| CH-17 | Tap "ALL"                       | ALL active                                                                                                             |
| CH-18 | Switch range → chart data changes | Each range has a different set of candlestick data points (mock). If not yet implemented: chart keeps same data but range visual still changes |
| CH-19 | Switch stock + switch range     | Both are reflected: stock data + time range                                                                             |

### 8.4 Candlestick Chart

| #     | Action                     | Expected Result                                                                                                   |
| ----- | -------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| CH-20 | Chart render               | Shows candlesticks: green (close > open), red (close < open). Each candle has wick (thin line) + body (thick rect) |
| CH-21 | MA lines overlay           | 3 Moving Average lines: MA7 (yellow #F59E0B), MA25 (blue #3B82F6), MA99 (purple #A855F7)                         |
| CH-22 | MA legend                  | Top-left of chart: "MA7 187.52" (yellow), "MA25 184.30" (blue), "MA99 178.65" (purple) — values update per stock  |
| CH-23 | Price labels (Y-axis)      | Right side of chart: prices from high to low, update based on stock's price range                                 |
| CH-24 | Date labels (X-axis)       | Below chart: date labels corresponding to time range (e.g., 1M → "Mar 10", "Mar 17"... "Apr 7")                  |
| CH-25 | Grid lines                 | Horizontal dashed lines, faint (#1F2937), as reference                                                            |
| CH-26 | Switch stock → chart changes | Candlestick positions, MA lines, price labels all update for the new stock                                       |

### 8.5 Volume Bars

| #     | Action                      | Expected Result                                                   |
| ----- | --------------------------- | ---------------------------------------------------------------- |
| CH-27 | Volume section below chart  | Bars green (green candle) / red (red candle), opacity 60%         |
| CH-28 | Volume label                | "Vol 52.3M" (top-left of volume section) — updates per stock      |
| CH-29 | Switch stock → volume changes | Volume bars and label update                                    |

### 8.6 OHLC Bar

| #     | Action                   | Expected Result                                                                                                |
| ----- | ------------------------ | ------------------------------------------------------------------------------------------------------------- |
| CH-30 | OHLC display             | Row of 5 items: Open / High / Low / Close / Vol — each item: label (grey 9px uppercase) + value (white 11px bold) |
| CH-31 | OHLC for AAPL            | Open 187.49, High 190.21, Low 186.80, Close 189.84, Vol 52.3M                                                 |
| CH-32 | Switch stock to TSLA     | Open 253.60, High 255.10, Low 246.30, Close 248.42, Vol 98.7M                                                 |
| CH-33 | Switch stock to each stock | OHLC data correct for each stock (from StockData.detail)                                                      |

### 8.7 Indicators

| #     | Action                          | Expected Result                                                                                                         |
| ----- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| CH-34 | Default indicators              | "MA (7,25,99)" chip active (accent border + text, tinted bg). Other chips inactive: RSI, MACD, Bollinger, EMA, VWAP     |
| CH-35 | Tap "RSI" chip                  | RSI toggles ON (accent style). TODO: show RSI sub-chart below volume, or showToast "RSI enabled"                        |
| CH-36 | Tap "MACD" chip                 | MACD toggles ON. TODO: show MACD sub-chart                                                                              |
| CH-37 | Tap "Bollinger" chip            | Toggles ON. TODO: show Bollinger bands overlay on chart                                                                 |
| CH-38 | Tap "EMA" chip                  | Toggles ON                                                                                                              |
| CH-39 | Tap "VWAP" chip                 | Toggles ON                                                                                                              |
| CH-40 | Tap active indicator → OFF      | Toggles OFF, chip returns to inactive style                                                                             |
| CH-41 | Tap "MA (7,25,99)" OFF          | MA lines disappear from chart, MA legend hidden                                                                         |
| CH-42 | Multiple indicators ON at once  | Multiple chips active simultaneously, independent toggle                                                                |
| CH-43 | Swipe horizontally on indicator row | Chips scroll horizontally                                                                                           |

### 8.8 Indicators Button (Top Right)

| #     | Action                                 | Expected Result                                                                                                                                                                                            |
| ----- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CH-44 | Tap "◇ Indicators" button              | Opens fullscreen **Indicators panel** (slideUp popup) listing: MA (7,25,99), RSI, MACD, Bollinger, EMA, VWAP. Each row shows name + description. Active indicator has check_circle icon + accent highlight. |
| CH-45 | In Indicators panel → tap an indicator | Selects it (radio-style, one active at a time), closes panel, chart updates to show selected indicator |
| CH-46 | Close Indicators panel                 | Tap "Close" button → closes popup, no change to selection                                                                                                                                                  |

### 8.9 Navigation

| #     | Action                              | Expected Result                                                                                                                               |
| ----- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| CH-47 | Tap stock pill → want to see Detail | Currently: pills only change chart. Tap stock name/price area or double-tap pill → `NativeAction.navigate("stock_detail", { symbol: sym })`   |
| CH-48 | Bottom nav: tap Home                | Go to Dashboard                                                                                                                               |
| CH-49 | Bottom nav: tap Watchlist           | Go to Watchlist                                                                                                                                |
| CH-50 | Bottom nav: tap Search              | Go to Search                                                                                                                                   |
| CH-51 | Bottom nav: tap News                | Go to News                                                                                                                                     |
| CH-52 | Bottom nav: tap Chart (currently active) | No change                                                                                                                                 |

### 8.10 Theme

| #     | Action                     | Expected Result                                                                                                                                              |
| ----- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CH-53 | Light theme → Chart screen | Background #F8FAFC, cards #FFF, chart lines still correct MA colors, candles still green/red, accent #00B894 for active states, grid lines #F1F5F9, text labels dark |
| CH-54 | Dark theme → Chart screen  | Background #0A0E17, cards #162032, accent #00D4AA, grid #1F2937                                                                                              |

### 8.11 i18n

| #     | Action                 | Expected Result                                                                                                                                |
| ----- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| CH-55 | Lang VI → Chart screen | "Chart"→"Biểu đồ", "Indicators"→"Chỉ báo", OHLC labels: "Open"→"Mở cửa", "High"→"Cao nhất", "Low"→"Thấp nhất", "Close"→"Đóng cửa", "Vol"→"KL" |
| CH-56 | Bottom nav label VI    | "Biểu đồ" instead of "Chart"                                                                                                                  |

### 8.12 Edge Cases

| #     | Action                                          | Expected Result                                                                                     |
| ----- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| CH-57 | Chart screen + stock with very large price (NVDA $875) | Price labels, OHLC values, candle positions all scale correctly, layout doesn't break         |
| CH-58 | Switch stocks rapidly in succession (spam tap pills)  | Chart re-renders smoothly, no flash of wrong data                                             |
| CH-59 | All indicators ON at once                       | Chart remains readable, not too many overlapping lines (each indicator has different opacity/style)  |
| CH-60 | Rotate device (if supported)                    | Chart area expands to landscape. TODO: not needed for demo yet                                      |

---

## 9. BOTTOM NAVIGATION (Cross-screen) — UPDATED 5 TABS

| #     | Action                                          | Expected Result                                                                          |
| ----- | ----------------------------------------------- | --------------------------------------------------------------------------------------- |
| BN-01 | Home → Chart → Watchlist → Search → News → Home | Each tap: screen changes, active tab changes, **no push to stack** (replace)             |
| BN-02 | From any tab, tab icon + label                  | Active: icon full opacity + label accent color bold. Inactive: opacity 0.5 + label grey  |
| BN-03 | Home → Detail → back → tab still Home           | Back from Detail returns to correct previous tab                                         |
| BN-04 | Chart → Detail → back → tab Chart              | Same behavior                                                                            |
| BN-05 | Watchlist → Detail → back → tab Watchlist       | Same behavior                                                                            |
| BN-06 | Bottom nav labels EN                            | "Home", "Chart", "Watchlist", "Search", "News"                                          |
| BN-07 | Bottom nav labels VI                            | "Trang chủ", "Biểu đồ", "Danh mục", "Tìm kiếm", "Tin tức"                               |
| BN-08 | Bottom nav visible on **5 screens**             | Dashboard, Chart, Watchlist, Search, News                                                |
| BN-09 | Bottom nav **not** visible on **3 screens**     | Login, Account, Stock Detail                                                             |
| BN-10 | Tab order (left → right)                        | 🏠 Home \| 📊 Chart \| ⭐ Watchlist \| 🔍 Search \| 📰 News                             |

---

## 10. THEME SYSTEM (Cross-screen)

| #     | Action                            | Expected Result                                                                                                                                       |
| ----- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| TH-01 | Switch theme on Login → Sign In   | Dashboard shows correct new theme                                                                                                                    |
| TH-02 | Switch theme on Account           | **All 8 screens** update (global state)                                                                                                              |
| TH-03 | Dark → Light: verify              | Background: #0A0E17 → #F8FAFC. Text: #FFF → #1E293B. Cards: #162032 → #FFF. Accent: #00D4AA → #00B894. Input: #1F2937 → #F1F5F9. Nav: #111827 → #FFF |
| TH-04 | Light theme → Dashboard           | Portfolio card, stock cards, stock rows all show light colors                                                                                         |
| TH-05 | Light theme → Chart               | Chart bg white, candles still green/red, MA lines retain their colors, grid lines light                                                               |
| TH-06 | Light theme → Stock Detail        | Chart area white, stats grid white cards                                                                                                              |
| TH-07 | Light theme → News                | News cards white background                                                                                                                           |
| TH-08 | Logout → Login → theme retained   | Theme persists through logout cycle                                                                                                                   |
| TH-09 | Change theme → kill app → reopen    | Theme persists across app restart (saved to SharedPreferences, restored into SharedDataStore)                                                        |
| TH-10 | Splash screen shows correct theme   | Splash reads `dark_mode` from `localStorage.getKV()` → applies light/dark theme to splash                                                           |

---

## 11. i18n SYSTEM (Cross-screen)

| #       | Action                           | Expected Result                                                                                        |
| ------- | -------------------------------- | ----------------------------------------------------------------------------------------------------- |
| i18n-01 | Switch lang on Login → navigate  | All 8 screens show correct new language                                                                |
| i18n-02 | Switch lang on Account           | All screens update immediately                                                                         |
| i18n-03 | EN→VI: Dashboard                 | "Bảng điều khiển", "Giá trị danh mục", "Cổ phiếu nổi bật", "Biến động lớn", "Xem tất cả"              |
| i18n-04 | EN→VI: Chart                     | "Biểu đồ", "Chỉ báo", OHLC: "Mở cửa"/"Cao nhất"/"Thấp nhất"/"Đóng cửa"/"KL"                           |
| i18n-05 | EN→VI: Watchlist                 | "Danh mục theo dõi", "Thêm cổ phiếu", empty: "Chưa có cổ phiếu nào"                                   |
| i18n-06 | EN→VI: Search                    | "Tìm kiếm", "Tìm cổ phiếu, ETF...", "Tìm kiếm gần đây", "Phổ biến"                                    |
| i18n-07 | EN→VI: News                      | "Tin tức", "Nóng", "Mới nhất", "Đọc thêm"                                                             |
| i18n-08 | EN→VI: Account                   | "Tài khoản", "Giao diện", "Chế độ tối", "Ngôn ngữ", "Thông báo", "Bảo mật", "Giới thiệu", "Đăng Xuất" |
| i18n-09 | EN→VI: Stock Detail              | "Mua", "Bán", "Mở cửa", "Cao nhất", "Thấp nhất", "Khối lượng", "Vốn hóa"                              |
| i18n-10 | EN→VI: Dialogs                   | Remove: "Xóa khỏi danh mục?". Logout: "Bạn có chắc muốn đăng xuất?"                                   |
| i18n-11 | EN→VI: Bottom nav                | "Trang chủ", "Biểu đồ", "Danh mục", "Tìm kiếm", "Tin tức"                                             |
| i18n-12 | Logout → Login → lang retained   | Lang persists through logout cycle                                                                      |
| i18n-13 | Change lang → kill app → reopen   | Lang persists across app restart (saved to SharedPreferences, restored into SharedDataStore)            |
| i18n-14 | Splash screen shows correct lang  | Splash reads `stock_lang` from `localStorage.getKV()` → shows status text in correct language          |

### Splash screen i18n keys

| Key          | EN                      | VI                            |
| ------------ | ----------------------- | ----------------------------- |
| `checking`   | Checking version...     | Đang kiểm tra phiên bản...    |
| `extracting` | Updating scripts...     | Đang cập nhật...              |
| `downloading`| Downloading update...   | Đang tải bản cập nhật...      |
| `ready`      | Ready                   | Sẵn sàng                     |

### NEW i18n keys for Chart screen

| Key          | EN         | VI       |
| ------------ | ---------- | -------- |
| `chart`      | Chart      | Biểu đồ  |
| `indicators` | Indicators | Chỉ báo  |
| `close`      | Close      | Đóng cửa |
| `vol_short`  | Vol        | KL       |

---

## 12. NAVIGATION STACK (Cross-screen)

| #      | Flow                                    | Stack state                                |
| ------ | --------------------------------------- | ------------------------------------------ |
| NAV-01 | Login → Dashboard                       | stack: [] (replace, login is removed)      |
| NAV-02 | Dashboard → Account                     | stack: ["home"]                            |
| NAV-03 | Dashboard → Account → back              | stack: [] → back to Dashboard              |
| NAV-04 | Dashboard → Detail:AAPL                 | stack: ["home"]                            |
| NAV-05 | Dashboard → Detail:AAPL → back          | stack: [] → back to Dashboard              |
| NAV-06 | Dashboard → Chart (bottom nav)          | stack: [] (cleared on tab switch)          |
| NAV-07 | Chart → Detail:TSLA (from tap stock area) | stack: ["chart"]                         |
| NAV-08 | Chart → Detail:TSLA → back              | stack: [] → back to Chart                  |
| NAV-09 | Watchlist → Detail:NVDA                 | stack: ["watchlist"]                       |
| NAV-10 | Watchlist → Detail:NVDA → back          | stack: [] → back to Watchlist              |
| NAV-11 | Search → Detail:TSLA                    | stack: ["search"]                          |
| NAV-12 | Search → Detail:TSLA → back             | stack: [] → back to Search                 |
| NAV-13 | Dashboard → Account → Logout            | stack: [] → back to Login (clear all)      |
| NAV-14 | Chart → Home (bottom nav)               | stack: [] → back to Dashboard              |
| NAV-15 | Any tab → Any tab (bottom nav)          | stack: [] (always clear on tab switch)     |

---

## 13. CHART SCREEN — MOCK DATA SPEC

### Candlestick data per stock (each stock needs ~30 candles for 1M range):

```
Each candle = { open, high, low, close, volume, date }

AAPL 1M data: trending upward from ~$182 → $189.84
TSLA 1M data: volatile, trending down from ~$260 → $248.42
NVDA 1M data: strong uptrend from ~$820 → $875.28
MSFT 1M data: steady uptrend from ~$405 → $415.56
GOOGL 1M data: slight decline from ~$160 → $155.72
AMZN 1M data: uptrend from ~$175 → $185.07
META 1M data: uptrend from ~$485 → $505.95
AMD 1M data: decline from ~$185 → $178.32
```

### MA values (updated per stock):

```
MA7  = average of last 7 candles close
MA25 = average of last 25 candles close
MA99 = trend line (since only 30 candles, use approximate)
```

### Other time ranges (simplified mock):

- **1D**: 24 data points (hourly), intraday pattern
- **1W**: 5 candles (daily), last 5 trading days
- **1M**: 30 candles (daily) — DEFAULT
- **3M**: 60 candles (sampled to 30)
- **6M**: 120 candles (sampled to 30)
- **1Y**: 252 candles (sampled to 30)
- **ALL**: 500 candles (sampled to 30)

If multi-range data is not yet implemented: keep the same set of 30 candles for all ranges, only change the visual range selector.

---

## 14. TOTALS SUMMARY

| Metric                          | Count                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------- |
| Total screens                   | **9** (added Splash + Chart)                                                          |
| Flow cases: **Splash (NEW)**    | **19**                                                                                |
| Flow cases: Login               | 19 (added L-14a, L-14b)                                                              |
| Flow cases: Dashboard           | 16                                                                                    |
| Flow cases: Watchlist           | 13                                                                                    |
| Flow cases: Search              | 18                                                                                    |
| Flow cases: News                | 15                                                                                    |
| Flow cases: Account             | 24                                                                                    |
| Flow cases: Stock Detail        | 18                                                                                    |
| Flow cases: Chart               | 60                                                                                    |
| Flow cases: Bottom Nav          | 10                                                                                    |
| Flow cases: Theme               | 10 (added TH-09, TH-10)                                                              |
| Flow cases: i18n                | 14 (added i18n-13, i18n-14)                                                           |
| Flow cases: Navigation          | 15                                                                                    |
| **Total flow cases**            | **~251**                                                                              |
| Dialogs                         | 3 (remove stock, logout, indicators popup)                                            |
| Toggles                         | 4 + N indicators (dark mode, push notif, price alerts, biometric, MA, RSI, MACD...)   |
| TextFields                      | 3 (email, password, search)                                                           |
| Navigation paths                | 16 unique paths (added splash → login)                                                |
| Bottom nav tabs                 | **5** (Home, Chart, Watchlist, Search, News)                                          |
| Theme variations                | 2 × 9 screens = 18 screen states                                                     |
| Language variations             | 2 × 9 screens = 18 screen states                                                     |
| Settings persistence            | 2 keys (dark_mode, stock_lang) — persisted across app restarts                        |
| Total visual states             | **~80** (9 screens × 2 themes × 2 langs + dialogs + empty states + indicator combos)  |
