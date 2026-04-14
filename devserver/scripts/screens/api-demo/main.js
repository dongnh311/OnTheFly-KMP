// ─── State ───────────────────────────────────────────────────
var statusText = "Ready";
var resultTitle = "";
var resultBody = "";
var postResult = "";
var todoTitle = "";
var todoCompleted = "";

// ─── Lifecycle ──────────────────────────────────────────────

function onCreateView() {
    OnTheFly.log("API demo created");
}

function onBackPressed() {
    OnTheFly.sendToNative("goBack");
}

function goBack() {
    OnTheFly.sendToNative("goBack");
}

// ─── API: GET single post ───────────────────────────────────

function fetchPost() {
    statusText = "Loading...";
    OnTheFly.update("status", { text: statusText, style: "loading" });
    OnTheFly.update("resultTitle", { text: "" });
    OnTheFly.update("resultBody", { text: "" });

    OnTheFly.sendToNative("sendRequest", {
        id: "getPost",
        url: "https://jsonplaceholder.typicode.com/posts/1",
        method: "GET"
    });
}

// ─── API: GET random post ───────────────────────────────────

function fetchRandomPost() {
    var postId = Math.floor(Math.random() * 100) + 1;
    statusText = "Loading post #" + postId + "...";
    OnTheFly.update("status", { text: statusText, style: "loading" });

    OnTheFly.sendToNative("sendRequest", {
        id: "getRandomPost",
        url: "https://jsonplaceholder.typicode.com/posts/" + postId,
        method: "GET"
    });
}

// ─── API: POST create ───────────────────────────────────────

function createPost() {
    statusText = "Creating post...";
    OnTheFly.update("status", { text: statusText, style: "loading" });
    OnTheFly.update("postResult", { text: "" });

    OnTheFly.sendToNative("sendRequest", {
        id: "createPost",
        url: "https://jsonplaceholder.typicode.com/posts",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            title: "OnTheFly Post",
            body: "Created from JavaScript via QuickJS engine!",
            userId: 1
        })
    });
}

// ─── API: GET todo ──────────────────────────────────────────

function fetchTodo() {
    var todoId = Math.floor(Math.random() * 200) + 1;
    statusText = "Loading todo #" + todoId + "...";
    OnTheFly.update("status", { text: statusText, style: "loading" });

    OnTheFly.sendToNative("sendRequest", {
        id: "getTodo",
        url: "https://jsonplaceholder.typicode.com/todos/" + todoId,
        method: "GET"
    });
}

// ─── Handle API Response ────────────────────────────────────

function onDataReceived(data) {
    OnTheFly.log("API response: " + data.requestId + " status=" + data.status);

    if (data.error) {
        statusText = "Error: " + data.error;
        OnTheFly.update("status", { text: statusText, style: "error" });
        return;
    }

    switch (data.requestId) {
        case "getPost":
        case "getRandomPost":
            statusText = "GET " + data.status + " OK";
            OnTheFly.update("status", { text: statusText, style: "success" });
            OnTheFly.update("resultTitle", { text: data.body.title || "" });
            OnTheFly.update("resultBody", { text: data.body.body || "" });
            break;

        case "createPost":
            statusText = "POST " + data.status + " Created";
            OnTheFly.update("status", { text: statusText, style: "success" });
            OnTheFly.update("postResult", {
                text: "Created post ID: " + data.body.id + "\nTitle: " + data.body.title
            });
            break;

        case "getTodo":
            statusText = "GET " + data.status + " OK";
            OnTheFly.update("status", { text: statusText, style: "success" });
            var done = data.body.completed ? "Done" : "Pending";
            OnTheFly.update("todoTitle", { text: data.body.title || "" });
            OnTheFly.update("todoStatus", { text: done, style: data.body.completed ? "success" : "error" });
            break;
    }
}

// ─── UI ─────────────────────────────────────────────────────

function render() {
    OnTheFly.setUI(
        Column({ style: "container" }, [
            Text({ text: "API Demo", style: "title" }),
            Text({ text: "JS calls API via native HTTP client", style: "caption" }),
            Text({ id: "status", text: statusText, style: "caption" }),

            Spacer({ style: "gap" }),

            // GET Post
            Column({ style: "card" }, [
                Text({ text: "GET — Fetch Post", style: "subtitle" }),
                Row({ style: "row" }, [
                    Button({ text: "Fetch #1", onClick: "fetchPost", style: "primaryBtn" }),
                    Button({ text: "Random", onClick: "fetchRandomPost", style: "secondaryBtn" })
                ]),
                Text({ id: "resultTitle", text: resultTitle, style: "subtitle" }),
                Text({ id: "resultBody", text: resultBody, style: "body" })
            ]),

            Spacer({ style: "smallGap" }),

            // POST Create
            Column({ style: "card" }, [
                Text({ text: "POST — Create Post", style: "subtitle" }),
                Button({ text: "Create New Post", onClick: "createPost", style: "postBtn" }),
                Text({ id: "postResult", text: postResult, style: "code" })
            ]),

            Spacer({ style: "smallGap" }),

            // GET Todo
            Column({ style: "card" }, [
                Text({ text: "GET — Random Todo", style: "subtitle" }),
                Button({ text: "Fetch Todo", onClick: "fetchTodo", style: "primaryBtn" }),
                Text({ id: "todoTitle", text: todoTitle, style: "body" }),
                Text({ id: "todoStatus", text: todoCompleted, style: "caption" })
            ]),

            Spacer({ style: "gap" }),

            Button({ text: "← Back to Home", onClick: "goBack", style: "backBtn" })
        ])
    );
}

render();
