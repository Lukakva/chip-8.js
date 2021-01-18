import Instruction from './Instruction'

const RAM_SIZE = 4 * 1024 // 4 KB
const N_REGISTERS = 16
const STACK_SIZE = 16

/* First 512 bytes were reserved by the Chip8 itself */
const PROGRAM_START = 0x200

const SCREEN_WIDTH = 64
const SCREEN_HEIGHT = 32

class Chip8 {
	constructor(canvasSelector) {
		this.canvas = document.querySelector(canvasSelector)
		if (!this.canvas) {
			throw new Error('Canvas not found:', canvasSelector)
		}
		this.ctx = this.canvas.getContext('2d')

		this.init()
	}

	init() {
		/*
			Initialize the RAM, registers, stack
			(in order of the Wikipedia article)
		*/
		this.memory = new Uint8Array(RAM_SIZE)

		/*
			15 general purpose 8-bit registers (V0-VE)
			+ 1 carry flag register (VF)
		*/
		this.registers = new Uint8Array(N_REGISTERS)

		/* 16 bit address register (I) */
		this.registerI = 0

		/* Program counter, stack pointer */
		this.pc = PROGRAM_START
		this.sp = 0

		/* The stack (for subroutine calls) */
		this.stack = new Uint16Array(STACK_SIZE)

		/* Timers (both count down at 60Hz) */
		this.delayTimer = 0
		this.soundTimer = 0

		/* An array of Uint8Arrays. Storing just 0s and 1s (black and white) */
		this.screen = new Array(SCREEN_HEIGHT)
		for (let i = 0; i < SCREEN_HEIGHT; i++) {
			this.screen[i] = new Uint8Array(SCREEN_WIDTH)
		}

		this.canvas.width = SCREEN_WIDTH
		this.canvas.height = SCREEN_HEIGHT
	}

	/* Just a cool debugging thing */
	visualizeMemory() {
		const memory = this.memory
		for (let i = 0; i < memory.length; i += 2) {
			const opcode = (memory[i] << 8) | (memory[i + 1])
			if (opcode === 0) {
				continue
			}
			console.log(i.toString(16).toUpperCase(), opcode.toString(16).toUpperCase())
		}
	}

	loadRom(rom) {
		if (rom instanceof Uint8Array === false) {
			throw new Error('loadRom requires a Uint8Array')
		}

		// The allowed space for a program
		const allowedSize = RAM_SIZE - PROGRAM_START
		if (rom.length > allowedSize) {
			throw new Error('ROM too large.')
		}

		for (let i = 0; i < rom.length; i++) {
			this.memory[PROGRAM_START + i] = rom[i]
		}
	}

	/* Retrieves a file and loads it into memory */
	loadRomFromFile(url) {
		return new Promise((resolve, reject) => {
			const xhr = new XMLHttpRequest()
			xhr.open('GET', url)
			xhr.responseType = 'arraybuffer'

			xhr.onreadystatechange = () => {
				if (xhr.readyState !== 4) {
					return
				}

				try {
					const rom = new Uint8Array(xhr.response)
					this.loadRom(rom)
					resolve()
				} catch (e) {
					reject(e)
				}
			}

			xhr.onerror = reject

			xhr.send()
		})
	}

	/*
		Fetches an opcode from the memory, based on the program counter
		an opcode is 2 bytes long, so 2 bytes need to be joined
	*/
	fetchOpcode() {
		const byte1 = this.memory[this.pc]
		const byte2 = this.memory[this.pc + 1]

		// Create a 16 bit integer, containing the both bytes
		return (byte1 << 8) | byte2
	}

	executeOpcode(opcode) {
		const instruction = new Instruction(opcode, this)
		instruction.execute()
	}

	/* A CPU cycle */
	cycle() {
		const opcode = this.fetchOpcode()
		this.executeOpcode(opcode)
	}
}

export default Chip8
