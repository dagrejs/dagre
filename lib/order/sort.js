import _ from 'lodash'
import {partition} from '../util'

function consumeUnsortable (vs, unsortable, index) {
  var last
  while (unsortable.length && (last = _.last(unsortable)).i <= index) {
    unsortable.pop()
    vs.push(last.vs)
    index++
  }
  return index
}

function compareWithBias (bias) {
  return function (entryV, entryW) {
    if (entryV.barycenter < entryW.barycenter) {
      return -1
    } else if (entryV.barycenter > entryW.barycenter) {
      return 1
    }

    return !bias ? entryV.i - entryW.i : entryW.i - entryV.i
  }
}

export default function sort (entries, biasRight) {
  var parts = partition(entries, function (entry) {
    return _.has(entry, 'barycenter')
  })
  var sortable = parts.lhs
  var unsortable = _.sortBy(parts.rhs, function (entry) { return -entry.i })
  var vs = []
  var sum = 0
  var weight = 0
  var vsIndex = 0

  sortable.sort(compareWithBias(!!biasRight))

  vsIndex = consumeUnsortable(vs, unsortable, vsIndex)

  _.each(sortable, function (entry) {
    vsIndex += entry.vs.length
    vs.push(entry.vs)
    sum += entry.barycenter * entry.weight
    weight += entry.weight
    vsIndex = consumeUnsortable(vs, unsortable, vsIndex)
  })

  var result = { vs: _.flatten(vs, true) }
  if (weight) {
    result.barycenter = sum / weight
    result.weight = weight
  }
  return result
}
