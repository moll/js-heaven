var HeavenError = require("./error")
var Map = global.Map || function Map() { throw new ReferenceError("No Map") }
var indexBy = require("lodash.indexby")
var zip = require("lodash.zip")
var zipWith2 = require("lodash.zipwith")
var isArray = Array.isArray
var BAD_ATTRS = "Bad Attributes: "
var NOT_FOUND = "Not Found"
var MORE_FOUND = "More Than Expected"
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
 * Search is like `read`, but does not throw Not Found when the given id or an
 * array of ids return no models.
 */
Heaven.prototype.search = function(query, opts) {
	var self = this

	return this._read(query, opts).then(function(attrs) {
		if (attrs == null) return null
		attrs = self.group(query, attrs)
		attrs = isArray(attrs) ? attrs.map(self.parse, self) : self.parse(attrs)

		switch (self.typeof(query)) {
			case "model":
				return self.assign(query, attrs)

			case "array":
				if (query.length > 0 && query.every(isInstance.bind(null, self.model)))
					return self.assignArray(query, attrs)
		}

		return isArray(attrs) ? attrs.map(self.new, self) : self.new(attrs)
	})
}

Heaven.prototype.read = function(query, opts) {
	return this.search(query, opts).then(this.assert.bind(this, query))
}

Heaven.prototype._read = function(_query, _opts) {
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

	var models = attrs.map(make.bind(null, this.model, this.new.bind(this)))
	var created = this._create(models.map(this.serialize, this), opts)
	created = created.then(map.bind(this, this.parse))
	models = created.then(zipWith.bind(this, this.assign, models))
	return single ? models.then(singleify) : models
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
	return arguments.length > 0 ? this._delete(query, opts) : this._delete()
}

Heaven.prototype._delete = function(_query, _opts) {
	throw new Error(UNIMPLEMENTED)
}

/**
 * Group is optionally grouping the result or result set from the database
 * before parsing.
 */
Heaven.prototype.group = function(_query, attrs) {
	return attrs
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
	return new this.model(attrs)
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
	return query instanceof this.model ? "model" : typeOf(query)
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
			if (models.length > query.length) throw new HeavenError(508, MORE_FOUND)
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

function make(klass, create, attrs) {
	return attrs instanceof klass ? attrs : create(attrs)
}

function map(fn, array) { return array.map(fn, this) }
function zipWith(fn, a, b) { return zipWith2(a, b, fn, this) }
function isNully(value) { return value == null }
function isInstance(model, value) { return value instanceof model }
function singleify(array) { return array.length > 0 ? array[0] : null }
