## Unreleased
- Adds `Heaven.prototype.group` as a step before parsing.
- Removes runtime dependency on Oolong.js as it's not necessary.

## 0.9.0 (Oct 8, 2016)
- Removes support for delegating to `_read` with 0 arguments if `Heaven.prototype.read` was called with no arguments.  
  With a second `options` argument any implementation will have to support a special "all models" argument anyway. Might as well make it explicit.

## 0.8.0 (Oct 8, 2016)
- Second private release. Hell or heaven on Earth.
