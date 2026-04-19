#!/usr/bin/env python3
# Ivshmem Mirror Viewer
# Reads the shared memory from host and displays the logic state

"""
SOURCE-OF-TRUTH NOTE

STATUS: HOST TOOL

This is a host-side viewer only. It assumes the guest is writing a specific
mirror layout into `/dev/shm/omicron_mirror`.

Important current caveat from code:
- the live `atomic_kernel.c` path disables mirror writes by returning null from
  `get_mirror()` when `IVSHMEM_BASE` is `0`
- so this viewer may show an existing file that remains all zeroes
"""

import mmap
import struct
import time
import sys

MEM_PATH = "/dev/shm/omicron_mirror"

def read_mirror():
    try:
        with open(MEM_PATH, "rb") as f:
            mm = mmap.mmap(f.fileno(), 0, mmap.MAP_SHARED, mmap.PROT_READ)
            
            data = []
            for i in range(68):
                val = struct.unpack("<I", mm[i*4:(i+1)*4])[0]
                data.append(val)
            mm.close()
            return data
    except Exception as e:
        return None

def display(data):
    if not data:
        print("Mirror not available - waiting for QEMU...")
        return
    
    print("\033[2J\033[H")  # Clear screen
    print("=== OMICRON LOGIC MIRROR ===")
    print(f"Phase: {data[64]} / 5040")
    print(f"BOM:   {data[65]:04X}")
    print(f"Win:   {data[66]} (15-window)")
    print(f"FP:    {data[67]:08X}")
    print("")
    
    print("Reg[0-7] (bitboard projection):")
    for i in range(8):
        print(f"  R{i}: {data[i]:016X}", end="")
        if (i+1) % 4 == 0:
            print("")
        else:
            print("  ", end="")
    print("")
    
    print(f"\nAddr240 state: {data[0]:064b}")

def main():
    print("Ivshmem Mirror Viewer")
    print("Press Ctrl+C to exit")
    print("")
    
    while True:
        data = read_mirror()
        if data:
            display(data)
        time.sleep(0.1)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nExiting...")
        sys.exit(0)
