/**
 * NW.js window manager
 *
 * @remarks
 * Window manager for NW.js.
 *
 * @packageDocumentation
 */

/// <reference types="nw.js" />

/**
 * @public
 */
export declare type MaybeWindow = WM_Window | NWJS_Helpers.win | string;

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
export declare interface WindowManager {
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

/**
 * @public
 */
export declare const wm: WindowManager;

/**
 * WM_ConfigOptions
 * @param modalStyle - Modal style
 * @param onAutoFocusTailWindow - Called when the tail window is auto focus
 *
 * @public
 */
export declare interface WM_ConfigOptions {
    modalStyle?: string;
    onAutoFocusTailWindow?: (win: WM_Window) => void;
}

/**
 * Config window manager
 * @param options - Config options
 *
 * @public
 */
export declare interface WM_ConfigWindowManager {
    (options: WM_ConfigOptions): void;
}

/**
 * Get all WM_Window instances
 * @param callback - Callback handler. Generally not needed because the return is fully synchronous.
 * @returns Array of all WM_Window instances
 *
 * @public
 */
export declare interface WM_GetAllWindow {
    (): WM_Window[];
    (callback?: (wmWins: WM_Window[]) => void): WM_Window[];
}

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
export declare interface WM_GetWindow {
    (win: MaybeWindow): WM_Window | undefined;
}

/**
 * @public
 */
export declare type WM_OpenCallback = (wmWin: WM_Window) => void;

/**
 * WM_OpenOptions
 *
 * @public
 */
export declare interface WM_OpenOptions extends NWJS_Helpers.WindowOpenOption, WM_Options {
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
export declare interface WM_OpenWMWindow {
    (url: string): Promise<WM_Window>;
    (url: string, options: WM_OpenOptions): Promise<WM_Window>;
    (url: string, callback: WM_OpenCallback): Promise<WM_Window>;
    (url: string, options: WM_OpenOptions, callback?: WM_OpenCallback): Promise<WM_Window>;
}

/**
 * WM_Options
 * @param name - Window's name.
 * @param parent - Parent window.
 * @param modal - Whether to make the parent window modal.
 * @param always_on_top - Whether the window is always on top of other windows.
 * @param position - Controls where window will be put. Can be `null` or `center` or `mouse` or **`parentCenter`**
 * @param x - Left offset from window frame to screen.
 * @param y - Top offset from window frame to screen.
 * @param width - window's width, including the window's frame.
 * @param height - window's height, including the window's frame.
 *
 * @public
 */
export declare interface WM_Options {
    name?: string;
    parent?: MaybeWindow;
    modal?: boolean;
    always_on_top?: boolean | undefined;
    position?: string | undefined;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
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
 * @param centerToParent - Center relative to parent.
 * @param centerToScreen - Center relative to screen.
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
export declare interface WM_Window extends NWJS_Helpers.win {
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
    centerToParent(): WM_Window;
    centerToScreen(): WM_Window;
    $on(event: string, listener: Function): WM_Window;
    $once(event: string, listener: Function): WM_Window;
    $off(event: string, listener: Function): WM_Window;
    $offAll(event?: string): WM_Window;
    $emit(event: string, ...args: any[]): WM_Window;
}

export { }
