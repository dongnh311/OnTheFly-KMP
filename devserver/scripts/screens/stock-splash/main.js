// ═══════════════════════════════════════════════════════════
//  Splash Screen — StockPro
//  Auto-navigates to login after render
// ═══════════════════════════════════════════════════════════

var progress = 0;
var timer = null;

function onCreateView() {
    var theme = StockTheme.get();

    OnTheFly.setUI({
        type: "Column",
        props: {
            fillMaxSize: true,
            backgroundColor: theme.primary,
            horizontalAlignment: "center",
            verticalArrangement: "center"
        },
        children: [
            // Logo
            { type: "Text", props: { text: "📈", fontSize: 56 } },
            { type: "Spacer", props: { height: 16 } },

            // Title
            { type: "Text", props: { text: "On The Fly", fontSize: 26, fontWeight: "bold", color: theme.textPrimary, letterSpacing: -1 } },
            { type: "Spacer", props: { height: 2 } },
            { type: "Text", props: { text: "DYNAMIC STOCK TRACKER", fontSize: 11, color: theme.textSecondary, letterSpacing: 3 } },

            { type: "Spacer", props: { height: 36 } },

            // Progress bar
            {
                type: "Box",
                props: {
                    width: 160,
                    height: 3,
                    backgroundColor: theme.border,
                    cornerRadius: 2
                },
                children: [
                    {
                        type: "Box",
                        props: {
                            id: "progressBar",
                            width: 0,
                            height: 3,
                            backgroundColor: theme.accent,
                            cornerRadius: 2
                        }
                    }
                ]
            },

            { type: "Spacer", props: { height: 10 } },

            // Version
            { type: "Text", props: { text: "Powered by OnTheFly Engine v2.0", fontSize: 9, color: theme.textTertiary } }
        ]
    });

    // Animate progress and navigate
    animateProgress();
}

function animateProgress() {
    progress = 0;
    stepProgress();
}

function stepProgress() {
    progress = progress + 5;
    if (progress > 100) progress = 100;
    var barWidth = Math.floor(160 * progress / 100);
    OnTheFly.update("progressBar", { width: barWidth });

    if (progress >= 100) {
        // Navigate to login after completion
        OnTheFly.sendToNative("navigateClearStack", { screen: "stock-login" });
    }
}

// Since we can't use timers in QuickJS easily, navigate immediately
// The splash is shown briefly as the engine loads
function onVisible() {
    OnTheFly.update("progressBar", { width: 160 });
    OnTheFly.sendToNative("navigateClearStack", { screen: "stock-login" });
}
