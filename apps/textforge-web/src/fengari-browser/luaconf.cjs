"use strict";

const LUA_VERSION_MAJOR = "5";
const LUA_VERSION_MINOR = "3";

function to_luastring(value) {
  return new TextEncoder().encode(String(value));
}

const LUA_PATH_SEP = ";";
const LUA_PATH_MARK = "?";
const LUA_EXEC_DIR = "!";
const LUA_VDIR = `${LUA_VERSION_MAJOR}.${LUA_VERSION_MINOR}`;
const LUA_DIRSEP = "/";
const LUA_LDIR = `./lua/${LUA_VDIR}/`;
const LUA_JSDIR = LUA_LDIR;
const LUA_PATH_DEFAULT = to_luastring(
  `${LUA_LDIR}?.lua;${LUA_LDIR}?/init.lua;./?.lua;./?/init.lua`,
);
const LUA_JSPATH_DEFAULT = to_luastring(
  `${LUA_JSDIR}?.js;${LUA_JSDIR}loadall.js;./?.js`,
);
const LUA_COMPAT_FLOATSTRING = false;
const LUA_MAXINTEGER = 2147483647;
const LUA_MININTEGER = -2147483648;
const LUAI_MAXSTACK = 1000000;
const LUA_IDSIZE = 60 - 1;
const LUA_INTEGER_FRMLEN = "";
const LUA_NUMBER_FRMLEN = "";
const LUA_INTEGER_FMT = `%${LUA_INTEGER_FRMLEN}d`;
const LUA_NUMBER_FMT = "%.14g";
const LUAL_BUFFERSIZE = 8192;

function lua_integer2str(n) {
  return String(n);
}

function lua_number2str(n) {
  return String(Number(n.toPrecision(14)));
}

function lua_numbertointeger(n) {
  return n >= LUA_MININTEGER && n < -LUA_MININTEGER ? n : false;
}

function lua_getlocaledecpoint() {
  return 46;
}

function frexp(value) {
  if (value === 0) {
    return [value, 0];
  }

  const data = new DataView(new ArrayBuffer(8));
  data.setFloat64(0, value);
  let bits = (data.getUint32(0) >>> 20) & 0x7FF;
  if (bits === 0) {
    data.setFloat64(0, value * Math.pow(2, 64));
    bits = ((data.getUint32(0) >>> 20) & 0x7FF) - 64;
  }
  const exponent = bits - 1022;
  const mantissa = ldexp(value, -exponent);
  return [mantissa, exponent];
}

function ldexp(mantissa, exponent) {
  const steps = Math.min(3, Math.ceil(Math.abs(exponent) / 1023));
  let result = mantissa;
  for (let index = 0; index < steps; index += 1) {
    result *= Math.pow(2, Math.floor((exponent + index) / steps));
  }
  return result;
}

module.exports.LUA_PATH_SEP = LUA_PATH_SEP;
module.exports.LUA_PATH_MARK = LUA_PATH_MARK;
module.exports.LUA_EXEC_DIR = LUA_EXEC_DIR;
module.exports.LUA_VDIR = LUA_VDIR;
module.exports.LUA_DIRSEP = LUA_DIRSEP;
module.exports.LUA_LDIR = LUA_LDIR;
module.exports.LUA_JSDIR = LUA_JSDIR;
module.exports.LUA_PATH_DEFAULT = LUA_PATH_DEFAULT;
module.exports.LUA_JSPATH_DEFAULT = LUA_JSPATH_DEFAULT;
module.exports.LUAI_MAXSTACK = LUAI_MAXSTACK;
module.exports.LUA_COMPAT_FLOATSTRING = LUA_COMPAT_FLOATSTRING;
module.exports.LUA_IDSIZE = LUA_IDSIZE;
module.exports.LUA_INTEGER_FMT = LUA_INTEGER_FMT;
module.exports.LUA_INTEGER_FRMLEN = LUA_INTEGER_FRMLEN;
module.exports.LUA_MAXINTEGER = LUA_MAXINTEGER;
module.exports.LUA_MININTEGER = LUA_MININTEGER;
module.exports.LUA_NUMBER_FMT = LUA_NUMBER_FMT;
module.exports.LUA_NUMBER_FRMLEN = LUA_NUMBER_FRMLEN;
module.exports.LUAL_BUFFERSIZE = LUAL_BUFFERSIZE;
module.exports.frexp = frexp;
module.exports.ldexp = ldexp;
module.exports.lua_getlocaledecpoint = lua_getlocaledecpoint;
module.exports.lua_integer2str = lua_integer2str;
module.exports.lua_number2str = lua_number2str;
module.exports.lua_numbertointeger = lua_numbertointeger;
