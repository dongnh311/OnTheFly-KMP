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
    OnTheFly.setUI(
        Column({ style: "container", scrollable: true }, [
            // ── Header with Box overlay ──
            Box({ width: "fill", height: 120, background: "#2196F3", borderRadius: 16, contentAlignment: "center" }, [
                Text({ text: "Phase 1 Components", fontSize: 22, fontWeight: "bold", color: "#FFFFFF" })
            ]),

            Spacer({ height: 16 }),

            // ── Card Demo ──
            Text({ text: "Card Component", style: "h2" }),
            Card({ id: "demoCard", elevation: 6, borderRadius: 16, padding: 16 }, [
                Row({ spacing: 12, crossAlignment: "center" }, [
                    Icon({ name: "star", size: 32, color: "#FFC107" }),
                    Column({ spacing: 4, width: "wrap" }, [
                        Text({ text: "Featured Card", fontSize: 16, fontWeight: "bold" }),
                        Text({ text: "Card with icon, elevation shadow, and rounded corners", style: "caption" })
                    ])
                ])
            ]),

            Divider({ color: "#E0E0E0", marginVertical: 8 }),

            // ── Icon Buttons ──
            Text({ text: "Icon & IconButton", style: "h2" }),
            Row({ spacing: 8, alignment: "center" }, [
                Icon({ name: "home", size: 28, color: "#2196F3" }),
                Icon({ name: "favorite", size: 28, color: "#F44336" }),
                Icon({ name: "settings", size: 28, color: "#757575" }),
                Icon({ name: "notifications", size: 28, color: "#FF9800" }),
                Spacer({ width: 16 }),
                IconBtn({ id: "backBtn", icon: "arrow_back", color: "#333333" }),
                IconBtn({ id: "searchIconBtn", icon: "search", color: "#2196F3" })
            ]),

            Divider({ marginVertical: 8 }),

            // ── Search Bar ──
            Text({ text: "SearchBar", style: "h2" }),
            SearchBar({
                id: "searchBar",
                value: "",
                placeholder: "Search components...",
                showCancel: true,
                onChanged: "onTextChanged",
                onSubmit: "onSubmit",
                onCancel: "onCancelSearch"
            }),

            Divider({ marginVertical: 8 }),

            // ── Form Inputs ──
            Text({ text: "Form Inputs", style: "h2" }),

            // TextField
            TextField({
                id: "nameField",
                label: "Full Name",
                placeholder: "Enter your name",
                leadingIcon: "person",
                onChanged: "onTextChanged"
            }),
            TextField({
                id: "emailField",
                label: "Email",
                placeholder: "Enter your email",
                type: "email",
                leadingIcon: "email",
                onChanged: "onTextChanged",
                onSubmit: "onSubmit"
            }),

            // Checkbox
            Checkbox({
                id: "newsletter",
                label: "Subscribe to newsletter",
                checked: false,
                onChanged: "onCheckChanged"
            }),

            // RadioGroup
            Text({ text: "Gender", style: "body" }),
            RadioGroup({
                id: "genderGroup",
                options: [
                    { value: "male", label: "Male" },
                    { value: "female", label: "Female" },
                    { value: "other", label: "Other" }
                ],
                direction: "horizontal",
                onChanged: "onRadioChanged"
            }),

            // Dropdown
            Dropdown({
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
            }),

            Spacer({ height: 8 }),

            // Submit Button (with loading, icon)
            Button({
                id: "submitBtn",
                text: "Submit Form",
                icon: "send",
                variant: "filled",
                width: "fill",
                onClick: "onClick"
            }),

            Divider({ marginVertical: 8 }),

            // ── Grid Demo ──
            Text({ text: "Grid Layout (2 columns)", style: "h2" }),
            Grid({
                columns: 2,
                spacing: 8,
                items: [
                    Card({ id: "grid-1", padding: 12, borderRadius: 8 }, [
                        Icon({ name: "home", size: 32, color: "#2196F3" }),
                        Text({ text: "Home", fontSize: 12, textAlign: "center" })
                    ]),
                    Card({ id: "grid-2", padding: 12, borderRadius: 8 }, [
                        Icon({ name: "search", size: 32, color: "#4CAF50" }),
                        Text({ text: "Search", fontSize: 12, textAlign: "center" })
                    ]),
                    Card({ id: "grid-3", padding: 12, borderRadius: 8 }, [
                        Icon({ name: "person", size: 32, color: "#FF9800" }),
                        Text({ text: "Profile", fontSize: 12, textAlign: "center" })
                    ]),
                    Card({ id: "grid-4", padding: 12, borderRadius: 8 }, [
                        Icon({ name: "settings", size: 32, color: "#9C27B0" }),
                        Text({ text: "Settings", fontSize: 12, textAlign: "center" })
                    ])
                ]
            }),

            Spacer({ height: 16 }),

            // ── Button Variants ──
            Text({ text: "Button Variants", style: "h2" }),
            Row({ spacing: 8, alignment: "center" }, [
                Button({ id: "btn1", text: "Filled", variant: "filled" }),
                Button({ id: "btn2", text: "Outlined", variant: "outlined" }),
                Button({ id: "btn3", text: "Text", variant: "text" })
            ]),

            Spacer({ height: 24 })
        ])
    );
}

render();
