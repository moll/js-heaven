var StandardError = require("standard-error")
module.exports = HeavenError

function HeavenError(code, msg) {
  StandardError.call(this, msg)
  this.code = code
}

HeavenError.prototype = Object.create(StandardError.prototype, {
  constructor: {value: HeavenError, configurable: true, writeable: true}
})

HeavenError.prototype.toString = function() {
  return this.name + ": " + this.code + " " + this.message
}

// Set name explicitly for when the code gets minified.
HeavenError.prototype.name = "HeavenError"
