package com.breakout.powerup;

import com.breakout.collision.CollisionDetector;
import com.breakout.entity.Ball;
import com.breakout.entity.Brick;
import com.breakout.entity.Paddle;

import java.util.ArrayList;
import java.util.List;

public class PowerupManager {
    private final List<Powerup> activePowerups;
    private final CollisionDetector collisionDetector;
    private final List<PowerupEffectListener> effectListeners;

    public interface PowerupEffectListener {
        void onExpand(Powerup powerup);
        void onShrink(Powerup powerup);
        void onSpeedUp(Powerup powerup);
        void onSlowDown(Powerup powerup);
        void onExtraLife(Powerup powerup);
        void onPierce(Powerup powerup);
        void onMultiBall(Powerup powerup);
        void onCatch(Powerup powerup);
    }

    public PowerupManager() {
        this.activePowerups = new ArrayList<>();
        this.collisionDetector = new CollisionDetector();
        this.effectListeners = new ArrayList<>();
    }

    public void addEffectListener(PowerupEffectListener listener) {
        effectListeners.add(listener);
    }

    public void removeEffectListener(PowerupEffectListener listener) {
        effectListeners.remove(listener);
    }

    public void spawnPowerup(Brick brick) {
        if (brick.hasPowerup()) {
            double x = brick.getCenterX() - 10;
            double y = brick.getCenterY();
            PowerupType type = PowerupType.getRandom();
            activePowerups.add(new Powerup(x, y, type));
        }
    }

    public void spawnPowerup(double x, double y, PowerupType type) {
        activePowerups.add(new Powerup(x, y, type));
    }

    public void update(double deltaTime) {
        activePowerups.removeIf(powerup -> !powerup.isActive());
        
        for (Powerup powerup : activePowerups) {
            powerup.update(deltaTime);
        }
    }

    public void render(java.awt.Graphics2D g2d) {
        for (Powerup powerup : activePowerups) {
            powerup.render(g2d);
        }
    }

    public void checkCollisions(Paddle paddle) {
        List<Powerup> toRemove = new ArrayList<>();
        
        for (Powerup powerup : activePowerups) {
            if (collisionDetector.checkRectRectCollision(powerup, paddle)) {
                toRemove.add(powerup);
                applyPowerupEffect(powerup);
            }
        }
        
        activePowerups.removeAll(toRemove);
    }

    private void applyPowerupEffect(Powerup powerup) {
        for (PowerupEffectListener listener : effectListeners) {
            switch (powerup.getType()) {
                case EXPAND -> listener.onExpand(powerup);
                case SHRINK -> listener.onShrink(powerup);
                case SPEED_UP -> listener.onSpeedUp(powerup);
                case SLOW_DOWN -> listener.onSlowDown(powerup);
                case EXTRA_LIFE -> listener.onExtraLife(powerup);
                case PIERCE -> listener.onPierce(powerup);
                case MULTI_BALL -> listener.onMultiBall(powerup);
                case CATCH -> listener.onCatch(powerup);
            }
        }
    }

    public void clearAll() {
        activePowerups.clear();
    }

    public List<Powerup> getActivePowerups() {
        return new ArrayList<>(activePowerups);
    }
}
