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

    OnTheFly.setUI(
        Column({ style: "container" }, [
            // Header
            Text({ text: "Stock Detail", style: "title" }),
            Text({ text: "Data received from Home screen", style: "caption" }),

            Spacer({ style: "sectionGap" }),

            // Stock info card
            Column({ style: "infoCard" }, [
                Text({ text: stockName, style: "subtitle" }),
                Row({ style: "buttonRow" }, [
                    Text({ text: "Code: ", style: "label" }),
                    Text({ text: stockCode, style: "value" })
                ]),
                Row({ style: "buttonRow" }, [
                    Text({ text: "Price: ", style: "label" }),
                    Text({ text: "" + price, style: "value" })
                ]),
                Text({ id: "favStatus", text: "☆ Not Favorited", style: "caption" })
            ]),

            Spacer({ style: "sectionGap" }),

            // Action buttons
            Row({ style: "buttonRow" }, [
                Button({ text: "★ Favorite", onClick: "toggleFavorite", style: "actionButton" }),
                Button({ text: "Refresh Data", onClick: "requestStockData", style: "actionButton" })
            ]),

            Spacer({ style: "smallGap" }),

            // Navigation buttons
            Button({ text: "← Go Back", onClick: "goBack", style: "backButton" }),

            Spacer({ style: "sectionGap" }),

            // Debug info
            Text({ text: "Raw data: " + JSON.stringify(receivedData), style: "caption" })
        ])
    );
}

// ─── Initial render (no data yet) ───────────────────────────
function render() {
    OnTheFly.setUI(
        Column({ style: "container" }, [
            Text({ text: "Stock Detail", style: "title" }),
            Text({ text: "Waiting for data...", style: "caption" }),
            Spacer({ style: "sectionGap" }),
            Button({ text: "← Go Back", onClick: "goBack", style: "backButton" })
        ])
    );
}

render();
