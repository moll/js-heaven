var Heaven = require("./heaven")
var isArray = Array.isArray
var zip = require("lodash.zip")
var zipWith2 = require("lodash.zipwith")
var BAD_ATTRS = "Bad Attributes: "
var UNIMPLEMENTED = "Unimplemented"
var typeOf = require("./heaven").typeOf
module.exports = HeavenAsync

function HeavenAsync(model) {
	Heaven.call(this, model)
}

HeavenAsync.prototype = Object.create(Heaven.prototype, {
	constructor: {value: HeavenAsync, configurable: true, writeable: true}
})

/**
 * Note that you cannot depend that the order of the returned models matches
 * the order in the query. That's because either databases may reorder their
 * response or because not all rows matched.
 */
HeavenAsync.prototype.search = function(query, opts) {
	var self = this

	return this._search(query, opts).then(function(attrs) {
		attrs = self.group(query, attrs)
		if (attrs.length == 0) return attrs
		attrs = attrs.map(self.parse, self)

		switch (self.typeof(query)) {
			case "model":
				return self.assignArray([query], attrs)

			case "array":
				if (query.length > 0 && query.every(isInstance.bind(null, self.model)))
					return self.assignArray(query, attrs)
				// Fall through.

			default: return attrs.map(self.new, self)
		}
	})
}

HeavenAsync.prototype._search = function(_query, _opts) {
	throw new Error(UNIMPLEMENTED)
}

HeavenAsync.prototype.read = function(query, opts) {
	var self = this

	return this._read(query, opts).then(function(attrs) {
		if (attrs == null) return null
		attrs = self.parse(attrs)

		switch (self.typeof(query)) {
			case "model": return self.assign(query, attrs)
			default: return self.new(attrs)
		}
	})
}

HeavenAsync.prototype._read = function(query, opts) {
	return this._search(query, opts).then(singleify)
}

HeavenAsync.prototype.create = function(attrs, opts) {
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

	return created.then(function(created) {
		created = created.map(self.parse, self)

		if (attrs.every(isInstance.bind(null, self.model)))
			created = zipWith2(attrs, created, self.assign, self)

		return single ? singleify(created) : created
	})
}

HeavenAsync.prototype._create = function(_attrs, _opts) {
	throw new Error(UNIMPLEMENTED)
}

HeavenAsync.prototype.update = function(query, attrs, opts) {
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

HeavenAsync.prototype._update = function(_query, _attrs, _opts) {
	throw new Error(UNIMPLEMENTED)
}

HeavenAsync.prototype.delete = function(query, opts) {
	return this._delete(query, opts)
}

HeavenAsync.prototype._delete = function(_query, _opts) {
	throw new Error(UNIMPLEMENTED)
}

function isNully(value) { return value == null }
function isInstance(model, value) { return value instanceof model }
function singleify(array) { return array.length > 0 ? array[0] : null }
