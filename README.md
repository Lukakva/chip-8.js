# CHIP-8 Emulator

Yet another Chip-8 Virtual Machine! Supports all 35 opcodes.

<https://lukakva.github.io/chip-8.js/>

# Specs

| Spec | Value |
|---|---|
| CPU | 8 bit @ 60 Hz / 480 IPS |
| Memory | 4 KB |
| Registers | 16 8-bit registers + 1 16-bit memory register |
| Stack | Allows up to 16 subroutine calls
| Timers | 2 internal 60Hz timers
| Screen | 64x32 @ 60FPS

This codebase tries to make a good use of Uint8Array and Uint16Array classes in JavaScript. Tries.

# Keyboard

The webpage comes with a UI hex keyboard like so:

| __1__ | __2__ | __3__ | __C__ |
|---|---|---|---|
| 4 | 5 | 6 | D |
| 7 | 8 | 9 | E |
| A | 0 | B | F |

But it's also possible to use a physical, computer keyboard, which respectively maps the physical keys to the CHIP-8 keys like so:

| 1 | 2 | 3 | 4 |
|---|---|---|---|
| q | w | e | r |
| a | s | d | f |
| z | x | c | v |
