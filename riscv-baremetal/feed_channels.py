#!/usr/bin/env python3
# OMICRON Channel Feeder
# Feeds data into 4 VirtIO serial channels simultaneously

import socket
import time
import sys
import os

CHANNELS = [
    ("/tmp/omicron_ch0", "Binary (2→4→8→16→256)"),
    ("/tmp/omicron_ch1", "Decimal (7×15×60)"),
    ("/tmp/omicron_ch2", "Hex (240×256)"),
    ("/tmp/omicron_ch3", "Sign (BOM FFFE/FEFF)"),
]

def create_socket(path):
    """Create a Unix domain socket"""
    if os.path.exists(path):
        os.unlink(path)
    sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    sock.bind(path)
    sock.listen(1)
    return sock

def wait_for_connection(sock):
    """Wait for QEMU to connect"""
    conn, addr = sock.accept()
    return conn

def send_data(conn, data):
    """Send data to channel"""
    if conn:
        conn.sendall(data.encode('latin-1'))

def main():
    print("=== OMICRON Channel Feeder ===")
    print("Waiting for QEMU to start with VirtIO channels...")
    
    sockets = []
    connections = []
    
    # Create all sockets first
    for path, desc in CHANNELS:
        print(f"Creating {path}: {desc}")
        sock = create_socket(path)
        sockets.append(sock)
    
    # Wait for connections (QEMU accepts each)
    print("\nWaiting for QEMU connections...")
    for i, sock in enumerate(sockets):
        try:
            conn = wait_for_connection(sock)
            connections.append(conn)
            print(f"Channel {i} connected!")
        except socket.timeout:
            print(f"Channel {i} timeout")
    
    # Now feed data
    print("\n=== Feeding Channels ===\n")
    
    # Channel 0: Binary - Stars and Bars header (0xAAAAAAAA)
    ch0_payload = bytes([0x1B, 0x1F, 0x05]) + bytes([0xAA] * 8)
    if connections[0]:
        connections[0].sendall(ch0_payload)
        print(f"Ch0 (Binary): {ch0_payload.hex()}")
    
    # Channel 1: Decimal - FANO phase indicator
    ch1_payload = b"FANO\x00\x01\x02\x03\x04\x05\x06"
    if connections[1]:
        connections[1].sendall(ch1_payload)
        print(f"Ch1 (Decimal): {ch1_payload}")
    
    # Channel 2: Hex - 240/256 resolution 
    ch2_payload = b"\x00\xF0\x00\x00\x00\x00" + bytes(range(240))
    if connections[2]:
        connections[2].sendall(ch2_payload[:16])
        print(f"Ch2 (Hex): First 16 bytes sent")
    
    # Channel 3: Sign - BOM flip
    ch3_payload = bytes([0xFF, 0xFE])
    if connections[3]:
        connections[3].sendall(ch3_payload)
        print(f"Ch3 (Sign): BOM = {ch3_payload.hex()}")
    
    print("\n=== Initial payload delivered ===")
    print("Channels now streaming...")
    
    # Keep feeding
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        pass
    
    # Cleanup
    for conn in connections:
        if conn:
            conn.close()
    for sock in sockets:
        sock.close()
    for path, _ in CHANNELS:
        if os.path.exists(path):
            os.unlink(path)

if __name__ == "__main__":
    main()