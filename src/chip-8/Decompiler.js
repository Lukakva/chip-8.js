import { fetchRom } from './Shared'
import Instruction from './Instruction'

import { hex } from './Shared'

/*
	An unfinished class. Used this to debug some problems with the Pong game
*/
export default class Decompiler {
	loadRom(url) {
		return fetchRom(url).then(rom => {
			this.rom = rom
		})
	}

	decompile() {
		const result = []
		const registersUsed = {}

		let scopeOpened = false

		for (let i = 0; i < this.rom.length; i += 2) {
			const opcode = (this.rom[i] << 8) | this.rom[i + 1]
			let executable = null
			try {
				const instruction = new Instruction(opcode)
				executable = instruction.executable()
			} catch (e) {
				// Not an instruction probably
				continue
			}

			const { method, args, argNames } = executable

			const X = argNames.indexOf('X')
			const Y = argNames.indexOf('Y')

			if (X > -1) {
				registersUsed[args[X]] = true
			}

			if (Y > -1) {
				registersUsed[args[Y]] = true
			}

			const lineNumber = `${i + 512} (${hex(opcode)}): `

			let line = lineNumber

			if (scopeOpened) {
				line += '    '
				scopeOpened = false
			}

			switch (method) {
				case 'rand': {
					line += `register${args[0]} = rand(${args[1]})`
					break
				}

				case 'setRegisterValue': {
					line += `register${args[0]} = ${args[1]}`
					break
				}

				case 'assign': {
					line += `register${args[0]} = register${args[1]}`
					break
				}

				case 'add': {
					line += `register${args[0]} += register${args[1]}; // With carry in VF`
					break
				}

				case 'subtract': {
					line += `register${args[0]} -= register${args[1]}; // With not brrow in VF`
					break
				}

				case 'addToRegisterValue': {
					line += `register${args[0]} += ${args[1]}`
					break
				}

				case 'skipIfRegisterEquals': {
					line += `if (register${args[0]} != ${args[1]}) {`

					scopeOpened = true
					break
				}

				case 'skipIfRegisterNotEquals': {
					line += `if (register${args[0]} == ${args[1]}) {`

					scopeOpened = true
					break
				}

				default: {
					const argsStr = argNames.map((argName, i) => {
						if (argName === 'X' || argName === 'Y') {
							return 'register' + args[i]
						}

						return args[i]
					}).join(', ')

					line += `${method}(${argsStr})`
					break
				}
			}

			result.push(line)
		}

		const registers = Object.keys(registersUsed).sort((a, b) => a - b).join(', ')
		result.unshift('Using registers ' + registers + '\n')

		return result.join('\n')
	}
}
