package collision

type BoundingBox interface {
	GetBounds() (x1, y1, x2, y2 float64)
}

func CheckCollision(a, b BoundingBox) bool {
	ax1, ay1, ax2, ay2 := a.GetBounds()
	bx1, by1, bx2, by2 := b.GetBounds()

	return ax1 < bx2 && ax2 > bx1 && ay1 < by2 && ay2 > by1
}

func CheckCircleCollision(x1, y1, r1, x2, y2, r2 float64) bool {
	dx := x2 - x1
	dy := y2 - y1
	distanceSquared := dx*dx + dy*dy
	radiusSum := r1 + r2
	return distanceSquared < radiusSum*radiusSum
}

func CheckPointInBox(px, py, bx1, by1, bx2, by2 float64) bool {
	return px >= bx1 && px <= bx2 && py >= by1 && py <= by2
}
