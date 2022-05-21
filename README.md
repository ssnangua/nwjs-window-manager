# nwjs-window-manager

Window manager for NW.js.

A simple way to manage windows, including the following features:

- Manage the parent/child relations of windows
  - The child window is always on top of the parent window
  - If the window is closed, all child windows also be closed
  - If the window is modal or any child is modal, it will not be closed
- Append a translucent mask on the body to simulate a modal window
- Merge EventEmitter to make communication between windows easier

## Install

```bash
npm install nwjs-window-manager
```

## Usage

```js
const { wm } = require("nwjs-window-manager");

// Promise style
async function main() {
  // Open a window
  const win1 = await wm.open("1.html");

  // Open a child window of win1
  const win2 = await win1.open("2.html");
  // Or
  const win3 = await wm.open("3.html", { parent: win1 });

  // More options
  const win4 = await win1.open("4.html", {
    // Set a name to open a singleton window
    name: "singleton",
    // win1 will be modal like
    modal: true,
    // Center relative to win1
    position: "parentCenter",
    // Other nw.Window.open() options
    width: 300,
    height: 200,
    // ...
  });

  // Manage an existing nw window
  const curWin = wm(nw.Window.get());
  const win5 = curWin.open("5.html");

  nw.Window.open("6.html", (win6) => {
    nw.Window.open("7.html", (win7) => {
      // Make win7 a modal child window of win6
      wm(win7, { parent: win6, modal: true });
    });
  });
}

main();
```

### Communication between windows

`1.html`

```js
// Manage the current nw window as `win1`
const win1 = wm(nw.Window.get(), { name: "win1" });

win1.open("2.html", { name: "win2" }).then((win2) => {
  // Listen message from win2
  win2.$on("from_win2", (msg) => {
    console.log("[from_win2]", msg);
  });

  // After win2 is loaded, you can send message to win2
  win2.on("loaded", () => {
    win2.$emit("emit_win2", "Hello win2, I am win1");
  });
});

win1.$on("win1_on", (msg) => {
  console.log("[win1_on]", msg);
});
```

`2.html`

```js
// Get the current WM_Window through wm.get()
const win2 = wm.get();

// Or get win2 by name
// const win2 = wm("win2");

// Or get win2 by the current nw window
// const win2 = wm(nw.Window.get())

// Listen message
win2.$on("emit_win2", (msg) => {
  console.log("[emit_win2]", msg);
});

// Send message
win2.$emit("from_win2", "Hello, I am win2");

// You can also send messages through win1
wm("win1").$emit("win1_on", "Hello win1, I am win2");
```

## API

### `wm(maybeWin[, options])`

Manage a nw.win as WM_Window, or get a WM_Window by name or nw.win.

- `maybeWin` WM_Window | nw.win | string - win or win's name
- `options` WM_Options (optional)
  - `name` string (optional) - Window's name.
  - `parent` WM_Window | nw.win | string (optional) - Parent window.
  - `modal` boolean (optional) - Whether to make the parent window modal.
  - `always_on_top` boolean (optional) - Whether the window is always on top of other windows.
  - `position` string (optional) - Controls where window will be put. Can be `null` or `center` or `mouse` or **`parentCenter`**

Returns `WM_Window | undefined` - Returns wm window if `maybeWin` is valid, otherwise returns undefined.

### `wm.open(url[, options][, callback]): Promise<WM_Window>`

Open a new WM_Window.

- `url` string (optional) - URL to be loaded in the opened window
- `options` WM_OpenOptions (optional) - Open options
  - `name` string (optional) - Window's name.
  - `parent` WM_Window (optional) - Parent window.
  - `modal` boolean (optional) - Whether to make the parent window modal.
  - `always_on_top` boolean (optional) - Whether the window is always on top of other windows.
  - `position` string (optional) - Controls where window will be put. Can be `null` or `center` or `mouse` or **`parentCenter`**
  - Other `nw.Window.open()`'s options
- `callback` function (optional) - Callback when with the opened WM_Window instance
  - `win` WM_Window - The opened WM_Window instance

Returns `Promise<WM_Window>` - Resolve with the opened WM_Window instance.

### `wm.get([win])`

Get a WM_Window by name or nw.win.

- `win` WM_Window | nw.win | string (optional) - win or win's name

Returns `WM_Window`.

When `win` is omitted, will return the current WM_Window.

### `wm.getAll([callback])`

Get all WM_Window instances.

- `callback` function (optional) - Callback with array of all WM_Window instances. Generally not needed because the return is fully synchronous.

Returns an array of all WM_Window instances.

### `wm.config(options)`

- `options` - Config options
  - `modalStyle` string (optional) - Modal style
  - `onAutoFocusTailWindow` function (optional) - Called when the tail window is auto focus

```js
wm.config({
  modalStyle: `.nwjs-window-manager-modal {
    background: rgba(0, 0, 0, 0.3);
  }`,
  onAutoFocusTailWindow(tailWin) {
    tailWin.requestAttention(2);
  },
});
```

### `WM_Window`

#### `wmWin.nwWin` nw.win (readonly)

Get the managed nw window.

#### `wmWin.name` string (readonly)

Get window's name.

#### `wmWin.parent` WM_Window

Parent window.

#### `wmWin.children` WM_Window[] (readonly)

Get child windows.

#### `wmWin.modalParent` boolean

Whether to make the parent window modal.

#### `wmWin.modal` boolean

Whether the window is modal.

#### `wmWin.alwaysOnTop` boolean

Whether the window is always on top of other windows.

#### `wmWin.isMinimize` boolean (readonly)

Get whether the window is minimize.

#### `wmWin.isMaximize` boolean (readonly)

Get whether the window is maximize.

#### `wmWin.open(url[, options][, callback]): Promise<WM_Window>`

Open a child window. See `wm.open()`.

#### `wmWin.$on(event: string, listener: Function): WM_Window`

Add a listener.

#### `wmWin.$off(event: string, listener: Function): WM_Window`

Remove a listener.

#### `wmWin.$emit(event: string, ...args: any[]): WM_Window`

Synchronously calls each of the listeners.
