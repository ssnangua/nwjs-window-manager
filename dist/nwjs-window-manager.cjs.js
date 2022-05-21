'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var require$$0 = require('node:events');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var require$$0__default = /*#__PURE__*/_interopDefaultLegacy(require$$0);

/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

function __rest(s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
}

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

/**
 * NW.js window manager
 *
 * @remarks
 * Window manager for NW.js.
 *
 * @packageDocumentation
 */
const EventEmitter = require$$0__default["default"];
/**
 * To make sure the document is available
 * @param document
 * @returns
 */
function domReady(document) {
    return new Promise((resolve) => {
        if (document.readyState === "complete" ||
            document.readyState === "interactive") {
            resolve();
        }
        else {
            document.addEventListener("DOMContentLoaded", () => resolve());
        }
    });
}
let modalStyle = "";
let onAutoFocusTailWindow;
function config(options) {
    if (typeof options.modalStyle === "string")
        modalStyle = options.modalStyle;
    if (typeof options.onAutoFocusTailWindow === "function")
        onAutoFocusTailWindow = options.onAutoFocusTailWindow;
}
/**
 * Add a modal node to the target window
 * @param win
 */
function addModal(win) {
    return __awaiter(this, void 0, void 0, function* () {
        const document = win.window.document;
        yield domReady(document);
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
    });
}
/**
 * Remove the modal node of the target window
 * @param win
 */
function removeModal(win) {
    return __awaiter(this, void 0, void 0, function* () {
        const document = win.window.document;
        yield domReady(document);
        document
            .querySelectorAll("#nwjs-window-manager-style,.nwjs-window-manager-modal")
            .forEach((el) => el.remove());
    });
}
// WM_Window instances
const instances = {};
let instanceId = Date.now();
function open(url, options = {}, callback = () => { }) {
    return new Promise((resolve) => {
        if (typeof options === "function") {
            callback = options;
            options = {};
        }
        const { name = `wm_${++instanceId}`, parent, modal } = options, nwOptions = __rest(options, ["name", "parent", "modal"]);
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
            if (!nwWin)
                return;
            const wmWin = manage(nwWin, {
                name,
                parent,
                modal,
                position,
                always_on_top,
            });
            if (isShow)
                wmWin.show();
            callback(wmWin);
            resolve(wmWin);
        });
    });
}
function get(win) {
    if (!win)
        return undefined;
    if (typeof win === "string")
        return instances[win];
    if ("nwWin" in win)
        return win;
    if ("cWindow" in win)
        // @ts-ignore: nw.win has window property
        return getAll().find((wmWin) => wmWin.nwWin.window === win.window);
    return undefined;
}
function getAll(callback) {
    const wmWins = Object.values(instances);
    callback && callback(wmWins);
    return wmWins;
}
function isNeedModal(wmWins) {
    return !!wmWins.find((win) => win.modalParent);
}
function isChildrenModal(wmWins) {
    return !!wmWins.find((win) => win.modal || isChildrenModal(win.children));
}
function isNeedAlwaysOnTop(wmWin) {
    return (wmWin.alwaysOnTop ||
        (wmWin.parent && isNeedAlwaysOnTop(wmWin.parent)) ||
        false);
}
/**
 * Manage a window
 * @param win - The window to manage
 * @param options WM_Window options
 * @returns WM_Window instance
 */
function manage(win, options = {}) {
    if (!win)
        return undefined;
    const instance = get(win);
    if (instance) {
        const { parent, modal } = options;
        if (parent)
            instance.parent = manage(parent);
        if (modal !== undefined && instance.parent)
            instance.parent.modal = modal;
        return instance;
    }
    if (typeof win === "object" && "cWindow" in win) {
        const nwWin = win;
        const emitter = new EventEmitter();
        // Private properties
        let name = options.name || `wm_${++instanceId}`, _modalParent = options.modal || false, _modal = false, _alwaysOnTop = false, _isMinimize = false, _isMaximize = false, _parent = undefined, _children = [];
        function addToParent(parent) {
            _parent = parent;
            _parent.children.push(wmWin);
            if (_modalParent && !_parent.modal)
                _parent.modal = true;
        }
        function removeFromParent() {
            if (_parent) {
                const index = _parent.children.indexOf(wmWin);
                if (index >= 0) {
                    _parent.children.splice(index, 1);
                    if (!isNeedModal(_parent.children))
                        _parent.modal = false;
                }
                _parent = undefined;
            }
        }
        // Override native methods
        const _setAlwaysOnTop = nwWin.setAlwaysOnTop, _close = nwWin.close, _on = nwWin.on;
        // Proxy close event
        const closeHandlers = [];
        // Merge the properties and methods of WM_Window into nw window
        const wmWin = Object.assign(nwWin, {
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
            open: (url, options, callback) => {
                if (typeof options === "function") {
                    callback = options;
                    options = {};
                }
                return open(url, Object.assign({ parent: wmWin }, options), callback);
            },
            // Override setAlwaysOnTop method
            // If the window is always on top, all child windows should also be always on top.
            setAlwaysOnTop(top) {
                if (top) {
                    _alwaysOnTop = true;
                    _setAlwaysOnTop.call(wmWin, true);
                    _children.forEach((child) => (child.alwaysOnTop = true));
                }
                else {
                    if (!isNeedAlwaysOnTop(wmWin)) {
                        _alwaysOnTop = false;
                        _setAlwaysOnTop.call(wmWin, false);
                    }
                }
            },
            // Override close method
            // If the window is modal or any child is modal, it should not be closed.
            // If the window is closed, all child windows should also be closed.
            close(force) {
                if (force || (!_modal && !isChildrenModal(_children))) {
                    // If has parent, remove itself from parent.
                    removeFromParent();
                    delete instances[name];
                    _close.call(wmWin, true);
                    _children.forEach((child) => child.close(true));
                }
            },
            // Proxy close event
            on(event, listener) {
                if (event === "close")
                    closeHandlers.push(listener);
                // @ts-ignore
                else
                    _on.call(wmWin, event, listener);
                return wmWin;
            },
            // Merge emitter
            $on(event, listener) {
                emitter.on(event, listener);
                return wmWin;
            },
            $once(event, listener) {
                emitter.once(event, listener);
                return wmWin;
            },
            $off(event, listener) {
                emitter.off(event, listener);
                return wmWin;
            },
            $offAll(event) {
                emitter.removeAllListeners(event);
                return wmWin;
            },
            $emit(event, ...args) {
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
                set(bool) {
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
                set(bool) {
                    if (bool === _modalParent)
                        return;
                    if (_parent) {
                        if (bool) {
                            if (!_parent.modal) {
                                _parent.modal = true;
                                _modalParent = true;
                            }
                        }
                        else {
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
                set(bool) {
                    if (bool === _modal)
                        return;
                    if (bool) {
                        addModal(wmWin);
                        _modal = true;
                    }
                    else {
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
                get() {
                    return _parent;
                },
                set(win) {
                    if (win) {
                        const parent = manage(win);
                        if (parent && parent !== _parent) {
                            removeFromParent();
                            addToParent(parent);
                        }
                    }
                    else {
                        removeFromParent();
                    }
                },
            },
        });
        // parent
        if (options.parent)
            wmWin.parent = manage(options.parent);
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
            let lastChild = undefined;
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
            }
            else if (!_modal && !isChildrenModal(_children)) {
                wmWin.close(true);
            }
        });
        // If the window is modal, it should not be minimized or maximized.
        wmWin.on("minimize", () => {
            if (_modal || _modalParent)
                wmWin.restore();
            else
                _isMinimize = true;
        });
        wmWin.on("maximize", () => {
            if (_modal)
                wmWin.restore();
            else
                _isMaximize = true;
        });
        wmWin.on("restore", () => {
            _isMinimize = false;
            _isMaximize = false;
        });
        return wmWin;
    }
    return undefined;
}
const emitter = new EventEmitter();
/**
 * @public
 */
const wm = Object.assign(manage, {
    open,
    get,
    getAll,
    config,
    // Merge emitter
    $on(event, listener) {
        emitter.on(event, listener);
        return wm;
    },
    $once(event, listener) {
        emitter.once(event, listener);
        return wm;
    },
    $off(event, listener) {
        emitter.off(event, listener);
        return wm;
    },
    $offAll(event) {
        emitter.removeAllListeners(event);
        return wm;
    },
    $emit(event, ...args) {
        emitter.emit.call(emitter, event, ...args);
        return wm;
    },
});

exports.wm = wm;
