## Unreleased
- No longer instantiates models from attributes given to `Heaven.prototype.create`.  
  If you do need models for client-side default attributes, for example, instantiate them before calling `Heaven.prototype.create`:

  ```javascript
  var heaven = new Heaven(Model)

  heaven.create(new Model({name: "John"}))
  ```

## 0.11.1 (Sep 6, 2019)
- Calls `Heaven.prototype.group` even if no models were returned.  
  This permits synthesizing models also when the response is empty.

## 0.11.0 (Apr 27, 2019)
- Changes the semantics of `Heaven.prototype.search` and `Heaven.prototype.read` to always return an array and a single model respectively.  
  No response array length comparisons to query length or null checking done.
- Removes `HeavenError` now that `Heaven.prototype.read` doesn't throw errors.
- The `Heaven.prototype.search` method now calls `Heaven.prototype._search` for its implementation.  
  Previously both `Heaven.prototype.search` and `Heaven.prototype.read` called `Heaven.prototype._read`. This permits a more efficient implementation for getting a single model. The default of `Heaven.prototype._read` is to delegate to `Heaven.prototype._search` and get the array's first element.

## 0.10.1 (Feb 21, 2019)
- Fixes `Heaven.prototype.typeOf` given an array if model set to `Object`.

## 0.10.0 (Feb 23, 2017)
- Removes defaults for `numberAttribute` and `stringAttribute` and their inheriting as they're not used by Heaven itself.
- Changes `Heaven.prototype.new` function signature to only take plain objects and not also model instances.
- Removes support for delegating to `_delete` with 0 arguments if `Heaven.prototype.delete` was called with no arguments.  
  Same reason as removing it for `Heaven.prototype.read` in v0.9.

## 0.9.1 (Feb 15, 2017)
- Adds `Heaven.prototype.group` as a step before parsing.
- Removes runtime dependency on Oolong.js as it's not necessary.

## 0.9.0 (Oct 8, 2016)
- Removes support for delegating to `_read` with 0 arguments if `Heaven.prototype.read` was called with no arguments.  
  With a second `options` argument any implementation will have to support a special "all models" argument anyway. Might as well make it explicit.

## 0.8.0 (Oct 8, 2016)
- Second private release. Hell or heaven on Earth.
