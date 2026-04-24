package com.tankwar.collision;

import com.tankwar.entity.*;
import com.tankwar.map.Wall;
import com.tankwar.util.GameConstants;

import java.awt.*;
import java.util.List;

public class CollisionDetector {

    public static boolean checkTankWallCollision(Tank tank, List<Wall> walls) {
        Rectangle tankBounds = tank.getBounds();
        for (Wall wall : walls) {
            if (wall.isActive() && (wall.getType() != Wall.Type.GRASS)) {
                if (tankBounds.intersects(wall.getBounds())) {
                    return true;
                }
            }
        }
        return false;
    }

    public static boolean checkTankBoundaryCollision(Tank tank) {
        Rectangle bounds = tank.getBounds();
        return bounds.x < GameConstants.TILE_SIZE ||
               bounds.x + bounds.width > GameConstants.SCREEN_WIDTH - GameConstants.TILE_SIZE ||
               bounds.y < GameConstants.TILE_SIZE ||
               bounds.y + bounds.height > GameConstants.GAME_HEIGHT - GameConstants.TILE_SIZE;
    }

    public static Bullet checkBulletWallCollision(Bullet bullet, List<Wall> walls) {
        if (!bullet.isActive()) return null;
        Rectangle bulletBounds = bullet.getBounds();
        for (Wall wall : walls) {
            if (wall.isActive()) {
                if (bulletBounds.intersects(wall.getBounds())) {
                    if (wall.getType() != Wall.Type.WATER && wall.getType() != Wall.Type.GRASS) {
                        if (wall.getType() == Wall.Type.BRICK || wall.getType() == Wall.Type.BASE ||
                            (wall.getType() == Wall.Type.STEEL && bullet.isEnhanced())) {
                            wall.takeDamage();
                        }
                        bullet.setActive(false);
                        return bullet;
                    }
                }
            }
        }
        return null;
    }

    public static Tank checkBulletTankCollision(Bullet bullet, PlayerTank player, List<EnemyTank> enemies) {
        if (!bullet.isActive()) return null;
        Rectangle bulletBounds = bullet.getBounds();
        if (bullet.isFromPlayer()) {
            for (EnemyTank enemy : enemies) {
                if (enemy.isActive() && bulletBounds.intersects(enemy.getBounds())) {
                    enemy.takeDamage(bullet.isEnhanced() ? 2 : 1);
                    bullet.setActive(false);
                    return enemy;
                }
            }
        } else {
            if (player.isActive() && bulletBounds.intersects(player.getBounds())) {
                player.takeDamage(bullet.isEnhanced() ? 2 : 1);
                bullet.setActive(false);
                return player;
            }
        }
        return null;
    }

    public static PowerUp checkPlayerPowerUpCollision(PlayerTank player, List<PowerUp> powerUps) {
        if (!player.isActive()) return null;
        Rectangle playerBounds = player.getBounds();
        for (PowerUp powerUp : powerUps) {
            if (powerUp.isActive() && playerBounds.intersects(powerUp.getBounds())) {
                powerUp.setActive(false);
                return powerUp;
            }
        }
        return null;
    }
}
