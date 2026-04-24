# GDB with QEMU: Complete Guide

## What GDB Does

GDB = GNU Debugger. It lets you:
- Stop execution at any point
- See what's in registers
- See what's in memory
- Step through code one instruction at a time
- See function call stack
- Set breakpoints (stop when code reaches a line)

## How QEMU + GDB Works

```
┌─────────────────────────────────────────────────────────────┐
│  Your Machine (Host)                                        │
│                                                             │
│  ┌─────────────┐      TCP port      ┌─────────────────┐   │
│  │   GDB       │ ◄──────────────────►  │   QEMU           │   │
│  │  (debugger) │   remote debug    │  (emulator)      │   │
│  └─────────────┘                    │                 │   │
│                                     │  ┌───────────┐  │   │
│                                     │  │ RISC-V    │  │   │
│                                     │  │ VM        │  │   │
│                                     │  │           │  │   │
│                                     │  │ Your code │  │   │
│                                     │  │ runs here │  │   │
│                                     │  └───────────┘  │   │
│                                     └─────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

QEMU has a built-in GDB server (gdbstub). When you use `-gdb tcp::1234`, QEMU listens for GDB connections.

## Starting QEMU for Debugging

### Option 1: Wait for GDB (-S flag)

```sh
qemu-system-riscv64 \
  -machine virt \
  -m 512M \
  -nographic \
  -gdb tcp::1234 \
  -S \
  -kernel build-riscv/boot/vmlinuz-lts \
  -initrd build-riscv/omi-riscv-initramfs.cpio \
  -append "console=ttyS0 rdinit=/init panic=1"
```

What `-S` does:
- Freezes CPU at start
- Waits for you to say "go" in GDB
- This is important because otherwise code runs before you can set breakpoints

### Option 2: Don't Freeze (-gdb only)

```sh
qemu-system-riscv64 \
  -machine virt \
  -m 512M \
  -nographic \
  -gdb tcp::1234 \
  -kernel build-riscv/boot/vmlinuz-lts \
  -initrd build-riscv/omi-riscv-initramfs.cpio
```

CPU runs immediately. Connect GDB and break whenever.

### Option 3: QEMU Monitor (no -gdb)

```sh
qemu-system-riscv64 \
  -machine virt \
  -m 512M \
  -nographic \
  -monitor stdio \
  -kernel build-riscv/boot/vmlinuz-lts \
  -initrd build-riscv/omi-riscv-initramfs.cpio
```

Then type `(qemu)` to control QEMU. But this is NOT GDB.

## Connecting GDB

### In Another Terminal

```sh
# Load your kernel symbols
riscv64-linux-gnu-gdb build-riscv/boot/vmlinuz-lts

# Connect to QEMU
(gdb) target remote localhost:1234
```

### Or Connect to Remote Machine

```sh
# On your machine, QEMU is on another computer at 192.168.1.100
(gdb) target remote 192.168.1.100:1234
```

## Essential GDB Commands

### Starting/Stopping

```gdb
(gdb) target remote localhost:1234    # Connect to QEMU
(gdb) continue                        # Run (c also works)
(gdb) break main                      # Set breakpoint at main
(gdb) delete breakpoints              # Remove all breakpoints
```

### Stepping Through Code

```gdb
(gdb) si                              # Step one instruction (step into)
(gdb) ni                              # Step one instruction (step over)
(gdb) next                            # Step one line (step over in C)
(gdb) step                            # Step one line (step into in C)
(gdb) finish                          # Run until function returns
(gdb) until 100                      # Run until line 100
```

### Looking at Registers

```gdb
(gdb) info registers                  # Show all registers
(gdb) print $pc                       # Show program counter
(gdb) print $a0                       # Show argument 0
(gdb) print $sp                       # Show stack pointer
(gdb) print $ra                       # Show return address
(gdb) info registers pc               # Show specific register
```

RISC-V registers:
- `$zero` = always 0
- `$ra` = return address
- `$sp` = stack pointer
- `$gp` = global pointer
- `$tp` = thread pointer
- `$a0-$a7` = arguments
- `$t0-$t6` = temporaries
- `$s0-$s11` = saved registers
- `$pc` = program counter

### Looking at Memory

```gdb
(gdb) x/10xb 0x80000000              # Examine 10 bytes (hex)
(gdb) x/10xw 0x80000000              # Examine 10 words (32-bit hex)
(gdb) x/10xd 0x80000000              # Examine 10 decimal
(gdb) x/10i 0x80000000               # Examine 10 instructions
(gdb) x/s 0x80000000                 # Examine as string
(gdb) x/100xb $sp                    # Examine stack
```

Format: `x/Nf ADDRESS`

| Letter | Meaning |
|--------|---------|
| b | byte (8 bits) |
| h | halfword (16 bits) |
| w | word (32 bits) |
| g | giant (64 bits) |
| x | hex |
| d | decimal |
| u | unsigned decimal |
| o | octal |
| t | binary |
| i | instruction |
| s | string |
| c | character |

### Breakpoints

```gdb
(gdb) break *0x80000000               # Break at address
(gdb) break boot                      # Break at function
(gdb) break main                      # Break at line
(gdb) break 42                        # Break at line 42
(gdb) break boot if $a0 == 5          # Conditional breakpoint
(gdb) info breakpoints               # List breakpoints
(gdb) delete 1                        # Delete breakpoint 1
(gdb) disable 1                      # Disable breakpoint 1
(gdb) enable 1                        # Enable breakpoint 1
```

### Watchpoints (watch memory changes)

```gdb
(gdb) watch *0x80001000              # Stop when this address changes
(gdb) rwatch *0x80001000             # Stop when read
(gdb) awatch *0x80001000             # Stop when read or write
(gdb) info watchpoints
```

### Looking at Stack (Call Stack)

```gdb
(gdb) backtrace                      # Show call stack (bt also works)
(gdb) frame 0                        # Go to frame 0
(gdb) frame 1                        # Go to frame 1
(gdb) info frame                     # Show current frame details
(gdb) info args                      # Show function arguments
(gdb) info locals                    # Show local variables
```

### Disassembly

```gdb
(gdb) disassemble                    # Disassemble current function
(gdb) disassemble 0x80000000         # Disassemble at address
(gdb) disassemble /r                 # With raw bytes
(gdb) set disassemble-next-line on   # Always show next instruction
```

### Other Useful Commands

```gdb
(gdb) help                           # Help
(gdb) help break                    # Help on break command
(gdb) show args                     # Show program arguments
(gdb) set $a0 = 5                   # Set register value
(gdb) set *(int*)0x80000000 = 42   # Set memory value
(gdb) info threads                  # Show threads
(gdb) thread 2                     # Switch to thread 2
(gdb) signal 0                     # Deliver signal to program
(gdb) kill                          # Kill the program
(gdb) quit                          # Exit GDB
```

## Complete Debug Session Example

```gdb
# Connect
(gdb) target remote localhost:1234

# Set breakpoints
(gdb) break _start
(gdb) break boot
(gdb) break *0x80000000

# Run to first breakpoint
(gdb) continue

# Now at _start
(gdb) info registers

# Step through first few instructions
(gdb) x/20i $pc

# Continue to boot
(gdb) continue

# Now at boot
(gdb) info registers
(gdb) x/10xb $sp                    # Look at stack

# Set a memory watch
(gdb) watch *0x80001000

# Continue
(gdb) continue

# Watch triggered - see what changed
(gdb) backtrace
(gdb) info registers

# Continue
(gdb) continue
```

## Useful GDB Settings

Put in `~/.gdbinit`:

```gdb
set disassembly-flavor intel         # Or att (default)
set pagination off                  # Don't pause
set print pretty on                 # Pretty print structs
set print array on                  # Nice array output
set print elements 10               # Limit array output
set confirm off                     # Don't ask for confirmation
set height 0                        # No limit on lines
set width 0                        # No limit on columns

# Show source and disassembly
layout split
```

Or use in GDB:

```gdb
(gdb) set pagination off
(gdb) set print pretty on
```

## Scripting GDB

```gdb
# Run commands from file
(gdb) source my-commands.gdb

# my-commands.gdb:
target remote localhost:1234
break _start
break boot
continue
```

## GDB with Your Kernel

### Start QEMU

```sh
qemu-system-riscv64 \
  -machine virt \
  -m 512M \
  -nographic \
  -gdb tcp::1234 \
  -S \
  -kernel build-riscv/boot/vmlinuz-lts \
  -initrd build-riscv/omi-riscv-initramfs.cpio \
  -append "console=ttyS0 rdinit=/init panic=1"
```

### Connect GDB

```sh
riscv64-linux-gnu-gdb build-riscv/boot/vmlinuz-lts
```

### In GDB

```gdb
(gdb) target remote localhost:1234
(gdb) set pagination off
(gdb) break _start
(gdb) continue
# Now stopped at _start

(gdb) info registers
(gdb) x/10i $pc
(gdb) ni                           # Step next instruction
(gdb) ni
(gdb) ni
(gdb) continue                    # Let it run
```

## Common Problems

| Problem | Solution |
|---------|----------|
| "Connection refused" | QEMU not running or wrong port |
| "No executable file" | Load kernel: `file vmlinuz` |
| "No symbol table" | Kernel was compiled without debug (-g) |
| "Cannot access memory" | Wrong address or not mapped |
| GDB hangs | QEMU crashed, restart QEMU |

## Debug Your Octuple Encoding

```gdb
# Set breakpoint where you encode
(gdb) break omi_pack_significand
(gdb) break omi_pack_exponent

# Run until break
(gdb) continue

# Examine arguments
(gdb) info args
(gdb) print significand
(gdb) print /x significand         # Hex

# Step through encoding
(gdb) ni

# Watch output
(gdb) x/40xb cells
```

## Summary

```
┌──────────────────────────────────────────────────────────────┐
│  Commands You'll Use Most                                     │
├──────────────────────────────────────────────────────────────┤
│  target remote localhost:1234   Connect to QEMU              │
│  continue                        Run                         │
│  break *address                  Stop here                    │
│  si                              Step instruction            │
│  ni                              Step (skip calls)           │
│  info registers                  Show registers              │
│  x/10xb address                  Show memory                 │
│  x/10i address                   Show instructions           │
│  backtrace                       Show call stack             │
│  print $reg                      Show register value         │
│  set $reg = value                Set register value          │
└──────────────────────────────────────────────────────────────┘
```