import DxfParser from 'dxf-parser'

/**
 * Calculates the area of a non-self-intersecting polygon using the Shoelace formula.
 * @param {Array<{x: number, y: number}>} vertices - Array of polygon vertices
 * @returns {number} The absolute area of the polygon
 */
export function calculatePolygonArea(vertices) {
    if (!vertices || vertices.length < 3) return 0

    let area = 0
    let j = vertices.length - 1

    for (let i = 0; i < vertices.length; i++) {
        area += (vertices[j].x + vertices[i].x) * (vertices[j].y - vertices[i].y)
        j = i
    }

    return Math.abs(area / 2)
}

/**
 * Calculates the centroid of a non-self-intersecting polygon.
 * @param {Array<{x: number, y: number}>} vertices 
 * @returns {{x: number, y: number}} Centroid coordinates
 */
export function calculatePolygonCentroid(vertices) {
    if (!vertices || vertices.length === 0) return { x: 0, y: 0 }
    if (vertices.length === 1) return { x: vertices[0].x, y: vertices[0].y }
    if (vertices.length === 2) return { x: (vertices[0].x + vertices[1].x) / 2, y: (vertices[0].y + vertices[1].y) / 2 }

    let xSum = 0
    let ySum = 0
    let areaSum = 0

    for (let i = 0; i < vertices.length; i++) {
        let x0 = vertices[i].x
        let y0 = vertices[i].y
        let x1 = vertices[(i + 1) % vertices.length].x
        let y1 = vertices[(i + 1) % vertices.length].y

        let a = (x0 * y1) - (x1 * y0)
        areaSum += a
        xSum += (x0 + x1) * a
        ySum += (y0 + y1) * a
    }

    areaSum *= 0.5
    if (areaSum === 0) {
        // Fallback for collinear or zero-area
        return {
            x: vertices.reduce((sum, v) => sum + v.x, 0) / vertices.length,
            y: vertices.reduce((sum, v) => sum + v.y, 0) / vertices.length
        }
    }

    return {
        x: xSum / (6 * areaSum),
        y: ySum / (6 * areaSum)
    }
}

/**
 * Parses a DXF file string and attempts to extract the largest closed polyline (likely the site boundary).
 * @param {string} dxfString - The raw text content of a .dxf file
 * @returns {Array<{x: number, y: number}> | null} Array of vertices, or null if no valid boundary found
 */
export function parseSiteBoundaryFromDXF(dxfString) {
    const parser = new DxfParser()
    let dxf
    try {
        dxf = parser.parseSync(dxfString)
    } catch (err) {
        console.error("Failed to parse DXF:", err)
        throw new Error("Invalid DXF file format.")
    }

    // Look for all LWPOLYLINE and POLYLINE entities
    const polylines = []

    if (dxf.entities && dxf.entities.length > 0) {
        for (const entity of dxf.entities) {
            if ((entity.type === 'LWPOLYLINE' || entity.type === 'POLYLINE') && entity.vertices) {
                // We prefer closed polylines, but we'll collect all of them just in case
                const vertices = entity.vertices.map(v => ({ x: v.x, y: v.y }))
                polylines.push({
                    isClosed: entity.shape === true || entity.shape === 1 || entity.closed === true,
                    vertices: vertices,
                    area: calculatePolygonArea(vertices)
                })
            }
        }
    }

    if (polylines.length === 0) {
        throw new Error("No continuous polylines found in the DXF file. Please ensure the site boundary is drawn as a Polyline.")
    }

    // Sort by area, descending. We assume the largest closed polyline is the site boundary.
    // If no closed polylines exist, we just take the one with the largest 'area' (bounding box area approximation)
    const closedPolylines = polylines.filter(p => p.isClosed)

    let targetPolyline = null

    if (closedPolylines.length > 0) {
        closedPolylines.sort((a, b) => b.area - a.area)
        targetPolyline = closedPolylines[0]
    } else {
        // Fallback: take the longest polyline if nothing is technically "closed"
        polylines.sort((a, b) => b.vertices.length - a.vertices.length)
        targetPolyline = polylines[0]
    }

    if (!targetPolyline || targetPolyline.vertices.length < 3) {
        throw new Error("Could not extract a valid polygonal boundary from the DXF.")
    }

    // Center the polygon around (0,0) so it's easy to render in our React visualizer
    const centroid = calculatePolygonCentroid(targetPolyline.vertices)
    const normalizedVertices = targetPolyline.vertices.map(v => ({
        x: v.x - centroid.x,
        y: v.y - centroid.y
    }))

    return normalizedVertices
}
