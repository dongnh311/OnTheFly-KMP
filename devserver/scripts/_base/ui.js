// ═══════════════════════════════════════════════════════════
//  UI Builder — Shorthand functions for creating components
//  Usage: Column({ alignment: "center" }, [ Text({ text: "hi" }) ])
//  Types: see devserver/types/onthefly.d.ts
// ═══════════════════════════════════════════════════════════

function _c(type, propsOrChildren, children) {
    if (Array.isArray(propsOrChildren)) {
        return { type: type, children: propsOrChildren };
    }
    var node = { type: type };
    if (propsOrChildren) node.props = propsOrChildren;
    if (children) node.children = children;
    return node;
}

// ─── Layout ───────────────────────────────────────────────
function Column(props, children) { return _c("Column", props, children); }
function Row(props, children) { return _c("Row", props, children); }
function Box(props, children) { return _c("Box", props, children); }
function Spacer(props) { return _c("Spacer", props); }
function Divider(props) { return _c("Divider", props); }
function Card(props, children) { return _c("Card", props, children); }

// ─── Display ──────────────────────────────────────────────
function Text(props) { return _c("Text", props); }
function Img(props) { return _c("Image", props); }
function Icon(props) { return _c("Icon", props); }
function IconBtn(props) { return _c("IconButton", props); }
function Badge(props) { return _c("Badge", props); }
function Avatar(props) { return _c("Avatar", props); }
function Progress(props) { return _c("ProgressBar", props); }

// ─── Input ────────────────────────────────────────────────
function TextField(props) { return _c("TextField", props); }
function Button(props) { return _c("Button", props); }
function Toggle(props) { return _c("Toggle", props); }
function Checkbox(props) { return _c("Checkbox", props); }
function RadioGroup(props) { return _c("RadioGroup", props); }
function Dropdown(props) { return _c("Dropdown", props); }
function SearchBar(props) { return _c("SearchBar", props); }
function Slider(props) { return _c("Slider", props); }
function Chip(props) { return _c("Chip", props); }

// ─── Lists ────────────────────────────────────────────────
function LazyColumn(props, children) { return _c("LazyColumn", props, children); }
function LazyRow(props, children) { return _c("LazyRow", props, children); }
function Grid(props, children) { return _c("Grid", props, children); }

// ─── Navigation ───────────────────────────────────────────
function TopAppBar(props) { return _c("TopAppBar", props); }
function BottomNavBar(props) { return _c("BottomNavBar", props); }
function TabBar(props) { return _c("TabBar", props); }
function TabContent(props, children) { return _c("TabContent", props, children); }
function Drawer(props, children) { return _c("Drawer", props, children); }

// ─── Feedback / Overlay ───────────────────────────────────
function Popup(props, children) { return _c("FullScreenPopup", props, children); }
function ConfirmDialog(props) { return _c("ConfirmDialog", props); }
function BottomSheet(props, children) { return _c("BottomSheet", props, children); }
function Snackbar(props) { return _c("Snackbar", props); }
function Loading(props) { return _c("LoadingOverlay", props); }

// ─── Advanced ─────────────────────────────────────────────
function RichText(props) { return _c("RichText", props); }
function SwipeToAction(props, child) { return _c("SwipeToAction", props, child ? [child] : undefined); }

// ─── Charts ───────────────────────────────────────────────
function CandlestickChart(props) { return _c("CandlestickChart", props); }
function LineChart(props) { return _c("LineChart", props); }
