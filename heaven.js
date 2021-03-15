var indexBy = require("lodash.indexby")
var zip = require("lodash.zip")
var zipWith2 = require("lodash.zipwith")
var isArray = Array.isArray
var BAD_ATTRS = "Bad Attributes: "
var UNIMPLEMENTED = "Unimplemented"
module.exports = Heaven

function Heaven(model) {
	if (model) this.model = model
}

Heaven.prototype.model = Object
Heaven.prototype.idAttribute = "id"

Heaven.prototype.with = function(props) {
	var heaven = Object.create(this)
	if ("model" in props) heaven.model = props.model
	if ("idAttribute" in props) heaven.idAttribute = props.idAttribute
	return heaven
}

/**
 * Note that you cannot depend that the order of the returned models matches
 * the order in the query. That's because either databases may reorder their
 * response or because not all rows matched.
 */
Heaven.prototype.search = function(query, opts) {
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

Heaven.prototype._search = function(_query, _opts) {
	throw new Error(UNIMPLEMENTED)
}

Heaven.prototype.read = function(query, opts) {
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

Heaven.prototype._read = function(query, opts) {
	return this._search(query, opts).then(singleify)
}

Heaven.prototype.create = function(attrs, opts) {
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

Heaven.prototype._create = function(_attrs, _opts) {
	throw new Error(UNIMPLEMENTED)
}

Heaven.prototype.update = function(query, attrs, opts) {
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

Heaven.prototype._update = function(_query, _attrs, _opts) {
	throw new Error(UNIMPLEMENTED)
}

Heaven.prototype.delete = function(query, opts) {
	return this._delete(query, opts)
}

Heaven.prototype._delete = function(_query, _opts) {
	throw new Error(UNIMPLEMENTED)
}

/**
 * Group is optionally grouping the result set from the database before
 * parsing.
 */
Heaven.prototype.group = function(_query, attrs) {
	return attrs
}

/**
 * Parses attributes returned from the database to a format the model supports.	
 * Does not instantiate the model however! That's done by
 * `Heaven.prototype.new`.
 */
Heaven.prototype.parse = function(attrs) {
	return attrs
}

Heaven.prototype.assign = function(model, attrs) {
	for (var key in attrs) model[key] = attrs[key]
	return model
}

Heaven.prototype.assignArray = function(models, attrs) {
	var modelsById = indexBy(models, this.identify, this)

	return attrs.map(function(attrs) {
		return this.assign(modelsById[this.identify(attrs)], attrs)
	}, this)
}

Heaven.prototype.new = function(attrs) {
	return new this.model(attrs)
}

/**
 * Serializes a model or an object of attributes to the format the database
 * supports.	
 * Will be called both by `Heaven.prototype.create` to serialize models and
 * `Heaven.prototype.update` to serialize updated attributes.
 */
Heaven.prototype.serialize = function(obj) {
	switch (this.typeof(obj)) {
		case "object":
		case "model": return typeof obj.toJSON == "function" ? obj.toJSON() : obj
		default: throw new TypeError(BAD_ATTRS + obj)
	}
}

/**
 * Returns a unique id for the given model or attributes.  
 * Will be called both by `Heaven.prototype.read` to get the id to query models
 * for and for identifying returned attributes to associate them with models
 * for updating.
 */
Heaven.prototype.identify = function(model) {
	return model[this.idAttribute]
}

Heaven.prototype.typeof = function(query) {
	var kind = typeOf(query)
	return kind == "object" && query instanceof this.model ? "model" : kind
}

function typeOf(obj) {
	if (obj === null) return "null"
	if (isArray(obj)) return "array"
	if (obj instanceof RegExp) return "regexp"
	if (obj instanceof Map) return "map"
	return typeof obj
}

function isNully(value) { return value == null }
function isInstance(model, value) { return value instanceof model }
function singleify(array) { return array.length > 0 ? array[0] : null }
