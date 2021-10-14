var indexBy = require("lodash.indexby")
var zip = require("lodash.zip")
var isArray = Array.isArray
var BAD_ATTRS = "Bad Attributes: "
var UNIMPLEMENTED = "Unimplemented"
exports = module.exports = Heaven
exports.typeOf = typeOf

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

Heaven.prototype._search = function(_query, _opts) {
	throw new Error(UNIMPLEMENTED)
}

Heaven.prototype._create = function(_attrs, _opts) {
	throw new Error(UNIMPLEMENTED)
}

Heaven.prototype.update = function(query, attrs, opts) {
	switch (this.typeof(query)) {
		case "model": if (attrs === undefined) attrs = query; break

		case "array":
			if (attrs === undefined && query.every(isInstance.bind(null, this.model)))
				query = new Map(zip(query, query.map(this.serialize, this)))
			break

		case "map":
			var unserialized = query
			query = new Map

			unserialized.forEach(function(attrs, id) {
				query.set(id, this.serialize(attrs))
			}, this)

			break
	}

	switch (this.typeof(attrs)) {
		case "model":
		case "object": attrs = this.serialize(attrs); break
		case "undefined": if (query instanceof Map) break; // Fall through.
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

function isInstance(model, value) { return value instanceof model }
