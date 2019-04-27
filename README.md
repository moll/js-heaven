Heaven.js
=========
[![NPM version][npm-badge]](https://www.npmjs.com/package/heaven)
[![Build status][travis-badge]](https://travis-ci.org/moll/js-heaven)

Heaven.js is a JavaScript library for abstracting databases or collections through a standard [CRUD][crud] API. It reduces the boilerplate of writing a generic [Table Data Gateway][gateway] object by, for example, instantiating models received from the database and serializing ones going in for you.

Until Heaven.js reaches v1, its documentation is likely to be lacking. Sorry for that! It is, however, already used in production.

[npm-badge]: https://img.shields.io/npm/v/heaven.svg
[travis-badge]: https://travis-ci.org/moll/js-heaven.svg?branch=master
[gateway]: https://www.martinfowler.com/eaaCatalog/tableDataGateway.html
[crud]: https://en.wikipedia.org/wiki/Create,_read,_update_and_delete


Installing
----------
```sh
npm install heaven
```

Heaven.js follows [semantic versioning](http://semver.org), so feel free to depend on its major version with something like `>= 1.0.0 < 2` (a.k.a `^1.0.0`).


Using
-----
Subclass `Heaven` and implement the CRUD methods that do the actual reading and updating of your chosen database. For example, a simple wrapper for your web backend that might look something like this:

```javascript
var Heaven = require("heaven")

function Web(model, url) {
  Heaven.call(this, model)
  this.url = url
}

Web.prototype = Object.create(Heaven.prototype, {
  constructor: {value: Web, configurable: true, writeable: true}
})

Web.prototype._search = function(query) {
  switch (this.typeof(query)) {
    case "undefined":
    case "null": return fetch(this.url).then(getJson)
    default: throw new TypeError("Bad Query: " + query)
  }
}

Web.prototype._read = function(query) {
  switch (this.typeof(query)) {
    case "number": return fetch(this.url + "/" + query).then(getJson)
    default: throw new TypeError("Bad Query: " + query)
  }
}

Web.prototype._create = function(attrs) {
  return Promise.all(attrs.map(function(attrs) {
    return fetch(this.url, {
      method: "POST",
      headers: "Content-Type": "application/json",
      body: JSON.stringify(attrs)
    }).then(getJson)
  }, this))
}

Web.prototype._update = function(query, attrs) {
  switch (this.typeof(query)) {
    case "number": return fetch(this.url + "/" + query, {
      method: "PUT",
      headers: "Content-Type": "application/json",
      body: JSON.stringify(attrs)
    })

    default: throw new TypeError("Bad Query: " + query)
  }
}

Web.prototype._delete = function(query) {
  switch (this.typeof(query)) {
    case "number": return fetch(this.url + "/" + query, {method: "DELETE"})
    default: throw new TypeError("Bad Query: " + query)
  }
}

function getJson(res) { return res.json() }
```

You can then instantiate `Web` to refer to particular resources on your server:

```javascript
var cars = new Web(Object, "/cars")
var lada = await cars.create({name: "Žiguli"})
await cars.update(lada, {name: "Lada"})
```

For tweaking how your models are parsed, set `heaven.parse`. For serializing, set `heaven.serialize`. For updating the newly created model with the `id` returned by the server, set `heaven.assign`. For further detail, please see Heaven's source in `index.js`. Especially until more documentation is written.


### Using with Mapbox's SQLite3
If you'd like to use Heaven.js with [Mapbox's SQLite3][node-sqlite3] library, see [Heaven.js for SQLite3](https://github.com/moll/node-heaven-sqlite).

[node-sqlite3]: https://github.com/mapbox/node-sqlite3


License
-------
Heaven.js is released under a *Lesser GNU Affero General Public License*, which in summary means:

- You **can** use this program for **no cost**.
- You **can** use this program for **both personal and commercial reasons**.
- You **do not have to share your own program's code** which uses this program.
- You **have to share modifications** (e.g. bug-fixes) you've made to this program.

For more convoluted language, see the `LICENSE` file.


About
-----
**[Andri Möll][moll]** typed this and the code.  
[Monday Calendar][monday] supported the engineering work.

If you find Heaven.js needs improving, please don't hesitate to type to me now at [andri@dot.ee][email] or [create an issue online][issues].

[email]: mailto:andri@dot.ee
[issues]: https://github.com/moll/js-heaven/issues
[moll]: https://m811.com
[monday]: https://mondayapp.com
