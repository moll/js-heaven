var _ = require("./lib")
var HeavenError = require("./error")
var Map = global.Map || function Map() { throw new ReferenceError("No Map") }
var assign = require("oolong").assign
var isArray = Array.isArray
var BAD_ATTRS = "Bad Attributes: "
var NOT_FOUND = "Not Found"
var DUPLICATE = "Duplicate Detected"
var UNIMPLEMENTED = "Unimplemented"
module.exports = Heaven

function Heaven(model) {
	if (model) this.model = model
}

// Standardizing numberAttribute and stringAttribute for code outside of Heaven.
Heaven.prototype.model = Object
Heaven.prototype.idAttribute = "id"
Heaven.prototype.numberAttribute = "id"
Heaven.prototype.stringAttribute = "uuid"

Heaven.prototype.with = function(opts) {
	var heaven = Object.create(this)
	if (opts.model) heaven.model = opts.model
	if (opts.idAttribute) heaven.idAttribute = opts.idAttribute
	if (opts.numberAttribute) heaven.numberAttribute = opts.numberAttribute
	if (opts.stringAttribute) heaven.stringAttribute = opts.stringAttribute
	return heaven
}

/**
 * Search is like `read`, but does not throw Not Found when the given id or an
 * array of ids return no models.
 */
Heaven.prototype.search = function(query, opts) {
	var self = this
	var attrs = this._read(query, opts)

	// Should models be assigned to before or after Heaven.prototype.assert?
	return attrs.then(function(attrs) {
		if (attrs == null) return null
		attrs = isArray(attrs) ? attrs.map(self.parse, self) : self.parse(attrs)

		switch (self.typeof(query)) {
			case "model":
				return self.assign(query, attrs)

			case "array":
				if (query.length > 0 && query.every(isModel.bind(null, self)))
					return self.assignArray(query, attrs)
		}

		return isArray(attrs) ? attrs.map(self.new, self) : self.new(attrs)
	})
}

Heaven.prototype.read = function(query, opts) {
	return this.search(query, opts).then(this.assert.bind(this, query))
}

Heaven.prototype._read = function(query, opts) {
	throw new Error(UNIMPLEMENTED)
}

Heaven.prototype.create = function(attrs, opts) {
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

	var models = attrs.map(this.new, this)
	var created = this._create(models.map(this.serialize, this), opts)
	created = created.then(map.bind(this, this.parse))
	models = created.then(zipWith.bind(this, this.assign, models))
	return single ? models.then(singleify) : models
}

Heaven.prototype._create = function(attrs, opts) {
	throw new Error(UNIMPLEMENTED)
}

Heaven.prototype.update = function(query, attrs, opts) {
	var type = this.typeof(query)
	if (type === "model" && attrs === undefined) attrs = query

	switch (typeOf(attrs)) {
		case "undefined":
			if (type === "array" && query.every(isModel.bind(null, this)))
				query = new Map(_.zip(query, query.map(this.serialize, this)))
			else if (type !== "map")
				throw new TypeError(BAD_ATTRS + "undefined")
			break

		case "object": attrs = this.serialize(attrs); break
		default: throw new TypeError(BAD_ATTRS + attrs)
	}

	return this._update(query, attrs, opts)
}

Heaven.prototype._update = function(query, attrs, opts) {
	throw new Error(UNIMPLEMENTED)
}

Heaven.prototype.delete = function(query, opts) {
	return arguments.length > 0 ? this._delete(query, opts) : this._delete()
}

Heaven.prototype._delete = function(query, opts) {
	throw new Error(UNIMPLEMENTED)
}

/**
 * Parses attributes returned from the database to a format the model
 * supports.	
 * Does not instantiate the model however! That's done by
 * `Heaven.prototype.new`.
 */
Heaven.prototype.parse = function(attrs) {
	return attrs
}

/**
 * Serializes a model or an object of attributes to the format the database
 * supports.	
 * Will be called both by `Heaven.prototype.create` to serialize models and
 * `Heaven.prototype.update` to serialize updated attributes.
 */
Heaven.prototype.serialize = function(model) {
	switch (this.typeof(model)) {
		case "object":
		case "model":
			return typeof model.toJSON == "function" ? model.toJSON() : model

		default: throw new TypeError(BAD_ATTRS + model)
	}
}

Heaven.prototype.new = function(attrs) {
	return attrs instanceof this.model ? attrs : new this.model(attrs)
}

Heaven.prototype.assign = function(model, attrs) {
	return assign(model, attrs)
}

Heaven.prototype.assignArray = function(models, attrs) {
	models = _.indexBy(models, this.identify, this)

	return attrs.map(function(attrs) {
		return this.assign(models[this.identify(attrs)], attrs)
	}, this)
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
	var type = typeOf(query)
	if (type == "object" && query instanceof this.model) return "model"
	return type
}

Heaven.prototype.assert = function(query, models) {
	switch (this.typeof(query)) {
		case "number":
		case "string":
		case "model":
			if (models == null) throw new HeavenError(404, NOT_FOUND)
			return models

		case "array":
			if (models.length < query.length) throw new HeavenError(404, NOT_FOUND)
			if (models.length > query.length) throw new HeavenError(508, DUPLICATE)
			return models

		default: return models
	}
}

function typeOf(obj) {
	if (obj === null) return "null"
	if (isArray(obj)) return "array"
	if (obj instanceof RegExp) return "regexp"
	if (obj instanceof Map) return "map"
	return typeof obj
}

function map(fn, array) { return array.map(fn, this) }
function zipWith(fn, a, b) { return _.zipWith(a, b, fn, this) }
function isNully(value) { return value == null }
function isModel(heaven, value) { return heaven.typeof(value) === "model" }
function singleify(array) { return array.length > 0 ? array[0] : null }
