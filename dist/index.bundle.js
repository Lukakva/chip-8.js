/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/chip-8/Chip.js":
/*!****************************!*\
  !*** ./src/chip-8/Chip.js ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => __WEBPACK_DEFAULT_EXPORT__
/* harmony export */ });
/* harmony import */ var _Instruction__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./Instruction */ "./src/chip-8/Instruction.js");
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }


var RAM_SIZE = 4 * 1024; // 4 KB

var N_REGISTERS = 16;
var STACK_SIZE = 16;
/* First 512 bytes were reserved by the Chip8 itself */

var PROGRAM_START = 0x200;
var SCREEN_WIDTH = 64;
var SCREEN_HEIGHT = 32;

var Chip8 = /*#__PURE__*/function () {
  function Chip8(canvasSelector) {
    _classCallCheck(this, Chip8);

    this.canvas = document.querySelector(canvasSelector);

    if (!this.canvas) {
      throw new Error('Canvas not found:', canvasSelector);
    }

    this.ctx = this.canvas.getContext('2d');
  }

  _createClass(Chip8, [{
    key: "init",
    value: function init() {
      /*
      	Initialize the RAM, registers, stack
      	(in order of the Wikipedia article)
      */
      this.memory = new Uint16Array(RAM_SIZE);
      /*
      	15 general purpose 8-bit registers (V0-VE)
      	+ 1 carry flag register (VF)
      */

      this.registers = new Uint16Array(N_REGISTERS);
      /* 16 bit address register (I) */

      this.registerI = 0;
      /* Program counter, stack pointer */

      this.pc = PROGRAM_START;
      this.sp = 0;
      /* The stack (for subroutine calls) */

      this.stack = new Uint16Array(STACK_SIZE);
      /* Timers (both count down at 60Hz) */

      this.delayTimer = 0;
      this.soundTimer = 0;
      /* An array of Uint8Arrays. Storing just 0s and 1s (black and white) */

      this.screen = new Array(SCREEN_HEIGHT);

      for (var i = 0; i < SCREEN_HEIGHT; i++) {
        this.screen[i] = new Uint8Array(SCREEN_WIDTH);
      }

      this.canvas.width = SCREEN_WIDTH;
      this.canvas.height = SCREEN_HEIGHT;
      this.canvas.style.imageRendering = 'pixelated';
      this.refreshDisplay();
    }
    /* Just a cool debugging thing */

  }, {
    key: "visualizeMemory",
    value: function visualizeMemory() {
      var memory = this.memory;

      for (var i = 0; i < memory.length; i += 2) {
        var opcode = memory[i] << 8 | memory[i + 1];

        if (opcode === 0) {
          continue;
        }

        console.log(i.toString(16).toUpperCase(), opcode.toString(16).toUpperCase());
      }
    }
  }, {
    key: "loadRom",
    value: function loadRom(rom) {
      if (rom instanceof Uint8Array === false) {
        throw new Error('loadRom requires a Uint8Array');
      } // The allowed space for a program


      var allowedSize = RAM_SIZE - PROGRAM_START;

      if (rom.length > allowedSize) {
        throw new Error('ROM too large.');
      }

      for (var i = 0; i < rom.length; i++) {
        this.memory[PROGRAM_START + i] = rom[i];
      }
    }
    /* Retrieves a file and loads it into memory */

  }, {
    key: "loadRomFromFile",
    value: function loadRomFromFile(url) {
      var _this = this;

      return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url);
        xhr.responseType = 'arraybuffer';

        xhr.onreadystatechange = function () {
          if (xhr.readyState !== 4) {
            return;
          }

          try {
            var rom = new Uint8Array(xhr.response);

            _this.loadRom(rom);

            resolve();
          } catch (e) {
            reject(e);
          }
        };

        xhr.onerror = reject;
        xhr.send();
      });
    }
    /*
    	Fetches an opcode from the memory, based on the program counter
    	an opcode is 2 bytes long, so 2 bytes need to be joined
    */

  }, {
    key: "fetchOpcode",
    value: function fetchOpcode() {
      var byte1 = this.memory[this.pc];
      var byte2 = this.memory[this.pc + 1]; // Create a 16 bit integer, containing the both bytes

      return byte1 << 8 | byte2;
    }
  }, {
    key: "executeOpcode",
    value: function executeOpcode(opcode) {
      var instruction = new _Instruction__WEBPACK_IMPORTED_MODULE_0__.default(opcode, this);
      instruction.execute();
    }
  }, {
    key: "refreshDisplay",
    value: function refreshDisplay() {
      var ctx = this.ctx,
          screen = this.screen;
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, screen[0].length, screen.length);
      ctx.fillStyle = 'white';
      var filled = 0;

      for (var y = 0; y < 32; y++) {
        for (var x = 0; x < 64; x++) {
          // Draw a white pixel where necessary
          if (screen[y][x] == 1) {
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
    }
    /* A CPU cycle */

  }, {
    key: "cycle",
    value: function cycle() {
      var _this2 = this;

      var opcode = this.fetchOpcode();
      this.executeOpcode(opcode);

      if (this.delayTimer > 0) {
        this.delayTimer--;
      }

      window.requestAnimationFrame(function () {
        _this2.cycle();
      });
    }
  }]);

  return Chip8;
}();

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Chip8);

/***/ }),

/***/ "./src/chip-8/Instruction.js":
/*!***********************************!*\
  !*** ./src/chip-8/Instruction.js ***!
  \***********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => /* binding */ Instruction
/* harmony export */ });
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/*
	All instructions are listed in the order of this table
	https://en.wikipedia.org/wiki/CHIP-8#Opcode_table

	Although some of the functions should be next to each other
	(like callSubroutine, returnFromSubroutine)
*/
var hex = function hex(n) {
  return '0x' + n.toString(16).toUpperCase();
};

var Instruction = /*#__PURE__*/function () {
  function Instruction(code, chip) {
    _classCallCheck(this, Instruction);

    this.code = code;
    this.chip = chip;
  }
  /*
  	Opcode: 00E0
  	Clears the screen (black)
  */


  _createClass(Instruction, [{
    key: "clear",
    value: function clear() {
      var screen = this.chip.screen;

      for (var i = 0; i < screen.length; i++) {
        for (var j = 0; j < screen[0].length; j++) {
          screen[i][j] = 0;
        }
      }

      this.chip.refreshDisplay();
      this.chip.pc += 2;
    }
    /*
    	Opcode: 0x00EE
    	Returns from a subroutine
    */

  }, {
    key: "returnFromSubroutine",
    value: function returnFromSubroutine() {
      var chip = this.chip;
      /*
      	Retrieve the program counter at the end of the stack
      	Pop the stack (by decremeting the stack pointer)
      	And move the program counter to the next instruction (+ 2 bytes)
      		A more readable version (just for convenience)
      		chip.sp -= 1
      	chip.pc = chip.stack[chip.sp]
      	chip.pc += 2
      */

      chip.pc = chip.stack[--chip.sp] + 2;
    }
    /*
    	Opcode: 1NNN
    	Jumps to address NNN
    */

  }, {
    key: "jump",
    value: function jump() {
      var NNN = this.code & 0x0FFF;

      if (this.chip.pc === NNN) {
        throw new Error('Something went wrong. The program is jumping to the current Program Counter. Infinite loop is inevitable?');
      }

      this.chip.pc = NNN;
    }
    /*
    	Opcode: 2NNN
    	Executes the subroutine at NNN
    */

  }, {
    key: "callSubroutine",
    value: function callSubroutine() {
      var nnn = this.code & 0x0FFF;
      var chip = this.chip;

      if (chip.sp >= chip.stack.length) {
        throw new Error('Could not enter a subroutine at ' + hex(nnn) + 'from PC ' + hex(chip.pc) + 'because the stack is full.');
      }

      chip.stack[chip.sp++] = chip.pc;
      chip.pc = nnn;
    }
    /*
    	Opcode: 3XNN
    	Skips the next instruction if the value stored in the register X
    	is equal to the constant NN
    */

  }, {
    key: "skipIfRegisterEquals",
    value: function skipIfRegisterEquals() {
      var code = this.code,
          chip = this.chip,
          registers = this.chip.registers;
      var X = (code & 0x0F00) >> 8;
      var NN = code & 0x00FF;

      if (registers[X] === NN) {
        chip.pc += 4;
      } else {
        chip.pc += 2;
      }
    }
    /*
    	Opcode: 4XNN
    	Skips the next instruction if the value stored in the register X
    	IS NOT equal to the constant NN
    */

  }, {
    key: "skipIfRegisterNotEquals",
    value: function skipIfRegisterNotEquals() {
      var code = this.code,
          chip = this.chip,
          registers = this.chip.registers;
      var X = (code & 0x0F00) >> 8;
      var NN = code & 0x00FF;

      if (registers[X] !== NN) {
        chip.pc += 4;
      } else {
        chip.pc += 2;
      }
    }
    /*
    	Opcode: 5XY0
    	Skips the next instruction if the values stored in registers X and Y
    	are equal to each other
    */

  }, {
    key: "skipIfRegistersEqual",
    value: function skipIfRegistersEqual() {
      var code = this.code,
          chip = this.chip,
          registers = this.chip.registers;
      var X = (code & 0x0F00) >> 8;
      var Y = (code & 0x00F0) >> 4;

      if (registers[X] === registers[Y]) {
        chip.pc += 4;
      } else {
        chip.pc += 2;
      }
    }
    /*
    	Opcode: 6XNN
    	Sets VX to NN.
    */

  }, {
    key: "setRegisterValue",
    value: function setRegisterValue() {
      var chip = this.chip,
          code = this.code;
      var X = (code & 0x0F00) >> 8;
      var NN = code & 0x00FF;
      chip.registers[X] = NN;
      chip.pc += 2;
    }
    /*
    	Opcode: 7XNN
    	Adds NN to VX. (Carry flag is not changed)
    */

  }, {
    key: "addToRegisterValue",
    value: function addToRegisterValue() {
      var chip = this.chip,
          code = this.code;
      var X = (code & 0x0F00) >> 8;
      var NN = code & 0x00FF;
      chip.registers[X] += NN; // Limit to 255 (Mimic a 8bit behavior)

      chip.registers[X] &= 0xFF;
      chip.pc += 2;
    }
    /*
    	Opcode: 8XY0
    	Assignment - Sets VX to the value of VY.
    */

  }, {
    key: "assign",
    value: function assign() {
      var code = this.code,
          chip = this.chip,
          registers = this.chip.registers;
      var X = (code & 0x0F00) >> 8;
      var Y = (code & 0x00F0) >> 4;
      registers[X] = registers[Y];
      chip.pc += 2;
    }
    /*
    	Opcode: 8XY1
    	Sets VX to VX or VY. (Bitwise OR operation)
    */

  }, {
    key: "bitwiseOr",
    value: function bitwiseOr() {
      var code = this.code,
          chip = this.chip,
          registers = this.chip.registers;
      var X = (code & 0x0F00) >> 8;
      var Y = (code & 0x00F0) >> 4;
      registers[X] = registers[X] | registers[Y];
      chip.pc += 2;
    }
    /*
    	Opcode: 8XY2
    	Sets VX to VX and VY. (Bitwise AND operation)
    */

  }, {
    key: "bitwiseAnd",
    value: function bitwiseAnd() {
      var code = this.code,
          chip = this.chip,
          registers = this.chip.registers;
      var X = (code & 0x0F00) >> 8;
      var Y = (code & 0x00F0) >> 4;
      registers[X] = registers[X] & registers[Y];
      chip.pc += 2;
    }
    /*
    	Opcode: 8XY3
    	Sets VX to VX xor VY.
    */

  }, {
    key: "bitwiseAnd",
    value: function bitwiseAnd() {
      var code = this.code,
          chip = this.chip,
          registers = this.chip.registers;
      var X = (code & 0x0F00) >> 8;
      var Y = (code & 0x00F0) >> 4;
      registers[X] = registers[X] ^ registers[Y];
      chip.pc += 2;
    }
    /*
    	Opcode: 8XY4
    	Adds VY to VX. VF is set to 1 when there's a carry,
    	and to 0 when there isn't.
    */

  }, {
    key: "add",
    value: function add() {
      var code = this.code,
          chip = this.chip,
          registers = this.chip.registers;
      var X = (code & 0x0F00) >> 8;
      var Y = (code & 0x00F0) >> 4;
      /*
      	Thankfully JavaScript can operate on ints larger than 8 bits :v
      	If the result is larger than a 8 bit integer (255), we have a carry
      */

      var result = registers[X] + registers[Y];
      var carry = result > 0xFF; // Store the carry in VF Register

      registers[0xF] = carry; // Limit the resulting sum by 255

      registers[X] = result & 0xFF;
      chip.pc += 2;
    }
    /*
    	Opcode: 8XY4
    	VY is subtracted from VX. VF is set to 0 when there's a borrow,
    	and 1 when there isn't.
    */

  }, {
    key: "subtract",
    value: function subtract() {
      var code = this.code,
          chip = this.chip,
          registers = this.chip.registers;
      var X = (code & 0x0F00) >> 8;
      var Y = (code & 0x00F0) >> 4;
      /*
      	A borrow occurs if X < Y, but instruction requires the VF
      	register to be set to 0 if there is a borrow, so we reverse it
      	to X >= Y
      */

      registers[0xF] = registers[X] >= registers[Y];
      registers[X] -= Y;
      chip.pc += 2;
    }
    /*
    	Opcode: 8XY6
    	Stores the least significant bit of VX in VF
    	and then shifts VX to the right by 1.
    */

  }, {
    key: "shiftRight",
    value: function shiftRight() {
      var code = this.code,
          chip = this.chip,
          registers = this.chip.registers;
      var X = (code & 0x0F00) >> 8;
      var Y = (code & 0x00F0) >> 4; // Store the least significant bit

      registers[0xF] = registers[X] & 0x1;
      registers[X] >>= 1;
      chip.pc += 2;
    }
    /*
    	Opcode: 8XY7
    	Sets VX to VY minus VX. VF is set to 0 when there's a borrow,
    	and 1 when there isn't.
    */

  }, {
    key: "subtractRegisters",
    value: function subtractRegisters() {
      var code = this.code,
          chip = this.chip,
          registers = this.chip.registers;
      var X = (code & 0x0F00) >> 8;
      var Y = (code & 0x00F0) >> 4; // Store the least significant bit

      registers[0xF] = registers[Y] >= registers[X];
      registers[X] = registers[Y] - registers[X];
      chip.pc += 2;
    }
    /*
    	Opcode: 8XYE
    	Stores the most significant bit of VX in VF
    	and then shifts VX to the left by 1.
    */

  }, {
    key: "shiftLeft",
    value: function shiftLeft() {
      var code = this.code,
          chip = this.chip,
          registers = this.chip.registers;
      var X = (code & 0x0F00) >> 8;
      var Y = (code & 0x00F0) >> 4; // Get the most significant bit

      var msb = registers[X] & 1 << 7; // Store 1 if msb is 1

      registers[0xF] = msb > 0;
      registers[X] <<= 1;
      chip.pc += 2;
    }
    /*
    	Opcode: 9XY0
    	Skips the next instruction if VX doesn't equal VY.
    */

  }, {
    key: "skipIfRegistersNotEqual",
    value: function skipIfRegistersNotEqual() {
      var code = this.code,
          chip = this.chip,
          registers = this.chip.registers;
      var X = (code & 0x0F00) >> 8;
      var Y = (code & 0x00F0) >> 4;

      if (registers[X] !== registers[Y]) {
        // 4 instead of 2 (effectively skipping the next instruction)
        chip.pc += 4;
      } else {
        chip.pc += 2;
      }
    }
    /*
    	Opcode: ANNN
    	Sets I to the address NNN.
    */

  }, {
    key: "setMemoryRegister",
    value: function setMemoryRegister() {
      var NNN = this.code & 0x0FFF;
      this.chip.registerI = NNN;
      this.chip.pc += 2;
    }
    /*
    	Opcode: BNNN
    	Jumps to the address NNN plus V0.
    */

  }, {
    key: "jumpV0",
    value: function jumpV0() {
      var NNN = this.code & 0x0FFF;
      this.chip.pc = this.chip.registers[0] + NNN;
    }
    /*
    	Opcode: CXNN
    	Sets VX to the result of a bitwise and operation on a
    	random number (Typically: 0 to 255) and NN.
    */

  }, {
    key: "rand",
    value: function rand() {
      var code = this.code,
          chip = this.chip;
      var X = (code & 0x0F00) >> 8;
      var NN = code & 0x00FF;
      var random = Math.floor(Math.random() * 0x100);
      chip.registers[X] = random & NN;
      chip.pc += 2;
    }
    /*
    	Opcode: DXYN
    	Draws a sprite at coordinate (VX, VY) that has a width of 8 pixels
    	and a height of N+1 pixels.
    */

  }, {
    key: "draw",
    value: function draw() {
      /*
      	Each row of 8 pixels is read as bit-coded
      	starting from memory location I
      */
      var code = this.code,
          chip = this.chip,
          _this$chip = this.chip,
          registers = _this$chip.registers,
          screen = _this$chip.screen;
      var X = (code & 0x0F00) >> 8;
      var Y = (code & 0x00F0) >> 4;
      var N = code & 0x000F;
      var coordX = registers[X];
      var coordY = registers[Y]; // Indicate if any pixel was flipped from set to unset

      registers[0xF] = 0;

      for (var y = 0; y < N; y++) {
        // A row of 8 pixels (where every bit is a pixel color)
        var row = chip.memory[chip.registerI + y]; // Loop over each pixel value (bit by bit)

        for (var x = 0; x < 8; x++) {
          var mask = 0x80 >> x; // If this pixel should be flipped

          if ((row & mask) > 0) {
            // This pixel was 1? It's gonna be 0 now. Set the VF register
            if (screen[coordY + y][coordX + x] === 1) {
              registers[0xF] = 1;
            }

            screen[coordY + y][coordX + x] ^= 1;
          }
        }
      }

      chip.refreshDisplay();
      chip.pc += 2;
    }
    /*
    	Opcode: FX07
    	Sets VX to the value of the delay timer.
    */

  }, {
    key: "getDelayTimer",
    value: function getDelayTimer() {
      var code = this.code,
          chip = this.chip;
      var X = (code & 0x0F00) >> 8;
      chip.registers[X] = this.delayTimer;
      chip.pc += 2;
    }
    /*
    	Opcode: FX15
    	Sets the delay timer to VX.
    */

  }, {
    key: "setDelayTimer",
    value: function setDelayTimer() {
      var code = this.code,
          chip = this.chip;
      var X = (code & 0x0F00) >> 8;
      this.delayTimer = chip.registers[X];
      chip.pc += 2;
    }
    /*
    	Opcode: FX1E
    	Adds VX to I. VF is not affected.
    */

  }, {
    key: "addMem",
    value: function addMem() {
      var code = this.code,
          chip = this.chip;
      var X = (code & 0x0F00) >> 8;
      chip.registerI += chip.registers[X]; // Limit to 16 bits

      chip.registerI &= 0xFFFF;
      chip.pc += 2;
    }
  }, {
    key: "getInstructionName",
    value: function getInstructionName() {
      var code = this.code; // The only 2 opcodes that can be matched exactly

      if (code === 0x00E0) {
        return 'clear';
      }

      if (code === 0x00EE) {
        return 'returnFromSubroutine';
      } // Otherwise, opcodes depend on the first hex value (first 4 bits)


      switch (code & 0xF000) {
        case 0x1000:
          {
            return 'jump';
          }

        case 0x2000:
          {
            return 'callSubroutine';
          }

        case 0x3000:
          {
            return 'skipIfRegisterEquals';
          }

        case 0x4000:
          {
            return 'skipIfRegisterNotEquals';
          }

        case 0x5000:
          {
            return 'skipIfRegistersEqual';
          }

        case 0x6000:
          {
            return 'setRegisterValue';
          }

        case 0x7000:
          {
            return 'addToRegisterValue';
          }

        /*
        	There are a few opcodes beginning with 8, which can be
        	distinguished by the last 4 bits
        */

        case 0x8000:
          {
            // The last 4 bits
            switch (code & 0x000F) {
              case 0x0:
                {
                  return 'assign';
                }

              case 0x1:
                {
                  return 'bitwiseOr';
                }

              case 0x2:
                {
                  return 'bitwiseAnd';
                }

              case 0x3:
                {
                  return 'bitwiseXor';
                }

              case 0x4:
                {
                  return 'add';
                }

              case 0x5:
                {
                  return 'subtract';
                }

              case 0x6:
                {
                  return 'shiftRight';
                }

              case 0x7:
                {
                  return 'subtractRegisters';
                }

              case 0xE:
                {
                  return 'shiftLeft';
                }
            }
          }

        case 0x9000:
          {
            return 'skipIfRegistersNotEqual';
          }

        case 0xA000:
          {
            return 'setMemoryRegister';
          }

        case 0xB000:
          {
            return 'jumpV0';
          }

        case 0xC000:
          {
            return 'rand';
          }

        case 0xD000:
          {
            return 'draw';
          }

        case 0xF000:
          {
            // For F opcodes, the last 2 bits are the identifiers
            switch (code & 0x00FF) {
              case 0x07:
                {
                  return 'getDelayTimer';
                }

              case 0x15:
                {
                  return 'getDelayTimer';
                }

              case 0x1E:
                {
                  return 'addMem';
                }
            }
          }
      }

      throw new Error('Unknown instruction: 0x' + hex(code));
    }
  }, {
    key: "execute",
    value: function execute() {
      var name = this.getInstructionName();
      console.log('Executing instruction:', name);
      this[name]();
    }
  }]);

  return Instruction;
}();



/***/ }),

/***/ "./src/index.js":
/*!**********************!*\
  !*** ./src/index.js ***!
  \**********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _chip_8_Chip__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./chip-8/Chip */ "./src/chip-8/Chip.js");

var chip = new _chip_8_Chip__WEBPACK_IMPORTED_MODULE_0__.default('canvas');
chip.init();
chip.loadRomFromFile('./chip8-roms/programs/Fishie [Hap, 2005].ch8');
window._chip = chip;

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		if(__webpack_module_cache__[moduleId]) {
/******/ 			return __webpack_module_cache__[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => Object.prototype.hasOwnProperty.call(obj, prop)
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	// startup
/******/ 	// Load entry module
/******/ 	__webpack_require__("./src/index.js");
/******/ 	// This entry module used 'exports' so it can't be inlined
/******/ })()
;