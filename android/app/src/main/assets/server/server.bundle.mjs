// Deadshot Embedded Offline Server Bundle for Android Node.js
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __commonJS = (cb, mod) => function __require2() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// gameplay/node_modules/ws/lib/constants.js
var require_constants = __commonJS({
  "gameplay/node_modules/ws/lib/constants.js"(exports, module) {
    "use strict";
    var BINARY_TYPES = ["nodebuffer", "arraybuffer", "fragments"];
    var hasBlob = typeof Blob !== "undefined";
    if (hasBlob) BINARY_TYPES.push("blob");
    module.exports = {
      BINARY_TYPES,
      CLOSE_TIMEOUT: 3e4,
      EMPTY_BUFFER: Buffer.alloc(0),
      GUID: "258EAFA5-E914-47DA-95CA-C5AB0DC85B11",
      hasBlob,
      kForOnEventAttribute: /* @__PURE__ */ Symbol("kIsForOnEventAttribute"),
      kListener: /* @__PURE__ */ Symbol("kListener"),
      kStatusCode: /* @__PURE__ */ Symbol("status-code"),
      kWebSocket: /* @__PURE__ */ Symbol("websocket"),
      NOOP: () => {
      }
    };
  }
});

// gameplay/node_modules/ws/lib/buffer-util.js
var require_buffer_util = __commonJS({
  "gameplay/node_modules/ws/lib/buffer-util.js"(exports, module) {
    "use strict";
    var { EMPTY_BUFFER } = require_constants();
    var FastBuffer = Buffer[Symbol.species];
    function concat(list, totalLength) {
      if (list.length === 0) return EMPTY_BUFFER;
      if (list.length === 1) return list[0];
      const target = Buffer.allocUnsafe(totalLength);
      let offset = 0;
      for (let i = 0; i < list.length; i++) {
        const buf = list[i];
        target.set(buf, offset);
        offset += buf.length;
      }
      if (offset < totalLength) {
        return new FastBuffer(target.buffer, target.byteOffset, offset);
      }
      return target;
    }
    function _mask(source, mask, output, offset, length) {
      for (let i = 0; i < length; i++) {
        output[offset + i] = source[i] ^ mask[i & 3];
      }
    }
    function _unmask(buffer, mask) {
      for (let i = 0; i < buffer.length; i++) {
        buffer[i] ^= mask[i & 3];
      }
    }
    function toArrayBuffer(buf) {
      if (buf.length === buf.buffer.byteLength) {
        return buf.buffer;
      }
      return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length);
    }
    function toBuffer(data) {
      toBuffer.readOnly = true;
      if (Buffer.isBuffer(data)) return data;
      let buf;
      if (data instanceof ArrayBuffer) {
        buf = new FastBuffer(data);
      } else if (ArrayBuffer.isView(data)) {
        buf = new FastBuffer(data.buffer, data.byteOffset, data.byteLength);
      } else {
        buf = Buffer.from(data);
        toBuffer.readOnly = false;
      }
      return buf;
    }
    module.exports = {
      concat,
      mask: _mask,
      toArrayBuffer,
      toBuffer,
      unmask: _unmask
    };
    if (!process.env.WS_NO_BUFFER_UTIL) {
      try {
        const bufferUtil = __require("bufferutil");
        module.exports.mask = function(source, mask, output, offset, length) {
          if (length < 48) _mask(source, mask, output, offset, length);
          else bufferUtil.mask(source, mask, output, offset, length);
        };
        module.exports.unmask = function(buffer, mask) {
          if (buffer.length < 32) _unmask(buffer, mask);
          else bufferUtil.unmask(buffer, mask);
        };
      } catch (e) {
      }
    }
  }
});

// gameplay/node_modules/ws/lib/limiter.js
var require_limiter = __commonJS({
  "gameplay/node_modules/ws/lib/limiter.js"(exports, module) {
    "use strict";
    var kDone = /* @__PURE__ */ Symbol("kDone");
    var kRun = /* @__PURE__ */ Symbol("kRun");
    var Limiter = class {
      /**
       * Creates a new `Limiter`.
       *
       * @param {Number} [concurrency=Infinity] The maximum number of jobs allowed
       *     to run concurrently
       */
      constructor(concurrency) {
        this[kDone] = () => {
          this.pending--;
          this[kRun]();
        };
        this.concurrency = concurrency || Infinity;
        this.jobs = [];
        this.pending = 0;
      }
      /**
       * Adds a job to the queue.
       *
       * @param {Function} job The job to run
       * @public
       */
      add(job) {
        this.jobs.push(job);
        this[kRun]();
      }
      /**
       * Removes a job from the queue and runs it if possible.
       *
       * @private
       */
      [kRun]() {
        if (this.pending === this.concurrency) return;
        if (this.jobs.length) {
          const job = this.jobs.shift();
          this.pending++;
          job(this[kDone]);
        }
      }
    };
    module.exports = Limiter;
  }
});

// gameplay/node_modules/ws/lib/permessage-deflate.js
var require_permessage_deflate = __commonJS({
  "gameplay/node_modules/ws/lib/permessage-deflate.js"(exports, module) {
    "use strict";
    var zlib = __require("zlib");
    var bufferUtil = require_buffer_util();
    var Limiter = require_limiter();
    var { kStatusCode } = require_constants();
    var FastBuffer = Buffer[Symbol.species];
    var TRAILER = Buffer.from([0, 0, 255, 255]);
    var kPerMessageDeflate = /* @__PURE__ */ Symbol("permessage-deflate");
    var kTotalLength = /* @__PURE__ */ Symbol("total-length");
    var kCallback = /* @__PURE__ */ Symbol("callback");
    var kBuffers = /* @__PURE__ */ Symbol("buffers");
    var kError = /* @__PURE__ */ Symbol("error");
    var zlibLimiter;
    var PerMessageDeflate2 = class {
      /**
       * Creates a PerMessageDeflate instance.
       *
       * @param {Object} [options] Configuration options
       * @param {(Boolean|Number)} [options.clientMaxWindowBits] Advertise support
       *     for, or request, a custom client window size
       * @param {Boolean} [options.clientNoContextTakeover=false] Advertise/
       *     acknowledge disabling of client context takeover
       * @param {Number} [options.concurrencyLimit=10] The number of concurrent
       *     calls to zlib
       * @param {Boolean} [options.isServer=false] Create the instance in either
       *     server or client mode
       * @param {Number} [options.maxPayload=0] The maximum allowed message length
       * @param {(Boolean|Number)} [options.serverMaxWindowBits] Request/confirm the
       *     use of a custom server window size
       * @param {Boolean} [options.serverNoContextTakeover=false] Request/accept
       *     disabling of server context takeover
       * @param {Number} [options.threshold=1024] Size (in bytes) below which
       *     messages should not be compressed if context takeover is disabled
       * @param {Object} [options.zlibDeflateOptions] Options to pass to zlib on
       *     deflate
       * @param {Object} [options.zlibInflateOptions] Options to pass to zlib on
       *     inflate
       */
      constructor(options) {
        this._options = options || {};
        this._threshold = this._options.threshold !== void 0 ? this._options.threshold : 1024;
        this._maxPayload = this._options.maxPayload | 0;
        this._isServer = !!this._options.isServer;
        this._deflate = null;
        this._inflate = null;
        this.params = null;
        if (!zlibLimiter) {
          const concurrency = this._options.concurrencyLimit !== void 0 ? this._options.concurrencyLimit : 10;
          zlibLimiter = new Limiter(concurrency);
        }
      }
      /**
       * @type {String}
       */
      static get extensionName() {
        return "permessage-deflate";
      }
      /**
       * Create an extension negotiation offer.
       *
       * @return {Object} Extension parameters
       * @public
       */
      offer() {
        const params = {};
        if (this._options.serverNoContextTakeover) {
          params.server_no_context_takeover = true;
        }
        if (this._options.clientNoContextTakeover) {
          params.client_no_context_takeover = true;
        }
        if (this._options.serverMaxWindowBits) {
          params.server_max_window_bits = this._options.serverMaxWindowBits;
        }
        if (this._options.clientMaxWindowBits) {
          params.client_max_window_bits = this._options.clientMaxWindowBits;
        } else if (this._options.clientMaxWindowBits == null) {
          params.client_max_window_bits = true;
        }
        return params;
      }
      /**
       * Accept an extension negotiation offer/response.
       *
       * @param {Array} configurations The extension negotiation offers/reponse
       * @return {Object} Accepted configuration
       * @public
       */
      accept(configurations) {
        configurations = this.normalizeParams(configurations);
        this.params = this._isServer ? this.acceptAsServer(configurations) : this.acceptAsClient(configurations);
        return this.params;
      }
      /**
       * Releases all resources used by the extension.
       *
       * @public
       */
      cleanup() {
        if (this._inflate) {
          this._inflate.close();
          this._inflate = null;
        }
        if (this._deflate) {
          const callback = this._deflate[kCallback];
          this._deflate.close();
          this._deflate = null;
          if (callback) {
            callback(
              new Error(
                "The deflate stream was closed while data was being processed"
              )
            );
          }
        }
      }
      /**
       *  Accept an extension negotiation offer.
       *
       * @param {Array} offers The extension negotiation offers
       * @return {Object} Accepted configuration
       * @private
       */
      acceptAsServer(offers) {
        const opts = this._options;
        const accepted = offers.find((params) => {
          if (opts.serverNoContextTakeover === false && params.server_no_context_takeover || params.server_max_window_bits && (opts.serverMaxWindowBits === false || typeof opts.serverMaxWindowBits === "number" && opts.serverMaxWindowBits > params.server_max_window_bits) || typeof opts.clientMaxWindowBits === "number" && (typeof params.client_max_window_bits === "number" ? opts.clientMaxWindowBits > params.client_max_window_bits : !params.client_max_window_bits)) {
            return false;
          }
          return true;
        });
        if (!accepted) {
          throw new Error("None of the extension offers can be accepted");
        }
        if (opts.serverNoContextTakeover) {
          accepted.server_no_context_takeover = true;
        }
        if (opts.clientNoContextTakeover) {
          accepted.client_no_context_takeover = true;
        }
        if (typeof opts.serverMaxWindowBits === "number") {
          accepted.server_max_window_bits = opts.serverMaxWindowBits;
        }
        if (typeof opts.clientMaxWindowBits === "number") {
          accepted.client_max_window_bits = opts.clientMaxWindowBits;
        } else if (accepted.client_max_window_bits === true || opts.clientMaxWindowBits === false) {
          delete accepted.client_max_window_bits;
        }
        return accepted;
      }
      /**
       * Accept the extension negotiation response.
       *
       * @param {Array} response The extension negotiation response
       * @return {Object} Accepted configuration
       * @private
       */
      acceptAsClient(response) {
        const params = response[0];
        if (this._options.clientNoContextTakeover === false && params.client_no_context_takeover) {
          throw new Error('Unexpected parameter "client_no_context_takeover"');
        }
        if (!params.client_max_window_bits) {
          if (typeof this._options.clientMaxWindowBits === "number") {
            params.client_max_window_bits = this._options.clientMaxWindowBits;
          }
        } else if (this._options.clientMaxWindowBits === false || typeof this._options.clientMaxWindowBits === "number" && params.client_max_window_bits > this._options.clientMaxWindowBits) {
          throw new Error(
            'Unexpected or invalid parameter "client_max_window_bits"'
          );
        }
        return params;
      }
      /**
       * Normalize parameters.
       *
       * @param {Array} configurations The extension negotiation offers/reponse
       * @return {Array} The offers/response with normalized parameters
       * @private
       */
      normalizeParams(configurations) {
        configurations.forEach((params) => {
          Object.keys(params).forEach((key) => {
            let value = params[key];
            if (value.length > 1) {
              throw new Error(`Parameter "${key}" must have only a single value`);
            }
            value = value[0];
            if (key === "client_max_window_bits") {
              if (value !== true) {
                const num = +value;
                if (!Number.isInteger(num) || num < 8 || num > 15) {
                  throw new TypeError(
                    `Invalid value for parameter "${key}": ${value}`
                  );
                }
                value = num;
              } else if (!this._isServer) {
                throw new TypeError(
                  `Invalid value for parameter "${key}": ${value}`
                );
              }
            } else if (key === "server_max_window_bits") {
              const num = +value;
              if (!Number.isInteger(num) || num < 8 || num > 15) {
                throw new TypeError(
                  `Invalid value for parameter "${key}": ${value}`
                );
              }
              value = num;
            } else if (key === "client_no_context_takeover" || key === "server_no_context_takeover") {
              if (value !== true) {
                throw new TypeError(
                  `Invalid value for parameter "${key}": ${value}`
                );
              }
            } else {
              throw new Error(`Unknown parameter "${key}"`);
            }
            params[key] = value;
          });
        });
        return configurations;
      }
      /**
       * Decompress data. Concurrency limited.
       *
       * @param {Buffer} data Compressed data
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @public
       */
      decompress(data, fin, callback) {
        zlibLimiter.add((done) => {
          this._decompress(data, fin, (err, result) => {
            done();
            callback(err, result);
          });
        });
      }
      /**
       * Compress data. Concurrency limited.
       *
       * @param {(Buffer|String)} data Data to compress
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @public
       */
      compress(data, fin, callback) {
        zlibLimiter.add((done) => {
          this._compress(data, fin, (err, result) => {
            done();
            callback(err, result);
          });
        });
      }
      /**
       * Decompress data.
       *
       * @param {Buffer} data Compressed data
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @private
       */
      _decompress(data, fin, callback) {
        const endpoint = this._isServer ? "client" : "server";
        if (!this._inflate) {
          const key = `${endpoint}_max_window_bits`;
          const windowBits = typeof this.params[key] !== "number" ? zlib.Z_DEFAULT_WINDOWBITS : this.params[key];
          this._inflate = zlib.createInflateRaw({
            ...this._options.zlibInflateOptions,
            windowBits
          });
          this._inflate[kPerMessageDeflate] = this;
          this._inflate[kTotalLength] = 0;
          this._inflate[kBuffers] = [];
          this._inflate.on("error", inflateOnError);
          this._inflate.on("data", inflateOnData);
        }
        this._inflate[kCallback] = callback;
        this._inflate.write(data);
        if (fin) this._inflate.write(TRAILER);
        this._inflate.flush(() => {
          const err = this._inflate[kError];
          if (err) {
            this._inflate.close();
            this._inflate = null;
            callback(err);
            return;
          }
          const data2 = bufferUtil.concat(
            this._inflate[kBuffers],
            this._inflate[kTotalLength]
          );
          if (this._inflate._readableState.endEmitted) {
            this._inflate.close();
            this._inflate = null;
          } else {
            this._inflate[kTotalLength] = 0;
            this._inflate[kBuffers] = [];
            if (fin && this.params[`${endpoint}_no_context_takeover`]) {
              this._inflate.reset();
            }
          }
          callback(null, data2);
        });
      }
      /**
       * Compress data.
       *
       * @param {(Buffer|String)} data Data to compress
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @private
       */
      _compress(data, fin, callback) {
        const endpoint = this._isServer ? "server" : "client";
        if (!this._deflate) {
          const key = `${endpoint}_max_window_bits`;
          const windowBits = typeof this.params[key] !== "number" ? zlib.Z_DEFAULT_WINDOWBITS : this.params[key];
          this._deflate = zlib.createDeflateRaw({
            ...this._options.zlibDeflateOptions,
            windowBits
          });
          this._deflate[kTotalLength] = 0;
          this._deflate[kBuffers] = [];
          this._deflate.on("data", deflateOnData);
        }
        this._deflate[kCallback] = callback;
        this._deflate.write(data);
        this._deflate.flush(zlib.Z_SYNC_FLUSH, () => {
          if (!this._deflate) {
            return;
          }
          let data2 = bufferUtil.concat(
            this._deflate[kBuffers],
            this._deflate[kTotalLength]
          );
          if (fin) {
            data2 = new FastBuffer(data2.buffer, data2.byteOffset, data2.length - 4);
          }
          this._deflate[kCallback] = null;
          this._deflate[kTotalLength] = 0;
          this._deflate[kBuffers] = [];
          if (fin && this.params[`${endpoint}_no_context_takeover`]) {
            this._deflate.reset();
          }
          callback(null, data2);
        });
      }
    };
    module.exports = PerMessageDeflate2;
    function deflateOnData(chunk) {
      this[kBuffers].push(chunk);
      this[kTotalLength] += chunk.length;
    }
    function inflateOnData(chunk) {
      this[kTotalLength] += chunk.length;
      if (this[kPerMessageDeflate]._maxPayload < 1 || this[kTotalLength] <= this[kPerMessageDeflate]._maxPayload) {
        this[kBuffers].push(chunk);
        return;
      }
      this[kError] = new RangeError("Max payload size exceeded");
      this[kError].code = "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH";
      this[kError][kStatusCode] = 1009;
      this.removeListener("data", inflateOnData);
      this.reset();
    }
    function inflateOnError(err) {
      this[kPerMessageDeflate]._inflate = null;
      if (this[kError]) {
        this[kCallback](this[kError]);
        return;
      }
      err[kStatusCode] = 1007;
      this[kCallback](err);
    }
  }
});

// gameplay/node_modules/ws/lib/validation.js
var require_validation = __commonJS({
  "gameplay/node_modules/ws/lib/validation.js"(exports, module) {
    "use strict";
    var { isUtf8 } = __require("buffer");
    var { hasBlob } = require_constants();
    var tokenChars = [
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      // 0 - 15
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      // 16 - 31
      0,
      1,
      0,
      1,
      1,
      1,
      1,
      1,
      0,
      0,
      1,
      1,
      0,
      1,
      1,
      0,
      // 32 - 47
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      0,
      0,
      0,
      0,
      0,
      // 48 - 63
      0,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      // 64 - 79
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      0,
      0,
      1,
      1,
      // 80 - 95
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      // 96 - 111
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      1,
      0,
      1,
      0
      // 112 - 127
    ];
    function isValidStatusCode(code) {
      return code >= 1e3 && code <= 1014 && code !== 1004 && code !== 1005 && code !== 1006 || code >= 3e3 && code <= 4999;
    }
    function _isValidUTF8(buf) {
      const len = buf.length;
      let i = 0;
      while (i < len) {
        if ((buf[i] & 128) === 0) {
          i++;
        } else if ((buf[i] & 224) === 192) {
          if (i + 1 === len || (buf[i + 1] & 192) !== 128 || (buf[i] & 254) === 192) {
            return false;
          }
          i += 2;
        } else if ((buf[i] & 240) === 224) {
          if (i + 2 >= len || (buf[i + 1] & 192) !== 128 || (buf[i + 2] & 192) !== 128 || buf[i] === 224 && (buf[i + 1] & 224) === 128 || // Overlong
          buf[i] === 237 && (buf[i + 1] & 224) === 160) {
            return false;
          }
          i += 3;
        } else if ((buf[i] & 248) === 240) {
          if (i + 3 >= len || (buf[i + 1] & 192) !== 128 || (buf[i + 2] & 192) !== 128 || (buf[i + 3] & 192) !== 128 || buf[i] === 240 && (buf[i + 1] & 240) === 128 || // Overlong
          buf[i] === 244 && buf[i + 1] > 143 || buf[i] > 244) {
            return false;
          }
          i += 4;
        } else {
          return false;
        }
      }
      return true;
    }
    function isBlob(value) {
      return hasBlob && typeof value === "object" && typeof value.arrayBuffer === "function" && typeof value.type === "string" && typeof value.stream === "function" && (value[Symbol.toStringTag] === "Blob" || value[Symbol.toStringTag] === "File");
    }
    module.exports = {
      isBlob,
      isValidStatusCode,
      isValidUTF8: _isValidUTF8,
      tokenChars
    };
    if (isUtf8) {
      module.exports.isValidUTF8 = function(buf) {
        return buf.length < 24 ? _isValidUTF8(buf) : isUtf8(buf);
      };
    } else if (!process.env.WS_NO_UTF_8_VALIDATE) {
      try {
        const isValidUTF8 = __require("utf-8-validate");
        module.exports.isValidUTF8 = function(buf) {
          return buf.length < 32 ? _isValidUTF8(buf) : isValidUTF8(buf);
        };
      } catch (e) {
      }
    }
  }
});

// gameplay/node_modules/ws/lib/receiver.js
var require_receiver = __commonJS({
  "gameplay/node_modules/ws/lib/receiver.js"(exports, module) {
    "use strict";
    var { Writable } = __require("stream");
    var PerMessageDeflate2 = require_permessage_deflate();
    var {
      BINARY_TYPES,
      EMPTY_BUFFER,
      kStatusCode,
      kWebSocket
    } = require_constants();
    var { concat, toArrayBuffer, unmask } = require_buffer_util();
    var { isValidStatusCode, isValidUTF8 } = require_validation();
    var FastBuffer = Buffer[Symbol.species];
    var GET_INFO = 0;
    var GET_PAYLOAD_LENGTH_16 = 1;
    var GET_PAYLOAD_LENGTH_64 = 2;
    var GET_MASK = 3;
    var GET_DATA = 4;
    var INFLATING = 5;
    var DEFER_EVENT = 6;
    var Receiver2 = class extends Writable {
      /**
       * Creates a Receiver instance.
       *
       * @param {Object} [options] Options object
       * @param {Boolean} [options.allowSynchronousEvents=true] Specifies whether
       *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
       *     multiple times in the same tick
       * @param {String} [options.binaryType=nodebuffer] The type for binary data
       * @param {Object} [options.extensions] An object containing the negotiated
       *     extensions
       * @param {Boolean} [options.isServer=false] Specifies whether to operate in
       *     client or server mode
       * @param {Number} [options.maxBufferedChunks=0] The maximum number of
       *     buffered data chunks
       * @param {Number} [options.maxFragments=0] The maximum number of message
       *     fragments
       * @param {Number} [options.maxPayload=0] The maximum allowed message length
       * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
       *     not to skip UTF-8 validation for text and close messages
       */
      constructor(options = {}) {
        super();
        this._allowSynchronousEvents = options.allowSynchronousEvents !== void 0 ? options.allowSynchronousEvents : true;
        this._binaryType = options.binaryType || BINARY_TYPES[0];
        this._extensions = options.extensions || {};
        this._isServer = !!options.isServer;
        this._maxBufferedChunks = options.maxBufferedChunks | 0;
        this._maxFragments = options.maxFragments | 0;
        this._maxPayload = options.maxPayload | 0;
        this._skipUTF8Validation = !!options.skipUTF8Validation;
        this[kWebSocket] = void 0;
        this._bufferedBytes = 0;
        this._buffers = [];
        this._compressed = false;
        this._payloadLength = 0;
        this._mask = void 0;
        this._fragmented = 0;
        this._masked = false;
        this._fin = false;
        this._opcode = 0;
        this._totalPayloadLength = 0;
        this._messageLength = 0;
        this._numFragments = 0;
        this._fragments = [];
        this._errored = false;
        this._loop = false;
        this._state = GET_INFO;
      }
      /**
       * Implements `Writable.prototype._write()`.
       *
       * @param {Buffer} chunk The chunk of data to write
       * @param {String} encoding The character encoding of `chunk`
       * @param {Function} cb Callback
       * @private
       */
      _write(chunk, encoding, cb) {
        if (this._opcode === 8 && this._state == GET_INFO) return cb();
        if (this._maxBufferedChunks > 0 && this._buffers.length >= this._maxBufferedChunks) {
          cb(
            this.createError(
              RangeError,
              "Too many buffered chunks",
              false,
              1008,
              "WS_ERR_TOO_MANY_BUFFERED_PARTS"
            )
          );
          return;
        }
        this._bufferedBytes += chunk.length;
        this._buffers.push(chunk);
        this.startLoop(cb);
      }
      /**
       * Consumes `n` bytes from the buffered data.
       *
       * @param {Number} n The number of bytes to consume
       * @return {Buffer} The consumed bytes
       * @private
       */
      consume(n) {
        this._bufferedBytes -= n;
        if (n === this._buffers[0].length) return this._buffers.shift();
        if (n < this._buffers[0].length) {
          const buf = this._buffers[0];
          this._buffers[0] = new FastBuffer(
            buf.buffer,
            buf.byteOffset + n,
            buf.length - n
          );
          return new FastBuffer(buf.buffer, buf.byteOffset, n);
        }
        const dst = Buffer.allocUnsafe(n);
        do {
          const buf = this._buffers[0];
          const offset = dst.length - n;
          if (n >= buf.length) {
            dst.set(this._buffers.shift(), offset);
          } else {
            dst.set(new Uint8Array(buf.buffer, buf.byteOffset, n), offset);
            this._buffers[0] = new FastBuffer(
              buf.buffer,
              buf.byteOffset + n,
              buf.length - n
            );
          }
          n -= buf.length;
        } while (n > 0);
        return dst;
      }
      /**
       * Starts the parsing loop.
       *
       * @param {Function} cb Callback
       * @private
       */
      startLoop(cb) {
        this._loop = true;
        do {
          switch (this._state) {
            case GET_INFO:
              this.getInfo(cb);
              break;
            case GET_PAYLOAD_LENGTH_16:
              this.getPayloadLength16(cb);
              break;
            case GET_PAYLOAD_LENGTH_64:
              this.getPayloadLength64(cb);
              break;
            case GET_MASK:
              this.getMask();
              break;
            case GET_DATA:
              this.getData(cb);
              break;
            case INFLATING:
            case DEFER_EVENT:
              this._loop = false;
              return;
          }
        } while (this._loop);
        if (!this._errored) cb();
      }
      /**
       * Reads the first two bytes of a frame.
       *
       * @param {Function} cb Callback
       * @private
       */
      getInfo(cb) {
        if (this._bufferedBytes < 2) {
          this._loop = false;
          return;
        }
        const buf = this.consume(2);
        if ((buf[0] & 48) !== 0) {
          const error = this.createError(
            RangeError,
            "RSV2 and RSV3 must be clear",
            true,
            1002,
            "WS_ERR_UNEXPECTED_RSV_2_3"
          );
          cb(error);
          return;
        }
        const compressed = (buf[0] & 64) === 64;
        if (compressed && !this._extensions[PerMessageDeflate2.extensionName]) {
          const error = this.createError(
            RangeError,
            "RSV1 must be clear",
            true,
            1002,
            "WS_ERR_UNEXPECTED_RSV_1"
          );
          cb(error);
          return;
        }
        this._fin = (buf[0] & 128) === 128;
        this._opcode = buf[0] & 15;
        this._payloadLength = buf[1] & 127;
        if (this._opcode === 0) {
          if (compressed) {
            const error = this.createError(
              RangeError,
              "RSV1 must be clear",
              true,
              1002,
              "WS_ERR_UNEXPECTED_RSV_1"
            );
            cb(error);
            return;
          }
          if (!this._fragmented) {
            const error = this.createError(
              RangeError,
              "invalid opcode 0",
              true,
              1002,
              "WS_ERR_INVALID_OPCODE"
            );
            cb(error);
            return;
          }
          this._opcode = this._fragmented;
        } else if (this._opcode === 1 || this._opcode === 2) {
          if (this._fragmented) {
            const error = this.createError(
              RangeError,
              `invalid opcode ${this._opcode}`,
              true,
              1002,
              "WS_ERR_INVALID_OPCODE"
            );
            cb(error);
            return;
          }
          this._compressed = compressed;
        } else if (this._opcode > 7 && this._opcode < 11) {
          if (!this._fin) {
            const error = this.createError(
              RangeError,
              "FIN must be set",
              true,
              1002,
              "WS_ERR_EXPECTED_FIN"
            );
            cb(error);
            return;
          }
          if (compressed) {
            const error = this.createError(
              RangeError,
              "RSV1 must be clear",
              true,
              1002,
              "WS_ERR_UNEXPECTED_RSV_1"
            );
            cb(error);
            return;
          }
          if (this._payloadLength > 125 || this._opcode === 8 && this._payloadLength === 1) {
            const error = this.createError(
              RangeError,
              `invalid payload length ${this._payloadLength}`,
              true,
              1002,
              "WS_ERR_INVALID_CONTROL_PAYLOAD_LENGTH"
            );
            cb(error);
            return;
          }
        } else {
          const error = this.createError(
            RangeError,
            `invalid opcode ${this._opcode}`,
            true,
            1002,
            "WS_ERR_INVALID_OPCODE"
          );
          cb(error);
          return;
        }
        if (!this._fin && !this._fragmented) this._fragmented = this._opcode;
        this._masked = (buf[1] & 128) === 128;
        if (this._isServer) {
          if (!this._masked) {
            const error = this.createError(
              RangeError,
              "MASK must be set",
              true,
              1002,
              "WS_ERR_EXPECTED_MASK"
            );
            cb(error);
            return;
          }
        } else if (this._masked) {
          const error = this.createError(
            RangeError,
            "MASK must be clear",
            true,
            1002,
            "WS_ERR_UNEXPECTED_MASK"
          );
          cb(error);
          return;
        }
        if (this._payloadLength === 126) this._state = GET_PAYLOAD_LENGTH_16;
        else if (this._payloadLength === 127) this._state = GET_PAYLOAD_LENGTH_64;
        else this.haveLength(cb);
      }
      /**
       * Gets extended payload length (7+16).
       *
       * @param {Function} cb Callback
       * @private
       */
      getPayloadLength16(cb) {
        if (this._bufferedBytes < 2) {
          this._loop = false;
          return;
        }
        this._payloadLength = this.consume(2).readUInt16BE(0);
        this.haveLength(cb);
      }
      /**
       * Gets extended payload length (7+64).
       *
       * @param {Function} cb Callback
       * @private
       */
      getPayloadLength64(cb) {
        if (this._bufferedBytes < 8) {
          this._loop = false;
          return;
        }
        const buf = this.consume(8);
        const num = buf.readUInt32BE(0);
        if (num > Math.pow(2, 53 - 32) - 1) {
          const error = this.createError(
            RangeError,
            "Unsupported WebSocket frame: payload length > 2^53 - 1",
            false,
            1009,
            "WS_ERR_UNSUPPORTED_DATA_PAYLOAD_LENGTH"
          );
          cb(error);
          return;
        }
        this._payloadLength = num * Math.pow(2, 32) + buf.readUInt32BE(4);
        this.haveLength(cb);
      }
      /**
       * Payload length has been read.
       *
       * @param {Function} cb Callback
       * @private
       */
      haveLength(cb) {
        if (this._payloadLength && this._opcode < 8) {
          this._totalPayloadLength += this._payloadLength;
          if (this._totalPayloadLength > this._maxPayload && this._maxPayload > 0) {
            const error = this.createError(
              RangeError,
              "Max payload size exceeded",
              false,
              1009,
              "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH"
            );
            cb(error);
            return;
          }
        }
        if (this._masked) this._state = GET_MASK;
        else this._state = GET_DATA;
      }
      /**
       * Reads mask bytes.
       *
       * @private
       */
      getMask() {
        if (this._bufferedBytes < 4) {
          this._loop = false;
          return;
        }
        this._mask = this.consume(4);
        this._state = GET_DATA;
      }
      /**
       * Reads data bytes.
       *
       * @param {Function} cb Callback
       * @private
       */
      getData(cb) {
        let data = EMPTY_BUFFER;
        if (this._payloadLength) {
          if (this._bufferedBytes < this._payloadLength) {
            this._loop = false;
            return;
          }
          data = this.consume(this._payloadLength);
          if (this._masked && (this._mask[0] | this._mask[1] | this._mask[2] | this._mask[3]) !== 0) {
            unmask(data, this._mask);
          }
        }
        if (this._opcode > 7) {
          this.controlMessage(data, cb);
          return;
        }
        if (this._maxFragments > 0 && ++this._numFragments > this._maxFragments) {
          const error = this.createError(
            RangeError,
            "Too many message fragments",
            false,
            1008,
            "WS_ERR_TOO_MANY_BUFFERED_PARTS"
          );
          cb(error);
          return;
        }
        if (this._compressed) {
          this._state = INFLATING;
          this.decompress(data, cb);
          return;
        }
        if (data.length) {
          this._messageLength = this._totalPayloadLength;
          this._fragments.push(data);
        }
        this.dataMessage(cb);
      }
      /**
       * Decompresses data.
       *
       * @param {Buffer} data Compressed data
       * @param {Function} cb Callback
       * @private
       */
      decompress(data, cb) {
        const perMessageDeflate = this._extensions[PerMessageDeflate2.extensionName];
        perMessageDeflate.decompress(data, this._fin, (err, buf) => {
          if (err) return cb(err);
          if (buf.length) {
            this._messageLength += buf.length;
            if (this._messageLength > this._maxPayload && this._maxPayload > 0) {
              const error = this.createError(
                RangeError,
                "Max payload size exceeded",
                false,
                1009,
                "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH"
              );
              cb(error);
              return;
            }
            this._fragments.push(buf);
          }
          this.dataMessage(cb);
          if (this._state === GET_INFO) this.startLoop(cb);
        });
      }
      /**
       * Handles a data message.
       *
       * @param {Function} cb Callback
       * @private
       */
      dataMessage(cb) {
        if (!this._fin) {
          this._state = GET_INFO;
          return;
        }
        const messageLength = this._messageLength;
        const fragments = this._fragments;
        this._totalPayloadLength = 0;
        this._messageLength = 0;
        this._fragmented = 0;
        this._numFragments = 0;
        this._fragments = [];
        if (this._opcode === 2) {
          let data;
          if (this._binaryType === "nodebuffer") {
            data = concat(fragments, messageLength);
          } else if (this._binaryType === "arraybuffer") {
            data = toArrayBuffer(concat(fragments, messageLength));
          } else if (this._binaryType === "blob") {
            data = new Blob(fragments);
          } else {
            data = fragments;
          }
          if (this._allowSynchronousEvents) {
            this.emit("message", data, true);
            this._state = GET_INFO;
          } else {
            this._state = DEFER_EVENT;
            setImmediate(() => {
              this.emit("message", data, true);
              this._state = GET_INFO;
              this.startLoop(cb);
            });
          }
        } else {
          const buf = concat(fragments, messageLength);
          if (!this._skipUTF8Validation && !isValidUTF8(buf)) {
            const error = this.createError(
              Error,
              "invalid UTF-8 sequence",
              true,
              1007,
              "WS_ERR_INVALID_UTF8"
            );
            cb(error);
            return;
          }
          if (this._state === INFLATING || this._allowSynchronousEvents) {
            this.emit("message", buf, false);
            this._state = GET_INFO;
          } else {
            this._state = DEFER_EVENT;
            setImmediate(() => {
              this.emit("message", buf, false);
              this._state = GET_INFO;
              this.startLoop(cb);
            });
          }
        }
      }
      /**
       * Handles a control message.
       *
       * @param {Buffer} data Data to handle
       * @return {(Error|RangeError|undefined)} A possible error
       * @private
       */
      controlMessage(data, cb) {
        if (this._opcode === 8) {
          if (data.length === 0) {
            this._loop = false;
            this.emit("conclude", 1005, EMPTY_BUFFER);
            this.end();
          } else {
            const code = data.readUInt16BE(0);
            if (!isValidStatusCode(code)) {
              const error = this.createError(
                RangeError,
                `invalid status code ${code}`,
                true,
                1002,
                "WS_ERR_INVALID_CLOSE_CODE"
              );
              cb(error);
              return;
            }
            const buf = new FastBuffer(
              data.buffer,
              data.byteOffset + 2,
              data.length - 2
            );
            if (!this._skipUTF8Validation && !isValidUTF8(buf)) {
              const error = this.createError(
                Error,
                "invalid UTF-8 sequence",
                true,
                1007,
                "WS_ERR_INVALID_UTF8"
              );
              cb(error);
              return;
            }
            this._loop = false;
            this.emit("conclude", code, buf);
            this.end();
          }
          this._state = GET_INFO;
          return;
        }
        if (this._allowSynchronousEvents) {
          this.emit(this._opcode === 9 ? "ping" : "pong", data);
          this._state = GET_INFO;
        } else {
          this._state = DEFER_EVENT;
          setImmediate(() => {
            this.emit(this._opcode === 9 ? "ping" : "pong", data);
            this._state = GET_INFO;
            this.startLoop(cb);
          });
        }
      }
      /**
       * Builds an error object.
       *
       * @param {function(new:Error|RangeError)} ErrorCtor The error constructor
       * @param {String} message The error message
       * @param {Boolean} prefix Specifies whether or not to add a default prefix to
       *     `message`
       * @param {Number} statusCode The status code
       * @param {String} errorCode The exposed error code
       * @return {(Error|RangeError)} The error
       * @private
       */
      createError(ErrorCtor, message, prefix, statusCode, errorCode) {
        this._loop = false;
        this._errored = true;
        const err = new ErrorCtor(
          prefix ? `Invalid WebSocket frame: ${message}` : message
        );
        Error.captureStackTrace(err, this.createError);
        err.code = errorCode;
        err[kStatusCode] = statusCode;
        return err;
      }
    };
    module.exports = Receiver2;
  }
});

// gameplay/node_modules/ws/lib/sender.js
var require_sender = __commonJS({
  "gameplay/node_modules/ws/lib/sender.js"(exports, module) {
    "use strict";
    var { Duplex } = __require("stream");
    var { randomFillSync } = __require("crypto");
    var {
      types: { isUint8Array }
    } = __require("util");
    var PerMessageDeflate2 = require_permessage_deflate();
    var { EMPTY_BUFFER, kWebSocket, NOOP } = require_constants();
    var { isBlob, isValidStatusCode } = require_validation();
    var { mask: applyMask, toBuffer } = require_buffer_util();
    var kByteLength = /* @__PURE__ */ Symbol("kByteLength");
    var maskBuffer = Buffer.alloc(4);
    var RANDOM_POOL_SIZE = 8 * 1024;
    var randomPool;
    var randomPoolPointer = RANDOM_POOL_SIZE;
    var DEFAULT = 0;
    var DEFLATING = 1;
    var GET_BLOB_DATA = 2;
    var Sender2 = class _Sender {
      /**
       * Creates a Sender instance.
       *
       * @param {Duplex} socket The connection socket
       * @param {Object} [extensions] An object containing the negotiated extensions
       * @param {Function} [generateMask] The function used to generate the masking
       *     key
       */
      constructor(socket, extensions, generateMask) {
        this._extensions = extensions || {};
        if (generateMask) {
          this._generateMask = generateMask;
          this._maskBuffer = Buffer.alloc(4);
        }
        this._socket = socket;
        this._firstFragment = true;
        this._compress = false;
        this._bufferedBytes = 0;
        this._queue = [];
        this._state = DEFAULT;
        this.onerror = NOOP;
        this[kWebSocket] = void 0;
      }
      /**
       * Frames a piece of data according to the HyBi WebSocket protocol.
       *
       * @param {(Buffer|String)} data The data to frame
       * @param {Object} options Options object
       * @param {Boolean} [options.fin=false] Specifies whether or not to set the
       *     FIN bit
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
       *     key
       * @param {Number} options.opcode The opcode
       * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
       *     modified
       * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
       *     RSV1 bit
       * @return {(Buffer|String)[]} The framed data
       * @public
       */
      static frame(data, options) {
        let mask;
        let merge = false;
        let offset = 2;
        let skipMasking = false;
        if (options.mask) {
          mask = options.maskBuffer || maskBuffer;
          if (options.generateMask) {
            options.generateMask(mask);
          } else {
            if (randomPoolPointer === RANDOM_POOL_SIZE) {
              if (randomPool === void 0) {
                randomPool = Buffer.alloc(RANDOM_POOL_SIZE);
              }
              randomFillSync(randomPool, 0, RANDOM_POOL_SIZE);
              randomPoolPointer = 0;
            }
            mask[0] = randomPool[randomPoolPointer++];
            mask[1] = randomPool[randomPoolPointer++];
            mask[2] = randomPool[randomPoolPointer++];
            mask[3] = randomPool[randomPoolPointer++];
          }
          skipMasking = (mask[0] | mask[1] | mask[2] | mask[3]) === 0;
          offset = 6;
        }
        let dataLength;
        if (typeof data === "string") {
          if ((!options.mask || skipMasking) && options[kByteLength] !== void 0) {
            dataLength = options[kByteLength];
          } else {
            data = Buffer.from(data);
            dataLength = data.length;
          }
        } else {
          dataLength = data.length;
          merge = options.mask && options.readOnly && !skipMasking;
        }
        let payloadLength = dataLength;
        if (dataLength >= 65536) {
          offset += 8;
          payloadLength = 127;
        } else if (dataLength > 125) {
          offset += 2;
          payloadLength = 126;
        }
        const target = Buffer.allocUnsafe(merge ? dataLength + offset : offset);
        target[0] = options.fin ? options.opcode | 128 : options.opcode;
        if (options.rsv1) target[0] |= 64;
        target[1] = payloadLength;
        if (payloadLength === 126) {
          target.writeUInt16BE(dataLength, 2);
        } else if (payloadLength === 127) {
          target[2] = target[3] = 0;
          target.writeUIntBE(dataLength, 4, 6);
        }
        if (!options.mask) return [target, data];
        target[1] |= 128;
        target[offset - 4] = mask[0];
        target[offset - 3] = mask[1];
        target[offset - 2] = mask[2];
        target[offset - 1] = mask[3];
        if (skipMasking) return [target, data];
        if (merge) {
          applyMask(data, mask, target, offset, dataLength);
          return [target];
        }
        applyMask(data, mask, data, 0, dataLength);
        return [target, data];
      }
      /**
       * Sends a close message to the other peer.
       *
       * @param {Number} [code] The status code component of the body
       * @param {(String|Buffer)} [data] The message component of the body
       * @param {Boolean} [mask=false] Specifies whether or not to mask the message
       * @param {Function} [cb] Callback
       * @public
       */
      close(code, data, mask, cb) {
        let buf;
        if (code === void 0) {
          buf = EMPTY_BUFFER;
        } else if (typeof code !== "number" || !isValidStatusCode(code)) {
          throw new TypeError("First argument must be a valid error code number");
        } else if (data === void 0 || !data.length) {
          buf = Buffer.allocUnsafe(2);
          buf.writeUInt16BE(code, 0);
        } else {
          const length = Buffer.byteLength(data);
          if (length > 123) {
            throw new RangeError("The message must not be greater than 123 bytes");
          }
          buf = Buffer.allocUnsafe(2 + length);
          buf.writeUInt16BE(code, 0);
          if (typeof data === "string") {
            buf.write(data, 2);
          } else if (isUint8Array(data)) {
            buf.set(data, 2);
          } else {
            throw new TypeError("Second argument must be a string or a Uint8Array");
          }
        }
        const options = {
          [kByteLength]: buf.length,
          fin: true,
          generateMask: this._generateMask,
          mask,
          maskBuffer: this._maskBuffer,
          opcode: 8,
          readOnly: false,
          rsv1: false
        };
        if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, buf, false, options, cb]);
        } else {
          this.sendFrame(_Sender.frame(buf, options), cb);
        }
      }
      /**
       * Sends a ping message to the other peer.
       *
       * @param {*} data The message to send
       * @param {Boolean} [mask=false] Specifies whether or not to mask `data`
       * @param {Function} [cb] Callback
       * @public
       */
      ping(data, mask, cb) {
        let byteLength;
        let readOnly;
        if (typeof data === "string") {
          byteLength = Buffer.byteLength(data);
          readOnly = false;
        } else if (isBlob(data)) {
          byteLength = data.size;
          readOnly = false;
        } else {
          data = toBuffer(data);
          byteLength = data.length;
          readOnly = toBuffer.readOnly;
        }
        if (byteLength > 125) {
          throw new RangeError("The data size must not be greater than 125 bytes");
        }
        const options = {
          [kByteLength]: byteLength,
          fin: true,
          generateMask: this._generateMask,
          mask,
          maskBuffer: this._maskBuffer,
          opcode: 9,
          readOnly,
          rsv1: false
        };
        if (isBlob(data)) {
          if (this._state !== DEFAULT) {
            this.enqueue([this.getBlobData, data, false, options, cb]);
          } else {
            this.getBlobData(data, false, options, cb);
          }
        } else if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, data, false, options, cb]);
        } else {
          this.sendFrame(_Sender.frame(data, options), cb);
        }
      }
      /**
       * Sends a pong message to the other peer.
       *
       * @param {*} data The message to send
       * @param {Boolean} [mask=false] Specifies whether or not to mask `data`
       * @param {Function} [cb] Callback
       * @public
       */
      pong(data, mask, cb) {
        let byteLength;
        let readOnly;
        if (typeof data === "string") {
          byteLength = Buffer.byteLength(data);
          readOnly = false;
        } else if (isBlob(data)) {
          byteLength = data.size;
          readOnly = false;
        } else {
          data = toBuffer(data);
          byteLength = data.length;
          readOnly = toBuffer.readOnly;
        }
        if (byteLength > 125) {
          throw new RangeError("The data size must not be greater than 125 bytes");
        }
        const options = {
          [kByteLength]: byteLength,
          fin: true,
          generateMask: this._generateMask,
          mask,
          maskBuffer: this._maskBuffer,
          opcode: 10,
          readOnly,
          rsv1: false
        };
        if (isBlob(data)) {
          if (this._state !== DEFAULT) {
            this.enqueue([this.getBlobData, data, false, options, cb]);
          } else {
            this.getBlobData(data, false, options, cb);
          }
        } else if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, data, false, options, cb]);
        } else {
          this.sendFrame(_Sender.frame(data, options), cb);
        }
      }
      /**
       * Sends a data message to the other peer.
       *
       * @param {*} data The message to send
       * @param {Object} options Options object
       * @param {Boolean} [options.binary=false] Specifies whether `data` is binary
       *     or text
       * @param {Boolean} [options.compress=false] Specifies whether or not to
       *     compress `data`
       * @param {Boolean} [options.fin=false] Specifies whether the fragment is the
       *     last one
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Function} [cb] Callback
       * @public
       */
      send(data, options, cb) {
        const perMessageDeflate = this._extensions[PerMessageDeflate2.extensionName];
        let opcode = options.binary ? 2 : 1;
        let rsv1 = options.compress;
        let byteLength;
        let readOnly;
        if (typeof data === "string") {
          byteLength = Buffer.byteLength(data);
          readOnly = false;
        } else if (isBlob(data)) {
          byteLength = data.size;
          readOnly = false;
        } else {
          data = toBuffer(data);
          byteLength = data.length;
          readOnly = toBuffer.readOnly;
        }
        if (this._firstFragment) {
          this._firstFragment = false;
          if (rsv1 && perMessageDeflate && perMessageDeflate.params[perMessageDeflate._isServer ? "server_no_context_takeover" : "client_no_context_takeover"]) {
            rsv1 = byteLength >= perMessageDeflate._threshold;
          }
          this._compress = rsv1;
        } else {
          rsv1 = false;
          opcode = 0;
        }
        if (options.fin) this._firstFragment = true;
        const opts = {
          [kByteLength]: byteLength,
          fin: options.fin,
          generateMask: this._generateMask,
          mask: options.mask,
          maskBuffer: this._maskBuffer,
          opcode,
          readOnly,
          rsv1
        };
        if (isBlob(data)) {
          if (this._state !== DEFAULT) {
            this.enqueue([this.getBlobData, data, this._compress, opts, cb]);
          } else {
            this.getBlobData(data, this._compress, opts, cb);
          }
        } else if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, data, this._compress, opts, cb]);
        } else {
          this.dispatch(data, this._compress, opts, cb);
        }
      }
      /**
       * Gets the contents of a blob as binary data.
       *
       * @param {Blob} blob The blob
       * @param {Boolean} [compress=false] Specifies whether or not to compress
       *     the data
       * @param {Object} options Options object
       * @param {Boolean} [options.fin=false] Specifies whether or not to set the
       *     FIN bit
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
       *     key
       * @param {Number} options.opcode The opcode
       * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
       *     modified
       * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
       *     RSV1 bit
       * @param {Function} [cb] Callback
       * @private
       */
      getBlobData(blob, compress, options, cb) {
        this._bufferedBytes += options[kByteLength];
        this._state = GET_BLOB_DATA;
        blob.arrayBuffer().then((arrayBuffer) => {
          if (this._socket.destroyed) {
            const err = new Error(
              "The socket was closed while the blob was being read"
            );
            process.nextTick(callCallbacks, this, err, cb);
            return;
          }
          this._bufferedBytes -= options[kByteLength];
          const data = toBuffer(arrayBuffer);
          if (!compress) {
            this._state = DEFAULT;
            this.sendFrame(_Sender.frame(data, options), cb);
            this.dequeue();
          } else {
            this.dispatch(data, compress, options, cb);
          }
        }).catch((err) => {
          process.nextTick(onError, this, err, cb);
        });
      }
      /**
       * Dispatches a message.
       *
       * @param {(Buffer|String)} data The message to send
       * @param {Boolean} [compress=false] Specifies whether or not to compress
       *     `data`
       * @param {Object} options Options object
       * @param {Boolean} [options.fin=false] Specifies whether or not to set the
       *     FIN bit
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
       *     key
       * @param {Number} options.opcode The opcode
       * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
       *     modified
       * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
       *     RSV1 bit
       * @param {Function} [cb] Callback
       * @private
       */
      dispatch(data, compress, options, cb) {
        if (!compress) {
          this.sendFrame(_Sender.frame(data, options), cb);
          return;
        }
        const perMessageDeflate = this._extensions[PerMessageDeflate2.extensionName];
        this._bufferedBytes += options[kByteLength];
        this._state = DEFLATING;
        perMessageDeflate.compress(data, options.fin, (_, buf) => {
          if (this._socket.destroyed) {
            const err = new Error(
              "The socket was closed while data was being compressed"
            );
            callCallbacks(this, err, cb);
            return;
          }
          this._bufferedBytes -= options[kByteLength];
          this._state = DEFAULT;
          options.readOnly = false;
          this.sendFrame(_Sender.frame(buf, options), cb);
          this.dequeue();
        });
      }
      /**
       * Executes queued send operations.
       *
       * @private
       */
      dequeue() {
        while (this._state === DEFAULT && this._queue.length) {
          const params = this._queue.shift();
          this._bufferedBytes -= params[3][kByteLength];
          Reflect.apply(params[0], this, params.slice(1));
        }
      }
      /**
       * Enqueues a send operation.
       *
       * @param {Array} params Send operation parameters.
       * @private
       */
      enqueue(params) {
        this._bufferedBytes += params[3][kByteLength];
        this._queue.push(params);
      }
      /**
       * Sends a frame.
       *
       * @param {(Buffer | String)[]} list The frame to send
       * @param {Function} [cb] Callback
       * @private
       */
      sendFrame(list, cb) {
        if (list.length === 2) {
          this._socket.cork();
          this._socket.write(list[0]);
          this._socket.write(list[1], cb);
          this._socket.uncork();
        } else {
          this._socket.write(list[0], cb);
        }
      }
    };
    module.exports = Sender2;
    function callCallbacks(sender, err, cb) {
      if (typeof cb === "function") cb(err);
      for (let i = 0; i < sender._queue.length; i++) {
        const params = sender._queue[i];
        const callback = params[params.length - 1];
        if (typeof callback === "function") callback(err);
      }
    }
    function onError(sender, err, cb) {
      callCallbacks(sender, err, cb);
      sender.onerror(err);
    }
  }
});

// gameplay/node_modules/ws/lib/event-target.js
var require_event_target = __commonJS({
  "gameplay/node_modules/ws/lib/event-target.js"(exports, module) {
    "use strict";
    var { kForOnEventAttribute, kListener } = require_constants();
    var kCode = /* @__PURE__ */ Symbol("kCode");
    var kData = /* @__PURE__ */ Symbol("kData");
    var kError = /* @__PURE__ */ Symbol("kError");
    var kMessage = /* @__PURE__ */ Symbol("kMessage");
    var kReason = /* @__PURE__ */ Symbol("kReason");
    var kTarget = /* @__PURE__ */ Symbol("kTarget");
    var kType = /* @__PURE__ */ Symbol("kType");
    var kWasClean = /* @__PURE__ */ Symbol("kWasClean");
    var Event = class {
      /**
       * Create a new `Event`.
       *
       * @param {String} type The name of the event
       * @throws {TypeError} If the `type` argument is not specified
       */
      constructor(type) {
        this[kTarget] = null;
        this[kType] = type;
      }
      /**
       * @type {*}
       */
      get target() {
        return this[kTarget];
      }
      /**
       * @type {String}
       */
      get type() {
        return this[kType];
      }
    };
    Object.defineProperty(Event.prototype, "target", { enumerable: true });
    Object.defineProperty(Event.prototype, "type", { enumerable: true });
    var CloseEvent = class extends Event {
      /**
       * Create a new `CloseEvent`.
       *
       * @param {String} type The name of the event
       * @param {Object} [options] A dictionary object that allows for setting
       *     attributes via object members of the same name
       * @param {Number} [options.code=0] The status code explaining why the
       *     connection was closed
       * @param {String} [options.reason=''] A human-readable string explaining why
       *     the connection was closed
       * @param {Boolean} [options.wasClean=false] Indicates whether or not the
       *     connection was cleanly closed
       */
      constructor(type, options = {}) {
        super(type);
        this[kCode] = options.code === void 0 ? 0 : options.code;
        this[kReason] = options.reason === void 0 ? "" : options.reason;
        this[kWasClean] = options.wasClean === void 0 ? false : options.wasClean;
      }
      /**
       * @type {Number}
       */
      get code() {
        return this[kCode];
      }
      /**
       * @type {String}
       */
      get reason() {
        return this[kReason];
      }
      /**
       * @type {Boolean}
       */
      get wasClean() {
        return this[kWasClean];
      }
    };
    Object.defineProperty(CloseEvent.prototype, "code", { enumerable: true });
    Object.defineProperty(CloseEvent.prototype, "reason", { enumerable: true });
    Object.defineProperty(CloseEvent.prototype, "wasClean", { enumerable: true });
    var ErrorEvent = class extends Event {
      /**
       * Create a new `ErrorEvent`.
       *
       * @param {String} type The name of the event
       * @param {Object} [options] A dictionary object that allows for setting
       *     attributes via object members of the same name
       * @param {*} [options.error=null] The error that generated this event
       * @param {String} [options.message=''] The error message
       */
      constructor(type, options = {}) {
        super(type);
        this[kError] = options.error === void 0 ? null : options.error;
        this[kMessage] = options.message === void 0 ? "" : options.message;
      }
      /**
       * @type {*}
       */
      get error() {
        return this[kError];
      }
      /**
       * @type {String}
       */
      get message() {
        return this[kMessage];
      }
    };
    Object.defineProperty(ErrorEvent.prototype, "error", { enumerable: true });
    Object.defineProperty(ErrorEvent.prototype, "message", { enumerable: true });
    var MessageEvent = class extends Event {
      /**
       * Create a new `MessageEvent`.
       *
       * @param {String} type The name of the event
       * @param {Object} [options] A dictionary object that allows for setting
       *     attributes via object members of the same name
       * @param {*} [options.data=null] The message content
       */
      constructor(type, options = {}) {
        super(type);
        this[kData] = options.data === void 0 ? null : options.data;
      }
      /**
       * @type {*}
       */
      get data() {
        return this[kData];
      }
    };
    Object.defineProperty(MessageEvent.prototype, "data", { enumerable: true });
    var EventTarget = {
      /**
       * Register an event listener.
       *
       * @param {String} type A string representing the event type to listen for
       * @param {(Function|Object)} handler The listener to add
       * @param {Object} [options] An options object specifies characteristics about
       *     the event listener
       * @param {Boolean} [options.once=false] A `Boolean` indicating that the
       *     listener should be invoked at most once after being added. If `true`,
       *     the listener would be automatically removed when invoked.
       * @public
       */
      addEventListener(type, handler, options = {}) {
        for (const listener of this.listeners(type)) {
          if (!options[kForOnEventAttribute] && listener[kListener] === handler && !listener[kForOnEventAttribute]) {
            return;
          }
        }
        let wrapper;
        if (type === "message") {
          wrapper = function onMessage(data, isBinary) {
            const event = new MessageEvent("message", {
              data: isBinary ? data : data.toString()
            });
            event[kTarget] = this;
            callListener(handler, this, event);
          };
        } else if (type === "close") {
          wrapper = function onClose(code, message) {
            const event = new CloseEvent("close", {
              code,
              reason: message.toString(),
              wasClean: this._closeFrameReceived && this._closeFrameSent
            });
            event[kTarget] = this;
            callListener(handler, this, event);
          };
        } else if (type === "error") {
          wrapper = function onError(error) {
            const event = new ErrorEvent("error", {
              error,
              message: error.message
            });
            event[kTarget] = this;
            callListener(handler, this, event);
          };
        } else if (type === "open") {
          wrapper = function onOpen() {
            const event = new Event("open");
            event[kTarget] = this;
            callListener(handler, this, event);
          };
        } else {
          return;
        }
        wrapper[kForOnEventAttribute] = !!options[kForOnEventAttribute];
        wrapper[kListener] = handler;
        if (options.once) {
          this.once(type, wrapper);
        } else {
          this.on(type, wrapper);
        }
      },
      /**
       * Remove an event listener.
       *
       * @param {String} type A string representing the event type to remove
       * @param {(Function|Object)} handler The listener to remove
       * @public
       */
      removeEventListener(type, handler) {
        for (const listener of this.listeners(type)) {
          if (listener[kListener] === handler && !listener[kForOnEventAttribute]) {
            this.removeListener(type, listener);
            break;
          }
        }
      }
    };
    module.exports = {
      CloseEvent,
      ErrorEvent,
      Event,
      EventTarget,
      MessageEvent
    };
    function callListener(listener, thisArg, event) {
      if (typeof listener === "object" && listener.handleEvent) {
        listener.handleEvent.call(listener, event);
      } else {
        listener.call(thisArg, event);
      }
    }
  }
});

// gameplay/node_modules/ws/lib/extension.js
var require_extension = __commonJS({
  "gameplay/node_modules/ws/lib/extension.js"(exports, module) {
    "use strict";
    var { tokenChars } = require_validation();
    function push(dest, name, elem) {
      if (dest[name] === void 0) dest[name] = [elem];
      else dest[name].push(elem);
    }
    function parse(header) {
      const offers = /* @__PURE__ */ Object.create(null);
      let params = /* @__PURE__ */ Object.create(null);
      let mustUnescape = false;
      let isEscaping = false;
      let inQuotes = false;
      let extensionName;
      let paramName;
      let start = -1;
      let code = -1;
      let end = -1;
      let i = 0;
      for (; i < header.length; i++) {
        code = header.charCodeAt(i);
        if (extensionName === void 0) {
          if (end === -1 && tokenChars[code] === 1) {
            if (start === -1) start = i;
          } else if (i !== 0 && (code === 32 || code === 9)) {
            if (end === -1 && start !== -1) end = i;
          } else if (code === 59 || code === 44) {
            if (start === -1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (end === -1) end = i;
            const name = header.slice(start, end);
            if (code === 44) {
              push(offers, name, params);
              params = /* @__PURE__ */ Object.create(null);
            } else {
              extensionName = name;
            }
            start = end = -1;
          } else {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
        } else if (paramName === void 0) {
          if (end === -1 && tokenChars[code] === 1) {
            if (start === -1) start = i;
          } else if (code === 32 || code === 9) {
            if (end === -1 && start !== -1) end = i;
          } else if (code === 59 || code === 44) {
            if (start === -1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (end === -1) end = i;
            push(params, header.slice(start, end), true);
            if (code === 44) {
              push(offers, extensionName, params);
              params = /* @__PURE__ */ Object.create(null);
              extensionName = void 0;
            }
            start = end = -1;
          } else if (code === 61 && start !== -1 && end === -1) {
            paramName = header.slice(start, i);
            start = end = -1;
          } else {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
        } else {
          if (isEscaping) {
            if (tokenChars[code] !== 1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (start === -1) start = i;
            else if (!mustUnescape) mustUnescape = true;
            isEscaping = false;
          } else if (inQuotes) {
            if (tokenChars[code] === 1) {
              if (start === -1) start = i;
            } else if (code === 34 && start !== -1) {
              inQuotes = false;
              end = i;
            } else if (code === 92) {
              isEscaping = true;
            } else {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
          } else if (code === 34 && header.charCodeAt(i - 1) === 61) {
            inQuotes = true;
          } else if (end === -1 && tokenChars[code] === 1) {
            if (start === -1) start = i;
          } else if (start !== -1 && (code === 32 || code === 9)) {
            if (end === -1) end = i;
          } else if (code === 59 || code === 44) {
            if (start === -1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (end === -1) end = i;
            let value = header.slice(start, end);
            if (mustUnescape) {
              value = value.replace(/\\/g, "");
              mustUnescape = false;
            }
            push(params, paramName, value);
            if (code === 44) {
              push(offers, extensionName, params);
              params = /* @__PURE__ */ Object.create(null);
              extensionName = void 0;
            }
            paramName = void 0;
            start = end = -1;
          } else {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
        }
      }
      if (start === -1 || inQuotes || code === 32 || code === 9) {
        throw new SyntaxError("Unexpected end of input");
      }
      if (end === -1) end = i;
      const token = header.slice(start, end);
      if (extensionName === void 0) {
        push(offers, token, params);
      } else {
        if (paramName === void 0) {
          push(params, token, true);
        } else if (mustUnescape) {
          push(params, paramName, token.replace(/\\/g, ""));
        } else {
          push(params, paramName, token);
        }
        push(offers, extensionName, params);
      }
      return offers;
    }
    function format(extensions) {
      return Object.keys(extensions).map((extension2) => {
        let configurations = extensions[extension2];
        if (!Array.isArray(configurations)) configurations = [configurations];
        return configurations.map((params) => {
          return [extension2].concat(
            Object.keys(params).map((k) => {
              let values = params[k];
              if (!Array.isArray(values)) values = [values];
              return values.map((v) => v === true ? k : `${k}=${v}`).join("; ");
            })
          ).join("; ");
        }).join(", ");
      }).join(", ");
    }
    module.exports = { format, parse };
  }
});

// gameplay/node_modules/ws/lib/websocket.js
var require_websocket = __commonJS({
  "gameplay/node_modules/ws/lib/websocket.js"(exports, module) {
    "use strict";
    var EventEmitter = __require("events");
    var https = __require("https");
    var http2 = __require("http");
    var net = __require("net");
    var tls = __require("tls");
    var { randomBytes, createHash } = __require("crypto");
    var { Duplex, Readable } = __require("stream");
    var { URL: URL2 } = __require("url");
    var PerMessageDeflate2 = require_permessage_deflate();
    var Receiver2 = require_receiver();
    var Sender2 = require_sender();
    var { isBlob } = require_validation();
    var {
      BINARY_TYPES,
      CLOSE_TIMEOUT,
      EMPTY_BUFFER,
      GUID,
      kForOnEventAttribute,
      kListener,
      kStatusCode,
      kWebSocket,
      NOOP
    } = require_constants();
    var {
      EventTarget: { addEventListener, removeEventListener }
    } = require_event_target();
    var { format, parse } = require_extension();
    var { toBuffer } = require_buffer_util();
    var kAborted = /* @__PURE__ */ Symbol("kAborted");
    var protocolVersions = [8, 13];
    var readyStates = ["CONNECTING", "OPEN", "CLOSING", "CLOSED"];
    var subprotocolRegex = /^[!#$%&'*+\-.0-9A-Z^_`|a-z~]+$/;
    var WebSocket2 = class _WebSocket extends EventEmitter {
      /**
       * Create a new `WebSocket`.
       *
       * @param {(String|URL)} address The URL to which to connect
       * @param {(String|String[])} [protocols] The subprotocols
       * @param {Object} [options] Connection options
       */
      constructor(address, protocols, options) {
        super();
        this._binaryType = BINARY_TYPES[0];
        this._closeCode = 1006;
        this._closeFrameReceived = false;
        this._closeFrameSent = false;
        this._closeMessage = EMPTY_BUFFER;
        this._closeTimer = null;
        this._errorEmitted = false;
        this._extensions = {};
        this._paused = false;
        this._protocol = "";
        this._readyState = _WebSocket.CONNECTING;
        this._receiver = null;
        this._sender = null;
        this._socket = null;
        if (address !== null) {
          this._bufferedAmount = 0;
          this._isServer = false;
          this._redirects = 0;
          if (protocols === void 0) {
            protocols = [];
          } else if (!Array.isArray(protocols)) {
            if (typeof protocols === "object" && protocols !== null) {
              options = protocols;
              protocols = [];
            } else {
              protocols = [protocols];
            }
          }
          initAsClient(this, address, protocols, options);
        } else {
          this._autoPong = options.autoPong;
          this._closeTimeout = options.closeTimeout;
          this._isServer = true;
        }
      }
      /**
       * For historical reasons, the custom "nodebuffer" type is used by the default
       * instead of "blob".
       *
       * @type {String}
       */
      get binaryType() {
        return this._binaryType;
      }
      set binaryType(type) {
        if (!BINARY_TYPES.includes(type)) return;
        this._binaryType = type;
        if (this._receiver) this._receiver._binaryType = type;
      }
      /**
       * @type {Number}
       */
      get bufferedAmount() {
        if (!this._socket) return this._bufferedAmount;
        return this._socket._writableState.length + this._sender._bufferedBytes;
      }
      /**
       * @type {String}
       */
      get extensions() {
        return Object.keys(this._extensions).join();
      }
      /**
       * @type {Boolean}
       */
      get isPaused() {
        return this._paused;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onclose() {
        return null;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onerror() {
        return null;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onopen() {
        return null;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onmessage() {
        return null;
      }
      /**
       * @type {String}
       */
      get protocol() {
        return this._protocol;
      }
      /**
       * @type {Number}
       */
      get readyState() {
        return this._readyState;
      }
      /**
       * @type {String}
       */
      get url() {
        return this._url;
      }
      /**
       * Set up the socket and the internal resources.
       *
       * @param {Duplex} socket The network socket between the server and client
       * @param {Buffer} head The first packet of the upgraded stream
       * @param {Object} options Options object
       * @param {Boolean} [options.allowSynchronousEvents=false] Specifies whether
       *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
       *     multiple times in the same tick
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Number} [options.maxBufferedChunks=0] The maximum number of
       *     buffered data chunks
       * @param {Number} [options.maxFragments=0] The maximum number of message
       *     fragments
       * @param {Number} [options.maxPayload=0] The maximum allowed message size
       * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
       *     not to skip UTF-8 validation for text and close messages
       * @private
       */
      setSocket(socket, head, options) {
        const receiver = new Receiver2({
          allowSynchronousEvents: options.allowSynchronousEvents,
          binaryType: this.binaryType,
          extensions: this._extensions,
          isServer: this._isServer,
          maxBufferedChunks: options.maxBufferedChunks,
          maxFragments: options.maxFragments,
          maxPayload: options.maxPayload,
          skipUTF8Validation: options.skipUTF8Validation
        });
        const sender = new Sender2(socket, this._extensions, options.generateMask);
        this._receiver = receiver;
        this._sender = sender;
        this._socket = socket;
        receiver[kWebSocket] = this;
        sender[kWebSocket] = this;
        socket[kWebSocket] = this;
        receiver.on("conclude", receiverOnConclude);
        receiver.on("drain", receiverOnDrain);
        receiver.on("error", receiverOnError);
        receiver.on("message", receiverOnMessage);
        receiver.on("ping", receiverOnPing);
        receiver.on("pong", receiverOnPong);
        sender.onerror = senderOnError;
        if (socket.setTimeout) socket.setTimeout(0);
        if (socket.setNoDelay) socket.setNoDelay();
        if (head.length > 0) socket.unshift(head);
        socket.on("close", socketOnClose);
        socket.on("data", socketOnData);
        socket.on("end", socketOnEnd);
        socket.on("error", socketOnError);
        this._readyState = _WebSocket.OPEN;
        this.emit("open");
      }
      /**
       * Emit the `'close'` event.
       *
       * @private
       */
      emitClose() {
        if (!this._socket) {
          this._readyState = _WebSocket.CLOSED;
          this.emit("close", this._closeCode, this._closeMessage);
          return;
        }
        if (this._extensions[PerMessageDeflate2.extensionName]) {
          this._extensions[PerMessageDeflate2.extensionName].cleanup();
        }
        this._receiver.removeAllListeners();
        this._readyState = _WebSocket.CLOSED;
        this.emit("close", this._closeCode, this._closeMessage);
      }
      /**
       * Start a closing handshake.
       *
       *          +----------+   +-----------+   +----------+
       *     - - -|ws.close()|-->|close frame|-->|ws.close()|- - -
       *    |     +----------+   +-----------+   +----------+     |
       *          +----------+   +-----------+         |
       * CLOSING  |ws.close()|<--|close frame|<--+-----+       CLOSING
       *          +----------+   +-----------+   |
       *    |           |                        |   +---+        |
       *                +------------------------+-->|fin| - - - -
       *    |         +---+                      |   +---+
       *     - - - - -|fin|<---------------------+
       *              +---+
       *
       * @param {Number} [code] Status code explaining why the connection is closing
       * @param {(String|Buffer)} [data] The reason why the connection is
       *     closing
       * @public
       */
      close(code, data) {
        if (this.readyState === _WebSocket.CLOSED) return;
        if (this.readyState === _WebSocket.CONNECTING) {
          const msg = "WebSocket was closed before the connection was established";
          abortHandshake(this, this._req, msg);
          return;
        }
        if (this.readyState === _WebSocket.CLOSING) {
          if (this._closeFrameSent && (this._closeFrameReceived || this._receiver._writableState.errorEmitted)) {
            this._socket.end();
          }
          return;
        }
        this._readyState = _WebSocket.CLOSING;
        this._sender.close(code, data, !this._isServer, (err) => {
          if (err) return;
          this._closeFrameSent = true;
          if (this._closeFrameReceived || this._receiver._writableState.errorEmitted) {
            this._socket.end();
          }
        });
        setCloseTimer(this);
      }
      /**
       * Pause the socket.
       *
       * @public
       */
      pause() {
        if (this.readyState === _WebSocket.CONNECTING || this.readyState === _WebSocket.CLOSED) {
          return;
        }
        this._paused = true;
        this._socket.pause();
      }
      /**
       * Send a ping.
       *
       * @param {*} [data] The data to send
       * @param {Boolean} [mask] Indicates whether or not to mask `data`
       * @param {Function} [cb] Callback which is executed when the ping is sent
       * @public
       */
      ping(data, mask, cb) {
        if (this.readyState === _WebSocket.CONNECTING) {
          throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
        }
        if (typeof data === "function") {
          cb = data;
          data = mask = void 0;
        } else if (typeof mask === "function") {
          cb = mask;
          mask = void 0;
        }
        if (typeof data === "number") data = data.toString();
        if (this.readyState !== _WebSocket.OPEN) {
          sendAfterClose(this, data, cb);
          return;
        }
        if (mask === void 0) mask = !this._isServer;
        this._sender.ping(data || EMPTY_BUFFER, mask, cb);
      }
      /**
       * Send a pong.
       *
       * @param {*} [data] The data to send
       * @param {Boolean} [mask] Indicates whether or not to mask `data`
       * @param {Function} [cb] Callback which is executed when the pong is sent
       * @public
       */
      pong(data, mask, cb) {
        if (this.readyState === _WebSocket.CONNECTING) {
          throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
        }
        if (typeof data === "function") {
          cb = data;
          data = mask = void 0;
        } else if (typeof mask === "function") {
          cb = mask;
          mask = void 0;
        }
        if (typeof data === "number") data = data.toString();
        if (this.readyState !== _WebSocket.OPEN) {
          sendAfterClose(this, data, cb);
          return;
        }
        if (mask === void 0) mask = !this._isServer;
        this._sender.pong(data || EMPTY_BUFFER, mask, cb);
      }
      /**
       * Resume the socket.
       *
       * @public
       */
      resume() {
        if (this.readyState === _WebSocket.CONNECTING || this.readyState === _WebSocket.CLOSED) {
          return;
        }
        this._paused = false;
        if (!this._receiver._writableState.needDrain) this._socket.resume();
      }
      /**
       * Send a data message.
       *
       * @param {*} data The message to send
       * @param {Object} [options] Options object
       * @param {Boolean} [options.binary] Specifies whether `data` is binary or
       *     text
       * @param {Boolean} [options.compress] Specifies whether or not to compress
       *     `data`
       * @param {Boolean} [options.fin=true] Specifies whether the fragment is the
       *     last one
       * @param {Boolean} [options.mask] Specifies whether or not to mask `data`
       * @param {Function} [cb] Callback which is executed when data is written out
       * @public
       */
      send(data, options, cb) {
        if (this.readyState === _WebSocket.CONNECTING) {
          throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
        }
        if (typeof options === "function") {
          cb = options;
          options = {};
        }
        if (typeof data === "number") data = data.toString();
        if (this.readyState !== _WebSocket.OPEN) {
          sendAfterClose(this, data, cb);
          return;
        }
        const opts = {
          binary: typeof data !== "string",
          mask: !this._isServer,
          compress: true,
          fin: true,
          ...options
        };
        if (!this._extensions[PerMessageDeflate2.extensionName]) {
          opts.compress = false;
        }
        this._sender.send(data || EMPTY_BUFFER, opts, cb);
      }
      /**
       * Forcibly close the connection.
       *
       * @public
       */
      terminate() {
        if (this.readyState === _WebSocket.CLOSED) return;
        if (this.readyState === _WebSocket.CONNECTING) {
          const msg = "WebSocket was closed before the connection was established";
          abortHandshake(this, this._req, msg);
          return;
        }
        if (this._socket) {
          this._readyState = _WebSocket.CLOSING;
          this._socket.destroy();
        }
      }
    };
    Object.defineProperty(WebSocket2, "CONNECTING", {
      enumerable: true,
      value: readyStates.indexOf("CONNECTING")
    });
    Object.defineProperty(WebSocket2.prototype, "CONNECTING", {
      enumerable: true,
      value: readyStates.indexOf("CONNECTING")
    });
    Object.defineProperty(WebSocket2, "OPEN", {
      enumerable: true,
      value: readyStates.indexOf("OPEN")
    });
    Object.defineProperty(WebSocket2.prototype, "OPEN", {
      enumerable: true,
      value: readyStates.indexOf("OPEN")
    });
    Object.defineProperty(WebSocket2, "CLOSING", {
      enumerable: true,
      value: readyStates.indexOf("CLOSING")
    });
    Object.defineProperty(WebSocket2.prototype, "CLOSING", {
      enumerable: true,
      value: readyStates.indexOf("CLOSING")
    });
    Object.defineProperty(WebSocket2, "CLOSED", {
      enumerable: true,
      value: readyStates.indexOf("CLOSED")
    });
    Object.defineProperty(WebSocket2.prototype, "CLOSED", {
      enumerable: true,
      value: readyStates.indexOf("CLOSED")
    });
    [
      "binaryType",
      "bufferedAmount",
      "extensions",
      "isPaused",
      "protocol",
      "readyState",
      "url"
    ].forEach((property) => {
      Object.defineProperty(WebSocket2.prototype, property, { enumerable: true });
    });
    ["open", "error", "close", "message"].forEach((method) => {
      Object.defineProperty(WebSocket2.prototype, `on${method}`, {
        enumerable: true,
        get() {
          for (const listener of this.listeners(method)) {
            if (listener[kForOnEventAttribute]) return listener[kListener];
          }
          return null;
        },
        set(handler) {
          for (const listener of this.listeners(method)) {
            if (listener[kForOnEventAttribute]) {
              this.removeListener(method, listener);
              break;
            }
          }
          if (typeof handler !== "function") return;
          this.addEventListener(method, handler, {
            [kForOnEventAttribute]: true
          });
        }
      });
    });
    WebSocket2.prototype.addEventListener = addEventListener;
    WebSocket2.prototype.removeEventListener = removeEventListener;
    module.exports = WebSocket2;
    function initAsClient(websocket, address, protocols, options) {
      const opts = {
        allowSynchronousEvents: true,
        autoPong: true,
        closeTimeout: CLOSE_TIMEOUT,
        protocolVersion: protocolVersions[1],
        maxBufferedChunks: 256 * 1024,
        maxFragments: 16 * 1024,
        maxPayload: 100 * 1024 * 1024,
        skipUTF8Validation: false,
        perMessageDeflate: true,
        followRedirects: false,
        maxRedirects: 10,
        ...options,
        socketPath: void 0,
        hostname: void 0,
        protocol: void 0,
        timeout: void 0,
        method: "GET",
        host: void 0,
        path: void 0,
        port: void 0
      };
      websocket._autoPong = opts.autoPong;
      websocket._closeTimeout = opts.closeTimeout;
      if (!protocolVersions.includes(opts.protocolVersion)) {
        throw new RangeError(
          `Unsupported protocol version: ${opts.protocolVersion} (supported versions: ${protocolVersions.join(", ")})`
        );
      }
      let parsedUrl;
      if (address instanceof URL2) {
        parsedUrl = address;
      } else {
        try {
          parsedUrl = new URL2(address);
        } catch {
          throw new SyntaxError(`Invalid URL: ${address}`);
        }
      }
      if (parsedUrl.protocol === "http:") {
        parsedUrl.protocol = "ws:";
      } else if (parsedUrl.protocol === "https:") {
        parsedUrl.protocol = "wss:";
      }
      websocket._url = parsedUrl.href;
      const isSecure = parsedUrl.protocol === "wss:";
      const isIpcUrl = parsedUrl.protocol === "ws+unix:";
      let invalidUrlMessage;
      if (parsedUrl.protocol !== "ws:" && !isSecure && !isIpcUrl) {
        invalidUrlMessage = `The URL's protocol must be one of "ws:", "wss:", "http:", "https:", or "ws+unix:"`;
      } else if (isIpcUrl && !parsedUrl.pathname) {
        invalidUrlMessage = "The URL's pathname is empty";
      } else if (parsedUrl.hash) {
        invalidUrlMessage = "The URL contains a fragment identifier";
      }
      if (invalidUrlMessage) {
        const err = new SyntaxError(invalidUrlMessage);
        if (websocket._redirects === 0) {
          throw err;
        } else {
          emitErrorAndClose(websocket, err);
          return;
        }
      }
      const defaultPort = isSecure ? 443 : 80;
      const key = randomBytes(16).toString("base64");
      const request = isSecure ? https.request : http2.request;
      const protocolSet = /* @__PURE__ */ new Set();
      let perMessageDeflate;
      opts.createConnection = opts.createConnection || (isSecure ? tlsConnect : netConnect);
      opts.defaultPort = opts.defaultPort || defaultPort;
      opts.port = parsedUrl.port || defaultPort;
      opts.host = parsedUrl.hostname.startsWith("[") ? parsedUrl.hostname.slice(1, -1) : parsedUrl.hostname;
      opts.headers = {
        ...opts.headers,
        "Sec-WebSocket-Version": opts.protocolVersion,
        "Sec-WebSocket-Key": key,
        Connection: "Upgrade",
        Upgrade: "websocket"
      };
      opts.path = parsedUrl.pathname + parsedUrl.search;
      opts.timeout = opts.handshakeTimeout;
      if (opts.perMessageDeflate) {
        perMessageDeflate = new PerMessageDeflate2({
          ...opts.perMessageDeflate,
          isServer: false,
          maxPayload: opts.maxPayload
        });
        opts.headers["Sec-WebSocket-Extensions"] = format({
          [PerMessageDeflate2.extensionName]: perMessageDeflate.offer()
        });
      }
      if (protocols.length) {
        for (const protocol of protocols) {
          if (typeof protocol !== "string" || !subprotocolRegex.test(protocol) || protocolSet.has(protocol)) {
            throw new SyntaxError(
              "An invalid or duplicated subprotocol was specified"
            );
          }
          protocolSet.add(protocol);
        }
        opts.headers["Sec-WebSocket-Protocol"] = protocols.join(",");
      }
      if (opts.origin) {
        if (opts.protocolVersion < 13) {
          opts.headers["Sec-WebSocket-Origin"] = opts.origin;
        } else {
          opts.headers.Origin = opts.origin;
        }
      }
      if (parsedUrl.username || parsedUrl.password) {
        opts.auth = `${parsedUrl.username}:${parsedUrl.password}`;
      }
      if (isIpcUrl) {
        const parts = opts.path.split(":");
        opts.socketPath = parts[0];
        opts.path = parts[1];
      }
      let req;
      if (opts.followRedirects) {
        if (websocket._redirects === 0) {
          websocket._originalIpc = isIpcUrl;
          websocket._originalSecure = isSecure;
          websocket._originalHostOrSocketPath = isIpcUrl ? opts.socketPath : parsedUrl.host;
          const headers = options && options.headers;
          options = { ...options, headers: {} };
          if (headers) {
            for (const [key2, value] of Object.entries(headers)) {
              options.headers[key2.toLowerCase()] = value;
            }
          }
        } else if (websocket.listenerCount("redirect") === 0) {
          const isSameHost = isIpcUrl ? websocket._originalIpc ? opts.socketPath === websocket._originalHostOrSocketPath : false : websocket._originalIpc ? false : parsedUrl.host === websocket._originalHostOrSocketPath;
          if (!isSameHost || websocket._originalSecure && !isSecure) {
            delete opts.headers.authorization;
            delete opts.headers.cookie;
            if (!isSameHost) delete opts.headers.host;
            opts.auth = void 0;
          }
        }
        if (opts.auth && !options.headers.authorization) {
          options.headers.authorization = "Basic " + Buffer.from(opts.auth).toString("base64");
        }
        req = websocket._req = request(opts);
        if (websocket._redirects) {
          websocket.emit("redirect", websocket.url, req);
        }
      } else {
        req = websocket._req = request(opts);
      }
      if (opts.timeout) {
        req.on("timeout", () => {
          abortHandshake(websocket, req, "Opening handshake has timed out");
        });
      }
      req.on("error", (err) => {
        if (req === null || req[kAborted]) return;
        req = websocket._req = null;
        emitErrorAndClose(websocket, err);
      });
      req.on("response", (res) => {
        const location = res.headers.location;
        const statusCode = res.statusCode;
        if (location && opts.followRedirects && statusCode >= 300 && statusCode < 400) {
          if (++websocket._redirects > opts.maxRedirects) {
            abortHandshake(websocket, req, "Maximum redirects exceeded");
            return;
          }
          req.abort();
          let addr;
          try {
            addr = new URL2(location, address);
          } catch (e) {
            const err = new SyntaxError(`Invalid URL: ${location}`);
            emitErrorAndClose(websocket, err);
            return;
          }
          initAsClient(websocket, addr, protocols, options);
        } else if (!websocket.emit("unexpected-response", req, res)) {
          abortHandshake(
            websocket,
            req,
            `Unexpected server response: ${res.statusCode}`
          );
        }
      });
      req.on("upgrade", (res, socket, head) => {
        websocket.emit("upgrade", res);
        if (websocket.readyState !== WebSocket2.CONNECTING) return;
        req = websocket._req = null;
        const upgrade = res.headers.upgrade;
        if (upgrade === void 0 || upgrade.toLowerCase() !== "websocket") {
          abortHandshake(websocket, socket, "Invalid Upgrade header");
          return;
        }
        const digest = createHash("sha1").update(key + GUID).digest("base64");
        if (res.headers["sec-websocket-accept"] !== digest) {
          abortHandshake(websocket, socket, "Invalid Sec-WebSocket-Accept header");
          return;
        }
        const serverProt = res.headers["sec-websocket-protocol"];
        let protError;
        if (serverProt !== void 0) {
          if (!protocolSet.size) {
            protError = "Server sent a subprotocol but none was requested";
          } else if (!protocolSet.has(serverProt)) {
            protError = "Server sent an invalid subprotocol";
          }
        } else if (protocolSet.size) {
          protError = "Server sent no subprotocol";
        }
        if (protError) {
          abortHandshake(websocket, socket, protError);
          return;
        }
        if (serverProt) websocket._protocol = serverProt;
        const secWebSocketExtensions = res.headers["sec-websocket-extensions"];
        if (secWebSocketExtensions !== void 0) {
          if (!perMessageDeflate) {
            const message = "Server sent a Sec-WebSocket-Extensions header but no extension was requested";
            abortHandshake(websocket, socket, message);
            return;
          }
          let extensions;
          try {
            extensions = parse(secWebSocketExtensions);
          } catch (err) {
            const message = "Invalid Sec-WebSocket-Extensions header";
            abortHandshake(websocket, socket, message);
            return;
          }
          const extensionNames = Object.keys(extensions);
          if (extensionNames.length !== 1 || extensionNames[0] !== PerMessageDeflate2.extensionName) {
            const message = "Server indicated an extension that was not requested";
            abortHandshake(websocket, socket, message);
            return;
          }
          try {
            perMessageDeflate.accept(extensions[PerMessageDeflate2.extensionName]);
          } catch (err) {
            const message = "Invalid Sec-WebSocket-Extensions header";
            abortHandshake(websocket, socket, message);
            return;
          }
          websocket._extensions[PerMessageDeflate2.extensionName] = perMessageDeflate;
        }
        websocket.setSocket(socket, head, {
          allowSynchronousEvents: opts.allowSynchronousEvents,
          generateMask: opts.generateMask,
          maxBufferedChunks: opts.maxBufferedChunks,
          maxFragments: opts.maxFragments,
          maxPayload: opts.maxPayload,
          skipUTF8Validation: opts.skipUTF8Validation
        });
      });
      if (opts.finishRequest) {
        opts.finishRequest(req, websocket);
      } else {
        req.end();
      }
    }
    function emitErrorAndClose(websocket, err) {
      websocket._readyState = WebSocket2.CLOSING;
      websocket._errorEmitted = true;
      websocket.emit("error", err);
      websocket.emitClose();
    }
    function netConnect(options) {
      options.path = options.socketPath;
      return net.connect(options);
    }
    function tlsConnect(options) {
      options.path = void 0;
      if (!options.servername && options.servername !== "") {
        options.servername = net.isIP(options.host) ? "" : options.host;
      }
      return tls.connect(options);
    }
    function abortHandshake(websocket, stream, message) {
      websocket._readyState = WebSocket2.CLOSING;
      const err = new Error(message);
      Error.captureStackTrace(err, abortHandshake);
      if (stream.setHeader) {
        stream[kAborted] = true;
        stream.abort();
        if (stream.socket && !stream.socket.destroyed) {
          stream.socket.destroy();
        }
        process.nextTick(emitErrorAndClose, websocket, err);
      } else {
        stream.destroy(err);
        stream.once("error", websocket.emit.bind(websocket, "error"));
        stream.once("close", websocket.emitClose.bind(websocket));
      }
    }
    function sendAfterClose(websocket, data, cb) {
      if (data) {
        const length = isBlob(data) ? data.size : toBuffer(data).length;
        if (websocket._socket) websocket._sender._bufferedBytes += length;
        else websocket._bufferedAmount += length;
      }
      if (cb) {
        const err = new Error(
          `WebSocket is not open: readyState ${websocket.readyState} (${readyStates[websocket.readyState]})`
        );
        process.nextTick(cb, err);
      }
    }
    function receiverOnConclude(code, reason) {
      const websocket = this[kWebSocket];
      websocket._closeFrameReceived = true;
      websocket._closeMessage = reason;
      websocket._closeCode = code;
      if (websocket._socket[kWebSocket] === void 0) return;
      websocket._socket.removeListener("data", socketOnData);
      process.nextTick(resume, websocket._socket);
      if (code === 1005) websocket.close();
      else websocket.close(code, reason);
    }
    function receiverOnDrain() {
      const websocket = this[kWebSocket];
      if (!websocket.isPaused) websocket._socket.resume();
    }
    function receiverOnError(err) {
      const websocket = this[kWebSocket];
      if (websocket._socket[kWebSocket] !== void 0) {
        websocket._socket.removeListener("data", socketOnData);
        process.nextTick(resume, websocket._socket);
        websocket.close(err[kStatusCode]);
      }
      if (!websocket._errorEmitted) {
        websocket._errorEmitted = true;
        websocket.emit("error", err);
      }
    }
    function receiverOnFinish() {
      this[kWebSocket].emitClose();
    }
    function receiverOnMessage(data, isBinary) {
      this[kWebSocket].emit("message", data, isBinary);
    }
    function receiverOnPing(data) {
      const websocket = this[kWebSocket];
      if (websocket._autoPong) websocket.pong(data, !this._isServer, NOOP);
      websocket.emit("ping", data);
    }
    function receiverOnPong(data) {
      this[kWebSocket].emit("pong", data);
    }
    function resume(stream) {
      stream.resume();
    }
    function senderOnError(err) {
      const websocket = this[kWebSocket];
      if (websocket.readyState === WebSocket2.CLOSED) return;
      if (websocket.readyState === WebSocket2.OPEN) {
        websocket._readyState = WebSocket2.CLOSING;
        setCloseTimer(websocket);
      }
      this._socket.end();
      if (!websocket._errorEmitted) {
        websocket._errorEmitted = true;
        websocket.emit("error", err);
      }
    }
    function setCloseTimer(websocket) {
      websocket._closeTimer = setTimeout(
        websocket._socket.destroy.bind(websocket._socket),
        websocket._closeTimeout
      );
    }
    function socketOnClose() {
      const websocket = this[kWebSocket];
      this.removeListener("close", socketOnClose);
      this.removeListener("data", socketOnData);
      this.removeListener("end", socketOnEnd);
      websocket._readyState = WebSocket2.CLOSING;
      if (!this._readableState.endEmitted && !websocket._closeFrameReceived && !websocket._receiver._writableState.errorEmitted && this._readableState.length !== 0) {
        const chunk = this.read(this._readableState.length);
        websocket._receiver.write(chunk);
      }
      websocket._receiver.end();
      this[kWebSocket] = void 0;
      clearTimeout(websocket._closeTimer);
      if (websocket._receiver._writableState.finished || websocket._receiver._writableState.errorEmitted) {
        websocket.emitClose();
      } else {
        websocket._receiver.on("error", receiverOnFinish);
        websocket._receiver.on("finish", receiverOnFinish);
      }
    }
    function socketOnData(chunk) {
      if (!this[kWebSocket]._receiver.write(chunk)) {
        this.pause();
      }
    }
    function socketOnEnd() {
      const websocket = this[kWebSocket];
      websocket._readyState = WebSocket2.CLOSING;
      websocket._receiver.end();
      this.end();
    }
    function socketOnError() {
      const websocket = this[kWebSocket];
      this.removeListener("error", socketOnError);
      this.on("error", NOOP);
      if (websocket) {
        websocket._readyState = WebSocket2.CLOSING;
        this.destroy();
      }
    }
  }
});

// gameplay/node_modules/ws/lib/stream.js
var require_stream = __commonJS({
  "gameplay/node_modules/ws/lib/stream.js"(exports, module) {
    "use strict";
    var WebSocket2 = require_websocket();
    var { Duplex } = __require("stream");
    function emitClose(stream) {
      stream.emit("close");
    }
    function duplexOnEnd() {
      if (!this.destroyed && this._writableState.finished) {
        this.destroy();
      }
    }
    function duplexOnError(err) {
      this.removeListener("error", duplexOnError);
      this.destroy();
      if (this.listenerCount("error") === 0) {
        this.emit("error", err);
      }
    }
    function createWebSocketStream2(ws, options) {
      let terminateOnDestroy = true;
      const duplex = new Duplex({
        ...options,
        autoDestroy: false,
        emitClose: false,
        objectMode: false,
        writableObjectMode: false
      });
      ws.on("message", function message(msg, isBinary) {
        const data = !isBinary && duplex._readableState.objectMode ? msg.toString() : msg;
        if (!duplex.push(data)) ws.pause();
      });
      ws.once("error", function error(err) {
        if (duplex.destroyed) return;
        terminateOnDestroy = false;
        duplex.destroy(err);
      });
      ws.once("close", function close() {
        if (duplex.destroyed) return;
        duplex.push(null);
      });
      duplex._destroy = function(err, callback) {
        if (ws.readyState === ws.CLOSED) {
          callback(err);
          process.nextTick(emitClose, duplex);
          return;
        }
        let called = false;
        ws.once("error", function error(err2) {
          called = true;
          callback(err2);
        });
        ws.once("close", function close() {
          if (!called) callback(err);
          process.nextTick(emitClose, duplex);
        });
        if (terminateOnDestroy) ws.terminate();
      };
      duplex._final = function(callback) {
        if (ws.readyState === ws.CONNECTING) {
          ws.once("open", function open() {
            duplex._final(callback);
          });
          return;
        }
        if (ws._socket === null) return;
        if (ws._socket._writableState.finished) {
          callback();
          if (duplex._readableState.endEmitted) duplex.destroy();
        } else {
          ws._socket.once("finish", function finish() {
            callback();
          });
          ws.close();
        }
      };
      duplex._read = function() {
        if (ws.isPaused) ws.resume();
      };
      duplex._write = function(chunk, encoding, callback) {
        if (ws.readyState === ws.CONNECTING) {
          ws.once("open", function open() {
            duplex._write(chunk, encoding, callback);
          });
          return;
        }
        ws.send(chunk, callback);
      };
      duplex.on("end", duplexOnEnd);
      duplex.on("error", duplexOnError);
      return duplex;
    }
    module.exports = createWebSocketStream2;
  }
});

// gameplay/node_modules/ws/lib/subprotocol.js
var require_subprotocol = __commonJS({
  "gameplay/node_modules/ws/lib/subprotocol.js"(exports, module) {
    "use strict";
    var { tokenChars } = require_validation();
    function parse(header) {
      const protocols = /* @__PURE__ */ new Set();
      let start = -1;
      let end = -1;
      let i = 0;
      for (i; i < header.length; i++) {
        const code = header.charCodeAt(i);
        if (end === -1 && tokenChars[code] === 1) {
          if (start === -1) start = i;
        } else if (i !== 0 && (code === 32 || code === 9)) {
          if (end === -1 && start !== -1) end = i;
        } else if (code === 44) {
          if (start === -1) {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
          if (end === -1) end = i;
          const protocol2 = header.slice(start, end);
          if (protocols.has(protocol2)) {
            throw new SyntaxError(`The "${protocol2}" subprotocol is duplicated`);
          }
          protocols.add(protocol2);
          start = end = -1;
        } else {
          throw new SyntaxError(`Unexpected character at index ${i}`);
        }
      }
      if (start === -1 || end !== -1) {
        throw new SyntaxError("Unexpected end of input");
      }
      const protocol = header.slice(start, i);
      if (protocols.has(protocol)) {
        throw new SyntaxError(`The "${protocol}" subprotocol is duplicated`);
      }
      protocols.add(protocol);
      return protocols;
    }
    module.exports = { parse };
  }
});

// gameplay/node_modules/ws/lib/websocket-server.js
var require_websocket_server = __commonJS({
  "gameplay/node_modules/ws/lib/websocket-server.js"(exports, module) {
    "use strict";
    var EventEmitter = __require("events");
    var http2 = __require("http");
    var { Duplex } = __require("stream");
    var { createHash } = __require("crypto");
    var extension2 = require_extension();
    var PerMessageDeflate2 = require_permessage_deflate();
    var subprotocol2 = require_subprotocol();
    var WebSocket2 = require_websocket();
    var { CLOSE_TIMEOUT, GUID, kWebSocket } = require_constants();
    var keyRegex = /^[+/0-9A-Za-z]{22}==$/;
    var RUNNING = 0;
    var CLOSING = 1;
    var CLOSED = 2;
    var WebSocketServer2 = class extends EventEmitter {
      /**
       * Create a `WebSocketServer` instance.
       *
       * @param {Object} options Configuration options
       * @param {Boolean} [options.allowSynchronousEvents=true] Specifies whether
       *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
       *     multiple times in the same tick
       * @param {Boolean} [options.autoPong=true] Specifies whether or not to
       *     automatically send a pong in response to a ping
       * @param {Number} [options.backlog=511] The maximum length of the queue of
       *     pending connections
       * @param {Boolean} [options.clientTracking=true] Specifies whether or not to
       *     track clients
       * @param {Number} [options.closeTimeout=30000] Duration in milliseconds to
       *     wait for the closing handshake to finish after `websocket.close()` is
       *     called
       * @param {Function} [options.handleProtocols] A hook to handle protocols
       * @param {String} [options.host] The hostname where to bind the server
       * @param {Number} [options.maxBufferedChunks=262144] The maximum number of
       *     buffered data chunks
       * @param {Number} [options.maxFragments=16384] The maximum number of message
       *     fragments
       * @param {Number} [options.maxPayload=104857600] The maximum allowed message
       *     size
       * @param {Boolean} [options.noServer=false] Enable no server mode
       * @param {String} [options.path] Accept only connections matching this path
       * @param {(Boolean|Object)} [options.perMessageDeflate=false] Enable/disable
       *     permessage-deflate
       * @param {Number} [options.port] The port where to bind the server
       * @param {(http.Server|https.Server)} [options.server] A pre-created HTTP/S
       *     server to use
       * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
       *     not to skip UTF-8 validation for text and close messages
       * @param {Function} [options.verifyClient] A hook to reject connections
       * @param {Function} [options.WebSocket=WebSocket] Specifies the `WebSocket`
       *     class to use. It must be the `WebSocket` class or class that extends it
       * @param {Function} [callback] A listener for the `listening` event
       */
      constructor(options, callback) {
        super();
        options = {
          allowSynchronousEvents: true,
          autoPong: true,
          maxBufferedChunks: 256 * 1024,
          maxFragments: 16 * 1024,
          maxPayload: 100 * 1024 * 1024,
          skipUTF8Validation: false,
          perMessageDeflate: false,
          handleProtocols: null,
          clientTracking: true,
          closeTimeout: CLOSE_TIMEOUT,
          verifyClient: null,
          noServer: false,
          backlog: null,
          // use default (511 as implemented in net.js)
          server: null,
          host: null,
          path: null,
          port: null,
          WebSocket: WebSocket2,
          ...options
        };
        if (options.port == null && !options.server && !options.noServer || options.port != null && (options.server || options.noServer) || options.server && options.noServer) {
          throw new TypeError(
            'One and only one of the "port", "server", or "noServer" options must be specified'
          );
        }
        if (options.port != null) {
          this._server = http2.createServer((req, res) => {
            const body = http2.STATUS_CODES[426];
            res.writeHead(426, {
              "Content-Length": body.length,
              "Content-Type": "text/plain"
            });
            res.end(body);
          });
          this._server.listen(
            options.port,
            options.host,
            options.backlog,
            callback
          );
        } else if (options.server) {
          this._server = options.server;
        }
        if (this._server) {
          const emitConnection = this.emit.bind(this, "connection");
          this._removeListeners = addListeners(this._server, {
            listening: this.emit.bind(this, "listening"),
            error: this.emit.bind(this, "error"),
            upgrade: (req, socket, head) => {
              this.handleUpgrade(req, socket, head, emitConnection);
            }
          });
        }
        if (options.perMessageDeflate === true) options.perMessageDeflate = {};
        if (options.clientTracking) {
          this.clients = /* @__PURE__ */ new Set();
          this._shouldEmitClose = false;
        }
        this.options = options;
        this._state = RUNNING;
      }
      /**
       * Returns the bound address, the address family name, and port of the server
       * as reported by the operating system if listening on an IP socket.
       * If the server is listening on a pipe or UNIX domain socket, the name is
       * returned as a string.
       *
       * @return {(Object|String|null)} The address of the server
       * @public
       */
      address() {
        if (this.options.noServer) {
          throw new Error('The server is operating in "noServer" mode');
        }
        if (!this._server) return null;
        return this._server.address();
      }
      /**
       * Stop the server from accepting new connections and emit the `'close'` event
       * when all existing connections are closed.
       *
       * @param {Function} [cb] A one-time listener for the `'close'` event
       * @public
       */
      close(cb) {
        if (this._state === CLOSED) {
          if (cb) {
            this.once("close", () => {
              cb(new Error("The server is not running"));
            });
          }
          process.nextTick(emitClose, this);
          return;
        }
        if (cb) this.once("close", cb);
        if (this._state === CLOSING) return;
        this._state = CLOSING;
        if (this.options.noServer || this.options.server) {
          if (this._server) {
            this._removeListeners();
            this._removeListeners = this._server = null;
          }
          if (this.clients) {
            if (!this.clients.size) {
              process.nextTick(emitClose, this);
            } else {
              this._shouldEmitClose = true;
            }
          } else {
            process.nextTick(emitClose, this);
          }
        } else {
          const server = this._server;
          this._removeListeners();
          this._removeListeners = this._server = null;
          server.close(() => {
            emitClose(this);
          });
        }
      }
      /**
       * See if a given request should be handled by this server instance.
       *
       * @param {http.IncomingMessage} req Request object to inspect
       * @return {Boolean} `true` if the request is valid, else `false`
       * @public
       */
      shouldHandle(req) {
        if (this.options.path) {
          const index = req.url.indexOf("?");
          const pathname = index !== -1 ? req.url.slice(0, index) : req.url;
          if (pathname !== this.options.path) return false;
        }
        return true;
      }
      /**
       * Handle a HTTP Upgrade request.
       *
       * @param {http.IncomingMessage} req The request object
       * @param {Duplex} socket The network socket between the server and client
       * @param {Buffer} head The first packet of the upgraded stream
       * @param {Function} cb Callback
       * @public
       */
      handleUpgrade(req, socket, head, cb) {
        socket.on("error", socketOnError);
        const key = req.headers["sec-websocket-key"];
        const upgrade = req.headers.upgrade;
        const version = +req.headers["sec-websocket-version"];
        if (req.method !== "GET") {
          const message = "Invalid HTTP method";
          abortHandshakeOrEmitwsClientError(this, req, socket, 405, message);
          return;
        }
        if (upgrade === void 0 || upgrade.toLowerCase() !== "websocket") {
          const message = "Invalid Upgrade header";
          abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
          return;
        }
        if (key === void 0 || !keyRegex.test(key)) {
          const message = "Missing or invalid Sec-WebSocket-Key header";
          abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
          return;
        }
        if (version !== 13 && version !== 8) {
          const message = "Missing or invalid Sec-WebSocket-Version header";
          abortHandshakeOrEmitwsClientError(this, req, socket, 400, message, {
            "Sec-WebSocket-Version": "13, 8"
          });
          return;
        }
        if (!this.shouldHandle(req)) {
          abortHandshake(socket, 400);
          return;
        }
        const secWebSocketProtocol = req.headers["sec-websocket-protocol"];
        let protocols = /* @__PURE__ */ new Set();
        if (secWebSocketProtocol !== void 0) {
          try {
            protocols = subprotocol2.parse(secWebSocketProtocol);
          } catch (err) {
            const message = "Invalid Sec-WebSocket-Protocol header";
            abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
            return;
          }
        }
        const secWebSocketExtensions = req.headers["sec-websocket-extensions"];
        const extensions = {};
        if (this.options.perMessageDeflate && secWebSocketExtensions !== void 0) {
          const perMessageDeflate = new PerMessageDeflate2({
            ...this.options.perMessageDeflate,
            isServer: true,
            maxPayload: this.options.maxPayload
          });
          try {
            const offers = extension2.parse(secWebSocketExtensions);
            if (offers[PerMessageDeflate2.extensionName]) {
              perMessageDeflate.accept(offers[PerMessageDeflate2.extensionName]);
              extensions[PerMessageDeflate2.extensionName] = perMessageDeflate;
            }
          } catch (err) {
            const message = "Invalid or unacceptable Sec-WebSocket-Extensions header";
            abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
            return;
          }
        }
        if (this.options.verifyClient) {
          const info = {
            origin: req.headers[`${version === 8 ? "sec-websocket-origin" : "origin"}`],
            secure: !!(req.socket.authorized || req.socket.encrypted),
            req
          };
          if (this.options.verifyClient.length === 2) {
            this.options.verifyClient(info, (verified, code, message, headers) => {
              if (!verified) {
                return abortHandshake(socket, code || 401, message, headers);
              }
              this.completeUpgrade(
                extensions,
                key,
                protocols,
                req,
                socket,
                head,
                cb
              );
            });
            return;
          }
          if (!this.options.verifyClient(info)) return abortHandshake(socket, 401);
        }
        this.completeUpgrade(extensions, key, protocols, req, socket, head, cb);
      }
      /**
       * Upgrade the connection to WebSocket.
       *
       * @param {Object} extensions The accepted extensions
       * @param {String} key The value of the `Sec-WebSocket-Key` header
       * @param {Set} protocols The subprotocols
       * @param {http.IncomingMessage} req The request object
       * @param {Duplex} socket The network socket between the server and client
       * @param {Buffer} head The first packet of the upgraded stream
       * @param {Function} cb Callback
       * @throws {Error} If called more than once with the same socket
       * @private
       */
      completeUpgrade(extensions, key, protocols, req, socket, head, cb) {
        if (!socket.readable || !socket.writable) return socket.destroy();
        if (socket[kWebSocket]) {
          throw new Error(
            "server.handleUpgrade() was called more than once with the same socket, possibly due to a misconfiguration"
          );
        }
        if (this._state > RUNNING) return abortHandshake(socket, 503);
        const digest = createHash("sha1").update(key + GUID).digest("base64");
        const headers = [
          "HTTP/1.1 101 Switching Protocols",
          "Upgrade: websocket",
          "Connection: Upgrade",
          `Sec-WebSocket-Accept: ${digest}`
        ];
        const ws = new this.options.WebSocket(null, void 0, this.options);
        if (protocols.size) {
          const protocol = this.options.handleProtocols ? this.options.handleProtocols(protocols, req) : protocols.values().next().value;
          if (protocol) {
            headers.push(`Sec-WebSocket-Protocol: ${protocol}`);
            ws._protocol = protocol;
          }
        }
        if (extensions[PerMessageDeflate2.extensionName]) {
          const params = extensions[PerMessageDeflate2.extensionName].params;
          const value = extension2.format({
            [PerMessageDeflate2.extensionName]: [params]
          });
          headers.push(`Sec-WebSocket-Extensions: ${value}`);
          ws._extensions = extensions;
        }
        this.emit("headers", headers, req);
        socket.write(headers.concat("\r\n").join("\r\n"));
        socket.removeListener("error", socketOnError);
        ws.setSocket(socket, head, {
          allowSynchronousEvents: this.options.allowSynchronousEvents,
          maxBufferedChunks: this.options.maxBufferedChunks,
          maxFragments: this.options.maxFragments,
          maxPayload: this.options.maxPayload,
          skipUTF8Validation: this.options.skipUTF8Validation
        });
        if (this.clients) {
          this.clients.add(ws);
          ws.on("close", () => {
            this.clients.delete(ws);
            if (this._shouldEmitClose && !this.clients.size) {
              process.nextTick(emitClose, this);
            }
          });
        }
        cb(ws, req);
      }
    };
    module.exports = WebSocketServer2;
    function addListeners(server, map) {
      for (const event of Object.keys(map)) server.on(event, map[event]);
      return function removeListeners() {
        for (const event of Object.keys(map)) {
          server.removeListener(event, map[event]);
        }
      };
    }
    function emitClose(server) {
      server._state = CLOSED;
      server.emit("close");
    }
    function socketOnError() {
      this.destroy();
    }
    function abortHandshake(socket, code, message, headers) {
      message = message || http2.STATUS_CODES[code];
      headers = {
        Connection: "close",
        "Content-Type": "text/html",
        "Content-Length": Buffer.byteLength(message),
        ...headers
      };
      socket.once("finish", socket.destroy);
      socket.end(
        `HTTP/1.1 ${code} ${http2.STATUS_CODES[code]}\r
` + Object.keys(headers).map((h) => `${h}: ${headers[h]}`).join("\r\n") + "\r\n\r\n" + message
      );
    }
    function abortHandshakeOrEmitwsClientError(server, req, socket, code, message, headers) {
      if (server.listenerCount("wsClientError")) {
        const err = new Error(message);
        Error.captureStackTrace(err, abortHandshakeOrEmitwsClientError);
        server.emit("wsClientError", err, socket, req);
      } else {
        abortHandshake(socket, code, message, headers);
      }
    }
  }
});

// gameplay/server/src/gameplay-server.mjs
import http from "node:http";
import fs from "node:fs";
import path2 from "node:path";
import crypto from "node:crypto";
import { fileURLToPath as fileURLToPath2, pathToFileURL } from "node:url";

// gameplay/node_modules/ws/wrapper.mjs
var import_stream = __toESM(require_stream(), 1);
var import_extension = __toESM(require_extension(), 1);
var import_permessage_deflate = __toESM(require_permessage_deflate(), 1);
var import_receiver = __toESM(require_receiver(), 1);
var import_sender = __toESM(require_sender(), 1);
var import_subprotocol = __toESM(require_subprotocol(), 1);
var import_websocket = __toESM(require_websocket(), 1);
var import_websocket_server = __toESM(require_websocket_server(), 1);

// gameplay/server/src/msgpack.mjs
function pack(v) {
  const parts = [];
  walk(v, parts);
  return Buffer.concat(parts);
}
function walk(v, parts) {
  if (v === null || v === void 0) parts.push(Buffer.from([192]));
  else if (typeof v === "boolean") parts.push(Buffer.from([v ? 195 : 194]));
  else if (typeof v === "string") {
    const b = Buffer.from(v, "utf8");
    const h = [];
    if (b.length < 32) h.push(160 | b.length);
    else if (b.length < 256) h.push(217, b.length);
    else if (b.length < 65536) h.push(218, b.length >> 8, b.length & 255);
    else h.push(219, b.length >>> 24 & 255, b.length >>> 16 & 255, b.length >>> 8 & 255, b.length & 255);
    parts.push(Buffer.from(h), b);
  } else if (typeof v === "number") {
    if (Number.isInteger(v) && v >= 0 && v < 128) parts.push(Buffer.from([v]));
    else if (Number.isInteger(v) && v < 0 && v >= -32) parts.push(Buffer.from([256 + v]));
    else if (Number.isInteger(v) && v >= 0 && v < 256) parts.push(Buffer.from([204, v]));
    else if (Number.isInteger(v) && v >= 0 && v < 65536) parts.push(Buffer.from([205, v >> 8, v & 255]));
    else if (Number.isInteger(v) && v >= 0) parts.push(Buffer.from([206, v >>> 24 & 255, v >>> 16 & 255, v >>> 8 & 255, v & 255]));
    else {
      const b = Buffer.alloc(8);
      b.writeDoubleBE(v);
      parts.push(Buffer.from([203]), b);
    }
  } else if (Array.isArray(v)) {
    const h = [];
    if (v.length < 16) h.push(144 | v.length);
    else if (v.length < 65536) h.push(220, v.length >> 8, v.length & 255);
    else h.push(221, v.length >>> 24 & 255, v.length >>> 16 & 255, v.length >>> 8 & 255, v.length & 255);
    parts.push(Buffer.from(h));
    for (const item of v) walk(item, parts);
  } else if (typeof v === "object") {
    const keys = Object.keys(v);
    const h = [];
    if (keys.length < 16) h.push(128 | keys.length);
    else if (keys.length < 65536) h.push(222, keys.length >> 8, keys.length & 255);
    else h.push(223, keys.length >>> 24 & 255, keys.length >>> 16 & 255, keys.length >>> 8 & 255, keys.length & 255);
    parts.push(Buffer.from(h));
    for (const k of keys) {
      walk(k, parts);
      walk(v[k], parts);
    }
  }
}
function unpack(buf, offset = 0) {
  const o = { p: offset };
  const value = read(buf, o);
  return { value, offset: o.p };
}
function read(buf, o) {
  const b = buf[o.p];
  if (b === void 0) throw new Error("eof");
  o.p += 1;
  if (b < 128) return b;
  if (b >= 224) return b - 256;
  if (b >= 160 && b < 192) return readStr(buf, o, b & 31);
  if (b >= 144 && b < 160) return readArr(buf, o, b & 15);
  if (b >= 128 && b < 144) return readMap(buf, o, b & 15);
  switch (b) {
    case 192:
      return null;
    case 194:
      return false;
    case 195:
      return true;
    case 204:
      return buf[o.p++];
    case 205: {
      const v = buf.readUInt16BE(o.p);
      o.p += 2;
      return v;
    }
    case 206: {
      const v = buf.readUInt32BE(o.p);
      o.p += 4;
      return v;
    }
    case 208: {
      const v = buf.readInt8(o.p);
      o.p += 1;
      return v;
    }
    case 209: {
      const v = buf.readInt16BE(o.p);
      o.p += 2;
      return v;
    }
    case 210: {
      const v = buf.readInt32BE(o.p);
      o.p += 4;
      return v;
    }
    case 202: {
      const v = buf.readFloatBE(o.p);
      o.p += 4;
      return v;
    }
    case 203: {
      const v = buf.readDoubleBE(o.p);
      o.p += 8;
      return v;
    }
    case 217: {
      const n = buf[o.p++];
      return readStr(buf, o, n);
    }
    case 218: {
      const n = buf.readUInt16BE(o.p);
      o.p += 2;
      return readStr(buf, o, n);
    }
    case 219: {
      const n = buf.readUInt32BE(o.p);
      o.p += 4;
      return readStr(buf, o, n);
    }
    case 220: {
      const n = buf.readUInt16BE(o.p);
      o.p += 2;
      return readArr(buf, o, n);
    }
    case 221: {
      const n = buf.readUInt32BE(o.p);
      o.p += 4;
      return readArr(buf, o, n);
    }
    case 222: {
      const n = buf.readUInt16BE(o.p);
      o.p += 2;
      return readMap(buf, o, n);
    }
    case 223: {
      const n = buf.readUInt32BE(o.p);
      o.p += 4;
      return readMap(buf, o, n);
    }
    default:
      throw new Error("unsupported 0x" + b.toString(16));
  }
}
function readStr(buf, o, n) {
  const v = buf.slice(o.p, o.p + n).toString("utf8");
  o.p += n;
  return v;
}
function readArr(buf, o, n) {
  const arr = [];
  for (let i = 0; i < n; i++) arr.push(read(buf, o));
  return arr;
}
function readMap(buf, o, n) {
  const m = {};
  for (let i = 0; i < n; i++) {
    const k = read(buf, o);
    m[k] = read(buf, o);
  }
  return m;
}

// gameplay/packages/protocol/index.mjs
import path from "node:path";
import { fileURLToPath } from "node:url";
var __dirname = path.dirname(fileURLToPath(import.meta.url));
var SCHEMA_PATH = path.join(__dirname, "schema.json");
var TYPE_BYTES = {
  Uint8: 1,
  Int8: 1,
  Uint16: 2,
  Int16: 2,
  Float32: 4,
  Uint32: 4,
  Float64: 8
};
var GETTERS = {
  Uint8: "getUint8",
  Int8: "getInt8",
  Uint16: "getUint16",
  Int16: "getInt16",
  Float32: "getFloat32",
  Uint32: "getUint32",
  Float64: "getFloat64"
};
var SETTERS = {
  Uint8: "setUint8",
  Int8: "setInt8",
  Uint16: "setUint16",
  Int16: "setInt16",
  Float32: "setFloat32",
  Uint32: "setUint32",
  Float64: "setFloat64"
};
var schema = null;
var MESSAGES = { byId: /* @__PURE__ */ new Map(), byName: /* @__PURE__ */ new Map(), nameToId: /* @__PURE__ */ new Map(), idToName: /* @__PURE__ */ new Map() };
function loadSchema() {
  if (schema) return schema;
  const text = '{\n  "version": 1,\n  "messages": [\n    {\n      "msgId": 1,\n      "name": "FRF6r51VY32",\n      "fields": [\n        {\n          "name": "val",\n          "type": "Uint16"\n        },\n        {\n          "name": "x",\n          "type": "Uint8"\n        },\n        {\n          "name": "y",\n          "type": "Uint8"\n        },\n        {\n          "name": "rBEdfQOuYkz",\n          "type": "Uint8"\n        }\n      ],\n      "hasString": false\n    },\n    {\n      "msgId": 2,\n      "name": "K11Co2hvi1l",\n      "fields": [\n        {\n          "name": "tdkZouYda",\n          "type": "Uint8"\n        },\n        {\n          "name": "JoHdvmpcMvL",\n          "type": "Float32"\n        },\n        {\n          "name": "uBHZYKAHa",\n          "type": "Float32"\n        },\n        {\n          "name": "yxEKoSFAg",\n          "type": "Float32"\n        },\n        {\n          "name": "TCHdFFAXmk",\n          "type": "Uint8"\n        },\n        {\n          "name": "ibyXzJIMNf",\n          "type": "Uint8"\n        },\n        {\n          "name": "YSmEAVINAh",\n          "type": "Uint16"\n        },\n        {\n          "name": "wGiOzKcGlnH",\n          "type": "Uint8"\n        },\n        {\n          "name": "hkhrYayXI",\n          "type": "Uint8"\n        },\n        {\n          "name": "qXuHmlbSlxE",\n          "type": "Uint8"\n        }\n      ],\n      "hasString": false\n    },\n    {\n      "msgId": 3,\n      "name": "v3j2TU68H",\n      "fields": [\n        {\n          "name": "tdkZouYda",\n          "type": "Uint8"\n        }\n      ],\n      "hasString": false\n    },\n    {\n      "msgId": 4,\n      "name": "Ko38N6873G6",\n      "fields": [\n        {\n          "name": "cKRwdjkqGai",\n          "type": "Uint8"\n        }\n      ],\n      "hasString": false\n    },\n    {\n      "msgId": 5,\n      "name": "pi7M701p0",\n      "fields": [\n        {\n          "name": "cKRwdjkqGai",\n          "type": "Uint8"\n        }\n      ],\n      "hasString": false\n    },\n    {\n      "msgId": 6,\n      "name": "qv8j93zAL",\n      "fields": [\n        {\n          "name": "cKRwdjkqGai",\n          "type": "Uint8"\n        }\n      ],\n      "hasString": false\n    },\n    {\n      "msgId": 7,\n      "name": "N27s83WCNi",\n      "fields": [\n        {\n          "name": "tdkZouYda",\n          "type": "Uint8"\n        }\n      ],\n      "hasString": false\n    },\n    {\n      "msgId": 8,\n      "name": "e479Jk50P",\n      "fields": [\n        {\n          "name": "pMwSuGipfE",\n          "type": "Float32"\n        },\n        {\n          "name": "VqpNEuOqqCX",\n          "type": "Float32"\n        },\n        {\n          "name": "JoHdvmpcMvL",\n          "type": "Float64"\n        },\n        {\n          "name": "uBHZYKAHa",\n          "type": "Float64"\n        },\n        {\n          "name": "AHPhtLFTi",\n          "type": "Float64"\n        },\n        {\n          "name": "mGOwFesuTt",\n          "type": "Float64"\n        },\n        {\n          "name": "MHnEcbTxpbz",\n          "type": "Float64"\n        }\n      ],\n      "hasString": false\n    },\n    {\n      "msgId": 9,\n      "name": "vS66uPxac49",\n      "fields": [\n        {\n          "name": "JoHdvmpcMvL",\n          "type": "Float32"\n        },\n        {\n          "name": "uBHZYKAHa",\n          "type": "Float32"\n        },\n        {\n          "name": "yxEKoSFAg",\n          "type": "Float32"\n        },\n        {\n          "name": "AHPhtLFTi",\n          "type": "Int8"\n        },\n        {\n          "name": "mGOwFesuTt",\n          "type": "Int8"\n        },\n        {\n          "name": "MHnEcbTxpbz",\n          "type": "Int8"\n        },\n        {\n          "name": "tdkZouYda",\n          "type": "Uint8"\n        }\n      ],\n      "hasString": false\n    },\n    {\n      "msgId": 10,\n      "name": "a693b13D91R",\n      "fields": [\n        {\n          "name": "tdkZouYda",\n          "type": "Uint8"\n        },\n        {\n          "name": "uBHZYKAHa",\n          "type": "Float32"\n        },\n        {\n          "name": "MfCOcfVUx",\n          "type": "Uint8"\n        }\n      ],\n      "hasString": false\n    },\n    {\n      "msgId": 11,\n      "name": "T1P0J19B02U",\n      "fields": [],\n      "hasString": false\n    },\n    {\n      "msgId": 12,\n      "name": "zSf6vw9ka",\n      "fields": [\n        {\n          "name": "nwQWcPQjr",\n          "type": "Uint32"\n        }\n      ],\n      "hasString": false\n    },\n    {\n      "msgId": 13,\n      "name": "ZpZC792j9p3",\n      "fields": [\n        {\n          "name": "lDKzyZxhKX",\n          "type": "Uint8"\n        },\n        {\n          "name": "wtZUXNpiCWl",\n          "type": "Uint8"\n        },\n        {\n          "name": "JoHdvmpcMvL",\n          "type": "Float32"\n        },\n        {\n          "name": "uBHZYKAHa",\n          "type": "Float32"\n        },\n        {\n          "name": "yxEKoSFAg",\n          "type": "Float32"\n        }\n      ],\n      "hasString": false\n    },\n    {\n      "msgId": 14,\n      "name": "Qff01B5g53u",\n      "fields": [],\n      "hasString": false\n    },\n    {\n      "msgId": 15,\n      "name": "w0G4550593",\n      "fields": [],\n      "hasString": false\n    },\n    {\n      "msgId": 16,\n      "name": "bWEt7LWg79Z",\n      "fields": [\n        {\n          "name": "identifier",\n          "type": "Uint8"\n        }\n      ],\n      "hasString": false\n    },\n    {\n      "msgId": 17,\n      "name": "fm80f18li7",\n      "fields": [\n        {\n          "name": "x",\n          "type": "Uint8"\n        },\n        {\n          "name": "y",\n          "type": "Uint8"\n        }\n      ],\n      "hasString": false\n    },\n    {\n      "msgId": 18,\n      "name": "UQbfX64829p",\n      "fields": [\n        {\n          "name": "loEhMkBVEme",\n          "type": "Uint8"\n        },\n        {\n          "name": "JoHdvmpcMvL",\n          "type": "Float32"\n        },\n        {\n          "name": "uBHZYKAHa",\n          "type": "Float32"\n        },\n        {\n          "name": "yxEKoSFAg",\n          "type": "Float32"\n        },\n        {\n          "name": "zjSptXbZfA",\n          "type": "Float32"\n        },\n        {\n          "name": "QoYwfvDUd",\n          "type": "Float32"\n        },\n        {\n          "name": "ULHoUFJiqo",\n          "type": "Float32"\n        },\n        {\n          "name": "BMflnUjRv",\n          "type": "Float32"\n        },\n        {\n          "name": "pTWaJQCQIlk",\n          "type": "Float32"\n        },\n        {\n          "name": "KUkUYkavzt",\n          "type": "Float32"\n        },\n        {\n          "name": "bdyycxmjR",\n          "type": "Float32"\n        },\n        {\n          "name": "gPEUHGwIpHk",\n          "type": "Float32"\n        },\n        {\n          "name": "GDSucbCLAxr",\n          "type": "Float32"\n        },\n        {\n          "name": "a",\n          "type": "Uint8"\n        },\n        {\n          "name": "stl",\n          "type": "Uint8"\n        },\n        {\n          "name": "sc",\n          "type": "Uint8"\n        },\n        {\n          "name": "sd",\n          "type": "Uint16"\n        },\n        {\n          "name": "rt",\n          "type": "Uint8"\n        },\n        {\n          "name": "tog",\n          "type": "Uint8"\n        },\n        {\n          "name": "la",\n          "type": "Float32"\n        },\n        {\n          "name": "ja",\n          "type": "Float32"\n        },\n        {\n          "name": "sp",\n          "type": "Float32"\n        },\n        {\n          "name": "AUBAkIWQqEk",\n          "type": "Uint16"\n        }\n      ],\n      "hasString": false\n    },\n    {\n      "msgId": 19,\n      "name": "ld52k5uY7",\n      "fields": [\n        {\n          "name": "time",\n          "type": "Uint16"\n        }\n      ],\n      "hasString": false\n    },\n    {\n      "msgId": 20,\n      "name": "gB4Cncy3f4",\n      "fields": [\n        {\n          "name": "id",\n          "type": "Uint8"\n        },\n        {\n          "name": "h",\n          "type": "Uint8"\n        }\n      ],\n      "hasString": false\n    },\n    {\n      "msgId": 21,\n      "name": "B20L372s8",\n      "fields": [\n        {\n          "name": "v",\n          "type": "Uint8"\n        },\n        {\n          "name": "eXABYtRfN",\n          "type": "Uint8"\n        }\n      ],\n      "hasString": false\n    },\n    {\n      "msgId": 22,\n      "name": "k1Qu903595",\n      "fields": [\n        {\n          "name": "id",\n          "type": "Uint8"\n        },\n        {\n          "name": "type",\n          "type": "Uint8"\n        }\n      ],\n      "hasString": false\n    },\n    {\n      "msgId": 23,\n      "name": "G058FYe8B9",\n      "fields": [\n        {\n          "name": "tdkZouYda",\n          "type": "Uint8"\n        },\n        {\n          "name": "ldBboSufaY",\n          "type": "Uint8"\n        },\n        {\n          "name": "fRcMMMfSas",\n          "type": "Uint8"\n        },\n        {\n          "name": "jatzJSfdtNy",\n          "type": "Uint16"\n        }\n      ],\n      "hasString": false\n    },\n    {\n      "msgId": 24,\n      "name": "RMFVb5UZGi7",\n      "fields": [\n        {\n          "name": "id",\n          "type": "Uint8"\n        },\n        {\n          "name": "points",\n          "type": "Uint16"\n        },\n        {\n          "name": "k",\n          "type": "Uint8"\n        },\n        {\n          "name": "d",\n          "type": "Uint8"\n        },\n        {\n          "name": "h",\n          "type": "Uint8"\n        },\n        {\n          "name": "p",\n          "type": "Uint16"\n        },\n        {\n          "name": "c",\n          "type": "Uint16"\n        },\n        {\n          "name": "hsp",\n          "type": "Uint8"\n        },\n        {\n          "name": "PhbhpxFxPP",\n          "type": "Uint8"\n        },\n        {\n          "name": "ha",\n          "type": "Uint8"\n        },\n        {\n          "name": "JgVHFEBAE",\n          "type": "Uint8"\n        },\n        {\n          "name": "TxJblhJNah",\n          "type": "Uint8"\n        },\n        {\n          "name": "aMWaisFtZ",\n          "type": "Uint8"\n        }\n      ],\n      "hasString": false\n    },\n    {\n      "msgId": 25,\n      "name": "Y6805DB31Br",\n      "fields": [\n        {\n          "name": "WJxrwBXgp",\n          "type": "Uint8"\n        },\n        {\n          "name": "cRzBBcbLPR",\n          "type": "Uint8"\n        },\n        {\n          "name": "PacKJQHkQ",\n          "type": "Uint8"\n        },\n        {\n          "name": "KiQwnWACHo",\n          "type": "Uint8"\n        }\n      ],\n      "hasString": false\n    },\n    {\n      "msgId": 26,\n      "name": "E76e9L140",\n      "fields": [\n        {\n          "name": "rjVasvUkpY",\n          "type": "Uint8"\n        },\n        {\n          "name": "playerCount",\n          "type": "Uint8"\n        }\n      ],\n      "hasString": false\n    },\n    {\n      "msgId": 27,\n      "name": "wM86olr40",\n      "fields": [\n        {\n          "name": "id",\n          "type": "Uint8"\n        },\n        {\n          "name": "place",\n          "type": "Uint8"\n        },\n        {\n          "name": "points",\n          "type": "Uint16"\n        },\n        {\n          "name": "YlyjPgZsW",\n          "type": "Uint8"\n        },\n        {\n          "name": "qKOctHozRiE",\n          "type": "Uint8"\n        },\n        {\n          "name": "hsp",\n          "type": "Uint8"\n        }\n      ],\n      "hasString": false\n    },\n    {\n      "msgId": 28,\n      "name": "D522Kq7l5n",\n      "fields": [],\n      "hasString": false\n    },\n    {\n      "msgId": 29,\n      "name": "GDzF2709XA3",\n      "fields": [],\n      "hasString": false\n    },\n    {\n      "msgId": 30,\n      "name": "o746s7cvb9",\n      "fields": [\n        {\n          "name": "val",\n          "type": "Uint32"\n        },\n        {\n          "name": "lpm",\n          "type": "Int8"\n        },\n        {\n          "name": "priv",\n          "type": "Int8"\n        },\n        {\n          "name": "pmap",\n          "type": "Int8"\n        },\n        {\n          "name": "ituyDAEpKW",\n          "type": "Int8"\n        },\n        {\n          "name": "PSPGZlgWAcZ",\n          "type": "Int8"\n        },\n        {\n          "name": "YsgdCDVtFmu",\n          "type": "Int8"\n        },\n        {\n          "name": "zqEWySNDO",\n          "type": "Uint32"\n        }\n      ],\n      "hasString": true\n    },\n    {\n      "msgId": 31,\n      "name": "ib9T000831",\n      "fields": [\n        {\n          "name": "id",\n          "type": "Uint8"\n        },\n        {\n          "name": "h",\n          "type": "Uint8"\n        },\n        {\n          "name": "arw",\n          "type": "Uint8"\n        }\n      ],\n      "hasString": false\n    },\n    {\n      "msgId": 32,\n      "name": "a0fN31N7p",\n      "fields": [\n        {\n          "name": "h",\n          "type": "Uint8"\n        }\n      ],\n      "hasString": false\n    },\n    {\n      "msgId": 33,\n      "name": "a22SWM3PvBo",\n      "fields": [\n        {\n          "name": "h",\n          "type": "Uint8"\n        },\n        {\n          "name": "lm",\n          "type": "Uint8"\n        }\n      ],\n      "hasString": false\n    },\n    {\n      "msgId": 34,\n      "name": "y6ImBq587",\n      "fields": [\n        {\n          "name": "ef",\n          "type": "Int8"\n        },\n        {\n          "name": "t",\n          "type": "Uint8"\n        }\n      ],\n      "hasString": false\n    },\n    {\n      "msgId": 35,\n      "name": "hJUJ7cbd51b",\n      "fields": [],\n      "hasString": true\n    },\n    {\n      "msgId": 36,\n      "name": "N3OM6i9r83",\n      "fields": [\n        {\n          "name": "id",\n          "type": "Uint8"\n        },\n        {\n          "name": "fXfKmXLLuf",\n          "type": "Uint8"\n        },\n        {\n          "name": "DVhVGRcxjKL",\n          "type": "Uint8"\n        }\n      ],\n      "hasString": false\n    },\n    {\n      "msgId": 37,\n      "name": "M35Oru2OB05",\n      "fields": [\n        {\n          "name": "val",\n          "type": "Uint32"\n        }\n      ],\n      "hasString": false\n    },\n    {\n      "msgId": 38,\n      "name": "HnR00HyK9",\n      "fields": [],\n      "hasString": false\n    },\n    {\n      "msgId": 39,\n      "name": "qD6M1FU5HDG",\n      "fields": [\n        {\n          "name": "t",\n          "type": "Uint8"\n        }\n      ],\n      "hasString": false\n    },\n    {\n      "msgId": 40,\n      "name": "kM86hVW024",\n      "fields": [\n        {\n          "name": "id",\n          "type": "Int8"\n        }\n      ],\n      "hasString": true\n    },\n    {\n      "msgId": 41,\n      "name": "u53y86O84",\n      "fields": [],\n      "hasString": false\n    },\n    {\n      "msgId": 42,\n      "name": "P2F7KG88n96",\n      "fields": [\n        {\n          "name": "a",\n          "type": "Uint16"\n        },\n        {\n          "name": "b",\n          "type": "Uint16"\n        }\n      ],\n      "hasString": false\n    },\n    {\n      "msgId": 43,\n      "name": "j00e7mAiju",\n      "fields": [\n        {\n          "name": "id",\n          "type": "Uint8"\n        },\n        {\n          "name": "rank",\n          "type": "Float32"\n        }\n      ],\n      "hasString": true\n    },\n    {\n      "msgId": 44,\n      "name": "F29o2i138",\n      "fields": [\n        {\n          "name": "id",\n          "type": "Uint8"\n        }\n      ],\n      "hasString": true\n    },\n    {\n      "msgId": 45,\n      "name": "o4KI8bGucLS",\n      "fields": [\n        {\n          "name": "xJXXoGTVwzq",\n          "type": "Int8"\n        },\n        {\n          "name": "CwlkAKnpe",\n          "type": "Int8"\n        },\n        {\n          "name": "JPLyTVkUrDj",\n          "type": "Int8"\n        },\n        {\n          "name": "ciJOoINuc",\n          "type": "Uint8"\n        }\n      ],\n      "hasString": false\n    },\n    {\n      "msgId": 46,\n      "name": "ZZ8oY11K5w3",\n      "fields": [\n        {\n          "name": "xJXXoGTVwzq",\n          "type": "Int8"\n        },\n        {\n          "name": "JoHdvmpcMvL",\n          "type": "Float32"\n        },\n        {\n          "name": "uBHZYKAHa",\n          "type": "Float32"\n        },\n        {\n          "name": "yxEKoSFAg",\n          "type": "Float32"\n        }\n      ],\n      "hasString": false\n    },\n    {\n      "msgId": 47,\n      "name": "WS9I2CWxC",\n      "fields": [\n        {\n          "name": "t",\n          "type": "Uint8"\n        }\n      ],\n      "hasString": false\n    },\n    {\n      "msgId": 48,\n      "name": "oR7qa621M3",\n      "fields": [\n        {\n          "name": "t",\n          "type": "Uint8"\n        }\n      ],\n      "hasString": true\n    },\n    {\n      "msgId": 49,\n      "name": "sg2iJ8O0Wo3",\n      "fields": [],\n      "hasString": true\n    },\n    {\n      "msgId": 50,\n      "name": "As4018m1W2",\n      "fields": [\n        {\n          "name": "pt",\n          "type": "Int8"\n        }\n      ],\n      "hasString": false\n    },\n    {\n      "msgId": 51,\n      "name": "zg46q42g45r",\n      "fields": [\n        {\n          "name": "y",\n          "type": "Uint8"\n        }\n      ],\n      "hasString": false\n    },\n    {\n      "msgId": 52,\n      "name": "BVaxA5RXAZ",\n      "fields": [\n        {\n          "name": "x",\n          "type": "Float32"\n        },\n        {\n          "name": "y",\n          "type": "Float32"\n        },\n        {\n          "name": "z",\n          "type": "Float32"\n        }\n      ],\n      "hasString": false\n    },\n    {\n      "msgId": 53,\n      "name": "q25mJt4Cd",\n      "fields": [],\n      "hasString": false\n    },\n    {\n      "msgId": 54,\n      "name": "p8f1mAv99",\n      "fields": [\n        {\n          "name": "a",\n          "type": "Uint8"\n        }\n      ],\n      "hasString": false\n    },\n    {\n      "msgId": 55,\n      "name": "t05nDaZZ6",\n      "fields": [\n        {\n          "name": "FBFOTIucqfz",\n          "type": "Float32"\n        },\n        {\n          "name": "k",\n          "type": "Uint16"\n        },\n        {\n          "name": "d",\n          "type": "Uint16"\n        }\n      ],\n      "hasString": false\n    },\n    {\n      "msgId": 56,\n      "name": "COCjGf0Sf",\n      "fields": [],\n      "hasString": true\n    },\n    {\n      "msgId": 57,\n      "name": "O4s303G144",\n      "fields": [\n        {\n          "name": "sgr",\n          "type": "Float32"\n        },\n        {\n          "name": "rank",\n          "type": "Float32"\n        },\n        {\n          "name": "ranksgr",\n          "type": "Float32"\n        }\n      ],\n      "hasString": false\n    },\n    {\n      "msgId": 58,\n      "name": "nEf97272q4s",\n      "fields": [],\n      "hasString": false\n    },\n    {\n      "msgId": 59,\n      "name": "yEE39Vc650",\n      "fields": [\n        {\n          "name": "headshots",\n          "type": "Uint16"\n        },\n        {\n          "name": "points",\n          "type": "Uint16"\n        },\n        {\n          "name": "arKills",\n          "type": "Uint8"\n        },\n        {\n          "name": "sniperKills",\n          "type": "Uint8"\n        },\n        {\n          "name": "smgKills",\n          "type": "Uint8"\n        },\n        {\n          "name": "shotgunKills",\n          "type": "Uint8"\n        },\n        {\n          "name": "kills",\n          "type": "Uint8"\n        }\n      ],\n      "hasString": false\n    },\n    {\n      "msgId": 60,\n      "name": "F79la8l54",\n      "fields": [],\n      "hasString": true\n    },\n    {\n      "msgId": 61,\n      "name": "Xar7p83ajar",\n      "fields": [\n        {\n          "name": "m0",\n          "type": "Uint32"\n        },\n        {\n          "name": "m1",\n          "type": "Uint32"\n        },\n        {\n          "name": "a",\n          "type": "Uint32"\n        },\n        {\n          "name": "b",\n          "type": "Uint32"\n        },\n        {\n          "name": "c",\n          "type": "Uint32"\n        },\n        {\n          "name": "d",\n          "type": "Uint32"\n        }\n      ],\n      "hasString": false\n    },\n    {\n      "msgId": 62,\n      "name": "Ns010DV33",\n      "fields": [],\n      "hasString": false\n    },\n    {\n      "msgId": 63,\n      "name": "DBG_CLIENT_POS",\n      "fields": [\n        {\n          "name": "x",\n          "type": "Float32"\n        },\n        {\n          "name": "y",\n          "type": "Float32"\n        },\n        {\n          "name": "z",\n          "type": "Float32"\n        },\n        {\n          "name": "tick",\n          "type": "Uint8"\n        },\n        {\n          "name": "val",\n          "type": "Uint16"\n        },\n        {\n          "name": "yawB",\n          "type": "Uint8"\n        },\n        {\n          "name": "pitchB",\n          "type": "Uint8"\n        }\n      ],\n      "hasString": false\n    }\n  ]\n}';
  schema = JSON.parse(text);
  for (const m of schema.messages) {
    MESSAGES.byId.set(m.msgId, m);
    MESSAGES.byName.set(m.name, m);
    MESSAGES.nameToId.set(m.name, m.msgId);
    MESSAGES.idToName.set(m.msgId, m.name);
  }
  return schema;
}
function decode(buf) {
  loadSchema();
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const out = [];
  let off = 0;
  while (off + 2 <= buf.length) {
    const id = dv.getUint16(off, false);
    if (id === 0) break;
    const def = MESSAGES.byId.get(id);
    if (!def) break;
    off += 2;
    const fields = {};
    for (const f of def.fields) {
      if (off + TYPE_BYTES[f.type] > buf.length) return out;
      fields[f.name] = dv[GETTERS[f.type]](off, false);
      off += TYPE_BYTES[f.type];
    }
    let string;
    if (def.hasString) {
      if (off + 2 > buf.length) return out;
      const len = dv.getUint16(off, true);
      off += 2;
      if (off + len > buf.length) return out;
      let s = "";
      for (let i = 0; i < len; i++) {
        s += String.fromCharCode((dv.getUint8(off + i) + 128) % 256);
      }
      off += len;
      string = s;
    }
    out.push({ msgId: id, name: def.name, fields, string, offset: off });
  }
  return out;
}
function encode(name, obj) {
  loadSchema();
  const def = MESSAGES.byName.get(name);
  if (!def) throw new Error("encode: unknown message name " + name);
  const string = def.hasString ? obj.string || "" : "";
  let size = 2;
  for (const f of def.fields) size += TYPE_BYTES[f.type];
  if (def.hasString) size += 2 + string.length;
  const buf = Buffer.alloc(size);
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const fields = obj.fields || obj;
  let off = 0;
  dv.setUint16(off, def.msgId, false);
  off += 2;
  for (const f of def.fields) {
    const v = fields[f.name];
    dv[SETTERS[f.type]](off, v, false);
    off += TYPE_BYTES[f.type];
  }
  if (def.hasString) {
    dv.setUint16(off, string.length, true);
    off += 2;
    for (let i = 0; i < string.length; i++) {
      dv.setUint8(off + i, string.charCodeAt(i) + 128 & 255);
    }
  }
  return buf;
}
function fromWireB64(text) {
  return Buffer.from(text, "base64");
}

// gameplay/server/src/gloo-wall-manager.mjs
var GlooWallManager = class {
  constructor({
    baseHp = 100,
    radius = 2,
    height = 2.4,
    arcDegrees = 135,
    maxPerPlayer = 3,
    lifetimeMs = 3e4
  } = {}) {
    this.baseHp = baseHp;
    this.radius = radius;
    this.height = height;
    this.arc = arcDegrees * Math.PI / 180;
    this.maxPerPlayer = maxPerPlayer;
    this.lifetimeMs = lifetimeMs;
    this.walls = /* @__PURE__ */ new Map();
    this.nextId = 1;
  }
  spawnWall(ownerId, x, y, z, yaw, attachId = 0) {
    if (![x, y, z, yaw].every(Number.isFinite)) {
      return { wall: null, expired: null, attachId: attachId | 0 };
    }
    let expired = null;
    const playerWalls = [...this.walls.values()].filter((w) => w.ownerId === ownerId);
    if (playerWalls.length >= this.maxPerPlayer) {
      playerWalls.sort((a, b) => a.createdAt - b.createdAt);
      expired = playerWalls[0];
      this.walls.delete(expired.id);
    }
    const id = this.nextId++;
    const now = Date.now();
    const wall = {
      id,
      ownerId,
      x: Number(x) || 0,
      y: Number(y) || 0,
      z: Number(z) || 0,
      yaw: Number(yaw) || 0,
      attachId: attachId | 0,
      hp: this.baseHp,
      maxHp: this.baseHp,
      radius: this.radius,
      height: this.height,
      arc: this.arc,
      createdAt: now,
      expiresAt: now + this.lifetimeMs
    };
    this.walls.set(id, wall);
    return { wall, expired };
  }
  update(now = Date.now()) {
    const expiredList = [];
    for (const [id, wall] of this.walls.entries()) {
      if (wall.expiresAt <= now) {
        expiredList.push(wall);
        this.walls.delete(id);
      }
    }
    return expiredList;
  }
  clear() {
    this.walls.clear();
  }
  damage(wallId, dmg) {
    const wall = this.walls.get(wallId);
    if (!wall) return null;
    wall.hp = Math.max(0, wall.hp - dmg);
    const destroyed = wall.hp === 0;
    if (destroyed) {
      this.walls.delete(wallId);
    }
    return { wall, destroyed, remainingHp: wall.hp };
  }
  // Raycast against all active Gloo Walls
  // Returns closest hit { wall, dist: t, hitPoint: { x, y, z } } or null
  raycast(sx, sy, sz, dirX, dirY, dirZ, maxDist = 120) {
    let closest = null;
    let bestDist = maxDist;
    const hDirLenSq = dirX * dirX + dirZ * dirZ;
    if (hDirLenSq < 1e-6) return null;
    const maxX = 1.95;
    const surfaces = [0.94, 0.71, 0.48];
    for (const wall of this.walls.values()) {
      const dx = sx - wall.x, dz = sz - wall.z;
      const wallRad = 2.5;
      const distSq = dx * dx + dz * dz;
      if (distSq > (bestDist + wallRad) * (bestDist + wallRad)) continue;
      const dot = -(dx * dirX + dz * dirZ);
      if (dot < -wallRad) continue;
      const rotY = wall.yaw + Math.PI;
      const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
      const ls_x = dx * cosY - dz * sinY;
      const ls_z = dx * sinY + dz * cosY;
      const ls_y = sy - wall.y;
      const ld_x = dirX * cosY - dirZ * sinY;
      const ld_z = dirX * sinY + dirZ * cosY;
      const ld_y = dirY;
      const wallHeight = wall.height || 2.4;
      for (const z0 of surfaces) {
        const A = 0.27 * ld_x * ld_x;
        const B = ld_z + 0.54 * ls_x * ld_x;
        const C = ls_z - z0 + 0.27 * ls_x * ls_x;
        const ts = [];
        if (Math.abs(A) < 1e-6) {
          if (Math.abs(B) > 1e-6) {
            ts.push(-C / B);
          }
        } else {
          const disc = B * B - 4 * A * C;
          if (disc >= 0) {
            const sq = Math.sqrt(disc);
            ts.push((-B - sq) / (2 * A), (-B + sq) / (2 * A));
          }
        }
        for (const t of ts) {
          if (t > 0.05 && t < bestDist) {
            const hx_l = ls_x + t * ld_x;
            const hy_l = ls_y + t * ld_y;
            if (Math.abs(hx_l) <= maxX && hy_l >= -0.1 && hy_l <= wallHeight) {
              bestDist = t;
              closest = {
                wall,
                dist: t,
                hitPoint: {
                  x: sx + dirX * t,
                  y: sy + dirY * t,
                  z: sz + dirZ * t
                }
              };
            }
          }
        }
      }
      for (const sign of [-1, 1]) {
        const capX = sign * maxX;
        if (Math.abs(ld_x) > 1e-6) {
          const t = (capX - ls_x) / ld_x;
          if (t > 0.05 && t < bestDist) {
            const hz_l = ls_z + t * ld_z;
            const hy_l = ls_y + t * ld_y;
            const capZ = 0.71 - 0.27 * maxX * maxX;
            if (Math.abs(hz_l - capZ) <= 0.25 && hy_l >= -0.1 && hy_l <= wallHeight) {
              bestDist = t;
              closest = {
                wall,
                dist: t,
                hitPoint: {
                  x: sx + dirX * t,
                  y: sy + dirY * t,
                  z: sz + dirZ * t
                }
              };
            }
          }
        }
      }
    }
    return closest;
  }
};

// gameplay/server/src/gameplay-server.mjs
var __dirname2 = path2.dirname(fileURLToPath2(import.meta.url));
var ROOT = path2.join(__dirname2, "..", "..");
var LOG_FILE = (() => {
  try {
    const d = process.env.GP_CLIENT_DIR;
    if (!d) return null;
    const f = path2.join(path2.dirname(d), "server-debug.log");
    fs.writeFileSync(f, `--- log start ${(/* @__PURE__ */ new Date()).toISOString()} ---
`);
    return f;
  } catch {
    return null;
  }
})();
var log = (...a) => {
  const line = "[" + (/* @__PURE__ */ new Date()).toISOString().slice(11, 23) + "] " + a.join(" ");
  console.log(line);
  if (LOG_FILE) {
    try {
      if (fs.statSync(LOG_FILE).size < 8 * 1024 * 1024) fs.appendFileSync(LOG_FILE, line + "\n");
    } catch {
    }
  }
};
var SHIM_SRC = `// JS-only AES-256-GCM polyfill for SubtleCrypto, injected into the served
// page. Chrome only exposes crypto.subtle on SECURE contexts; over plain HTTP
// only http://127.0.0.1 / http://localhost qualify \u2014 LAN IPs don't. The game
// loader needs importKey("raw", 32B, AES-GCM) + decrypt({iv}, key, data) to
// unwrap final.pkg, so we provide a faithful shim (WebCrypto layout: tag is
// the last 16 bytes of the input).
(function () {
  if (typeof window === 'undefined') return;
  try {
    if (window.crypto && window.crypto.subtle) return; // native available
  } catch (e) { /* ignore */ }

  // ---------- AES-256 ----------
  function gmul(a, b) {
    var p = 0;
    for (var i = 0; i < 8; i++) {
      if (b & 1) p ^= a;
      var hi = a & 0x80;
      a = (a << 1) & 0xff;
      if (hi) a ^= 0x1b;
      b >>= 1;
    }
    return p;
  }
  var S = (function () {
    // multiplicative inverses via exponentiation (a^254 = a^-1)
    var inv = new Array(256);
    for (var i = 0; i < 256; i++) {
      var v = 1;
      var e = 254;
      var base = i;
      while (e > 0) {
        if (e & 1) v = gmul(v, base);
        base = gmul(base, base);
        e >>= 1;
      }
      inv[i] = v;
    }
    inv[0] = 0;
    var rotl = function (x, n) { return ((x << n) | (x >>> (8 - n))) & 0xff; };
    var sbox = new Array(256), rsbox = new Array(256);
    for (var j = 0; j < 256; j++) {
      var x = inv[j];
      var y = x ^ rotl(x, 1) ^ rotl(x, 2) ^ rotl(x, 3) ^ rotl(x, 4) ^ 0x63;
      sbox[j] = y;
      rsbox[y] = j;
    }
    return { sbox: sbox, rsbox: rsbox };
  })();
  var sbox = S.sbox, rsbox = S.rsbox;

  var RCON = [0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36];

  function keyExp(key) {
    var Nk = key.length / 4, Nr = Nk + 6;
    var w = [];
    for (var i = 0; i < Nk; i++) w.push([key[4*i], key[4*i+1], key[4*i+2], key[4*i+3]]);
    for (i = Nk; i < 4 * (Nr + 1); i++) {
      var t = w[i-1].slice();
      if (i % Nk === 0) {
        t = [sbox[t[1]], sbox[t[2]], sbox[t[3]], sbox[t[0]]];
        t[0] ^= RCON[i/Nk - 1];
      } else if (Nk > 6 && i % Nk === 4) {
        t = [sbox[t[0]], sbox[t[1]], sbox[t[2]], sbox[t[3]]];
      }
      var prev = w[i - Nk];
      w.push([prev[0]^t[0], prev[1]^t[1], prev[2]^t[2], prev[3]^t[3]]);
    }
    var rk = [];
    for (var r = 0; r <= Nr; r++) {
      var round = [];
      for (var c = 0; c < 4; c++) round.push(w[r * 4 + c].slice());
      rk.push(round);
    }
    return rk;
  }
  function xt(x) { return ((x << 1) ^ (x & 0x80 ? 0x1b : 0)) & 0xff; }
  function encryptBlock(keyBytes, inBytes) {
    var rk = keyExp(keyBytes);
    var Nr = rk.length - 1;
    var s = [];
    for (var r = 0; r < 4; r++) for (var c = 0; c < 4; c++) s[r * 4 + c] = inBytes[r + 4 * c];
    var add = function (round) { for (var rr = 0; rr < 4; rr++) for (var cc = 0; cc < 4; cc++) s[rr*4+cc] ^= rk[round][cc][rr]; };
    add(0);
    for (var round = 1; round < Nr; round++) {
      for (var r1 = 0; r1 < 4; r1++) for (var c1 = 0; c1 < 4; c1++) s[r1*4+c1] = sbox[s[r1*4+c1]];
      for (var r2 = 1; r2 < 4; r2++) {
        var row = [s[r2*4], s[r2*4+1], s[r2*4+2], s[r2*4+3]];
        for (var c2 = 0; c2 < 4; c2++) s[r2*4+c2] = row[(c2 + r2) % 4];
      }
      for (var c3 = 0; c3 < 4; c3++) {
        var a = [s[c3], s[4+c3], s[8+c3], s[12+c3]];
        s[c3] = xt(a[0]) ^ (a[1] ^ xt(a[1])) ^ a[2] ^ a[3];
        s[4+c3] = a[0] ^ xt(a[1]) ^ (a[2] ^ xt(a[2])) ^ a[3];
        s[8+c3] = a[0] ^ a[1] ^ xt(a[2]) ^ (a[3] ^ xt(a[3]));
        s[12+c3] = (a[0] ^ xt(a[0])) ^ a[1] ^ a[2] ^ xt(a[3]);
      }
      add(round);
    }
    for (var r3 = 0; r3 < 4; r3++) for (var c4 = 0; c4 < 4; c4++) s[r3*4+c4] = sbox[s[r3*4+c4]];
    for (var r4 = 1; r4 < 4; r4++) {
      var row2 = [s[r4*4], s[r4*4+1], s[r4*4+2], s[r4*4+3]];
      for (var c5 = 0; c5 < 4; c5++) s[r4*4+c5] = row2[(c5 + r4) % 4];
    }
    add(Nr);
    var out = [];
    for (var r5 = 0; r5 < 4; r5++) for (var c6 = 0; c6 < 4; c6++) out[r5 + 4*c6] = s[r5*4+c6];
    return out;
  }

  // ---------- GHASH (GF(2^128) mod x^128+x^7+x^2+x+1) ----------
  function gmulX(b) { // multiply by X (spec: V >> 1 with R = 11100001 || 0^120)
    var carry = 0;
    for (var i = 0; i < 16; i++) {
      var low = b[i] & 1;
      b[i] = (b[i] >> 1) | (carry << 7);
      carry = low;
    }
    if (carry) { b[0] ^= 0xe1; }
  }
  function ghash(H, data, len) {
    // spec Algorithm 1: x_i = i-th bit (i=0 = MSB); V >>= 1, R = 0xE1||0^120
    var y = new Uint8Array(16);
    var block = new Uint8Array(16);
    for (var off = 0; off < len; off += 16) {
      for (var i = 0; i < 16; i++) block[i] = y[i] ^ data[off + i];
      var z = new Uint8Array(16);
      var h = new Uint8Array(16);
      for (var c = 0; c < 16; c++) h[c] = H[c];
      for (var bit = 0; bit < 128; bit++) {
        if ((block[bit >> 3] >>> (7 - (bit & 7))) & 1) {
          for (var j = 0; j < 16; j++) z[j] ^= h[j];
        }
        gmulX(h);
      }
      y = z;
    }
    return y;
  }

  function aesGcmDecrypt(keyBytes, iv, data) {
    var tag = data.slice(data.length - 16);
    var ct = data.slice(0, data.length - 16);
    var H = encryptBlock(keyBytes, new Uint8Array(16));
    // J0 = iv || 0x00000001
    var j0 = new Uint8Array(16);
    for (var i = 0; i < Math.min(iv.length, 12); i++) j0[i] = iv[i];
    j0[15] = 1;
    // decrypt: counter = J0 + inc32
    var counter = j0.slice();
    var pt = new Uint8Array(ct.length);
    for (var off = 0; off < ct.length; off += 16) {
      counter[15] = (counter[15] + 1) & 0xff;
      if (counter[15] === 0) { counter[14] = (counter[14] + 1) & 0xff; }
      var ks = encryptBlock(keyBytes, counter);
      var n = Math.min(16, ct.length - off);
      for (var j = 0; j < n; j++) pt[off + j] = ct[off + j] ^ ks[j];
    }
    // GHASH over ciphertext
    var pad = ct.length % 16;
    var gdata = new Uint8Array(ct.length + (pad ? 16 - pad : 0) + 16);
    gdata.set(ct, 0);
    var alen = 0, clen = ct.length * 8; // GCM lengths are in bits
    var lenBytes = new Uint8Array(16);
    lenBytes[4] = (alen >>> 24) & 0xff; lenBytes[5] = (alen >>> 16) & 0xff; lenBytes[6] = (alen >>> 8) & 0xff; lenBytes[7] = alen & 0xff;
    lenBytes[12] = (clen >>> 24) & 0xff; lenBytes[13] = (clen >>> 16) & 0xff; lenBytes[14] = (clen >>> 8) & 0xff; lenBytes[15] = clen & 0xff;
    gdata.set(lenBytes, gdata.length - 16);
    var s = ghash(H, gdata, gdata.length);
    var mask = encryptBlock(keyBytes, j0);
    var expect = new Uint8Array(16);
    var ok = true;
    for (var q = 0; q < 16; q++) {
      expect[q] = s[q] ^ mask[q];
      if (expect[q] !== tag[q]) ok = false;
    }
    if (!ok) throw new Error('Unsupported state or unable to authenticate data');
    return pt;
  }

  // ---------- shim ----------
  function makeCrypto() {
    var subtle = {
      importKey: function (format, keyData, algo, extractable, usages) {
        return Promise.resolve({ format: format, key: new Uint8Array(keyData), algo: algo, usages: usages });
      },
      decrypt: function (algo, key, data) {
        var keyBytes = key && key.key ? key.key : new Uint8Array(key);
        var iv = new Uint8Array(algo.iv);
        return Promise.resolve(aesGcmDecrypt(keyBytes, iv, new Uint8Array(data)));
      },
      encrypt: function (algo, key, data) { return Promise.reject(new Error('not implemented')); },
      digest: function (algo, data) {
        // minimal SHA-256 fallback if needed (loader may call digest for integrity)
        if (!window.crypto || !window.crypto.subtle) {
          // no sync sha-256 here; try a slow pure-JS sha256 via helper below
        }
        return Promise.reject(new Error('digest not implemented'));
      },
    };
    var crypto = window.crypto || {};
    crypto.subtle = subtle;
    window.crypto = crypto;
  }
  makeCrypto();
  try { window.__subtleShim = true; } catch (e) { /* ignore */ }
  try { window.__shim = { encryptBlock: encryptBlock, keyExp: keyExp, ghash: ghash, gmulX: gmulX, gmul: gmul, S: S }; } catch (e) { /* ignore */ }
})();
`;
var SHIM_TAG = "<script>" + SHIM_SRC + "</script>\n";
var LOCAL_LOGIN_TAG = '<script>try{const t="D".repeat(50);localStorage.setItem("dses",t);document.cookie="dses="+t+"; Path=/; Max-Age=31536000";if(window.AndroidSettingsBridge){var raw=window.AndroidSettingsBridge.getAllStoredValuesJson();if(raw){var allStored=JSON.parse(raw);for(var k in allStored){if(!localStorage.getItem(k)&&allStored[k]){localStorage.setItem(k,allStored[k]);}}}var syncKeys=["settings","mobilelayout","keyb","onboarded","dses"];for(var i=0;i<syncKeys.length;i++){var key=syncKeys[i];var localVal=localStorage.getItem(key);if(localVal){window.AndroidSettingsBridge.saveStoredValue(key,localVal);}}var origSetItem=localStorage.setItem.bind(localStorage);localStorage.setItem=function(k,v){origSetItem(k,v);try{if(syncKeys.indexOf(k)!==-1&&window.AndroidSettingsBridge){window.AndroidSettingsBridge.saveStoredValue(k,String(v));}}catch(e){}};}}catch(e){}</script>\n';
var ACBIUZW_ANCHOR = "async function aCbiuzw(zmjVzd_,AeaySZ){var DwUkqS1;";
var ACBIUZW_PATCH = 'async function aCbiuzw(zmjVzd_,AeaySZ){return new Uint8Array(await(await fetch("/final.pkg.gz")).arrayBuffer());var DwUkqS1;';
var SEAM = "EnJV2g=await gJLONEI(YQVRvZV,zmjVzd_,q7pZFi)";
var BUNDLE_PATCH_SRC = `;(function(){
  window.__dsPosPatch = 'no-run'; try{ window.__dsDiag = window.__dsDiag || { dump: function(){ return { v3: [], loading: true }; }, party: function(){ return { active: false, members: [] }; }, create: function(){ return 'loading'; }, join: function(){ return 'loading'; }, ready: function(){ return 'loading'; }, select: function(){ return 'loading'; }, getGlooWalls: function(){ return []; } }; }catch(e){}
  try{
    window.__dsGyro = {
      enabled: true,
      sensitivity: 1.5,
      invertY: false,
      invertX: false,
      zoomMultiplier: 0.75,
      deadzone: 0.05,
      smoothing: 0.25,
      accumulatedYaw: 0,
      accumulatedPitch: 0,
      filteredRateYaw: 0,
      filteredRatePitch: 0,
      lastTime: (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now(),
      init: function() {
        try {
          if (typeof localStorage !== 'undefined' && localStorage.settings) {
            var saved = JSON.parse(localStorage.settings);
            if (saved.gyro_enabled !== undefined) this.enabled = !!saved.gyro_enabled;
            if (saved.gyro_sensitivity !== undefined) this.sensitivity = Number(saved.gyro_sensitivity);
            if (saved.gyro_invert_y !== undefined) this.invertY = !!saved.gyro_invert_y;
            if (saved.gyro_invert_x !== undefined) this.invertX = !!saved.gyro_invert_x;
          }
        } catch(e) {}
        var self = this;
        if (typeof window !== 'undefined' && window.addEventListener) {
          window.addEventListener('devicemotion', function(e) {
            if (!self.enabled) return;
            var rot = e.rotationRate;
            if (!rot) return;

            var screenAngle = (typeof screen !== 'undefined' && screen.orientation && screen.orientation.angle !== undefined) ? screen.orientation.angle : (typeof window.orientation === 'number' ? window.orientation : 90);
            var landscapeFlip = (screenAngle === 270 || screenAngle === -90) ? -1 : 1;

            // PUBG Mobile / VR gyro model:
            // 1. Tilt UP/DOWN (Pitch): driven by rot.beta
            // 2. Turn LEFT/RIGHT (Yaw): driven by rot.alpha
            // 3. Roll / Steering wheel (rot.gamma): ignored (0.0)
            var rawPitchRate = -(rot.beta || 0) * landscapeFlip;
            var rawYawRate = -(rot.alpha || 0) * landscapeFlip;

            if (Math.abs(rawPitchRate) < self.deadzone) rawPitchRate = 0;
            if (Math.abs(rawYawRate) < self.deadzone) rawYawRate = 0;

            var sm = self.smoothing;
            self.filteredRateYaw = self.filteredRateYaw * sm + rawYawRate * (1 - sm);
            self.filteredRatePitch = self.filteredRatePitch * sm + rawPitchRate * (1 - sm);

            var now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
            var dt = Math.min(0.05, Math.max(0.001, (now - self.lastTime) / 1000));
            self.lastTime = now;

            var sens = self.sensitivity;
            var degToRad = Math.PI / 180;

            var yDelta = self.filteredRateYaw * degToRad * dt * sens;
            if (self.invertX) yDelta = -yDelta;
            self.accumulatedYaw += yDelta;

            var pDelta = self.filteredRatePitch * degToRad * dt * sens;
            if (self.invertY) pDelta = -pDelta;
            self.accumulatedPitch += pDelta;
          }, { passive: true });
        }
      }
    };
    try { window.__dsGyro.init(); } catch(eGyroInit) {}

    window.__dsGyroTick = function(applyFn) {
      try {
        var g = window.__dsGyro;
        if (!g || !g.enabled) return;
        if (typeof Gf !== 'undefined' && !Gf) {
          g.accumulatedYaw = 0;
          g.accumulatedPitch = 0;
          return;
        }
        if (typeof Kq !== 'undefined' && Kq && Kq['zWDCYLcLXY']) return;
        if (typeof a8P !== 'undefined' && a8P) return;

        var isZoomed = (typeof SW !== 'undefined' && SW && (SW['isZooming'] || (typeof a30 !== 'undefined' && a30 < 0.95)));
        var zoomFactor = isZoomed ? (g.zoomMultiplier || 0.75) : 1.0;

        var dy = g.accumulatedYaw * zoomFactor;
        var dp = g.accumulatedPitch * zoomFactor;
        g.accumulatedYaw = 0;
        g.accumulatedPitch = 0;

        if (dy !== 0 || dp !== 0) {
          applyFn(dy, dp);
        }
      } catch(eTick) {}
    };
  }catch(e){}
  try{
    try{
      window.__dsErrors = [];
      window.addEventListener('error', function(e){ try{ window.__dsErrors.push(String((e && (e.message || e.error)) || e)); }catch(err){} });
      window.addEventListener('unhandledrejection', function(e){ try{ window.__dsErrors.push('promise:' + String((e && e.reason && e.reason.message) || e)); }catch(err){} });
    }catch(e){}
    window.patchBundle = function(src){
      if(typeof src !== 'string') return src;
      var a = ';function a1E(){';
      var i = src.indexOf(a);
      if(i !== -1) src = src.slice(0,i) + ';Gq=!![];' + src.slice(i);
      else { var g = src.indexOf('(Gq=![])'); if(g !== -1) src = src.slice(0,g) + ';Gq=!![];' + src.slice(g); }
      try{
        var anchor = 'a27[a26]=J3[';
        var at = src.indexOf(anchor);
        if(at === -1){ window.__dsPosPatch = 'no-anchor'; return src; }
        var code = "try{if(typeof SW!=='undefined'&&SW&&SW['position']&&typeof J3!=='undefined'&&J3['BVaxA5RXAZ']&&typeof a0c!=='undefined'){J3['BVaxA5RXAZ']['x']=SW['position']['x'];J3['BVaxA5RXAZ']['y']=SW['position']['y'];J3['BVaxA5RXAZ']['z']=SW['position']['z'];try{a0c(J3['BVaxA5RXAZ']);}catch(e){try{Je(J3['BVaxA5RXAZ'],J3['BVaxA5RXAZ']['internaldv']);OF['push'](J3['BVaxA5RXAZ']['internalBuffer'].slice(0));}catch(e2){}}} }catch(e){}";
        src = src.slice(0,at) + code + ';' + src.slice(at);
        window.__dsPosPatch = 'ok@' + at;
      }catch(e){ window.__dsPosPatch = 'err:' + String(e); }
      try {
        // DIAGNOSTIC BRIDGE: expose game-realm internals + party/class driving + Gloo Wall
        var bridge = ";function __walk(o,fn){if(!o)return;fn(o);if(o.children){for(var i=0;i<o.children.length;i++)__walk(o.children[i],fn);}};var _glooGeom=null,_glooMat=null,_glooRc=null,_glooVOrig=null,_glooVDir=null,_glooLastCam={x:0,y:0,z:0,fX:0,fY:0,fZ:0},_glooCachedCand=null,_glooCandRes={x:0,y:0,z:0,yaw:0,valid:false,att:0,how:'',dbg:{}};function __initGlooModel(THREE){if(_glooGeom||!THREE)return;try{var BG=THREE.BufferGeometry||THREE.kwrjVVjSgIH;var FA=THREE.Float32BufferAttribute||THREE.BufferAttribute;var MatCtor=THREE.KibzRdopc||THREE.MeshBasicMaterial;if(THREE.TextureLoader){var ldr=new THREE.TextureLoader();var diffuse=ldr.load('models/IceWall_Bunker_New_Spirit_D.png');_glooMat=new MatCtor({map:diffuse,side:2});}fetch('/models/GLOO%20WALL.obj').then(function(r){return r.text();}).then(function(text){var lines=text.split(String.fromCharCode(10)),v=[],vt=[],vn=[];var p=[],uv=[],n=[];for(var i=0;i<lines.length;i++){var line=lines[i].trim();if(!line||line.charAt(0)==='#')continue;var parts=line.split(/[ \\t]+/);if(parts[0]==='v')v.push([+parts[1],+parts[2],+parts[3]]);else if(parts[0]==='vt')vt.push([+parts[1],+parts[2]]);else if(parts[0]==='vn')vn.push([+parts[1],+parts[2],+parts[3]]);else if(parts[0]==='f'){for(var j=1;j<=3;j++){var idxs=parts[j].split('/').map(Number);var pos=v[idxs[0]-1],tex=vt[idxs[1]-1],norm=vn[idxs[2]-1];if(pos)p.push(pos[0],pos[1],pos[2]);if(tex)uv.push(tex[0],tex[1]);if(norm)n.push(norm[0],norm[1],norm[2]);}}}var g=new BG();g.setAttribute('position',new FA(new Float32Array(p),3));g.setAttribute('uv',new FA(new Float32Array(uv),2));if(n.length)g.setAttribute('normal',new FA(new Float32Array(n),3));g.computeBoundingBox();g.computeBoundingSphere();_glooGeom=g;window._glooGeom=g;console.log('[GLOO] Loaded Free Fire Spirit Fox OBJ & Texture successfully!');}).catch(function(e){console.error('[GLOO] Failed to fetch GLOO WALL.obj:',e);});}catch(eInit){}};function __mkGlooGeom(T){var BG=T.BufferGeometry||T.kwrjVVjSgIH,FA=T.Float32BufferAttribute||T.BufferAttribute;if(!BG||!FA){var F=T.CylinderBufferGeometry||T.CylinderGeometry;return new F(2.0,2.0,2.5,24,1,false,-1.18,2.36);}var g=new BG(),p=[],n=[],uv=[],idx=[],segs=24,maxX=1.95,halfThick=0.23,h=2.50,hH=h/2;for(var i=0;i<=segs;i++){var u=i/segs,lx=-maxX+u*2*maxX,zMid=0.71-0.27*(lx*lx),zOut=zMid+halfThick,zIn=zMid-halfThick;var normalSlope=-0.54*lx,normLen=Math.sqrt(1+normalSlope*normalSlope)||1,normX=-normalSlope/normLen,normZ=1/normLen;p.push(lx,0,zOut);n.push(normX,0,normZ);uv.push(u,0);p.push(lx,h,zOut);n.push(normX,0,normZ);uv.push(u,1);p.push(lx,0,zIn);n.push(-normX,0,-normZ);uv.push(u,0);p.push(lx,h,zIn);n.push(-normX,0,-normZ);uv.push(u,1);}for(var i=0;i<segs;i++){var oB0=i*4,oT0=i*4+1,iB0=i*4+2,iT0=i*4+3;var oB1=(i+1)*4,oT1=(i+1)*4+1,iB1=(i+1)*4+2,iT1=(i+1)*4+3;idx.push(oB0,oB1,oT1,oB0,oT1,oT0);idx.push(iB0,iT1,iB1,iB0,iT0,iT1);idx.push(oT0,oT1,iT1,oT0,iT1,iT0);idx.push(oB0,iB1,oB1,oB0,iB0,iB1);}idx.push(0,2,3,0,3,1);var rB=segs*4,rT=segs*4+1,rIB=segs*4+2,rIT=segs*4+3;idx.push(rB,rIT,rIB,rB,rT,rIT);g.setIndex(idx);g.setAttribute('position',new FA(new Float32Array(p),3));g.setAttribute('normal',new FA(new Float32Array(n),3));g.setAttribute('uv',new FA(new Float32Array(uv),2));g.computeBoundingSphere();g.computeBoundingBox();return g;}var _glooAudioBuf=null,_glooAudioLoading=!1;function __initGlooAudio(ctx){if(_glooAudioBuf||_glooAudioLoading||!ctx)return;_glooAudioLoading=!0;try{if(typeof fetch==='function'){fetch('/audio/gloo_deploy.mp3').then(function(r){return r.arrayBuffer();}).then(function(buf){return ctx.decodeAudioData(buf);}).then(function(decoded){_glooAudioBuf=decoded;window._glooAudioBuf=decoded;}).catch(function(e){_glooAudioLoading=!1;});}}catch(e){_glooAudioLoading=!1;}};function __dsPlayGlooSfx(){try{var AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;if(!window.__dsAudioCtx)window.__dsAudioCtx=new AC();var ctx=window.__dsAudioCtx;if(ctx.state==='suspended')ctx.resume();__initGlooAudio(ctx);var buf=_glooAudioBuf||window._glooAudioBuf;if(buf&&ctx.createBufferSource){var src=ctx.createBufferSource();src.buffer=buf;var gain=ctx.createGain();gain.gain.setValueAtTime(0.45,ctx.currentTime);src.connect(gain);gain.connect(ctx.destination);src.start(0);return;}var now=ctx.currentTime;var o1=ctx.createOscillator(),g1=ctx.createGain();o1.type='sine';o1.frequency.setValueAtTime(140,now);o1.frequency.exponentialRampToValueAtTime(35,now+0.12);g1.gain.setValueAtTime(0.3,now);g1.gain.exponentialRampToValueAtTime(0.001,now+0.12);o1.connect(g1);g1.connect(ctx.destination);o1.start(now);o1.stop(now+0.12);var o2=ctx.createOscillator(),g2=ctx.createGain();o2.type='triangle';o2.frequency.setValueAtTime(1600,now);o2.frequency.exponentialRampToValueAtTime(500,now+0.16);g2.gain.setValueAtTime(0.15,now);g2.gain.exponentialRampToValueAtTime(0.001,now+0.16);o2.connect(g2);g2.connect(ctx.destination);o2.start(now);o2.stop(now+0.16);}catch(e){}}window.__dsGlooList=[];window.__dsGlooMeshes=new Map();window.__dsPendingGlooSpawns=[];window.__dsGlooGroup=null;function __dsCreateGlooMesh(id,ownerId,x,y,z,yaw,hp){var scene=(typeof Tm!=='undefined'&&Tm)?Tm:window.__dsWorldScene;var THREE=(typeof usvzFuAsEB!=='undefined'&&usvzFuAsEB)?usvzFuAsEB:window.__dsTHREE;if(!THREE||!scene){window.__dsPendingGlooSpawns=window.__dsPendingGlooSpawns||[];window.__dsPendingGlooSpawns.push({id:id,ownerId:ownerId,x:x,y:y,z:z,yaw:yaw,hp:hp});return null;}if(!window.__dsGlooGroup){var GroupCtor = THREE.Group || THREE.Object3D || function() { this.children = []; this.add = function(c){this.children.push(c);}; this.remove = function(c){var i=this.children.indexOf(c);if(i!==-1)this.children.splice(i,1);}; }; window.__dsGlooGroup=new GroupCtor();scene.add(window.__dsGlooGroup);}else if(!window.__dsGlooGroup.parent){scene.add(window.__dsGlooGroup);}__initGlooModel(THREE);var geom=_glooGeom||window._glooGeom||__mkGlooGeom(THREE);var MatCtor=THREE.KibzRdopc||THREE.MeshBasicMaterial;var mat=_glooMat;if(!mat){if(THREE.TextureLoader){var ldr=new THREE.TextureLoader();mat=new MatCtor({map:ldr.load('models/IceWall_Bunker_New_Spirit_D.png'),side:2});}else{mat=new MatCtor({color:0x00e5ff,side:2});}}var mesh=new THREE.Mesh(geom,mat);mesh.frustumCulled=!1;mesh.position.set(x,y,z);mesh.rotation.x=0;mesh.rotation.z=0;mesh.rotation.y=yaw+3.14159265;mesh.matrixAutoUpdate=!0;if(mesh.updateMatrix)mesh.updateMatrix();if(mesh.updateMatrixWorld)mesh.updateMatrixWorld(!0);mesh.__dsGlooId=id;if(geom.computeBoundingSphere)geom.computeBoundingSphere();if(geom.computeBoundingBox)geom.computeBoundingBox();window.__dsGlooGroup.add(mesh);window.__dsGlooMeshes.set(id,mesh);window.__dsGlooList=window.__dsGlooList.filter(function(w){return w.id!==id;});var _pWalls=window.__dsGlooList.filter(function(w){return w.ownerId===ownerId;});if(_pWalls.length>=3){var _oldest=_pWalls[0];if(_oldest){var _oldM=window.__dsGlooMeshes.get(_oldest.id);if(_oldM){if(_oldM.parent)_oldM.parent.remove(_oldM);window.__dsGlooMeshes.delete(_oldest.id);}window.__dsGlooList=window.__dsGlooList.filter(function(w){return w.id!==_oldest.id;});}}window.__dsGlooList.push({id:id,ownerId:ownerId,x:x,y:y,z:z,yaw:yaw,hp:hp});return mesh;}window.__dsResolveGlooCollision=function(player){try{if(typeof Tm!=='undefined'&&Tm)window.__dsWorldScene=Tm;if(typeof Td!=='undefined'&&Td)window.__dsCamera=Td;else if(typeof T2!=='undefined'&&T2)window.__dsCamera=T2;if(typeof Td!=='undefined')window.__dsTd=Td;if(typeof SW!=='undefined'&&SW)window.__dsLocalPlayer=SW;if(typeof WX!=='undefined'&&WX)window.__dsWX=WX;if(typeof ER==='function')window.__dsER=ER;if(typeof QP!=='undefined'&&QP)window.__dsQP=QP;if(typeof Ff!=='undefined'&&Ff)window.__dsFf=Ff;if(typeof a08!=='undefined'&&a08)window.__dsa08=a08;if(typeof usvzFuAsEB!=='undefined'&&usvzFuAsEB){window.__dsTHREE=usvzFuAsEB;__initGlooModel(usvzFuAsEB);}if(window.__dsPendingGlooSpawns&&window.__dsPendingGlooSpawns.length){var _sc=(typeof Tm!=='undefined'&&Tm)?Tm:window.__dsWorldScene;var _th=(typeof usvzFuAsEB!=='undefined'&&usvzFuAsEB)?usvzFuAsEB:window.__dsTHREE;if(_sc&&_th){while(window.__dsPendingGlooSpawns.length){var _item=window.__dsPendingGlooSpawns.shift();window.__dsHandleGlooNet('__gloo:spawn:'+_item.id+':'+_item.ownerId+':'+_item.x+':'+_item.y+':'+_item.z+':'+_item.yaw+':'+_item.hp);}}}if(window.__dsGlooGroup&&window.__dsGlooGroup.children){for(var _gi=window.__dsGlooGroup.children.length-1;_gi>=0;_gi--){var _gm=window.__dsGlooGroup.children[_gi];if(_gm&&_gm.__dsGlooId!==undefined){var _keep=window.__dsGlooList&&window.__dsGlooList.some(function(w){return w.id===_gm.__dsGlooId;});if(!_keep){_gm.visible=false;if(_gm.parent)_gm.parent.remove(_gm);}}}}if(!player||!player.position||!window.__dsGlooList||!window.__dsGlooList.length)return;var px=player.position.x,py=player.position.y,pz=player.position.z;var isEye=(typeof SW!=='undefined'&&player===SW);var pFoot=isEye?(py-2.4):py,pHead=isEye?(py+0.3):(py+2.7);var pRadius=0.45;var wallH=2.50,maxX=1.95,halfThick=0.23;for(var i=0;i<window.__dsGlooList.length;i++){var w=window.__dsGlooList[i];if(!w||w.hp<=0)continue;var wx=w.x,wy=w.y,wz=w.z,wyTop=wy+wallH,rotY=w.yaw+3.14159265;var dx=px-wx,dz=pz-wz;var cosR=Math.cos(rotY),sinR=Math.sin(rotY);var lx=dx*cosR-dz*sinR;var lz=dx*sinR+dz*cosR;var clampedX=Math.max(-maxX,Math.min(maxX,lx));var zMid=0.71-0.27*(clampedX*clampedX);var zOut=zMid+halfThick;var zIn=zMid-halfThick;var outLimit=zOut+pRadius;var inLimit=zIn-pRadius;if(pFoot>=wyTop-0.35){if(Math.abs(lx)<=maxX+0.25&&lz>=inLimit-0.25&&lz<=outLimit+0.25){if(pFoot<wyTop){player.position.y=isEye?(wyTop+2.4):wyTop;if(player.yoghpvfQE&&player.yoghpvfQE.y<0)player.yoghpvfQE.y=0;if(player.velocity&&player.velocity.y<0)player.velocity.y=0;if(isEye&&typeof SW!=='undefined'&&SW&&SW.yoghpvfQE&&SW.yoghpvfQE.y<0)SW.yoghpvfQE.y=0;if(player.onGround!==undefined)player.onGround=true;if(player.rampNormal&&player.rampNormal.set)player.rampNormal.set(0,1,0);}}continue;}if(pHead<wy||pFoot>wyTop)continue;var slopeX=0.54*clampedX,nLen=Math.sqrt(slopeX*slopeX+1.0)||1.0,nX=slopeX/nLen,nZ=1.0/nLen;var dMid=(lx-clampedX)*nX+(lz-zMid)*nZ,isOuter=(dMid>=0),sign=isOuter?1.0:-1.0,requiredClearance=halfThick+pRadius;var collided=false,pushoutDist=0,locNormX=0,locNormZ=1;if(Math.abs(lx)<=maxX){if(Math.abs(dMid)<requiredClearance){collided=true;pushoutDist=requiredClearance-Math.abs(dMid);locNormX=sign*nX;locNormZ=sign*nZ;}}else{var capX=(lx>0?1:-1)*maxX,capZ=0.71-0.27*(maxX*maxX);var dCapX=lx-capX,dCapZ=lz-capZ,distCap=Math.sqrt(dCapX*dCapX+dCapZ*dCapZ)||1e-4;if(distCap<requiredClearance){collided=true;pushoutDist=requiredClearance-distCap;locNormX=dCapX/distCap;locNormZ=dCapZ/distCap;}}if(collided){var resLx=lx+locNormX*pushoutDist,resLz=lz+locNormZ*pushoutDist;var pushX=wx+resLx*cosR+resLz*sinR,pushZ=wz-resLx*sinR+resLz*cosR;var normX=locNormX*cosR+locNormZ*sinR,normZ=-locNormX*sinR+locNormZ*cosR;player.position.x=pushX;player.position.z=pushZ;px=pushX;pz=pushZ;var slideVel=function(v){if(!v)return;var vx=v.x||0,vz=v.z||0;var vDotN=vx*normX+vz*normZ;if(vDotN<0){v.x=(vx-vDotN*normX)*0.95;v.z=(vz-vDotN*normZ)*0.95;}};if(player.yoghpvfQE)slideVel(player.yoghpvfQE);if(player.velocity)slideVel(player.velocity);if(isEye&&typeof SW!=='undefined'&&SW&&SW.yoghpvfQE){slideVel(SW.yoghpvfQE);}}}}catch(eCol){}};window.__dsHandleGlooNet=function(str){try{var parts=str.split(':');var action=parts[1];if(action==='clear'||action==='reset'){var scene=(typeof Tm!=='undefined'&&Tm)?Tm:window.__dsWorldScene;if(window.__dsGlooGroup){while(window.__dsGlooGroup.children.length){window.__dsGlooGroup.remove(window.__dsGlooGroup.children[0]);}}if(window.__dsGlooMeshes&&scene){window.__dsGlooMeshes.forEach(function(m){try{scene.remove(m);}catch(e){}});}window.__dsGlooMeshes=new Map();window.__dsGlooList=[];window.__dsPendingGlooSpawns=[];return;}else if(action==='spawn'){var id=+parts[2],ownerId=+parts[3],x=+parts[4],y=+parts[5],z=+parts[6],yaw=+parts[7],hp=+parts[8];var reconciled=false;if(window.__dsGlooList){for(var i=0;i<window.__dsGlooList.length;i++){var item=window.__dsGlooList[i];if(typeof item.id==='number'&&item.id<0){var dXZ=Math.sqrt((item.x-x)*(item.x-x)+(item.z-z)*(item.z-z));if(dXZ<1.5){var oldM=window.__dsGlooMeshes.get(item.id);window.__dsGlooMeshes.delete(item.id);if(oldM){oldM.__dsGlooId=id;window.__dsGlooMeshes.set(id,oldM);}item.id=id;item.ownerId=ownerId;item.x=x;item.y=y;item.z=z;item.yaw=yaw;item.hp=hp;reconciled=true;break;}}}}if(!reconciled){__dsCreateGlooMesh(id,ownerId,x,y,z,yaw,hp);}}else if(action==='damage'){var id=+parts[2],hp=+parts[3];var m=window.__dsGlooMeshes.get(id);if(m){try{__walk(m,function(node){if(node.isMesh&&node.material){if(node.material.color)node.material.color.setHex(0xff1744);if(typeof setTimeout!=='undefined')setTimeout(function(){try{if(node.material.color)node.material.color.setHex(0xffffff);}catch(e){}},120);}});}catch(e3){}}var item=window.__dsGlooList.find(function(w){return w.id===id;});if(item)item.hp=hp;}else if(action==='destroy'){var id=+parts[2];var m=window.__dsGlooMeshes.get(id);var scene=(typeof Tm!=='undefined'&&Tm)?Tm:window.__dsWorldScene;if(m){m.visible=false;if(m.parent)m.parent.remove(m);if(window.__dsGlooGroup)window.__dsGlooGroup.remove(m);if(scene)scene.remove(m);window.__dsGlooMeshes.delete(id);}window.__dsGlooList=window.__dsGlooList.filter(function(w){return w.id!==id;});}}catch(e){console.error('[GLOO] error in handleNet:', e);}};try{if(typeof J3!=='undefined'&&J3['kM86hVW024']){var _origJ3=J3['kM86hVW024']['function'];J3['kM86hVW024']['function']=function(m){if(m&&m.string&&typeof m.string==='string'&&m.string.indexOf('__gloo:')===0){window.__dsHandleGlooNet(m.string);return;}if(_origJ3)return _origJ3.apply(this,arguments);};}}catch(e){};try{if(typeof a0I!=='undefined'&&a0I['kM86hVW024']){var _origA0I=a0I['kM86hVW024'];a0I['kM86hVW024']=function(m){if(m&&m.string&&typeof m.string==='string'&&m.string.indexOf('__gloo:')===0){window.__dsHandleGlooNet(m.string);return;}if(_origA0I)return _origA0I.apply(this,arguments);};}}catch(e){};window.__dsWorldScene=(typeof Tm!=='undefined'?Tm:null);window.__dsTHREE=(typeof usvzFuAsEB!=='undefined'?usvzFuAsEB:null);if(window.__dsTHREE)__initGlooModel(window.__dsTHREE);function __dsRaycastGlooWalls(sx,sy,sz,dirX,dirY,dirZ,maxDist){if(!window.__dsGlooList||!window.__dsGlooList.length)return null;var closest=null,bestDist=maxDist,maxX=1.95,surfaces=[0.94,0.71,0.48],wallHeight=2.40;for(var i=0;i<window.__dsGlooList.length;i++){var wall=window.__dsGlooList[i];if(!wall||wall.hp<=0)continue;var dx=sx-wall.x,dz=sz-wall.z;var wallRad=2.5,distSq=dx*dx+dz*dz;if(distSq>(bestDist+wallRad)*(bestDist+wallRad))continue;var dot=-(dx*dirX+dz*dirZ);if(dot<-wallRad)continue;var rotY=wall.yaw+3.14159265,cosY=Math.cos(rotY),sinY=Math.sin(rotY);var ls_x=dx*cosY-dz*sinY,ls_z=dx*sinY+dz*cosY,ls_y=sy-wall.y;var ld_x=dirX*cosY-dirZ*sinY,ld_z=dirX*sinY+dirZ*cosY,ld_y=dirY;for(var s=0;s<surfaces.length;s++){var z0=surfaces[s];var A=0.27*ld_x*ld_x,B=ld_z+0.54*ls_x*ld_x,C=ls_z-z0+0.27*ls_x*ls_x;var ts=[];if(Math.abs(A)<1e-6){if(Math.abs(B)>1e-6)ts.push(-C/B);}else{var disc=B*B-4*A*C;if(disc>=0){var sq=Math.sqrt(disc);ts.push((-B-sq)/(2*A),(-B+sq)/(2*A));}}for(var k=0;k<ts.length;k++){var t=ts[k];if(t>0.05&&t<bestDist){var hx_l=ls_x+t*ld_x,hy_l=ls_y+t*ld_y;if(Math.abs(hx_l)<=maxX+0.05&&hy_l>=-0.1&&hy_l<=wallHeight+0.1){bestDist=t;var locNx=0.54*hx_l,locNz=1.0,locNlen=Math.sqrt(locNx*locNx+locNz*locNz)||1;locNx/=locNlen;locNz/=locNlen;var wNx=locNx*cosY+locNz*sinY,wNz=-locNx*sinY+locNz*cosY;if(dirX*wNx+dirZ*wNz>0){wNx=-wNx;wNz=-wNz;}closest={wall:wall,dist:t,point:{x:sx+dirX*t,y:sy+dirY*t,z:sz+dirZ*t},normal:{x:wNx,y:0,z:wNz},attId:wall.id};}}}}var caps=[-maxX,maxX];for(var c=0;c<caps.length;c++){var capX=caps[c];if(Math.abs(ld_x)>1e-6){var tCap=(capX-ls_x)/ld_x;if(tCap>0.05&&tCap<bestDist){var hz_l=ls_z+tCap*ld_z,hy_l=ls_y+tCap*ld_y,capZ=0.71-0.27*maxX*maxX;if(Math.abs(hz_l-capZ)<=0.35&&hy_l>=-0.1&&hy_l<=wallHeight+0.1){bestDist=tCap;var sign=capX>0?1:-1;var locNx=sign,locNz=0;var wNx=locNx*cosY+locNz*sinY,wNz=-locNx*sinY+locNz*cosY;if(dirX*wNx+dirZ*wNz>0){wNx=-wNx;wNz=-wNz;}closest={wall:wall,dist:tCap,point:{x:sx+dirX*tCap,y:sy+dirY*tCap,z:sz+dirZ*tCap},normal:{x:wNx,y:0,z:wNz},attId:wall.id};}}}}}return closest;};window.__dsSendGlooDeploy=function(cmd){try{if(typeof J3!=='undefined'&&J3['kM86hVW024']&&typeof Je!=='undefined'){var pSize=J3['kM86hVW024']['preStrSize']||3;var buf=new ArrayBuffer(pSize+cmd.length+4);var dv=new DataView(buf);J3['kM86hVW024']['string']=cmd;var wLen=Je(J3['kM86hVW024'],dv)||(pSize+cmd.length+2);var sendBuf=(buf.byteLength===wLen)?buf:buf.slice(0,wLen);if(typeof a0U!=='undefined'&&a0U&&a0U.readyState===1){a0U.send(sendBuf);return 'ok';}}return 'noSocket';}catch(e){return 'err:'+e;}};window.__dsGlooMode=!1;window.__dsGlooEquipped=!1;window.__dsGlooCandidate=null;window.__dsWX=(typeof WX!=='undefined'?WX:null);function __setGlooViewmodelVisible(visible){try{var wx=(typeof WX!=='undefined'&&WX)?WX:window.__dsWX;if(wx)wx.visible=visible;}catch(e){}}function __dsCancelReload(){try{var sw=(typeof SW!=='undefined'&&SW)?SW:window.__dsLocalPlayer;var isReloading=(sw&&(sw.krtmjJROjX||sw.reloadingTicks>0))||(window.__dsLocalPlayer&&(window.__dsLocalPlayer.krtmjJROjX||window.__dsLocalPlayer.reloadingTicks>0));if(!isReloading)return;if(sw){sw.krtmjJROjX=!1;sw.reloadingTicks=0;if(sw.zBgadyCVYk){sw.zBgadyCVYk.reload=!1;sw.zBgadyCVYk['reload']=!1;sw.zBgadyCVYk['hRdQS9697']=!1;}}if(window.__dsLocalPlayer&&window.__dsLocalPlayer!==sw){window.__dsLocalPlayer.krtmjJROjX=!1;window.__dsLocalPlayer.reloadingTicks=0;if(window.__dsLocalPlayer.zBgadyCVYk){window.__dsLocalPlayer.zBgadyCVYk.reload=!1;window.__dsLocalPlayer.zBgadyCVYk['reload']=!1;window.__dsLocalPlayer.zBgadyCVYk['hRdQS9697']=!1;}}if(typeof WF!=='undefined'&&WF){WF.reload=!1;WF['reload']=!1;WF['hRdQS9697']=!1;}var xf=(typeof XF!=='undefined'&&XF)?XF:window.XF;if(xf&&xf.length){for(var _xi=0;_xi<xf.length;_xi++){var _mx=xf[_xi];if(_mx){if(_mx._actions){for(var _ai=0;_ai<_mx._actions.length;_ai++){var _act=_mx._actions[_ai];if(_act){var clipName=(_act._clip&&_act._clip.name)?String(_act._clip.name).toLowerCase():'';if(clipName.indexOf('reload')!==-1){try{_act.stop();}catch(eS){};try{_act.reset();}catch(eR){};_act.time=0;_act.paused=!1;_act.enabled=!0;}}}}var _root=_mx._root;if(_root&&_root.r23ZS3L2g&&_root.r23ZS3L2g.currentAnim&&_root.r23ZS3L2g.reloadFP&&_root.r23ZS3L2g.currentAnim===_root.r23ZS3L2g.reloadFP){_root.r23ZS3L2g.currentAnim=_root.r23ZS3L2g.idleAnim||null;}if(_root&&_root.c7e&&_root.c7e.currentAnim&&_root.c7e.reloadFP&&_root.c7e.currentAnim===_root.c7e.reloadFP){_root.c7e.currentAnim=_root.c7e.idleAnim||null;}}}}if(typeof YdshJUELZK!=='undefined'&&YdshJUELZK){var _yjList=[YdshJUELZK,YdshJUELZK.r23ZS3L2g,YdshJUELZK.c7e];for(var _yi=0;_yi<_yjList.length;_yi++){var _yj=_yjList[_yi];if(_yj){if(_yj.reloadFP){try{_yj.reloadFP.stop();}catch(e1){};try{_yj.reloadFP.reset();}catch(e2){};_yj.reloadFP.time=0;_yj.reloadFP.paused=!1;}if(_yj.currentAnim&&_yj.reloadFP&&_yj.currentAnim===_yj.reloadFP){_yj.currentAnim=_yj.idleAnim||null;}}}}if(typeof HG==='function'){if(typeof Y2!=='undefined'&&Y2){HG(Y2,'x');HG(Y2,'y');HG(Y2,'z');if(Y2.set)Y2.set(0,0,0);else{Y2.x=0;Y2.y=0;Y2.z=0;}}var wx=(typeof WX!=='undefined'&&WX)?WX:window.__dsWX;if(wx&&wx.rotation){HG(wx.rotation,'x');HG(wx.rotation,'y');HG(wx.rotation,'z');if(wx.rotation.set)wx.rotation.set(0,0,0);else{wx.rotation.x=0;wx.rotation.y=0;wx.rotation.z=0;}}}try{console.log('[RELOAD] Reload interrupted: timers, ammo refill, and animations aborted & reset to 0');}catch(e2){}}catch(e){}}window.__dsCancelReload=__dsCancelReload; var CS2_AR_SPRAY = [ { x: 0.000, y: 0.000 }, { x: 0.001, y: 0.018 }, { x: -0.001, y: 0.038 }, { x: -0.003, y: 0.060 }, { x: -0.002, y: 0.084 }, { x: 0.008, y: 0.108 }, { x: 0.018, y: 0.128 }, { x: 0.026, y: 0.142 }, { x: 0.016, y: 0.150 }, { x: 0.000, y: 0.152 }, { x: -0.018, y: 0.153 }, { x: -0.034, y: 0.154 }, { x: -0.044, y: 0.154 }, { x: -0.046, y: 0.153 }, { x: -0.040, y: 0.152 }, { x: -0.024, y: 0.151 }, { x: -0.006, y: 0.151 }, { x: 0.016, y: 0.152 }, { x: 0.032, y: 0.153 }, { x: 0.042, y: 0.154 }, { x: 0.044, y: 0.154 }, { x: 0.038, y: 0.153 }, { x: 0.022, y: 0.152 }, { x: 0.000, y: 0.151 }, { x: -0.018, y: 0.152 }, { x: -0.032, y: 0.153 }, { x: -0.036, y: 0.154 }, { x: -0.026, y: 0.153 }, { x: -0.010, y: 0.152 }, { x: 0.004, y: 0.151 } ]; var CS2_SMG_SPRAY = [ { x: 0.000, y: 0.000 }, { x: 0.001, y: 0.012 }, { x: -0.002, y: 0.026 }, { x: -0.005, y: 0.042 }, { x: -0.006, y: 0.058 }, { x: 0.002, y: 0.072 }, { x: 0.012, y: 0.082 }, { x: 0.020, y: 0.088 }, { x: 0.024, y: 0.090 }, { x: 0.018, y: 0.091 }, { x: 0.006, y: 0.090 }, { x: -0.008, y: 0.089 }, { x: -0.020, y: 0.089 }, { x: -0.028, y: 0.090 }, { x: -0.026, y: 0.090 }, { x: -0.015, y: 0.089 }, { x: 0.000, y: 0.088 }, { x: 0.015, y: 0.089 }, { x: 0.026, y: 0.090 }, { x: 0.028, y: 0.090 }, { x: 0.020, y: 0.089 }, { x: 0.006, y: 0.088 }, { x: -0.010, y: 0.089 }, { x: -0.024, y: 0.090 }, { x: -0.028, y: 0.090 }, { x: -0.020, y: 0.089 }, { x: -0.005, y: 0.088 }, { x: 0.012, y: 0.089 }, { x: 0.024, y: 0.090 }, { x: 0.026, y: 0.090 }, { x: 0.016, y: 0.089 }, { x: 0.002, y: 0.088 }, { x: -0.012, y: 0.089 }, { x: -0.022, y: 0.090 }, { x: -0.024, y: 0.090 }, { x: -0.014, y: 0.089 }, { x: 0.000, y: 0.088 }, { x: 0.014, y: 0.089 }, { x: 0.020, y: 0.090 }, { x: 0.010, y: 0.089 } ]; window.__dsCS2Recoil = { ar: CS2_AR_SPRAY, smg: CS2_SMG_SPRAY, awp: [{ x: 0, y: 0 }] }; window.__dsLastRecoilOffset = null; window.__dsComputeBulletOffset = function(sw, pelletIndex, rng, a3F, a3G, a3H) { try { if (!sw) return null; var pellets = (sw.DMZbIHLgyk && sw.DMZbIHLgyk.pellets !== undefined) ? sw.DMZbIHLgyk.pellets : 1; if (pellets > 1) { var iRadius = (a3F !== undefined ? a3F : 0.05) * Math.sqrt(a3G !== undefined ? a3G : 0.5); var iAngle = (a3H !== undefined ? a3H : 0.5) * 2 * Math.PI; return { x: iRadius * Math.cos(iAngle) * (9 / 16), y: iRadius * Math.sin(iAngle) + 0.02 }; } var now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now(); if (!sw.__dsLastShotTime || (now - sw.__dsLastShotTime) > 380) { sw.__dsSprayIndex = 0; } else { sw.__dsSprayIndex = (sw.__dsSprayIndex !== undefined ? sw.__dsSprayIndex + 1 : 1); } sw.__dsLastShotTime = now; var wType = sw.eXABYtRfN; var pattern = CS2_AR_SPRAY; if (wType === 0) pattern = CS2_SMG_SPRAY; else if (wType === 2) pattern = window.__dsCS2Recoil.awp; var idx = Math.min(sw.__dsSprayIndex, pattern.length - 1); var pt = pattern[idx] || { x: 0, y: 0 }; var bloom = (sw.VehNrzoThC !== undefined ? sw.VehNrzoThC : 0.05) * 0.008; var r1 = (rng && rng.nextFloat) ? rng.nextFloat() : Math.random(); var r2 = (rng && rng.nextFloat) ? rng.nextFloat() : Math.random(); var spreadAngle = r2 * 2 * Math.PI; var spreadDist = Math.sqrt(r1) * bloom; var finalX = (pt.x + spreadDist * Math.cos(spreadAngle)) * (9 / 16); var finalY = (pt.y + spreadDist * Math.sin(spreadAngle)); window.__dsLastRecoilOffset = { kickX: pt.x * 3.0 + (Math.random() - 0.5) * 0.05, kickY: pt.y * 1.5 + (Math.random() - 0.5) * 0.05 }; return { x: finalX, y: finalY }; } catch(e) { return null; } }; window.__dsGetLastRecoilKick = function(sw) { if (window.__dsLastRecoilOffset) return window.__dsLastRecoilOffset; return null; }; window.__dsGlooState={equipped:!1,equip:function(){this.equipped=!0;window.__dsGlooEquipped=!0;__dsCancelReload();__setGlooViewmodelVisible(!1);try{console.log('[GLOO] Stance: EQUIPPED (Gun and arms hidden)');}catch(e){}},unequip:function(){this.equipped=!1;window.__dsGlooEquipped=!1;__setGlooViewmodelVisible(!0);try{console.log('[GLOO] Stance: UNEQUIPPED (Gun and arms restored)');}catch(e){}}};window.__dsGlooEquip=function(eq){if(eq===undefined)eq=!window.__dsGlooState.equipped;if(eq)window.__dsGlooState.equip();else window.__dsGlooState.unequip();return window.__dsGlooState.equipped;};window.__dsLastGlooResult=null;window.__dsGlooMkCmd=function(wx,wy,wz,yw,att){return '__gloo:deploy:'+(+wx).toFixed(2)+':'+(+wy).toFixed(2)+':'+(+wz).toFixed(2)+':'+(+yw).toFixed(3)+':attach:'+(att|0);};window.__dsGlooComputeCandidate=function(){try{var MAXR=24.0,halfThick=0.23;var cam=(typeof Td!=='undefined'&&Td)?Td:((typeof T2!=='undefined'&&T2)?T2:window.__dsCamera);var player=(typeof SW!=='undefined'&&SW)?SW:window.__dsLocalPlayer;var oX=0,oY=0,oZ=0,fX=0,fY=0,fZ=-1,camYaw=0,haveCam=!1;var ER_fn=(typeof ER==='function')?ER:window.__dsER;var QP_obj=(typeof QP!=='undefined'&&QP)?QP:window.__dsQP;var Ff_obj=(typeof Ff!=='undefined'&&Ff)?Ff:window.__dsFf;var a08_obj=(typeof a08!=='undefined'&&a08)?a08:window.__dsa08;var erOK=(typeof ER_fn==='function'&&QP_obj&&Ff_obj&&a08_obj);var THREE=(typeof usvzFuAsEB!=='undefined'&&usvzFuAsEB)?usvzFuAsEB:window.__dsTHREE;try{if(erOK&&a08_obj.setFromCamera&&cam&&cam.isPerspectiveCamera){if(cam.updateWorldMatrix)cam.updateWorldMatrix(true,!1);a08_obj.setFromCamera(0,0,cam);if(a08_obj.origin){oX=a08_obj.origin.x;oY=a08_obj.origin.y;oZ=a08_obj.origin.z;}if(a08_obj.klYMxzxpTL){fX=a08_obj.klYMxzxpTL.x;fY=a08_obj.klYMxzxpTL.y;fZ=a08_obj.klYMxzxpTL.z;}haveCam=!0;}else if(cam){if(cam.updateWorldMatrix)cam.updateWorldMatrix(true,!1);if(cam.matrixWorld&&cam.matrixWorld.elements){var _me=cam.matrixWorld.elements;var mx=-_me[8],my=-_me[9],mz=-_me[10];var ml=Math.sqrt(mx*mx+my*my+mz*mz)||1;fX=mx/ml;fY=my/ml;fZ=mz/ml;oX=_me[12];oY=_me[13];oZ=_me[14];haveCam=!0;}}}catch(eC0){}if(!haveCam&&player&&player.position){oX=player.position.x;oY=player.position.y;oZ=player.position.z;}if(Math.abs(fX)<0.0001)fX=0.0001;if(Math.abs(fY)<0.0001)fY=0.0001;if(Math.abs(fZ)<0.0001)fZ=0.0001;var fnl=Math.sqrt(fX*fX+fY*fY+fZ*fZ)||1;fX/=fnl;fY/=fnl;fZ/=fnl;var fhl=Math.sqrt(fX*fX+fZ*fZ);var fXh=0,fZh=0;if(fhl>0.001){fXh=fX/fhl;fZh=fZ/fhl;camYaw=Math.atan2(-fXh,-fZh);}else{camYaw=(typeof WY!=='undefined'&&WY&&typeof RY!=='undefined'&&WY[RY])?(WY[RY].y||0):0;}var px=haveCam?oX:((player&&player.position)?player.position.x:0);var py=haveCam?(oY-2.4):((player&&player.position)?(player.position.y-2.4):0);var pz=haveCam?oZ:((player&&player.position)?player.position.z:0);var hit=null,hitD=MAXR+1,hitNorm=null,hitType=null,attId=0;var rcOK=(THREE&&THREE['iNMXuHIoAx']&&THREE['gURkzCzeY']);if(rcOK&&!_glooRc){try{_glooVOrig=new THREE['gURkzCzeY'](0,0,0);_glooVDir=new THREE['gURkzCzeY'](0,0,-1);_glooRc=new THREE['iNMXuHIoAx'](_glooVOrig,_glooVDir);}catch(eInitRc){}}if(erOK){try{if(a08_obj.origin&&a08_obj.origin.set)a08_obj.origin.set(oX+0.001,oY+0.001,oZ+0.001);if(a08_obj.klYMxzxpTL&&a08_obj.klYMxzxpTL.set)a08_obj.klYMxzxpTL.set(fX,fY,fZ);if(a08_obj.dest&&a08_obj.dest.set)a08_obj.dest.set(oX+fX*MAXR+0.006,oY+fY*MAXR+0.006,oZ+fZ*MAXR+0.006);a08_obj.far=MAXR;Ff_obj.RNQDluasaN=QP_obj.RNQDluasaN;var _hits=ER_fn(QP_obj,Ff_obj,a08_obj);var _arr=(_hits&&_hits.array)?_hits.array:_hits;if(_arr&&_arr.length>0&&_arr[0]&&_arr[0].point){var _p=_arr[0].point;var dd=Math.sqrt((_p.x-oX)*(_p.x-oX)+(_p.y-oY)*(_p.y-oY)+(_p.z-oZ)*(_p.z-oZ));if(dd<=MAXR&&dd<hitD){hitD=dd;hit={x:_p.x,y:_p.y,z:_p.z};hitType='map';var mNorm=(_arr[0].face&&_arr[0].face.normal)?_arr[0].face.normal:(_arr[0].normal||null);if(mNorm){var nlen=Math.sqrt(mNorm.x*mNorm.x+mNorm.y*mNorm.y+mNorm.z*mNorm.z)||1;hitNorm={x:mNorm.x/nlen,y:mNorm.y/nlen,z:mNorm.z/nlen};}else{if(fY<-0.2)hitNorm={x:0,y:1,z:0};else hitNorm={x:-fX,y:-fY,z:-fZ};}}}}catch(eM){}}try{var _gh=__dsRaycastGlooWalls(oX,oY,oZ,fX,fY,fZ,MAXR);if(_gh&&_gh.dist<=MAXR&&_gh.dist<hitD){hitD=_gh.dist;hit=_gh.point;hitType='gloo';attId=_gh.attId;hitNorm=_gh.normal;}}catch(eG){}if((!hit||hitType!=='gloo')&&rcOK&&_glooRc&&_glooVOrig&&_glooVDir){try{var _targets=(window.__dsGlooGroup&&window.__dsGlooGroup.children&&window.__dsGlooGroup.children.length)?window.__dsGlooGroup.children:[];if(!_targets.length&&window.__dsGlooMeshes&&window.__dsGlooMeshes.size){window.__dsGlooMeshes.forEach(function(m){if(m)_targets.push(m);});}if(_targets.length){_glooVOrig.set(oX,oY,oZ);_glooVDir.set(fX,fY,fZ);_glooRc.set(_glooVOrig,_glooVDir);_glooRc.far=MAXR;var _threeHits=_glooRc.intersectObjects(_targets,true);var _tha=(_threeHits&&_threeHits.array)?_threeHits.array:_threeHits;if(_tha&&_tha.length>0&&_tha[0]&&_tha[0].point){var _t0=_tha[0];var td=(_t0.distance!==undefined)?_t0.distance:Math.sqrt((_t0.point.x-oX)*(_t0.point.x-oX)+(_t0.point.y-oY)*(_t0.point.y-oY)+(_t0.point.z-oZ)*(_t0.point.z-oZ));if(td<=MAXR&&td<hitD){hitD=td;hit={x:_t0.point.x,y:_t0.point.y,z:_t0.point.z};hitType='gloo';attId=(_t0.object&&_t0.object.__dsGlooId)||0;if(_t0.face&&_t0.face.normal){var fn=_t0.face.normal,obj=_t0.object;if(obj&&obj.rotation){var cosR=Math.cos(obj.rotation.y),sinR=Math.sin(obj.rotation.y);var wxN=fn.x*cosR+fn.z*sinR,wyN=fn.y,wzN=-fn.x*sinR+fn.z*cosR;var wnlen=Math.sqrt(wxN*wxN+wyN*wyN+wzN*wzN)||1;var nX=wxN/wnlen,nY=wyN/wnlen,nZ=wzN/wnlen;if(fX*nX+fY*nY+fZ*nZ>0){nX=-nX;nY=-nY;nZ=-nZ;}hitNorm={x:nX,y:nY,z:nZ};}else{var fnlen=Math.sqrt(fn.x*fn.x+fn.y*fn.y+fn.z*fn.z)||1;hitNorm={x:fn.x/fnlen,y:fn.y/fnlen,z:fn.z/fnlen};}}else{hitNorm={x:-fX,y:-fY,z:-fZ};}}}}}catch(eG2){}}if(!hit&&fY<0.65){var flDist=3.5;if(fY<-0.05){flDist=Math.min(16.0,Math.max(2.0,1.2/(-fY)));}var fx2=oX+fXh*flDist,fz2=oZ+fZh*flDist;var gyHit=null;if(erOK){try{if(a08_obj.origin&&a08_obj.origin.set)a08_obj.origin.set(fx2+0.001,oY+1.0,fz2+0.001);if(a08_obj.klYMxzxpTL&&a08_obj.klYMxzxpTL.set)a08_obj.klYMxzxpTL.set(0,-1,0);if(a08_obj.dest&&a08_obj.dest.set)a08_obj.dest.set(fx2+0.006,py-5.0,fz2+0.006);a08_obj.far=Math.max(6.0,oY-py+6.0);Ff_obj.RNQDluasaN=QP_obj.RNQDluasaN;var _gh2=ER_fn(QP_obj,Ff_obj,a08_obj);var _ga2=(_gh2&&_gh2.array)?_gh2.array:_gh2;if(_ga2&&_ga2.length>0&&_ga2[0]&&_ga2[0].point){gyHit=_ga2[0].point.y;}}catch(eFl){}}var finalY=(gyHit!==null)?gyHit:py;hit={x:fx2,y:finalY,z:fz2};hitNorm={x:0,y:1,z:0};hitType='ground';}if(!hit||!hitNorm){_glooCandRes.x=0;_glooCandRes.y=0;_glooCandRes.z=0;_glooCandRes.yaw=camYaw;_glooCandRes.valid=!1;_glooCandRes.att=0;_glooCandRes.how='no-hit';return _glooCandRes;}var cX=hit.x+hitNorm.x*halfThick;var cY=hit.y+hitNorm.y*halfThick;var cZ=hit.z+hitNorm.z*halfThick;var yaw=camYaw;var how=hitType;if(hitNorm.y>0.7){how='ground-'+hitType;var baseY=hit.y;if(erOK){try{var lX=cX-fZh*1.5,lZ=cZ+fXh*1.5;var rX=cX+fZh*1.5,rZ=cZ-fXh*1.5;if(a08_obj.origin&&a08_obj.origin.set)a08_obj.origin.set(lX+0.001,baseY+2.5,lZ+0.001);if(a08_obj.klYMxzxpTL&&a08_obj.klYMxzxpTL.set)a08_obj.klYMxzxpTL.set(0,-1,0);if(a08_obj.dest&&a08_obj.dest.set)a08_obj.dest.set(lX+0.006,baseY-5.0,lZ+0.006);a08_obj.far=7.5;var _gl=ER_fn(QP_obj,Ff_obj,a08_obj);var _gal=(_gl&&_gl.array)?_gl.array:_gl;if(_gal&&_gal.length>0&&_gal[0]&&_gal[0].point){if(_gal[0].point.y>baseY-0.01&&_gal[0].point.y<=oY)baseY=Math.max(baseY,_gal[0].point.y);}if(a08_obj.origin&&a08_obj.origin.set)a08_obj.origin.set(rX+0.001,baseY+2.5,rZ+0.001);if(a08_obj.klYMxzxpTL&&a08_obj.klYMxzxpTL.set)a08_obj.klYMxzxpTL.set(0,-1,0);if(a08_obj.dest&&a08_obj.dest.set)a08_obj.dest.set(rX+0.006,baseY-5.0,rZ+0.006);a08_obj.far=7.5;var _gr=ER_fn(QP_obj,Ff_obj,a08_obj);var _gar=(_gr&&_gr.array)?_gr.array:_gr;if(_gar&&_gar.length>0&&_gar[0]&&_gar[0].point){if(_gar[0].point.y>baseY-0.01&&_gar[0].point.y<=oY)baseY=Math.max(baseY,_gar[0].point.y);}}catch(eSlope){}}cY=baseY+0.01;yaw=camYaw;}else{how='wall-'+hitType;yaw=camYaw;}if(!isFinite(cX)||!isFinite(cY)||!isFinite(cZ)||!isFinite(yaw)){_glooCandRes.x=0;_glooCandRes.y=0;_glooCandRes.z=0;_glooCandRes.yaw=camYaw;_glooCandRes.valid=!1;_glooCandRes.att=0;_glooCandRes.how='bad';return _glooCandRes;}_glooCandRes.x=cX;_glooCandRes.y=cY;_glooCandRes.z=cZ;_glooCandRes.yaw=yaw;_glooCandRes.valid=!0;_glooCandRes.att=attId;_glooCandRes.how=how;return _glooCandRes;}catch(eC){return {x:0,y:0,z:0,yaw:0,valid:!1,att:0,how:'err',dbg:{err:String(eC)}};}};window.__dsGlooFrameUpdate=function(){try{var isEquipped=!!(window.__dsGlooState&&window.__dsGlooState.equipped);__setGlooViewmodelVisible(!isEquipped);}catch(e){}};try{window.addEventListener('keydown',function(e){try{if(document.activeElement&&(document.activeElement.tagName==='INPUT'||document.activeElement.tagName==='TEXTAREA'))return;if(e.repeat)return;if(e.keyCode===81||e.code==='KeyQ'||e.key==='q'||e.key==='Q'){if(window.__dsCancelReload)window.__dsCancelReload();if(window.__dsGlooState)window.__dsGlooState.equip();}else if(e.keyCode===82||e.code==='KeyR'||e.key==='r'||e.key==='R'){if(window.__dsGlooState&&window.__dsGlooState.equipped){e.preventDefault();e.stopPropagation();window.__dsGlooState.unequip();}}else if(e.keyCode===49||e.keyCode===50||e.keyCode===51||e.code==='Digit1'||e.code==='Digit2'||e.code==='Digit3'){if(window.__dsCancelReload)window.__dsCancelReload();if(window.__dsGlooState)window.__dsGlooState.unequip();}}catch(err){}},!0);}catch(e){};try{window.addEventListener('mousedown',function(e){try{if(e.button!==0)return;if(window.__dsGlooState&&window.__dsGlooState.equipped){e.preventDefault();e.stopPropagation();if(typeof Wt!=='undefined')Wt=!1;if(window.__dsGlooQuickDeploy)window.__dsGlooQuickDeploy();}}catch(err){}},!0);}catch(e){};window.__dsGlooQuickDeploy=function(){try{var now=Date.now();window.__dsLastGlooDeploy=now;var MAXR=24.0,halfThick=0.23;var cam=(typeof Td!=='undefined'&&Td)?Td:((typeof T2!=='undefined'&&T2)?T2:window.__dsCamera);var player=(typeof SW!=='undefined'&&SW)?SW:window.__dsLocalPlayer;var oX=0,oY=0,oZ=0,fX=0,fY=-0.0001,fZ=-1,camYaw=0,haveCam=!1;var ER_fn=(typeof ER==='function')?ER:window.__dsER;var QP_obj=(typeof QP!=='undefined'&&QP)?QP:window.__dsQP;var Ff_obj=(typeof Ff!=='undefined'&&Ff)?Ff:window.__dsFf;var a08_obj=(typeof a08!=='undefined'&&a08)?a08:window.__dsa08;var erOK=(typeof ER_fn==='function'&&QP_obj&&Ff_obj&&a08_obj);var THREE=(typeof usvzFuAsEB!=='undefined'&&usvzFuAsEB)?usvzFuAsEB:window.__dsTHREE;try{if(erOK&&a08_obj.setFromCamera&&cam&&cam.isPerspectiveCamera){if(cam.updateWorldMatrix)cam.updateWorldMatrix(true,!1);a08_obj.setFromCamera(0,0,cam);if(a08_obj.origin){oX=a08_obj.origin.x;oY=a08_obj.origin.y;oZ=a08_obj.origin.z;}if(a08_obj.klYMxzxpTL){fX=a08_obj.klYMxzxpTL.x;fY=a08_obj.klYMxzxpTL.y;fZ=a08_obj.klYMxzxpTL.z;}haveCam=!0;}else if(cam){if(cam.updateWorldMatrix)cam.updateWorldMatrix(true,!1);if(cam.matrixWorld&&cam.matrixWorld.elements){var _me=cam.matrixWorld.elements;var mx=-_me[8],my=-_me[9],mz=-_me[10];var ml=Math.sqrt(mx*mx+my*my+mz*mz)||1;fX=mx/ml;fY=my/ml;fZ=mz/ml;oX=_me[12];oY=_me[13];oZ=_me[14];haveCam=!0;}}}catch(eC){}if(!haveCam&&player&&player.position){oX=player.position.x;oY=player.position.y;oZ=player.position.z;}if(Math.abs(fX)<0.0001)fX=0.0001;if(Math.abs(fY)<0.0001)fY=0.0001;if(Math.abs(fZ)<0.0001)fZ=0.0001;var fnl=Math.sqrt(fX*fX+fY*fY+fZ*fZ)||1;fX/=fnl;fY/=fnl;fZ/=fnl;var fhl=Math.sqrt(fX*fX+fZ*fZ);var fXh=0,fZh=0;if(fhl>0.001){fXh=fX/fhl;fZh=fZ/fhl;camYaw=Math.atan2(-fXh,-fZh);}else{camYaw=(typeof WY!=='undefined'&&WY&&typeof RY!=='undefined'&&WY[RY])?(WY[RY].y||0):0;}var px=haveCam?oX:((player&&player.position)?player.position.x:0);var py=haveCam?(oY-2.4):((player&&player.position)?(player.position.y-2.4):0);var pz=haveCam?oZ:((player&&player.position)?player.position.z:0);var hit=null,hitD=MAXR+1,hitNorm=null,hitType=null,attId=0;var rcOK=(THREE&&THREE['iNMXuHIoAx']&&THREE['gURkzCzeY']);if(fY<-0.70){hitD=1.1;hit={x:oX+fXh*1.1,y:py+0.01,z:oZ+fZh*1.1};hitNorm={x:0,y:1,z:0};hitType='fast-floor';}else{if(erOK){try{if(a08_obj.origin&&a08_obj.origin.set)a08_obj.origin.set(oX+0.001,oY+0.001,oZ+0.001);if(a08_obj.klYMxzxpTL&&a08_obj.klYMxzxpTL.set)a08_obj.klYMxzxpTL.set(fX,fY,fZ);if(a08_obj.dest&&a08_obj.dest.set)a08_obj.dest.set(oX+fX*MAXR+0.006,oY+fY*MAXR+0.006,oZ+fZ*MAXR+0.006);a08_obj.far=MAXR;Ff_obj.RNQDluasaN=QP_obj.RNQDluasaN;var _hits=ER_fn(QP_obj,Ff_obj,a08_obj);var _arr=(_hits&&_hits.array)?_hits.array:_hits;if(_arr&&_arr.length>0&&_arr[0]&&_arr[0].point){var _p=_arr[0].point;var dd=Math.sqrt((_p.x-oX)*(_p.x-oX)+(_p.y-oY)*(_p.y-oY)+(_p.z-oZ)*(_p.z-oZ));if(dd<=MAXR&&dd<hitD){hitD=dd;hit={x:_p.x,y:_p.y,z:_p.z};hitType='map';var mNorm=(_arr[0].face&&_arr[0].face.normal)?_arr[0].face.normal:(_arr[0].normal||null);if(mNorm){var nlen=Math.sqrt(mNorm.x*mNorm.x+mNorm.y*mNorm.y+mNorm.z*mNorm.z)||1;hitNorm={x:mNorm.x/nlen,y:mNorm.y/nlen,z:mNorm.z/nlen};}else{if(fY<-0.2)hitNorm={x:0,y:1,z:0};else hitNorm={x:-fX,y:-fY,z:-fZ};}}}}catch(eM){}}try{var _gh=__dsRaycastGlooWalls(oX,oY,oZ,fX,fY,fZ,MAXR);if(_gh&&_gh.dist<=MAXR&&_gh.dist<hitD){hitD=_gh.dist;hit=_gh.point;hitType='gloo';attId=_gh.attId;hitNorm=_gh.normal;}}catch(eG){}if((!hit||hitType!=='gloo')&&rcOK&&_glooRc&&_glooVOrig&&_glooVDir){try{var _targets=(window.__dsGlooGroup&&window.__dsGlooGroup.children&&window.__dsGlooGroup.children.length)?window.__dsGlooGroup.children:[];if(!_targets.length&&window.__dsGlooMeshes&&window.__dsGlooMeshes.size){window.__dsGlooMeshes.forEach(function(m){if(m)_targets.push(m);});}if(_targets.length){_glooVOrig.set(oX,oY,oZ);_glooVDir.set(fX,fY,fZ);_glooRc.set(_glooVOrig,_glooVDir);_glooRc.far=MAXR;var _threeHits=_glooRc.intersectObjects(_targets,true);var _tha=(_threeHits&&_threeHits.array)?_threeHits.array:_threeHits;if(_tha&&_tha.length>0&&_tha[0]&&_tha[0].point){var _t0=_tha[0];var td=(_t0.distance!==undefined)?_t0.distance:Math.sqrt((_t0.point.x-oX)*(_t0.point.x-oX)+(_t0.point.y-oY)*(_t0.point.y-oY)+(_t0.point.z-oZ)*(_t0.point.z-oZ));if(td<=MAXR&&td<hitD){hitD=td;hit={x:_t0.point.x,y:_t0.point.y,z:_t0.point.z};hitType='gloo';attId=(_t0.object&&_t0.object.__dsGlooId)||0;if(_t0.face&&_t0.face.normal){var fn=_t0.face.normal,obj=_t0.object;if(obj&&obj.rotation){var cosR=Math.cos(obj.rotation.y),sinR=Math.sin(obj.rotation.y);var wxN=fn.x*cosR+fn.z*sinR,wyN=fn.y,wzN=-fn.x*sinR+fn.z*cosR;var wnlen=Math.sqrt(wxN*wxN+wyN*wyN+wzN*wzN)||1;var nX=wxN/wnlen,nY=wyN/wnlen,nZ=wzN/wnlen;if(fX*nX+fY*nY+fZ*nZ>0){nX=-nX;nY=-nY;nZ=-nZ;}hitNorm={x:nX,y:nY,z:nZ};}else{var fnlen=Math.sqrt(fn.x*fn.x+fn.y*fn.y+fn.z*fn.z)||1;hitNorm={x:fn.x/fnlen,y:fn.y/fnlen,z:fn.z/fnlen};}}else{hitNorm={x:-fX,y:-fY,z:-fZ};}}}}}catch(eG2){}}if(!hit&&fY<-0.05){var flDist=Math.min(16.0,Math.max(1.5,1.2/(-fY)));var fx2=oX+fXh*flDist,fz2=oZ+fZh*flDist;var gyHit=null;if(erOK){try{if(a08_obj.origin&&a08_obj.origin.set)a08_obj.origin.set(fx2+0.001,oY+1.0,fz2+0.001);if(a08_obj.klYMxzxpTL&&a08_obj.klYMxzxpTL.set)a08_obj.klYMxzxpTL.set(0,-1,0);if(a08_obj.dest&&a08_obj.dest.set)a08_obj.dest.set(fx2+0.006,py-5.0,fz2+0.006);a08_obj.far=Math.max(6.0,oY-py+6.0);Ff_obj.RNQDluasaN=QP_obj.RNQDluasaN;var _gh2=ER_fn(QP_obj,Ff_obj,a08_obj);var _ga2=(_gh2&&_gh2.array)?_gh2.array:_gh2;if(_ga2&&_ga2.length>0&&_ga2[0]&&_ga2[0].point){gyHit=_ga2[0].point.y;}}catch(eFl){}}var finalY=(gyHit!==null)?gyHit:py;hit={x:fx2,y:finalY,z:fz2};hitNorm={x:0,y:1,z:0};hitType='ground';}}if(!hit||!hitNorm){try{console.warn('[GLOO] quick deploy ignored: no 3D collision target (fY='+fY.toFixed(2)+')');}catch(eIgn){}return 'no-target';}var cX=hit.x+hitNorm.x*halfThick;var cY=hit.y+hitNorm.y*halfThick;var cZ=hit.z+hitNorm.z*halfThick;var yaw=camYaw;var how=hitType;if(hitNorm.y>0.7){how='ground-'+hitType;var baseY=hit.y;if(erOK){try{var lX=cX-fZh*1.5,lZ=cZ+fXh*1.5;var rX=cX+fZh*1.5,rZ=cZ-fXh*1.5;if(a08_obj.origin&&a08_obj.origin.set)a08_obj.origin.set(lX+0.001,baseY+2.5,lZ+0.001);if(a08_obj.klYMxzxpTL&&a08_obj.klYMxzxpTL.set)a08_obj.klYMxzxpTL.set(0,-1,0);if(a08_obj.dest&&a08_obj.dest.set)a08_obj.dest.set(lX+0.006,baseY-5.0,lZ+0.006);a08_obj.far=7.5;var _gl=ER_fn(QP_obj,Ff_obj,a08_obj);var _gal=(_gl&&_gl.array)?_gl.array:_gl;if(_gal&&_gal.length>0&&_gal[0]&&_gal[0].point){if(_gal[0].point.y>baseY-0.01&&_gal[0].point.y<=oY)baseY=Math.max(baseY,_gal[0].point.y);}if(a08_obj.origin&&a08_obj.origin.set)a08_obj.origin.set(rX+0.001,baseY+2.5,rZ+0.001);if(a08_obj.klYMxzxpTL&&a08_obj.klYMxzxpTL.set)a08_obj.klYMxzxpTL.set(0,-1,0);if(a08_obj.dest&&a08_obj.dest.set)a08_obj.dest.set(rX+0.006,baseY-5.0,rZ+0.006);a08_obj.far=7.5;var _gr=ER_fn(QP_obj,Ff_obj,a08_obj);var _gar=(_gr&&_gr.array)?_gr.array:_gr;if(_gar&&_gar.length>0&&_gar[0]&&_gar[0].point){if(_gar[0].point.y>baseY-0.01&&_gar[0].point.y<=oY)baseY=Math.max(baseY,_gar[0].point.y);}}catch(eSlope){}}cY=baseY+0.01;yaw=camYaw;}else{how='wall-'+hitType;yaw=camYaw;}if(!isFinite(cX)||!isFinite(cY)||!isFinite(cZ)||!isFinite(yaw)){return 'bad-coord';}var selfId=(typeof a0T!=='undefined'?a0T:1);var localId=-(Date.now()%10000000);__dsCreateGlooMesh(localId,selfId,cX,cY,cZ,yaw,100);__dsPlayGlooSfx();if(typeof setTimeout!=='undefined')setTimeout(function(){if(window.__dsGlooMeshes&&window.__dsGlooMeshes.has(localId)){var m=window.__dsGlooMeshes.get(localId);var sc=(typeof Tm!=='undefined'&&Tm)?Tm:window.__dsWorldScene;if(m){m.visible=false;if(m.parent)m.parent.remove(m);if(sc)sc.remove(m);if(window.__dsGlooGroup)window.__dsGlooGroup.remove(m);}window.__dsGlooMeshes.delete(localId);window.__dsGlooList=window.__dsGlooList.filter(function(w){return w.id!==localId;});}},2500);var r=window.__dsSendGlooDeploy(window.__dsGlooMkCmd(cX,cY,cZ,yaw,attId));window.__dsLastGlooResult=r;try{console.warn('[GLOO] quick -> '+r+' '+how+' @('+cX.toFixed(1)+','+cY.toFixed(1)+','+cZ.toFixed(1)+') att='+attId);}catch(e2){}return r;}catch(e){return 'err:'+e;}};window.__dsDiag={create:function(){try{if(window.__dsHandleGlooNet)window.__dsHandleGlooNet('__gloo:clear');Kq['OObFmbNOgbm'](false);return 'ok';}catch(e){return 'err:'+e;}},join:function(id){try{if(window.__dsHandleGlooNet)window.__dsHandleGlooNet('__gloo:clear');Kq['joinParty'](String(id));return 'ok';}catch(e){return 'err:'+e;}},ready:function(){try{Kq['aUHmwmhbrve']();return 'ok';}catch(e){return 'err:'+e;}},party:function(){try{var pid=(typeof a1y==='string'&&a1y)?a1y.toUpperCase():null;if(!pid&&Kq['psUqMaJVeTK']&&Kq['psUqMaJVeTK']['text']){var m=String(Kq['psUqMaJVeTK']['text']).match(new RegExp(':[ \\t]*([A-Z0-9]+)','i'));if(m)pid=m[1];}return {active:!!Kq['GJklRqbLTCs'],id:pid,members:(Kq['aMWaisFtZ']||[]).map(function(m){return {name:m.name,ready:m.ready,self:m.isSelf};})};}catch(e){return {err:String(e)};}},select:function(i){try{if(window.__dsCancelReload)window.__dsCancelReload();if(typeof L3==='undefined'||!L3||!L3[i])return 'noL3';L3[i].button.onclick();if(Kq['qaIlQNxrHk'])Kq['qaIlQNxrHk']();if(Kq['resume'])Kq['resume']();return 'ok';}catch(e){return 'err:'+e;}},clearGloo:function(){try{if(window.__dsHandleGlooNet)window.__dsHandleGlooNet('__gloo:clear');return 'ok';}catch(e){return 'err:'+e;}},deployGloo:function(x,y,z,yaw){try{var now=Date.now();window.__dsLastGlooDeploy=now;if(typeof x==='number'&&typeof z==='number'){return window.__dsSendGlooDeploy(window.__dsGlooMkCmd(x,typeof y==='number'?y:0,z,typeof yaw==='number'?yaw:0,0));}var c=window.__dsGlooComputeCandidate();window.__dsGlooCandidate=c;if(!c||!c.valid)return 'no-support';return window.__dsSendGlooDeploy(window.__dsGlooMkCmd(c.x,c.y,c.z,c.yaw,c.att));}catch(e){return 'err:'+e;}},getGlooWalls:function(){return (window.__dsGlooList||[]);},dump:function(){var out={};try{out.selfId=a0T;}catch(e){}try{out.v3=(V3||[]).map(function(e){return {id:e.MqaFuSJOX,model:!!e.r23ZS3L2g,visible:!!(e.r23ZS3L2g&&e.r23ZS3L2g.visible),pos:e.FShYTnMIW&&e.FShYTnMIW.position?{x:+e.FShYTnMIW.position.x.toFixed(2),y:+e.FShYTnMIW.position.y.toFixed(2),z:+e.FShYTnMIW.position.z.toFixed(2)}:null,hp:e.aTw7B6P5H};});}catch(e){out.v3err=String(e);}try{out.names=Object.keys(a0u||{}).map(function(k){return [k,a0u[k]];});}catch(e){}try{out.weapons=Object.keys(a0t||{}).map(function(k){return [k,a0t[k]];});}catch(e){}try{out.p9=!!P9;}catch(e){}try{out.qResult=window.__dsLastGlooResult||null;}catch(e){}try{out.glooEquipped=!!window.__dsGlooEquipped;}catch(e){}try{out.glooValid=window.__dsGlooCandidate?(window.__dsGlooCandidate.valid?1:0):null;}catch(e){}try{out.glooHow=window.__dsGlooCandidate?window.__dsGlooCandidate.how:null;}catch(e){}try{out.glooDbg=window.__dsGlooCandidate?window.__dsGlooCandidate.dbg:null;}catch(e){}try{out.v3d=(V3||[]).map(function(e){return {id:e.MqaFuSJOX, anim:e.KWDGbxvCc, fadeObj:e.yW38T38y4?{opacity:e.yW38T38y4.opacity,target:e.yW38T38y4.EafIbhzQZQ}:null, modelFade:e.r23ZS3L2g?e.r23ZS3L2g.VeumNtgVo:null, bodyFade:e['c7e']?e['c7e'].VKhBgchDQsr:null, pxxm:!!(e.KWC92ef2Y9&&e.KWC92ef2Y9.PxxmChYjxoE)};});}catch(e){}return out;}};";
        // Splice the bridge before the a1E anchor: that point is documented
        // (docs/bridge.md) to sit after the party methods are defined and in
        // the SAME scope as Kq (the posPatch anchor is not - Kq is out of
        // scope there and every __dsDiag call throws ReferenceError).
        var bi = i !== -1 ? i + (9) : at; // after ";Gq=!![];" at the a1E anchor
        src = src.slice(0, bi) + bridge + src.slice(bi);
        // 3-char party codes: relax the client joinParty 6-char validation
        // (Kq.joinParty: length>0x6 last-6 parse, length<0x6 reject -> 0x3).
        var jp = "a3o['length']>0x6&&(a3o=a3o['substr'](a3o['length']-0x6));if(a3o['length']<0x6){";
        var jr = "a3o['length']>0x3&&(a3o=a3o['substr'](a3o['length']-0x3));if(a3o['length']<0x3){";
        var ji = src.indexOf(jp);
        if (ji !== -1) src = src.slice(0,ji) + jr + src.slice(ji + jp.length);
        else { try{ window.__dsDiagErr = (window.__dsDiagErr ? window.__dsDiagErr + ' | ' : '') + 'no joinParty anchor'; }catch(e){} }
        // Gloo Wall Player Physical Collision: patch into kinematics/physics step
        var physTarget = "G4=EN(QP,SW,W2),SW['PhbhpxFxPP']=KN,EX(SW,V3);";
        var physReplace = "G4=EN(QP,SW,W2),SW['PhbhpxFxPP']=KN,EX(SW,V3);if(typeof V3!=='undefined'&&V3&&V3.length){for(var _vi=0;_vi<V3.length;_vi++){var _ent=V3[_vi];if(!_ent)continue;if(_ent['aTw7B6P5H']>0&&(!_ent['KWC92ef2Y9']||!_ent['KWC92ef2Y9']['PxxmChYjxoE'])){if(_ent['r23ZS3L2g']&&!_ent['r23ZS3L2g']['visible']){_ent['r23ZS3L2g']['visible']=true;window.__dsVisFix=(window.__dsVisFix||0)+1;}}}}if(window.__dsResolveGlooCollision){window.__dsResolveGlooCollision(SW);if(typeof V3!=='undefined'&&V3&&V3.length){for(var _vi=0;_vi<V3.length;_vi++){if(V3[_vi]&&V3[_vi].FShYTnMIW)window.__dsResolveGlooCollision(V3[_vi].FShYTnMIW);}}}if(window.__dsGlooFrameUpdate){try{window.__dsGlooFrameUpdate();}catch(eGFU){}}";
        var pi = src.indexOf(physTarget);
        if (pi !== -1) {
          src = src.slice(0, pi) + physReplace + src.slice(pi + physTarget.length);
        }
        // Weapon Reload Time Increase (+1s / 30 ticks across all weapon classes)
        var reloadTarget = "var Hx=Object['keys'](Hs);for(var tf=0x0;tf<Hx[ai1(0x3a2)];tf++){";
        var reloadReplace = "var Hx=Object['keys'](Hs);window.__dsHs=Hs;for(var tf=0x0;tf<Hx[ai1(0x3a2)];tf++){Hs[Hx[tf]][ai1(0x109e)]+=30;";
        var rli = src.indexOf(reloadTarget);
        if (rli !== -1) {
          src = src.slice(0, rli) + reloadReplace + src.slice(rli + reloadTarget.length);
        }
        // Remove Auto-Reload on Empty Magazine (manual reload with R only)
        var autoReloadTarget = "if((a5b[aqH(0x703)]||a56['xqItLdaOH']==0x0)&&!a56['krtmjJROjX']&&a56['xqItLdaOH']<a56[aqH(0x2d5)]['xqItLdaOH']){";
        var autoReloadReplace = "if((a5b[aqH(0x703)])&&!a56['krtmjJROjX']&&a56['xqItLdaOH']<a56[aqH(0x2d5)]['xqItLdaOH']){";
        var ari = src.indexOf(autoReloadTarget);
        if (ari !== -1) {
          src = src.slice(0, ari) + autoReloadReplace + src.slice(ari + autoReloadTarget.length);
        }
        
        // CS2 Deterministic Recoil Raycast Replacement in a1U
        var rayTarget = "var a3I=a3F*Math[aDW(0xba3)](a3G),a3J=a3H*0x2*Math['PI'];a08[aDW(0xe25)](a3I*Math[aDW(0xb69)](a3J)*0x9/0x10,a3I*Math['sin'](a3J),Td),";
        var rayReplace = "var _rc=(window.__dsComputeBulletOffset)?window.__dsComputeBulletOffset(SW,a3E,a0o,a3F,a3G,a3H):null;if(_rc){a08[aDW(0xe25)](_rc.x,_rc.y,Td);}else{var a3I=a3F*Math[aDW(0xba3)](a3G),a3J=a3H*0x2*Math['PI'];a08[aDW(0xe25)](a3I*Math[aDW(0xb69)](a3J)*0x9/0x10,a3I*Math['sin'](a3J),Td);};";
        var ryi = src.indexOf(rayTarget);
        if (ryi !== -1) {
          src = src.slice(0, ryi) + rayReplace + src.slice(ryi + rayTarget.length);
        }
        // CS2 Viewmodel Directional Recoil Kick Replacement in a1U
        var kickTarget = "YdshJUELZK[aDW(0x58a)]=Math['random']()-0.5,YdshJUELZK[aDW(0x50a)]=Math[aDW(0x4bd)]()-0.5;";
        var kickReplace = "var _kick=(window.__dsGetLastRecoilKick)?window.__dsGetLastRecoilKick(SW):null;if(_kick){YdshJUELZK[aDW(0x58a)]=_kick.kickX;YdshJUELZK[aDW(0x50a)]=_kick.kickY;}else{YdshJUELZK[aDW(0x58a)]=Math['random']()-0.5;YdshJUELZK[aDW(0x50a)]=Math[aDW(0x4bd)]()-0.5;}";
        var kci = src.indexOf(kickTarget);
        if (kci !== -1) {
          src = src.slice(0, kci) + kickReplace + src.slice(kci + kickTarget.length);
        }
        // Gloo Wall Bullet Absorption Hook in a1U (client raycast interception)
        var a3KTarget = "var a3K=ER(QP,Ff,a08),a3L,a3M,a3N=lrRnpundBY('T1P0J19B02U');";
        var a3KReplace = "var a3K=ER(QP,Ff,a08);if(window.__dsRaycastGlooWalls&&a08&&a08.origin&&a08.klYMxzxpTL){var _gw=window.__dsRaycastGlooWalls(a08.origin.x,a08.origin.y,a08.origin.z,a08.klYMxzxpTL.x,a08.klYMxzxpTL.y,a08.klYMxzxpTL.z,120);if(_gw&&(!a3K||!a3K.length||_gw.dist<a3K.array[0].distance||_gw.dist<a08.far)){a3K={length:1,array:[{distance:_gw.dist,point:_gw.point,face:{normal:_gw.normal},normal:_gw.normal}]};}}var a3L,a3M,a3N=lrRnpundBY('T1P0J19B02U');";
        var a3ki = src.indexOf(a3KTarget);
        if (a3ki !== -1) {
          src = src.slice(0, a3ki) + a3KReplace + src.slice(a3ki + a3KTarget.length);
        }
        // First-Person Viewmodel Hook: capture WX to toggle weapon and arms visibility
        var wxAnchor = "T2['add'](WX),WV['add'](Td);";
        var wxi = src.indexOf(wxAnchor);
        if (wxi !== -1) {
          src = src.slice(0, wxi + wxAnchor.length) + "window.__dsWX=WX;" + src.slice(wxi + wxAnchor.length);
        }
        // Gloo Wall Key Q Hook: inject into the game's core WM input loop
        var wmAnchor = "function WM(a3o,a3p){";
        var wmi = src.indexOf(wmAnchor);
        if (wmi !== -1) {
          var wmCode = "try{if(document.activeElement&&(document.activeElement.tagName==='INPUT'||document.activeElement.tagName==='TEXTAREA'))return;var _k=a3o?(a3o.keyCode||a3o.which):0;if(a3o&&a3o.type==='keydown'){if(!a3o.repeat){if(_k===81||a3o.code==='KeyQ'||a3o.key==='q'||a3o.key==='Q'){if(window.__dsCancelReload)window.__dsCancelReload();if(window.__dsGlooState)window.__dsGlooState.equip();return;}else if(_k===82||a3o.code==='KeyR'||a3o.key==='r'||a3o.key==='R'){if(window.__dsGlooState&&window.__dsGlooState.equipped){window.__dsGlooState.unequip();return;}}else if(_k===49||_k===50||_k===51||a3o.code==='Digit1'||a3o.code==='Digit2'||a3o.code==='Digit3'){if(window.__dsCancelReload)window.__dsCancelReload();if(window.__dsGlooState)window.__dsGlooState.unequip();}}}else if(_k===300||(a3o&&a3o.button===0)||(a3o&&a3o.type==='mousedown')){if(window.__dsGlooState&&window.__dsGlooState.equipped){if(typeof Wt!=='undefined')Wt=false;if(a3o.type!=='keyup'&&a3p!==false){if(window.__dsGlooQuickDeploy)window.__dsGlooQuickDeploy();}return;}}}catch(e){}";
          src = src.slice(0, wmi + wmAnchor.length) + wmCode + src.slice(wmi + wmAnchor.length);
        }
        // Gloo Wall Packet Interception: patch kM86hVW024 directly in a0I before J3 binding
        var chatTarget = "'kM86hVW024':function(a3o){var aCw=ai1;";
        var chatReplace = "'kM86hVW024':function(a3o){if(a3o&&a3o['string']&&typeof a3o['string']==='string'&&a3o['string'].indexOf('__gloo:')===0){window.__dsHandleGlooNet(a3o['string']);return;}var aCw=ai1;";
        var ci = src.indexOf(chatTarget);
        if (ci !== -1) {
          src = src.slice(0, ci) + chatReplace + src.slice(ci + chatTarget.length);
        }
        // 1. Remove Latest Update section and Patch Notes button
        var _BS = String.fromCharCode(92);
        var _Q = String.fromCharCode(34);
        var luTarget = "if(!Gj){a8z['add'](Mj(a3k,'Latest" + _BS + "x20Update:'";
        var luReplace = "a8z['visible']=![],a8z['opacity']=0;if(![]){a8z['add'](Mj(a3k,'Latest" + _BS + "x20Update:'";
        var luI = src.indexOf(luTarget);
        if (luI !== -1) src = src.slice(0, luI) + luReplace + src.slice(luI + luTarget.length);

        // 2. Remove Sign In With Google & Log In buttons from home screen
        var liTarget = "var a8b=new a3D('Log" + _BS + "x20In',0x69,0x32,0x14);";
        var liReplace = "var a8b=new a3D('Log" + _BS + "x20In',0x69,0x32,0x14);a8b['visible']=![],a8b['r23ZS3L2g']['visible']=![],a8b['r23ZS3L2g']['opacity']=0;";
        var liI = src.indexOf(liTarget);
        if (liI !== -1) src = src.slice(0, liI) + liReplace + src.slice(liI + liTarget.length);

        var gTarget = "var a8h=new a3D('Sign" + _BS + "x20in" + _BS + "x20with" + _BS + "x20Google',0x122,0x32,0x14);";
        var gReplace = "var a8h=new a3D('Sign" + _BS + "x20in" + _BS + "x20with" + _BS + "x20Google',0x122,0x32,0x14);a8h['visible']=![],a8h['r23ZS3L2g']['visible']=![],a8h['r23ZS3L2g']['opacity']=0,a8h['ReDNKHkwk']=![];";
        var gI = src.indexOf(gTarget);
        if (gI !== -1) src = src.slice(0, gI) + gReplace + src.slice(gI + gTarget.length);

        // 3. Hide & neutralize Daily/Weekly/Event Challenges UI
        var ch1 = "a6h['add'](a6g),Mm['add'](a6h),Kq[" + _Q + "eglp" + _Q + "]=a6h;";
        var ch1R = "a6h['add'](a6g),/*Mm['add'](a6h),*/a6h['visible']=![],a6g['visible']=![],Kq[" + _Q + "eglp" + _Q + "]=a6h;";
        var ch1I = src.indexOf(ch1);
        if (ch1I !== -1) src = src.slice(0, ch1I) + ch1R + src.slice(ch1I + ch1.length);

        var ch2 = ",Kq['nwxurZsxI']['add'](a6D);";
        var ch2R = ",a6D['visible']=![];";
        var ch2I = src.indexOf(ch2);
        if (ch2I !== -1) src = src.slice(0, ch2I) + ch2R + src.slice(ch2I + ch2.length);

        var ch3 = "a6B[" + _Q + "ReDNKHkwk" + _Q + "]=!![];ah4==undefined";
        var ch3R = "a6B[" + _Q + "ReDNKHkwk" + _Q + "]=![],a6B['visible']=![];ah4==undefined";
        var ch3I = src.indexOf(ch3);
        if (ch3I !== -1) src = src.slice(0, ch3I) + ch3R + src.slice(ch3I + ch3.length);

        // 4. Remove Join the community (Discord) button and text
        var dcTarget = "!Gj&&a6O['add'](a72);a6O[" + _Q + "add" + _Q + "](a6Z[" + _Q + "r23ZS3L2g" + _Q + "]),Mu['fAdWFGQLqES'](a6Z);";
        var dcReplace = "/*Discord removed*/a6Z['visible']=![],a6Z['r23ZS3L2g']['visible']=![],a72['visible']=![],a6O['visible']=![];";
        var dcI = src.indexOf(dcTarget);
        if (dcI !== -1) src = src.slice(0, dcI) + dcReplace + src.slice(dcI + dcTarget.length);

        // 5. Remove Terms, Privacy, Partner, and Contact footer links
        var tpTarget = "a7g['Terms']='terms.html',a7g['Privacy']=" + _Q + "privacy.html" + _Q + ",a7g[" + _Q + "Partners" + _Q + "]='partners.html',a7g['Contact']=" + _Q + "contact.html" + _Q + ";";
        var tpReplace = "/*Terms Privacy removed*/;";
        var tpI = src.indexOf(tpTarget);
        if (tpI !== -1) src = src.slice(0, tpI) + tpReplace + src.slice(tpI + tpTarget.length);

        // 6. Remove Shop, Locker, and Leaderboard from the top navigation bar
        var navTarget = "var a8E=['PLAY" + _BS + "x20GAME'," + _Q + "SETTINGS" + _Q + ",'SHOP'," + _Q + "LOCKER" + _Q + ",'LEADERBOARD'," + _Q + "ACCOUNT" + _Q + "];Gj&&(a8E=['PLAY" + _BS + "x20GAME'," + _Q + "SETTINGS" + _Q + ",'SHOP'," + _Q + "LOCKER" + _Q + ",'ACCOUNT'," + _Q + "LEADERBOARD" + _Q + "]);var a8F=0x5;";
        var navReplace = "var a8E=['PLAY" + _BS + "x20GAME'," + _Q + "SETTINGS" + _Q + "," + _Q + "ACCOUNT" + _Q + "];Gj&&(a8E=['PLAY" + _BS + "x20GAME'," + _Q + "SETTINGS" + _Q + "," + _Q + "ACCOUNT" + _Q + "]);var a8F=0x2;";
        var navI = src.indexOf(navTarget);
        if (navI !== -1) src = src.slice(0, navI) + navReplace + src.slice(navI + navTarget.length);

        // 7. Inject dedicated Mobile Gloo Wall HUD button and layout positioning
        var glooBtnAnchor = "var a4S=a4Q,a4Q=new a3G('pause.png',";
        var glooBtnIdx = src.indexOf(glooBtnAnchor);
        if (glooBtnIdx !== -1) {
          var glooBtnCode = "var a4QGloo=new a3G('gloo.png',0x96*a4N);a4I['fAdWFGQLqES'](a4QGloo);a4QGloo['r23ZS3L2g']['position']['set'](-0x180,-0x200+0x190*a4N);a4QGloo['xhOdNSwMWQd'](!![]);a4QGloo['name']='gloo';a4QGloo['validateCollision']=a4QGloo['validateCollision2'];a4QGloo['onmousedown3']=function(){if(typeof KG!=='undefined'&&KG)return;if(window.__dsCancelReload)window.__dsCancelReload();if(window.__dsGlooQuickDeploy)window.__dsGlooQuickDeploy();};a4QGloo['onmouseup2']=function(){};a4QGloo['onclick']=a4QGloo['onmouseup2'];window.__dsGlooButton=a4QGloo;";
          src = src.slice(0, glooBtnIdx) + glooBtnCode + src.slice(glooBtnIdx);
        }
        var glooLayoutAnchor = "Nc[" + _Q + "r23ZS3L2g" + _Q + "]['position']['x']=Kq['qIySEZgti']['siccypZlKyH']+0xc8*a4O,Nc['xhOdNSwMWQd'](!![]);";
        var glooLayoutIdx = src.indexOf(glooLayoutAnchor);
        if (glooLayoutIdx !== -1) {
          var glooLayoutCode = "if(window.__dsGlooButton&&window.__dsGlooButton['r23ZS3L2g']&&Kq&&Kq['qIySEZgti']){window.__dsGlooButton['r23ZS3L2g']['position']['x']=Kq['qIySEZgti']['siccypZlKyH']+0x170*a4O;window.__dsGlooButton['r23ZS3L2g']['position']['y']=-0x200+0x190*a4N;window.__dsGlooButton['xhOdNSwMWQd'](!![]);}";
          src = src.slice(0, glooLayoutIdx + glooLayoutAnchor.length) + glooLayoutCode + src.slice(glooLayoutIdx + glooLayoutAnchor.length);
        }

        // 8. Fix Settings Close bug and eliminate Crosshair Preview WebGL loop leak causing ~200ms periodic stutter
        var p1Target = _Q + "Kq[arY(0xbbd)]=function(){var au5=arY;a8P&&a8Z!=undefined&&a8Z['preview']!=undefined&&a8Z['preview'][au5(0x402)]();};" + _Q;
        var p1Replace = _Q + "Kq[arY(0xbbd)]=function(){var au5=arY;if(!a8P||!a8Y||!a8Z||!a8Z['preview'])return;var _el=a8Z['elem'];if(!_el||!_el.isConnected||!_el.offsetParent)return;a8Z['preview'][au5(0x402)]();};" + _Q;
        var p1I = src.indexOf(eval(p1Target));
        if (p1I !== -1) { var rawP1 = eval(p1Target); src = src.slice(0, p1I) + eval(p1Replace) + src.slice(p1I + rawP1.length); }

        var p2Target = _Q + "Kq['renderCrosshairPreview']!=undefined&&Kq['renderCrosshairPreview']();" + _Q;
        var p2Replace = _Q + "if(typeof a8P!=='undefined'&&a8P&&typeof a8Y!=='undefined'&&a8Y)Kq['renderCrosshairPreview']();" + _Q;
        var p2I = src.indexOf(eval(p2Target));
        if (p2I !== -1) { var rawP2 = eval(p2Target); src = src.slice(0, p2I) + eval(p2Replace) + src.slice(p2I + rawP2.length); }

        var p3Target = _Q + "function agb(){var awR=arY;a8Q()," + _Q;
        var p3Replace = _Q + "function agb(){var awR=arY;a8R()," + _Q;
        var p3I = src.indexOf(eval(p3Target));
        if (p3I !== -1) { var rawP3 = eval(p3Target); src = src.slice(0, p3I) + eval(p3Replace) + src.slice(p3I + rawP3.length); }

        var p4Target = _Q + "function a9h(){var auq=arY;a8Q()," + _Q;
        var p4Replace = _Q + "function a9h(){var auq=arY;a8R()," + _Q;
        var p4I = src.indexOf(eval(p4Target));
        if (p4I !== -1) { var rawP4 = eval(p4Target); src = src.slice(0, p4I) + eval(p4Replace) + src.slice(p4I + rawP4.length); }

        var p5Target = _Q + "agb();a8K['dom']['s']['visibility']!=awP(0x5c5)&&a8Q();" + _Q;
        var p5Replace = _Q + "agb();a8R();" + _Q;
        var p5I = src.indexOf(eval(p5Target));
        if (p5I !== -1) { var rawP5 = eval(p5Target); src = src.slice(0, p5I) + eval(p5Replace) + src.slice(p5I + rawP5.length); }

        var p6Target = _Q + "let ah8=a8K[atU(0x9e6)];ah8[atU(0x774)][atU(0x944)](),a8K['dom']['s'][atU(0x40e)]=0x0," + _Q;
        var p6Replace = _Q + "let ah8=a8K[atU(0x9e6)];a8R()," + _Q;
        var p6I = src.indexOf(eval(p6Target));
        if (p6I !== -1) { var rawP6 = eval(p6Target); src = src.slice(0, p6I) + eval(p6Replace) + src.slice(p6I + rawP6.length); }

        // 9. Inject Gyroscope Controls & Sensitivity into Settings (Rw array)
        var p9Target = "Ru,Rv,{'type':0x1,'id':'sensitivity'";
        var p9Replace = "Ru,Rv,{'type':0x2,'id':'gyro_enabled','text':'Gyroscope:','category':'FRF6r51VY32','default':!![],'PNiTcTcLjni':[],'ReDNKHkwk':!![],'onchange':function(a3l){if(window.__dsGyro)window.__dsGyro.enabled=!!a3l;}},{'type':0x1,'id':'gyro_sensitivity','text':'Gyro Sensitivity:','category':'FRF6r51VY32','default':1.5,'minvalue':0.1,'maxvalue':5.0,'step':0.05,'PNiTcTcLjni':[],'ReDNKHkwk':!![],'onchange':function(a3l){if(window.__dsGyro)window.__dsGyro.sensitivity=Number(a3l);}},{'type':0x2,'id':'gyro_invert_y','text':'Invert Gyro Y:','category':'FRF6r51VY32','default':![],'PNiTcTcLjni':[],'ReDNKHkwk':!![],'onchange':function(a3l){if(window.__dsGyro)window.__dsGyro.invertY=!!a3l;}},{'type':0x2,'id':'gyro_invert_x','text':'Invert Gyro X:','category':'FRF6r51VY32','default':![],'PNiTcTcLjni':[],'ReDNKHkwk':!![],'onchange':function(a3l){if(window.__dsGyro)window.__dsGyro.invertX=!!a3l;}},{'type':0x1,'id':'sensitivity'";
        var p9I = src.indexOf(p9Target);
        if (p9I !== -1) src = src.slice(0, p9I) + p9Replace + src.slice(p9I + p9Target.length);

        // 10. Inject Gyro Look into a34() input loop
        var p10Target = "SW['nVQNEtZqJ']=WY,SW['XROrmxcpbW']=WV;while(WY[RY]['y']>=Qz){";
        var p10Replace = "SW['nVQNEtZqJ']=WY,SW['XROrmxcpbW']=WV;if(window.__dsGyroTick){window.__dsGyroTick(function(dy,dp){WY[RY]['y']+=dy;X7+=dp;});}while(WY[RY]['y']>=Qz){";
        var p10I = src.indexOf(p10Target);
        if (p10I !== -1) src = src.slice(0, p10I) + p10Replace + src.slice(p10I + p10Target.length);
      }catch(e){ try{ window.__dsDiagErr = String(e); }catch(e2){} }
      return src;
    };
  }catch(e){ window.__dsPosPatch = 'err2:' + String(e); }
})();`;
function buildPage(clientDir) {
  const index = fs.readFileSync(path2.join(clientDir, "index.html"), "utf8");
  let page = "<script>" + BUNDLE_PATCH_SRC + "</script>\n" + SHIM_TAG + LOCAL_LOGIN_TAG + index;
  if (!page.includes(ACBIUZW_ANCHOR)) throw new Error("aCbiuzw anchor missing");
  page = page.replace(ACBIUZW_ANCHOR, ACBIUZW_PATCH);
  if (!page.includes(SEAM)) throw new Error("eval seam missing");
  page = page.replace(SEAM, SEAM + ",EnJV2g=patchBundle(EnJV2g)");
  return page;
}
var MIME = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".gz": "application/gzip",
  ".pkg": "application/octet-stream",
  ".glb": "model/gltf-binary",
  ".drc": "application/octet-stream",
  ".ktx2": "application/octet-stream",
  ".bin": "application/octet-stream",
  ".obj": "text/plain"
};
function startGameplayServer({ httpPort = 8080, mmPort = 8081, clientDir: optClientDir, verifiedMaps: optVerifiedMaps } = {}) {
  const clientDir = optClientDir || process.env.GP_CLIENT_DIR || path2.join(ROOT, "client");
  const rawDir = process.env.GP_RAW_DIR || path2.join(ROOT, "raw");
  const patched = buildPage(clientDir);
  log("page patched (" + patched.length + " bytes)");
  const httpServer = http.createServer((req, res) => {
    let p;
    try {
      p = decodeURIComponent(req.url.split("?")[0]);
    } catch {
      res.writeHead(400);
      res.end();
      return;
    }
    if (p !== "/debug-state") log(req.method, p);
    if (p === "/debug-state") {
      try {
        const out = [];
        for (const a of allocations.values()) {
          out.push({
            tick: a.tickCount,
            sockets: a.sockets.size,
            time: a.time,
            ended: a.ended,
            players: a.players.map((pl) => ({
              id: pl.id,
              alive: pl.alive,
              spawned: pl.spawned,
              hp: pl.hp,
              kills: pl.kills,
              deaths: pl.deaths,
              corpseTicks: pl._corpseTicks || 0,
              cutoff: !!pl._cutoffLogged,
              spawnPending: !!(pl.srv && pl.srv.spawnPending),
              hasSrv: !!pl.srv,
              pos: [pl.x, pl.y, pl.z].map((v) => +Number(v).toFixed(1))
            }))
          });
        }
        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify(out));
      } catch (e) {
        res.writeHead(500);
        return res.end("debug-state failed: " + e.message);
      }
    }
    if (p === "/final.pkg" || p === "/final_legacy.pkg") return sendFile(res, path2.join(rawDir, "bundles", "final.pkg"));
    if (p === "/final.pkg.local.gz" || p === "/final.pkg.gz") {
      const gzPath = path2.join(rawDir, "bundles", "final.pkg.gz");
      if (fs.existsSync(gzPath)) return sendFile(res, gzPath);
      return sendFile(res, path2.join(rawDir, "bundles", "final.pkg"));
    }
    if (p === "/") {
      res.writeHead(200, { "Content-Type": "text/html" });
      return res.end(patched);
    }
    const file = path2.join(clientDir, path2.normalize(p).replace(/^(\.\.\/)+/, ""));
    if (path2.relative(clientDir, file).startsWith("..")) {
      res.writeHead(403);
      return res.end();
    }
    if (fs.existsSync(file)) {
      return sendFile(res, file);
    }
    if (p.includes("/mobileTextures/")) {
      const fallbackP = p.replace("/mobileTextures/", "/compressedTextures/");
      const fallbackFile = path2.join(clientDir, path2.normalize(fallbackP).replace(/^(\.\.\/)+/, ""));
      if (fs.existsSync(fallbackFile)) {
        log("fallback:", p, "->", fallbackP);
        return sendFile(res, fallbackFile);
      }
    }
    if (p.includes("/compressedTextures/")) {
      const fallbackP = p.replace("/compressedTextures/", "/mobileTextures/");
      const fallbackFile = path2.join(clientDir, path2.normalize(fallbackP).replace(/^(\.\.\/)+/, ""));
      if (fs.existsSync(fallbackFile)) {
        log("fallback:", p, "->", fallbackP);
        return sendFile(res, fallbackFile);
      }
    }
    if (p.includes("/mobilelightmap")) {
      const fallbackP = p.replace("/mobilelightmap", "/lightmap");
      const fallbackFile = path2.join(clientDir, path2.normalize(fallbackP).replace(/^(\.\.\/)+/, ""));
      if (fs.existsSync(fallbackFile)) {
        log("fallback:", p, "->", fallbackP);
        return sendFile(res, fallbackFile);
      }
    }
    if (p.includes("/lightmap") && !p.includes("/smalllightmap") && !p.includes("/mobilelightmap")) {
      const fallbackP = p.replace("/lightmap", "/mobilelightmap");
      const fallbackFile = path2.join(clientDir, path2.normalize(fallbackP).replace(/^(\.\.\/)+/, ""));
      if (fs.existsSync(fallbackFile)) {
        log("fallback:", p, "->", fallbackP);
        return sendFile(res, fallbackFile);
      }
    }
    sendFile(res, file);
  });
  function sendFile(res, file) {
    fs.readFile(file, (e, data) => {
      if (e) {
        log("404:", file);
        res.writeHead(404);
        res.end();
        return;
      }
      res.writeHead(200, { "Content-Type": MIME[path2.extname(file).toLowerCase()] || "application/octet-stream", "Cache-Control": "no-store" });
      res.end(data);
    });
  }
  const rooms = /* @__PURE__ */ new Map();
  const memberOf = /* @__PURE__ */ new Map();
  const verifiedMaps = optVerifiedMaps || scanVerifiedMaps(clientDir);
  log("lobby maps verified on disk: " + ([...verifiedMaps].join(",") || "(none!)"));
  const PARTY = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  function makeCode() {
    let c;
    do {
      c = "";
      for (let i = 0; i < 3; i++) c += PARTY[crypto.randomInt(PARTY.length)];
    } while (rooms.has(c));
    return c;
  }
  function sendPkts(ws, pkts) {
    if (ws.readyState === 1) ws.send(pack(pkts));
  }
  function roomPacket(room, selfMember) {
    return {
      t: "pu",
      u: room.members.indexOf(selfMember),
      leader: 0,
      m: room.members.map((m) => [m.name, m.skins, m.ready, m.team, m.id]),
      priv: true,
      inf: { map: room.config.map, mode: room.config.mode, time: room.config.time, region: room.config.region }
    };
  }
  function broadcast(room) {
    for (const m of room.members) sendPkts(m.ws, [roomPacket(room, m)]);
  }
  function roomOf(ws) {
    const e = memberOf.get(ws);
    return e && e.room;
  }
  const mm = http.createServer((req, res) => {
    res.writeHead(404);
    res.end();
  });
  const mmWss = new import_websocket_server.default({ server: mm, path: "/ws" });
  mmWss.on("connection", (ws) => {
    sendPkts(ws, [{ a: Math.floor(Date.now() / 1e3), t: "a" }]);
    ws.on("message", (data) => {
      let msg;
      try {
        const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
        msg = unpack(buf).value;
      } catch {
        return;
      }
      if (!Array.isArray(msg)) return;
      for (const pkt of msg) {
        if (!pkt || typeof pkt.type !== "string") continue;
        if (pkt.type === "create") {
          leave(ws);
          const room = {
            id: makeCode(),
            members: [],
            next: 0,
            started: false,
            allocations: [],
            config: { map: resolveLobbyMap(SAFE_MAP, verifiedMaps), mode: "FFA", time: 5, region: resolveRegion(pkt.region) }
          };
          rooms.set(room.id, room);
          const member = addMember(room, ws);
          sendPkts(ws, [{ t: "prtyid", id: room.id, copy: false }]);
          broadcast(room);
          log("ROOM CREATE", room.id);
        } else if (pkt.type === "join") {
          leave(ws);
          let id = String(pkt.id || "").toUpperCase();
          const toks = id.split(/[^A-Z0-9]+/).filter(Boolean);
          if (toks.length > 1) id = toks[toks.length - 1];
          if (id.length > 6) id = id.slice(-6);
          const room = rooms.get(id);
          if (!room || room.started) {
            log("ROOM JOIN FAIL", id);
            sendPkts(ws, [{ t: "error", message: "Room is not available" }]);
            return;
          }
          addMember(room, ws);
          sendPkts(ws, [{ t: "joinsuccess" }, { t: "prtyid", id: room.id, copy: false }]);
          broadcast(room);
          log("ROOM JOIN", room.id, room.members.length);
        } else if (pkt.type === "ready" || pkt.type === "unready") {
          const room = roomOf(ws);
          if (!room) continue;
          const m = memberOf.get(ws).member;
          m.ready = pkt.type === "ready";
          broadcast(room);
          if (room.members.length && room.members.every((x) => x.ready) && !room.started) {
            room.started = true;
            log("ROOM START", room.id, room.members.length);
            startGame(room);
          }
        } else if (pkt.type === "updatePlayerInfo") {
          const m = memberOf.get(ws);
          if (!m) continue;
          if (pkt.name !== void 0) m.member.name = String(pkt.name).slice(0, 20) || "Guest";
          if (Array.isArray(pkt.skins)) m.member.skins = pkt.skins;
          broadcast(roomOf(ws));
        } else if (pkt.type === "updatePartyInfo") {
          const room = roomOf(ws);
          if (!room || room.started) continue;
          const e = memberOf.get(ws);
          if (!e) continue;
          const obj = pkt.obj;
          if (!obj || typeof obj !== "object") continue;
          const isLeader = room.members[0] === e.member;
          let changed = false;
          if (obj.map !== void 0 && isLeader) {
            const want = String(obj.map);
            if (LOBBY_MAPS.includes(want) && verifiedMaps.has(want)) {
              if (room.config.map !== want) {
                room.config.map = want;
                changed = true;
              }
            } else if (LOBBY_MAPS.includes(want)) {
              log("ROOM", room.id, "ignoring unrunnable map", want);
              changed = true;
            }
          }
          if (obj.mode !== void 0 && isLeader) {
            const want = String(obj.mode);
            if (LOBBY_MODES.includes(want) && room.config.mode !== want) {
              room.config.mode = want;
              changed = true;
            }
          }
          if (obj.time !== void 0 && isLeader) {
            const want = Number(obj.time);
            if (LOBBY_TIMES.includes(want) && room.config.time !== want) {
              room.config.time = want;
              changed = true;
            }
          }
          if (obj.swap) {
            e.member.team = e.member.team === 1 ? 2 : 1;
            changed = true;
          }
          if (changed) {
            log("ROOM", room.id, "config", JSON.stringify(room.config));
            broadcast(room);
          }
        }
      }
    });
    ws.on("close", () => leave(ws));
  });
  function addMember(room, ws) {
    const member = { id: room.next++, ws, name: "Guest", skins: [], ready: false, team: 0 };
    room.members.push(member);
    memberOf.set(ws, { room, member });
    return member;
  }
  function leave(ws) {
    const e = memberOf.get(ws);
    if (!e) return;
    memberOf.delete(ws);
    const i = e.room.members.indexOf(e.member);
    if (i !== -1) e.room.members.splice(i, 1);
    if (!e.room.members.length) rooms.delete(e.room.id);
    else broadcast(e.room);
  }
  const allocations = /* @__PURE__ */ new Map();
  function startGame(room) {
    const token = crypto.randomBytes(16).toString("hex");
    const safeMap = resolveLobbyMap(room.config.map, verifiedMaps);
    const mapIndex = mapNameToIndex(safeMap);
    const modeIndex = modeNameToIndex(room.config.mode);
    const matchSeconds = (LOBBY_TIMES.includes(room.config.time) ? room.config.time : 5) * 60;
    const teamMode = isTeamModeIndex(modeIndex);
    const teams = teamMode ? balanceLobbyTeams(room.members) : room.members.map((_, i) => i % 2 + 1);
    room.members.forEach((m, i) => {
      m.team = teams[i];
    });
    const alloc = makeAlloc(
      room.members.map((m, i) => ({ id: m.id, name: m.name, skins: m.skins, team: teams[i] })),
      { mapIndex, modeIndex, matchSeconds, scoreLimit: configuredScoreLimit() }
    );
    log(
      "ROOM MATCH",
      room.id,
      "map=" + safeMap + "(" + mapIndex + ")",
      "mode=" + room.config.mode + "(" + modeIndex + ")",
      "time=" + matchSeconds + "s",
      "teams=" + teams.join(",")
    );
    allocations.set(token, alloc);
    alloc.onEnd = () => {
      room.started = false;
      for (const m of room.members) m.ready = false;
      broadcast(room);
    };
    alloc.startBroadcast();
    for (const m of room.members) {
      sendPkts(m.ws, [{ t: "connect", ip: "00000000000000000000000000000000", port: httpPort, r: token }]);
    }
    const ttl = Number(process.env.GP_ALLOC_TTL ?? 3e4);
    if (ttl > 0) {
      const sweep = setInterval(() => {
        if (alloc.sockets.size === 0) {
          clearInterval(sweep);
          log("ROOM", token, "TTL sweep: unclaimed/abandoned, reaping allocation");
          allocations.delete(token);
          alloc.stop();
        }
      }, ttl);
      if (sweep.unref) sweep.unref();
    }
  }
  const game = new import_websocket_server.default({ server: httpServer, path: "/ws" });
  game.on("connection", (ws, req) => {
    const token = new URL(req.url, "ws://x").searchParams.get("r");
    const alloc = token ? allocations.get(token) : null;
    if (token && !alloc) {
      try {
        ws.close(4401, "bad token");
      } catch {
      }
      return;
    }
    const target = alloc || makeAlloc(null);
    const free = target.players.find((p) => !p.srv) || target.players[0];
    const srv = new GameSocket(ws, { alloc: target, me: free, log });
    free.srv = srv;
    target.sockets.add(srv);
    if (!alloc) target.startBroadcast();
    srv.start();
  });
  return new Promise((resolve) => {
    mm.listen(mmPort, () => httpServer.listen(httpPort, () => {
      log("gameplay server:  http :" + httpPort + "  mm ws :" + mmPort);
      log("build", "bundle=filelog1" + (LOG_FILE ? " logfile=" + LOG_FILE : " logfile=none"));
      resolve({ httpServer, mm });
    }));
  });
}
var DEFAULT_SKINS = [{ name: "default", weapon: "ar", wear: 0 }, { name: "default", weapon: "smg", wear: 0 }, { name: "default", weapon: "awp", wear: 0 }, { name: "default", weapon: "shotgun", wear: 0 }];
var FT = ["tf", "industry", "winter", "mlab", "manor", "militia", "shoothouse", "dust2", "neon", "sandstorm", "sandstorm2", "newmlab"];
var MAP_INDEX = Number(process.env.GP_MAP_INDEX ?? 11);
var MODE_INDEX = Number(process.env.GP_MODE_INDEX ?? 0);
function clampByte(v) {
  return Math.max(-128, Math.min(127, Math.round(v)));
}
var WEAPON_DAMAGE = [11, 21, 100, 20];
var WEAPON_AMMO = [40, 30, 3, 2];
var EYE_HEIGHT = 0;
var LOBBY_MAPS = ["tf", "industry", "winter", "newmlab", "manor", "neon"];
var LOBBY_MODES = ["FFA", "TDM", "Point", "Confirm", "Team KC", "Dom"];
var LOBBY_TIMES = [5, 10, 20];
var MODE_INDEX_TABLE = ["FFA", "TDM", "SWAT", "Arcade", "Siphon", "Point", "Confirm", "Team KC", "Dom"];
var REGIONS = { 2: "North America", 9: "Europe", 52: "Asia", 40: "South America", 35: "Australia" };
var DEFAULT_REGION = "52";
var SAFE_MAP = "newmlab";
function scanVerifiedMaps(clientDir) {
  const out = /* @__PURE__ */ new Set();
  for (const m of LOBBY_MAPS) {
    try {
      fs.statSync(path2.join(clientDir, "maps", m, "out", "out.drc"));
      out.add(m);
    } catch {
    }
  }
  return out;
}
function resolveLobbyMap(req, verified) {
  if (verified && verified.has(req)) return req;
  if (verified && verified.has(SAFE_MAP)) return SAFE_MAP;
  if (verified && verified.size) return [...verified][0];
  return SAFE_MAP;
}
function mapNameToIndex(name) {
  const i = FT.indexOf(name);
  return i === -1 ? FT.indexOf(SAFE_MAP) : i;
}
function modeNameToIndex(name) {
  const i = MODE_INDEX_TABLE.indexOf(name);
  return i === -1 ? 0 : i;
}
function isTeamModeIndex(idx) {
  return idx !== 0;
}
function resolveRegion(req) {
  const r = String(req ?? "");
  return REGIONS[r] ? r : DEFAULT_REGION;
}
function defaultMatchSeconds() {
  const t = Number(process.env.GP_MATCH_TIME);
  return Number.isFinite(t) && t >= 0 ? Math.floor(t) : 300;
}
function configuredScoreLimit() {
  const s = Number(process.env.GP_SCORE_LIMIT ?? 0);
  return Number.isFinite(s) && s > 0 ? Math.floor(s) : 0;
}
function balanceLobbyTeams(members) {
  let c1 = 0, c2 = 0;
  for (const m of members) {
    if (m.team === 1) c1++;
    else if (m.team === 2) c2++;
  }
  return members.map((m) => {
    if (m.team === 1 || m.team === 2) return m.team;
    if (c1 <= c2) {
      c1++;
      return 1;
    }
    c2++;
    return 2;
  });
}
var MAP_SPAWNS = {
  // tf (Factory, FT index 0, 9 spawns)
  tf: [
    { x: -4.1, y: 2.5, z: -0.2, pitch: 64, yaw: 128 },
    // uo
    { x: -4.1, y: -0.9, z: 21.4, pitch: 64, yaw: 64 },
    // up
    { x: -26.6, y: 2.5, z: 36.2, pitch: 63, yaw: 191 },
    // uq
    { x: -6.4, y: 2.7, z: 31, pitch: 63, yaw: 190 },
    // ur
    { x: 19.8, y: 2.5, z: 17.6, pitch: 63, yaw: 127 },
    // us
    { x: 29.2, y: 2.5, z: 8.3, pitch: 63, yaw: 125 },
    // ut
    { x: 3.9, y: 2.5, z: -21.7, pitch: 63, yaw: 64 },
    // uu
    { x: -38.1, y: 2.5, z: 1.6, pitch: 64, yaw: 190 },
    // uv
    { x: -24.8, y: -2.1, z: 19.6, pitch: 65, yaw: 193 }
    // uw
  ],
  // industry (Refinery, FT index 1, 5 spawns)
  industry: [
    { x: -13, y: 6.5, z: -37, pitch: 64, yaw: 192 },
    // v4
    { x: -0.7, y: 6.5, z: -20, pitch: 64, yaw: 255 },
    // v5
    { x: 6.1, y: 2.8, z: -8.3, pitch: 62, yaw: 190 },
    // v6
    { x: 2.2, y: 7.4, z: 33.1, pitch: 63, yaw: 254 },
    // v7
    { x: 18.9, y: 9.3, z: -20.4, pitch: 64, yaw: 254 }
    // v8
  ],
  // winter (Snowfall, FT index 2, 8 spawns)
  winter: [
    { x: -9.7, y: 6.2, z: 29.3, pitch: 62, yaw: 6 },
    // vv
    { x: -21.1, y: 9.1, z: -26.2, pitch: 59, yaw: 126 },
    // vw
    { x: 32, y: 2.1, z: -23.3, pitch: 61, yaw: 132 },
    // vx
    { x: 26.1, y: 9.9, z: -24.1, pitch: 59, yaw: 218 },
    // vy
    { x: 3.3, y: 6.1, z: -11.1, pitch: 62, yaw: 214 },
    // vz
    { x: 46.4, y: 6.3, z: 12.6, pitch: 63, yaw: 227 },
    // vA
    { x: 42.6, y: 4.6, z: -48.8, pitch: 62, yaw: 171 },
    // vB
    { x: 21, y: 9.9, z: -17.8, pitch: 62, yaw: 160 }
    // vC
  ],
  // mlab (Legacy Lab, FT index 3, 12 spawns)
  mlab: [
    { x: 0, y: 9.3, z: 0, pitch: 62, yaw: 249 },
    // vX
    { x: 5.8, y: 4.5, z: 15, pitch: 62, yaw: 238 },
    // vY
    { x: 54.4, y: 7.1, z: 8.1, pitch: 62, yaw: 95 },
    // vZ
    { x: 65.8, y: 4.5, z: -15, pitch: 63, yaw: 98 },
    // w0
    { x: 47.6, y: 4.5, z: -16.7, pitch: 62, yaw: 185 },
    // w1
    { x: 27.1, y: 3.2, z: -23.9, pitch: 64, yaw: 199 },
    // w2
    { x: 50.2, y: 4.5, z: -40.4, pitch: 63, yaw: 98 },
    // w3
    { x: 17.8, y: 5.5, z: -33.2, pitch: 64, yaw: 61 },
    // w4
    { x: -12.4, y: 1.9, z: -7.8, pitch: 63, yaw: 215 },
    // w5
    { x: -29.9, y: -0.1, z: -34.3, pitch: 64, yaw: 163 },
    // w6
    { x: -10.9, y: 2.9, z: -26.5, pitch: 61, yaw: 69 },
    // w7
    { x: 26.9, y: 4, z: -10, pitch: 64, yaw: 128 }
    // w8
  ],
  // manor (Vineyard/Manor, FT index 4, 8 spawns)
  manor: [
    { x: -17.7, y: -9.3, z: -36.8, pitch: 64, yaw: 126 },
    // wq
    { x: 4.5, y: -1.5, z: -16.4, pitch: 64, yaw: 223 },
    // wr
    { x: 40.9, y: -1.5, z: -2.4, pitch: 64, yaw: 62 },
    // wt
    { x: 13, y: -1.5, z: 14.7, pitch: 63, yaw: 250 },
    // wu
    { x: -22.5, y: -4.9, z: 30.5, pitch: 62, yaw: 39 },
    // wv
    { x: -49.5, y: -3.3, z: 12.1, pitch: 63, yaw: 126 },
    // ww
    { x: -22.5, y: 3.5, z: 29.5, pitch: 64, yaw: 5 },
    // wx
    { x: -26.4, y: -0.3, z: -15.4, pitch: 62, yaw: 192 }
    // wy
  ],
  // militia (Militia, FT index 5, 7 spawns)
  militia: [
    { x: -19, y: 2, z: 8.3, pitch: 63, yaw: 226 },
    // wS
    { x: -4.4, y: 2, z: 18, pitch: 63, yaw: 208 },
    // wT
    { x: 26.4, y: 2, z: 3.4, pitch: 60, yaw: 193 },
    // wU
    { x: 25.9, y: 2, z: -3.8, pitch: 62, yaw: 28 },
    // wV
    { x: 16.4, y: 4.5, z: -28.2, pitch: 64, yaw: 218 },
    // wW
    { x: 5.3, y: 4.5, z: -41.5, pitch: 58, yaw: 64 },
    // wX
    { x: 1.7, y: 4.5, z: -22, pitch: 62, yaw: 24 }
    // wY
  ],
  // shoothouse (Shoot House, FT index 6, 10 spawns)
  shoothouse: [
    { x: 18.8, y: 5.3, z: 3.6, pitch: 64, yaw: 126 },
    // x6
    { x: 34.1, y: 5.3, z: 7.2, pitch: 61, yaw: 191 },
    // x7
    { x: 59.9, y: 5.3, z: -1.1, pitch: 60, yaw: 2 },
    // x8
    { x: 30.5, y: 5.3, z: -15.2, pitch: 59, yaw: 228 },
    // x9
    { x: 9.5, y: 5.3, z: -40.8, pitch: 58, yaw: 64 },
    // xa
    { x: 12.3, y: 5.3, z: -20.4, pitch: 61, yaw: 237 },
    // xb
    { x: 0.1, y: 5.3, z: -20.3, pitch: 57, yaw: 45 },
    // xc
    { x: -26.6, y: 5.3, z: -42.8, pitch: 63, yaw: 96 },
    // xd
    { x: -38.1, y: 5.3, z: -18.1, pitch: 63, yaw: 40 },
    // xe
    { x: -34.4, y: 5.3, z: 32.2, pitch: 61, yaw: 6 }
    // xf
  ],
  // dust2 (Dust II, FT index 7, 1 spawns)
  dust2: [
    { x: 0, y: 100, z: 0, pitch: 64, yaw: 0 }
    // xn
  ],
  // neon (Neo Tokyo, FT index 8, 11 spawns)
  neon: [
    { x: 3, y: 2.4, z: 0.6, pitch: 63, yaw: 177 },
    // xw
    { x: -11.9, y: 1.4, z: 29, pitch: 63, yaw: 0 },
    // xx
    { x: -43.4, y: 5.1, z: -12.9, pitch: 62, yaw: 0 },
    // xy
    { x: 3.3, y: 5.1, z: -35.5, pitch: 63, yaw: 63 },
    // xz
    { x: 2.9, y: 2.4, z: -55.2, pitch: 63, yaw: 187 },
    // xA
    { x: 44.2, y: 0.6, z: 35.1, pitch: 64, yaw: 254 },
    // xB
    { x: 15.1, y: 0.6, z: 20.7, pitch: 64, yaw: 126 },
    // xC
    { x: -6.7, y: 5.2, z: 32.8, pitch: 64, yaw: 63 },
    // xD
    { x: -34, y: 5.1, z: 11.7, pitch: 62, yaw: 159 },
    // xE
    { x: -10.4, y: 5.1, z: -5, pitch: 63, yaw: 23 },
    // xF
    { x: 24, y: 4.7, z: -8.5, pitch: 63, yaw: 254 }
    // xG
  ],
  // sandstorm (Sandstorm, FT index 9, 6 spawns)
  sandstorm: [
    { x: -11, y: -6.8, z: 18.9, pitch: 60, yaw: 30 },
    // Bl
    { x: -27.6, y: -6.8, z: -2.8, pitch: 61, yaw: 125 },
    // Bm
    { x: -54.3, y: -6.9, z: 55.9, pitch: 63, yaw: 190 },
    // Bn
    { x: -58.3, y: -4.2, z: 84.2, pitch: 64, yaw: 191 },
    // Bo
    { x: 20.9, y: -6.8, z: 79.3, pitch: 62, yaw: 244 },
    // Bp
    { x: 30.1, y: -6.8, z: 5.2, pitch: 64, yaw: 128 }
    // Bq
  ],
  // sandstorm2 (Sandstorm 2, FT index 10, 1 spawns)
  sandstorm2: [
    { x: -31.6, y: 10.6, z: -60.2, pitch: 62, yaw: 193 }
    // Eg
  ],
  // newmlab (Forest, FT index 11, 10 spawns)
  newmlab: [
    { x: 48.9, y: 4.6, z: -22, pitch: 60, yaw: 254 },
    // Eo
    { x: 55, y: 4.6, z: 4.6, pitch: 63, yaw: 253 },
    // Ep
    { x: 67.3, y: 2.5, z: 3.7, pitch: 63, yaw: 192 },
    // Eq
    { x: 60.9, y: 2.5, z: 13.9, pitch: 59, yaw: 122 },
    // Er
    { x: -10.5, y: 4.6, z: 0.1, pitch: 63, yaw: 144 },
    // Es
    { x: -15.6, y: 2, z: -1.8, pitch: 63, yaw: 249 },
    // Et
    { x: 3.3, y: -0.4, z: -16.6, pitch: 63, yaw: 63 },
    // Eu
    { x: -22.4, y: 0.8, z: -40, pitch: 61, yaw: 139 },
    // Ev
    { x: 17.3, y: 4.4, z: -30.3, pitch: 60, yaw: 46 },
    // Ew
    { x: 53.6, y: 7.2, z: 7.7, pitch: 63, yaw: 109 }
    // Ex
  ]
};
function spawnsForMap(mapName) {
  return MAP_SPAWNS[mapName] || MAP_SPAWNS[SAFE_MAP];
}
function spawnsForMapIndex(mapIndex) {
  return spawnsForMap(FT[mapIndex]);
}
function makeAlloc(roster, { mapIndex = MAP_INDEX, modeIndex = MODE_INDEX, matchSeconds, scoreLimit = 0 } = {}) {
  const spawns = spawnsForMapIndex(mapIndex);
  function spawnForAlloc(id) {
    return spawns[id % spawns.length];
  }
  const players = (roster || [{ id: 0, name: "Solo", skins: [] }]).map((p, idx) => {
    const sp = spawnForAlloc(p.id);
    return {
      id: p.id,
      name: p.name,
      skins: JSON.stringify(p.skins && p.skins.length ? p.skins : DEFAULT_SKINS),
      team: Number.isInteger(p.team) && p.team > 0 ? p.team : idx % 2 + 1,
      x: sp.x,
      y: sp.y,
      z: sp.z,
      yawByte: sp.yaw,
      spawnYaw: sp.yaw,
      aimByte: sp.pitch || 63,
      spawned: false,
      hp: 100,
      weaponType: 0,
      alive: true,
      ammo: 40,
      despawnSent: false,
      kills: 0,
      deaths: 0,
      points: 0,
      headshots: 0,
      assists: 0,
      damageBy: /* @__PURE__ */ new Map(),
      lastDamagedAt: 0,
      lastRegenAt: 0,
      reported: null,
      reportTick: 0,
      inputVal: 0,
      inputTick: 0,
      reportedAt: 0,
      srv: null
    };
  });
  const SIM_SPEED = Math.max(0.01, Number(process.env.GP_SPEED || 1));
  return {
    players,
    glooWalls: new GlooWallManager(),
    mapIndex,
    modeIndex,
    spawns,
    sockets: /* @__PURE__ */ new Set(),
    timers: /* @__PURE__ */ new Set(),
    closed: false,
    tickCount: 0,
    // Match countdown (seconds). Room matches pass the lobby's selected time
    // limit; the env default below only applies to solo/no-room allocations.
    time: matchSeconds !== void 0 ? Math.max(0, Math.floor(matchSeconds)) : defaultMatchSeconds(),
    matchLength: matchSeconds !== void 0 ? Math.max(0, Math.floor(matchSeconds)) : defaultMatchSeconds(),
    scoreLimit,
    teamMode: isTeamModeIndex(modeIndex),
    ended: false,
    onEnd: null,
    secondTickRunning: false,
    after(ms, fn) {
      const scaled = Math.max(1, Math.round(ms / SIM_SPEED));
      const t = setTimeout(() => {
        this.timers.delete(t);
        if (!this.closed) fn();
      }, scaled);
      this.timers.add(t);
    },
    stop() {
      this.closed = true;
      for (const t of this.timers) clearTimeout(t);
      this.timers.clear();
      if (this.glooWalls) this.glooWalls.clear();
    },
    startBroadcast() {
      this.after(100, () => {
        this.tick();
        this.startBroadcast();
      });
    },
    startSecondTick() {
      if (this.secondTickRunning) return;
      this.secondTickRunning = true;
      this._lastHeader = this.headerKey();
      this.broadcast([this.scoreHeaderMsg()], null);
      this.broadcast([encode("ld52k5uY7", { time: this.time }), encode("hJUJ7cbd51b", { string: "[]" })], null);
      this.after(1e3, () => this.secondTick());
      this.after(1e3, () => this.scoreTick());
    },
    // Shared match-completion sequence: final scoreboard + header, then the
    // end screen trigger (28). onEnd (set by startGame) returns the room to
    // the lobby so the party can ready up again.
    endMatch(reason) {
      if (this.ended) return;
      this.ended = true;
      this.secondTickRunning = false;
      this.broadcast([...this.scoreboardMsg(), this.scoreHeaderMsg(), encode("D522Kq7l5n", {})], null);
      log("match", "END " + reason);
      if (typeof this.onEnd === "function") {
        try {
          this.onEnd();
        } catch {
        }
      }
    },
    secondTick() {
      if (this.closed || this.ended || !this.sockets.size) return;
      this.ageLog = (this.ageLog || 0) + 1;
      if (this.ageLog % 5 === 0) {
        const ages = this.players.map((p) => p.id + "=" + Math.round((Date.now() - p.reportedAt) / 100) / 10 + "s" + (p.reported ? "" : "*")).join(" ");
        log("ages", "tick", this.tickCount, "->", ages);
      }
      if (this.time > 0) this.time--;
      const parts = [encode("ld52k5uY7", { time: this.time })];
      parts.push(encode("hJUJ7cbd51b", { string: "[]" }));
      if (this.glooWalls) {
        const expired = this.glooWalls.update();
        for (const exp of expired) {
          parts.push(encode("kM86hVW024", { id: 0, string: `__gloo:destroy:${exp.id}:expired` }));
        }
      }
      this.broadcast(parts, null);
      if (this.time === 0) {
        this.endMatch("time=0");
        return;
      }
      this.after(1e3, () => this.secondTick());
    },
    // Scoreboard: ONE broadcast (both players' entries) per timer second +
    // extras right after kills (real capture: 219 msg24 over 103s, i.e. ~1
    // broadcast/s, 2 entries each; kill moments show 3-4 per interval).
    // Header (msg42) only on change.
    scoreTick() {
      if (this.closed || this.ended || !this.sockets.size) return;
      const parts = [...this.scoreboardMsg()];
      const hdr = this.headerKey();
      if (hdr !== this._lastHeader) {
        this._lastHeader = hdr;
        parts.push(this.scoreHeaderMsg());
      }
      this.broadcast(parts, null);
      this.after(1e3, () => this.scoreTick());
    },
    // Clock correction mix (real capture ratios: 4=2 ~77%, 4=1 ~9%, 5 ~10%,
    // 6=0 ~4%). msg4 speeds the client sim up (Wg+0.05*val), msg5 slows it
    // down, msg6 resets Wg to base. A fixed 26-tick cycle reproduces the mix.
    clockMsg(s) {
      if (s.clockLeft > 0) {
        s.clockLeft--;
        return encode("pi7M701p0", { cKRwdjkqGai: (s.clockCycle++ & 3) === 0 ? 1 : 2 });
      }
      if (s.clockResetLeft > 0) {
        s.clockResetLeft--;
        return encode("qv8j93zAL", { cKRwdjkqGai: 0 });
      }
      if (++s.clockCycle >= 38 + s.clockRand % 12) {
        s.clockCycle = 0;
        s.clockRand = s.clockRand * 1103515245 + 12345 >>> 0;
        s.clockLeft = 3 + s.clockRand % 6;
        s.clockResetLeft = 1 + (s.clockRand >>> 8 & 1);
      }
      return encode("Ko38N6873G6", { cKRwdjkqGai: s.clockCycle % 9 === 0 ? 1 : 2 });
    },
    // Per-viewer state broadcast every ~100ms (mirrors match.mjs: only players
    // that are spawned go in the world, EXCEPT the viewer's own player which is
    // always included for the self-state/desync check). Each tick also carries
    // the Ko38 clock so the client's interpolator keeps its 75-135ms cadence.
    tick() {
      if (this.closed || !this.sockets.size) return;
      this.tickCount++;
      if (process.env.GP_MODELDBG) {
        log("modeldbg", `tick#${this.tickCount} ` + this.players.map((p) => `p${p.id}:${p.alive ? "A" : "D"}${p.spawned ? "S" : "s"}hp${p.hp}`).join(" "));
      }
      const now = Date.now();
      const regenDelay = 3500 / SIM_SPEED;
      const regenInterval = 100 / SIM_SPEED;
      for (const p of this.players) {
        if (p.spawned && p.alive && p.hp > 0 && p.hp < 100) {
          if (now - (p.lastDamagedAt || 0) > regenDelay) {
            if (now - (p.lastRegenAt || 0) >= regenInterval) {
              p.lastRegenAt = now;
              p.hp = Math.min(100, p.hp + 1);
            }
          }
        }
      }
      for (const s of this.sockets) {
        if (s.closed || s.ws.readyState !== 1) continue;
        const parts = [];
        for (const p of this.players) {
          if (!p.spawned && p !== s.me) continue;
          parts.push(this.stateMessage(p));
        }
        if (!parts.length) continue;
        parts.push(this.clockMsg(s));
        s.send(parts);
      }
    },
    stateMessage(p) {
      const r = p.reported;
      const x = r ? r.x : p.x;
      const y = r ? r.y : p.y;
      const z = r ? r.z : p.z;
      let anim = 32;
      if (p.inputVal & 1) anim |= 4;
      if (p.inputVal & 2) anim |= 8;
      if (p.inputVal & 4) anim |= 1;
      if (p.inputVal & 8) anim |= 2;
      if (p.inputVal & 64) anim |= 16;
      if (p.inputVal & 256 || p.inputVal & 32) anim |= 256;
      if (p.inputVal & 16) anim &= ~32;
      if (!p.alive) anim = 96;
      {
        const _dbgKey = (p.alive ? "A" : "D") + (p.spawned ? "S" : "s") + (anim & 64 ? "d1" : "d0");
        if (p._modelDbgKey !== _dbgKey) {
          log("modeldbg", `p${p.id} ${p._modelDbgKey || "init"} -> ${_dbgKey} anim=0x${anim.toString(16)} hp=${p.hp} @(${x.toFixed(1)},${y.toFixed(1)},${z.toFixed(1)})`);
          p._modelDbgKey = _dbgKey;
        }
      }
      return encode("K11Co2hvi1l", {
        tdkZouYda: p.id,
        JoHdvmpcMvL: x,
        uBHZYKAHa: y,
        yxEKoSFAg: z,
        TCHdFFAXmk: p.aimByte,
        // pitch byte (64 = level)
        ibyXzJIMNf: p.yawByte,
        // body-yaw byte (rot.y = iby*pi/128+pi)
        YSmEAVINAh: anim,
        // Echo the client's own tick (already 0..127 from a26); self-check passes
        // because the value IS the client's own prediction.
        wGiOzKcGlnH: (r ? p.reportTick : p.inputTick) & 127,
        hkhrYayXI: p.hp,
        qXuHmlbSlxE: p.team
        // entity team; always nonzero (FFA alternates, team modes balance)
      });
    },
    // ---------- Phase 2 hybrid combat ----------
    // All positions come from client msg-52 reports (never simulated). A shot
    // (msg 8) is a ray from the shooter's reported position + eye height. The
    // client's OWN world hit point (AHPhtLFTi/mGOwFesuTt/MHnEcbTxpbz) is the
    // authoritative occlusion test: the client's raycast stops at the first
    // voxel it hits, so we cap the shot range there — a wall between shooter
    // and target can never be shot through (no wallbang). Hit selection uses
    // the same angular + pitch-delta rules as the reference server.
    broadcast(parts, exclude) {
      for (const s of this.sockets) {
        if (s === exclude || s.closed || s.ws.readyState !== 1) continue;
        s.send(parts);
      }
    },
    scoreboardMsg() {
      const parts = [];
      for (const p of this.players) {
        parts.push(encode("RMFVb5UZGi7", {
          id: p.id,
          points: p.points,
          k: p.kills,
          d: p.deaths,
          h: p.weaponType || 0,
          p: Math.round((p.srv && p.srv.pingMs || 0) * 2),
          c: 0,
          hsp: p.headshots,
          PhbhpxFxPP: p.team,
          ha: p.assists,
          JgVHFEBAE: 0,
          TxJblhJNah: 0,
          aMWaisFtZ: 0
        }));
      }
      return parts;
    },
    // Team totals (kills + assists all score via points, so the sum IS the
    // team score). FFA header instead shows the top-2 players.
    teamScores() {
      let a = 0, b = 0;
      for (const p of this.players) {
        if (p.team === 2) b += p.points;
        else a += p.points;
      }
      return { a, b };
    },
    headerKey() {
      if (this.teamMode) {
        const t = this.teamScores();
        return t.a + "," + t.b;
      }
      const sorted = [...this.players].sort((x, y) => y.points - x.points);
      return (sorted[0]?.points || 0) + "," + (sorted[1]?.points || 0);
    },
    scoreHeaderMsg() {
      if (this.teamMode) {
        const t = this.teamScores();
        return encode("P2F7KG88n96", { a: t.a, b: t.b });
      }
      const sorted = [...this.players].sort((x, y) => y.points - x.points);
      return encode("P2F7KG88n96", { a: (sorted[0] || {}).points || 0, b: (sorted[1] || {}).points || 0 });
    },
    handleShot(shooter, shot) {
      if (!shooter || !shooter.alive || !shooter.spawned) return;
      const r = shooter.reported;
      const sx = r ? r.x : shooter.x, sy = (r ? r.y : shooter.y) + EYE_HEIGHT, sz = r ? r.z : shooter.z;
      const hasPoint = Number.isFinite(shot.AHPhtLFTi) && Number.isFinite(shot.mGOwFesuTt) && Number.isFinite(shot.MHnEcbTxpbz) && Math.abs(shot.AHPhtLFTi) + Math.abs(shot.mGOwFesuTt) + Math.abs(shot.MHnEcbTxpbz) > 1e-3;
      let target = null, targetHeadshot = false;
      let passY = null;
      let pointLen = Infinity;
      const yaw = Number.isFinite(shot.uBHZYKAHa) ? shot.uBHZYKAHa + Math.PI : 0;
      const pitch = Number.isFinite(shot.JoHdvmpcMvL) ? shot.JoHdvmpcMvL : 0;
      let dirX = Math.sin(yaw) * Math.cos(pitch);
      let dirY = Math.sin(pitch);
      let dirZ = Math.cos(yaw) * Math.cos(pitch);
      if (hasPoint) {
        const px = shot.AHPhtLFTi, py = shot.mGOwFesuTt, pz = shot.MHnEcbTxpbz;
        const bDx = px - sx, bDy = py - sy, bDz = pz - sz;
        const bLen = Math.hypot(bDx, bDy, bDz);
        if (bLen > 0.01) {
          dirX = bDx / bLen;
          dirY = bDy / bLen;
          dirZ = bDz / bLen;
          pointLen = bLen;
        }
      }
      const hDirLenSq = dirX * dirX + dirZ * dirZ;
      let bestDist = Infinity;
      for (const candidate of this.players) {
        if (candidate === shooter || !candidate.spawned || !candidate.alive) continue;
        if (this.teamMode && candidate.team === shooter.team) continue;
        const testPositions = [];
        if (candidate.reported) testPositions.push(candidate.reported);
        if (candidate.history && candidate.history.length) {
          for (let hi = candidate.history.length - 1; hi >= 0 && hi >= candidate.history.length - 4; hi--) {
            testPositions.push(candidate.history[hi]);
          }
        }
        if (!testPositions.length) testPositions.push({ x: candidate.x, y: candidate.y, z: candidate.z });
        for (const pos of testPositions) {
          const cx = pos.x, cy = pos.y, cz = pos.z;
          const dx = cx - sx, dz = cz - sz;
          const directDist = Math.hypot(dx, dz);
          if (directDist < 1e-3 || directDist > 120) continue;
          if (hDirLenSq < 1e-6) continue;
          const t = (dx * dirX + dz * dirZ) / hDirLenSq;
          if (t <= 0) continue;
          if (hasPoint && pointLen < t - 1.2) continue;
          const rayX = sx + dirX * t;
          const rayY = sy + dirY * t;
          const rayZ = sz + dirZ * t;
          const hDist = Math.hypot(rayX - cx, rayZ - cz);
          const relY = rayY - cy;
          const isHit = hDist <= 0.48 && relY >= -2.4 && relY <= 0.35;
          if (isHit) {
            const isHead = relY >= -0.22 && relY <= 0.25 && hDist <= 0.22;
            if (t < bestDist) {
              bestDist = t;
              target = candidate;
              targetHeadshot = isHead;
              passY = rayY;
            }
            break;
          }
        }
      }
      const glooHit = this.glooWalls ? this.glooWalls.raycast(sx, sy, sz, dirX, dirY, dirZ, 120) : null;
      const glooOccluded = glooHit && hasPoint && pointLen < glooHit.dist - 0.2;
      if (glooHit && !glooOccluded && glooHit.dist < bestDist) {
        shooter.ammo = Math.max(0, shooter.ammo - 1);
        if (shooter.ammo <= 0) shooter.ammo = WEAPON_AMMO[shooter.weaponType] || 40;
        const base2 = WEAPON_DAMAGE[shooter.weaponType] !== void 0 ? WEAPON_DAMAGE[shooter.weaponType] : 11;
        const dmgRes = this.glooWalls.damage(glooHit.wall.id, base2);
        const hx = glooHit.hitPoint.x, hy = glooHit.hitPoint.y, hz = glooHit.hitPoint.z;
        const normalDist2 = Math.hypot(sx - hx, sz - hz) || 1;
        const impact2 = encode("vS66uPxac49", {
          JoHdvmpcMvL: hx,
          uBHZYKAHa: hy,
          yxEKoSFAg: hz,
          AHPhtLFTi: clampByte((sx - hx) / normalDist2 * 127),
          mGOwFesuTt: 0,
          MHnEcbTxpbz: clampByte((sz - hz) / normalDist2 * 127),
          tdkZouYda: shooter.id
        });
        this.broadcast([impact2], null);
        shooter.srv && shooter.srv.send([encode("ZpZC792j9p3", {
          lDKzyZxhKX: 0,
          wtZUXNpiCWl: dmgRes && dmgRes.destroyed ? 1 : 0,
          JoHdvmpcMvL: hx,
          uBHZYKAHa: hy,
          yxEKoSFAg: hz
        })]);
        if (dmgRes && dmgRes.destroyed) {
          log("combat", `GLOO WALL ${glooHit.wall.id} DESTROYED by shooter ${shooter.id}`);
          this.broadcast([encode("kM86hVW024", { id: 0, string: `__gloo:destroy:${glooHit.wall.id}:destroyed` })], null);
        } else if (dmgRes) {
          this.broadcast([encode("kM86hVW024", { id: 0, string: `__gloo:damage:${glooHit.wall.id}:${dmgRes.remainingHp}:${hx.toFixed(2)}:${hy.toFixed(2)}:${hz.toFixed(2)}` })], null);
        }
        log("combat", `shot ${shooter.id} -> GLOO WALL ${glooHit.wall.id} hit dmg=${base2} remainingHp=${dmgRes ? dmgRes.remainingHp : 0}`);
        return;
      }
      if (process.env.GP_HITSTATS) {
        const st = this.hitStats = this.hitStats || { shots: 0, hit: 0 };
        st.shots++;
        if (target) {
          st.hit++;
          if (st.hit % 20 === 0) log("hitstats", JSON.stringify(st));
        }
      }
      shooter.ammo = Math.max(0, shooter.ammo - 1);
      if (shooter.ammo <= 0) shooter.ammo = WEAPON_AMMO[shooter.weaponType] || 40;
      if (process.env.GP_HITDBG && hasPoint) {
        for (const c of this.players) {
          if (c === shooter || !c.spawned) continue;
          const cr = c.reported, cx = cr ? cr.x : c.x, cz = cr ? cr.z : c.z, cy = cr ? cr.y : c.y;
          if (Math.hypot(shot.AHPhtLFTi - cx, shot.MHnEcbTxpbz - cz) > 2.5) continue;
          log("hitdbg", target ? "HIT " : "MISS", "rayY-targetY=", (shot.mGOwFesuTt - cy).toFixed(2), "rayY=", shot.mGOwFesuTt.toFixed(2), "targetY=", cy.toFixed(2));
        }
      }
      if (!target) {
        log("combat", `shot ${shooter.id} MISS`);
        if (hasPoint) {
          const nLen = Math.hypot(sx - shot.AHPhtLFTi, sy - shot.mGOwFesuTt, sz - shot.MHnEcbTxpbz) || 1;
          const miss = encode("vS66uPxac49", {
            JoHdvmpcMvL: shot.AHPhtLFTi,
            uBHZYKAHa: shot.mGOwFesuTt,
            yxEKoSFAg: shot.MHnEcbTxpbz,
            AHPhtLFTi: clampByte((sx - shot.AHPhtLFTi) / nLen * 127),
            mGOwFesuTt: clampByte((sy - shot.mGOwFesuTt) / nLen * 127),
            MHnEcbTxpbz: clampByte((sz - shot.MHnEcbTxpbz) / nLen * 127),
            tdkZouYda: shooter.id
          });
          this.broadcast([miss], null);
        }
        return;
      }
      const base = WEAPON_DAMAGE[shooter.weaponType] !== void 0 ? WEAPON_DAMAGE[shooter.weaponType] : 11;
      const dmg = targetHeadshot ? shooter.weaponType === 2 ? 100 : shooter.weaponType === 3 ? 40 : 39 : base;
      if (targetHeadshot) shooter.headshots++;
      target.lastDamagedAt = Date.now();
      target.hp = Math.max(0, target.hp - dmg);
      const killed = target.hp === 0;
      target.damageBy.set(shooter.id, (target.damageBy.get(shooter.id) || 0) + dmg);
      const tr = target.reported;
      const hitX = tr ? tr.x : target.x;
      const hitZ = tr ? tr.z : target.z;
      const hitY = passY !== null ? passY : (tr ? tr.y : target.y) - 0.75;
      const normalDist = Math.hypot(sx - hitX, sz - hitZ) || 1;
      const impact = encode("vS66uPxac49", {
        JoHdvmpcMvL: hitX,
        uBHZYKAHa: hitY,
        yxEKoSFAg: hitZ,
        AHPhtLFTi: clampByte((sx - hitX) / normalDist * 127),
        mGOwFesuTt: 0,
        MHnEcbTxpbz: clampByte((sz - hitZ) / normalDist * 127),
        tdkZouYda: shooter.id
      });
      const blood = encode("a693b13D91R", { tdkZouYda: target.id, uBHZYKAHa: hitY, MfCOcfVUx: 2 });
      this.broadcast([impact, blood], null);
      const victim = target.srv;
      if (victim) victim.send([encode("ib9T000831", { id: shooter.id, h: dmg, arw: 1 })]);
      shooter.srv && shooter.srv.send([encode("ZpZC792j9p3", {
        lDKzyZxhKX: targetHeadshot ? 1 : 0,
        wtZUXNpiCWl: killed ? 1 : 0,
        JoHdvmpcMvL: hitX,
        uBHZYKAHa: hitY,
        yxEKoSFAg: hitZ
      })]);
      log("combat", `shot ${shooter.id} -> ${target.id} dmg=${dmg}${targetHeadshot ? " HEAD" : ""} hp=${target.hp} ammo=${shooter.ammo}`);
      if (target.hp <= 0) this.onKill(shooter, target, targetHeadshot);
    },
    onKill(shooter, victim, isHead) {
      victim.alive = false;
      victim.deaths++;
      victim.hp = 0;
      shooter.kills++;
      shooter.points += isHead ? 150 : 100;
      if (victim.damageBy) {
        for (const [aid] of victim.damageBy) {
          if (aid === shooter.id) continue;
          const a = this.players.find((p) => p.id === aid);
          if (a) {
            a.points += 50;
            a.assists++;
          }
        }
      }
      victim.damageBy.clear();
      if (victim.srv) {
        victim.srv.send([encode("gB4Cncy3f4", { id: shooter.id, h: shooter.hp })]);
        victim.srv.scheduleRespawn();
      }
      this.broadcast([encode("Y6805DB31Br", {
        WJxrwBXgp: shooter.id,
        cRzBBcbLPR: shooter.weaponType,
        PacKJQHkQ: victim.id,
        KiQwnWACHo: isHead ? 1 : 0
      })], null);
      if (shooter.srv) shooter.srv.send([encode("G058FYe8B9", {
        tdkZouYda: victim.id,
        ldBboSufaY: isHead ? 1 : 0,
        fRcMMMfSas: 1,
        jatzJSfdtNy: isHead ? 150 : 100
      })]);
      this.broadcast([...this.scoreboardMsg(), this.scoreHeaderMsg()], null);
      this._lastHeader = this.headerKey();
      log("combat", `KILL ${shooter.id} -> ${victim.id}${isHead ? " HEAD" : ""}`);
      log("modeldbg", `KILL flow: victim=${victim.id} alive=false hp=0 spawned=${victim.spawned} corpse-anim=0x60 | sent: 20->victim, 25+24->all, 23->killer | respawnTimer=${victim.srv ? "armed(8s fallback)" : "NO-SRV!"}`);
      this.checkScoreLimit();
    },
    // Winning-score end (GP_SCORE_LIMIT, 0 = off): FFA ends when any player
    // reaches it, team modes when either team total reaches it.
    checkScoreLimit() {
      if (this.ended || !(this.scoreLimit > 0)) return;
      if (this.teamMode) {
        const t = this.teamScores();
        if (t.a >= this.scoreLimit || t.b >= this.scoreLimit) this.endMatch(`score=${t.a}-${t.b}`);
      } else if (this.players.some((p) => p.points >= this.scoreLimit)) {
        this.endMatch("score");
      }
    },
    respawn(p) {
      const spawns2 = this.spawns || spawnsForMap(SAFE_MAP);
      const sp = spawns2[(this.tickCount + p.id + 1) % spawns2.length];
      const _wasAlive = p.alive;
      p.x = sp.x;
      p.y = sp.y;
      p.z = sp.z;
      p.reported = null;
      p.reportTick = 0;
      p.reportedAt = 0;
      p.hp = 100;
      p.alive = true;
      p.despawnSent = false;
      p.lastDamagedAt = 0;
      p.lastRegenAt = 0;
      p.ammo = WEAPON_AMMO[p.weaponType] || 40;
      p.damageBy.clear();
      p.yawByte = sp.yaw;
      p.spawnYaw = sp.yaw;
      p.aimByte = sp.pitch || 63;
      log("modeldbg", `RESPAWN p${p.id} alive ${_wasAlive}->true hp=100 spawned=${p.spawned}(kept) deadTicks=${p._corpseTicks || 0} @(${p.x.toFixed(1)},${p.y.toFixed(1)},${p.z.toFixed(1)}) yaw=${p.spawnYaw}`);
      p._corpseTicks = 0;
      p._cutoffLogged = false;
    }
  };
}
var GameSocket = class {
  constructor(ws, { alloc, me, log: log2 }) {
    this.ws = ws;
    this.alloc = alloc;
    this.me = me;
    this.log = log2;
    this.phase = "challenge";
    this.joined = {};
    this.proof = null;
    this.spawnPending = false;
    this.timers = /* @__PURE__ */ new Set();
    this.closed = false;
    this.seed = crypto.randomBytes(4).readUInt32BE(0);
    this.challenge = 0;
    this.pingMs = 0;
    this.pingLoop = null;
    this.clockCycle = 0;
    this.clockLeft = 0;
    this.clockResetLeft = 0;
    this.clockRand = this.seed >>> 0 || 1;
    this.respawnTimer = null;
  }
  after(ms, fn) {
    const t = setTimeout(() => {
      this.timers.delete(t);
      if (!this.closed) fn();
    }, ms);
    this.timers.add(t);
  }
  // Real respawn flow: the dead client re-picks class (msg21) and the server
  // respawns IN RESPONSE (22+18 -> 17+29 on ack). This fallback only fires if
  // the client never re-picks; onClassSelect cancels it.
  scheduleRespawn() {
    if (this.respawnTimer) return;
    this.respawnTimer = setTimeout(() => {
      this.respawnTimer = null;
      if (!this.closed && !this.me.alive) this.respawnPlayer();
    }, 8e3);
    this.timers.add(this.respawnTimer);
  }
  cancelRespawn() {
    if (!this.respawnTimer) return;
    clearTimeout(this.respawnTimer);
    this.timers.delete(this.respawnTimer);
    this.respawnTimer = null;
  }
  send(parts) {
    if (this.closed || this.ws.readyState !== 1) return;
    this.ws.send(Buffer.concat(parts));
  }
  start() {
    this.ws.on("message", (d) => this.onMsg(d));
    this.ws.on("close", () => {
      this.closed = true;
      if (this.pingLoop) clearInterval(this.pingLoop);
      for (const t of this.timers) clearTimeout(t);
      this.alloc.sockets.delete(this);
      if (this.me.srv === this) this.me.srv = null;
      this.me.damageBy.clear();
      this.me.spawned = false;
      this.me.alive = false;
      log("modeldbg", `p${this.me.id} socket-close: spawned=false alive=false, broadcast msg7 despawn->survivors (model+nametag removed)`);
      this.alloc.broadcast([encode("N27s83WCNi", { tdkZouYda: this.me.id })], this);
      if (!this.alloc.sockets.size) this.alloc.stop();
    });
    this.challenge = crypto.randomBytes(4).readUInt32BE(0) || 1;
    this.send([encode("M35Oru2OB05", { val: this.challenge })]);
    this.ws.on("pong", () => {
      this.pingMs = Date.now() - this._pingT;
    });
    this.pingLoop = setInterval(() => {
      if (this.closed || this.ws.readyState !== 1) return;
      this._pingT = Date.now();
      try {
        this.ws.ping();
      } catch {
      }
    }, 3e4);
  }
  onMsg(data) {
    let bin;
    try {
      const raw = Buffer.isBuffer(data) ? data : Buffer.from(data);
      bin = raw[0] <= 1 ? raw : fromWireB64(raw.toString("utf8"));
    } catch {
      bin = Buffer.from(data);
    }
    let msgs;
    try {
      msgs = decode(bin);
    } catch {
      return;
    }
    for (const m of msgs) this.handle(m, bin);
  }
  handle(m, bin) {
    if (m.msgId === 62) {
      this.proof = bin.subarray(m.offset);
      this.maybeAuth();
      return;
    }
    switch (m.msgId) {
      case 60:
        this.joined[60] = m.string;
        this.maybeConstants();
        break;
      case 30:
        this.joined[30] = m.fields;
        this.checkChallengeVal(m.fields.val);
        this.checkLobbySync(m.fields);
        this.maybeConstants();
        break;
      case 57:
        this.joined[57] = m.fields;
        this.maybeConstants();
        break;
      case 21:
        this.onClassSelect(m.fields);
        break;
      case 16:
        this.onStateAck();
        break;
      case 15:
        if (this.phase === "playing" && Date.now() - (this._lastResync || 0) > 2e3) {
          this._lastResync = Date.now();
          this.log("client desync msg 15 -> resending fullState");
          this.send([this.fullState()]);
        }
        break;
      case 1:
        this.me.inputVal = m.fields.val;
        this.me.aimByte = m.fields.x & 255;
        this.me.yawByte = m.fields.y & 255;
        this.me.inputTick = m.fields.rBEdfQOuYkz;
        break;
      case 52:
        if (Number.isFinite(m.fields.x) && Number.isFinite(m.fields.z)) {
          if (!this.me.alive || !this.me.spawned || this.spawnPending) break;
          const y = Number.isFinite(m.fields.y) ? m.fields.y : this.me.y;
          this.me.reported = { x: m.fields.x, y, z: m.fields.z, tick: this.me.inputTick };
          this.me.reportTick = this.me.inputTick;
          this.me.reportedAt = Date.now();
          this.me.x = m.fields.x;
          this.me.y = y;
          this.me.z = m.fields.z;
          if (!this.me.history) this.me.history = [];
          this.me.history.push({ time: Date.now(), x: m.fields.x, y, z: m.fields.z });
          const cutoff = Date.now() - 500;
          while (this.me.history.length > 2 && this.me.history[0].time < cutoff) {
            this.me.history.shift();
          }
        }
        break;
      case 8:
        this.alloc.handleShot(this.me, m.fields);
        break;
      case 40: {
        const text = String(m.string || "").slice(0, 120);
        if (!text) break;
        if (text.startsWith("__gloo:deploy:")) {
          if (!this.me.alive || !this.me.spawned) break;
          const parts = text.split(":");
          const x = parseFloat(parts[2]), y = parseFloat(parts[3]), z = parseFloat(parts[4]), yaw = parseFloat(parts[5]);
          const attachId = parts[6] === "attach" ? parseInt(parts[7], 10) || 0 : 0;
          if (Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z) && Number.isFinite(yaw)) {
            const px = this.me.reported ? this.me.reported.x : this.me.x;
            const pz = this.me.reported ? this.me.reported.z : this.me.z;
            const hDist = Math.hypot(x - px, z - pz);
            if (hDist > 25) {
              this.log("gloo", `REJECT deploy: distance ${hDist.toFixed(1)}m exceeds max range from player ${this.me.id}`);
              break;
            }
            const { wall, expired } = this.alloc.glooWalls.spawnWall(this.me.id, x, y, z, yaw, attachId);
            this.log("gloo", `SPAWN wall ${wall.id} by player ${this.me.id} at (${x.toFixed(1)}, ${y.toFixed(1)}, ${z.toFixed(1)}) yaw=${yaw.toFixed(2)} [dist=${hDist.toFixed(2)}m]${attachId ? ` attach=${attachId}` : ""}`);
            if (expired) {
              this.alloc.broadcast([encode("kM86hVW024", { id: 0, string: `__gloo:destroy:${expired.id}:replaced` })], null);
            }
            this.alloc.broadcast([encode("kM86hVW024", { id: 0, string: `__gloo:spawn:${wall.id}:${wall.ownerId}:${wall.x.toFixed(2)}:${wall.y.toFixed(2)}:${wall.z.toFixed(2)}:${wall.yaw.toFixed(3)}:${wall.hp}` })], null);
          }
          break;
        }
        this.alloc.broadcast([encode("kM86hVW024", { id: this.me.id, string: text })], null);
        break;
      }
      case 12:
      case 14:
        break;
      default:
        break;
    }
  }
  checkChallengeVal(val) {
    if (!this.challenge) return;
    const expected = (this.challenge * 2 + 1543246) % 3e7;
    if (val === expected) return;
    this.log("auth", "msg30 val mismatch got=" + val + " want=" + expected + " (set GP_NO_VAL_CHECK=1 to allow)");
    if (!process.env.GP_NO_VAL_CHECK) {
      try {
        this.ws.close(4400, "bad val");
      } catch {
      }
    }
  }
  // The client's msg30 echoes its lobby view (pmap/map, ituyDAEpKW/mode,
  // PSPGZlgWAcZ/time-limit as FO/FP/FQ indices). A mismatch against the
  // running match means the lobby and the game disagree — loud, not fatal.
  checkLobbySync(f) {
    if (!f) return;
    const wantMap = LOBBY_MAPS.indexOf(FT[this.alloc.mapIndex]);
    const wantMode = LOBBY_MODES.indexOf(MODE_INDEX_TABLE[this.alloc.modeIndex]);
    const wantTime = LOBBY_TIMES.indexOf(Math.round(this.alloc.matchLength / 60));
    const bad = [];
    if (Number.isInteger(f.pmap) && f.pmap !== wantMap) bad.push(`map client=${f.pmap} match=${wantMap}`);
    if (Number.isInteger(f.ituyDAEpKW) && f.ituyDAEpKW !== wantMode) bad.push(`mode client=${f.ituyDAEpKW} match=${wantMode}`);
    if (Number.isInteger(f.PSPGZlgWAcZ) && f.PSPGZlgWAcZ !== wantTime) bad.push(`time client=${f.PSPGZlgWAcZ} match=${wantTime}`);
    if (bad.length) this.log("sync", "lobby/match mismatch:", bad.join(" "));
  }
  maybeConstants() {
    if (this.phase !== "challenge" || this.joined[60] === void 0 || this.joined[30] === void 0 || this.joined[57] === void 0) return;
    this.phase = "constants";
    this.after(1100, () => {
      if (this.phase !== "constants") return;
      const rnd = () => crypto.randomInt(4294967296);
      this.send([encode("Xar7p83ajar", { m0: 2654435769, m1: 2135587861, a: rnd(), b: rnd(), c: rnd(), d: rnd() })]);
      this.after(400, () => this.maybeAuth());
    });
  }
  maybeAuth() {
    if (this.phase !== "constants" || this.proof === null) return;
    this.phase = "playing";
    const teamId = this.alloc.teamMode ? this.me.team : 0;
    this.send([encode("N3OM6i9r83", { id: teamId, fXfKmXLLuf: 0, DVhVGRcxjKL: 0 })]);
    this.sendSpawn();
  }
  sendSpawn() {
    const mapIndex = this.alloc.mapIndex !== void 0 ? this.alloc.mapIndex : MAP_INDEX;
    const modeIndex = this.alloc.modeIndex !== void 0 ? this.alloc.modeIndex : MODE_INDEX;
    const parts = [
      encode("yEE39Vc650", { headshots: 0, points: 0, arKills: 0, sniperKills: 0, smgKills: 0, shotgunKills: 0, kills: 0 }),
      encode("v3j2TU68H", { tdkZouYda: this.me.id }),
      // 3 self
      encode("a22SWM3PvBo", { h: mapIndex, lm: 0 }),
      // 33 map
      encode("a0fN31N7p", { h: modeIndex })
      // 32 mode
    ];
    for (const p of this.alloc.players) {
      parts.push(encode("j00e7mAiju", { id: p.id, rank: -2, string: p.name }));
      parts.push(encode("F29o2i138", { id: p.id, string: p.skins }));
    }
    parts.push(encode("F29o2i138", { id: this.me.id, string: this.me.skins }));
    for (const p of this.alloc.players) {
      parts.push(encode("RMFVb5UZGi7", {
        id: p.id,
        points: p.points,
        k: p.kills,
        d: p.deaths,
        h: p.weaponType || 0,
        p: 0,
        c: 0,
        hsp: p.headshots,
        PhbhpxFxPP: p.team,
        ha: p.assists,
        JgVHFEBAE: 0,
        TxJblhJNah: 0,
        aMWaisFtZ: 0
      }));
    }
    for (const p of this.alloc.players) parts.push(encode("k1Qu903595", { id: p.id, type: p.weaponType || 0 }));
    for (const p of this.alloc.players) {
      if (!p.spawned) continue;
      parts.push(this.alloc.stateMessage(p));
    }
    parts.push(encode("zSf6vw9ka", { nwQWcPQjr: this.seed }));
    parts.push(encode("COCjGf0Sf", { string: JSON.stringify([0.3, 0.158, 0.3, 0.3]) }));
    parts.push(encode("Ko38N6873G6", { cKRwdjkqGai: 2 }));
    parts.push(encode("kM86hVW024", { id: 0, string: "__gloo:clear" }));
    if (this.alloc && this.alloc.glooWalls) {
      for (const wall of this.alloc.glooWalls.walls.values()) {
        parts.push(encode("kM86hVW024", {
          id: 0,
          string: `__gloo:spawn:${wall.id}:${wall.ownerId}:${wall.x.toFixed(2)}:${wall.y.toFixed(2)}:${wall.z.toFixed(2)}:${wall.yaw.toFixed(3)}:${wall.hp}`
        }));
      }
    }
    this.send(parts);
  }
  respawnPlayer() {
    if (this.closed) return;
    this.alloc.respawn(this.me);
    this.spawnPending = true;
    log("modeldbg", `p${this.me.id} fallback-respawn: sent 22+18->victim, broadcast 22->others, spawnPending=true (awaiting msg16 ack for 17+29)`);
    this.send([
      encode("k1Qu903595", { id: this.me.id, type: this.me.weaponType }),
      // 22
      this.fullState()
      // 18
    ]);
    this.alloc.broadcast([
      encode("k1Qu903595", { id: this.me.id, type: this.me.weaponType })
    ], this);
  }
  onClassSelect(fields) {
    if (this.phase !== "playing") return;
    const type = Math.max(0, Math.min(3, fields.eXABYtRfN || 0));
    if (this.me.alive && this.me.spawned && type === this.me.weaponType) {
      log("modeldbg", `p${this.me.id} class-pick same-type while alive: 18 only, no 22 (model untouched)`);
      this.send([this.fullState()]);
      return;
    }
    const needsSpawn = !this.me.spawned || !this.me.alive;
    const changed = type !== this.me.weaponType;
    this.me.weaponType = type;
    this.me.ammo = WEAPON_AMMO[this.me.weaponType] || 40;
    if (!this.me.alive) {
      this.cancelRespawn();
      this.alloc.respawn(this.me);
    }
    if (needsSpawn) {
      this.spawnPending = true;
    }
    const send22 = changed || needsSpawn;
    log("modeldbg", `p${this.me.id} class-pick type=${type} needsSpawn=${needsSpawn} changed=${changed} send22=${send22} spawnPending=${this.spawnPending} alive=${this.me.alive} spawned=${this.me.spawned}`);
    this.send([
      ...send22 ? [encode("k1Qu903595", { id: this.me.id, type: this.me.weaponType })] : [],
      this.fullState()
      // 18
    ]);
    if (send22) this.alloc.broadcast([
      encode("k1Qu903595", { id: this.me.id, type: this.me.weaponType })
    ], this);
  }
  onStateAck() {
    if (!this.spawnPending) {
      if (process.env.GP_MODELDBG) log("modeldbg", `p${this.me.id} stray msg16 ack (no spawn pending) -> ignored`);
      return;
    }
    this.spawnPending = false;
    this.me.spawned = true;
    this.me.alive = true;
    this.me.hp = 100;
    this.alloc.startSecondTick();
    const livingParts = [
      encode("fm80f18li7", { x: 63, y: this.me.spawnYaw }),
      // 17 yaw/pitch bytes (real: x=63, y=spawn yaw; NOT the live input yaw)
      encode("GDzF2709XA3", {}),
      // 29 spawn trigger
      this.alloc.stateMessage(this.me)
      // 2 immediate living state (hp: 100, anim: 0x20)
    ];
    for (const opp of this.alloc.players) {
      if (opp !== this.me && opp.alive && opp.spawned) {
        livingParts.push(this.alloc.stateMessage(opp));
      }
    }
    this.send(livingParts);
    this.alloc.broadcast([
      encode("k1Qu903595", { id: this.me.id, type: this.me.weaponType || 0 }),
      this.alloc.stateMessage(this.me)
    ], this);
    log("modeldbg", `p${this.me.id} msg16 ack accepted: spawned=true alive=true hp=100 | sent 17+29+living2->victim, broadcast 22+2->others`);
  }
  fullState() {
    const p = this.me;
    const weaponType = p.weaponType || 0;
    const maxAmmo = WEAPON_AMMO[weaponType] || 40;
    const heading = p.yawByte * Math.PI / 128;
    return encode("UQbfX64829p", {
      loEhMkBVEme: 0,
      JoHdvmpcMvL: p.x,
      uBHZYKAHa: p.y,
      yxEKoSFAg: p.z,
      zjSptXbZfA: 0,
      QoYwfvDUd: 0,
      ULHoUFJiqo: 0,
      BMflnUjRv: p.x,
      pTWaJQCQIlk: p.y,
      KUkUYkavzt: p.z,
      bdyycxmjR: 0,
      gPEUHGwIpHk: p.spawned ? 1 : -1,
      GDSucbCLAxr: 0,
      a: Math.max(1, p.ammo || maxAmmo),
      stl: 0,
      sc: 0,
      sd: weaponType === 0 ? 195 : 0,
      rt: 0,
      tog: 0,
      la: p.spawned ? heading : Number.NaN,
      ja: Number.NaN,
      sp: 0,
      AUBAkIWQqEk: p.spawned ? 151 : 16
    });
  }
};
var isCli = true;
if (isCli) startGameplayServer().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
export {
  DEFAULT_REGION,
  GameSocket,
  LOBBY_MAPS,
  LOBBY_MODES,
  LOBBY_TIMES,
  MAP_SPAWNS,
  MODE_INDEX_TABLE,
  REGIONS,
  SAFE_MAP,
  balanceLobbyTeams,
  configuredScoreLimit,
  defaultMatchSeconds,
  isTeamModeIndex,
  makeAlloc,
  mapNameToIndex,
  modeNameToIndex,
  resolveLobbyMap,
  resolveRegion,
  scanVerifiedMaps,
  spawnsForMap,
  spawnsForMapIndex,
  startGameplayServer
};
