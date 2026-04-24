package com.breakout.engine;

import com.breakout.collision.CollisionDetector;
import com.breakout.collision.CollisionResult;
import com.breakout.collision.CollisionSide;
import com.breakout.config.GameConfig;
import com.breakout.entity.Ball;
import com.breakout.entity.Brick;
import com.breakout.entity.Paddle;
import com.breakout.input.InputHandler;
import com.breakout.level.Level;
import com.breakout.level.LevelManager;
import com.breakout.powerup.Powerup;
import com.breakout.powerup.PowerupManager;

import java.util.ArrayList;
import java.util.List;

public class GameEngine implements PowerupManager.PowerupEffectListener {
    private GameState currentState;
    private GameState previousState;
    
    private Paddle paddle;
    private List<Ball> balls;
    private LevelManager levelManager;
    private PowerupManager powerupManager;
    private CollisionDetector collisionDetector;
    
    private int score;
    private int lives;
    private boolean ballLaunched;
    private boolean catchMode;
    private int catchModeTimer;
    
    private double accumulator;
    private long lastTime;
    private boolean running;
    
    private GameStateListener stateListener;
    
    public interface GameStateListener {
        void onStateChange(GameState newState);
        void onScoreChange(int newScore);
        void onLivesChange(int newLives);
        void onLevelChange(int newLevel);
    }

    public GameEngine() {
        this.currentState = GameState.MENU;
        this.previousState = GameState.MENU;
        this.collisionDetector = new CollisionDetector();
        this.powerupManager = new PowerupManager();
        this.levelManager = new LevelManager();
        this.powerupManager.addEffectListener(this);
        this.balls = new ArrayList<>();
        this.score = 0;
        this.lives = GameConfig.INITIAL_LIVES;
        this.ballLaunched = false;
        this.catchMode = false;
        this.catchModeTimer = 0;
        this.accumulator = 0;
        this.lastTime = System.nanoTime();
        this.running = true;
        initializeGameObjects();
    }
    
    private void initializeGameObjects() {
        paddle = new Paddle(
            (GameConfig.WINDOW_WIDTH - GameConfig.PADDLE_WIDTH) / 2.0,
            GameConfig.WINDOW_HEIGHT - GameConfig.PADDLE_Y_OFFSET
        );
        
        balls.clear();
        Ball initialBall = new Ball(
            paddle.getCenterX() - GameConfig.BALL_RADIUS,
            paddle.getTop() - GameConfig.BALL_RADIUS * 2
        );
        balls.add(initialBall);
        
        ballLaunched = false;
    }
    
    public void update() {
        switch (currentState) {
            case PLAYING -> updatePlaying();
            case PAUSED -> updatePaused();
            case MENU -> updateMenu();
            case GAME_OVER -> updateGameOver();
            case LEVEL_COMPLETE -> updateLevelComplete();
            case VICTORY -> updateVictory();
        }
    }
    
    private void updatePlaying() {
        long currentTime = System.nanoTime();
        double frameTime = (currentTime - lastTime) / 1_000_000_000.0;
        lastTime = currentTime;
        
        accumulator += frameTime;
        
        while (accumulator >= GameConfig.FRAME_TIME) {
            fixedUpdate(GameConfig.FRAME_TIME);
            accumulator -= GameConfig.FRAME_TIME;
        }
    }
    
    private void fixedUpdate(double deltaTime) {
        if (catchModeTimer > 0) {
            catchModeTimer--;
            if (catchModeTimer == 0) {
                catchMode = false;
            }
        }
        
        paddle.update(deltaTime);
        
        if (!ballLaunched) {
            for (Ball ball : balls) {
                ball.resetPosition(paddle);
            }
        } else {
            List<Ball> ballsToRemove = new ArrayList<>();
            
            for (Ball ball : balls) {
                ball.update(deltaTime);
                
                checkWallCollision(ball);
                
                if (ball.getBottom() >= paddle.getTop() &&
                    ball.getTop() <= paddle.getBottom() &&
                    ball.getRight() >= paddle.getLeft() &&
                    ball.getLeft() <= paddle.getRight()) {
                    
                    CollisionResult result = collisionDetector.checkBallRectCollision(ball, paddle);
                    if (result.isCollided()) {
                        if (catchMode) {
                            ballLaunched = false;
                            ball.resetPosition(paddle);
                        } else {
                            collisionDetector.resolveBallPaddleCollision(ball, paddle, result);
                        }
                    }
                }
                
                Level currentLevel = levelManager.getCurrentLevel();
                if (currentLevel != null) {
                    for (Brick brick : currentLevel.getBricks()) {
                        if (!brick.isActive()) continue;
                        
                        CollisionResult result = collisionDetector.checkBallRectCollision(ball, brick);
                        if (result.isCollided()) {
                            int brickScore = brick.hit();
                            if (brickScore > 0) {
                                score += brickScore;
                                notifyScoreChange();
                                powerupManager.spawnPowerup(brick);
                            }
                            
                            if (!ball.isPierceMode() || brick.isIndestructible()) {
                                collisionDetector.resolveBallRectCollision(ball, brick, result);
                            }
                        }
                    }
                }
                
                if (ball.getTop() > GameConfig.WINDOW_HEIGHT) {
                    ballsToRemove.add(ball);
                }
            }
            
            for (Ball ball : ballsToRemove) {
                balls.remove(ball);
            }
            
            if (balls.isEmpty()) {
                loseLife();
            }
            
            powerupManager.update(deltaTime);
            powerupManager.checkCollisions(paddle);
            
            if (levelManager.isLevelComplete()) {
                score += GameConfig.SCORE_LEVEL_COMPLETE;
                notifyScoreChange();
                if (levelManager.getCurrentLevelNumber() >= GameConfig.MAX_LEVELS) {
                    setState(GameState.VICTORY);
                } else {
                    setState(GameState.LEVEL_COMPLETE);
                }
            }
        }
    }
    
    private void checkWallCollision(Ball ball) {
        if (ball.getLeft() <= 0) {
            ball.setX(0);
            ball.invertVelocityX();
        }
        if (ball.getRight() >= GameConfig.WINDOW_WIDTH) {
            ball.setX(GameConfig.WINDOW_WIDTH - ball.getWidth());
            ball.invertVelocityX();
        }
        if (ball.getTop() <= 0) {
            ball.setY(0);
            ball.invertVelocityY();
        }
    }
    
    private void updatePaused() {
    }
    
    private void updateMenu() {
    }
    
    private void updateGameOver() {
    }
    
    private void updateLevelComplete() {
    }
    
    private void updateVictory() {
    }
    
    public void handleInput(InputHandler input) {
        switch (currentState) {
            case MENU -> handleMenuInput(input);
            case PLAYING -> handlePlayingInput(input);
            case PAUSED -> handlePausedInput(input);
            case GAME_OVER -> handleGameOverInput(input);
            case LEVEL_COMPLETE -> handleLevelCompleteInput(input);
            case VICTORY -> handleVictoryInput(input);
        }
    }
    
    private void handleMenuInput(InputHandler input) {
    }
    
    private void handlePlayingInput(InputHandler input) {
        paddle.setMovingLeft(input.isMoveLeft());
        paddle.setMovingRight(input.isMoveRight());
        
        if (input.isStart() && !ballLaunched) {
            launchBall();
        }
        
        if (input.isPause()) {
            setState(GameState.PAUSED);
        }
    }
    
    private void handlePausedInput(InputHandler input) {
        if (input.isPause() || input.isStart()) {
            setState(GameState.PLAYING);
        }
        
        if (input.isRestart()) {
            restartGame();
        }
    }
    
    private void handleGameOverInput(InputHandler input) {
        if (input.isRestart() || input.isStart()) {
            restartGame();
        }
        
        if (input.isQuit()) {
            setState(GameState.MENU);
        }
    }
    
    private void handleLevelCompleteInput(InputHandler input) {
        if (input.isStart() || input.isMenuSelect()) {
            nextLevel();
        }
    }
    
    private void handleVictoryInput(InputHandler input) {
        if (input.isRestart() || input.isStart()) {
            restartGame();
        }
        
        if (input.isQuit()) {
            setState(GameState.MENU);
        }
    }
    
    public void launchBall() {
        if (!balls.isEmpty()) {
            balls.get(0).launchFromPaddle(paddle);
            ballLaunched = true;
        }
    }
    
    private void loseLife() {
        lives--;
        notifyLivesChange();
        
        if (lives <= 0) {
            setState(GameState.GAME_OVER);
        } else {
            resetBall();
        }
    }
    
    private void resetBall() {
        balls.clear();
        Ball newBall = new Ball(
            paddle.getCenterX() - GameConfig.BALL_RADIUS,
            paddle.getTop() - GameConfig.BALL_RADIUS * 2
        );
        balls.add(newBall);
        ballLaunched = false;
        paddle.resetWidth();
        catchMode = false;
        catchModeTimer = 0;
    }
    
    public void restartGame() {
        score = 0;
        lives = GameConfig.INITIAL_LIVES;
        powerupManager.clearAll();
        levelManager.restartFromBeginning();
        paddle.resetWidth();
        paddle.resetPosition();
        balls.clear();
        Ball newBall = new Ball(
            paddle.getCenterX() - GameConfig.BALL_RADIUS,
            paddle.getTop() - GameConfig.BALL_RADIUS * 2
        );
        balls.add(newBall);
        ballLaunched = false;
        catchMode = false;
        catchModeTimer = 0;
        accumulator = 0;
        lastTime = System.nanoTime();
        
        notifyScoreChange();
        notifyLivesChange();
        notifyLevelChange();
        setState(GameState.MENU);
    }
    
    public void startGame() {
        score = 0;
        lives = GameConfig.INITIAL_LIVES;
        powerupManager.clearAll();
        levelManager.restartFromBeginning();
        paddle.resetWidth();
        paddle.resetPosition();
        balls.clear();
        Ball newBall = new Ball(
            paddle.getCenterX() - GameConfig.BALL_RADIUS,
            paddle.getTop() - GameConfig.BALL_RADIUS * 2
        );
        balls.add(newBall);
        ballLaunched = false;
        catchMode = false;
        catchModeTimer = 0;
        accumulator = 0;
        lastTime = System.nanoTime();
        
        notifyScoreChange();
        notifyLivesChange();
        notifyLevelChange();
        setState(GameState.PLAYING);
    }
    
    public void nextLevel() {
        levelManager.nextLevel();
        powerupManager.clearAll();
        paddle.resetWidth();
        paddle.resetPosition();
        balls.clear();
        Ball newBall = new Ball(
            paddle.getCenterX() - GameConfig.BALL_RADIUS,
            paddle.getTop() - GameConfig.BALL_RADIUS * 2
        );
        balls.add(newBall);
        ballLaunched = false;
        catchMode = false;
        catchModeTimer = 0;
        accumulator = 0;
        lastTime = System.nanoTime();
        
        notifyLevelChange();
        setState(GameState.PLAYING);
    }
    
    @Override
    public void onExpand(Powerup powerup) {
        paddle.expand();
    }

    @Override
    public void onShrink(Powerup powerup) {
        paddle.shrink();
    }

    @Override
    public void onSpeedUp(Powerup powerup) {
        for (Ball ball : balls) {
            ball.speedUp();
        }
    }

    @Override
    public void onSlowDown(Powerup powerup) {
        for (Ball ball : balls) {
            ball.slowDown();
        }
    }

    @Override
    public void onExtraLife(Powerup powerup) {
        if (lives < GameConfig.MAX_LIVES) {
            lives++;
            notifyLivesChange();
        }
    }

    @Override
    public void onPierce(Powerup powerup) {
        for (Ball ball : balls) {
            ball.activatePierceMode();
        }
    }

    @Override
    public void onMultiBall(Powerup powerup) {
        if (balls.isEmpty()) return;
        
        Ball original = balls.get(0);
        double speed = original.getCurrentSpeed();
        
        Ball ball1 = new Ball(original.getX() - 20, original.getY());
        ball1.setCurrentSpeed(speed);
        ball1.launch(-Math.PI / 4);
        
        Ball ball2 = new Ball(original.getX() + 20, original.getY());
        ball2.setCurrentSpeed(speed);
        ball2.launch(-3 * Math.PI / 4);
        
        balls.add(ball1);
        balls.add(ball2);
    }

    @Override
    public void onCatch(Powerup powerup) {
        catchMode = true;
        catchModeTimer = 600;
    }
    
    public GameState getCurrentState() {
        return currentState;
    }
    
    public void setState(GameState newState) {
        if (currentState != newState) {
            previousState = currentState;
            currentState = newState;
            if (stateListener != null) {
                stateListener.onStateChange(newState);
            }
        }
    }
    
    public GameState getPreviousState() {
        return previousState;
    }
    
    public void setStateListener(GameStateListener listener) {
        this.stateListener = listener;
    }
    
    private void notifyScoreChange() {
        if (stateListener != null) {
            stateListener.onScoreChange(score);
        }
    }
    
    private void notifyLivesChange() {
        if (stateListener != null) {
            stateListener.onLivesChange(lives);
        }
    }
    
    private void notifyLevelChange() {
        if (stateListener != null) {
            stateListener.onLevelChange(levelManager.getCurrentLevelNumber());
        }
    }
    
    public Paddle getPaddle() {
        return paddle;
    }
    
    public List<Ball> getBalls() {
        return balls;
    }
    
    public LevelManager getLevelManager() {
        return levelManager;
    }
    
    public PowerupManager getPowerupManager() {
        return powerupManager;
    }
    
    public int getScore() {
        return score;
    }
    
    public int getLives() {
        return lives;
    }
    
    public boolean isBallLaunched() {
        return ballLaunched;
    }
    
    public boolean isCatchMode() {
        return catchMode;
    }
    
    public void setRunning(boolean running) {
        this.running = running;
    }
    
    public boolean isRunning() {
        return running;
    }
}
