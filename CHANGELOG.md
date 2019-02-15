## Unreleased
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
