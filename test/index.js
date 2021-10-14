// Must.js doesn't yet support comparing Maps out of the box.
/* eslint no-extend-native: 0 */
Map.prototype.valueOf = function() { return Array.from(this) }
