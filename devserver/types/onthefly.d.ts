// ═══════════════════════════════════════════════════════════
//  OnTheFly Engine — TypeScript Declarations for VS Code
//  Provides autocomplete & IntelliSense for JS scripts
// ═══════════════════════════════════════════════════════════

// ─── Color type ───────────────────────────────────────────
/** Hex color string, e.g. "#FF5722", "#00D4AA80" */
type Color = string;

/** Icon name from Material 3 icon set */
type IconName =
    | "home" | "settings" | "search" | "add" | "close" | "delete" | "edit"
    | "favorite" | "favorite_border" | "star" | "person" | "email" | "phone"
    | "lock" | "visibility" | "visibility_off" | "check" | "check_circle"
    | "error" | "warning" | "info" | "arrow_back" | "arrow_forward"
    | "arrow_drop_down" | "menu" | "more_vert" | "refresh" | "share"
    | "notifications" | "shopping_cart" | "location_on" | "calendar_today"
    | "access_time" | "camera" | "photo" | "send" | "done" | "clear"
    | "account_circle" | "thumb_up" | "chat" | "help" | "play_arrow"
    | "pause" | "stop" | "download" | "upload" | "copy" | "save" | "archive";

// ─── Animation ────────────────────────────────────────────

interface AnimationConfig {
    type?: "fadeIn" | "fadeOut" | "slideInLeft" | "slideInRight" | "slideInUp" | "slideInDown" | "scaleIn" | "scaleOut";
    duration?: number;
    delay?: number;
    easing?: "linear" | "easeIn" | "easeOut" | "easeInOut" | "spring";
}

interface StaggerAnimationConfig {
    type?: "fadeIn" | "slideInUp" | "slideInLeft" | "scaleIn";
    duration?: number;
    staggerDelay?: number;
}

// ─── Padding ──────────────────────────────────────────────

interface PaddingObject {
    top?: number;
    bottom?: number;
    start?: number;
    end?: number;
    horizontal?: number;
    vertical?: number;
}

// ─── Common Props (all components) ────────────────────────

interface CommonProps {
    /** Unique component ID (required for events/updates) */
    id?: string;
    /** Show/hide component */
    visible?: boolean;
    /** Style name from StyleRegistry */
    style?: string;
    /** Width: "fill", "wrap", or dp number */
    width?: "fill" | "wrap" | number;
    /** Height: "fill", "wrap", or dp number */
    height?: "fill" | "wrap" | number;
    /** Opacity (0.0–1.0) */
    opacity?: number;
    /** Background color (hex string) */
    background?: Color;
    /** Corner radius (dp) */
    borderRadius?: number;
    /** Alias for borderRadius */
    cornerRadius?: number;
    /** Border width (dp) */
    borderWidth?: number;
    /** Border color */
    borderColor?: Color;
    /** Uniform padding or per-side object */
    padding?: number | PaddingObject;
    /** Minimum width constraint (dp) */
    minWidth?: number;
    /** Maximum width constraint (dp) */
    maxWidth?: number;
    /** Minimum height constraint (dp) */
    minHeight?: number;
    /** Maximum height constraint (dp) */
    maxHeight?: number;
    /** Rotation in degrees */
    rotation?: number;
    /** Horizontal scale (1.0 = 100%) */
    scaleX?: number;
    /** Vertical scale (1.0 = 100%) */
    scaleY?: number;
    /** Horizontal translation (dp) */
    translateX?: number;
    /** Vertical translation (dp) */
    translateY?: number;
    /** Clip children that overflow bounds */
    clipToBounds?: boolean;
    /** Enter animation config */
    enterAnimation?: AnimationConfig;
    /** Exit animation config */
    exitAnimation?: AnimationConfig;
    /** Per-corner border radius */
    borderRadiusTopLeft?: number;
    borderRadiusTopRight?: number;
    borderRadiusBottomLeft?: number;
    borderRadiusBottomRight?: number;
}

// ─── Layout Components ────────────────────────────────────

interface ColumnProps extends CommonProps {
    /** Vertical spacing between children (dp) */
    spacing?: number;
    /** Horizontal alignment */
    alignment?: "start" | "center" | "end";
    /** Enable vertical scrolling */
    scrollable?: boolean;
    /** Flash animation background color */
    flashBackground?: Color;
    /** Flash animation duration (ms) */
    flashDuration?: number;
    /** Gradient colors array */
    backgroundGradient?: Color[];
    /** Gradient direction */
    gradientDirection?: "vertical" | "horizontal" | "diagonal";
    /** JS function name to call on click */
    onClick?: string;
}

interface RowProps extends CommonProps {
    /** Horizontal spacing between children (dp) */
    spacing?: number;
    /** Horizontal arrangement */
    alignment?: "start" | "center" | "end" | "spaceBetween" | "spaceAround" | "spaceEvenly";
    /** Vertical alignment */
    crossAlignment?: "top" | "center" | "bottom";
    /** Enable horizontal scrolling */
    scrollable?: boolean;
    /** Gradient colors */
    backgroundGradient?: Color[];
    gradientDirection?: "vertical" | "horizontal" | "diagonal";
    onClick?: string;
}

interface BoxProps extends CommonProps {
    /** 9-point content alignment */
    contentAlignment?: "topStart" | "topCenter" | "topEnd" | "centerStart" | "center" | "centerEnd" | "bottomStart" | "bottomCenter" | "bottomEnd";
    flashBackground?: Color;
    flashDuration?: number;
    backgroundGradient?: Color[];
    gradientDirection?: "vertical" | "horizontal" | "diagonal";
    onClick?: string;
}

interface SpacerProps {
    height?: number;
    width?: number;
}

interface DividerProps extends CommonProps {
    color?: Color;
    thickness?: number;
    marginHorizontal?: number;
    marginVertical?: number;
}

interface CardProps extends CommonProps {
    /** Inner padding (dp) */
    padding?: number | PaddingObject;
    /** Shadow elevation (dp) */
    elevation?: number;
    onClick?: string;
}

// ─── Display Components ───────────────────────────────────

interface TextProps extends CommonProps {
    /** Text content. Supports $state.key and $lang.key binding */
    text?: string;
    fontSize?: number;
    fontWeight?: "normal" | "bold" | "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900" | "semibold" | "medium" | "light";
    fontStyle?: "italic" | "normal";
    color?: Color;
    textAlign?: "start" | "center" | "end" | "justify";
    maxLines?: number;
    overflow?: "ellipsis" | "clip" | "visible";
    lineHeight?: number;
    letterSpacing?: number;
    textDecoration?: "underline" | "lineThrough";
    /** Allow user to select/copy text */
    selectable?: boolean;
    /** Parse simple HTML: <b>, <i>, <u>, <s>, <br>, <font> */
    html?: boolean;
    onClick?: string;
}

interface ImageProps extends CommonProps {
    url?: string;
    contentScale?: "fill" | "crop" | "inside" | "none" | "fit";
    borderRadius?: number;
    /** Color filter/tint overlay */
    tintColor?: Color;
    contentDescription?: string;
    onClick?: string;
}

interface IconProps extends CommonProps {
    name?: IconName;
    size?: number;
    color?: Color;
    onClick?: string;
}

interface IconButtonProps extends CommonProps {
    icon?: IconName;
    iconSize?: number;
    color?: Color;
    enabled?: boolean;
    onClick?: string;
}

interface BadgeProps extends CommonProps {
    count?: number;
    color?: Color;
    textColor?: Color;
}

interface AvatarProps extends CommonProps {
    name?: string;
    size?: number;
    background?: Color;
    borderWidth?: number;
    borderColor?: Color;
    onClick?: string;
}

interface ProgressBarProps extends CommonProps {
    /** Progress value (0.0–1.0) */
    progress?: number;
    type?: "linear" | "circular";
    color?: Color;
    trackColor?: Color;
    size?: number;
    indeterminate?: boolean;
}

// ─── Input Components ─────────────────────────────────────

interface TextFieldProps extends CommonProps {
    value?: string;
    placeholder?: string;
    label?: string;
    type?: "text" | "email" | "number" | "phone" | "password" | "multiline";
    maxLines?: number;
    maxLength?: number;
    enabled?: boolean;
    readOnly?: boolean;
    /** Error message (shows error state) */
    error?: string;
    helperText?: string;
    leadingIcon?: IconName;
    trailingIcon?: IconName;
    textColor?: Color;
    placeholderColor?: Color;
    background?: Color;
    borderColor?: Color;
    focusedBorderColor?: Color;
    cornerRadius?: number;
    /** Event handler name (triggers onTextChanged) */
    onChanged?: string;
    /** Event handler name (triggers onSubmit) */
    onSubmit?: string;
}

interface ButtonProps extends CommonProps {
    text?: string;
    variant?: "filled" | "outlined" | "text";
    icon?: IconName;
    enabled?: boolean;
    loading?: boolean;
    background?: Color;
    textColor?: Color;
    disabledColor?: Color;
    disabledTextColor?: Color;
    onClick?: string;
}

interface ToggleProps extends CommonProps {
    label?: string;
    checked?: boolean;
    enabled?: boolean;
    activeColor?: Color;
    inactiveColor?: Color;
    thumbColor?: Color;
    borderColor?: Color;
    scale?: number;
    onToggle?: string;
}

interface CheckboxProps extends CommonProps {
    label?: string;
    checked?: boolean;
    enabled?: boolean;
    color?: Color;
}

interface RadioGroupProps extends CommonProps {
    selected?: string;
    direction?: "vertical" | "horizontal";
    options?: Array<{ label: string; value: string }>;
}

interface DropdownProps extends CommonProps {
    selected?: string;
    placeholder?: string;
    label?: string;
    enabled?: boolean;
    options?: Array<{ label: string; value: string }>;
}

interface SearchBarProps extends CommonProps {
    value?: string;
    placeholder?: string;
    showCancel?: boolean;
    onChanged?: string;
    onSubmit?: string;
    onCancel?: string;
}

interface SliderProps extends CommonProps {
    value?: number;
    min?: number;
    max?: number;
    steps?: number;
    label?: string;
    showValue?: boolean;
    color?: Color;
}

interface ChipProps extends CommonProps {
    text?: string;
    selected?: boolean;
    icon?: IconName;
    background?: Color;
    selectedBackground?: Color;
    textColor?: Color;
    selectedTextColor?: Color;
    borderRadius?: number;
    closable?: boolean;
    onClick?: string;
    onClose?: string;
}

// ─── List Components ──────────────────────────────────────

interface LazyColumnProps extends CommonProps {
    spacing?: number;
    padding?: number;
    onEndReached?: string;
    endReachedThreshold?: number;
    refreshing?: boolean;
    onRefresh?: string;
    items?: UIComponent[];
    itemAnimation?: StaggerAnimationConfig;
}

interface LazyRowProps extends CommonProps {
    spacing?: number;
    padding?: number;
    paddingHorizontal?: number;
    paddingVertical?: number;
    items?: UIComponent[];
}

interface GridProps extends CommonProps {
    columns?: number;
    spacing?: number;
    horizontalSpacing?: number;
    verticalSpacing?: number;
    padding?: number;
    items?: UIComponent[];
}

// ─── Navigation Components ────────────────────────────────

interface TopAppBarProps extends CommonProps {
    title?: string;
    subtitle?: string;
    navigationIcon?: IconName;
    onNavigationClick?: string;
    background?: Color;
    titleColor?: Color;
    actions?: Array<{ icon: IconName; id: string }>;
}

interface BottomNavBarProps extends CommonProps {
    selected?: number;
    background?: Color;
    selectedColor?: Color;
    unselectedColor?: Color;
    showLabels?: boolean;
    items?: Array<{ icon: IconName; label: string }>;
    badgeCounts?: number[];
}

interface TabBarProps extends CommonProps {
    selected?: number;
    scrollable?: boolean;
    indicatorColor?: Color;
    tabs?: Array<{ text: string; icon?: IconName }>;
}

interface TabContentProps extends CommonProps {
    selectedIndex?: number;
    pages?: UIComponent[];
}

interface DrawerProps extends CommonProps {
    visible?: boolean;
    side?: "left" | "right";
    width?: number;
    background?: Color;
    selectedId?: string;
    onItemClick?: string;
    onDismiss?: string;
    header?: UIComponent;
    items?: Array<{ id: string; icon?: IconName; label: string; type?: "divider" }>;
}

// ─── Feedback / Overlay Components ────────────────────────

interface FullScreenPopupProps extends CommonProps {
    visible?: boolean;
    onDismiss?: string;
    animation?: "fade" | "slide" | "slideUp" | "scale" | "none";
    background?: Color;
}

interface ConfirmDialogProps extends CommonProps {
    visible?: boolean;
    title?: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
    confirmColor?: Color;
    onConfirm?: string;
    onCancel?: string;
}

interface BottomSheetProps extends CommonProps {
    visible?: boolean;
    background?: Color;
    borderRadius?: number;
    showHandle?: boolean;
    dismissOnClickOutside?: boolean;
    /** "full", "half", "wrap", or pixel number */
    height?: string | number;
    onDismiss?: string;
}

interface SnackbarProps extends CommonProps {
    message?: string;
    actionText?: string;
    duration?: number;
    background?: Color;
    textColor?: Color;
    actionColor?: Color;
    position?: "top" | "bottom";
    onAction?: string;
    onDismiss?: string;
}

interface LoadingOverlayProps extends CommonProps {
    visible?: boolean;
    message?: string;
    background?: Color;
    indicatorColor?: Color;
}

// ─── Advanced Components ──────────────────────────────────

interface RichTextProps extends CommonProps {
    textAlign?: string;
    maxLines?: number;
    spans?: Array<{
        text: string;
        fontSize?: number;
        fontWeight?: string;
        fontStyle?: string;
        color?: Color;
        textDecoration?: string;
        onClick?: string;
    }>;
}

interface SwipeToActionProps extends CommonProps {
    onAction?: string;
    rightActions?: Array<{ id: string; icon: IconName; color: Color }>;
    leftActions?: Array<{ id: string; icon: IconName; color: Color }>;
    child?: UIComponent;
}

// ─── Chart Components ─────────────────────────────────────

interface CandleData {
    o: number; h: number; l: number; c: number; v: number; t: number;
}

interface MAData {
    t: number; value: number;
}

interface CandlestickChartProps extends CommonProps {
    height?: number;
    fillHeight?: boolean;
    background?: Color;
    upColor?: Color;
    downColor?: Color;
    ma7Color?: Color;
    ma25Color?: Color;
    ma99Color?: Color;
    gridColor?: Color;
    textColor?: Color;
    showGrid?: boolean;
    showVolume?: boolean;
    volumeHeightRatio?: number;
    candleWidth?: number;
    candles?: CandleData[];
    ma7?: MAData[];
    ma25?: MAData[];
    ma99?: MAData[];
}

interface LineChartProps extends CommonProps {
    height?: number;
    background?: Color;
    lineColor?: Color;
    fillAlpha?: number;
    lineWidth?: number;
    borderRadius?: number;
    points?: number[];
}

// ─── UI Component Tree (Discriminated Union) ─────────────
// When you write type: "Column", VS Code narrows props to ColumnProps only.

interface _BaseComponent {
    children?: UIComponent[];
}

type UIComponent =
    | (_BaseComponent & { type: "Column";           props?: ColumnProps & { weight?: number } })
    | (_BaseComponent & { type: "Row";              props?: RowProps & { weight?: number } })
    | (_BaseComponent & { type: "Box";              props?: BoxProps & { weight?: number } })
    | (_BaseComponent & { type: "Spacer";           props?: SpacerProps })
    | (_BaseComponent & { type: "Divider";          props?: DividerProps })
    | (_BaseComponent & { type: "Card";             props?: CardProps & { weight?: number } })
    | (_BaseComponent & { type: "Text";             props?: TextProps & { weight?: number } })
    | (_BaseComponent & { type: "Image";            props?: ImageProps & { weight?: number } })
    | (_BaseComponent & { type: "Icon";             props?: IconProps })
    | (_BaseComponent & { type: "IconButton";       props?: IconButtonProps })
    | (_BaseComponent & { type: "Badge";            props?: BadgeProps })
    | (_BaseComponent & { type: "Avatar";           props?: AvatarProps })
    | (_BaseComponent & { type: "ProgressBar";      props?: ProgressBarProps })
    | (_BaseComponent & { type: "TextField";        props?: TextFieldProps & { weight?: number } })
    | (_BaseComponent & { type: "Button";           props?: ButtonProps & { weight?: number } })
    | (_BaseComponent & { type: "Toggle";           props?: ToggleProps })
    | (_BaseComponent & { type: "Switch";           props?: ToggleProps })
    | (_BaseComponent & { type: "Checkbox";         props?: CheckboxProps })
    | (_BaseComponent & { type: "RadioGroup";       props?: RadioGroupProps })
    | (_BaseComponent & { type: "Dropdown";         props?: DropdownProps })
    | (_BaseComponent & { type: "SearchBar";        props?: SearchBarProps })
    | (_BaseComponent & { type: "Slider";           props?: SliderProps })
    | (_BaseComponent & { type: "Chip";             props?: ChipProps })
    | (_BaseComponent & { type: "LazyColumn";       props?: LazyColumnProps })
    | (_BaseComponent & { type: "LazyRow";          props?: LazyRowProps })
    | (_BaseComponent & { type: "Grid";             props?: GridProps })
    | (_BaseComponent & { type: "TopAppBar";        props?: TopAppBarProps })
    | (_BaseComponent & { type: "BottomNavBar";     props?: BottomNavBarProps })
    | (_BaseComponent & { type: "TabBar";           props?: TabBarProps })
    | (_BaseComponent & { type: "TabContent";       props?: TabContentProps })
    | (_BaseComponent & { type: "Drawer";           props?: DrawerProps })
    | (_BaseComponent & { type: "FullScreenPopup";  props?: FullScreenPopupProps })
    | (_BaseComponent & { type: "ConfirmDialog";    props?: ConfirmDialogProps })
    | (_BaseComponent & { type: "BottomSheet";      props?: BottomSheetProps })
    | (_BaseComponent & { type: "Snackbar";         props?: SnackbarProps })
    | (_BaseComponent & { type: "LoadingOverlay";   props?: LoadingOverlayProps })
    | (_BaseComponent & { type: "RichText";         props?: RichTextProps })
    | (_BaseComponent & { type: "SwipeToAction";    props?: SwipeToActionProps })
    | (_BaseComponent & { type: "WebView";          props?: CommonProps & { url?: string; height?: number } })
    | (_BaseComponent & { type: "MapView";          props?: CommonProps & { latitude?: number; longitude?: number; height?: number } })
    | (_BaseComponent & { type: "VideoPlayer";      props?: CommonProps & { url?: string; height?: number } })
    | (_BaseComponent & { type: "CandlestickChart"; props?: CandlestickChartProps })
    | (_BaseComponent & { type: "LineChart";        props?: LineChartProps });

// ─── Native Actions ───────────────────────────────────────

type NativeAction =
    // Navigation
    | "navigate" | "goBack" | "navigateDelayed" | "navigateReplace" | "navigateClearStack"
    // Network
    | "sendRequest" | "cancelRequest"
    // UI
    | "showToast" | "showPopup" | "showSnackbar" | "hideKeyboard" | "setFocus" | "scrollTo" | "scrollToItem"
    // Data
    | "sendViewData" | "sharedStore"
    // Storage
    | "setStorage" | "getStorage" | "removeStorage"
    // Platform
    | "openUrl" | "copyToClipboard" | "readClipboard" | "share" | "getDeviceInfo"
    | "vibrate" | "setStatusBar" | "setScreenBrightness" | "keepScreenOn" | "setOrientation"
    // WebSocket
    | "connectWebSocket" | "sendWebSocket" | "closeWebSocket"
    // Logging
    | "log";

// ─── OnTheFly Global Object ──────────────────────────────

interface OnTheFlyShared {
    /** Get shared value by key */
    get(key: string): any;
    /** Set shared value */
    set(key: string, value: any): void;
    /** Remove key from shared store */
    remove(key: string): void;
    /** Get all shared values as object */
    getAll(): Record<string, any>;
    /** Get all shared keys */
    keys(): string[];
}

interface OnTheFlyStore {
    /** Get store value by key */
    get(key: string): any;
    /** Set store value (notifies watchers) */
    set(key: string, value: any): void;
    /** Watch for changes to a key */
    watch(key: string, callback: (value: any) => void): void;
}

interface OnTheFlyI18n {
    /** Set active locale (e.g. "en", "vi") */
    setLocale(locale: string): void;
    /** Get active locale */
    getLocale(): string;
    /** List available locales */
    getAvailableLocales(): string[];
}

interface OnTheFlyDebug {
    setEnabled(enabled: boolean): void;
    showConsole(): void;
    clearConsole(): void;
    enableInspector(): void;
    enableNetworkLog(): void;
    showPerformanceOverlay(): void;
    showStateInspector(): void;
}

interface OnTheFlyLog {
    /** Verbose */
    v(msg: string): void;
    /** Debug */
    d(msg: string): void;
    /** Info */
    i(msg: string): void;
    /** Warning */
    w(msg: string): void;
    /** Error */
    e(msg: string): void;
}

interface OnTheFlyValidationRule {
    type: "required" | "email" | "minLength" | "maxLength" | "pattern" | "min" | "max" | "match" | "custom";
    value?: any;
    message?: string;
}

interface OnTheFlyFormRules {
    [fieldName: string]: {
        value: any;
        rules: OnTheFlyValidationRule[];
    };
}

interface OnTheFlyEngine {
    // ── UI ──
    /** Set the full UI tree */
    setUI(tree: UIComponent): void;
    /** Partial update: merge props into component by ID */
    update(id: string, props: Partial<ComponentProps>): void;
    /** Register component styles */
    registerStyles(styles: string | Record<string, any>): void;
    /** Send native action */
    sendToNative(action: NativeAction, data?: Record<string, any>): void;

    // ── State ──
    /** Declare reactive state with initial value */
    state(key: string, initialValue: any): void;
    /** Get state value */
    getState(key: string): any;
    /** Set state value (triggers auto-update on bound components) */
    setState(key: string, value: any): void;
    /** Declare computed value with caching */
    computed(key: string, fn: () => any): void;

    // ── Shared Store (cross-screen) ──
    shared: OnTheFlyShared;

    // ── Global Store (with watchers) ──
    store: OnTheFlyStore;

    // ── i18n ──
    /** Translate key with optional parameter interpolation */
    t(key: string, params?: Record<string, any>): string;
    i18n: OnTheFlyI18n;

    // ── WebSocket ──
    /** Connect WebSocket */
    connectWS(url: string, options?: { id?: string; autoReconnect?: boolean; maxReconnectAttempts?: number }): void;
    /** Send WebSocket message */
    sendWS(message: string, id?: string): void;
    /** Close WebSocket connection */
    closeWS(id?: string): void;
    /** Get WebSocket state */
    getWSState(id?: string): "connecting" | "connected" | "disconnecting" | "disconnected";

    // ── Validation ──
    /** Validate single value against rules */
    validate(value: any, rules: OnTheFlyValidationRule[]): { valid: boolean; error?: string };
    /** Validate form */
    validateForm(formRules: OnTheFlyFormRules): Record<string, any> & { _valid: boolean };

    // ── Debug ──
    debug: OnTheFlyDebug;

    // ── Logging ──
    /** Info level log */
    log: ((msg: string) => void) & OnTheFlyLog;

    // ── Bundle Info ──
    /** Returns { name, version } of current bundle */
    getBundleInfo(): { name: string; version: string };
    /** Returns engine version string */
    getEngineVersion(): string;
}

// ─── Global declarations ──────────────────────────────────

declare var OnTheFly: OnTheFlyEngine;

// ─── AppState library ─────────────────────────────────────

interface AppStateLib {
    get(key: string, defaultValue?: any): any;
    set(key: string, value: any): void;
    remove(key: string): void;
    isLoggedIn(): boolean;
    login(username: string): void;
    logout(): void;
    getUserName(): string;
    trackVisit(screenName: string): void;
    getVisitCount(screenName: string): number;
    /** Check if dark mode is enabled */
    isDarkMode(): boolean;
    /** Set dark mode (persists to native storage) */
    setDarkMode(enabled: boolean): void;
}

declare var AppState: AppStateLib;

// ─── StockI18n library ────────────────────────────────────

interface StockI18nLib {
    /** Translate key using current language */
    t(key: string): string;
    /** Get current language ("en" or "vi") */
    getLang(): string;
    /** Set language (persists to native storage) */
    setLang(lang: "en" | "vi"): void;
}

declare var StockI18n: StockI18nLib;

/** Shorthand for StockI18n.t(key) */
declare function St(key: string): string;

// ─── StockTheme library ───────────────────────────────────

interface ThemeColors {
    primary: Color;
    surface: Color;
    surfaceVariant: Color;
    card: Color;
    accent: Color;
    accentDim: Color;
    textPrimary: Color;
    textSecondary: Color;
    textTertiary: Color;
    positive: Color;
    negative: Color;
    warning: Color;
    border: Color;
    inputBg: Color;
    navBar: Color;
    chartLine: Color;
    overlay: Color;
}

interface StockThemeLib {
    /** Get current theme colors */
    get(): ThemeColors;
    /** Check if dark mode is active */
    isDark(): boolean;
    /** Toggle dark/light mode, returns new theme */
    toggle(): ThemeColors;
    /** Dark theme preset */
    dark: ThemeColors;
    /** Light theme preset */
    light: ThemeColors;
}

declare var StockTheme: StockThemeLib;

// ─── StockData library ────────────────────────────────────

interface StockInfo {
    symbol: string;
    name: string;
    price: number;
    change: number;
    pct: number;
    volume?: string;
    mktCap?: string;
    pe?: string;
    open?: number;
    high?: number;
    low?: number;
}

interface StockAPIConfig {
    finnhub: { key: string; base: string; ws: string };
    marketaux: { key: string; base: string };
}

declare var StockAPI: StockAPIConfig;
declare var StockData: {
    stocks: StockInfo[];
    detail: Record<string, any>;
};

// ─── StockData helper functions ───────────────────────────

declare function fetchQuote(symbol: string): void;
declare function fetchQuotes(symbols: string[]): void;
declare function fetchProfile(symbol: string): void;
declare function fetchSearch(query: string): void;

// ─── Utils (base) ─────────────────────────────────────────

declare function formatNumber(num: number): string;
declare function formatDecimal(num: number, decimals?: number): string;
declare function formatPercent(num: number): string;
declare function formatPrice(num: number): string;
declare function capitalize(str: string): string;
declare function truncate(str: string, maxLen: number): string;
declare function isEmpty(val: any): boolean;
declare function formatTime(date?: Date | string): string;
declare function formatDate(date?: Date | string): string;
declare function timeAgo(dateStr: string): string;
declare function toast(message: string): void;
declare function navigate(screen: string, data?: any): void;
declare function goBack(): void;
declare function buildFlashPriceColumn(stock: StockInfo, theme: ThemeColors): UIComponent;
declare function changeColor(num: number): Color;
declare function changeSign(num: number): string;

// ─── StockBottomNav ───────────────────────────────────────

declare function buildStockBottomNav(activeTab: string, theme: ThemeColors): UIComponent;

// ─── UI Builder Functions (from _base/ui.js) ─────────────

// Layout
declare function Column(props?: ColumnProps & { weight?: number }, children?: UIComponent[]): UIComponent;
declare function Row(props?: RowProps & { weight?: number }, children?: UIComponent[]): UIComponent;
declare function Box(props?: BoxProps & { weight?: number }, children?: UIComponent[]): UIComponent;
declare function Spacer(props?: SpacerProps): UIComponent;
declare function Divider(props?: DividerProps): UIComponent;
declare function Card(props?: CardProps & { weight?: number }, children?: UIComponent[]): UIComponent;

// Display
declare function Text(props?: TextProps & { weight?: number }): UIComponent;
declare function Img(props?: ImageProps & { weight?: number }): UIComponent;
declare function Icon(props?: IconProps): UIComponent;
declare function IconBtn(props?: IconButtonProps): UIComponent;
declare function Badge(props?: BadgeProps): UIComponent;
declare function Avatar(props?: AvatarProps): UIComponent;
declare function Progress(props?: ProgressBarProps): UIComponent;

// Input
declare function TextField(props?: TextFieldProps & { weight?: number }): UIComponent;
declare function Button(props?: ButtonProps & { weight?: number }): UIComponent;
declare function Toggle(props?: ToggleProps): UIComponent;
declare function Checkbox(props?: CheckboxProps): UIComponent;
declare function RadioGroup(props?: RadioGroupProps): UIComponent;
declare function Dropdown(props?: DropdownProps): UIComponent;
declare function SearchBar(props?: SearchBarProps): UIComponent;
declare function Slider(props?: SliderProps): UIComponent;
declare function Chip(props?: ChipProps): UIComponent;

// Lists
declare function LazyColumn(props?: LazyColumnProps, children?: UIComponent[]): UIComponent;
declare function LazyRow(props?: LazyRowProps, children?: UIComponent[]): UIComponent;
declare function Grid(props?: GridProps, children?: UIComponent[]): UIComponent;

// Navigation
declare function TopAppBar(props?: TopAppBarProps): UIComponent;
declare function BottomNavBar(props?: BottomNavBarProps): UIComponent;
declare function TabBar(props?: TabBarProps): UIComponent;
declare function TabContent(props?: TabContentProps, children?: UIComponent[]): UIComponent;
declare function Drawer(props?: DrawerProps, children?: UIComponent[]): UIComponent;

// Feedback / Overlay
declare function Popup(props?: FullScreenPopupProps, children?: UIComponent[]): UIComponent;
declare function ConfirmDialog(props?: ConfirmDialogProps): UIComponent;
declare function BottomSheet(props?: BottomSheetProps, children?: UIComponent[]): UIComponent;
declare function Snackbar(props?: SnackbarProps): UIComponent;
declare function Loading(props?: LoadingOverlayProps): UIComponent;

// Advanced
declare function RichText(props?: RichTextProps): UIComponent;
declare function SwipeToAction(props?: SwipeToActionProps, child?: UIComponent): UIComponent;

// Charts
declare function CandlestickChart(props?: CandlestickChartProps): UIComponent;
declare function LineChart(props?: LineChartProps): UIComponent;

// ─── Lifecycle Events (implement in main.js) ─────────────

/** Called when screen is loaded and script evaluated */
declare function onCreateView(): void;
/** Called when app resumes */
declare function onResume(): void;
/** Called when app pauses */
declare function onPause(): void;
/** Called when screen is destroyed */
declare function onDestroy(): void;
/** Called when screen becomes visible */
declare function onVisible(): void;
/** Called when screen becomes invisible */
declare function onInvisible(): void;
/** Called when back button is pressed */
declare function onBackPressed(): void;
/** Called when HTTP response received */
declare function onDataReceived(data: { requestId: string; status: number; body: string; error?: string }): void;
/** Called when navigation data received */
declare function onViewData(data: any): void;
/** Called when WebSocket message received */
declare function onRealtimeData(data: { id: string; message: string }): void;
/** Called when WebSocket connected */
declare function onWSConnected(data: { id: string }): void;
/** Called when WebSocket disconnected */
declare function onWSDisconnected(data: { id: string }): void;
/** Called when WebSocket error */
declare function onWSError(data: { id: string; error: string }): void;
/** Called when engine error occurs */
declare function onError(error: { type: string; message: string; code?: string; details?: string }): void;

// ─── UI Event Handlers (implement in main.js) ────────────

/** Called when a component is clicked */
declare function onClick(id: string, data?: any): void;
/** Called when text field value changes */
declare function onTextChanged(id: string, data: { value: string }): void;
/** Called when text field is submitted */
declare function onSubmit(id: string, data: { value: string }): void;
/** Called when toggle/switch changes */
declare function onToggle(id: string, data: { checked: boolean }): void;
/** Called when checkbox changes */
declare function onCheckChanged(id: string, data: { checked: boolean }): void;
/** Called when radio selection changes */
declare function onRadioChanged(id: string, data: { value: string }): void;
/** Called when slider value changes */
declare function onSliderChanged(id: string, data: { value: number }): void;
/** Called when dropdown selection changes */
declare function onDropdownChanged(id: string, data: { value: string; label: string }): void;
/** Called when tab changes (BottomNavBar, TabBar) */
declare function onTabChanged(id: string, data: { index: number }): void;
/** Called when lazy list reaches end */
declare function onEndReached(id: string): void;
/** Called when pull-to-refresh triggered */
declare function onRefresh(id: string): void;
