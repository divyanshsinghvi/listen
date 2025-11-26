#!/usr/bin/env python3
"""
Window focus management helper for WSL
Uses PowerShell to interact with Windows window management
"""
import sys
import json
import subprocess
import re

def get_foreground_window():
    """Get the currently focused window title using PowerShell"""
    try:
        # Use PowerShell to get the active window title
        ps_command = """
[System.Runtime.InteropServices.DllImport('user32.dll')]
public static extern IntPtr GetForegroundWindow()

[System.Runtime.InteropServices.DllImport('user32.dll')]
public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count)

$hwnd = [WindowFocus]::GetForegroundWindow()
$sb = New-Object System.Text.StringBuilder 256
[WindowFocus]::GetWindowText($hwnd, $sb, 256) | Out-Null
@{title=$sb.ToString(); handle=[Int64]$hwnd} | ConvertTo-Json
"""

        result = subprocess.run(
            ['powershell.exe', '-NoProfile', '-Command', ps_command],
            capture_output=True,
            text=True,
            timeout=5
        )

        if result.returncode == 0:
            window_data = json.loads(result.stdout.strip())
            return {
                'title': window_data.get('title', ''),
                'handle': window_data.get('handle', 0)
            }
    except Exception as e:
        print(f"Error in get_foreground_window: {e}", file=sys.stderr)

    return None

def restore_focus(window_info):
    """Restore focus to a window using PowerShell"""
    if not window_info or not window_info.get('handle'):
        return False

    try:
        handle = window_info.get('handle')

        # PowerShell command to set focus
        ps_command = f"""
[System.Runtime.InteropServices.DllImport('user32.dll')]
public static extern bool SetForegroundWindow(IntPtr hWnd)

$hwnd = [IntPtr]{handle}
[WindowFocus]::SetForegroundWindow($hwnd)
"""

        result = subprocess.run(
            ['powershell.exe', '-NoProfile', '-Command', ps_command],
            capture_output=True,
            text=True,
            timeout=5
        )

        return result.returncode == 0
    except Exception as e:
        print(f"Error in restore_focus: {e}", file=sys.stderr)
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
