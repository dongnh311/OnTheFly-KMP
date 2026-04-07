// ─── State ───────────────────────────────────────────────────
var receivedData = null;
var isFavorite = false;

// ─── Lifecycle ──────────────────────────────────────────────

function onCreateView() {
    OnTheFly.log("Detail screen created");
}

function onViewData(data) {
    OnTheFly.log("Detail received data: " + JSON.stringify(data));
    receivedData = data;
    renderWithData();
}

function onBackPressed() {
    goBack();
}

// ─── Actions ────────────────────────────────────────────────

function goBack() {
    OnTheFly.sendToNative("goBack");
}

function toggleFavorite() {
    isFavorite = !isFavorite;
    OnTheFly.update("favStatus", {
        text: isFavorite ? "★ Favorited" : "☆ Not Favorited"
    });
    OnTheFly.sendToNative("showToast", {
        message: isFavorite ? "Added to favorites" : "Removed from favorites"
    });
}

function navigateHome() {
    OnTheFly.sendToNative("navigate", {
        screen: "demo-app",
        data: { returnFrom: "detail", message: "Returned from detail!" }
    });
}

function requestStockData() {
    OnTheFly.sendToNative("showToast", {
        message: "Requesting stock data for: " + (receivedData ? receivedData.stockCode : "N/A")
    });
    OnTheFly.sendToNative("sendRequest", {
        dataSet: "stockDetail",
        params: { symbol: receivedData ? receivedData.stockCode : "" }
    });
}

// ─── Render ─────────────────────────────────────────────────

function renderWithData() {
    var stockCode = receivedData ? receivedData.stockCode : "N/A";
    var stockName = receivedData ? (receivedData.stockName || stockCode) : "No data";
    var price = receivedData ? (receivedData.price || "0.00") : "0.00";

    OnTheFly.setUI({
        type: "Column",
        props: { style: "container" },
        children: [
            // Header
            { type: "Text", props: { text: "Stock Detail", style: "title" } },
            { type: "Text", props: { text: "Data received from Home screen", style: "caption" } },

            { type: "Spacer", props: { style: "sectionGap" } },

            // Stock info card
            {
                type: "Column",
                props: { style: "infoCard" },
                children: [
                    { type: "Text", props: { text: stockName, style: "subtitle" } },
                    {
                        type: "Row",
                        props: { style: "buttonRow" },
                        children: [
                            { type: "Text", props: { text: "Code: ", style: "label" } },
                            { type: "Text", props: { text: stockCode, style: "value" } }
                        ]
                    },
                    {
                        type: "Row",
                        props: { style: "buttonRow" },
                        children: [
                            { type: "Text", props: { text: "Price: ", style: "label" } },
                            { type: "Text", props: { text: "" + price, style: "value" } }
                        ]
                    },
                    { type: "Text", props: { id: "favStatus", text: "☆ Not Favorited", style: "caption" } }
                ]
            },

            { type: "Spacer", props: { style: "sectionGap" } },

            // Action buttons
            {
                type: "Row",
                props: { style: "buttonRow" },
                children: [
                    { type: "Button", props: { text: "★ Favorite", onClick: "toggleFavorite", style: "actionButton" } },
                    { type: "Button", props: { text: "Refresh Data", onClick: "requestStockData", style: "actionButton" } }
                ]
            },

            { type: "Spacer", props: { style: "smallGap" } },

            // Navigation buttons
            { type: "Button", props: { text: "← Go Back", onClick: "goBack", style: "backButton" } },

            { type: "Spacer", props: { style: "sectionGap" } },

            // Debug info
            { type: "Text", props: { text: "Raw data: " + JSON.stringify(receivedData), style: "caption" } }
        ]
    });
}

// ─── Initial render (no data yet) ───────────────────────────
function render() {
    OnTheFly.setUI({
        type: "Column",
        props: { style: "container" },
        children: [
            { type: "Text", props: { text: "Stock Detail", style: "title" } },
            { type: "Text", props: { text: "Waiting for data...", style: "caption" } },
            { type: "Spacer", props: { style: "sectionGap" } },
            { type: "Button", props: { text: "← Go Back", onClick: "goBack", style: "backButton" } }
        ]
    });
}

render();
