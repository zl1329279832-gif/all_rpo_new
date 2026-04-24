package com.breakout.collision;

public class CollisionResult {
    private final boolean collided;
    private final CollisionSide side;
    private final double penetrationDepth;
    private final double normalX;
    private final double normalY;

    public static final CollisionResult NO_COLLISION = new CollisionResult(false, CollisionSide.NONE, 0, 0, 0);

    public CollisionResult(boolean collided, CollisionSide side, double penetrationDepth, double normalX, double normalY) {
        this.collided = collided;
        this.side = side;
        this.penetrationDepth = penetrationDepth;
        this.normalX = normalX;
        this.normalY = normalY;
    }

    public boolean isCollided() {
        return collided;
    }

    public CollisionSide getSide() {
        return side;
    }

    public double getPenetrationDepth() {
        return penetrationDepth;
    }

    public double getNormalX() {
        return normalX;
    }

    public double getNormalY() {
        return normalY;
    }
}
