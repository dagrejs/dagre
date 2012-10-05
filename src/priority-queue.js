function priorityQueue() {
  var _arr = [];
  var _keyIndices = {};

  function _heapify(i) {
    var arr = _arr;
    var l = 2 * i,
        r = l + 1,
        largest = i;
    if (l < arr.length) {
      largest = arr[l].pri < arr[largest].pri ? l : largest;
      if (r < arr.length) {
        largest = arr[r].pri < arr[largest].pri ? r : largest;
      }
      if (largest !== i) {
        _swap(i, largest);
        _heapify(largest);
      }
    }
  }

  function _decrease(index) {
    var arr = _arr;
    var pri = arr[index].pri;
    var parent;
    while (index > 0) {
      parent = index >> 1;
      if (arr[parent].pri < pri) {
        break;
      }
      _swap(index, parent);
      index = parent;
    }
  }

  function _swap(i, j) {
    var arr = _arr;
    var keyIndices = _keyIndices;
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
    keyIndices[arr[i].key] = i;
    keyIndices[arr[j].key] = j;
  }

  function size() { return _arr.length; }

  function keys() { return Object.keys(_keyIndices); }

  function has(key) { return key in _keyIndices; }

  function priority(key) {
    var index = _keyIndices[key];
    if (index !== undefined) {
      return _arr[index].pri;
    }
  }

  function add(key, pri) {
    if (!(key in _keyIndices)) {
      var entry = {key: key, pri: pri};
      var index = _arr.length;
      _keyIndices[key] = index;
      _arr.push(entry);
      _decrease(index);
      return true;
    }
    return false;
  }

  function min() {
    if (size() > 0) {
      return _arr[0].key;
    }
  }

  function removeMin() {
    _swap(0, _arr.length - 1);
    var min = _arr.pop();
    delete _keyIndices[min.key];
    _heapify(0);
    return min.key;
  }

  function decrease(key, pri) {
    var index = _keyIndices[key];
    if (pri > _arr[index].pri) {
      throw new Error("New priority is greater than current priority. " +
          "Key: " + key + " Old: " + _arr[index].pri + " New: " + pri);
    }
    _arr[index].pri = pri;
    _decrease(index);
  }

  return {
    size: size,
    keys: keys,
    has: has,
    priority: priority,
    add: add,
    min: min,
    removeMin: removeMin,
    decrease: decrease
  };
}
