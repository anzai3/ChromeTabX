#!/usr/bin/env python3
"""Install the local read-only metrics host for one explicitly supplied extension ID."""
import json, pathlib, re, shutil, sys
if sys.platform != 'darwin':
    raise SystemExit('This installer supports macOS only.')
if len(sys.argv) != 2 or not re.fullmatch('[a-p]{32}', sys.argv[1]):
    raise SystemExit('Usage: python3 native/install.py EXTENSION_ID')
root = pathlib.Path.home() / 'Library/Application Support/TabMatrixMetrics'
root.mkdir(parents=True, exist_ok=True)
shutil.copyfile(pathlib.Path(__file__).with_name('monitor.py'), root / 'monitor.py')
# Shell-quote paths; launch with the exact interpreter used during installation.
import shlex
launcher = root / 'launch.sh'
launcher.write_text('#!/bin/sh\nexec ' + shlex.quote(sys.executable) + ' ' + shlex.quote(str(root / 'monitor.py')) + '\n')
launcher.chmod(0o700)
manifest = {'name':'com.tabmatrix.metrics','description':'Local Chrome CPU and resident memory metrics','path':str(launcher),'type':'stdio','allowed_origins':['chrome-extension://' + sys.argv[1] + '/']}
target = pathlib.Path.home() / 'Library/Application Support/Google/Chrome/NativeMessagingHosts/com.tabmatrix.metrics.json'
target.parent.mkdir(parents=True, exist_ok=True)
target.write_text(json.dumps(manifest,indent=2)+'\n')
print('Installed: ' + str(target))
