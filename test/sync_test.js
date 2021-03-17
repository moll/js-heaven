var Heaven = require("../sync")

describe("HeavenSync", function() {
	require("./_heaven_test")(Heaven, identity)
})

function identity(value) { return value }
