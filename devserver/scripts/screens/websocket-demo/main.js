// WebSocket Demo - Realtime Communication
var messages = [];
var wsUrl = "wss://echo.websocket.org";

OnTheFly.state("status", "disconnected");
OnTheFly.state("messageInput", "");
OnTheFly.state("messageCount", 0);

function render() {
    OnTheFly.setUI(
        Column({ padding: 16, spacing: 12 }, [
            TopAppBar({
                title: "WebSocket Demo",
                subtitle: "Realtime Communication",
                navigationIcon: "arrow_back",
                onNavigationClick: "goBack"
            }),
            // Status
            Card({ padding: 16, borderRadius: 12 }, [
                Row({ spacing: 8 }, [
                    Icon({ name: "wifi", size: 20, color: "$state.status" === "connected" ? "#27AE60" : "#E74C3C" }),
                    Text({ id: "statusText", text: "Status: $state.status", style: "statusDisconnected" })
                ]),
                Text({ text: "Server: " + wsUrl, style: "subtitle" })
            ]),
            // Connect/Disconnect buttons
            Row({ spacing: 12 }, [
                Button({ id: "connectBtn", text: "Connect", style: "primaryButton", onClick: "doConnect" }),
                Button({ id: "disconnectBtn", text: "Disconnect", style: "dangerButton", onClick: "doDisconnect" })
            ]),
            // Send message
            Row({ spacing: 8 }, [
                TextField({ id: "msgInput", placeholder: "Type a message...", width: "fill" }),
                IconBtn({ id: "sendBtn", icon: "send", color: "#3498DB", onClick: "doSend" })
            ]),
            // Messages list
            Text({ id: "msgCount", text: "Messages: $state.messageCount", style: "subtitle" }),
            Divider({}),
            LazyColumn({ id: "messageList", spacing: 4, height: "fill" },
                buildMessageList()
            )
        ])
    );
}

function buildMessageList() {
    var items = [];
    for (var i = messages.length - 1; i >= 0; i--) {
        var msg = messages[i];
        var prefix = msg.sent ? ">> " : "<< ";
        var style = msg.sent ? "sentMessage" : "messageText";
        items.push(
            Text({ text: prefix + msg.text, style: style })
        );
    }
    if (items.length === 0) {
        items.push(Text({ text: "No messages yet. Connect and send something!", style: "subtitle" }));
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
