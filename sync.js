var Heaven = require("./heaven")
var isArray = Array.isArray
var zipWith2 = require("lodash.zipwith")
var BAD_ATTRS = "Bad Attributes: "
module.exports = HeavenSync

function HeavenSync(model) {
	Heaven.call(this, model)
}

HeavenSync.prototype = Object.create(Heaven.prototype, {
	constructor: {value: HeavenSync, configurable: true, writeable: true}
})

HeavenSync.prototype.search = function(query, opts) {
	var attrs = this._search(query, opts)
	attrs = this.group(query, attrs)
	if (attrs.length == 0) return attrs

	attrs = attrs.map(this.parse, this)

	switch (this.typeof(query)) {
		case "model":
			return this.assignArray([query], attrs)

		case "array":
			if (query.length > 0 && query.every(isInstance.bind(null, this.model)))
				return this.assignArray(query, attrs)
			// Fall through.

		default: return attrs.map(this.new, this)
	}
}

HeavenSync.prototype.read = function(query, opts) {
	var attrs = this._read(query, opts)
	if (attrs == null) return null
	attrs = this.parse(attrs)

	switch (this.typeof(query)) {
		case "model": return this.assign(query, attrs)
		default: return this.new(attrs)
	}
}

HeavenSync.prototype._read = function(query, opts) {
	return singleify(this._search(query, opts))
}

HeavenSync.prototype.create = function(attrs, opts) {
	var self = this
	var single = !isArray(attrs)

	switch (this.typeof(attrs)) {
		case "model":
		case "object":
			attrs = [attrs]
			break

		case "array":
			if (attrs.some(isNully)) throw new TypeError(BAD_ATTRS + "Null in array")
			break

		default: throw new TypeError(BAD_ATTRS + attrs)
	}

	var created = this._create(attrs.map(this.serialize, this), opts)
	created = created.map(self.parse, self)

	if (attrs.every(isInstance.bind(null, self.model)))
		created = zipWith2(attrs, created, self.assign, self)

	return single ? singleify(created) : created
}

function isNully(value) { return value == null }
function isInstance(model, value) { return value instanceof model }
function singleify(array) { return array.length > 0 ? array[0] : null }
