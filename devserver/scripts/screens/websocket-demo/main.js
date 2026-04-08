// WebSocket Demo - Realtime Communication
var messages = [];
var wsUrl = "wss://echo.websocket.org";

OnTheFly.state("status", "disconnected");
OnTheFly.state("messageInput", "");
OnTheFly.state("messageCount", 0);

function render() {
    OnTheFly.setUI({
        type: "Column", props: { padding: 16, spacing: 12 },
        children: [
            { type: "TopAppBar", props: {
                title: "WebSocket Demo",
                subtitle: "Realtime Communication",
                navigationIcon: "arrow_back",
                onNavigationClick: "goBack"
            }},
            // Status
            { type: "Card", props: { padding: 16, borderRadius: 12 },
                children: [
                    { type: "Row", props: { spacing: 8 },
                        children: [
                            { type: "Icon", props: { name: "wifi", size: 20, color: "$state.status" === "connected" ? "#27AE60" : "#E74C3C" }},
                            { type: "Text", props: { id: "statusText", text: "Status: $state.status", style: "statusDisconnected" }}
                        ]
                    },
                    { type: "Text", props: { text: "Server: " + wsUrl, style: "subtitle" }}
                ]
            },
            // Connect/Disconnect buttons
            { type: "Row", props: { spacing: 12 },
                children: [
                    { type: "Button", props: { id: "connectBtn", text: "Connect", style: "primaryButton", onClick: "doConnect" }},
                    { type: "Button", props: { id: "disconnectBtn", text: "Disconnect", style: "dangerButton", onClick: "doDisconnect" }}
                ]
            },
            // Send message
            { type: "Row", props: { spacing: 8 },
                children: [
                    { type: "TextField", props: { id: "msgInput", placeholder: "Type a message...", width: "fill" }},
                    { type: "IconButton", props: { id: "sendBtn", icon: "send", color: "#3498DB", onClick: "doSend" }}
                ]
            },
            // Messages list
            { type: "Text", props: { id: "msgCount", text: "Messages: $state.messageCount", style: "subtitle" }},
            { type: "Divider", props: {} },
            { type: "LazyColumn", props: { id: "messageList", spacing: 4, height: "fill" },
                children: buildMessageList()
            }
        ]
    });
}

function buildMessageList() {
    var items = [];
    for (var i = messages.length - 1; i >= 0; i--) {
        var msg = messages[i];
        var prefix = msg.sent ? ">> " : "<< ";
        var style = msg.sent ? "sentMessage" : "messageText";
        items.push({
            type: "Text",
            props: { text: prefix + msg.text, style: style }
        });
    }
    if (items.length === 0) {
        items.push({ type: "Text", props: { text: "No messages yet. Connect and send something!", style: "subtitle" }});
    }
    return items;
}

function doConnect() {
    OnTheFly.connectWS(wsUrl, { id: "echo", autoReconnect: true, maxReconnectAttempts: 3 });
    OnTheFly.setState("status", "connecting");
    updateStatus();
}

function doDisconnect() {
    OnTheFly.closeWS("echo");
    OnTheFly.setState("status", "disconnected");
    updateStatus();
}

function doSend() {
    var text = OnTheFly.getState("messageInput") || "";
    if (text.trim() === "") return;
    OnTheFly.sendWS(text, "echo");
    messages.push({ text: text, sent: true });
    OnTheFly.setState("messageCount", messages.length);
    OnTheFly.setState("messageInput", "");
    render();
}

function updateStatus() {
    var status = OnTheFly.getState("status");
    var style = status === "connected" ? "statusConnected" : (status === "connecting" ? "statusConnecting" : "statusDisconnected");
    OnTheFly.update("statusText", { text: "Status: " + status, style: style });
}

function onWSConnected(data) {
    OnTheFly.setState("status", "connected");
    messages.push({ text: "[Connected to " + wsUrl + "]", sent: false });
    OnTheFly.setState("messageCount", messages.length);
    updateStatus();
    render();
}

function onRealtimeData(data) {
    if (data && data.message) {
        messages.push({ text: data.message, sent: false });
        OnTheFly.setState("messageCount", messages.length);
        render();
    }
}

function onWSDisconnected(data) {
    OnTheFly.setState("status", "disconnected");
    var reason = data.reason ? " (" + data.reason + ")" : "";
    messages.push({ text: "[Disconnected" + reason + "]", sent: false });
    OnTheFly.setState("messageCount", messages.length);
    updateStatus();
    render();
}

function onWSError(data) {
    messages.push({ text: "[Error: " + (data.error || "Unknown") + "]", sent: false });
    OnTheFly.setState("messageCount", messages.length);
    render();
}

function onTextChanged(id, text) {
    if (id === "msgInput") {
        OnTheFly.setState("messageInput", text);
    }
}

function goBack() {
    OnTheFly.closeWS("echo");
    OnTheFly.sendToNative("goBack", {});
}

render();
