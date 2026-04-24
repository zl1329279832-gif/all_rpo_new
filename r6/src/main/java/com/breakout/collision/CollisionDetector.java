package com.breakout.collision;

import com.breakout.entity.Ball;
import com.breakout.entity.Brick;
import com.breakout.entity.Entity;
import com.breakout.entity.Paddle;

public class CollisionDetector {

    public CollisionResult checkBallRectCollision(Ball ball, Entity rect) {
        double ballCenterX = ball.getCenterX();
        double ballCenterY = ball.getCenterY();
        double ballRadius = ball.getWidth() / 2.0;

        double rectLeft = rect.getLeft();
        double rectRight = rect.getRight();
        double rectTop = rect.getTop();
        double rectBottom = rect.getBottom();

        double closestX = clamp(ballCenterX, rectLeft, rectRight);
        double closestY = clamp(ballCenterY, rectTop, rectBottom);

        double dx = ballCenterX - closestX;
        double dy = ballCenterY - closestY;
        double distanceSquared = dx * dx + dy * dy;

        if (distanceSquared > ballRadius * ballRadius) {
            return CollisionResult.NO_COLLISION;
        }

        double distance = Math.sqrt(distanceSquared);
        double penetrationDepth = ballRadius - distance;

        if (distance == 0) {
            double centerX = (rectLeft + rectRight) / 2;
            double centerY = (rectTop + rectBottom) / 2;
            
            double distToLeft = ballCenterX - rectLeft;
            double distToRight = rectRight - ballCenterX;
            double distToTop = ballCenterY - rectTop;
            double distToBottom = rectBottom - ballCenterY;

            double minDist = Math.min(Math.min(distToLeft, distToRight), Math.min(distToTop, distToBottom));

            CollisionSide side;
            double normalX = 0, normalY = 0;

            if (minDist == distToLeft) {
                side = CollisionSide.LEFT;
                normalX = -1;
            } else if (minDist == distToRight) {
                side = CollisionSide.RIGHT;
                normalX = 1;
            } else if (minDist == distToTop) {
                side = CollisionSide.TOP;
                normalY = -1;
            } else {
                side = CollisionSide.BOTTOM;
                normalY = 1;
            }

            return new CollisionResult(true, side, penetrationDepth, normalX, normalY);
        }

        double normalX = dx / distance;
        double normalY = dy / distance;

        CollisionSide side = determineCollisionSide(ballCenterX, ballCenterY, rectLeft, rectRight, rectTop, rectBottom);

        return new CollisionResult(true, side, penetrationDepth, normalX, normalY);
    }

    private CollisionSide determineCollisionSide(double ballX, double ballY,
                                                   double rectLeft, double rectRight,
                                                   double rectTop, double rectBottom) {
        double centerX = (rectLeft + rectRight) / 2;
        double centerY = (rectTop + rectBottom) / 2;

        double dx = ballX - centerX;
        double dy = ballY - centerY;

        double width = rectRight - rectLeft;
        double height = rectBottom - rectTop;

        double halfWidth = width / 2;
        double halfHeight = height / 2;

        double ratioX = Math.abs(dx) / halfWidth;
        double ratioY = Math.abs(dy) / halfHeight;

        if (Math.abs(ratioX - ratioY) < 0.1) {
            return CollisionSide.CORNER;
        }

        if (ratioX > ratioY) {
            return dx > 0 ? CollisionSide.RIGHT : CollisionSide.LEFT;
        } else {
            return dy > 0 ? CollisionSide.BOTTOM : CollisionSide.TOP;
        }
    }

    public void resolveBallRectCollision(Ball ball, Entity rect, CollisionResult result) {
        if (!result.isCollided()) {
            return;
        }

        double ballCenterX = ball.getCenterX();
        double ballCenterY = ball.getCenterY();
        double ballRadius = ball.getWidth() / 2.0;

        double rectLeft = rect.getLeft();
        double rectRight = rect.getRight();
        double rectTop = rect.getTop();
        double rectBottom = rect.getBottom();

        double closestX = clamp(ballCenterX, rectLeft, rectRight);
        double closestY = clamp(ballCenterY, rectTop, rectBottom);

        boolean onTopEdge = Math.abs(closestY - rectTop) < 0.1;
        boolean onBottomEdge = Math.abs(closestY - rectBottom) < 0.1;
        boolean onLeftEdge = Math.abs(closestX - rectLeft) < 0.1;
        boolean onRightEdge = Math.abs(closestX - rectRight) < 0.1;

        boolean verticalCollision = onTopEdge || onBottomEdge;
        boolean horizontalCollision = onLeftEdge || onRightEdge;

        double vx = ball.getVelocityX();
        double vy = ball.getVelocityY();

        if (verticalCollision && horizontalCollision) {
            if (Math.abs(vx) > Math.abs(vy)) {
                ball.invertVelocityX();
            } else if (Math.abs(vy) > Math.abs(vx)) {
                ball.invertVelocityY();
            } else {
                ball.invertVelocityX();
                ball.invertVelocityY();
            }
        } else if (verticalCollision) {
            ball.invertVelocityY();
        } else if (horizontalCollision) {
            ball.invertVelocityX();
        }

        double penetration = result.getPenetrationDepth();
        if (penetration > 0) {
            double pushX = result.getNormalX() * (penetration + 1);
            double pushY = result.getNormalY() * (penetration + 1);
            ball.setX(ball.getX() + pushX);
            ball.setY(ball.getY() + pushY);
        }
    }

    public void resolveBallPaddleCollision(Ball ball, Paddle paddle, CollisionResult result) {
        if (!result.isCollided()) {
            return;
        }

        double ballCenterX = ball.getCenterX();
        double paddleCenterX = paddle.getCenterX();
        double paddleHalfWidth = paddle.getWidth() / 2;

        double relativeHitX = (ballCenterX - paddleCenterX) / paddleHalfWidth;
        relativeHitX = Math.max(-1.0, Math.min(1.0, relativeHitX));

        double maxAngle = Math.PI / 3;
        double angle = relativeHitX * maxAngle;

        double currentSpeed = Math.sqrt(
            ball.getVelocityX() * ball.getVelocityX() +
            ball.getVelocityY() * ball.getVelocityY()
        );

        ball.setVelocityX(Math.sin(angle) * currentSpeed);
        ball.setVelocityY(-Math.abs(Math.cos(angle) * currentSpeed));

        double ballBottom = ball.getBottom();
        double paddleTop = paddle.getTop();
        if (ballBottom > paddleTop) {
            ball.setY(paddleTop - ball.getHeight());
        }
    }

    private double clamp(double value, double min, double max) {
        return Math.max(min, Math.min(max, value));
    }

    public boolean checkRectRectCollision(Entity rect1, Entity rect2) {
        return rect1.getLeft() < rect2.getRight() &&
               rect1.getRight() > rect2.getLeft() &&
               rect1.getTop() < rect2.getBottom() &&
               rect1.getBottom() > rect2.getTop();
    }
}
