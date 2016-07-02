import _ from 'lodash'
import {buildLayerMatrix} from './util'
import {Graph} from 'graphlib'

export function debugOrdering (g) {
  var layerMatrix = buildLayerMatrix(g)

  var h = new Graph({ compound: true, multigraph: true }).setGraph({})

  _.each(g.nodes(), function (v) {
    h.setNode(v, { label: v })
    h.setParent(v, 'layer' + g.node(v).rank)
  })

  _.each(g.edges(), function (e) {
    h.setEdge(e.v, e.w, {}, e.name)
  })

  _.each(layerMatrix, function (layer, i) {
    var layerV = 'layer' + i
    h.setNode(layerV, { rank: 'same' })
    _.reduce(layer, function (u, v) {
      h.setEdge(u, v, { style: 'invis' })
      return v
    })
  })

  return h
}
