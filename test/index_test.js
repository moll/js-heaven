var O = require("oolong")
var Heaven = require("..")
var HeavenError = require("../error")
var Sinon = require("sinon")
var isPrototypeOf = Function.call.bind(Object.isPrototypeOf)
var compose = require("lodash.compose")
var promise = compose(constant, Promise.resolve.bind(Promise))
var resolve = Promise.resolve.bind(Promise)
var toUpperCase = Function.call.bind(String.prototype.toUpperCase)
var EXAMPLE_OPTS = {deleted: true}

function HeavenOnTest(model) { Heaven.call(this, model) }

HeavenOnTest.prototype = Object.create(Heaven.prototype, {
	constructor: {value: HeavenOnTest, configurable: true, writeable: true}
})

HeavenOnTest.prototype.identify = function(model) {
	if (model instanceof this.model) return model.attributes[this.idAttribute]
	else return model[this.idAttribute]
}

HeavenOnTest.prototype.assign = function(model, attrs) {
	return model.set(attrs), model
}

// Saving attributes to this.attributes catches double model initialization.
function Model(attrs) { this.attributes = attrs }
Model.prototype.set = function(attrs) { O.assign(this.attributes, attrs) }
Model.prototype.toJSON = function() { return this.attributes }

describe("Heaven", function() {
	function create() {
		var heaven = new HeavenOnTest(Model)
		heaven._read = Sinon.spy(resolve)
		heaven._create = Sinon.spy(resolve)
		heaven._update = Sinon.spy(resolve)
		heaven._delete = Sinon.spy(resolve)
		return heaven
	}

	describe("new", function() {
		it("must be an instance of Heaven", function() {
			new Heaven().must.be.an.instanceof(Heaven)
		})

		it("must set model to Object by default", function() {
			new Heaven().model.must.equal(Object)
		})

		it("must set model when given as argument", function() {
			new Heaven(Model).model.must.equal(Model)
		})
	})

	describe(".prototype.with", function() {
		it("must be an instance of Heaven", function() {
			isPrototypeOf(Heaven.prototype, new Heaven().with({})).must.be.true()
		})

		it("must set model", function() {
			new Heaven().with({model: Model}).model.must.equal(Model)
		})

		it("must set idAttribute", function() {
			new Heaven().with({idAttribute: "uid"}).idAttribute.must.equal("uid")
		})

		it("must set numberAttribute", function() {
			var heaven = new Heaven().with({numberAttribute: "uid"})
			heaven.numberAttribute.must.equal("uid")
		})

		it("must set stringAttribute", function() {
			var heaven = new Heaven().with({stringAttribute: "uid"})
			heaven.stringAttribute.must.equal("uid")
		})
	})

	function mustBeReadable(method) {
		describe("as a readable method", function() {
			it("must return a promise", function() {
				create()[method]().then.must.be.a.function()
			})

			describe("given nothing", function() {
				it("must call _read", function() {
					var heaven = create()
					heaven[method]()
					heaven._read.firstCall.args.must.eql([undefined, undefined])
				})

				it("must resolve with an array of models", function*() {
					var heaven = create()
					heaven._read = promise([{name: "John"}, {name: "Mike"}])

					yield heaven[method]().must.then.eql([
						new Model({name: "John"}),
						new Model({name: "Mike"})
					])
				})

				it("must resolve with an empty array if no models", function*() {
					var heaven = create()
					heaven._read = promise([])
					yield heaven[method]().must.then.eql([])
				})
			})

			describe("given an id", function() {
				it("must call _read", function() {
					var heaven = create()
					heaven[method](42, EXAMPLE_OPTS)
					heaven._read.firstCall.args.must.eql([42, EXAMPLE_OPTS])
				})

				it("must resolve with a model", function*() {
					var heaven = create()
					heaven._read = promise({name: "John"})
					yield heaven[method](42).must.then.eql(new Model({name: "John"}))
				})

				it("must resolve with an array of models", function*() {
					var heaven = create()
					heaven._read = promise([{name: "John"}, {name: "Mike"}])

					yield heaven[method](42).must.then.eql([
						new Model({name: "John"}),
						new Model({name: "Mike"})
					])
				})

				// Protects against naive boolean checks.
				it("must parse 0 to model", function*() {
					/* eslint no-new-wrappers: 0 */
					var heaven = create().with({model: Number})
					heaven._read = promise(0)
					yield heaven[method]("Zero").must.then.eql(new Number(0))
				})
			})

			describe("given a model", function() {
				it("must call _read", function() {
					var model = new Model({name: "John"})
					var heaven = create()
					heaven[method](model, EXAMPLE_OPTS)
					heaven._read.firstCall.args.must.eql([model, EXAMPLE_OPTS])
				})

				it("must resolve with the model and assign new attributes",
					function*() {
					var model = new Model({name: "John"})
					var heaven = create()
					heaven._read = promise({name: "Raul"})
					yield heaven[method](model).must.then.eql(new Model({name: "Raul"}))
					model.must.eql(new Model({name: "Raul"}))
				})
			})

			describe("given an array", function() {
				it("must call _read given ids", function() {
					var heaven = create()
					heaven[method]([42, 69], EXAMPLE_OPTS)
					heaven._read.firstCall.args.must.eql([[42, 69], EXAMPLE_OPTS])
				})

				it("must resolve with a model given id", function*() {
					var heaven = create()
					heaven._read = promise([{name: "John"}])
					yield heaven[method]([42]).must.then.eql([new Model({name: "John"})])
				})

				it("must resolve with an array of models given ids", function*() {
					var heaven = create()
					heaven._read = promise([{name: "John"}, {name: "Mike"}])

					yield heaven[method]([42, 69]).must.then.eql([
						new Model({name: "John"}),
						new Model({name: "Mike"})
					])
				})

				// Protects against naive boolean checks.
				it("must parse 0 to model given ids", function*() {
					/* eslint no-new-wrappers: 0 */
					var heaven = create().with({model: Number})
					heaven._read = promise([0])
					yield heaven[method](["Zero"]).must.then.eql([new Number(0)])
				})

				it("must call _read given models", function() {
					var a = new Model({name: "John"})
					var b = new Model({name: "Mike"})
					var heaven = create()
					heaven[method]([a, b], EXAMPLE_OPTS)
					heaven._read.firstCall.args.must.eql([[a, b], EXAMPLE_OPTS])
				})

				it("must resolve with models given models", function*() {
					var a = new Model({id: 13, name: "John"})
					var b = new Model({id: 42, name: "Mike"})

					var heaven = create()
					heaven._read = promise([
						{id: 13, name: "Jane"},
						{id: 42, name: "Raul"}
					])

					var models = yield heaven[method]([a, b])
					models.must.be.an.array()
					models.length.must.equal(2)
					models[0].must.equal(a)
					models[1].must.equal(b)

					a.must.eql(new Model({id: 13, name: "Jane"}))
					b.must.eql(new Model({id: 42, name: "Raul"}))
				})

				it("must resolve with unchanged models given models", function*() {
					var a = new Model({id: 13, name: "John"})
					var b = new Model({id: 42, name: "Mike"})

					var heaven = create()
					heaven._read = promise([
						{id: 13, name: "John"},
						{id: 42, name: "Raul"}
					])

					var models = yield heaven[method]([a, b])
					models.must.be.an.array()
					models.length.must.equal(2)
					models[0].must.equal(a)
					models[1].must.equal(b)

					a.must.eql(new Model({id: 13, name: "John"}))
					b.must.eql(new Model({id: 42, name: "Raul"}))
				})

				it("must resolve with models by ids given models", function*() {
					var a = new Model({id: 13, name: "John"})
					var b = new Model({id: 42, name: "Mike"})

					var heaven = create()
					heaven._read = promise([
						{id: 42, name: "Raul"},
						{id: 13, name: "Jane"}
					])

					var models = yield heaven[method]([a, b])
					models.must.be.an.array()
					models.length.must.equal(2)
					models[0].must.equal(b)
					models[1].must.equal(a)

					a.must.eql(new Model({id: 13, name: "Jane"}))
					b.must.eql(new Model({id: 42, name: "Raul"}))
				})
			})
		})
	}

	describe(".prototype.search", function() {
		mustBeReadable("search")

		describe("given an id", function() {
			it("must resolve with null if undefined returned", function*() {
				var heaven = create()
				heaven._read = promise(undefined)
				yield heaven.search(42).must.then.equal(null)
			})

			it("must resolve with null if null returned", function*() {
				var heaven = create()
				heaven._read = promise(null)
				yield heaven.search(42).must.then.equal(null)
			})
		})

		describe("given a model", function() {
			it("must resolve with null if none returned", function*() {
				var model = new Model({name: "John"})
				var heaven = create()
				heaven._read = promise(null)
				yield heaven.search(model).must.then.eql(null)
				model.must.eql(new Model({name: "John"}))
			})
		})

		describe("given an array", function() {
			it("must resolve with empty array given an empty array",
				function*() {
				var heaven = create()
				heaven._read = promise([])
				yield heaven.search([]).must.then.eql([])
			})

			it("must resolve with empty array if empty array returned given id",
				function*() {
				var heaven = create()
				heaven._read = promise([])
				yield heaven.search([42]).must.then.eql([])
			})

			it("must resolve with models if empty array returned given ids",
				function*() {
				var heaven = create()
				heaven._read = promise([])
				yield heaven.search([42, 69]).must.then.eql([])
			})

			it("must resolve with models if less returned given ids", function*() {
				var heaven = create()
				heaven._read = promise([{name: "John"}])
				yield heaven.search([42, 69]).must.then.eql([new Model({name: "John"})])
			})

			it("must resolve with models if more returned given ids", function*() {
				var heaven = create()
				heaven._read = promise([{name: "John"}, {name: "Mike"}, {name: "Jo"}])

				yield heaven.search([42, 69]).must.then.eql([
					new Model({name: "John"}),
					new Model({name: "Mike"}),
					new Model({name: "Jo"})
				])
			})

			it("must resolve with models if less returned given models", function*() {
				var heaven = create()
				heaven._read = promise([{id: 13, name: "Jane"}])

				var a = new Model({id: 13, name: "John"})
				var b = new Model({id: 42, name: "Mike"})

				var models = yield heaven.search([a, b])
				models.must.be.an.array()
				models.length.must.equal(1)
				models[0].must.equal(a)

				a.must.eql(new Model({id: 13, name: "Jane"}))
				b.must.eql(new Model({id: 42, name: "Mike"}))
			})
		})
	})

	describe(".prototype.read", function() {
		mustBeReadable("read")

		describe("given an id", function() {
			it("must reject with HeavenError if undefined returned", function*() {
				var heaven = create()
				heaven._read = promise(undefined)

				var err
				try { yield heaven.read(42) } catch (ex) { err = ex }
				err.must.be.an.error(HeavenError, /not found/i)
				err.code.must.equal(404)
			})

			it("must reject with HeavenError if null returned", function*() {
				var heaven = create()
				heaven._read = promise(null)

				var err
				try { yield heaven.read(42) } catch (ex) { err = ex }
				err.must.be.an.error(HeavenError, /not found/i)
				err.code.must.equal(404)
			})
		})

		describe("given a model", function() {
			it("must resolve with null if none returned", function*() {
				var heaven = create()
				heaven._read = promise(null)

				var err
				try { yield heaven.read(new Model({name: "John"})) }
				catch (ex) { err = ex }
				err.must.be.an.error(HeavenError, /not found/i)
				err.code.must.equal(404)
			})
		})

		describe("given an array", function() {
			it("must reject with HeavenError if none returned given id",
				function*() {
				var heaven = create()
				heaven._read = promise([])

				var err
				try { yield heaven.read([42]) } catch (ex) { err = ex }
				err.must.be.an.error(HeavenError, /not found/i)
				err.code.must.equal(404)
			})

			it("must reject with HeavenError if none returned given ids",
				function*() {
				var heaven = create()
				heaven._read = promise([])

				var err
				try { yield heaven.read([42, 69]) } catch (ex) { err = ex }
				err.must.be.an.error(HeavenError, /not found/i)
				err.code.must.equal(404)
			})

			it("must reject with HeavenError if less returned given ids",
				function*() {
				var heaven = create()
				heaven._read = promise([{name: "John"}])

				var err
				try { yield heaven.read([42, 69]) } catch (ex) { err = ex }
				err.must.be.an.error(HeavenError, /not found/i)
				err.code.must.equal(404)
			})

			it("must reject with HeavenError if more returned given ids",
				function*() {
				var heaven = create()
				heaven._read = promise([{name: "John"}, {name: "Mike"}, {name: "Jo"}])

				var err
				try { yield heaven.read([42, 69]) } catch (ex) { err = ex }
				err.must.be.an.error(HeavenError, "More Than Expected")
				err.code.must.equal(508)
			})

			it("must reject with HeavenError if less returned given models",
				function*() {
				var heaven = create()
				heaven._read = promise([{id: 13, name: "Jane"}])

				var a = new Model({id: 13, name: "John"})
				var b = new Model({id: 42, name: "Mike"})

				var err
				try { yield heaven.read([a, b]) } catch (ex) { err = ex }
				err.must.be.an.error(HeavenError, /not found/i)
				err.code.must.equal(404)
			})
		})
	})

	describe(".prototype.create", function() {
		it("must return a promise", function() {
			create().create({}).then.must.be.a.function()
		})

		it("must throw TypeError given nothing", function() {
			var err
			try { create().create() } catch (ex) { err = ex }
			err.must.be.an.error(TypeError, /bad attributes/i)
		})

		it("must throw TypeError given undefined", function() {
			var err
			try { create().create(undefined) } catch (ex) { err = ex }
			err.must.be.an.error(TypeError, /bad attributes/i)
		})

		it("must throw TypeError given null", function() {
			var err
			try { create().create(null) } catch (ex) { err = ex }
			err.must.be.an.error(TypeError, /bad attributes/i)
		})

		describe("given attributes", function() {
			it("must call _create with serialized model", function() {
				var heaven = create()
				heaven.create({name: "John"}, EXAMPLE_OPTS)
				heaven._create.callCount.must.equal(1)
				heaven._create.firstCall.args.must.eql([[{name: "John"}], EXAMPLE_OPTS])
			})

			it("must call _create with inherited attributes", function() {
				var heaven = create()
				var attrs = Object.create({a: 42}); attrs.b = 69
				heaven.create(attrs, EXAMPLE_OPTS)
				heaven._create.callCount.must.equal(1)
				heaven._create.firstCall.args.must.eql([[{a: 42, b: 69}], EXAMPLE_OPTS])
			})

			it("must resolve with a model and assign new attributes", function*() {
				var heaven = create()
				heaven._create = promise([{id: 13}])
				var updated = yield heaven.create({name: "John"})
				return updated.must.eql(new Model({id: 13, name: "John"}))
			})

			// Heaven once did so. Keeping this for safety.
			it("must not stringify nested plain objects", function() {
				var heaven = create()
				heaven.create({bird: {nest: 1}})
				heaven._create.firstCall.args[0].must.eql([{bird: {nest: 1}}])
			})
		})

		describe("given a model", function() {
			it("must call _create with serialized model", function() {
				var heaven = create()
				heaven.create(new Model({name: "John"}), EXAMPLE_OPTS)
				heaven._create.callCount.must.equal(1)
				heaven._create.firstCall.args.must.eql([[{name: "John"}], EXAMPLE_OPTS])
			})

			it("must resolve with the model and assign new attributes", function*() {
				var heaven = create()
				heaven._create = promise([{id: 13}])
				var model = new Model({name: "John"})
				yield heaven.create(model).must.then.equal(model)
				model.must.eql(new Model({id: 13, name: "John"}))
			})

			it("must serialize with toJSON if it exists", function() {
				var heaven = create().with({model: Object})
				heaven.create({toJSON: function() { return {name: "Mike"} }})
				heaven._create.firstCall.args[0].must.eql([{name: "Mike"}])
			})

			it("must serialize with toJSON only if it's a function", function() {
				var heaven = create().with({model: Object})
				heaven.create({a: 1, b: 2, toJSON: 3})
				heaven._create.firstCall.args[0].must.eql([{a: 1, b: 2, toJSON: 3}])
			})
		})

		describe("given an array", function() {
			it("must throw TypeError given undefined", function() {
				var err
				try { create().create([undefined]) } catch (ex) { err = ex }
				err.must.be.an.error(TypeError, /bad attributes/i)
			})

			it("must throw TypeError given undefined and object array", function() {
				var err
				try { create().create([undefined, {}]) } catch (ex) { err = ex }
				err.must.be.an.error(TypeError, /bad attributes/i)
			})

			it("must throw TypeError given null", function() {
				var err
				try { create().create([null]) } catch (ex) { err = ex }
				err.must.be.an.error(TypeError, /bad attributes/i)
			})

			it("must throw TypeError given null and object", function() {
				var err
				try { create().create([null, {}]) } catch (ex) { err = ex }
				err.must.be.an.error(TypeError, /bad attributes/i)
			})

			it("must call _create given an empty array",
				function*() {
				var heaven = create()
				yield heaven.create([], EXAMPLE_OPTS).must.then.eql([])
				heaven._create.firstCall.args.must.eql([[], EXAMPLE_OPTS])
			})

			it("must call _create with serialized models given attributes",
				function() {
				var heaven = create()
				heaven.create([{name: "John"}, {name: "Mike"}], EXAMPLE_OPTS)
				heaven._create.callCount.must.equal(1)

				heaven._create.firstCall.args.must.eql([
					[{name: "John"}, {name: "Mike"}],
					EXAMPLE_OPTS
				])
			})

			it("must resolve with model and assign new attributes given attributes",
				function*() {
				var heaven = create()
				heaven._create = promise([{id: 13}])
				var updated = yield heaven.create([{name: "John"}])
				updated.must.eql([new Model({id: 13, name: "John"})])
			})

			it("must resolve with models and assign new attributes given attributes",
				function*() {
				var heaven = create()
				heaven._create = promise([{id: 13}, {id: 42}])

				yield heaven.create([{name: "John"}, {name: "Mike"}]).must.then.eql([
					new Model({id: 13, name: "John"}),
					new Model({id: 42, name: "Mike"}),
				])
			})

			it("must resolve with model and assign new attributes given model",
				function*() {
				var heaven = create()
				heaven._create = promise([{id: 13}])
				var a = new Model({name: "John"})

				var updated = yield heaven.create([a])
				updated.must.be.an.array()
				updated.length.must.equal(1)
				updated[0].must.equal(a)

				a.must.eql(new Model({id: 13, name: "John"}))
			})

			it("must resolve with models and assign new attributes given models",
				function*() {
				var heaven = create()
				heaven._create = promise([{id: 13}, {id: 42}])
				var a = new Model({name: "John"})
				var b = new Model({name: "Mike"})

				var updated = yield heaven.create([a, b])
				updated.must.be.an.array()
				updated.length.must.equal(2)
				updated[0].must.equal(a)
				updated[1].must.equal(b)

				a.must.eql(new Model({id: 13, name: "John"}))
				b.must.eql(new Model({id: 42, name: "Mike"}))
			})
		})
	})

	describe(".prototype.update", function() {
		it("must return a promise", function() {
			create().update(42, {name: "John"}).then.must.be.a.function()
		})

		it("must throw TypeError given nothing", function() {
			var err
			try { create().update() } catch (ex) { err = ex }
			err.must.be.an.error(TypeError, /bad attributes/i)
		})

		describe("given an id and attributes", function() {
			it("must throw TypeError given undefined", function() {
				var err
				try { create().update(42, undefined) } catch (ex) { err = ex }
				err.must.be.an.error(TypeError, /bad attributes/i)
			})

			it("must throw TypeError given null", function() {
				var err
				try { create().update(42, null) } catch (ex) { err = ex }
				err.must.be.an.error(TypeError, /bad attributes/i)
			})

			it("must call _update with serialized attributes", function() {
				var heaven = create()
				heaven.serialize = compose(upcaseKeys, heaven.serialize)
				heaven.update(42, {name: "John"}, EXAMPLE_OPTS)

				heaven._update.firstCall.args.must.eql([
					42, {NAME: "John"}, EXAMPLE_OPTS
				])
			})

			it("must resolve with updates", function*() {
				var heaven = create()
				heaven._update = promise({id: 13})
				yield heaven.update(42, {name: "John"}).must.then.eql({id: 13})
			})

			// Support this no-op.
			it("must call _update with empty attributes", function() {
				var heaven = create()
				heaven.update(42, {}, EXAMPLE_OPTS)
				heaven._update.firstCall.args.must.eql([42, {}, EXAMPLE_OPTS])
			})
		})

		describe("given a model and attributes", function() {
			it("must call _update with serialized model", function() {
				var heaven = create()
				heaven.serialize = compose(upcaseKeys, heaven.serialize)
				var model = new Model({name: "John"})
				heaven.update(model, undefined, EXAMPLE_OPTS)

				heaven._update.firstCall.args.must.eql([
					model, {NAME: "John"}, EXAMPLE_OPTS
				])
			})

			//it("must resolve with the model and assign new attributes", function*() {
			//	var heaven = create()
			//	heaven._update = promise({id: 13})
			//	var model = new Model({name: "John"})
			//	yield heaven.update(model, {name: "Mike"}).must.then.equal(model)
			//	model.must.eql(new Model({id: 13, name: "John"}))
			//})

			//it("must resolve with the model if undefined returned", function*() {
			//	var heaven = create()
			//	heaven._update = promise(undefined)
			//	var model = new Model({name: "John"})
			//	yield heaven.update(model).must.then.equal(model)
			//	model.must.eql(new Model({name: "John"}))
			//})

			//it("must resolve with the model if null returned", function*() {
			//	var heaven = create()
			//	heaven._update = promise(null)
			//	var model = new Model({name: "John"})
			//	yield heaven.update(model).must.then.equal(model)
			//	model.must.eql(new Model({name: "John"}))
			//})
		})

		describe("given a model and attributes", function() {
			it("must call _update with serialized attributes", function() {
				var heaven = create()
				heaven.serialize = compose(upcaseKeys, heaven.serialize)
				var model = new Model({name: "John"})
				heaven.update(model, {name: "Mike"}, EXAMPLE_OPTS)

				heaven._update.firstCall.args.must.eql([
					model, {NAME: "Mike"}, EXAMPLE_OPTS
				])
			})

			it("must resolve with updates", function*() {
				var heaven = create()
				heaven._update = promise({id: 13})
				var model = new Model({name: "John"})
				yield heaven.update(model, {name: "Mike"}).must.then.eql({id: 13})
				model.must.eql(new Model({name: "John"}))
			})

			it("must resolve with null if null returned", function*() {
				var heaven = create()
				heaven._update = promise(null)
				var model = new Model({name: "John"})
				yield heaven.update(model, {name: "Mike"}).must.then.equal(null)
				model.must.eql(new Model({name: "John"}))
			})

			//it("must resolve with the model and assign new attributes", function*() {
			//	var heaven = create()
			//	heaven._update = promise({id: 13})
			//	var model = new Model({name: "John"})
			//	yield heaven.update(model, {name: "Mike"}).must.then.equal(model)
			//	model.must.eql(new Model({id: 13, name: "John"}))
			//})

			//it("must resolve with the model if undefined returned", function*() {
			//	var heaven = create()
			//	heaven._update = promise(undefined)
			//	var model = new Model({name: "John"})
			//	yield heaven.update(model, {name: "Mike"}).must.then.equal(model)
			//	model.must.eql(new Model({name: "John"}))
			//})

			//it("must resolve with the model if null returned", function*() {
			//	var heaven = create()
			//	heaven._update = promise(null)
			//	var model = new Model({name: "John"})
			//	yield heaven.update(model, {name: "Mike"}).must.then.equal(model)
			//	model.must.eql(new Model({name: "John"}))
			//})
		})

		describe("given an array", function() {
			it("must call _update with serialized attributes", function*() {
				var heaven = create()
				heaven.serialize = compose(upcaseKeys, heaven.serialize)
				heaven._update = Sinon.spy(promise([{id: 13}, {id: 42}]))

				var a = new Model({name: "John"})
				var b = new Model({name: "Mike"})
				yield heaven.update([a, b], undefined, EXAMPLE_OPTS)

				heaven._update.firstCall.args.must.eql([
					new Map, undefined, EXAMPLE_OPTS
				])

				Array.from(heaven._update.firstCall.args[0]).must.eql([
					[a, {NAME: "John"}],
					[b, {NAME: "Mike"}]
				])
			})

			it("must resolve with updates given models", function*() {
				var heaven = create()
				heaven._update = promise([{id: 13}, {id: 42}])
				var a = new Model({name: "John"})
				var b = new Model({name: "Mike"})

				yield heaven.update([a, b]).must.then.eql([{id: 13}, {id: 42}])
				a.must.eql(new Model({name: "John"}))
				b.must.eql(new Model({name: "Mike"}))
			})

			//it("must resolve with the model and assign new attributes given models",
			//	function*() {
			//	var heaven = create()
			//	heaven._update = promise([{id: 13}, {id: 42}])
			//	var a = new Model({name: "John"})
			//	var b = new Model({name: "Mike"})
			//	var updated = yield heaven.update([a, b])

			//	updated.must.be.an.array()
			//	updated.length.must.equal(2)
			//	updated[0].must.equal(a)
			//	updated[1].must.equal(b)

			//	a.must.eql(new Model({id: 13, name: "John"}))
			//	b.must.eql(new Model({id: 42, name: "Mike"}))
			//})
		})

		describe("given an array and attributes", function() {
			it("must throw TypeError given an array of attributes", function() {
				var err
				try { create().update([42], [{name: "John"}]) } catch (ex) { err = ex }
				err.must.be.an.error(TypeError, /bad attributes/i)
			})

			it("must call _update with serialized attributes given ids", function() {
				var heaven = create()
				heaven.serialize = compose(upcaseKeys, heaven.serialize)
				heaven.update([13, 42], {name: "John"}, EXAMPLE_OPTS)

				heaven._update.firstCall.args.must.eql([
					[13, 42], {NAME: "John"}, EXAMPLE_OPTS
				])
			})

			it("must resolve with updates given ids", function*() {
				var heaven = create()
				heaven._update = promise([{id: 13}, {id: 42}])
				var updates = yield heaven.update([13, 42], {name: "John"})
				updates.must.eql([{id: 13}, {id: 42}])
			})

			it("must call _update with serialized attributes given models",
				function() {
				var heaven = create()
				heaven.serialize = compose(upcaseKeys, heaven.serialize)
				var models = [new Model({name: "John"}), new Model({name: "Mike"})]
				heaven.update(models, {name: "Raul"}, EXAMPLE_OPTS)

				heaven._update.firstCall.args.must.eql([
					models, {NAME: "Raul"}, EXAMPLE_OPTS
				])
			})

			it("must resolve with updates given models", function*() {
				var heaven = create()
				heaven._update = promise([{id: 13}, {id: 42}])
				var a = new Model({name: "John"})
				var b = new Model({name: "Mike"})

				var updates = yield heaven.update([a, b], {name: "Raul"})
				updates.must.eql([{id: 13}, {id: 42}])
				a.must.eql(new Model({name: "John"}))
				b.must.eql(new Model({name: "Mike"}))
			})

			//it("must resolve with the model and assign new attributes given models",
			//	function*() {
			//	var heaven = create()
			//	heaven._update = promise([{id: 13}, {id: 42}])
			//	var a = new Model({name: "John"})
			//	var b = new Model({name: "Mike"})
			//	var updated = yield heaven.update([a, b], {name: "Raul"})

			//	updated.must.be.an.array()
			//	updated.length.must.equal(2)
			//	updated[0].must.equal(a)
			//	updated[1].must.equal(b)

			//	a.must.eql(new Model({id: 13, name: "John"}))
			//	b.must.eql(new Model({id: 42, name: "Mike"}))
			//})
		})
	})

	describe(".prototype.delete", function() {
		it("must return a promise", function() {
			create().delete(42).then.must.be.a.function()
		})

		describe("given nothing", function() {
			it("must call _delete", function() {
				var heaven = create()
				heaven.delete()
				heaven._delete.firstCall.args.must.eql([])
			})

			it("must resolve with deletes", function*() {
				var heaven = create()
				heaven._delete = promise([{id: 13}])
				yield heaven.delete().must.then.eql([{id: 13}])
			})
		})

		describe("given an id", function() {
			it("must call _delete", function() {
				var heaven = create()
				heaven.delete(42, EXAMPLE_OPTS)
				heaven._delete.firstCall.args.must.eql([42, EXAMPLE_OPTS])
			})

			it("must resolve with deletes", function*() {
				var heaven = create()
				heaven._delete = promise({id: 13})
				yield heaven.delete(42).must.then.eql({id: 13})
			})
		})

		describe("given an array", function() {
			it("must call _delete given ids", function() {
				var heaven = create()
				heaven.delete([13, 42], EXAMPLE_OPTS)
				heaven._delete.firstCall.args.must.eql([[13, 42], EXAMPLE_OPTS])
			})

			it("must resolve with deletes given ids", function*() {
				var heaven = create()
				heaven._delete = promise([{id: 13}, {id: 42}])
				yield heaven.delete([13, 42]).must.then.eql([{id: 13}, {id: 42}])
			})
		})
	})

	describe(".prototype.typeof", function() {
		describe("given null", function() {
			it("must return \"null\"", function() {
				create().typeof(null).must.equal("null")
			})
		})

		describe("given array", function() {
			it("must return \"array\"", function() {
				create().typeof([]).must.equal("array")
			})

			it("must return \"array\" given Array.prototype", function() {
				create().typeof(Array.prototype).must.equal("array")
			})
		})

		describe("given RegExp", function() {
			it("must return \"regexp\"", function() {
				create().typeof(new RegExp).must.equal("regexp")
			})
		})

		describe("given Map", function() {
			it("must return \"map\"", function() {
				create().typeof(new Map).must.equal("map")
			})
		})
	})
})

function upcaseKeys(obj) { return O.mapKeys(obj, toUpperCase) }
function constant(value) { return function() { return value } }
