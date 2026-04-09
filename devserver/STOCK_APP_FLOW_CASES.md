# OnTheFly Stock App — Flow Cases (Tất cả kịch bản)

> Dù là demo, mọi flow phải hoàn thiện. Tài liệu này cover **mọi tương tác** có thể xảy ra trên 8 screens.
>
> Tham chiếu visual: thư mục `screenShotsDesign/` chứa screenshot từng screen.

---

## 1. LOGIN SCREEN

### 1.1 Happy Path

| #    | Hành động                                    | Kết quả mong đợi                                                                                                                         |
| ---- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| L-01 | Nhập email hợp lệ + password → tap "Sign In" | Navigate sang Dashboard, email được lưu làm userName                                                                                     |
| L-02 | Tap 🌙                                       | Chuyển sang Light theme, icon đổi thành ☀️, toàn bộ UI cập nhật màu ngay lập tức                                                         |
| L-03 | Tap ☀️                                       | Chuyển lại Dark theme, icon đổi thành 🌙                                                                                                 |
| L-04 | Tap "EN" badge                               | Chuyển sang VI, tất cả text đổi: "Sign In"→"Đăng Nhập", "Password"→"Mật khẩu", subtitle, placeholder, powered by... Badge đổi thành "VI" |
| L-05 | Tap "VI" badge                               | Chuyển lại EN, tất cả text phục hồi                                                                                                      |

### 1.2 Validation Errors

| #    | Hành động                                     | Kết quả mong đợi                                                                                                                                   |
| ---- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| L-06 | Để trống cả 2 field → tap "Sign In"           | Hiện 2 error messages: "Email is required" dưới email field, "Password is required" dưới password field. Border 2 fields đổi sang **đỏ** (#EF4444) |
| L-07 | Để trống email, nhập password → tap "Sign In" | Chỉ hiện error dưới email field, password field bình thường                                                                                        |
| L-08 | Nhập email, để trống password → tap "Sign In" | Chỉ hiện error dưới password field, email field bình thường                                                                                        |
| L-09 | Đang hiện error → bắt đầu gõ vào field lỗi    | Error message **biến mất ngay** khi user bắt đầu gõ, border field trở về màu bình thường                                                           |
| L-10 | Chuyển lang sang VI khi đang hiện error       | Error messages đổi sang tiếng Việt: "Vui lòng nhập email", "Vui lòng nhập mật khẩu"                                                                |
| L-11 | Nhập email chỉ có spaces → tap "Sign In"      | Vẫn hiện error (trim check: `" ".trim() === ""`)                                                                                                   |

### 1.3 Theme + Lang persistence

| #    | Hành động                                    | Kết quả mong đợi                                                         |
| ---- | -------------------------------------------- | ------------------------------------------------------------------------ |
| L-12 | Chuyển Light theme + VI trên Login → Sign In | Dashboard hiện với Light theme + tiếng Việt (theme/lang là global state) |
| L-13 | Toggle theme nhanh liên tục (spam click)     | UI responsive, không lag, không flash sai màu                            |

### 1.4 Edge Cases

| #    | Hành động                                  | Kết quả mong đợi                                                 |
| ---- | ------------------------------------------ | ---------------------------------------------------------------- |
| L-14 | Nhập email rất dài (100+ ký tự)            | TextField không bị vỡ layout, text scroll horizontal trong field |
| L-15 | Nhập password có special chars (!@#$%^&\*) | Chấp nhận bình thường, field hiện dots (isPassword)              |
| L-16 | Tap "Don't have an account? Sign Up"       | `NativeAction.showToast("Sign up coming soon!")`                 |
| L-17 | Tap "Powered by OnTheFly Engine"           | Không có action (purely decorative)                              |

---

## 2. DASHBOARD SCREEN

### 2.1 Display

| #    | Hành động               | Kết quả mong đợi                                                                                                                                                                    |
| ---- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D-01 | Vào Dashboard sau login | Hiện đầy đủ: top bar (title + avatar), portfolio card ($125,847.32, +$1,284.56, +1.03%), trending section (5 cards horizontal), top movers (8 stock rows), bottom nav (Home active) |
| D-02 | Portfolio card          | Hiện gradient background (card → surfaceAlt), value lớn 28px bold, change màu xanh (positive), badge +1.03% có background xanh nhạt                                                 |
| D-03 | Trending Stocks section | 5 stock cards đầu tiên (AAPL, TSLA, NVDA, MSFT, GOOGL), horizontal scroll                                                                                                           |
| D-04 | Top Movers section      | Tất cả 8 stocks, mỗi row: symbol (bold), name, price, change (xanh/đỏ)                                                                                                              |

### 2.2 Navigation

| #    | Hành động                                | Kết quả mong đợi                                    |
| ---- | ---------------------------------------- | --------------------------------------------------- |
| D-05 | Tap avatar 👤 (góc phải)                 | Navigate sang Account screen, có thể back lại       |
| D-06 | Tap bất kỳ trending card (VD: NVDA)      | Navigate sang Stock Detail cho NVDA, có back button |
| D-07 | Tap bất kỳ stock row trong Top Movers    | Navigate sang Stock Detail cho stock đó             |
| D-08 | Tap "See All" bên cạnh "Trending Stocks" | `NativeAction.navigate("search")`                   |

### 2.3 Scrolling

| #    | Hành động                  | Kết quả mong đợi                                                                  |
| ---- | -------------------------- | --------------------------------------------------------------------------------- |
| D-09 | Swipe ngang Trending cards | Cards scroll horizontally, smooth, không show scrollbar                           |
| D-10 | Scroll dọc nội dung        | Portfolio card, trending, top movers scrollable. Top bar + bottom nav **cố định** |
| D-11 | Scroll hết xuống dưới      | Hiện đủ 8 stock rows (AMD là cuối), có padding bottom                             |

### 2.4 Bottom Nav

| #    | Hành động                        | Kết quả mong đợi                                         |
| ---- | -------------------------------- | -------------------------------------------------------- |
| D-12 | Tap Chart 📊 trên bottom nav     | Navigate sang Chart screen, tab Chart active             |
| D-13 | Tap Watchlist ⭐ trên bottom nav | Navigate sang Watchlist, tab Watchlist active            |
| D-14 | Tap Search 🔍                    | Navigate sang Search, tab Search active                  |
| D-15 | Tap News 📰                      | Navigate sang News, tab News active                      |
| D-16 | Tap Home 🏠 (đang active)        | Không có gì xảy ra (already on Home), hoặc scroll to top |

---

## 3. WATCHLIST SCREEN

### 3.1 Normal State (có stocks)

| #    | Hành động                    | Kết quả mong đợi                                                           |
| ---- | ---------------------------- | -------------------------------------------------------------------------- |
| W-01 | Vào Watchlist                | Hiện 4 stocks mặc định (AAPL, NVDA, MSFT, AMZN), mỗi row có nút ✕ remove   |
| W-02 | Tap vào stock row (VD: AAPL) | Navigate sang Stock Detail cho AAPL                                        |
| W-03 | Tap nút ✕ bên phải NVDA      | Hiện **Dialog confirm**: "Remove from watchlist?" với 2 nút Cancel/Confirm |

### 3.2 Remove Dialog

| #    | Hành động                       | Kết quả mong đợi                                                        |
| ---- | ------------------------------- | ----------------------------------------------------------------------- |
| W-04 | Trong Dialog → tap "Cancel"     | Dialog đóng, stock vẫn còn trong list                                   |
| W-05 | Trong Dialog → tap "Confirm"    | Dialog đóng, stock bị xóa khỏi list, UI re-render ngay                  |
| W-06 | Remove lần lượt tất cả 4 stocks | Sau mỗi lần remove, list ngắn lại. Khi hết stock → hiện **empty state** |
| W-07 | Dialog đang mở → chuyển lang VI | Text trong dialog đổi: "Xóa khỏi danh mục?", "Hủy", "Xác nhận"          |
| W-08 | Tap overlay (bên ngoài dialog)  | Đóng dialog (onDismiss)                                                 |

### 3.3 Empty State

| #    | Hành động                       | Kết quả mong đợi                                              |
| ---- | ------------------------------- | ------------------------------------------------------------- |
| W-09 | Watchlist trống (đã remove hết) | Hiện centered: icon ⭐ (40px) + text "No stocks in watchlist" |
| W-10 | Empty state + lang VI           | Text: "Chưa có cổ phiếu nào"                                  |

### 3.4 Add Stock

| #    | Hành động                            | Kết quả mong đợi            |
| ---- | ------------------------------------ | --------------------------- |
| W-11 | Tap "+ Add Stock" button (top right) | Navigate sang Search screen |

### 3.5 Edge Cases

| #    | Hành động                                  | Kết quả mong đợi                                         |
| ---- | ------------------------------------------ | -------------------------------------------------------- |
| W-12 | Remove stock → navigate sang Detail → back | Watchlist vẫn thiếu stock đã remove (state persist)      |
| W-13 | Tap ✕ nhanh liên tục trên nhiều stocks     | Mỗi tap mở dialog cho stock tương ứng, không bị conflict |

---

## 4. SEARCH SCREEN

### 4.1 Default State (chưa gõ)

| #    | Hành động                   | Kết quả mong đợi                                                                                             |
| ---- | --------------------------- | ------------------------------------------------------------------------------------------------------------ |
| S-01 | Vào Search screen           | Hiện: search bar (🔍 + placeholder), "Recent Searches" (3 chips: AAPL, TSLA, NVDA), "Popular" (5 stocks đầu) |
| S-02 | Search bar hiện placeholder | "Search stocks, ETFs..." (hoặc VI: "Tìm cổ phiếu, ETF...")                                                   |

### 4.2 Search + Filter

| #    | Hành động               | Kết quả mong đợi                                                            |
| ---- | ----------------------- | --------------------------------------------------------------------------- |
| S-03 | Gõ "A" vào search       | Filter: AAPL, AMZN, AMD (match symbol hoặc name chứa "a", case insensitive) |
| S-04 | Gõ "TSLA"               | Filter: chỉ TSLA                                                            |
| S-05 | Gõ "Tesla"              | Filter: TSLA (match by name "Tesla, Inc.")                                  |
| S-06 | Gõ "nvidia" (lowercase) | Filter: NVDA (case insensitive match "NVIDIA Corp.")                        |
| S-07 | Gõ "xyz" (không match)  | Hiện **"No results"** centered                                              |
| S-08 | Gõ query → xóa hết      | Trở về default state (Recent Searches + Popular)                            |
| S-09 | Gõ "M"                  | Filter: MSFT, META, AMD, AMZN (symbol/name chứa "m")                        |
| S-10 | Gõ "micro"              | Filter: MSFT ("Microsoft Corp."), AMD ("Advanced Micro")                    |

### 4.3 Recent Search Chips

| #    | Hành động       | Kết quả mong đợi                                      |
| ---- | --------------- | ----------------------------------------------------- |
| S-11 | Tap chip "AAPL" | Search field tự fill "AAPL", filter results hiện AAPL |
| S-12 | Tap chip "TSLA" | Search field fill "TSLA", hiện TSLA                   |
| S-13 | Tap chip "NVDA" | Search field fill "NVDA", hiện NVDA                   |

### 4.4 Navigation

| #    | Hành động                           | Kết quả mong đợi                        |
| ---- | ----------------------------------- | --------------------------------------- |
| S-14 | Tap stock row trong search results  | Navigate sang Stock Detail cho stock đó |
| S-15 | Tap stock row trong Popular section | Navigate sang Stock Detail              |

### 4.5 Edge Cases

| #    | Hành động                   | Kết quả mong đợi                                    |
| ---- | --------------------------- | --------------------------------------------------- |
| S-16 | Gõ chỉ spaces               | Coi như query rỗng, hiện default state (trim check) |
| S-17 | Gõ special characters (!@#) | Filter chạy bình thường, trả "No results"           |
| S-18 | Gõ rất dài (50+ chars)      | TextField không vỡ, filter trả "No results"         |

---

## 5. NEWS SCREEN

### 5.1 Tab System

| #    | Hành động                     | Kết quả mong đợi                                                            |
| ---- | ----------------------------- | --------------------------------------------------------------------------- |
| N-01 | Vào News screen               | Tab "News" active (accent color + underline), hiện tất cả 6 news items      |
| N-02 | Tap tab "Breaking"            | Filter: chỉ hiện 2 items (Fed + S&P 500), tab Breaking active               |
| N-03 | Tap tab "Latest"              | Filter: chỉ hiện 4 items (NVIDIA, Apple, Tesla, Bitcoin), tab Latest active |
| N-04 | Tap tab "News" (quay lại All) | Hiện lại tất cả 6 items                                                     |
| N-05 | Tap tab đang active           | Không có gì xảy ra (already selected)                                       |

### 5.2 News Cards

| #    | Hành động           | Kết quả mong đợi                                                       |
| ---- | ------------------- | ---------------------------------------------------------------------- |
| N-06 | Breaking news items | Badge **đỏ** ("Breaking"/"Nóng") với background `neg+30`               |
| N-07 | Latest news items   | Badge **xanh accent** ("Latest"/"Mới nhất") với background `accent+30` |
| N-08 | Mỗi card hiện       | Tag badge + title (bold) + source + time + "Read More" link            |
| N-09 | Tap "Read More"     | `NativeAction.showToast("Opening: " + newsTitle)`                      |
| N-10 | Tap news card body  | Tương tự N-09                                                          |

### 5.3 i18n

| #    | Hành động                              | Kết quả mong đợi                                                             |
| ---- | -------------------------------------- | ---------------------------------------------------------------------------- |
| N-11 | Chuyển lang VI (từ Account) → vào News | Tabs: "Tin tức" / "Nóng" / "Mới nhất", badges: "Nóng"/"Mới nhất", "Đọc thêm" |
| N-12 | News title                             | "Tin tức" (VI) hoặc "News" (EN)                                              |

### 5.4 Scrolling

| #    | Hành động              | Kết quả mong đợi                                        |
| ---- | ---------------------- | ------------------------------------------------------- |
| N-13 | Scroll news list       | Cards scrollable, top title + tabs + bottom nav cố định |
| N-14 | Tab Breaking (2 items) | Ít content, không cần scroll                            |
| N-15 | Tab All (6 items)      | Cần scroll để thấy hết                                  |

---

## 6. ACCOUNT SCREEN

### 6.1 Profile Card

| #    | Hành động                                    | Kết quả mong đợi                                                                       |
| ---- | -------------------------------------------- | -------------------------------------------------------------------------------------- |
| A-01 | Vào Account                                  | Profile card: avatar circle (gradient), user name/email (từ login), "PRO Member" badge |
| A-02 | Login với email "dong@gmail.com"             | Avatar hiện "D" (chữ cái đầu uppercase), name hiện "dong@gmail.com"                    |
| A-03 | Login với email rỗng (nếu bypass validation) | Avatar hiện "U" (default), name "User"                                                 |

### 6.2 Appearance Section

| #    | Hành động                      | Kết quả mong đợi                                |
| ---- | ------------------------------ | ----------------------------------------------- |
| A-04 | Toggle Dark Mode OFF           | **Toàn bộ app** chuyển Light theme ngay lập tức |
| A-05 | Toggle Dark Mode ON            | Chuyển lại Dark theme                           |
| A-06 | Tap "EN" trong Language picker | Đã active → không đổi gì                        |
| A-07 | Tap "VI" trong Language picker | Chuyển sang tiếng Việt: tất cả label đổi        |
| A-08 | Tap "EN" sau khi đã chọn VI    | Chuyển lại EN                                   |
| A-09 | Theme Light + Lang VI          | Cả 2 thay đổi cùng lúc, UI consistent           |

### 6.3 Notifications Section

| #    | Hành động                     | Kết quả mong đợi                          |
| ---- | ----------------------------- | ----------------------------------------- |
| A-10 | Toggle Push Notifications OFF | Toggle chuyển OFF (grey), state lưu local |
| A-11 | Toggle Push Notifications ON  | Toggle chuyển ON (accent green)           |
| A-12 | Toggle Price Alerts OFF/ON    | Tương tự, independent                     |

### 6.4 Security Section

| #    | Hành động                     | Kết quả mong đợi                                        |
| ---- | ----------------------------- | ------------------------------------------------------- |
| A-13 | Tap "Change Password" row (→) | `NativeAction.showToast("Change password coming soon")` |
| A-14 | Tap "Two-Factor Auth" row (→) | `NativeAction.showToast("2FA setup coming soon")`       |
| A-15 | Toggle Biometric Login ON/OFF | Toggle chuyển trạng thái                                |

### 6.5 About Section

| #    | Hành động      | Kết quả mong đợi                      |
| ---- | -------------- | ------------------------------------- |
| A-16 | Version row    | Hiện "1.0.0" bên phải (chỉ display)   |
| A-17 | Powered by row | Hiện "⚡" icon bên phải (chỉ display) |

### 6.6 Logout Flow

| #    | Hành động                | Kết quả mong đợi                                                              |
| ---- | ------------------------ | ----------------------------------------------------------------------------- |
| A-18 | Tap "Log Out" button     | Hiện **Dialog confirm**: "Are you sure you want to log out?" + Cancel/Confirm |
| A-19 | Dialog → tap "Cancel"    | Dialog đóng, ở lại Account                                                    |
| A-20 | Dialog → tap "Confirm"   | Clear user state, navigate về **Login screen**, clear navigation stack        |
| A-21 | Logout → Login screen    | Theme + Lang **giữ nguyên** setting từ Account                                |
| A-22 | Dialog mở + lang VI      | "Bạn có chắc muốn đăng xuất?", "Hủy", "Xác nhận"                              |
| A-23 | Tap overlay ngoài dialog | Đóng dialog                                                                   |

### 6.7 Back Navigation

| #    | Hành động         | Kết quả mong đợi                     |
| ---- | ----------------- | ------------------------------------ |
| A-24 | Tap ← back button | Navigate về screen trước (Dashboard) |

---

## 7. STOCK DETAIL SCREEN

### 7.1 Display

| #     | Hành động                           | Kết quả mong đợi                                                                                                                                                                  |
| ----- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SD-01 | Vào Detail cho AAPL                 | Top: ← AAPL ⭐. Price: $189.84 (32px bold). Change: +2.35 (+1.25%) xanh. Chart placeholder. Range buttons (1D active). Stats grid (Open/High/Low/Vol/MktCap/PE). Buy/Sell buttons |
| SD-02 | Vào Detail cho TSLA                 | Price: $248.42. Change: -5.18 (-2.04%) **đỏ**. Stats: TSLA data                                                                                                                   |
| SD-03 | Vào Detail cho mỗi stock (8 stocks) | Data đúng cho từng stock                                                                                                                                                          |
| SD-04 | Stats grid                          | 2 columns × 3 rows, mỗi cell: label (grey 11px) + value (white 14px bold)                                                                                                         |

### 7.2 Time Range Selector

| #     | Hành động                     | Kết quả mong đợi                            |
| ----- | ----------------------------- | ------------------------------------------- |
| SD-05 | Default                       | "1D" active (accent background, white text) |
| SD-06 | Tap "1W"/"1M"/"3M"/"1Y"/"ALL" | Selected range active, others inactive      |
| SD-07 | Tap range đang active         | Không đổi gì                                |

### 7.3 Bookmark

| #     | Hành động       | Kết quả mong đợi                                                                 |
| ----- | --------------- | -------------------------------------------------------------------------------- |
| SD-08 | Tap ⭐ bookmark | Toggle filled/outline, showToast "Added to watchlist" / "Removed from watchlist" |

### 7.4 Buy/Sell

| #     | Hành động                | Kết quả mong đợi                                       |
| ----- | ------------------------ | ------------------------------------------------------ |
| SD-09 | Tap "Buy" button (green) | `NativeAction.showToast("Buy order placed for AAPL")`  |
| SD-10 | Tap "Sell" button (red)  | `NativeAction.showToast("Sell order placed for AAPL")` |

### 7.5 Navigation

| #     | Hành động                  | Kết quả mong đợi                                                             |
| ----- | -------------------------- | ---------------------------------------------------------------------------- |
| SD-11 | Tap ← back                 | Navigate về screen trước (Dashboard/Watchlist/Search/Chart — tùy từ đâu vào) |
| SD-12 | Vào từ Dashboard → back    | Về Dashboard                                                                 |
| SD-13 | Vào từ Watchlist → back    | Về Watchlist                                                                 |
| SD-14 | Vào từ Search → back       | Về Search                                                                    |
| SD-15 | Vào từ Chart screen → back | Về Chart                                                                     |

### 7.6 i18n

| #     | Hành động               | Kết quả mong đợi                                                                                               |
| ----- | ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| SD-16 | Detail screen + lang VI | Buy→"Mua", Sell→"Bán", Open→"Mở cửa", High→"Cao nhất", Low→"Thấp nhất", Volume→"Khối lượng", Mkt Cap→"Vốn hóa" |

### 7.7 Edge Cases

| #     | Hành động                                | Kết quả mong đợi               |
| ----- | ---------------------------------------- | ------------------------------ |
| SD-17 | Navigate Detail cho symbol không tồn tại | Fallback sang stocks[0] (AAPL) |
| SD-18 | Price rất lớn (NVDA $875.28)             | Layout không vỡ                |

---

## 8. CHART SCREEN (MỚI)

> Tham chiếu: `screenshots/chart.png`

### 8.1 Stock Picker

| #     | Hành động                          | Kết quả mong đợi                                                                                                                                                   |
| ----- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| CH-01 | Vào Chart screen lần đầu           | AAPL pill active (accent bg, white text), hiện chart + data cho AAPL. Các pills khác: TSLA, NVDA, MSFT, GOOGL, AMZN, META, AMD (grey, inactive)                    |
| CH-02 | Tap pill "TSLA"                    | TSLA active, AAPL inactive. Price header đổi: $248.42, -5.18 (-2.04%) **đỏ**. Chart re-render data TSLA. OHLC đổi: Open 253.60, High 255.10, Low 246.30, Vol 98.7M |
| CH-03 | Tap pill "NVDA"                    | Tương tự: price $875.28, +12.45 (+1.44%) xanh. Chart + OHLC cho NVDA                                                                                               |
| CH-04 | Tap mỗi pill (8 stocks)            | Chart + price + OHLC cập nhật đúng data cho stock đó                                                                                                               |
| CH-05 | Tap pill đang active               | Không có gì xảy ra                                                                                                                                                 |
| CH-06 | Swipe ngang pills                  | Pills scroll horizontal (overflow auto), hiện đủ 8 pills                                                                                                           |
| CH-07 | Vào Chart từ Stock Detail của TSLA | TSLA pill tự động active (nhận context.params.symbol nếu có)                                                                                                       |

### 8.2 Price Header

| #     | Hành động                    | Kết quả mong đợi                                               |
| ----- | ---------------------------- | -------------------------------------------------------------- |
| CH-08 | Stock positive (AAPL +1.25%) | Price $189.84 (26px bold white) + change xanh (+2.35 (+1.25%)) |
| CH-09 | Stock negative (TSLA -2.04%) | Price $248.42 + change **đỏ** (-5.18 (-2.04%))                 |
| CH-10 | Đổi stock                    | Price header cập nhật ngay, không delay                        |

### 8.3 Time Range Selector

| #     | Hành động                       | Kết quả mong đợi                                                                                                               |
| ----- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| CH-11 | Default                         | "1M" active (surfaceVariant bg, accent text)                                                                                   |
| CH-12 | Tap "1D"                        | 1D active, chart re-render data intraday (nếu có mock data khác), range labels khác                                            |
| CH-13 | Tap "1W"                        | 1W active, chart data 1 tuần                                                                                                   |
| CH-14 | Tap "3M"                        | 3M active                                                                                                                      |
| CH-15 | Tap "6M"                        | 6M active                                                                                                                      |
| CH-16 | Tap "1Y"                        | 1Y active                                                                                                                      |
| CH-17 | Tap "ALL"                       | ALL active                                                                                                                     |
| CH-18 | Đổi range → chart data thay đổi | Mỗi range có bộ candlestick data points khác nhau (mock). Nếu chưa implement: chart giữ nguyên data nhưng range visual vẫn đổi |
| CH-19 | Đổi stock + đổi range           | Cả 2 đều reflect: stock data + time range                                                                                      |

### 8.4 Candlestick Chart

| #     | Hành động                  | Kết quả mong đợi                                                                                                 |
| ----- | -------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| CH-20 | Chart render               | Hiện candlesticks: xanh (close > open), đỏ (close < open). Mỗi candle có wick (thin line) + body (thick rect)    |
| CH-21 | MA lines overlay           | 3 đường Moving Average: MA7 (vàng #F59E0B), MA25 (xanh dương #3B82F6), MA99 (tím #A855F7)                        |
| CH-22 | MA legend                  | Góc trái trên chart: "MA7 187.52" (vàng), "MA25 184.30" (xanh), "MA99 178.65" (tím) — values cập nhật theo stock |
| CH-23 | Price labels (trục Y)      | Bên phải chart: giá từ cao xuống thấp, cập nhật theo price range của stock                                       |
| CH-24 | Date labels (trục X)       | Dưới chart: date labels tương ứng time range (VD: 1M → "Mar 10", "Mar 17"... "Apr 7")                            |
| CH-25 | Grid lines                 | Horizontal dashed lines nhạt (#1F2937) làm reference                                                             |
| CH-26 | Đổi stock → chart thay đổi | Candlestick positions, MA lines, price labels đều cập nhật cho stock mới                                         |

### 8.5 Volume Bars

| #     | Hành động                   | Kết quả mong đợi                                                 |
| ----- | --------------------------- | ---------------------------------------------------------------- |
| CH-27 | Volume section dưới chart   | Bars xanh (candle xanh) / đỏ (candle đỏ), opacity 60%            |
| CH-28 | Volume label                | "Vol 52.3M" (góc trái trên volume section) — cập nhật theo stock |
| CH-29 | Đổi stock → volume thay đổi | Volume bars và label cập nhật                                    |

### 8.6 OHLC Bar

| #     | Hành động                | Kết quả mong đợi                                                                                              |
| ----- | ------------------------ | ------------------------------------------------------------------------------------------------------------- |
| CH-30 | OHLC display             | Row 5 items: Open / High / Low / Close / Vol — mỗi item: label (grey 9px uppercase) + value (white 11px bold) |
| CH-31 | OHLC cho AAPL            | Open 187.49, High 190.21, Low 186.80, Close 189.84, Vol 52.3M                                                 |
| CH-32 | Đổi stock sang TSLA      | Open 253.60, High 255.10, Low 246.30, Close 248.42, Vol 98.7M                                                 |
| CH-33 | Đổi stock sang mỗi stock | OHLC data đúng cho từng stock (lấy từ StockData.detail)                                                       |

### 8.7 Indicators

| #     | Hành động                       | Kết quả mong đợi                                                                                                       |
| ----- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| CH-34 | Default indicators              | "MA (7,25,99)" chip active (accent border + text, tinted bg). Các chips khác inactive: RSI, MACD, Bollinger, EMA, VWAP |
| CH-35 | Tap "RSI" chip                  | RSI toggle ON (accent style). TODO: hiện RSI sub-chart dưới volume, hoặc showToast "RSI enabled"                       |
| CH-36 | Tap "MACD" chip                 | MACD toggle ON. TODO: hiện MACD sub-chart                                                                              |
| CH-37 | Tap "Bollinger" chip            | Toggle ON. TODO: hiện Bollinger bands overlay trên chart                                                               |
| CH-38 | Tap "EMA" chip                  | Toggle ON                                                                                                              |
| CH-39 | Tap "VWAP" chip                 | Toggle ON                                                                                                              |
| CH-40 | Tap indicator đang active → OFF | Toggle OFF, chip trở lại inactive style                                                                                |
| CH-41 | Tap "MA (7,25,99)" OFF          | MA lines biến mất khỏi chart, MA legend ẩn                                                                             |
| CH-42 | Multiple indicators ON cùng lúc | Nhiều chips active cùng lúc, independent toggle                                                                        |
| CH-43 | Swipe ngang indicator row       | Chips scroll horizontal                                                                                                |

### 8.8 Indicators Button (Top Right)

| #     | Hành động                              | Kết quả mong đợi                                                                                                                                                                                  |
| ----- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CH-44 | Tap "⚙ Indicators" button              | Hiện **Popup/Dialog** danh sách đầy đủ indicators với toggles: MA, EMA, RSI, MACD, Bollinger Bands, VWAP, Stochastic, ATR, OBV. Mỗi indicator có toggle ON/OFF + tùy chỉnh params (VD: MA period) |
| CH-45 | Trong Indicators popup → toggle MA OFF | MA tắt, đóng popup → chart không còn MA lines                                                                                                                                                     |
| CH-46 | Đóng Indicators popup                  | Tap overlay hoặc nút Close → đóng popup                                                                                                                                                           |

### 8.9 Navigation

| #     | Hành động                           | Kết quả mong đợi                                                                                                                             |
| ----- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| CH-47 | Tap stock pill → muốn xem Detail    | Hiện tại: pills chỉ đổi chart. Tap vào stock name/price area hoặc double-tap pill → `NativeAction.navigate("stock_detail", { symbol: sym })` |
| CH-48 | Bottom nav: tap Home                | Về Dashboard                                                                                                                                 |
| CH-49 | Bottom nav: tap Watchlist           | Về Watchlist                                                                                                                                 |
| CH-50 | Bottom nav: tap Search              | Về Search                                                                                                                                    |
| CH-51 | Bottom nav: tap News                | Về News                                                                                                                                      |
| CH-52 | Bottom nav: tap Chart (đang active) | Không đổi gì                                                                                                                                 |

### 8.10 Theme

| #     | Hành động                  | Kết quả mong đợi                                                                                                                                            |
| ----- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CH-53 | Light theme → Chart screen | Background #F8FAFC, cards #FFF, chart lines vẫn đúng MA colors, candles vẫn xanh/đỏ, accent #00B894 cho active states, grid lines #F1F5F9, text labels dark |
| CH-54 | Dark theme → Chart screen  | Background #0A0E17, cards #162032, accent #00D4AA, grid #1F2937                                                                                             |

### 8.11 i18n

| #     | Hành động              | Kết quả mong đợi                                                                                                                              |
| ----- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| CH-55 | Lang VI → Chart screen | "Chart"→"Biểu đồ", "Indicators"→"Chỉ báo", OHLC labels: "Open"→"Mở cửa", "High"→"Cao nhất", "Low"→"Thấp nhất", "Close"→"Đóng cửa", "Vol"→"KL" |
| CH-56 | Bottom nav label VI    | "Biểu đồ" thay vì "Chart"                                                                                                                     |

### 8.12 Edge Cases

| #     | Hành động                                       | Kết quả mong đợi                                                                                   |
| ----- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| CH-57 | Chart screen + stock có giá rất lớn (NVDA $875) | Price labels, OHLC values, candle positions đều scale đúng, không vỡ layout                        |
| CH-58 | Đổi stock nhanh liên tục (spam tap pills)       | Chart re-render mượt, không flash wrong data                                                       |
| CH-59 | Tất cả indicators ON cùng lúc                   | Chart vẫn readable, không bị quá nhiều lines chồng chéo (mỗi indicator có opacity/style khác nhau) |
| CH-60 | Rotate device (nếu support)                     | Chart area mở rộng landscape. TODO: chưa cần cho demo                                              |

---

## 9. BOTTOM NAVIGATION (Cross-screen) — UPDATED 5 TABS

| #     | Hành động                                       | Kết quả mong đợi                                                                        |
| ----- | ----------------------------------------------- | --------------------------------------------------------------------------------------- |
| BN-01 | Home → Chart → Watchlist → Search → News → Home | Mỗi lần tap: screen đổi, tab active đổi, **không push stack** (replace)                 |
| BN-02 | Từ tab bất kỳ, tab icon + label                 | Active: icon full opacity + label accent color bold. Inactive: opacity 0.5 + label grey |
| BN-03 | Home → Detail → back → tab vẫn Home             | Back từ Detail về đúng tab trước đó                                                     |
| BN-04 | Chart → Detail → back → tab Chart               | Tương tự                                                                                |
| BN-05 | Watchlist → Detail → back → tab Watchlist       | Tương tự                                                                                |
| BN-06 | Bottom nav labels EN                            | "Home", "Chart", "Watchlist", "Search", "News"                                          |
| BN-07 | Bottom nav labels VI                            | "Trang chủ", "Biểu đồ", "Danh mục", "Tìm kiếm", "Tin tức"                               |
| BN-08 | Bottom nav visible trên **5 screens**           | Dashboard, Chart, Watchlist, Search, News                                               |
| BN-09 | Bottom nav **không** visible trên **3 screens** | Login, Account, Stock Detail                                                            |
| BN-10 | Tab order (trái → phải)                         | 🏠 Home \| 📊 Chart \| ⭐ Watchlist \| 🔍 Search \| 📰 News                             |

---

## 10. THEME SYSTEM (Cross-screen)

| #     | Hành động                         | Kết quả mong đợi                                                                                                                                     |
| ----- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| TH-01 | Đổi theme trên Login → Sign In    | Dashboard hiện đúng theme mới                                                                                                                        |
| TH-02 | Đổi theme trên Account            | **Toàn bộ 8 screens** cập nhật (global state)                                                                                                        |
| TH-03 | Dark → Light: kiểm tra            | Background: #0A0E17 → #F8FAFC. Text: #FFF → #1E293B. Cards: #162032 → #FFF. Accent: #00D4AA → #00B894. Input: #1F2937 → #F1F5F9. Nav: #111827 → #FFF |
| TH-04 | Light theme → Dashboard           | Portfolio card, stock cards, stock rows đều hiện light colors                                                                                        |
| TH-05 | Light theme → Chart               | Chart bg white, candles vẫn xanh/đỏ, MA lines giữ nguyên color, grid lines light                                                                     |
| TH-06 | Light theme → Stock Detail        | Chart area white, stats grid white cards                                                                                                             |
| TH-07 | Light theme → News                | News cards white background                                                                                                                          |
| TH-08 | Logout → Login → theme giữ nguyên | Theme persist qua logout cycle                                                                                                                       |

---

## 11. i18n SYSTEM (Cross-screen)

| #       | Hành động                        | Kết quả mong đợi                                                                                      |
| ------- | -------------------------------- | ----------------------------------------------------------------------------------------------------- |
| i18n-01 | Đổi lang trên Login → navigate   | Tất cả 8 screens hiện đúng ngôn ngữ mới                                                               |
| i18n-02 | Đổi lang trên Account            | Tất cả screens cập nhật ngay                                                                          |
| i18n-03 | EN→VI: Dashboard                 | "Bảng điều khiển", "Giá trị danh mục", "Cổ phiếu nổi bật", "Biến động lớn", "Xem tất cả"              |
| i18n-04 | EN→VI: Chart                     | "Biểu đồ", "Chỉ báo", OHLC: "Mở cửa"/"Cao nhất"/"Thấp nhất"/"Đóng cửa"/"KL"                           |
| i18n-05 | EN→VI: Watchlist                 | "Danh mục theo dõi", "Thêm cổ phiếu", empty: "Chưa có cổ phiếu nào"                                   |
| i18n-06 | EN→VI: Search                    | "Tìm kiếm", "Tìm cổ phiếu, ETF...", "Tìm kiếm gần đây", "Phổ biến"                                    |
| i18n-07 | EN→VI: News                      | "Tin tức", "Nóng", "Mới nhất", "Đọc thêm"                                                             |
| i18n-08 | EN→VI: Account                   | "Tài khoản", "Giao diện", "Chế độ tối", "Ngôn ngữ", "Thông báo", "Bảo mật", "Giới thiệu", "Đăng Xuất" |
| i18n-09 | EN→VI: Stock Detail              | "Mua", "Bán", "Mở cửa", "Cao nhất", "Thấp nhất", "Khối lượng", "Vốn hóa"                              |
| i18n-10 | EN→VI: Dialogs                   | Remove: "Xóa khỏi danh mục?". Logout: "Bạn có chắc muốn đăng xuất?"                                   |
| i18n-11 | EN→VI: Bottom nav                | "Trang chủ", "Biểu đồ", "Danh mục", "Tìm kiếm", "Tin tức"                                             |
| i18n-12 | Logout → Login → lang giữ nguyên | Lang persist qua logout cycle                                                                         |

### Bảng i18n keys MỚI cho Chart screen

| Key          | EN         | VI       |
| ------------ | ---------- | -------- |
| `chart`      | Chart      | Biểu đồ  |
| `indicators` | Indicators | Chỉ báo  |
| `close`      | Close      | Đóng cửa |
| `vol_short`  | Vol        | KL       |

---

## 12. NAVIGATION STACK (Cross-screen)

| #      | Flow                                    | Stack state                            |
| ------ | --------------------------------------- | -------------------------------------- |
| NAV-01 | Login → Dashboard                       | stack: [] (replace, login bị xóa)      |
| NAV-02 | Dashboard → Account                     | stack: ["home"]                        |
| NAV-03 | Dashboard → Account → back              | stack: [] → về Dashboard               |
| NAV-04 | Dashboard → Detail:AAPL                 | stack: ["home"]                        |
| NAV-05 | Dashboard → Detail:AAPL → back          | stack: [] → về Dashboard               |
| NAV-06 | Dashboard → Chart (bottom nav)          | stack: [] (clear khi chuyển tab)       |
| NAV-07 | Chart → Detail:TSLA (từ tap stock area) | stack: ["chart"]                       |
| NAV-08 | Chart → Detail:TSLA → back              | stack: [] → về Chart                   |
| NAV-09 | Watchlist → Detail:NVDA                 | stack: ["watchlist"]                   |
| NAV-10 | Watchlist → Detail:NVDA → back          | stack: [] → về Watchlist               |
| NAV-11 | Search → Detail:TSLA                    | stack: ["search"]                      |
| NAV-12 | Search → Detail:TSLA → back             | stack: [] → về Search                  |
| NAV-13 | Dashboard → Account → Logout            | stack: [] → về Login (clear all)       |
| NAV-14 | Chart → Home (bottom nav)               | stack: [] → về Dashboard               |
| NAV-15 | Any tab → Any tab (bottom nav)          | stack: [] (always clear on tab switch) |

---

## 13. CHART SCREEN — MOCK DATA SPEC

### Candlestick data per stock (mỗi stock cần ~30 candles cho 1M range):

```
Mỗi candle = { open, high, low, close, volume, date }

AAPL 1M data: trending upward from ~$182 → $189.84
TSLA 1M data: volatile, trending down from ~$260 → $248.42
NVDA 1M data: strong uptrend from ~$820 → $875.28
MSFT 1M data: steady uptrend from ~$405 → $415.56
GOOGL 1M data: slight decline from ~$160 → $155.72
AMZN 1M data: uptrend from ~$175 → $185.07
META 1M data: uptrend from ~$485 → $505.95
AMD 1M data: decline from ~$185 → $178.32
```

### MA values (cập nhật per stock):

```
MA7  = average of last 7 candles close
MA25 = average of last 25 candles close
MA99 = trend line (vì chỉ có 30 candles, dùng approximate)
```

### Các time ranges khác (simplified mock):

- **1D**: 24 data points (hourly), intraday pattern
- **1W**: 5 candles (daily), last 5 trading days
- **1M**: 30 candles (daily) — DEFAULT
- **3M**: 60 candles (sampled to 30)
- **6M**: 120 candles (sampled to 30)
- **1Y**: 252 candles (sampled to 30)
- **ALL**: 500 candles (sampled to 30)

Nếu chưa implement multi-range data: giữ cùng 1 bộ 30 candles cho mọi range, chỉ đổi visual range selector.

---

## 14. TỔNG HỢP SỐ LIỆU

| Metric                      | Số lượng                                                                             |
| --------------------------- | ------------------------------------------------------------------------------------ |
| Tổng screens                | **8** (thêm Chart)                                                                   |
| Flow cases: Login           | 17                                                                                   |
| Flow cases: Dashboard       | 16                                                                                   |
| Flow cases: Watchlist       | 13                                                                                   |
| Flow cases: Search          | 18                                                                                   |
| Flow cases: News            | 15                                                                                   |
| Flow cases: Account         | 24                                                                                   |
| Flow cases: Stock Detail    | 18                                                                                   |
| Flow cases: **Chart (MỚI)** | **60**                                                                               |
| Flow cases: Bottom Nav      | 10                                                                                   |
| Flow cases: Theme           | 8                                                                                    |
| Flow cases: i18n            | 12                                                                                   |
| Flow cases: Navigation      | 15                                                                                   |
| **Tổng flow cases**         | **~226**                                                                             |
| Dialogs                     | 3 (remove stock, logout, indicators popup)                                           |
| Toggles                     | 4 + N indicators (dark mode, push notif, price alerts, biometric, MA, RSI, MACD...)  |
| TextFields                  | 3 (email, password, search)                                                          |
| Navigation paths            | 15 unique paths                                                                      |
| Bottom nav tabs             | **5** (Home, Chart, Watchlist, Search, News)                                         |
| Theme variations            | 2 × 8 screens = 16 screen states                                                     |
| Language variations         | 2 × 8 screens = 16 screen states                                                     |
| Total visual states         | **~72** (8 screens × 2 themes × 2 langs + dialogs + empty states + indicator combos) |
