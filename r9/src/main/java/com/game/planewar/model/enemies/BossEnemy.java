package com.game.planewar.model.enemies;

import com.game.planewar.PlaneWarGame;
import com.game.planewar.model.projectiles.Projectile;

import java.awt.*;

/**
 * Boss敌机 - 巨大，极多血量，多种攻击模式
 */
public class BossEnemy extends Enemy {
    
    private static final float BASE_WIDTH = 180;
    private static final float BASE_HEIGHT = 120;
    private static final int BASE_HEALTH = 1000;
    private static final int BASE_SCORE = 10000;
    private static final float BASE_SPEED = 0.5f;
    
    public enum BossPhase {
        ENTERING,
        PATROL,
        ATTACK
    }
    
    private BossPhase currentPhase;
    private int attackPattern;
    private int patternCounter;
    private int phaseTimer;
    private float targetX;
    private float targetY;
    
    @Override
    protected void setupByType(float difficultyMultiplier) {
        this.type = EnemyType.BOSS;
        this.width = BASE_WIDTH;
        this.height = BASE_HEIGHT;
        this.maxHealth = (int) (BASE_HEALTH * difficultyMultiplier);
        this.health = this.maxHealth;
        this.scoreValue = (int) (BASE_SCORE * difficultyMultiplier);
        this.baseSpeedY = BASE_SPEED;
        this.shootInterval = 30;
        this.shootCooldown = 30;
        
        this.currentPhase = BossPhase.ENTERING;
        this.attackPattern = 0;
        this.patternCounter = 0;
        this.phaseTimer = 0;
        this.targetY = 80;
        this.targetX = (PlaneWarGame.WINDOW_WIDTH - width) / 2;
    }
    
    @Override
    public void update() {
        phaseTimer++;
        
        if (currentPhase == BossPhase.ENTERING) {
            updateEntering();
        } else if (currentPhase == BossPhase.PATROL) {
            updatePatrol();
        } else if (currentPhase == BossPhase.ATTACK) {
            updateAttack();
        }
        
        if (shootCooldown > 0) {
            shootCooldown--;
        }
    }
    
    /**
     * 入场阶段
     */
    private void updateEntering() {
        if (y < targetY) {
            y += 1.5f;
        }
        
        float dx = targetX - x;
        if (Math.abs(dx) > 1) {
            x += dx * 0.05f;
        }
        
        if (y >= targetY - 5 && Math.abs(x - targetX) < 10) {
            currentPhase = BossPhase.PATROL;
            phaseTimer = 0;
            targetX = 20 + gameController.getRandom().nextFloat() * 
                       (PlaneWarGame.WINDOW_WIDTH - width - 40);
        }
    }
    
    /**
     * 巡逻阶段
     */
    private void updatePatrol() {
        float dx = targetX - x;
        if (Math.abs(dx) > 2) {
            x += dx * 0.03f;
        } else {
            targetX = 20 + gameController.getRandom().nextFloat() * 
                       (PlaneWarGame.WINDOW_WIDTH - width - 40);
        }
        
        if (phaseTimer > 120 && shootCooldown <= 0) {
            currentPhase = BossPhase.ATTACK;
            phaseTimer = 0;
            attackPattern = gameController.getRandom().nextInt(3);
            patternCounter = 0;
        }
    }
    
    /**
     * 攻击阶段
     */
    private void updateAttack() {
        if (phaseTimer % 20 == 0 && patternCounter < 5) {
            executeAttackPattern();
            patternCounter++;
            shootCooldown = 20;
        }
        
        if (patternCounter >= 5) {
            currentPhase = BossPhase.PATROL;
            phaseTimer = 0;
            targetX = 20 + gameController.getRandom().nextFloat() * 
                       (PlaneWarGame.WINDOW_WIDTH - width - 40);
        }
    }
    
    /**
     * 执行攻击模式
     */
    private void executeAttackPattern() {
        float difficulty = gameController.getLevelSystem().getDifficultyMultiplier();
        
        switch (attackPattern) {
            case 0:
                for (int i = -3; i <= 3; i++) {
                    float angle = (float) Math.PI / 2 + i * (float) Math.PI / 12;
                    float speed = 3.5f * difficulty;
                    float speedX = (float) Math.cos(angle) * speed;
                    float speedY = (float) Math.sin(angle) * speed;
                    
                    gameController.getProjectileManager().spawnEnemyBullet(
                        getCenterX(), y + height,
                        speedX, speedY,
                        Projectile.ProjectileType.BOSS_NORMAL,
                        15
                    );
                }
                break;
            case 1:
                int bulletCount = 8;
                float baseAngle = (float) (phaseTimer * 0.02);
                gameController.getProjectileManager().spawnBossSpread(
                    getCenterX(), y + height,
                    bulletCount, 3.0f * difficulty
                );
                break;
            case 2:
                float playerX = gameController.getPlayer().getCenterX();
                float playerY = gameController.getPlayer().getCenterY();
                float dx = playerX - getCenterX();
                float dy = playerY - getCenterY();
                float distance = (float) Math.sqrt(dx * dx + dy * dy);
                
                if (distance > 0) {
                    float speed = 5.0f * difficulty;
                    for (int i = -1; i <= 1; i++) {
                        float angle = (float) Math.atan2(dy, dx) + i * 0.15f;
                        float speedX = (float) Math.cos(angle) * speed;
                        float speedY = (float) Math.sin(angle) * speed;
                        
                        gameController.getProjectileManager().spawnEnemyBullet(
                            getCenterX() + i * 30, y + height,
                            speedX, speedY,
                            Projectile.ProjectileType.BOSS_SPREAD,
                            18
                        );
                    }
                }
                break;
        }
    }
    
    @Override
    protected void shoot() {
    }
    
    @Override
    public void render(Graphics2D g) {
        drawBoss(g);
        drawHealthBar(g);
        drawPhaseIndicator(g);
    }
    
    /**
     * 绘制Boss
     */
    private void drawBoss(Graphics2D g) {
        float glow = (float) (0.5 + 0.5 * Math.sin(System.currentTimeMillis() * 0.003));
        
        g.setColor(new Color(255, (int) (50 * glow), 50, 50));
        g.fillOval((int) (x - 15), (int) (y - 15), (int) (width + 30), (int) (height + 30));
        
        g.setColor(new Color(120, 30, 30));
        g.fillRoundRect((int) (x + width * 0.1f), (int) (y + height * 0.1f),
                        (int) (width * 0.8f), (int) (height * 0.7f), 20, 20);
        
        g.setColor(new Color(180, 40, 40));
        g.fillRoundRect((int) (x + width * 0.2f), (int) (y + height * 0.2f),
                        (int) (width * 0.6f), (int) (height * 0.45f), 15, 15);
        
        g.setColor(new Color(100, 20, 20));
        g.fillRect((int) x, (int) (y + height * 0.35f),
                   (int) (width * 0.15f), (int) (height * 0.5f));
        g.fillRect((int) (x + width * 0.85f), (int) (y + height * 0.35f),
                   (int) (width * 0.15f), (int) (height * 0.5f));
        
        g.setColor(new Color(150, 30, 30));
        g.fillRect((int) (x + width * 0.3f), (int) (y + height * 0.75f),
                   (int) (width * 0.15f), (int) (height * 0.2f));
        g.fillRect((int) (x + width * 0.55f), (int) (y + height * 0.75f),
                   (int) (width * 0.15f), (int) (height * 0.2f));
        
        g.setColor(new Color(255, (int) (100 + 155 * glow), 0, 255));
        g.fillOval((int) (x + width * 0.3f), (int) (y + height * 0.25f),
                   (int) (width * 0.15f), (int) (height * 0.25f));
        g.fillOval((int) (x + width * 0.55f), (int) (y + height * 0.25f),
                   (int) (width * 0.15f), (int) (height * 0.25f));
        
        g.setColor(new Color(255, 0, 0, (int) (100 + 155 * glow)));
        g.fillOval((int) (x + width * 0.4f), (int) (y + height * 0.1f),
                   (int) (width * 0.2f), (int) (height * 0.2f));
    }
    
    /**
     * 绘制血条
     */
    private void drawHealthBar(Graphics2D g) {
        float barWidth = PlaneWarGame.WINDOW_WIDTH - 40;
        float barHeight = 15;
        float barX = 20;
        float barY = 15;
        
        g.setColor(Color.DARK_GRAY);
        g.fillRect((int) barX, (int) barY, (int) barWidth, (int) barHeight);
        
        float healthPercent = (float) health / maxHealth;
        Color healthColor = healthPercent > 0.5f ? new Color(255, 100, 0) :
                            healthPercent > 0.25f ? new Color(255, 50, 0) : new Color(255, 0, 0);
        g.setColor(healthColor);
        g.fillRect((int) barX, (int) barY, (int) (barWidth * healthPercent), (int) barHeight);
        
        g.setColor(Color.WHITE);
        g.drawRect((int) barX, (int) barY, (int) barWidth, (int) barHeight);
        
        g.setColor(Color.WHITE);
        g.setFont(new Font("Arial", Font.BOLD, 12));
        String bossText = "BOSS - Lv." + gameController.getLevelSystem().getCurrentLevel();
        String healthText = health + "/" + maxHealth + " (" + (int) (healthPercent * 100) + "%)";
        
        g.drawString(bossText, (int) barX, (int) (barY - 5));
        
        FontMetrics fm = g.getFontMetrics();
        int textX = (int) (barX + (barWidth - fm.stringWidth(healthText)) / 2);
        g.drawString(healthText, textX, (int) (barY + barHeight - 2));
    }
    
    /**
     * 绘制阶段指示器
     */
    private void drawPhaseIndicator(Graphics2D g) {
        String phaseText;
        Color phaseColor;
        
        if (currentPhase == BossPhase.ENTERING) {
            phaseText = "进入中...";
            phaseColor = Color.CYAN;
        } else if (currentPhase == BossPhase.PATROL) {
            phaseText = "巡逻中";
            phaseColor = Color.YELLOW;
        } else {
            phaseText = "攻击中!";
            phaseColor = Color.RED;
        }
        
        g.setColor(phaseColor);
        g.setFont(new Font("Arial", Font.BOLD, 14));
        g.drawString(phaseText, PlaneWarGame.WINDOW_WIDTH / 2 - 30, 50);
    }
    
    @Override
    protected void onDeath() {
        gameController.getExplosionManager().createBossExplosion(getCenterX(), getCenterY());
        
        for (int i = 0; i < 3; i++) {
            float spawnX = x + width * (0.25f + i * 0.25f);
            float spawnY = y + height / 2;
            gameController.getItemManager().spawnRandomItem(spawnX, spawnY);
        }
        
        gameController.getLevelSystem().bossDefeated();
        
        gameController.getScoreSystem().addScore(scoreValue, false);
        
        if (onDeathCallback != null) {
            onDeathCallback.accept(this);
        }
        
        returnToPool();
    }
    
    @Override
    protected float getDropChance() {
        return 1.0f;
    }
    
    public BossPhase getCurrentPhase() {
        return currentPhase;
    }
}
