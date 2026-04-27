package com.game.planewar.model.effects;

import java.awt.*;
import java.util.function.Consumer;

/**
 * 爆炸效果
 */
public class Explosion {
    
    public enum ExplosionType {
        SMALL,
        NORMAL,
        LARGE,
        BOSS,
        COLLECT,
        SCREEN_CLEAR
    }
    
    private float x;
    private float y;
    private float radius;
    private float maxRadius;
    private int frame;
    private int maxFrames;
    private boolean active;
    private ExplosionType type;
    private Color baseColor;
    private Consumer<Explosion> onComplete;
    
    public Explosion() {
        this.active = false;
    }
    
    /**
     * 初始化爆炸效果
     */
    public void init(float x, float y, ExplosionType type, Color baseColor, Consumer<Explosion> onComplete) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.baseColor = baseColor;
        this.onComplete = onComplete;
        this.active = true;
        this.frame = 0;
        
        if (type == ExplosionType.SMALL) {
            this.maxRadius = 15;
            this.maxFrames = 15;
        } else if (type == ExplosionType.NORMAL) {
            this.maxRadius = 30;
            this.maxFrames = 25;
        } else if (type == ExplosionType.LARGE) {
            this.maxRadius = 50;
            this.maxFrames = 35;
        } else if (type == ExplosionType.BOSS) {
            this.maxRadius = 120;
            this.maxFrames = 60;
        } else if (type == ExplosionType.COLLECT) {
            this.maxRadius = 25;
            this.maxFrames = 20;
        } else if (type == ExplosionType.SCREEN_CLEAR) {
            this.maxRadius = 500;
            this.maxFrames = 40;
        }
        
        this.radius = 5;
    }
    
    /**
     * 更新
     */
    public void update() {
        if (!active) return;
        
        frame++;
        
        float progress = (float) frame / maxFrames;
        
        if (progress < 0.3f) {
            radius = 5 + (maxRadius - 5) * (progress / 0.3f);
        } else if (progress < 0.7f) {
            radius = maxRadius;
        } else {
            radius = maxRadius * (1 - (progress - 0.7f) / 0.3f);
        }
        
        if (frame >= maxFrames) {
            active = false;
            if (onComplete != null) {
                onComplete.accept(this);
            }
        }
    }
    
    /**
     * 渲染
     */
    public void render(Graphics2D g) {
        if (!active) return;
        
        float progress = (float) frame / maxFrames;
        float alpha = 1.0f;
        
        if (progress > 0.7f) {
            alpha = 1.0f - (progress - 0.7f) / 0.3f;
        }
        
        switch (type) {
            case SMALL:
            case NORMAL:
            case LARGE:
            case BOSS:
                renderFireExplosion(g, progress, alpha);
                break;
            case COLLECT:
                renderCollectEffect(g, progress, alpha);
                break;
            case SCREEN_CLEAR:
                renderScreenClearEffect(g, progress, alpha);
                break;
        }
    }
    
    /**
     * 渲染火焰爆炸
     */
    private void renderFireExplosion(Graphics2D g, float progress, float alpha) {
        int layers = 3;
        for (int i = layers - 1; i >= 0; i--) {
            float layerProgress = (progress + i * 0.1f) % 1.0f;
            float layerRadius = radius * (0.6f + i * 0.2f);
            int layerAlpha = (int) (alpha * 255 * (1 - i * 0.3f));
            
            if (i == 0) {
                g.setColor(new Color(255, 255, 150, layerAlpha));
            } else if (i == 1) {
                g.setColor(new Color(255, 150, 50, layerAlpha));
            } else {
                g.setColor(new Color(255, 50, 0, layerAlpha));
            }
            
            g.fillOval((int) (x - layerRadius), (int) (y - layerRadius),
                       (int) (layerRadius * 2), (int) (layerRadius * 2));
        }
        
        if (progress < 0.3f) {
            int sparkAlpha = (int) (255 * (1 - progress / 0.3f));
            g.setColor(new Color(255, 255, 255, sparkAlpha));
            g.fillOval((int) (x - radius * 0.3f), (int) (y - radius * 0.3f),
                       (int) (radius * 0.6f), (int) (radius * 0.6f));
        }
    }
    
    /**
     * 渲染收集效果
     */
    private void renderCollectEffect(Graphics2D g, float progress, float alpha) {
        int intAlpha = (int) (alpha * 255);
        
        if (baseColor != null) {
            g.setColor(new Color(
                baseColor.getRed(),
                baseColor.getGreen(),
                baseColor.getBlue(),
                intAlpha
            ));
        } else {
            g.setColor(new Color(255, 215, 0, intAlpha));
        }
        
        for (int i = 0; i < 8; i++) {
            float angle = (float) (i * Math.PI / 4 + progress * Math.PI);
            float dist = radius * (0.5f + progress * 0.5f);
            float px = x + (float) Math.cos(angle) * dist;
            float py = y + (float) Math.sin(angle) * dist;
            
            g.fillOval((int) (px - 3), (int) (py - 3), 6, 6);
        }
        
        int ringAlpha = (int) (intAlpha * (1 - progress));
        g.setColor(new Color(255, 255, 255, ringAlpha));
        g.setStroke(new BasicStroke(2));
        g.drawOval((int) (x - radius), (int) (y - radius),
                   (int) (radius * 2), (int) (radius * 2));
    }
    
    /**
     * 渲染清屏效果
     */
    private void renderScreenClearEffect(Graphics2D g, float progress, float alpha) {
        int intAlpha = (int) (alpha * 200);
        
        if (progress < 0.5f) {
            float expandProgress = progress / 0.5f;
            g.setColor(new Color(255, 255, 255, (int) (intAlpha * expandProgress)));
        } else {
            float fadeProgress = 1 - (progress - 0.5f) / 0.5f;
            g.setColor(new Color(255, 200, 100, (int) (intAlpha * fadeProgress)));
        }
        
        g.fillOval((int) (x - radius), (int) (y - radius),
                   (int) (radius * 2), (int) (radius * 2));
        
        if (progress < 0.8f) {
            int ringAlpha = (int) (150 * (1 - progress / 0.8f));
            g.setColor(new Color(255, 150, 0, ringAlpha));
            g.setStroke(new BasicStroke(4));
            g.drawOval((int) (x - radius * 0.8f), (int) (y - radius * 0.8f),
                       (int) (radius * 1.6f), (int) (radius * 1.6f));
        }
    }
    
    // Getters and Setters
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}
