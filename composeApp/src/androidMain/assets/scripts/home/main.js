// ═══════════════════════════════════════════════════════════
//  Home Screen
// ═══════════════════════════════════════════════════════════

function onCreateView() {
    OnTheFly.log.i("Home screen loaded");
}

function render() {
    OnTheFly.setUI({
        type: "Column",
        props: { style: "container" },
        children: [
            { type: "Spacer", props: { height: 200 } },
            { type: "Text", props: { text: "On The Fly", style: "appName" } },
        ]
    });
}

render();
