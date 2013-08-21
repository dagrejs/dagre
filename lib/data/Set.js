module.exports = Set;

function Set(initialKeys) {
  this._size = 0;
  this._keys = {};

  if (initialKeys) {
    initialKeys.forEach(function(key) {
      this.add(key);
    }, this);
  }
}

Set.prototype.size = function() { return this._size; };

Set.prototype.keys = function() { return Object.keys(this._keys); };

Set.prototype.has = function(key) { return key in this._keys; };

Set.prototype.add = function(key) {
  if (!(key in this._keys)) {
    this._keys[key] = true;
    ++this._size;
    return true;
  }
  return false;
};

Set.prototype.remove = function(key) {
  if (key in this._keys) {
    delete this._keys[key];
    --this._size;
    return true;
  }
  return false;
};
