package com.sokoban.engine;

import com.sokoban.level.Level;
import com.sokoban.util.Direction;
import com.sokoban.util.Position;

import java.util.HashSet;
import java.util.Set;

public class DeadlockDetector {
    private final Level level;

    public DeadlockDetector(Level level) {
        this.level = level;
    }

    public boolean isDeadlocked(Set<Position> boxPositions) {
        for (Position box : boxPositions) {
            if (level.isTarget(box)) {
                continue;
            }
            
            if (isCornerDeadlock(box, boxPositions)) {
                return true;
            }
            
            if (isWallDeadlock(box, boxPositions)) {
                return true;
            }
        }
        
        if (isBlockadeDeadlock(boxPositions)) {
            return true;
        }
        
        return false;
    }

    private boolean isCornerDeadlock(Position box, Set<Position> boxPositions) {
        boolean wallUp = level.isWall(box.add(Direction.UP));
        boolean wallDown = level.isWall(box.add(Direction.DOWN));
        boolean wallLeft = level.isWall(box.add(Direction.LEFT));
        boolean wallRight = level.isWall(box.add(Direction.RIGHT));
        
        boolean boxUp = boxPositions.contains(box.add(Direction.UP));
        boolean boxDown = boxPositions.contains(box.add(Direction.DOWN));
        boolean boxLeft = boxPositions.contains(box.add(Direction.LEFT));
        boolean boxRight = boxPositions.contains(box.add(Direction.RIGHT));
        
        boolean blockedUp = wallUp || boxUp;
        boolean blockedDown = wallDown || boxDown;
        boolean blockedLeft = wallLeft || boxLeft;
        boolean blockedRight = wallRight || boxRight;
        
        if ((blockedUp && blockedLeft) || (blockedUp && blockedRight) ||
            (blockedDown && blockedLeft) || (blockedDown && blockedRight)) {
            
            if (isStuckInCorner(box, boxPositions, wallUp, wallDown, wallLeft, wallRight)) {
                return true;
            }
        }
        
        return false;
    }

    private boolean isStuckInCorner(Position box, Set<Position> boxPositions,
                                     boolean wallUp, boolean wallDown, 
                                     boolean wallLeft, boolean wallRight) {
        if (wallUp && wallLeft) {
            return canOnlyMoveOneDirection(box, Direction.DOWN, Direction.RIGHT, boxPositions);
        }
        if (wallUp && wallRight) {
            return canOnlyMoveOneDirection(box, Direction.DOWN, Direction.LEFT, boxPositions);
        }
        if (wallDown && wallLeft) {
            return canOnlyMoveOneDirection(box, Direction.UP, Direction.RIGHT, boxPositions);
        }
        if (wallDown && wallRight) {
            return canOnlyMoveOneDirection(box, Direction.UP, Direction.LEFT, boxPositions);
        }
        return false;
    }

    private boolean canOnlyMoveOneDirection(Position box, Direction dir1, Direction dir2, 
                                             Set<Position> boxPositions) {
        Position pos1 = box.add(dir1);
        Position pos2 = box.add(dir2);
        
        boolean canMove1 = level.isWalkable(pos1) && !boxPositions.contains(pos1);
        boolean canMove2 = level.isWalkable(pos2) && !boxPositions.contains(pos2);
        
        if (!canMove1 && !canMove2) {
            return true;
        }
        
        if (!canMove1) {
            return checkPathBlocked(box, dir2, boxPositions);
        }
        if (!canMove2) {
            return checkPathBlocked(box, dir1, boxPositions);
        }
        
        return false;
    }

    private boolean checkPathBlocked(Position box, Direction pushDir, Set<Position> boxPositions) {
        Position behindBox = box.subtract(pushDir);
        Position inFront = box.add(pushDir);
        Position further = inFront.add(pushDir);
        
        if (level.isWall(further) || boxPositions.contains(further)) {
            return true;
        }
        
        Direction perp1 = getPerpendicular(pushDir, true);
        Direction perp2 = getPerpendicular(pushDir, false);
        
        boolean blockedPerp1 = level.isWall(behindBox.add(perp1)) || 
                               level.isWall(inFront.add(perp1)) ||
                               boxPositions.contains(behindBox.add(perp1)) ||
                               boxPositions.contains(inFront.add(perp1));
                               
        boolean blockedPerp2 = level.isWall(behindBox.add(perp2)) || 
                               level.isWall(inFront.add(perp2)) ||
                               boxPositions.contains(behindBox.add(perp2)) ||
                               boxPositions.contains(inFront.add(perp2));
        
        return blockedPerp1 && blockedPerp2;
    }

    private Direction getPerpendicular(Direction dir, boolean clockwise) {
        switch (dir) {
            case UP:
                return clockwise ? Direction.RIGHT : Direction.LEFT;
            case DOWN:
                return clockwise ? Direction.LEFT : Direction.RIGHT;
            case LEFT:
                return clockwise ? Direction.UP : Direction.DOWN;
            case RIGHT:
                return clockwise ? Direction.DOWN : Direction.UP;
        }
        return dir;
    }

    private boolean isWallDeadlock(Position box, Set<Position> boxPositions) {
        boolean wallUp = level.isWall(box.add(Direction.UP));
        boolean wallDown = level.isWall(box.add(Direction.DOWN));
        boolean wallLeft = level.isWall(box.add(Direction.LEFT));
        boolean wallRight = level.isWall(box.add(Direction.RIGHT));
        
        if (wallUp || wallDown) {
            if (isStuckAlongHorizontalWall(box, boxPositions, wallUp, wallDown)) {
                return true;
            }
        }
        
        if (wallLeft || wallRight) {
            if (isStuckAlongVerticalWall(box, boxPositions, wallLeft, wallRight)) {
                return true;
            }
        }
        
        return false;
    }

    private boolean isStuckAlongHorizontalWall(Position box, Set<Position> boxPositions,
                                                 boolean wallUp, boolean wallDown) {
        Position left = box.add(Direction.LEFT);
        Position right = box.add(Direction.RIGHT);
        
        boolean blockedLeft = level.isWall(left) || boxPositions.contains(left);
        boolean blockedRight = level.isWall(right) || boxPositions.contains(right);
        
        if (blockedLeft && blockedRight) {
            if (!hasEscapeRoute(box, boxPositions)) {
                return true;
            }
        }
        
        return false;
    }

    private boolean isStuckAlongVerticalWall(Position box, Set<Position> boxPositions,
                                               boolean wallLeft, boolean wallRight) {
        Position up = box.add(Direction.UP);
        Position down = box.add(Direction.DOWN);
        
        boolean blockedUp = level.isWall(up) || boxPositions.contains(up);
        boolean blockedDown = level.isWall(down) || boxPositions.contains(down);
        
        if (blockedUp && blockedDown) {
            if (!hasEscapeRoute(box, boxPositions)) {
                return true;
            }
        }
        
        return false;
    }

    private boolean hasEscapeRoute(Position box, Set<Position> boxPositions) {
        for (Direction dir : Direction.values()) {
            Position inFront = box.add(dir);
            Position behind = box.subtract(dir);
            
            if (level.isWalkable(inFront) && !boxPositions.contains(inFront) &&
                level.isWalkable(behind) && !boxPositions.contains(behind)) {
                return true;
            }
        }
        return false;
    }

    private boolean isBlockadeDeadlock(Set<Position> boxPositions) {
        Set<Position> targets = level.getTargetPositions();
        Set<Position> boxesNotOnTarget = new HashSet<>();
        
        for (Position box : boxPositions) {
            if (!targets.contains(box)) {
                boxesNotOnTarget.add(box);
            }
        }
        
        if (boxesNotOnTarget.isEmpty()) {
            return false;
        }
        
        for (Position box : boxesNotOnTarget) {
            if (canReachAnyTarget(box, boxPositions, targets)) {
                return false;
            }
        }
        
        return true;
    }

    private boolean canReachAnyTarget(Position startBox, Set<Position> boxPositions, 
                                        Set<Position> targets) {
        for (Position target : targets) {
            if (boxPositions.contains(target)) {
                continue;
            }
            
            if (canPushBoxToTarget(startBox, target, boxPositions)) {
                return true;
            }
        }
        return false;
    }

    private boolean canPushBoxToTarget(Position box, Position target, Set<Position> boxPositions) {
        int boxX = box.getX();
        int boxY = box.getY();
        int targetX = target.getX();
        int targetY = target.getY();
        
        if (boxX == targetX) {
            Direction dir = boxY < targetY ? Direction.DOWN : Direction.UP;
            return isPathClearHorizontalPush(box, dir, Math.abs(boxY - targetY), boxPositions);
        }
        
        if (boxY == targetY) {
            Direction dir = boxX < targetX ? Direction.RIGHT : Direction.LEFT;
            return isPathClearVerticalPush(box, dir, Math.abs(boxX - targetX), boxPositions);
        }
        
        return false;
    }

    private boolean isPathClearHorizontalPush(Position box, Direction dir, int steps, 
                                                Set<Position> boxPositions) {
        Position current = box;
        for (int i = 0; i < steps; i++) {
            current = current.add(dir);
            if (level.isWall(current) || (boxPositions.contains(current) && !current.equals(box))) {
                return false;
            }
        }
        return true;
    }

    private boolean isPathClearVerticalPush(Position box, Direction dir, int steps, 
                                              Set<Position> boxPositions) {
        Position current = box;
        for (int i = 0; i < steps; i++) {
            current = current.add(dir);
            if (level.isWall(current) || (boxPositions.contains(current) && !current.equals(box))) {
                return false;
            }
        }
        return true;
    }
}
