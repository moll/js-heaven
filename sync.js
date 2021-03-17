var Heaven = require("./heaven")
var isArray = Array.isArray
var typeOf = require("./heaven").typeOf
var zip = require("lodash.zip")
var zipWith2 = require("lodash.zipwith")
var BAD_ATTRS = "Bad Attributes: "
var UNIMPLEMENTED = "Unimplemented"
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

HeavenSync.prototype._search = function(_query, _opts) {
	throw new Error(UNIMPLEMENTED)
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

	switch (typeOf(attrs)) {
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

HeavenSync.prototype._create = function(_attrs, _opts) {
	throw new Error(UNIMPLEMENTED)
}

HeavenSync.prototype.update = function(query, attrs, opts) {
	var type = this.typeof(query)
	if (type === "model" && attrs === undefined) attrs = query

	switch (typeOf(attrs)) {
		case "undefined":
			if (type === "array" && query.every(isInstance.bind(null, this.model)))
				query = new Map(zip(query, query.map(this.serialize, this)))
			else if (type !== "map")
				throw new TypeError(BAD_ATTRS + "undefined")
			break

		case "object": attrs = this.serialize(attrs); break
		default: throw new TypeError(BAD_ATTRS + attrs)
	}

	return this._update(query, attrs, opts)
}

HeavenSync.prototype._update = function(_query, _attrs, _opts) {
	throw new Error(UNIMPLEMENTED)
}

HeavenSync.prototype.delete = function(query, opts) {
	return this._delete(query, opts)
}

HeavenSync.prototype._delete = function(_query, _opts) {
	throw new Error(UNIMPLEMENTED)
}

function isNully(value) { return value == null }
function isInstance(model, value) { return value instanceof model }
function singleify(array) { return array.length > 0 ? array[0] : null }
