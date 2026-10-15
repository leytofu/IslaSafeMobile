"""Capture native UI evidence without modifying the app or backend."""
import os
import pathlib
import subprocess
import sys
import time
import xml.etree.ElementTree as ET
sys.stdout.reconfigure(encoding='utf-8')

ADB = os.environ.get('ADB', r'C:\Users\leych\AppData\Local\Android\Sdk\platform-tools\adb.exe')
OUT = pathlib.Path('artifacts/native')
OUT.mkdir(parents=True, exist_ok=True)
name = sys.argv[1] if len(sys.argv) > 1 else 'screen'
def adb(*args):
    return subprocess.run([ADB, '-s', 'emulator-5554', *args], check=True, capture_output=True, timeout=30).stdout
target = f'/sdcard/islasafe-ui-{os.getpid()}-{time.time_ns()}.xml'
result = adb('shell', 'uiautomator', 'dump', target)
if b'UI hierchary dumped to' not in result and b'UI hierarchy dumped to' not in result:
    raise RuntimeError('No fresh native UI hierarchy: ' + result.decode(errors='replace'))
adb('pull', target, str(OUT / (name + '.xml')))
adb('shell', 'screencap', '-p', '/sdcard/islasafe-screen.png')
adb('pull', '/sdcard/islasafe-screen.png', str(OUT / (name + '.png')))
root = ET.parse(OUT / (name + '.xml')).getroot()
for node in root.iter('node'):
    label = node.get('text') or node.get('content-desc')
    if label:
        print(label, '|', node.get('bounds'), '| enabled:', node.get('enabled'))
