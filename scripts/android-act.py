"""Small adb UI helper; acts only on controls observed in the current XML hierarchy."""
import os
import re
import subprocess
import sys
import time
import xml.etree.ElementTree as ET
sys.stdout.reconfigure(encoding='utf-8')
ADB = os.environ.get('ADB', r'C:\Users\leych\AppData\Local\Android\Sdk\platform-tools\adb.exe')
def adb(*args):
    return subprocess.run([ADB, '-s', 'emulator-5554', *args], check=True, capture_output=True, timeout=30).stdout
def nodes():
    target = f'/sdcard/islasafe-act-{os.getpid()}-{time.time_ns()}.xml'
    result = adb('shell', 'uiautomator', 'dump', target)
    if b'UI hierchary dumped to' not in result and b'UI hierarchy dumped to' not in result:
        raise RuntimeError('No fresh native UI hierarchy: ' + result.decode(errors='replace'))
    return list(ET.fromstring(adb('shell', 'cat', target)).iter('node'))
action = sys.argv[1]
def visible(node):
    values = list(map(int, re.findall(r'\d+', node.get('bounds', ''))))
    return len(values) == 4 and values[2] > values[0] and values[3] > values[1]
if action in ('tap', 'fill'):
    label = sys.argv[2]
    found = None
    for attempt in range(6):
        current_nodes = nodes()
        found = next((n for n in current_nodes if label in [n.get('text'), n.get('content-desc')] and n.get('enabled') == 'true' and visible(n) and (action != 'fill' or n.get('class', '').endswith('EditText'))), None)
        if found is not None:
            break
        scroller = next((n for n in current_nodes if n.get('class', '').endswith('ScrollView') and n.get('package') == 'ph.islasafe.mobile'), None)
        if scroller is None:
            break
        left, top, right, bottom = map(int, re.findall(r'\d+', scroller.get('bounds')))
        edge = left+(right-left)*94//100
        adb('shell', 'input', 'swipe', str(edge), str(top+(bottom-top)*4//5), str(edge), str(top+(bottom-top)//4), '350')
    if found is None:
        raise SystemExit('Control not found in current native UI: ' + label)
    x1, y1, x2, y2 = map(int, re.findall(r'\d+', found.get('bounds')))
    if x1 == x2 or y1 == y2:
        raise SystemExit('Control is not visible: ' + label)
    adb('shell', 'input', 'tap', str((x1+x2)//2), str((y1+y2)//2))
    if action == 'fill':
        current = found.get('text', '')
        if current:
            adb('shell', 'input', 'keyevent', '123')
            adb('shell', 'input', 'keyevent', *(['67'] * len(current)))
        adb('shell', 'input', 'text', sys.argv[3].replace(' ', '%s'))
    print('Acted on observed control: ' + label)
elif action == 'scroll':
    size = adb('shell', 'wm', 'size').decode()
    width, height = map(int, re.findall(r'(\d+)x(\d+)', size)[0])
    adb('shell', 'input', 'swipe', str(width//2), str(height*3//4), str(width//2), str(height//3), '350')
elif action == 'top':
    for _ in range(6):
        scroller = next((n for n in nodes() if n.get('class', '').endswith('ScrollView') and n.get('package') == 'ph.islasafe.mobile'), None)
        if scroller is None:
            break
        left, top, right, bottom = map(int, re.findall(r'\d+', scroller.get('bounds')))
        edge = left+(right-left)*94//100
        adb('shell', 'input', 'swipe', str(edge), str(top+(bottom-top)//4), str(edge), str(top+(bottom-top)*4//5), '350')
elif action == 'back':
    adb('shell', 'input', 'keyevent', '4')
elif action == 'hide':
    state = adb('shell', 'dumpsys', 'input_method').decode(errors='replace')
    if re.search(r'mInputShown=true|isInputViewShown=true', state):
        adb('shell', 'input', 'keyevent', '4')
        print('Dismissed a visible keyboard')
    else:
        print('Keyboard already hidden; no navigation action sent')
else:
    raise SystemExit('Expected tap, fill, scroll or back')
time.sleep(0.5)
