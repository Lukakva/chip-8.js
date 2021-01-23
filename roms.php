<?php

/* Just a helper file to generate a list of ROMs */
$files = glob('chip8-roms/*/*.ch8');

$files = array_map(function($path) {
	// The file, including the extension
	$file = basename($path);
	$directory = dirname($path);

	$name = pathinfo($file, PATHINFO_FILENAME);
	// The instructions file (if one exists)
	$txt = "$directory/$name.txt";
	$instructions = 'No instructions';
	if (file_exists($txt)) {
		$instructions = htmlentities(file_get_contents($txt));
	}

	return [
		'bin' => $path,
		'txt' => $instructions
	];
}, $files);

$json = json_encode($files, JSON_PRETTY_PRINT);
file_put_contents('src/roms/roms.json', $json);
