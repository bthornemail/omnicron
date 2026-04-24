# QEMU Storage Daemon, QMP, and QOM

## QEMU Storage Daemon

### What It Is

qemu-storage-daemon is a long-running process that provides disk/image services WITHOUT running a full VM:

```
┌─────────────────────────────────────────────────────────────┐
│  qemu-system-riscv64 (Full VM)                              │
│  - Emulates CPU, memory, devices                            │
│  - Runs guest OS                                       │
│  - Heavyweight, many resources                         │
├─────────────────────────────────────────────────────────────┤
│  qemu-storage-daemon (Services only)                   │
│  - No CPU emulation                                    │
│  - No guest OS                                      │
│  - Just block/image services                          │
│  - Lightweight                                     │
│  - Controlled via QMP                               │
└─────────────────────────────────────────────────────────────┘
```

### Why Use It

1. **Export disk images over network** (NBD)
2. **Run block jobs** (backup, mirror) without VM
3. **Test storage** without booting VM
4. **Remote storage management**

### Starting Storage Daemon

```sh
# Minimal: export image via NBD
qemu-storage-daemon \
  --blockdev driver=file,filename=disk.qcow2,node-name=hd0 \
  --nbd-server,chardev=nbd0 \
  --chardev socket,id=nbd0,server=on,wait=off,tcp=0.0.0.0:10809

# With multiple exports
qemu-storage-daemon \
  --blockdev driver=file,filename=disk1.qcow2,node-name=hd0 \
  --blockdev driver=file,filename=disk2.qcow2,node-name=hd1 \
  --nbd-server,chardev=nbd,on-connection=accept \
  --chardev socket,id=nbd,server=on,wait=off,tcp=0.0.0.0:10809 \
  --export nbd,node-name=hd0,name=disk1 \
  --export nbd,node-name=hd1,name=disk2
```

### Connecting to Storage Daemon

```sh
# As NBD client
qemu-system-riscv64 -drive file=nbd://localhost:10809/disk1

# As QMP client
nc localhost 4444
{"execute": "qmp_capabilities"}
{"execute": "query-exports"}
```

## QMP (QEMU Machine Protocol)

### What is QMP?

QMP is how you CONTROL QEMU programmatically:

```
┌─────────────────────────────────────────────────────────────┐
│  Two Ways to Control QEMU                                  │
│                                                             │
│  1. HMP (Human Monitor Protocol)                        │
│     - Text commands you type manually                     │
│     - (qemu) stop                                      │
│     - (qemu) cont                                     │
│                                                             │
│  2. QMP (QEMU Machine Protocol)                      │
│     - JSON commands over socket/pipe                   │
│     - Programmatic control                            │
│     - {"execute": "stop"}                             │
│     - {"execute": "cont"}                            │
└─────────────────────────────────────────────────────────────┘
```

### QMP Basics

```sh
# Connect via socket
socat - UNIX-CONNECT:/tmp/qemu.sock

# Connect via TCP
nc localhost 4444

# Or use QMP capability
qemu-system-riscv64 -qmp unix:/tmp/qemu.sock,server,nowait
```

### QMP Session

```json
// 1. Connect - server sends greeting
{"QMP": {"version": {"qemu": {"major": 8, "minor": 0}}, "capabilities": []}}

// 2. Send capabilities
{"execute": "qmp_capabilities"}

// 3. Now you can run commands
{"execute": "stop"}

// 4. Response
{"return": {}}

// 5. Query state
{"execute": "query-status"}

// 6. Response
{"return": {"status": "running", "singlestep": false}}
```

## Common QMP Commands

### VM Control

```json
{"execute": "stop"}
{"execute": "cont"}
{"execute": "system_reset"}
{"execute": "system_powerdown"}
{"execute": "quit"}
```

### Block Devices

```json
{"execute": "query-block"}
{"execute": "query-blockdevices"}

{"execute": "drive-backup", "arguments": {
  "device": "hd0",
  "target": "backup.qcow2",
  "sync": "full"
}}

{"execute": "block-stream", "arguments": {
  "device": "hd0",
  "base": "base.qcow2"
}}

{"execute": "block-commit", "arguments": {
  "device": "hd0"
}}
```

### Memory

```json
{"execute": "query-memory"}
{"execute": "query-memory-size"}
{"execute": "balloon", "arguments": {"value": 1024000}}
```

### CPUs

```json
{"execute": "query-cpus"}
{"execute": "query-cpu-definitions"}

{"execute": "cpu-set", "arguments": {
  "index": 0,
  "disabled": true
}}
```

### Devices

```json
{"execute": "query-devices"}
{"execute": "query-pci"}
{"execute": "query-usb"}
{"execute": "query-roms"}
```

### Snapshots

```json
{"execute": "query-snapshots"}

{"execute": "savevm", "arguments": {
  "name": "my-snapshot"
}}

{"execute": "loadvm", "arguments": {
  "name": "my-snapshot"
}}

{"execute": "delvm", "arguments": {
  "name": "my-snapshot"
}}
```

### Graphics

```json
{"execute": "query-vnc"}
{"execute": "query-spice"}
```

### Network

```json
{"execute": "query-net"}
{"execute": "query-counters"}
```

### Transactions

```json
{"execute": "transaction", "arguments": {
  "actions": [
    {"type": "stop", "data": {}},
    {"type": "drive-backup", "data": {
      "device": "hd0",
      "target": "backup.qcow2"
    }}
  ]
}}
```

## Common Data Types

### Integers

```json
"integer": 42
"uint8": 255
"uint16": 65535
"uint32": 4294967295
"uint64": 18446744073709551615
```

### Strings

```json
"string": "hello"
"str": "/path/to/file"
```

### Booleans

```json
{"execute": "device_add", "arguments": {
  "driver": "virtio-blk",
  "id": "virtio-disk",
  "readonly": true
}}
```

### Structs

```json
{"execute": "device_add", "arguments": {
  "driver": "virtio-blk-pci",
  "id": "disk0",
  "drive": "hd0",
  "romfile": "/path/to/rom.bin",
  "rombar": 1,
  "failover": false
}}
```

### Arrays

```json
{"execute": "transaction", "arguments": {
  "actions": [
    {"type": "stop", "data": {}},
    {"type": "cont", "data": {}}
  ]
}}
```

### References

```json
{"execute": "drive-backup", "arguments": {
  "device": "ide0-hd0",  // Reference by ID
  "target": "/path/to/backup.qcow2"
}}
```

## Socket Data Types

### TCP Socket

```sh
qemu-system-riscv64 \
  -qmp tcp:localhost:4444,server,nowait \
  -qmp tcp:192.168.1.100:4444,server
```

### Unix Socket

```sh
qemu-system-riscv64 \
  -qmp unix:/tmp/qemu.sock,server,nowait
```

### SSL/TLS

```sh
qemu-system-rrecv64 \
  -qmp tcp:localhost:4444,server,nowait,x509-cacert=ca.pem \
  -qmp tcp:localhost:4444,server,nowait,x509-cert=server.pem,x509-key=server-key.pem
```

### Via Command Line

```json
{"execute": "netdev_add", "arguments": {
  "type": "socket",
  "id": "socket0",
  "fd": "localhost:4444"
}}

{"execute": "chardev-add", "arguments": {
  "id": "serial0",
  "backend": {
    "type": "socket",
    "data": {
      "addr": {
        "host": "0.0.0.0",
        "port": "4444"
      },
      "server": true,
      "wait": false
    }
  }
}}
```

## Cryptography

### TLS Setup

```sh
# Generate certificates
openssl req -new -x509 -nodes -newkey rsa:4096 \
  -keyout ca-key.pem -out ca.pem \
  -subj "/CN=QEMU CA"

openssl req -new -x509 -nodes -newkey rsa:4096 \
  -keyout server-key.pem -out server.pem \
  -subj "/CN=QEMU Server"

# Use with QEMU
qemu-system-riscv64 \
  -object tls-creds-x509,id=tls0,endpoint=server,dircert=/path \
  -qmp tcp::4444,tls-creds=tls0
```

### Encrypted Secrets

```sh
# Create secret
-qemu \
  -object secret,id=sec0,file=secret.txt \
  -object secret,id=sec0,data=password,format=opaque
```

### Blockdev with Encryption

```json
{"execute": "blockdev-add", "arguments": {
  "node-name": "encrypted-disk",
  "driver": "qcow2",
  "file": {
    "driver": "file",
    "filename": "disk.qcow2",
    "secret": {
      "type": "encryption",
      "id": "my-secret"
    }
  }
}}
```

## Background Jobs

### Job Types

1. **Backup** - Copy disk to new location
2. **Mirror** - Mirror to new location
3. **Stream** - Fill from backing file
4. **Commit** - Commit to backing file

### Job Commands

```json
// Start backup
{"execute": "drive-backup", "arguments": {
  "device": "hd0",
  "target": "backup.qcow2",
  "sync": "full",     // or "incremental"
  "format": "qcow2"
}}

// Query jobs
{"execute": "query-jobs"}

// Cancel job
{"execute": "job-cancel", "arguments": {"id": "backup0"}}

// Pause job  
{"execute": "job-pause", "arguments": {"id": "backup0"}}

// Resume job
{"execute": "job-resume", {"arguments": {"id": "backup0"}}

// Complete job
{"execute": "job-complete", "arguments": {"id": "backup0"}}
```

### Job Status

```json
{"execute": "query-jobs"}
{"return": [
  {
    "id": "backup0",
    "type": "backup",
    "status": "running",
    "ready": false,
    "offset": 1073741824,
    "len": 21474836480,
    "completed": 1073741824,
    "total": 21474836480
  }
]}
```

## Block Devices

### Adding Block Devices

```json
{"execute": "blockdev-add", "arguments": {
  "node-name": "disk0",
  "driver": "file",
  "filename": "/path/to/disk.qcow2",
  "aio": "native",
  "discard": "unmap",
  "detect-zeroes": "unmap"
}}

{"execute": "device_add", "arguments": {
  "driver": "virtio-blk-pci",
  "id": "virtio0",
  "drive": "disk0",
  "serial": "DISK-001"
}}
```

### Removing Block Devices

```json
{"execute": "device_del", "arguments": {
  "id": "virtio0"
}}

{"execute": "blockdev-del", "arguments": {
  "node-name": "disk0"
}}
```

### Block Device Exports

```json
{"execute": "block-export-add", "arguments": {
  "id": "export0",
  "type": "nbd",
  "node-name": "disk0",
  "name": "my-disk",
  "writable": true
}}
```

## Character Devices

### Types

| Type | Description |
|------|------------|
| `pty` | Pseudo-terminal |
| `vc` | Virtual console |
| `null` | Discard output |
| `file` | Write to file |
| `stdio` | Standard input/output |
| `pipe` | Named pipe |
| `socket` | Network socket |
| `msmouse` | Mouse |
| `braille` | Braille device |

### Adding Character Devices

```json
{"execute": "chardev-add", "arguments": {
  "id": "serial0",
  "backend": {
    "type": "socket",
    "data": {
      "addr": {
        "host": "0.0.0.0",
        "port": "4444"
      },
      "server": true,
      "wait": false
    }
  }
}}

{"execute": "chardev-add", "arguments": {
  "id": "logfile",
  "backend": {
    "type": "file",
    "data": {
      "out": "/var/log/qemu.log"
    }
  }
}}
```

## QEMU Object Model (QOM)

### What is QOM?

QOM = QEMU Object Model - the type system for devices:

```
┌─────────────────────────────────────────────────────────────┐
│  QOM = QEMU Object Model                                  │
│                                                             │
│  Like C++ classes but dynamic:                          │
│  - Types registered at runtime                           │
│  - Single inheritance                              │
│  - Multiple inheritance via interfaces            │
│  - Properties accessible via QMP               │
│                                                             │
│  Root: TYPE_OBJECT                                 │
│       ├── TYPE_DEVICE                               │
│       │     ├── TYPE_CPU                           │
│       │     ├── TYPE_MEMORY_REGION                │
│       │     └── ...                              │
│       └── TYPE_INTERFACE (stateless)             │
└─────────────────────────────────────────────────────────────┘
```

### Type Hierarchy

```
TYPE_OBJECT
    ├── TYPE_DEVICE
    │     ├── TYPE_CPU (virtio-blk, e1000, etc.)
    │     ├── TYPE_MEMORY_REGION
    │     ├── TYPE_BUS
    │     └── ...
    └── TYPE_INTERFACE
          ├── TYPE_USER_NETLINK
          └── TYPE_SOUNDWIFACE
```

### Creating Objects

```json
// Via QMP
{"execute": "object-add", "arguments": {
  "id": "my-memory",
  "type": "memory-backend-ram",
  "props": {
    "size": 1073741824
  }
}}

// Delete object
{"execute": "object-del", "arguments": {
  "id": "my-memory"
}}
```

### Object Properties

```json
// Query properties
{"execute": "qom-list", "arguments": {
  "path": "/machine"
}}

// Get property
{"execute": "qom-get", "arguments": {
  "path": "/machine/unattached/device[0]",
  "property": "id"
}}

// Set property  
{"execute": "qom-set", "arguments": {
  "path": "/machine/unattached/device[0]",
  "property": "disabled",
  "value": true
}}
```

## QEMU Interfaces

### What Are Interfaces?

Interfaces are stateless mixins - objects can implement multiple:

```c
// Define interface
static InterfaceClass my_iface_class = {
    .parent = TYPE_INTERFACE,
    .interface_id = TYPE_MY_IFACE,
    .properties = my_properties
};

// Device implements interface
static const InterfaceInfo my_device = {
    .id = TYPE_MY_DEVICE,
    .interfaces = ((const char*[]){
        TYPE_MY_IFACE,
        NULL
    })
};
```

### Built-in Interfaces

| Interface | Purpose |
|-----------|---------|
| `TYPE_USER_NETLINK` | User netlink |
| `TYPE_SOUNDWIFACE` | Sound |
| `TYPE_USB_INTERFACE` | USB |

## D-Bus VMState

### What is VMState?

VMState lets you save/restore device state via D-Bus:

```json
// Save state via QMP
{"execute": "savevm", "arguments": {
  "name": "my-snapshot"
}}

// Load state
{"execute": "loadvm", "arguments": {
  "name": "my-snapshot"
}}
```

### VMState Format

```c
// Device saves state
static const VMStateDescription vmstate_my_device = {
    .name = "my-device",
    .version_id = 1,
    .minimum_version_id = 1,
    .post_load = my_device_post_load,
    .pre_save = my_device_pre_save,
    .fields = (VMStateField[]){
        VMSTATE_UINT32(state, MyDevice),
        VMSTATE_END_OF_LIST()
    }
};
```

## D-Bus Display

### What is D-Bus Display?

D-Bus display allows remote display:

```sh
qemu-system-riscv64 \
  -display dbus
```

### Via QMP

```json
{"execute": "dbus-display-get-server", "arguments": {
  "id": "display0"
}}
```

## Net Devices

### Adding Networks

```json
{"execute": "netdev_add", "arguments": {
  "id": "net0",
  "type": "user",
  "net": "192.168.1.0/24",
  "dhcpstart": "192.168.1.100",
  "dns": "8.8.8.8"
}}

{"execute": "netdev_add", "arguments": {
  "id": "net1", 
  "type": "tap",
  "ifname": "tap0",
  "script": "no",
  "downscript": "no"
}}
```

### Connecting Devices

```json
{"execute": "device_add", "arguments": {
  "id": "net0",
  "driver": "virtio-net-pci",
  "netdev": "net0"
}}
```

## eBPF Objects

### What is eBPF?

eBPF = Extended Berkeley Packet Filter - run code in kernel:

```sh
# Using eBPF for filtering
qemu-system-riscv64 \
  -object ebpf-ratelimit,id=rl0
```

### eBPF Commands

```json
{"execute": "object-add", "arguments": {
  "id": "ebpf1",
  "type": "ebpf-ratelimit",
  "props": {
    "rate": 1000,
    "burst": 100
  }
}}
```

## Rocker Switch

### Programmatic Control

```json
{"execute": "device_add", "arguments": {
  "id": "switch0",
  "driver": "rocker",
  "ports": 4
}}

{"execute": "rocker-command", "arguments": {
  "id": "switch0",
  "cmd": "show"
}}
```

## QMP Introspection

### What's Available

```json
// List commands
{"execute": "query-commands"}

// List QMP schema
{"execute": "qmp_schema"}

// List qom types
{"execute": "qom-list-types"}

// List PCI devices
{"execute": "query-pci"}

// USB devices
{"execute": "query-usb"}

// Describe command
{"execute": "human-monitor-command", "arguments": {
  "command-line": "info qtree"
}}
```

## User Authorization

### Authorization Classes

```json
{"execute": "object-add", "arguments": {
  "id": "auth0",
  "type": "authz-list",
  "props": {
    "entries": [
      {"peername": "192.168.1.50"},
      {"peername": "*.example.com"}
    ]
  }
}}
```

## Transactions

### Atomic Operations

```json
{"execute": "transaction", "arguments": {
  "actions": [
    {
      "type": "stop",
      "data": {}
    },
    {
      "type": "drive-backup", 
      "data": {
        "device": "hd0",
        "target": "backup.qcow2"
      }
    },
    {
      "type": "cont",
      "data": {}
    }
  ]
}}
```

### Transaction Types

| Action | Purpose |
|--------|---------|
| `stop` | Stop VM |
| `cont` | Resume VM |
| `drive-backup` | Backup |
| `drive-mirror` | Mirror |
| `blockdev-backup` | Blockdev backup |

## Summary: Control Flow

```
┌─────────────────────────────────────────────────────────────┐
│  Your Control Flow                                        │
│                                                             │
│  1. Start storage daemon:                               │
│     qemu-storage-daemon --qmp unix:/sock,server           │
│                                                             │
│  2. Connect via QMP:                                     │
│     nc -U /sock                                           │
│     {"execute": "qmp_capabilities"}                        │
│                                                             │
│  3. Add block device:                                     │
│     {"execute": "blockdev-add", ...}                      │
│                                                             │
│  4. Start backup job:                                    │
│     {"execute": "drive-backup", ...}                      │
│                                                             │
│  5. Monitor job:                                          │
│     {"execute": "query-jobs"}                             │
│                                                             │
│  6. Add to VM:                                            │
│     {"execute": "device_add", ...}                       │
│                                                             │
│  7. Run VM:                                               │
│     {"execute": "cont"}                                   │
└─────────────────────────────────────────────────────────────┘
```

## Quick Reference

| Command Area | QMP | HMP |
|--------------|-----|-----|
| Stop VM | `{"execute": "stop"}` | `stop` |
| Resume | `{"execute": "cont"}` | `cont` |
| List devices | `query-block` | `info block` |
| Add device | `device_add` | `device_add` |
| Backup | `drive-backup` | `backup` |
| Query jobs | `query-jobs` | `info jobs` |