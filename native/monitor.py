#!/usr/bin/env python3
"""Chrome native messaging host. Only returns aggregate Chrome process metrics."""
import json, os, struct, subprocess, sys, time

def cpu_seconds(value):
    days = 0
    if '-' in value:
        day, value = value.split('-', 1)
        days = int(day)
    parts = [float(v) for v in value.split(':')]
    result = 0
    for part in parts:
        result = result * 60 + part
    return days * 86400 + result

def snapshot():
    result = subprocess.run(['/bin/ps', '-axo', 'pid=,time=,rss=,comm='], capture_output=True, text=True, check=True, timeout=4)
    processes = {}
    for line in result.stdout.splitlines():
        fields = line.strip().split(None, 3)
        if len(fields) != 4:
            continue
        pid, cpu, rss, command = fields
        # Exact application path component avoids matching unrelated processes.
        if '/Google Chrome.app/Contents/' not in command:
            continue
        processes[int(pid)] = (cpu_seconds(cpu), int(rss) * 1024)
    return processes

def measure():
    start = time.monotonic()
    before = snapshot()
    time.sleep(1)
    after = snapshot()
    elapsed = time.monotonic() - start
    used = sum(max(0, values[0] - before[pid][0]) for pid, values in after.items() if pid in before)
    return {'ok': True, 'memoryBytes': sum(v[1] for v in after.values()), 'cpuPercent': round(used / elapsed * 100, 1), 'processCount': len(after), 'sampledAt': int(time.time() * 1000)}

def read_exact(size):
    data = b''
    while len(data) < size:
        part = sys.stdin.buffer.read(size - len(data))
        if not part:
            return None
        data += part
    return data

def main():
    header = read_exact(4)
    if not header:
        return
    size = struct.unpack('<I', header)[0]
    if size > 4096:
        return
    try:
        message = json.loads(read_exact(size))
        response = measure() if message == {'command':'metrics'} else {'ok':False,'error':'Unsupported request'}
    except Exception:
        response = {'ok':False,'error':'Unable to read Chrome process metrics'}
    data = json.dumps(response).encode('utf-8')
    sys.stdout.buffer.write(struct.pack('<I', len(data)) + data)
    sys.stdout.buffer.flush()

if __name__ == '__main__':
    main()
