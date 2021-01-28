/*
	All instructions are listed in the order of this table
	https://en.wikipedia.org/wiki/CHIP-8#Opcode_table
*/

import { hex } from './Shared'

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

		screen.clear()

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
	jump(NNN) {
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
	callSubroutine(NNN) {
		const chip = this.chip

		if (chip.sp >= chip.stack.length) {
			throw new Error(
				'Could not enter a subroutine at ' + hex(NNN)
				+ 'from PC ' + hex(chip.pc) + 'because the stack is full.'
			)
		}

		chip.stack[chip.sp++] = chip.pc
		chip.pc = NNN
	}

	/*
		Opcode: 3XNN
		Skips the next instruction if the value stored in the register X
		is equal to the constant NN
	*/
	skipIfRegisterEquals(X, NN) {
		const { chip, chip: {registers} } = this

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
	skipIfRegisterNotEquals(X, NN) {
		const { chip, chip: {registers} } = this

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
	skipIfRegistersEqual(X, Y) {
		const { chip, chip: {registers} } = this

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
	setRegisterValue(X, NN) {
		const { chip, code } = this

		chip.registers[X] = NN
		chip.pc += 2
	}

	/*
		Opcode: 7XNN
		Adds NN to VX. (Carry flag is not changed)
	*/
	addToRegisterValue(X, NN) {
		const { chip, code} = this

		chip.registers[X] += NN

		chip.pc += 2
	}

	/*
		Opcode: 8XY0
		Assignment - Sets VX to the value of VY.
	*/
	assign(X, Y) {
		const { chip, chip: {registers} } = this

		registers[X] = registers[Y]
		chip.pc += 2
	}

	/*
		Opcode: 8XY1
		Sets VX to VX or VY. (Bitwise OR operation)
	*/
	bitwiseOr(X, Y) {
		const { chip, chip: {registers} } = this

		registers[X] = registers[X] | registers[Y]
		chip.pc += 2
	}

	/*
		Opcode: 8XY2
		Sets VX to VX and VY. (Bitwise AND operation)
	*/
	bitwiseAnd(X, Y) {
		const { chip, chip: {registers} } = this

		registers[X] = registers[X] & registers[Y]
		chip.pc += 2
	}

	/*
		Opcode: 8XY3
		Sets VX to VX xor VY.
	*/
	bitwiseXor(X, Y) {
		const { chip, chip: {registers} } = this

		registers[X] = registers[X] ^ registers[Y]
		chip.pc += 2
	}

	/*
		Opcode: 8XY4
		Adds VY to VX. VF is set to 1 when there's a carry,
		and to 0 when there isn't.
	*/
	add(X, Y) {
		const { chip, chip: {registers} } = this

		/*
			Thankfully JavaScript can operate on ints larger than 8 bits :v
			If the result is larger than a 8 bit integer (255), we have a carry
		*/
		const result = registers[X] + registers[Y]

		// Store the carry in VF Register
		registers[0xF] = result > 0xFF
		// Limit the resulting sum by 255
		registers[X] = result

		chip.pc += 2
	}

	/*
		Opcode: 8XY5
		VY is subtracted from VX. VF is set to 0 when there's a borrow,
		and 1 when there isn't.
	*/
	subtract(X, Y) {
		const { chip, chip: {registers} } = this

		/*
			A borrow occurs if X < Y, but instruction requires the VF
			register to be set to 0 if there is a borrow, so we reverse it
			to X >= Y
		*/
		registers[0xF] = registers[X] >= registers[Y]
		registers[X] -= registers[Y]

		chip.pc += 2
	}

	/*
		Opcode: 8XY6
		Stores the least significant bit of VX in VF
		and then shifts VX to the right by 1.
	*/
	shiftRight(X, Y) {
		const { chip, chip: {registers} } = this

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
	subtractRegisters(X, Y) {
		const { chip, chip: {registers} } = this

		// Store the !borrow in VF
		registers[0xF] = registers[Y] >= registers[X]
		registers[X] = registers[Y] - registers[X]

		chip.pc += 2
	}

	/*
		Opcode: 8XYE
		Stores the most significant bit of VX in VF
		and then shifts VX to the left by 1.
	*/
	shiftLeft(X, Y) {
		const { chip, chip: {registers} } = this

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
	skipIfRegistersNotEqual(X, Y) {
		const { chip, chip: {registers} } = this

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
	setI(NNN) {
		this.chip.registerI = NNN
		this.chip.pc += 2
	}

	/*
		Opcode: BNNN
		Jumps to the address NNN plus V0.
	*/
	jumpV0(NNN) {
		this.chip.pc = this.chip.registers[0] + NNN
	}

	/*
		Opcode: CXNN
		Sets VX to the result of a bitwise and operation on a
		random number (Typically: 0 to 255) and NN.
	*/
	rand(X, NN) {
		const random = Math.floor(Math.random() * 0x100)

		this.chip.registers[X] = random & NN
		this.chip.pc += 2
	}

	/*
		Opcode: DXYN
		Draws a sprite at coordinate (VX, VY) that has a width of 8 pixels
		and a height of N+1 pixels.
	*/
	draw(X, Y, N) {
		const { chip, chip: {registers, screen} } = this

		const startX = registers[X]
		const startY = registers[Y]

		// Indicate if any pixel was flipped from set to unset (collision)
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
					const pixelX = startX + x
					const pixelY = startY + y

					// Was this pixel a 1? It's 0 now. Set the VF register
					if (screen.get(pixelX, pixelY)) {
						registers[0xF] = 1
					}

					screen.toggle(pixelX, pixelY)
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
	skipIfKeyPressed(X) {
		const { chip } = this

		const desiredKey = chip.registers[X]
		if (chip.keyboard[desiredKey]) {
			chip.pc += 4
		} else {
			chip.pc += 2
		}
	}

	/*
		Opcode: EXA1
		Skips the next instruction if the key stored in VX isn't pressed.
	*/
	skipIfKeyNotPressed(X) {
		const { chip } = this

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
	getDelayTimer(X) {
		const { chip } = this

		chip.registers[X] = chip.delayTimer
		chip.pc += 2
	}

	/*
		Opcode: FX0A
		A key press is awaited, and then stored in VX.
		(Blocking operation)
	*/
	awaitKeyPress(X) {
		const { chip } = this

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
	setDelayTimer(X) {
		const { chip } = this

		chip.delayTimer = chip.registers[X]
		chip.pc += 2
	}

	/*
		Opcode: FX18
		Sets the sound timer to VX.
	*/
	setSoundTimer(X) {
		const { chip } = this

		chip.soundTimer = chip.registers[X]
		chip.pc += 2
	}

	/*
		Opcode: FX1E
		Adds VX to I. VF is not affected.
	*/
	addToI(X) {
		const { chip } = this

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
	loadCharacterSprite(X) {
		const { chip } = this

		// Since all characters are a 5 byte sprite
		// We can just multiply the character index by 5
		// to move to the correct memory location
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
	storeBCD(X) {
		const { chip } = this

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
	storeRegisters(X) {
		const { chip } = this

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
	loadRegisters(X) {
		const { chip } = this

		for (let i = 0; i <= X; i++) {
			chip.registers[i] = chip.memory[chip.registerI + i]
		}

		chip.pc += 2
	}

	/*
		Decodes an instruction
		Returns an array with the name and the arguments of the method to call

		It would be more optimal to just call the function like so:
		case 0xE0: return this.clear()
		But by returning strings, the Decompiler can use this same class to
		Disassemble ROMs into more readable code
	*/
	decode() {
		const code = this.code

		// Otherwise, opcodes depend on the first hex value (first 4 bits)
		switch (code & 0xF000) {
			case 0x0000: {
				switch (code & 0x00FF) {
					case 0xE0: return ['clear']
					case 0xEE: return ['returnFromSubroutine']

					default:   return ['doNothing']
				}
			}

			case 0x1000: return ['jump',                    'NNN']
			case 0x2000: return ['callSubroutine',          'NNN']
			case 0x3000: return ['skipIfRegisterEquals',    'X', 'NN']
			case 0x4000: return ['skipIfRegisterNotEquals', 'X', 'NN']
			case 0x5000: return ['skipIfRegistersEqual',    'X', 'Y']
			case 0x6000: return ['setRegisterValue',        'X', 'NN']
			case 0x7000: return ['addToRegisterValue',      'X', 'NN']

			/*
				There are a few opcodes beginning with 8, which can be
				distinguished by the last 4 bits

				All of them take X, Y registers as arguments
			*/
			case 0x8000: {
				// The last 4 bits
				switch (code & 0x000F) {
					case 0x0: return ['assign',            'X', 'Y']
					case 0x1: return ['bitwiseOr',         'X', 'Y']
					case 0x2: return ['bitwiseAnd',        'X', 'Y']
					case 0x3: return ['bitwiseXor',        'X', 'Y']
					case 0x4: return ['add',               'X', 'Y']
					case 0x5: return ['subtract',          'X', 'Y']
					case 0x6: return ['shiftRight',        'X', 'Y']
					case 0x7: return ['subtractRegisters', 'X', 'Y']
					case 0xE: return ['shiftLeft',         'X', 'Y']
				}
			}

			case 0x9000: return ['skipIfRegistersNotEqual', 'X', 'Y']
			case 0xA000: return ['setI', 'NNN']
			case 0xB000: return ['jumpV0', 'NNN']
			case 0xC000: return ['rand', 'X', 'NN']
			case 0xD000: return ['draw', 'X', 'Y', 'N']

			case 0xE000: {
				switch (code & 0x00FF) {
					case 0x9E: return ['skipIfKeyPressed',    'X']
					case 0xA1: return ['skipIfKeyNotPressed', 'X']
				}
			}

			case 0xF000: {
				// For F opcodes, the last 2 bits are the identifiers
				switch (code & 0x00FF) {
					case 0x07: return ['getDelayTimer',        'X']
					case 0x0A: return ['awaitKeyPress',        'X']
					case 0x15: return ['setDelayTimer',        'X']
					case 0x18: return ['setSoundTimer',        'X']
					case 0x1E: return ['addToI',               'X']
					case 0x29: return ['loadCharacterSprite',  'X']
					case 0x33: return ['storeBCD',             'X']
					case 0x55: return ['storeRegisters',       'X']
					case 0x65: return ['loadRegisters',        'X']
				}
			}
		}

		throw new Error(
			'Unknown instruction: ' + hex(code)
		)
	}

	/* Prepares an executable version of the instruction */
	executable() {
		const decoded = this.decode()
		const method = decoded[0]
		const values = {
			N:    this.code & 0x000F,
			NN:   this.code & 0x00FF,
			NNN:  this.code & 0x0FFF,

			X:   (this.code & 0x0F00) >> 8,
			Y:   (this.code & 0x00F0) >> 4
		}

		const argNames = decoded.slice(1)
		const args = argNames.map(key => values[key])

		return {
			method,
			args,
			argNames,
		}
	}

	execute() {
		const pc = this.chip.pc

		const { method, args } = this.executable()
		this[method].apply(this, args)
	}
}
