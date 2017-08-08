const fs = require('fs')
const turf = require('@turf/turf')
const _ = require('lodash')
const utils = require('./utils')

const pointGrid = require('./data/point-grid.geo.json')
const before = require('./data/raw-before.json')
const after = require('./data/raw-after.json')

const interpolate = utils.interpolate({
  width: pointGrid.properties.width,
  height: pointGrid.properties.height,
  offset: 3
})

const contour = utils.contour({
  width: pointGrid.properties.width,
  height: pointGrid.properties.height,
  bbox: turf.bbox(pointGrid)
})

const deltas = _.zip(
  before.times,
  after.times
)
  .map(([ x, y ]) => x - y)
  .map((d) => d < 0 ? 0 : d)
  .map((d) => d === 1612 ? 0 :d)    // cleanup data

const deltaPoints = turf.featureCollection(
  _.zip(
    pointGrid.features,
    deltas
  )
    .map(([ feature, delta ]) => Object.assign(feature, {properties: {time: delta}}))
    .filter((feature) => feature.properties.time > 0)
)

fs.writeFileSync('./output/jurong-east.delta.geo.json', JSON.stringify(deltaPoints))
fs.writeFileSync('./output/jurong-east.before.geo.json', JSON.stringify(contour(interpolate(before.times))))
fs.writeFileSync('./output/jurong-east.after.geo.json', JSON.stringify(contour(interpolate(after.times))))
