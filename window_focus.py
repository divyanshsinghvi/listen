#!/usr/bin/env python3
"""
Window focus management helper
Captures and restores window focus for proper auto-paste functionality
"""
import sys
import json

def get_foreground_window():
    """Get the currently focused window handle/ID"""
    try:
        import pygetwindow
        active_window = pygetwindow.getActiveWindow()
        if active_window:
            return {
                'title': active_window.title,
                'handle': id(active_window)  # Use object id as handle
            }
    except:
        pass

    # Fallback for Windows using ctypes
    try:
        import ctypes
        hwnd = ctypes.windll.user32.GetForegroundWindow()
        # Get window title
        GetWindowText = ctypes.windll.user32.GetWindowTextW
        GetWindowTextLength = ctypes.windll.user32.GetWindowTextLengthW

        length = GetWindowTextLength(hwnd)
        buff = ctypes.create_unicode_buffer(length + 1)
        GetWindowText(hwnd, buff, length + 1)

        return {
            'title': buff.value,
            'handle': hwnd
        }
    except:
        pass

    return None

def restore_focus(window_info):
    """Restore focus to a previously captured window"""
    if not window_info or not window_info.get('handle'):
        return False

    try:
        import pygetwindow
        # This won't work with object id, so we'll use the title
        windows = pygetwindow.getWindowsWithTitle(window_info.get('title', ''))
        if windows:
            windows[0].activate()
            return True
    except:
        pass

    # Fallback for Windows using ctypes
    try:
        import ctypes
        hwnd = window_info.get('handle')
        if hwnd and isinstance(hwnd, int):
            # SetForegroundWindow
            ctypes.windll.user32.SetForegroundWindow(hwnd)
            return True
    except:
        pass

    return False

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: window_focus.py [get|restore] [json_data]")
        sys.exit(1)

    command = sys.argv[1]

    if command == 'get':
        window_info = get_foreground_window()
        print(json.dumps(window_info or {}))
    elif command == 'restore':
        try:
            window_info = json.loads(sys.argv[2]) if len(sys.argv) > 2 else None
            success = restore_focus(window_info)
            print(json.dumps({'success': success}))
        except Exception as e:
            print(json.dumps({'success': False, 'error': str(e)}))
