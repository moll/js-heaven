var Heaven = require("../async")
var resolve = Promise.resolve.bind(Promise)

describe("HeavenAsync", function() {
	require("./_heaven_test")(Heaven, resolve)

	describe(".prototype.search", function() {
		it("must respond with a promise", function() {
			var heaven = new Heaven
			heaven._search = constant(resolve([]))
			heaven.search(42).then.must.be.a.function()
		})
	})

	describe(".prototype.read", function() {
		it("must respond with a promise", function() {
			var heaven = new Heaven
			heaven._read = constant(resolve(null))
			heaven.read(42).then.must.be.a.function()
		})
	})

	describe(".prototype.create", function() {
		it("must respond with a promise", function() {
			var heaven = new Heaven
			heaven._create = constant(resolve([{id: 42}]))
			heaven.create({name: "John"}).then.must.be.a.function()
		})
	})

	describe(".prototype.update", function() {
		it("must respond with a promise", function() {
			var heaven = new Heaven
			heaven._update = constant(resolve(undefined))
			heaven.update(42, {name: "John"}).then.must.be.a.function()
		})
	})

	describe(".prototype.delete", function() {
		it("must respond with a promise", function() {
			var heaven = new Heaven
			heaven._delete = constant(resolve(undefined))
			heaven.delete(42).then.must.be.a.function()
		})
	})
})

function constant(value) { return function() { return value } }
