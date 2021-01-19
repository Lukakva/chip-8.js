/*
	All instructions are listed in the order of this table
	https://en.wikipedia.org/wiki/CHIP-8#Opcode_table

	Although some of the functions should be next to each other
	(like callSubroutine, returnFromSubroutine)
*/

const hex = n => '0x' + n.toString(16).toUpperCase()

export default class Instruction {
	constructor(code, chip) {
		this.code = code
		this.chip = chip
	}

	/*
		Opcode: 0NNN
		Calls machine code routine (RCA 1802 for COSMAC VIP) at address NNN.
		Not necessary for most ROMs.
	*/
	doNothing() {
		this.chip.pc += 2
	}

	/*
		Opcode: 00E0
		Clears the screen (black)
	*/
	clear() {
		const { screen } = this.chip

		for (let y = 0; y < screen.height; y++) {
			for (let x = 0; x < screen.width; x++) {
				screen.pixels[y][x] = 0
			}
		}

		this.chip.pc += 2
		this.chip.screenChanged = true
	}

	/*
		Opcode: 0x00EE
		Returns from a subroutine
	*/
	returnFromSubroutine() {
		const { chip } = this
		/*
			Retrieve the program counter at the end of the stack
			Pop the stack (by decremeting the stack pointer)
			And move the program counter to the next instruction (+ 2 bytes)

			A more readable version (just for convenience)

			chip.sp -= 1
			chip.pc = chip.stack[chip.sp]
			chip.pc += 2
		*/

		chip.pc = chip.stack[--chip.sp] + 2
	}

	/*
		Opcode: 1NNN
		Jumps to address NNN
	*/
	jump() {
		const NNN = this.code & 0x0FFF
		if (this.chip.pc === NNN) {
			this.chip.halted = true
			return
			throw new Error('Something went wrong. The jump instruction is jumping to the current Program Counter. This will cause an infinite loop. Halting')
		}

		this.chip.pc = NNN
	}

	/*
		Opcode: 2NNN
		Executes the subroutine at NNN
	*/
	callSubroutine() {
		const nnn = this.code & 0x0FFF
		const chip = this.chip

		if (chip.sp >= chip.stack.length) {
			throw new Error(
				'Could not enter a subroutine at ' + hex(nnn)
				+ 'from PC ' + hex(chip.pc) + 'because the stack is full.'
			)
		}

		chip.stack[chip.sp++] = chip.pc
		chip.pc = nnn
	}

	/*
		Opcode: 3XNN
		Skips the next instruction if the value stored in the register X
		is equal to the constant NN
	*/
	skipIfRegisterEquals() {
		const { code, chip, chip: {registers} } = this

		const X = (code & 0x0F00) >> 8
		const NN = code & 0x00FF

		if (registers[X] === NN) {
			chip.pc += 4
		} else {
			chip.pc += 2
		}
	}

	/*
		Opcode: 4XNN
		Skips the next instruction if the value stored in the register X
		IS NOT equal to the constant NN
	*/
	skipIfRegisterNotEquals() {
		const { code, chip, chip: {registers} } = this

		const X = (code & 0x0F00) >> 8
		const NN = code & 0x00FF

		if (registers[X] !== NN) {
			chip.pc += 4
		} else {
			chip.pc += 2
		}
	}

	/*
		Opcode: 5XY0
		Skips the next instruction if the values stored in registers X and Y
		are equal to each other
	*/
	skipIfRegistersEqual() {
		const { code, chip, chip: {registers} } = this

		const X = (code & 0x0F00) >> 8
		const Y = (code & 0x00F0) >> 4

		if (registers[X] === registers[Y]) {
			chip.pc += 4
		} else {
			chip.pc += 2
		}
	}

	/*
		Opcode: 6XNN
		Sets VX to NN.
	*/
	setRegisterValue() {
		const { chip, code } = this

		const X = (code & 0x0F00) >> 8
		const NN = code & 0x00FF

		chip.registers[X] = NN
		chip.pc += 2
	}

	/*
		Opcode: 7XNN
		Adds NN to VX. (Carry flag is not changed)
	*/
	addToRegisterValue() {
		const { chip, code} = this

		const X = (code & 0x0F00) >> 8
		const NN = code & 0x00FF

		chip.registers[X] += NN
		// Limit to 255 (Mimic a 8bit behavior)
		chip.registers[X] &= 0xFF

		chip.pc += 2
	}

	/*
		Opcode: 8XY0
		Assignment - Sets VX to the value of VY.
	*/
	assign() {
		const { code, chip, chip: {registers} } = this

		const X = (code & 0x0F00) >> 8
		const Y = (code & 0x00F0) >> 4

		registers[X] = registers[Y]
		chip.pc += 2
	}

	/*
		Opcode: 8XY1
		Sets VX to VX or VY. (Bitwise OR operation)
	*/
	bitwiseOr() {
		const { code, chip, chip: {registers} } = this

		const X = (code & 0x0F00) >> 8
		const Y = (code & 0x00F0) >> 4

		registers[X] = registers[X] | registers[Y]
		chip.pc += 2
	}

	/*
		Opcode: 8XY2
		Sets VX to VX and VY. (Bitwise AND operation)
	*/
	bitwiseAnd() {
		const { code, chip, chip: {registers} } = this

		const X = (code & 0x0F00) >> 8
		const Y = (code & 0x00F0) >> 4

		registers[X] = registers[X] & registers[Y]
		chip.pc += 2
	}

	/*
		Opcode: 8XY3
		Sets VX to VX xor VY.
	*/
	bitwiseXor() {
		const { code, chip, chip: {registers} } = this

		const X = (code & 0x0F00) >> 8
		const Y = (code & 0x00F0) >> 4

		registers[X] = registers[X] ^ registers[Y]
		chip.pc += 2
	}

	/*
		Opcode: 8XY4
		Adds VY to VX. VF is set to 1 when there's a carry,
		and to 0 when there isn't.
	*/
	add() {
		const { code, chip, chip: {registers} } = this

		const X = (code & 0x0F00) >> 8
		const Y = (code & 0x00F0) >> 4

		/*
			Thankfully JavaScript can operate on ints larger than 8 bits :v
			If the result is larger than a 8 bit integer (255), we have a carry
		*/
		const result = registers[X] + registers[Y]
		const carry = result > 0xFF

		// Store the carry in VF Register
		registers[0xF] = carry
		// Limit the resulting sum by 255
		registers[X] = result & 0xFF

		chip.pc += 2
	}

	/*
		Opcode: 8XY4
		VY is subtracted from VX. VF is set to 0 when there's a borrow,
		and 1 when there isn't.
	*/
	subtract() {
		const { code, chip, chip: {registers} } = this

		const X = (code & 0x0F00) >> 8
		const Y = (code & 0x00F0) >> 4

		/*
			A borrow occurs if X < Y, but instruction requires the VF
			register to be set to 0 if there is a borrow, so we reverse it
			to X >= Y
		*/
		registers[0xF] = registers[X] >= registers[Y]
		registers[X] -= Y

		chip.pc += 2
	}

	/*
		Opcode: 8XY6
		Stores the least significant bit of VX in VF
		and then shifts VX to the right by 1.
	*/
	shiftRight() {
		const { code, chip, chip: {registers} } = this

		const X = (code & 0x0F00) >> 8
		const Y = (code & 0x00F0) >> 4

		// Store the least significant bit
		registers[0xF] = registers[X] & 0x1
		registers[X] >>= 1

		chip.pc += 2
	}

	/*
		Opcode: 8XY7
		Sets VX to VY minus VX. VF is set to 0 when there's a borrow,
		and 1 when there isn't.
	*/
	subtractRegisters() {
		const { code, chip, chip: {registers} } = this

		const X = (code & 0x0F00) >> 8
		const Y = (code & 0x00F0) >> 4

		// Store the least significant bit
		registers[0xF] = registers[Y] >= registers[X]
		registers[X] = registers[Y] - registers[X]

		chip.pc += 2
	}

	/*
		Opcode: 8XYE
		Stores the most significant bit of VX in VF
		and then shifts VX to the left by 1.
	*/
	shiftLeft() {
		const { code, chip, chip: {registers} } = this

		const X = (code & 0x0F00) >> 8
		const Y = (code & 0x00F0) >> 4

		// Get the most significant bit
		const msb = registers[X] & (1 << 7)

		// Store 1 if msb is 1
		registers[0xF] = msb > 0
		registers[X] <<= 1

		chip.pc += 2
	}

	/*
		Opcode: 9XY0
		Skips the next instruction if VX doesn't equal VY.
	*/
	skipIfRegistersNotEqual() {
		const { code, chip, chip: {registers} } = this

		const X = (code & 0x0F00) >> 8
		const Y = (code & 0x00F0) >> 4

		if (registers[X] !== registers[Y]) {
			// 4 instead of 2 (effectively skipping the next instruction)
			chip.pc += 4
		} else {
			chip.pc += 2
		}
	}

	/*
		Opcode: ANNN
		Sets I to the address NNN.
	*/
	setMemoryRegister() {
		const NNN = this.code & 0x0FFF

		this.chip.registerI = NNN
		this.chip.pc += 2
	}

	/*
		Opcode: BNNN
		Jumps to the address NNN plus V0.
	*/
	jumpV0() {
		const NNN = this.code & 0x0FFF
		this.chip.pc = this.chip.registers[0] + NNN
	}

	/*
		Opcode: CXNN
		Sets VX to the result of a bitwise and operation on a
		random number (Typically: 0 to 255) and NN.
	*/
	rand() {
		const { code, chip } = this

		const X = (code & 0x0F00) >> 8
		const NN = code & 0x00FF
		const random = Math.floor(Math.random() * 0x100)

		chip.registers[X] = random & NN
		chip.pc += 2
	}

	/*
		Opcode: DXYN
		Draws a sprite at coordinate (VX, VY) that has a width of 8 pixels
		and a height of N+1 pixels.
	*/
	draw() {
		/*
			Each row of 8 pixels is read as bit-coded
			starting from memory location I
		*/
		const { code, chip } = this
		const { registers, screen } = chip
		const pixels = screen.pixels

		const X = (code & 0x0F00) >> 8
		const Y = (code & 0x00F0) >> 4
		const N = (code & 0x000F)

		const startX = registers[X]
		const startY = registers[Y]

		// Indicate if any pixel was flipped from set to unset
		registers[0xF] = 0

		// So sometimes the ROM trusts the CPU to not render anything that
		// goes over the screen. Okay :)
		for (let y = 0; y < N && startY + y < screen.height; y++) {
			// A row of 8 pixels (where every bit is a pixel color)
			const row = chip.memory[chip.registerI + y]

			// Loop over each pixel value (bit by bit)
			for (let x = 0; x < 8; x++) {
				const mask = 0x80 >> x
				// If this pixel should be flipped
				if ((row & mask) > 0) {
					// Was this pixel a 1? It's 0 now. Set the VF register
					if (pixels[startY + y][startX + x]) {
						registers[0xF] = 1
					}

					pixels[startY + y][startX + x] ^= 1
				}
			}
		}

		chip.pc += 2
		chip.screenChanged = true
	}

	/*
		Opcode: EX9E
		Skips the next instruction if the key stored in VX is pressed.
	*/
	skipIfKeyPressed() {
		const { code, chip } = this
		const X = (code & 0x0F00) >> 8

		const desiredKey = chip.registers[X]
		if (chip.keyboard[desiredKey]) {
			chip.pc += 4
		} else {
			chip.pc += 2
		}
	}

	/*
		Opcode: EX9E
		Skips the next instruction if the key stored in VX isn't pressed.
	*/
	skipIfKeyNotPressed() {
		const { code, chip } = this

		const X = (code & 0x0F00) >> 8
		const desiredKey = chip.registers[X]

		if (!chip.keyboard[desiredKey]) {
			chip.pc += 4
		} else {
			chip.pc += 2
		}
	}

	/*
		Opcode: FX07
		Sets VX to the value of the delay timer.
	*/
	getDelayTimer() {
		const { code, chip } = this
		const X = (code & 0x0F00) >> 8

		chip.registers[X] = chip.delayTimer
		chip.pc += 2
	}

	/*
		Opcode: FX0A
		A key press is awaited, and then stored in VX.
		(Blocking operation)
	*/
	awaitKeyPress() {
		const { code, chip } = this

		const X = (code & 0x0F00) >> 8
		chip.halted = true
		chip.onNextKeyDown = key => {
			chip.registers[X] = key
			chip.halted = false
			chip.pc += 2
		}
	}

	/*
		Opcode: FX15
		Sets the delay timer to VX.
	*/
	setDelayTimer() {
		const { code, chip } = this
		const X = (code & 0x0F00) >> 8

		chip.delayTimer = chip.registers[X]
		chip.pc += 2
	}

	/*
		Opcode: FX18
		Sets the sound timer to VX.
	*/
	setSoundTimer() {
		const { code, chip } = this
		const X = (code & 0x0F00) >> 8

		chip.soundTimer = chip.registers[X]
		chip.pc += 2
	}

	/*
		Opcode: FX1E
		Adds VX to I. VF is not affected.
	*/
	addMem() {
		const { code, chip } = this

		const X = (code & 0x0F00) >> 8
		chip.registerI += chip.registers[X]
		// Limit to 16 bits
		chip.registerI &= 0xFFFF

		chip.pc += 2
	}

	/*
		Opcode: FX29
		Sets I to the location of the sprite for the character in VX.
		Characters 0-F (in hexadecimal) are represented by a 4x5 font.
	*/
	setCharacterInMemory() {
		const { code, chip } = this

		// Since all characters are a 5 byte sprite
		// We can just multiply the character index by 5
		// to move to the correct memory location
		const X = (code & 0x0F00) >> 8
		chip.registerI = chip.registers[X] * 0x5
		chip.pc += 2
	}

	/*
		Opcode: FX33
		Stores the binary-coded decimal representation of VX,
		with the mostsignificant of three digits at the address in I,
		the middle digit at I plus 1,
		and the least significant digit at I plus 2.
		(In other words, take the decimal representation of VX,
		place the hundreds digit in memory at location in I,
		the tens digit at location I+1,
		and the ones digit at location I+2.)
	*/
	storeBCD() {
		const { code, chip } = this

		const X = (code & 0x0F00) >> 8
		const N = chip.registers[X]
		const I = chip.registerI

		chip.memory[I + 0] = N / 100 		// 100
		chip.memory[I + 1] = (N % 100) / 10 // 10
		chip.memory[I + 2] = N % 10 		// 1

		chip.pc += 2
	}

	/*
		Opcode: FX55
		Stores V0 to VX (including VX) in memory starting at address I.
		The offset from I is increased by 1 for each value written,
		but I itself is left unmodified.
		(Meaning the I register is not modified)
	*/
	dumpRegisters() {
		const { code, chip } = this

		const X = (code & 0x0F00) >> 8
		for (let i = 0; i <= X; i++) {
			chip.memory[chip.registerI + i] = chip.registers[i]
		}

		chip.pc += 2
	}

	/*
		Opcode: FX65
		Fills V0 to VX (including VX) with values from memory starting
		at address I.
		The offset from I is increased by 1 for each value written,
		but I itself is left unmodified.
	*/
	loadRegisters() {
		const { code, chip } = this

		const X = (code & 0x0F00) >> 8
		for (let i = 0; i <= X; i++) {
			chip.registers[i] = chip.memory[chip.registerI + i]
		}

		chip.pc += 2
	}

	getInstructionName() {
		const code = this.code

		// Otherwise, opcodes depend on the first hex value (first 4 bits)
		switch (code & 0xF000) {
			case 0x0000: {
				switch (code & 0x00FF) {
					case 0xE0: {
						return 'clear'
					}

					case 0xEE: {
						return 'returnFromSubroutine'
					}

					default: {
						return 'doNothing'
					}
				}
			}

			case 0x1000: {
				return 'jump'
			}

			case 0x2000: {
				return 'callSubroutine'
			}

			case 0x3000: {
				return 'skipIfRegisterEquals'
			}

			case 0x4000: {
				return 'skipIfRegisterNotEquals'
			}

			case 0x5000: {
				return 'skipIfRegistersEqual'
			}

			case 0x6000: {
				return 'setRegisterValue'
			}

			case 0x7000: {
				return 'addToRegisterValue'
			}

			/*
				There are a few opcodes beginning with 8, which can be
				distinguished by the last 4 bits
			*/
			case 0x8000: {
				// The last 4 bits
				switch (code & 0x000F) {
					case 0x0: {
						return 'assign'
					}

					case 0x1: {
						return 'bitwiseOr'
					}

					case 0x2: {
						return 'bitwiseAnd'
					}

					case 0x3: {
						return 'bitwiseXor'
					}

					case 0x4: {
						return 'add'
					}

					case 0x5: {
						return 'subtract'
					}

					case 0x6: {
						return 'shiftRight'
					}

					case 0x7: {
						return 'subtractRegisters'
					}

					case 0xE: {
						return 'shiftLeft'
					}
				}
			}

			case 0x9000: {
				return 'skipIfRegistersNotEqual'
			}

			case 0xA000: {
				return 'setMemoryRegister'
			}

			case 0xB000: {
				return 'jumpV0'
			}

			case 0xC000: {
				return 'rand'
			}

			case 0xD000: {
				return 'draw'
			}

			case 0xE000: {
				switch (code & 0x00FF) {
					case 0x9E: {
						return 'skipIfKeyPressed'
					}

					case 0xA1: {
						return 'skipIfKeyNotPressed'
					}
				}
			}

			case 0xF000: {
				// For F opcodes, the last 2 bits are the identifiers
				switch (code & 0x00FF) {
					case 0x07: {
						return 'getDelayTimer'
					}

					case 0x0A: {
						return 'awaitKeyPress'
					}

					case 0x15: {
						return 'setDelayTimer'
					}

					case 0x18: {
						return 'setSoundTimer'
					}

					case 0x1E: {
						return 'addMem'
					}

					case 0x29: {
						return 'setCharacterInMemory'
					}

					case 0x33: {
						return 'storeBCD'
					}

					case 0x55: {
						return 'dumpRegisters'
					}

					case 0x65: {
						return 'loadRegisters'
					}
				}
			}
		}

		throw new Error(
			'Unknown instruction: ' + hex(code)
			+ '. At PC ' + this.chip.pc
		)
	}

	execute() {
		const name = this.getInstructionName()
		console.log('Executing instruction:', name)

		this[name]()
	}
}
