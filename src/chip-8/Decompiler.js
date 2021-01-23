import { fetchRom } from './Shared'
import Instruction from './Instruction'

import { hex } from './Shared'

export default class Decompiler {
	loadRom(url) {
		return fetchRom(url).then(rom => {
			this.rom = rom
		})
	}

	decompileInstruction() {

	}

	decompile() {
		const result = []

		for (let i = 0; i < this.rom.length; i += 2) {
			const opcode = (this.rom[i] << 8) | this.rom[i + 1]
			const instruction = new Instruction(opcode)
			const decompiled = this.decompileInstruction(instruction)

			result.push(decompiled)
		}

		return result
	}
}
