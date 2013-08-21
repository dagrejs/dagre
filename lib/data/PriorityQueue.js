module.exports = PriorityQueue;

function PriorityQueue() {
  this._arr = [];
  this._keyIndices = {};
}

PriorityQueue.prototype.size = function() { return this._arr.length; };

PriorityQueue.prototype.keys = function() { return Object.keys(this._keyIndices); };

PriorityQueue.prototype.has = function(key) { return key in this._keyIndices; };

PriorityQueue.prototype.priority = function(key) {
  var i = this._keyIndices[key];
  if (i !== undefined) {
    return this._arr[i].pri;
  }
};

PriorityQueue.prototype.add = function(key, pri) {
  if (!(key in this._keyIndices)) {
    var entry = {key: key, pri: pri};
    var index = this._arr.length;
    this._keyIndices[key] = index;
    this._arr.push(entry);
    this._decrease(index);
    return true;
  }
  return false;
};

PriorityQueue.prototype.min = function() {
  if (this.size() > 0) {
    return this._arr[0].key;
  }
};

PriorityQueue.prototype.removeMin = function() {
  this._swap(0, this._arr.length - 1);
  var min = this._arr.pop();
  delete this._keyIndices[min.key];
  this._heapify(0);
  return min.key;
};

PriorityQueue.prototype.decrease = function(key, pri) {
  var index = this._keyIndices[key];
  if (pri > this._arr[index].pri) {
    throw new Error("New priority is greater than current priority. " +
        "Key: " + key + " Old: " + this._arr[index].pri + " New: " + pri);
  }
  this._arr[index].pri = pri;
  this._decrease(index);
};

PriorityQueue.prototype._heapify = function(i) {
  var arr = this._arr;
  var l = 2 * i,
      r = l + 1,
      largest = i;
  if (l < arr.length) {
    largest = arr[l].pri < arr[largest].pri ? l : largest;
    if (r < arr.length) {
      largest = arr[r].pri < arr[largest].pri ? r : largest;
    }
    if (largest !== i) {
      this._swap(i, largest);
      this._heapify(largest);
    }
  }
};

PriorityQueue.prototype._decrease = function(i) {
  var pri = this._arr[i].pri;
  var parent;
  while (i > 0) {
    parent = i >> 1;
    if (this._arr[parent].pri < pri) {
      break;
    }
    this._swap(i, parent);
    i = parent;
  }
};

PriorityQueue.prototype._swap = function(i, j) {
  var arr = this._arr;
  var keyIndices = this._keyIndices;
  var tmp = arr[i];
  arr[i] = arr[j];
  arr[j] = tmp;
  keyIndices[arr[i].key] = i;
  keyIndices[arr[j].key] = j;
};
