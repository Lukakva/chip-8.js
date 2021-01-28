import roms from './roms'
import descriptions from './descriptions'

/* Add my own descriptions to some of the ROMs that don't have any */
for (let file in descriptions) {
	const index = roms.findIndex(rom => rom.bin === file)
	if (index > -1) {
		roms[index].txt = descriptions[file]
	}
}

export default roms
