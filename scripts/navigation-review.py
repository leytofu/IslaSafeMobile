"""Check main headers, drawer selection, themes and Android Back on the emulator.

Uses observed Android accessibility controls. Does not submit forms or change
account data. Restores the emulator display size and the appearance preference.
"""
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import time
import xml.etree.ElementTree as ET

ADB = os.environ.get("ADB", r"C:\Users\leych\AppData\Local\Android\Sdk\platform-tools\adb.exe")
OUT = Path("artifacts/navigation")
OUT.mkdir(parents=True, exist_ok=True)


def adb(*args):
    return subprocess.run([ADB, "-s", "emulator-5554", *args], check=True, capture_output=True, timeout=30).stdout


def snapshot():
    target = f"/sdcard/navigation-review-{os.getpid()}.xml"
    for attempt in range(3):
        try:
            result = adb("shell", "uiautomator", "dump", target)
            if b"dumped to" not in result:
                raise RuntimeError("Android did not produce a fresh UI hierarchy")
            return ET.fromstring(adb("shell", "cat", target))
        except (subprocess.CalledProcessError, subprocess.TimeoutExpired, RuntimeError):
            if attempt == 2:
                raise
            time.sleep(1)


def bounds(node):
    return list(map(int, re.findall(r"-?\d+", node.get("bounds", ""))))


def control(root, label):
    for node in root.iter("node"):
        if label not in (node.get("text"), node.get("content-desc")):
            continue
        box = bounds(node)
        if node.get("clickable") == "true" and node.get("enabled") == "true" and len(box) == 4 and box[0] >= 0 and box[1] >= 0 and box[2] > box[0] and box[3] > box[1]:
            return node
    return None


def tap(label, root=None):
    root = root if root is not None else snapshot()
    node = control(root, label)
    assert node is not None, f"Missing control: {label}"
    x1, y1, x2, y2 = bounds(node)
    adb("shell", "input", "tap", str((x1 + x2) // 2), str((y1 + y2) // 2))
    time.sleep(0.5)


def main_screen(title):
    deadline = time.monotonic() + 45
    while time.monotonic() < deadline:
        root = snapshot()
        if control(root, "Open navigation menu") is not None and any(n.get("text") == title for n in root.iter("node")) and control(root, "Close navigation menu") is None:
            assert control(root, "Back") is None, f"Unexpected main-screen Back: {title}"
            return root
    raise AssertionError(f"Main screen did not settle: {title}")


def navigate(label, title):
    root = snapshot()
    if control(root, "Close navigation menu") is None:
        tap("Open navigation menu", root)
        root = snapshot()
    tap(label, root)
    return main_screen(title)


def capture(name, root):
    (OUT / f"{name}.xml").write_bytes(ET.tostring(root, encoding="utf-8"))
    (OUT / f"{name}.png").write_bytes(adb("exec-out", "screencap", "-p"))


if "--public" in sys.argv:
    def wait_control(label):
        deadline = time.monotonic() + 60
        while time.monotonic() < deadline:
            root = snapshot()
            if control(root, label) is not None:
                return root
        raise AssertionError(f"Public screen did not settle: {label}")

    guides = "Guides. Safety guides and hazard references"
    root = wait_control(guides)
    tap(guides, root)
    root = wait_control("Back")
    assert control(root, "Open navigation menu") is None
    capture("native-public-guides", root)
    adb("shell", "input", "keyevent", "4")
    root = wait_control(guides)
    capture("native-public-back-welcome", root)
    (OUT / "public-report.json").write_text(json.dumps({"results": [
        "Native public Guides retains Back without a hamburger",
        "Android system Back returns from public Guides to Welcome",
    ]}, indent=2), encoding="utf-8")
    print("Native public Back review passed: 2 checks", flush=True)
    sys.exit(0)


destinations = [
    ("Dashboard", "Dashboard"), ("Hazard Map", "CPG hazard map"),
    ("Emergency SOS", "Emergency SOS"), ("Alerts & Advisories", "Alerts & Advisories"),
    ("Preparedness Guides", "Preparedness Guides"), ("Offline Hazard Maps", "Offline Hazard Maps"),
    ("Settings", "Settings"),
]
report = OUT / "report.json"
results = json.loads(report.read_text(encoding="utf-8"))["results"] if "--resume" in sys.argv and report.exists() else []
original_size = adb("shell", "wm", "size").decode()
override = re.search(r"Override size: (\d+x\d+)", original_size)
root = navigate("Settings", "Settings")
original_theme = "light" if control(root, "Switch to dark theme") is not None else "dark"
system_preference = any(n.get("text") == "Following your phone’s appearance" for n in root.iter("node"))
try:
    for theme in ("light", "dark"):
        root = snapshot()
        change = f"Switch to {theme} theme"
        if control(root, change) is not None:
            tap(change, root)
        for label, title in destinations:
            if any(result.startswith(f"{theme}: {label} ") for result in results):
                continue
            root = navigate(label, title)
            tap("Open navigation menu", root)
            drawer = snapshot()
            selected = control(drawer, label)
            assert selected is not None and selected.get("selected") == "true", f"Drawer selection failed: {label}"
            if label == "Dashboard":
                capture(f"drawer-{theme}", drawer)
            adb("shell", "input", "keyevent", "4")
            time.sleep(0.5)
            root = main_screen(title)
            if label in ("Settings", "Preparedness Guides"):
                capture(f"{label.lower().replace(' ', '-')}-{theme}", root)
            results.append(f"{theme}: {label} — hamburger, selected item, drawer and hardware Back passed")
            print(results[-1], flush=True)

    root = navigate("Settings", "Settings")
    tap("Edit Profile", root)
    root = snapshot()
    assert control(root, "Back to settings") is not None
    assert control(root, "Open navigation menu") is None
    adb("shell", "input", "keyevent", "4")
    main_screen("Settings")
    results.append("Profile detail: Back returns to Settings before section history")

    root = navigate("Emergency SOS", "Emergency SOS")
    tap("Prepare Emergency SOS", root)
    root = snapshot()
    assert control(root, "Back to SOS") is not None
    adb("shell", "input", "keyevent", "4")
    main_screen("Emergency SOS")
    results.append("SOS picker: nested Back retained; Android Back closes the picker")

    adb("shell", "wm", "size", "840x1700")
    root = navigate("Offline Hazard Maps", "Offline Hazard Maps")
    menu = bounds(control(root, "Open navigation menu"))
    theme = next(n for n in root.iter("node") if n.get("content-desc", "").startswith("Switch to ") and n.get("clickable") == "true")
    theme_box = bounds(theme)
    assert 0 <= menu[0] < menu[2] < theme_box[0] < theme_box[2] <= 840
    capture("small-screen-header", root)
    results.append("320 dp width: header actions fit without overlap")
finally:
    root = snapshot()
    if control(root, "Back to SOS") is not None:
        tap("Back to SOS", root)
    adb("shell", "wm", "size", override[1] if override else "reset")
    root = navigate("Settings", "Settings")
    if system_preference and control(root, "Use phone appearance") is not None:
        tap("Use phone appearance", root)
    elif not system_preference and control(root, f"Switch to {original_theme} theme") is not None:
        tap(f"Switch to {original_theme} theme", root)
    navigate("Dashboard", "Dashboard")
    (OUT / "report.json").write_text(json.dumps({"results": results}, indent=2), encoding="utf-8")
print(f"Navigation review passed: {len(results)} checks", flush=True)
