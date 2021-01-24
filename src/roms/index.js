import roms from './roms'
import descriptions from './descriptions'

const ROMs = [...roms]

/* Add my own descriptions to some of the ROMs that don't have any */
for (let file in descriptions) {
	const index = ROMs.findIndex(rom => rom.bin === file)
	if (index > -1) {
		ROMs[index].txt = descriptions[file]
	}
}

export default ROMs
