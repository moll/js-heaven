var O = require("oolong")
var Sinon = require("sinon")
var demand = require("must")
var compose = require("lodash.compose")
var isPrototypeOf = Function.call.bind(Object.isPrototypeOf)
var toUpperCase = Function.call.bind(String.prototype.toUpperCase)
var toLowerCase = Function.call.bind(String.prototype.toLowerCase)
var EXAMPLE_OPTS = {deleted: true}

// Saving attributes to this.attributes catches double model initialization.
function Model(attrs) { this.attributes = attrs }
Model.prototype.set = function(attrs) { O.assign(this.attributes, attrs) }
Model.prototype.toJSON = function() { return this.attributes }

module.exports = function(Heaven, respond) {
	function HeavenOnTest(model) { Heaven.call(this, model) }

	HeavenOnTest.prototype = Object.create(Heaven.prototype, {
		constructor: {value: HeavenOnTest, configurable: true, writeable: true}
	})

	HeavenOnTest.prototype.model = Model

	HeavenOnTest.prototype.identify = function(model) {
		if (model instanceof this.model) return model.attributes[this.idAttribute]
		else return model[this.idAttribute]
	}

	HeavenOnTest.prototype.assign = function(model, attrs) {
		return model.set(attrs), model
	}

	describe("as Heaven", function() {
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
		})

		describe(".prototype.search", function() {
			it("must call group even if response empty", async function() {
				var heaven = new HeavenOnTest
				heaven._search = constant(respond([]))

				heaven.group = function(query, attrs) {
					attrs.must.eql([])
					return [{id: query, name: "John"}]
				}

				demand(await heaven.search(42)).eql([new Model({id: 42, name: "John"})])
			})

			describe("given an id", function() {
				it("must call _search", function() {
					var heaven = new HeavenOnTest
					heaven._search = Sinon.spy(constant(respond([])))
					heaven.search(42, EXAMPLE_OPTS)
					heaven._search.firstCall.args.must.eql([42, EXAMPLE_OPTS])
				})

				it("must return an array of models", async function() {
					var heaven = new HeavenOnTest
					heaven._search = constant(respond([{name: "John"}, {name: "Mike"}]))

					demand(await heaven.search(42)).eql([
						new Model({name: "John"}),
						new Model({name: "Mike"})
					])
				})

				it("must return empty array if none returned", async function() {
					var heaven = new HeavenOnTest
					heaven._search = constant(respond([]))
					demand(await heaven.search(42)).eql([])
				})

				// Protects against naive boolean checks.
				it("must parse 0 to model", async function() {
					/* eslint no-new-wrappers: 0 */
					var heaven = new HeavenOnTest().with({model: Number})
					heaven._search = constant(respond([0]))
					demand(await heaven.search("Zero")).eql([new Number(0)])
				})
			})

			describe("given a model", function() {
				it("must call _search", function() {
					var heaven = new HeavenOnTest
					heaven._search = Sinon.spy(constant(respond([])))

					var model = new Model({name: "John"})
					heaven.search(model, EXAMPLE_OPTS)
					heaven._search.firstCall.args.must.eql([model, EXAMPLE_OPTS])
				})

				it("must return the model and assign new attributes",
					async function() {
					var model = new Model({name: "John"})
					var heaven = new HeavenOnTest
					heaven._search = constant(respond([{name: "Raul"}]))

					var models = await heaven.search(model)
					models.must.eql([new Model({name: "Raul"})])
					models[0].must.equal(model)
				})

				it("must return empty array if none returned", async function() {
					var model = new Model({name: "John"})
					var heaven = new HeavenOnTest
					heaven._search = constant(respond([]))
					demand(await heaven.search(model)).eql([])
					model.must.eql(new Model({name: "John"}))
				})
			})

			describe("given an array of ids", function() {
				it("must call _search", function() {
					var heaven = new HeavenOnTest
					heaven._search = Sinon.spy(constant(respond([])))

					heaven.search([42, 69], EXAMPLE_OPTS)
					heaven._search.firstCall.args.must.eql([[42, 69], EXAMPLE_OPTS])
				})

				it("must return empty array given an empty array",
					async function() {
					var heaven = new HeavenOnTest
					heaven._search = constant(respond([]))
					demand(await heaven.search([])).must.eql([])
				})

				it("must return an array of models", async function() {
					var heaven = new HeavenOnTest
					heaven._search = constant(respond([{name: "John"}, {name: "Mike"}]))

					demand(await heaven.search([42, 69])).eql([
						new Model({name: "John"}),
						new Model({name: "Mike"})
					])
				})

				// Protects against naive boolean checks.
				it("must parse 0 to model", async function() {
					/* eslint no-new-wrappers: 0 */
					var heaven = new HeavenOnTest().with({model: Number})
					heaven._search = constant(respond([0]))
					demand(await heaven.search(["Zero"])).eql([new Number(0)])
				})

				it("must return models if empty array returned",
					async function() {
					var heaven = new HeavenOnTest
					heaven._search = constant(respond([]))
					demand(await heaven.search([42, 69])).eql([])
				})
			})

			describe("given an array of models", function() {
				it("must call _search", function() {
					var heaven = new HeavenOnTest
					heaven._search = Sinon.spy(constant(respond([])))

					var a = new Model({name: "John"})
					var b = new Model({name: "Mike"})
					heaven.search([a, b], EXAMPLE_OPTS)
					heaven._search.firstCall.args.must.eql([[a, b], EXAMPLE_OPTS])
				})

				it("must return models", async function() {
					var a = new Model({id: 13, name: "John"})
					var b = new Model({id: 42, name: "Mike"})

					var heaven = new HeavenOnTest
					heaven._search = constant(respond([
						{id: 13, name: "Jane"},
						{id: 42, name: "Raul"}
					]))

					var models = await heaven.search([a, b])
					models.must.be.an.array()
					models.length.must.equal(2)
					models[0].must.equal(a)
					models[1].must.equal(b)

					a.must.eql(new Model({id: 13, name: "Jane"}))
					b.must.eql(new Model({id: 42, name: "Raul"}))
				})

				it("must return models by ids", async function() {
					var a = new Model({id: 13, name: "John"})
					var b = new Model({id: 42, name: "Mike"})

					var heaven = new HeavenOnTest
					heaven._search = constant(respond([
						{id: 42, name: "Raul"},
						{id: 13, name: "Jane"}
					]))

					var models = await heaven.search([a, b])
					models.must.be.an.array()
					models.length.must.equal(2)
					models[0].must.equal(b)
					models[1].must.equal(a)

					a.must.eql(new Model({id: 13, name: "Jane"}))
					b.must.eql(new Model({id: 42, name: "Raul"}))
				})

				it("must return models if less returned", async function() {
					var heaven = new HeavenOnTest
					heaven._search = constant(respond([{id: 42, name: "Jane"}]))

					var a = new Model({id: 13, name: "John"})
					var b = new Model({id: 42, name: "Mike"})

					var models = await heaven.search([a, b])
					models.must.be.an.array()
					models.length.must.equal(1)
					models[0].must.equal(b)

					a.must.eql(new Model({id: 13, name: "John"}))
					b.must.eql(new Model({id: 42, name: "Jane"}))
				})
			})
		})

		describe(".prototype.read", function() {
			describe("given an id", function() {
				it("must call _read", function() {
					var heaven = new HeavenOnTest
					heaven._read = Sinon.spy(constant(respond(null)))
					heaven.read(42, EXAMPLE_OPTS)
					heaven._read.firstCall.args.must.eql([42, EXAMPLE_OPTS])
				})

				it("must return a model", async function() {
					var heaven = new HeavenOnTest
					heaven._read = constant(respond({name: "John"}))
					demand(await heaven.read(42)).eql(new Model({name: "John"}))
				})

				it("must return null if undefined returned", async function() {
					var heaven = new HeavenOnTest
					heaven._read = constant(respond(undefined))
					demand(await heaven.read(42)).equal(null)
				})

				it("must return null if null returned", async function() {
					var heaven = new HeavenOnTest
					heaven._read = constant(respond(null))
					demand(await heaven.read(42)).equal(null)
				})

				// Protects against naive boolean checks.
				it("must parse 0 to model", async function() {
					/* eslint no-new-wrappers: 0 */
					var heaven = new HeavenOnTest().with({model: Number})
					heaven._read = constant(respond(0))
					demand(await heaven.read("Zero")).eql(new Number(0))
				})
			})

			describe("given a model", function() {
				it("must call _read", function() {
					var heaven = new HeavenOnTest
					heaven._read = Sinon.spy(constant(respond(null)))

					var model = new Model({name: "John"})
					heaven.read(model, EXAMPLE_OPTS)
					heaven._read.firstCall.args.must.eql([model, EXAMPLE_OPTS])
				})

				it("must return the model and assign new attributes",
					async function() {
					var model = new Model({name: "John"})
					var heaven = new HeavenOnTest
					heaven._read = constant(respond({name: "Raul"}))
					demand(await heaven.read(model)).equal(model)
					model.must.eql(new Model({name: "Raul"}))
				})

				it("must return null if none returned", async function() {
					var model = new Model({name: "John"})
					var heaven = new HeavenOnTest
					heaven._read = constant(respond(null))
					demand(await heaven.read(model)).eql(null)
					model.must.eql(new Model({name: "John"}))
				})
			})
		})

		describe(".prototype.create", function() {
			it("must throw TypeError given undefined", function() {
				var err
				try { new HeavenOnTest().create(undefined) } catch (ex) { err = ex }
				err.must.be.an.error(TypeError, /bad attributes/i)
			})

			it("must throw TypeError given null", function() {
				var err
				try { new HeavenOnTest().create(null) } catch (ex) { err = ex }
				err.must.be.an.error(TypeError, /bad attributes/i)
			})

			describe("given attributes", function() {
				it("must call _create with serialized attributes", function() {
					var heaven = new HeavenOnTest
					heaven._create = Sinon.spy(constant(respond([])))
					heaven.serialize = compose(upcaseKeys, heaven.serialize)
					heaven.create({name: "John"}, EXAMPLE_OPTS)
					heaven._create.callCount.must.equal(1)

					heaven._create.firstCall.args.must.eql([
						[{NAME: "John"}],
						EXAMPLE_OPTS]
					)
				})

				it("must call _create with inherited attributes", function() {
					var heaven = new HeavenOnTest
					heaven._create = Sinon.spy(constant(respond([])))

					var attrs = Object.create({a: 42}); attrs.b = 69
					heaven.create(attrs, EXAMPLE_OPTS)
					heaven._create.callCount.must.equal(1)

					heaven._create.firstCall.args.must.eql([
						[{a: 42, b: 69}],
						EXAMPLE_OPTS
					])
				})

				it("must return parsed attributes", async function() {
					var heaven = new HeavenOnTest
					heaven._create = constant(respond([{ID: 13}]))
					heaven.parse = compose(downcaseKeys, heaven.parse)
					var created = await heaven.create({name: "John"})
					return created.must.eql({id: 13})
				})

				// Heaven once did so. Keeping this for safety.
				it("must not stringify nested plain objects", function() {
					var heaven = new HeavenOnTest
					heaven._create = Sinon.spy(constant(respond([])))
					heaven.create({bird: {nest: 1}})
					heaven._create.firstCall.args[0].must.eql([{bird: {nest: 1}}])
				})
			})

			describe("given a model", function() {
				it("must call _create with serialized model", function() {
					var heaven = new HeavenOnTest
					heaven._create = Sinon.spy(constant(respond([])))
					heaven.serialize = compose(upcaseKeys, heaven.serialize)
					heaven.create(new Model({name: "John"}), EXAMPLE_OPTS)
					heaven._create.callCount.must.equal(1)

					heaven._create.firstCall.args.must.eql([
						[{NAME: "John"}],
						EXAMPLE_OPTS
					])
				})

				it("must return the model and assign parsed attributes",
					async function() {
					var heaven = new HeavenOnTest
					heaven._create = constant(respond([{ID: 13}]))
					heaven.parse = compose(downcaseKeys, heaven.parse)
					var model = new Model({name: "John"})
					demand(await heaven.create(model)).equal(model)
					model.must.eql(new Model({id: 13, name: "John"}))
				})

				it("must serialize with toJSON if it exists", function() {
					var heaven = new Heaven
					heaven._create = Sinon.spy(constant(respond([])))
					heaven.create({toJSON: function() { return {name: "Mike"} }})
					heaven._create.firstCall.args[0].must.eql([{name: "Mike"}])
				})

				it("must serialize with toJSON only if it's a function", function() {
					var heaven = new Heaven
					heaven._create = Sinon.spy(constant(respond([])))
					heaven.create({a: 1, b: 2, toJSON: 3})
					heaven._create.firstCall.args[0].must.eql([{a: 1, b: 2, toJSON: 3}])
				})
			})

			describe("given an array of attributes", function() {
				it("must throw TypeError given undefined", function() {
					var err
					try { new HeavenOnTest().create([undefined]) } catch (ex) { err = ex }
					err.must.be.an.error(TypeError, /bad attributes/i)
				})

				it("must throw TypeError given undefined and object array", function() {
					var err
					try { new HeavenOnTest().create([undefined, {}]) }
					catch (ex) { err = ex }
					err.must.be.an.error(TypeError, /bad attributes/i)
				})

				it("must throw TypeError given null", function() {
					var err
					try { new HeavenOnTest().create([null]) } catch (ex) { err = ex }
					err.must.be.an.error(TypeError, /bad attributes/i)
				})

				it("must throw TypeError given null and object", function() {
					var err
					try { new HeavenOnTest().create([null, {}]) } catch (ex) { err = ex }
					err.must.be.an.error(TypeError, /bad attributes/i)
				})

				it("must call _create given an empty array", async function() {
					var heaven = new HeavenOnTest
					heaven._create = Sinon.spy(constant(respond([])))
					demand(await heaven.create([], EXAMPLE_OPTS)).eql([])
					heaven._create.firstCall.args.must.eql([[], EXAMPLE_OPTS])
				})

				it("must call _create with serialized attributes", function() {
					var heaven = new HeavenOnTest
					heaven._create = Sinon.spy(constant(respond([])))
					heaven.serialize = compose(upcaseKeys, heaven.serialize)

					heaven.create([{name: "John"}, {name: "Mike"}], EXAMPLE_OPTS)
					heaven._create.callCount.must.equal(1)

					heaven._create.firstCall.args.must.eql([
						[{NAME: "John"}, {NAME: "Mike"}],
						EXAMPLE_OPTS
					])
				})

				it("must return parsed attributes", async function() {
					var heaven = new HeavenOnTest
					heaven._create = constant(respond([{ID: 13}, {ID: 42}]))
					heaven.parse = compose(downcaseKeys, heaven.parse)
					var created = await heaven.create([{name: "John"}, {name: "Mike"}])
					created.must.eql([{id: 13}, {id: 42}])
				})
			})

			describe("given an array of models", function() {
				it("must call _create with serialized attributes", function() {
					var heaven = new HeavenOnTest
					heaven._create = Sinon.spy(constant(respond([])))
					heaven.serialize = compose(upcaseKeys, heaven.serialize)

					heaven.create([
						new Model({name: "John"}),
						new Model({name: "Mike"})
					], EXAMPLE_OPTS)

					heaven._create.callCount.must.equal(1)

					heaven._create.firstCall.args.must.eql([
						[{NAME: "John"}, {NAME: "Mike"}],
						EXAMPLE_OPTS
					])
				})

				it("must return model and assign parsed attributes",
					async function() {
					var heaven = new HeavenOnTest
					heaven._create = constant(respond([{ID: 13}]))
					heaven.parse = compose(downcaseKeys, heaven.parse)

					var model = new Model({name: "John"})
					var created = await heaven.create([model])
					created.must.eql([new Model({id: 13, name: "John"})])
					created[0].must.equal(model)
				})

				it("must return models and assign parsed attributes",
					async function() {
					var heaven = new HeavenOnTest
					heaven._create = constant(respond([{ID: 13}, {ID: 42}]))
					heaven.parse = compose(downcaseKeys, heaven.parse)

					var a = new Model({name: "John"})
					var b = new Model({name: "Mike"})
					var created = await heaven.create([a, b])
					created.must.be.an.array()
					created.length.must.equal(2)
					created[0].must.equal(a)
					created[1].must.equal(b)

					a.must.eql(new Model({id: 13, name: "John"}))
					b.must.eql(new Model({id: 42, name: "Mike"}))
				})
			})
		})

		describe(".prototype.update", function() {
			it("must throw TypeError given undefined", function() {
				var err
				try { new HeavenOnTest(undefined).update() } catch (ex) { err = ex }
				err.must.be.an.error(TypeError, /bad attributes/i)
			})

			it("must throw TypeError given null", function() {
				var err
				try { new HeavenOnTest(null).update() } catch (ex) { err = ex }
				err.must.be.an.error(TypeError, /bad attributes/i)
			})

			describe("given an id and attributes", function() {
				it("must throw TypeError given undefined attributes", function() {
					var err
					try { new HeavenOnTest().update(42, undefined) }
					catch (ex) { err = ex }
					err.must.be.an.error(TypeError, /bad attributes/i)
				})

				it("must throw TypeError given null attributes", function() {
					var err
					try { new HeavenOnTest().update(42, null) } catch (ex) { err = ex }
					err.must.be.an.error(TypeError, /bad attributes/i)
				})

				it("must call _update with serialized attributes", function() {
					var heaven = new HeavenOnTest
					heaven._update = Sinon.spy(constant(respond(undefined)))
					heaven.serialize = compose(upcaseKeys, heaven.serialize)
					heaven.update(42, {name: "John"}, EXAMPLE_OPTS)

					heaven._update.firstCall.args.must.eql([
						42, {NAME: "John"}, EXAMPLE_OPTS
					])
				})

				it("must return unparsed updates", async function() {
					var heaven = new HeavenOnTest
					heaven._update = constant(respond({ID: 13}))
					heaven.parse = compose(downcaseKeys, heaven.parse)
					demand(await heaven.update(42, {name: "John"})).eql({ID: 13})
				})

				// Support this no-op.
				it("must call _update with empty attributes", function() {
					var heaven = new HeavenOnTest
					heaven._update = Sinon.spy(constant(respond(undefined)))
					heaven.update(42, {}, EXAMPLE_OPTS)
					heaven._update.firstCall.args.must.eql([42, {}, EXAMPLE_OPTS])
				})

				it("must return null if null returned", async function() {
					var heaven = new HeavenOnTest
					heaven._update = constant(respond(null))
					demand(await heaven.update(42, {name: "Mike"})).equal(null)
				})
			})

			describe("given a model", function() {
				it("must call _update with serialized model", function() {
					var heaven = new HeavenOnTest
					heaven._update = Sinon.spy(constant(respond(undefined)))
					heaven.serialize = compose(upcaseKeys, heaven.serialize)
					var model = new Model({name: "John"})
					heaven.update(model, undefined, EXAMPLE_OPTS)

					heaven._update.firstCall.args.must.eql([
						model, {NAME: "John"}, EXAMPLE_OPTS
					])
				})

				it("must return unparsed updates", async function() {
					var heaven = new HeavenOnTest
					heaven._update = constant(respond({ID: 13}))
					heaven.parse = compose(downcaseKeys, heaven.parse)
					var model = new Model({name: "John"})
					demand(await heaven.update(model)).eql({ID: 13})
				})
			})

			describe("given a model and attributes", function() {
				it("must call _update with serialized attributes", function() {
					var heaven = new HeavenOnTest
					heaven._update = Sinon.spy(constant(respond(undefined)))
					heaven.serialize = compose(upcaseKeys, heaven.serialize)

					var model = new Model({name: "John"})
					heaven.update(model, {name: "Mike"}, EXAMPLE_OPTS)

					heaven._update.firstCall.args.must.eql([
						model, {NAME: "Mike"}, EXAMPLE_OPTS
					])
				})

				it("must return unparsed updates", async function() {
					var heaven = new HeavenOnTest
					heaven._update = constant(respond({ID: 13}))
					heaven.parse = compose(downcaseKeys, heaven.parse)
					var model = new Model({name: "John"})
					demand(await heaven.update(model, {name: "Mike"})).eql({ID: 13})
					model.must.eql(new Model({name: "John"}))
				})

				it("must return null if null returned", async function() {
					var heaven = new HeavenOnTest
					heaven._update = constant(respond(null))
					var model = new Model({name: "John"})
					demand(await heaven.update(model, {name: "Mike"})).equal(null)
					model.must.eql(new Model({name: "John"}))
				})
			})

			describe("given an array of models", function() {
				it("must call _update with serialized attributes", function() {
					var heaven = new HeavenOnTest
					heaven._update = Sinon.spy(constant(respond([{id: 13}, {id: 42}])))
					heaven.serialize = compose(upcaseKeys, heaven.serialize)

					var a = new Model({name: "John"})
					var b = new Model({name: "Mike"})
					heaven.update([a, b], undefined, EXAMPLE_OPTS)

					heaven._update.firstCall.args.must.eql([
						new Map([[a, {NAME: "John"}], [b, {NAME: "Mike"}]]),
						undefined,
						EXAMPLE_OPTS
					])
				})

				it("must return unparsed updates given models", async function() {
					var heaven = new HeavenOnTest
					heaven._update = constant(respond([{ID: 13}, {ID: 42}]))
					heaven.parse = compose(downcaseKeys, heaven.parse)

					var a = new Model({name: "John"})
					var b = new Model({name: "Mike"})
					demand(await heaven.update([a, b])).eql([{ID: 13}, {ID: 42}])
					a.must.eql(new Model({name: "John"}))
					b.must.eql(new Model({name: "Mike"}))
				})
			})

			describe("given an array of ids and attributes", function() {
				it("must throw TypeError given an array of attributes", function() {
					var err
					try { new HeavenOnTest().update([42], [{name: "John"}]) }
					catch (ex) { err = ex }
					err.must.be.an.error(TypeError, /bad attributes/i)
				})

				it("must call _update with serialized attributes", function() {
					var heaven = new HeavenOnTest
					heaven._update = Sinon.spy(constant(respond(undefined)))
					heaven.serialize = compose(upcaseKeys, heaven.serialize)
					heaven.update([13, 42], {name: "John"}, EXAMPLE_OPTS)

					heaven._update.firstCall.args.must.eql([
						[13, 42], {NAME: "John"}, EXAMPLE_OPTS
					])
				})

				it("must return unparsed updates", async function() {
					var heaven = new HeavenOnTest
					heaven._update = constant(respond([{ID: 13}, {ID: 42}]))
					heaven.parse = compose(downcaseKeys, heaven.parse)
					var updates = await heaven.update([13, 42], {name: "John"})
					updates.must.eql([{ID: 13}, {ID: 42}])
				})
			})

			describe("given an array of models and attributes", function() {
				it("must call _update with serialized attributes", function() {
					var heaven = new HeavenOnTest
					heaven._update = Sinon.spy(constant(respond(undefined)))
					heaven.serialize = compose(upcaseKeys, heaven.serialize)

					var models = [new Model({name: "John"}), new Model({name: "Mike"})]
					heaven.update(models, {name: "Raul"}, EXAMPLE_OPTS)

					heaven._update.firstCall.args.must.eql([
						models, {NAME: "Raul"}, EXAMPLE_OPTS
					])
				})

				it("must return unparsed updates", async function() {
					var heaven = new HeavenOnTest
					heaven._update = constant(respond([{ID: 13}, {ID: 42}]))
					heaven.parse = compose(downcaseKeys, heaven.parse)

					var a = new Model({name: "John"})
					var b = new Model({name: "Mike"})
					var updates = await heaven.update([a, b], {name: "Raul"})
					updates.must.eql([{ID: 13}, {ID: 42}])
					a.must.eql(new Model({name: "John"}))
					b.must.eql(new Model({name: "Mike"}))
				})
			})
		})

		describe(".prototype.delete", function() {
			describe("given an id", function() {
				it("must call _delete", function() {
					var heaven = new HeavenOnTest
					heaven._delete = Sinon.spy(constant(respond(undefined)))
					heaven.delete(42, EXAMPLE_OPTS)
					heaven._delete.firstCall.args.must.eql([42, EXAMPLE_OPTS])
				})

				it("must return deletes", async function() {
					var heaven = new HeavenOnTest
					heaven._delete = constant(respond({id: 13}))
					demand(await heaven.delete(42)).eql({id: 13})
				})
			})

			describe("given an array of ids", function() {
				it("must call _delete given ids", function() {
					var heaven = new HeavenOnTest
					heaven._delete = Sinon.spy(constant(respond(undefined)))
					heaven.delete([13, 42], EXAMPLE_OPTS)
					heaven._delete.firstCall.args.must.eql([[13, 42], EXAMPLE_OPTS])
				})

				it("must return deletes given ids", async function() {
					var heaven = new HeavenOnTest
					heaven._delete = constant(respond([{id: 13}, {id: 42}]))
					demand(await heaven.delete([13, 42])).eql([{id: 13}, {id: 42}])
				})
			})
		})

		describe(".prototype.typeof", function() {
			describe("given null", function() {
				it("must return \"null\"", function() {
					new HeavenOnTest().typeof(null).must.equal("null")
				})
			})

			describe("given array", function() {
				it("must return \"array\"", function() {
					new HeavenOnTest().typeof([]).must.equal("array")
				})

				it("must return \"array\" given Array.prototype", function() {
					new HeavenOnTest().typeof(Array.prototype).must.equal("array")
				})

				it("must return \"array\" given Object as model", function() {
					new HeavenOnTest(Object).typeof([]).must.equal("array")
				})
			})

			describe("given RegExp", function() {
				it("must return \"regexp\"", function() {
					new HeavenOnTest().typeof(new RegExp).must.equal("regexp")
				})
			})

			describe("given Map", function() {
				it("must return \"map\"", function() {
					new HeavenOnTest().typeof(new Map).must.equal("map")
				})
			})

			describe("given Object", function() {
				it("must return \"object\"", function() {
					new HeavenOnTest().typeof({}).must.equal("object")
				})

				it("must return \"model\" given Object as model", function() {
					new HeavenOnTest(Object).typeof({}).must.equal("model")
				})
			})
		})
	})
}

function constant(value) { return function() { return value } }
function upcaseKeys(obj) { return O.mapKeys(obj, toUpperCase) }
function downcaseKeys(obj) { return O.mapKeys(obj, toLowerCase) }
