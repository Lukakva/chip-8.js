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
		Opcode: 00E0
		Clears the screen (black)
	*/
	clear() {
		const { screen } = this.chip

		for (let i = 0; i < screen.length; i++) {
			for (let j = 0; j < screen[0].length; j++) {
				screen[i][j] = 0
			}
		}

		this.chip.refreshDisplay()
		this.chip.pc += 2
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
			throw new Error('Something went wrong. The program is jumping to the current Program Counter. Infinite loop is inevitable?')
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
	bitwiseAnd() {
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
		const { code, chip, chip: {registers, screen} } = this

		const X = (code & 0x0F00) >> 8
		const Y = (code & 0x00F0) >> 4
		const N = (code & 0x000F)

		const coordX = registers[X]
		const coordY = registers[Y]

		// Indicate if any pixel was flipped from set to unset
		registers[0xF] = 0

		for (let y = 0; y < N; y++) {
			// A row of 8 pixels (where every bit is a pixel color)
			const row = chip.memory[chip.registerI + y]

			// Loop over each pixel value (bit by bit)
			for (let x = 0; x < 8; x++) {
				const mask = 0x80 >> x
				// If this pixel should be flipped
				if ((row & mask) > 0) {
					// This pixel was 1? It's gonna be 0 now. Set the VF register
					if (screen[coordY + y][coordX + x] === 1) {
						registers[0xF] = 1
					}

					screen[coordY + y][coordX + x] ^= 1
				}
			}
		}

		chip.refreshDisplay()
		chip.pc += 2
	}

	/*
		Opcode: FX07
		Sets VX to the value of the delay timer.
	*/
	getDelayTimer() {
		const { code, chip } = this

		const X = (code & 0x0F00) >> 8

		chip.registers[X] = this.delayTimer
		chip.pc += 2
	}

	/*
		Opcode: FX15
		Sets the delay timer to VX.
	*/
	setDelayTimer() {
		const { code, chip } = this

		const X = (code & 0x0F00) >> 8

		this.delayTimer = chip.registers[X]
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

	getInstructionName() {
		const code = this.code
		// The only 2 opcodes that can be matched exactly
		if (code === 0x00E0) {
			return 'clear'
		}

		if (code === 0x00EE) {
			return 'returnFromSubroutine'
		}

		// Otherwise, opcodes depend on the first hex value (first 4 bits)
		switch (code & 0xF000) {
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

			case 0xF000: {
				// For F opcodes, the last 2 bits are the identifiers
				switch (code & 0x00FF) {
					case 0x07: {
						return 'getDelayTimer'
					}

					case 0x15: {
						return 'getDelayTimer'
					}

					case 0x1E: {
						return 'addMem'
					}
				}
			}
		}

		throw new Error('Unknown instruction: 0x' + hex(code))
	}

	execute() {
		const name = this.getInstructionName()
		console.log('Executing instruction:', name)

		this[name]()
	}
}
