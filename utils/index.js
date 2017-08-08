const d3 = Object.assign(require('d3'), require('d3-contour'))
const turf = Object.assign(require('@turf/turf'), require('@turf/meta'))

const interpolate = (options) => (times) => {
  const width = options.width
  const height = options.height
  const offset = options.offset || 3

  return times
    .map((time, index) => {
      const y = index % height
      const x = ~~(index / height)

      if (x === 0 || x === width - 1 || y === 0 || y === height - 1 || time !== 2147483647) return time

      const kernel = [
        {x: -1, y: -1},
        {x: 0, y: -1},
        {x: 1, y: -1},
        {x: -1, y: 0},
        {x: 1, y: 0},
        {x: -1, y: 1},
        {x: 0, y: 1},
        {x: 1, y: 1}
      ]

      const neighbors = kernel
        .map(({ x, y }) => x * height + y)
        .map((offset) => index + offset)
        .map((index) => times[index])
        .filter((d) => d !== 2147483647)

      if (neighbors.length >= kernel.length - offset) {
        const interpolation = Math.round(neighbors.reduce((memo, d) => memo + d, 0) / neighbors.length)
        return interpolation
      }

      return time
    })
}

const contour = (options) => (times) => {
  // this data is height first
  const height = options.height
  const width = options.width
  const bbox = options.bbox

  const breaks = d3.range(0, -60 * 60 - 1, -1 * 60)
  const contours = d3.contours()
    .size([height, width])
    .thresholds(breaks)
  // I need to flip it at some point
  let isobands = contours(
    times.map((time) => -time)
  )
  isobands = isobands.map((isoband) => turf.feature(isoband, {time: -isoband.value}))
  isobands = turf.featureCollection(isobands)

  const mutate = (coords) => {
    // flip coords
    coords.reverse()

    // rescale
    const rangeX = bbox[2] - bbox[0]
    const rangeY = bbox[3] - bbox[1]

    coords[0] = coords[0] / (width - 1) * rangeX + bbox[0]
    coords[1] = coords[1] / (height - 1) * rangeY + bbox[1]
  }
  turf.coordEach(isobands, (coords) => {
    mutate(coords)
  })
  isobands.features.reverse()

  return isobands
}

module.exports = { interpolate, contour }
