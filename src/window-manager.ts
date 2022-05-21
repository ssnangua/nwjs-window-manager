/**
 * NW.js window manager
 *
 * @remarks
 * Window manager for NW.js.
 *
 * @packageDocumentation
 */

const EventEmitter = require("node:events");

/**
 * To make sure the document is available
 * @param document
 * @returns
 */
function domReady(document: Document): Promise<void> {
  return new Promise((resolve) => {
    if (
      document.readyState === "complete" ||
      document.readyState === "interactive"
    ) {
      resolve();
    } else {
      document.addEventListener("DOMContentLoaded", () => resolve());
    }
  });
}

/**
 * WM_Window
 * @param nwWin - Managed nw window.
 * @param name - WM_Window's name.
 * @param parent - Parent window.
 * @param children - Get child windows.
 * @param modalParent - Whether to make the parent window modal.
 * @param modal - Whether the window is modal.
 * @param alwaysOnTop - Whether the window is always on top of other windows.
 * @param isMinimize - Get whether the window is minimize.
 * @param isMaximize - Get whether the window is maximize.
 * @param open - Open a child window.
 * @param $on - Add a listener.
 * @param $once - Add a one-time listener.
 * @param $off - Remove a listener.
 * @param $offAll - Removes all listeners, or those of the specified event name.
 * @param $emit - Synchronously calls each of the listeners.
 *
 * @remarks
 * WM_Window extends nw.win
 *
 * @public
 */
export interface WM_Window extends NWJS_Helpers.win {
  readonly nwWin: NWJS_Helpers.win;
  readonly name: string;
  parent: WM_Window | undefined;
  readonly children: WM_Window[];
  modalParent: boolean;
  modal: boolean;
  alwaysOnTop: boolean;
  readonly isMinimize: boolean;
  readonly isMaximize: boolean;
  open: WM_OpenWMWindow;
  $on(event: string, listener: Function): WM_Window;
  $once(event: string, listener: Function): WM_Window;
  $off(event: string, listener: Function): WM_Window;
  $offAll(event?: string): WM_Window;
  $emit(event: string, ...args: any[]): WM_Window;
}

/**
 * @public
 */
export type MaybeWindow = WM_Window | NWJS_Helpers.win | string;

/**
 * @public
 */
export type WM_OpenCallback = (wmWin: WM_Window) => void;

/**
 * WM_Options
 * @param name - Window's name.
 * @param parent - Parent window.
 * @param modal - Whether to make the parent window modal.
 * @param always_on_top - Whether the window is always on top of other windows.
 * @param position - Controls where window will be put. Can be `null` or `center` or `mouse` or **`parentCenter`**
 *
 * @public
 */
export interface WM_Options {
  name?: string;
  parent?: MaybeWindow;
  modal?: boolean;
  always_on_top?: boolean | undefined;
  position?: string | undefined;
}

/**
 * WM_OpenOptions
 *
 * @public
 */
export interface WM_OpenOptions
  extends NWJS_Helpers.WindowOpenOption,
    WM_Options {}

/**
 * Get WM_Window
 * @param win - Window's name or WM_Window or nw window
 * @returns WM_Window
 *
 * @remarks
 * When `win` is omitted, will return the current WM_Window.
 *
 * @public
 */
export interface WM_GetWindow {
  (win: MaybeWindow): WM_Window | undefined;
}

/**
 * Get all WM_Window instances
 * @param callback - Callback handler. Generally not needed because the return is fully synchronous.
 * @returns Array of all WM_Window instances
 *
 * @public
 */
export interface WM_GetAllWindow {
  (): WM_Window[];
  (callback?: (wmWins: WM_Window[]) => void): WM_Window[];
}

/**
 * Open a WM_Window
 * @param url - URL to be loaded in the opened window
 * @param options - Open options
 * @param callback - Callback when with the opened WM_Window instance
 * @returns The opened WM_Window instance
 *
 * @public
 */
export interface WM_OpenWMWindow {
  (url: string): Promise<WM_Window>;
  (url: string, options: WM_OpenOptions): Promise<WM_Window>;
  (url: string, callback: WM_OpenCallback): Promise<WM_Window>;
  (
    url: string,
    options: WM_OpenOptions,
    callback?: WM_OpenCallback
  ): Promise<WM_Window>;
}

/**
 * WM_ConfigOptions
 * @param modalStyle - Modal style
 * @param onAutoFocusTailWindow - Called when the tail window is auto focus
 *
 * @public
 */
export interface WM_ConfigOptions {
  modalStyle?: string;
  onAutoFocusTailWindow?: (win: WM_Window) => void;
}

/**
 * Config window manager
 * @param options - Config options
 *
 * @public
 */
export interface WM_ConfigWindowManager {
  (options: WM_ConfigOptions): void;
}

let modalStyle = "";
let onAutoFocusTailWindow: (win: WM_Window) => void;

function config(options: WM_ConfigOptions): void {
  if (typeof options.modalStyle === "string") modalStyle = options.modalStyle;
  if (typeof options.onAutoFocusTailWindow === "function")
    onAutoFocusTailWindow = options.onAutoFocusTailWindow;
}

/**
 * Add a modal node to the target window
 * @param win
 */
async function addModal(win: WM_Window) {
  const document = win.window.document;
  await domReady(document);
  const style = document.createElement("style");
  style.id = "nwjs-window-manager-style";
  style.innerHTML = `html, body {
  overflow: hidden !important;
}
.nwjs-window-manager-modal {
  position: fixed;
  top: 0;
  right: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.95);
  z-index: 10000;
}
${modalStyle}`;
  document.head.appendChild(style);
  const div = document.createElement("div");
  div.classList.add("nwjs-window-manager-modal");
  document.body.appendChild(div);
}

/**
 * Remove the modal node of the target window
 * @param win
 */
async function removeModal(win: WM_Window) {
  const document = win.window.document;
  await domReady(document);
  document
    .querySelectorAll("#nwjs-window-manager-style,.nwjs-window-manager-modal")
    .forEach((el) => el.remove());
}

// WM_Window instances
const instances: { [name: string]: WM_Window } = {};
let instanceId = Date.now();

function open(
  url: string,
  options: WM_OpenOptions | WM_OpenCallback = {},
  callback: WM_OpenCallback = () => {}
): Promise<WM_Window> {
  return new Promise((resolve) => {
    if (typeof options === "function") {
      callback = options;
      options = {};
    }
    const {
      name = `wm_${++instanceId}`,
      parent,
      modal,
      ...nwOptions
    } = options;
    const { position, always_on_top } = options;

    // Singleton
    if (instances[name]) {
      const wmWin = instances[name];
      wmWin.focus();
      callback(wmWin);
      return resolve(wmWin);
    }

    const isShow = nwOptions.show !== false;
    nwOptions.show = false;

    nw.Window.open(url, nwOptions, (nwWin) => {
      if (!nwWin) return;

      const wmWin = manage(nwWin, {
        name,
        parent,
        modal,
        position,
        always_on_top,
      }) as WM_Window;

      if (isShow) wmWin.show();

      callback(wmWin);
      resolve(wmWin);
    });
  });
}

function get(win: MaybeWindow): WM_Window | undefined {
  if (!win) return undefined;
  if (typeof win === "string") return instances[win];
  if ("nwWin" in win) return win as WM_Window;
  if ("cWindow" in win)
    // @ts-ignore: nw.win has window property
    return getAll().find((wmWin) => wmWin.nwWin.window === win.window);
  return undefined;
}

function getAll(callback?: (wmWins: WM_Window[]) => void): WM_Window[] {
  const wmWins = Object.values(instances);
  callback && callback(wmWins);
  return wmWins;
}

function isNeedModal(wmWins: WM_Window[]): boolean {
  return !!wmWins.find((win) => win.modalParent);
}
function isChildrenModal(wmWins: WM_Window[]): boolean {
  return !!wmWins.find((win) => win.modal || isChildrenModal(win.children));
}
function isNeedAlwaysOnTop(wmWin: WM_Window): boolean {
  return (
    wmWin.alwaysOnTop ||
    (wmWin.parent && isNeedAlwaysOnTop(wmWin.parent)) ||
    false
  );
}

/**
 * Manage a window
 * @param win - The window to manage
 * @param options WM_Window options
 * @returns WM_Window instance
 */
function manage(
  win: MaybeWindow,
  options: WM_Options = {}
): WM_Window | undefined {
  if (!win) return undefined;
  const instance = get(win);
  if (instance) {
    const { parent, modal } = options;
    if (parent) instance.parent = manage(parent);
    if (modal !== undefined && instance.parent) instance.parent.modal = modal;
    return instance;
  }
  if (typeof win === "object" && "cWindow" in win) {
    const nwWin = win as NWJS_Helpers.win;
    const emitter = new EventEmitter();

    // Private properties
    let name = options.name || `wm_${++instanceId}`,
      _modalParent = options.modal || false,
      _modal = false,
      _alwaysOnTop = false,
      _isMinimize = false,
      _isMaximize = false,
      _parent: WM_Window | undefined = undefined,
      _children: WM_Window[] = [];

    function addToParent(parent: WM_Window) {
      _parent = parent;
      _parent.children.push(wmWin);
      if (_modalParent && !_parent.modal) _parent.modal = true;
    }

    function removeFromParent() {
      if (_parent) {
        const index = _parent.children.indexOf(wmWin);
        if (index >= 0) {
          _parent.children.splice(index, 1);
          if (!isNeedModal(_parent.children)) _parent.modal = false;
        }
        _parent = undefined;
      }
    }

    // Override native methods
    const _setAlwaysOnTop = nwWin.setAlwaysOnTop,
      _close = nwWin.close,
      _on = nwWin.on;
    // Proxy close event
    const closeHandlers: Function[] = [];

    // Merge the properties and methods of WM_Window into nw window
    const wmWin: WM_Window = Object.assign(nwWin, {
      nwWin,
      name,
      modalParent: _modalParent,
      modal: _modal,
      alwaysOnTop: _alwaysOnTop,
      isMinimize: _isMinimize,
      isMaximize: _isMaximize,
      children: _children,
      parent: undefined,
      // Open a child WM_Window
      open: (
        url: string,
        options?: WM_OpenOptions | WM_OpenCallback,
        callback?: WM_OpenCallback
      ) => {
        if (typeof options === "function") {
          callback = options;
          options = {};
        }
        return open(url, { parent: wmWin, ...options }, callback);
      },
      // Override setAlwaysOnTop method
      // If the window is always on top, all child windows should also be always on top.
      setAlwaysOnTop(top: boolean) {
        if (top) {
          _alwaysOnTop = true;
          _setAlwaysOnTop.call(wmWin, true);
          _children.forEach((child) => (child.alwaysOnTop = true));
        } else {
          if (!isNeedAlwaysOnTop(wmWin)) {
            _alwaysOnTop = false;
            _setAlwaysOnTop.call(wmWin, false);
          }
        }
      },
      // Override close method
      // If the window is modal or any child is modal, it should not be closed.
      // If the window is closed, all child windows should also be closed.
      close(force?: boolean) {
        if (force || (!_modal && !isChildrenModal(_children))) {
          // If has parent, remove itself from parent.
          removeFromParent();
          delete instances[name];
          _close.call(wmWin, true);
          _children.forEach((child) => child.close(true));
        }
      },
      // Proxy close event
      on(event: string, listener: Function): WM_Window {
        if (event === "close") closeHandlers.push(listener);
        // @ts-ignore
        else _on.call(wmWin, event, listener);
        return wmWin;
      },
      // Merge emitter
      $on(event: string, listener: Function): WM_Window {
        emitter.on(event, listener);
        return wmWin;
      },
      $once(event: string, listener: Function): WM_Window {
        emitter.once(event, listener);
        return wmWin;
      },
      $off(event: string, listener: Function): WM_Window {
        emitter.off(event, listener);
        return wmWin;
      },
      $offAll(event?: string): WM_Window {
        emitter.removeAllListeners(event);
        return wmWin;
      },
      $emit(event: string, ...args: any[]): WM_Window {
        emitter.emit.call(emitter, event, ...args);
        return wmWin;
      },
    });

    // Define getter/setter
    Object.defineProperties(wmWin, {
      nwWin: {
        get: () => nwWin,
      },
      name: {
        get: () => name,
      },
      alwaysOnTop: {
        get: () => _alwaysOnTop,
        set(bool: boolean) {
          this.setAlwaysOnTop(bool);
        },
      },
      isMinimize: {
        get: () => _isMinimize,
      },
      isMaximize: {
        get: () => _isMaximize,
      },
      modalParent: {
        get: () => _modalParent,
        set(bool: boolean) {
          if (bool === _modalParent) return;
          if (_parent) {
            if (bool) {
              if (!_parent.modal) {
                _parent.modal = true;
                _modalParent = true;
              }
            } else {
              if (!isNeedModal(_parent.children)) {
                _parent.modal = false;
                _modalParent = false;
              }
            }
          }
        },
      },
      modal: {
        get: () => _modal,
        set(bool: boolean) {
          if (bool === _modal) return;
          if (bool) {
            addModal(wmWin);
            _modal = true;
          } else {
            if (!isNeedModal(_children)) {
              removeModal(wmWin);
              _modal = false;
            }
          }
        },
      },
      children: {
        get: () => _children,
      },
      parent: {
        get(): WM_Window | undefined {
          return _parent;
        },
        set(win: WM_Window | undefined) {
          if (win) {
            const parent = manage(win);
            if (parent && parent !== _parent) {
              removeFromParent();
              addToParent(parent);
            }
          } else {
            removeFromParent();
          }
        },
      },
    });

    // parent
    if (options.parent) wmWin.parent = manage(options.parent);

    // alwayOnTop
    if (options.always_on_top || isNeedAlwaysOnTop(wmWin))
      wmWin.alwaysOnTop = true;

    // Center relative to parent
    if (wmWin.parent && options.position === "parentCenter") {
      wmWin.x = wmWin.parent.x + (wmWin.parent.width - wmWin.width) / 2;
      wmWin.y = wmWin.parent.y + (wmWin.parent.height - wmWin.height) / 2;
    }

    // Cache instance
    instances[name] = wmWin;

    wmWin.on("focus", () => {
      // Auto focus the last displayed child.
      let lastChild: WM_Window | undefined = undefined;
      _children.forEach((child) => {
        if (!child.isMinimize) {
          child.focus();
          lastChild = child;
        }
      });
      if (lastChild) {
        onAutoFocusTailWindow && onAutoFocusTailWindow(lastChild);
      }
    });

    // @ts-ignore
    _on.call(wmWin, "close", () => {
      if (closeHandlers.length > 0) {
        closeHandlers.forEach((handler) => handler());
      } else if (!_modal && !isChildrenModal(_children)) {
        wmWin.close(true);
      }
    });

    // If the window is modal, it should not be minimized or maximized.
    wmWin.on("minimize", () => {
      if (_modal || _modalParent) wmWin.restore();
      else _isMinimize = true;
    });
    wmWin.on("maximize", () => {
      if (_modal) wmWin.restore();
      else _isMaximize = true;
    });
    wmWin.on("restore", () => {
      _isMinimize = false;
      _isMaximize = false;
    });

    return wmWin;
  }

  return undefined;
}

/**
 * Window manager
 * @param open - Open a WM_Window
 * @param get - Get WM_Window. When `win` is omitted, will return the current WM_Window.
 * @param getAll - Get all WM_Window instances
 * @param config - Set window manager
 * @param $on - Add a global listener.
 * @param $once - Add a one-time global listener.
 * @param $off - Remove a global listener.
 * @param $offAll - Removes all global listeners, or those of the specified event name.
 * @param $emit - Synchronously calls each of the global listeners.
 *
 * @public
 */
export interface WindowManager {
  (maybeWin: MaybeWindow, options?: WM_Options): WM_Window | undefined;
  open: WM_OpenWMWindow;
  get: WM_GetWindow;
  getAll: WM_GetAllWindow;
  config: WM_ConfigWindowManager;
  $on(event: string, listener: Function): WindowManager;
  $once(event: string, listener: Function): WindowManager;
  $off(event: string, listener: Function): WindowManager;
  $offAll(event?: string): WindowManager;
  $emit(event: string, ...args: any[]): WindowManager;
}

const emitter = new EventEmitter();

/**
 * @public
 */
export const wm: WindowManager = Object.assign(manage, {
  open,
  get,
  getAll,
  config,
  // Merge emitter
  $on(event: string, listener: Function): WindowManager {
    emitter.on(event, listener);
    return wm;
  },
  $once(event: string, listener: Function): WindowManager {
    emitter.once(event, listener);
    return wm;
  },
  $off(event: string, listener: Function): WindowManager {
    emitter.off(event, listener);
    return wm;
  },
  $offAll(event?: string): WindowManager {
    emitter.removeAllListeners(event);
    return wm;
  },
  $emit(event: string, ...args: any[]): WindowManager {
    emitter.emit.call(emitter, event, ...args);
    return wm;
  },
});
