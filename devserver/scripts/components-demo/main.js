// ═══════════════════════════════════════════════════════════
//  Components Demo — Phase 1 Showcase
//  Demonstrates: Card, Box, Divider, Icon, IconButton,
//  TextField, Checkbox, RadioGroup, Dropdown, SearchBar,
//  LazyColumn, Grid
// ═══════════════════════════════════════════════════════════

var formData = {
    name: "",
    email: "",
    gender: null,
    country: null,
    newsletter: false,
    searchQuery: ""
};

function onCreateView() {
    OnTheFly.log.d("Components demo loaded");
}

// ─── Input Handlers ────────────────────────────────────────

function onTextChanged(id, data) {
    if (id === "nameField") {
        formData.name = data.value;
    } else if (id === "emailField") {
        formData.email = data.value;
    } else if (id === "searchBar") {
        formData.searchQuery = data.value;
        OnTheFly.update("searchBar", { value: data.value });
    }
}

function onCheckChanged(id, data) {
    if (id === "newsletter") {
        formData.newsletter = data.checked;
        OnTheFly.update("newsletter", { checked: data.checked });
    }
}

function onRadioChanged(id, data) {
    if (id === "genderGroup") {
        formData.gender = data.value;
        OnTheFly.update("genderGroup", { selected: data.value });
    }
}

function onDropdownChanged(id, data) {
    if (id === "countryDropdown") {
        formData.country = data.value;
        OnTheFly.update("countryDropdown", { selected: data.value });
    }
}

function onSubmit(id, data) {
    OnTheFly.sendToNative("showToast", { message: "Submitted: " + data.value });
}

function onClick(id) {
    if (id === "submitBtn") {
        var msg = "Name: " + formData.name + ", Email: " + formData.email +
                  ", Gender: " + formData.gender + ", Country: " + formData.country +
                  ", Newsletter: " + formData.newsletter;
        OnTheFly.sendToNative("showToast", { message: msg });
    } else if (id === "backBtn") {
        OnTheFly.sendToNative("goBack", {});
    }
}

// ─── UI ────────────────────────────────────────────────────

function render() {
    OnTheFly.setUI({
        type: "Column",
        props: { style: "container", scrollable: true },
        children: [
            // ── Header with Box overlay ──
            {
                type: "Box",
                props: { width: "fill", height: 120, background: "#2196F3", borderRadius: 16, contentAlignment: "center" },
                children: [
                    { type: "Text", props: { text: "Phase 1 Components", fontSize: 22, fontWeight: "bold", color: "#FFFFFF" } }
                ]
            },

            { type: "Spacer", props: { height: 16 } },

            // ── Card Demo ──
            { type: "Text", props: { text: "Card Component", style: "h2" } },
            {
                type: "Card",
                props: { id: "demoCard", elevation: 6, borderRadius: 16, padding: 16 },
                children: [
                    {
                        type: "Row",
                        props: { spacing: 12, crossAlignment: "center" },
                        children: [
                            { type: "Icon", props: { name: "star", size: 32, color: "#FFC107" } },
                            {
                                type: "Column",
                                props: { spacing: 4, width: "wrap" },
                                children: [
                                    { type: "Text", props: { text: "Featured Card", fontSize: 16, fontWeight: "bold" } },
                                    { type: "Text", props: { text: "Card with icon, elevation shadow, and rounded corners", style: "caption" } }
                                ]
                            }
                        ]
                    }
                ]
            },

            { type: "Divider", props: { color: "#E0E0E0", marginVertical: 8 } },

            // ── Icon Buttons ──
            { type: "Text", props: { text: "Icon & IconButton", style: "h2" } },
            {
                type: "Row",
                props: { spacing: 8, alignment: "center" },
                children: [
                    { type: "Icon", props: { name: "home", size: 28, color: "#2196F3" } },
                    { type: "Icon", props: { name: "favorite", size: 28, color: "#F44336" } },
                    { type: "Icon", props: { name: "settings", size: 28, color: "#757575" } },
                    { type: "Icon", props: { name: "notifications", size: 28, color: "#FF9800" } },
                    { type: "Spacer", props: { width: 16 } },
                    { type: "IconButton", props: { id: "backBtn", icon: "arrow_back", color: "#333333" } },
                    { type: "IconButton", props: { id: "searchIconBtn", icon: "search", color: "#2196F3" } }
                ]
            },

            { type: "Divider", props: { marginVertical: 8 } },

            // ── Search Bar ──
            { type: "Text", props: { text: "SearchBar", style: "h2" } },
            {
                type: "SearchBar",
                props: {
                    id: "searchBar",
                    value: "",
                    placeholder: "Search components...",
                    showCancel: true,
                    onChanged: "onTextChanged",
                    onSubmit: "onSubmit",
                    onCancel: "onCancelSearch"
                }
            },

            { type: "Divider", props: { marginVertical: 8 } },

            // ── Form Inputs ──
            { type: "Text", props: { text: "Form Inputs", style: "h2" } },

            // TextField
            {
                type: "TextField",
                props: {
                    id: "nameField",
                    label: "Full Name",
                    placeholder: "Enter your name",
                    leadingIcon: "person",
                    onChanged: "onTextChanged"
                }
            },
            {
                type: "TextField",
                props: {
                    id: "emailField",
                    label: "Email",
                    placeholder: "Enter your email",
                    type: "email",
                    leadingIcon: "email",
                    onChanged: "onTextChanged",
                    onSubmit: "onSubmit"
                }
            },

            // Checkbox
            {
                type: "Checkbox",
                props: {
                    id: "newsletter",
                    label: "Subscribe to newsletter",
                    checked: false,
                    onChanged: "onCheckChanged"
                }
            },

            // RadioGroup
            { type: "Text", props: { text: "Gender", style: "body" } },
            {
                type: "RadioGroup",
                props: {
                    id: "genderGroup",
                    options: [
                        { value: "male", label: "Male" },
                        { value: "female", label: "Female" },
                        { value: "other", label: "Other" }
                    ],
                    direction: "horizontal",
                    onChanged: "onRadioChanged"
                }
            },

            // Dropdown
            {
                type: "Dropdown",
                props: {
                    id: "countryDropdown",
                    label: "Country",
                    placeholder: "Select country...",
                    options: [
                        { value: "vn", label: "Vietnam" },
                        { value: "th", label: "Thailand" },
                        { value: "sg", label: "Singapore" },
                        { value: "jp", label: "Japan" },
                        { value: "us", label: "United States" }
                    ],
                    onChanged: "onDropdownChanged"
                }
            },

            { type: "Spacer", props: { height: 8 } },

            // Submit Button (with loading, icon)
            {
                type: "Button",
                props: {
                    id: "submitBtn",
                    text: "Submit Form",
                    icon: "send",
                    variant: "filled",
                    width: "fill",
                    onClick: "onClick"
                }
            },

            { type: "Divider", props: { marginVertical: 8 } },

            // ── Grid Demo ──
            { type: "Text", props: { text: "Grid Layout (2 columns)", style: "h2" } },
            {
                type: "Grid",
                props: {
                    columns: 2,
                    spacing: 8,
                    items: [
                        {
                            type: "Card", props: { id: "grid-1", padding: 12, borderRadius: 8 },
                            children: [
                                { type: "Icon", props: { name: "home", size: 32, color: "#2196F3" } },
                                { type: "Text", props: { text: "Home", fontSize: 12, textAlign: "center" } }
                            ]
                        },
                        {
                            type: "Card", props: { id: "grid-2", padding: 12, borderRadius: 8 },
                            children: [
                                { type: "Icon", props: { name: "search", size: 32, color: "#4CAF50" } },
                                { type: "Text", props: { text: "Search", fontSize: 12, textAlign: "center" } }
                            ]
                        },
                        {
                            type: "Card", props: { id: "grid-3", padding: 12, borderRadius: 8 },
                            children: [
                                { type: "Icon", props: { name: "person", size: 32, color: "#FF9800" } },
                                { type: "Text", props: { text: "Profile", fontSize: 12, textAlign: "center" } }
                            ]
                        },
                        {
                            type: "Card", props: { id: "grid-4", padding: 12, borderRadius: 8 },
                            children: [
                                { type: "Icon", props: { name: "settings", size: 32, color: "#9C27B0" } },
                                { type: "Text", props: { text: "Settings", fontSize: 12, textAlign: "center" } }
                            ]
                        }
                    ]
                }
            },

            { type: "Spacer", props: { height: 16 } },

            // ── Button Variants ──
            { type: "Text", props: { text: "Button Variants", style: "h2" } },
            {
                type: "Row",
                props: { spacing: 8, alignment: "center" },
                children: [
                    { type: "Button", props: { id: "btn1", text: "Filled", variant: "filled" } },
                    { type: "Button", props: { id: "btn2", text: "Outlined", variant: "outlined" } },
                    { type: "Button", props: { id: "btn3", text: "Text", variant: "text" } }
                ]
            },

            { type: "Spacer", props: { height: 24 } }
        ]
    });
}

render();
