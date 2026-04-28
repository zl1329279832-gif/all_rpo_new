import type { 
  Ball, 
  Paddle, 
  Brick, 
  PowerUp
} from '@/types'
import { 
  GameState,
  BrickType,
  PowerUpType
} from '@/types'
import { getLevelConfig, getBrickColor, getPowerUpColor, CANVAS_WIDTH, CANVAS_HEIGHT } from './levels'
import { getSettings, addLeaderboardEntry, saveSettings as saveSettingsToStorage } from '@/utils/storage'

export class GameEngine {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private animationId: number = 0
  private gameState: GameState = GameState.MENU
  
  private balls: Ball[] = []
  private paddle: Paddle
  private bricks: Brick[] = []
  private powerUps: PowerUp[] = []
  
  private score: number = 0
  private lives: number = 3
  private level: number = 1
  private highScore: number = 0
  
  private keys: Set<string> = new Set()
  private isPiercing: boolean = false
  private piercingTimer: number = 0
  private activePowerUps: Map<string, { endTime: number; value: number }> = new Map()
  
  private playerName: string = '玩家'
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.paddle = this.createPaddle()
    this.loadSettings()
    this.setupInput()
  }
  
  private loadSettings(): void {
    const settings = getSettings()
    this.playerName = settings.defaultName
    this.highScore = settings.highScore
  }
  
  private createPaddle(): Paddle {
    return {
      x: CANVAS_WIDTH / 2 - 75,
      y: CANVAS_HEIGHT - 40,
      width: 150,
      height: 15,
      speed: 8,
      originalWidth: 150
    }
  }
  
  private createBall(speed: number = 4): Ball {
    return {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT - 60,
      width: 12,
      height: 12,
      dx: speed * (Math.random() > 0.5 ? 1 : -1),
      dy: -speed,
      speed: speed,
      radius: 6,
      isPiercing: false
    }
  }
  
  private createBricks(): void {
    const config = getLevelConfig(this.level)
    this.bricks = []
    
    for (let row = 0; row < config.rows; row++) {
      for (let col = 0; col < config.cols; col++) {
        let type: BrickType = BrickType.NORMAL
        let hp = 1
        let maxHp = 1
        let points = 100
        
        const rand = Math.random()
        if (rand < config.unbreakableChance) {
          type = BrickType.UNBREAKABLE
          hp = 999
          maxHp = 999
          points = 0
        } else if (rand < config.unbreakableChance + config.multiHpChance) {
          type = BrickType.MULTI_HP
          hp = 2 + Math.floor(this.level / 3)
          maxHp = hp
          points = 200 * hp
        } else {
          points = 100 + Math.floor(this.level / 2) * 50
        }
        
        const brick: Brick = {
          x: col * (config.brickWidth + config.brickPadding) + config.offsetLeft,
          y: row * (config.brickHeight + config.brickPadding) + config.offsetTop,
          width: config.brickWidth,
          height: config.brickHeight,
          type,
          hp,
          maxHp,
          points,
          color: getBrickColor(type, hp, maxHp),
          active: true
        }
        this.bricks.push(brick)
      }
    }
  }
  
  private setupInput(): void {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.key.toLowerCase())
      
      if (e.key === ' ' && this.gameState === GameState.PLAYING) {
        e.preventDefault()
      }
      
      if (e.key === 'Escape' && this.gameState === GameState.PLAYING) {
        this.pause()
      } else if (e.key === 'Escape' && this.gameState === GameState.PAUSED) {
        this.resume()
      }
      
      if ((e.key === 'p' || e.key === 'P') && (this.gameState === GameState.PLAYING || this.gameState === GameState.PAUSED)) {
        if (this.gameState === GameState.PLAYING) {
          this.pause()
        } else {
          this.resume()
        }
      }
    })
    
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key.toLowerCase())
    })
  }
  
  private updatePaddle(): void {
    let paddleWidth = this.paddle.originalWidth
    const longer = this.activePowerUps.get('paddle_longer')
    const shorter = this.activePowerUps.get('paddle_shorter')
    
    if (longer && Date.now() < longer.endTime) {
      paddleWidth = longer.value
    } else if (shorter && Date.now() < shorter.endTime) {
      paddleWidth = shorter.value
    } else {
      this.activePowerUps.delete('paddle_longer')
      this.activePowerUps.delete('paddle_shorter')
    }
    
    this.paddle.width = paddleWidth
    
    if (this.keys.has('arrowleft') || this.keys.has('a')) {
      this.paddle.x = Math.max(0, this.paddle.x - this.paddle.speed)
    }
    if (this.keys.has('arrowright') || this.keys.has('d')) {
      this.paddle.x = Math.min(CANVAS_WIDTH - this.paddle.width, this.paddle.x + this.paddle.speed)
    }
  }
  
  private updateBalls(): void {
    for (let i = this.balls.length - 1; i >= 0; i--) {
      const ball = this.balls[i]
      
      ball.x += ball.dx
      ball.y += ball.dy
      
      if (ball.x - ball.radius <= 0) {
        ball.x = ball.radius
        ball.dx = Math.abs(ball.dx)
      }
      if (ball.x + ball.radius >= CANVAS_WIDTH) {
        ball.x = CANVAS_WIDTH - ball.radius
        ball.dx = -Math.abs(ball.dx)
      }
      if (ball.y - ball.radius <= 0) {
        ball.y = ball.radius
        ball.dy = Math.abs(ball.dy)
      }
      
      if (ball.y + ball.radius >= CANVAS_HEIGHT) {
        if (this.balls.length > 1) {
          this.balls.splice(i, 1)
        } else {
          this.lives--
          if (this.lives <= 0) {
            this.gameOver()
          } else {
            this.resetBall()
          }
        }
      }
      
      this.checkPaddleCollision(ball)
      this.checkBrickCollision(ball)
    }
    
    const speedUp = this.activePowerUps.get('ball_speed_up')
    if (speedUp && Date.now() > speedUp.endTime) {
      this.activePowerUps.delete('ball_speed_up')
      for (const ball of this.balls) {
        const config = getLevelConfig(this.level)
        ball.speed = config.ballSpeed
        ball.dx = (ball.dx / Math.abs(ball.dx)) * ball.speed * (Math.abs(ball.dx) / ball.speed)
        ball.dy = (ball.dy / Math.abs(ball.dy)) * ball.speed * (Math.abs(ball.dy) / ball.speed)
      }
    }
    
    if (this.isPiercing) {
      if (Date.now() > this.piercingTimer) {
        this.isPiercing = false
        for (const ball of this.balls) {
          ball.isPiercing = false
        }
      }
    }
  }
  
  private checkPaddleCollision(ball: Ball): void {
    if (
      ball.y + ball.radius >= this.paddle.y &&
      ball.y - ball.radius <= this.paddle.y + this.paddle.height &&
      ball.x + ball.radius >= this.paddle.x &&
      ball.x - ball.radius <= this.paddle.x + this.paddle.width
    ) {
      ball.y = this.paddle.y - ball.radius
      
      const hitPoint = (ball.x - this.paddle.x) / this.paddle.width
      const angle = (hitPoint - 0.5) * Math.PI * 0.7
      
      const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy)
      ball.dx = speed * Math.sin(angle)
      ball.dy = -Math.abs(speed * Math.cos(angle))
    }
  }
  
  private checkBrickCollision(ball: Ball): void {
    for (const brick of this.bricks) {
      if (!brick.active) continue
      
      if (
        ball.x + ball.radius >= brick.x &&
        ball.x - ball.radius <= brick.x + brick.width &&
        ball.y + ball.radius >= brick.y &&
        ball.y - ball.radius <= brick.y + brick.height
      ) {
        if (brick.type === BrickType.UNBREAKABLE) {
          if (!ball.isPiercing) {
            this.reflectBall(ball, brick)
          }
          continue
        }
        
        brick.hp--
        if (brick.hp <= 0) {
          brick.active = false
          this.score += brick.points
          this.maybeSpawnPowerUp(brick)
        } else {
          brick.color = getBrickColor(brick.type, brick.hp, brick.maxHp)
        }
        
        if (!ball.isPiercing) {
          this.reflectBall(ball, brick)
        }
      }
    }
  }
  
  private reflectBall(ball: Ball, brick: Brick): void {
    const overlapLeft = ball.x + ball.radius - brick.x
    const overlapRight = brick.x + brick.width - (ball.x - ball.radius)
    const overlapTop = ball.y + ball.radius - brick.y
    const overlapBottom = brick.y + brick.height - (ball.y - ball.radius)
    
    const minOverlapX = Math.min(overlapLeft, overlapRight)
    const minOverlapY = Math.min(overlapTop, overlapBottom)
    
    if (minOverlapX < minOverlapY) {
      ball.dx = -ball.dx
    } else {
      ball.dy = -ball.dy
    }
  }
  
  private maybeSpawnPowerUp(brick: Brick): void {
    const config = getLevelConfig(this.level)
    if (Math.random() > config.powerUpChance) return
    
    const types: PowerUpType[] = [
      PowerUpType.PADDLE_LONGER,
      PowerUpType.PADDLE_SHORTER,
      PowerUpType.BALL_SPEED_UP,
      PowerUpType.EXTRA_LIFE,
      PowerUpType.PIERCING,
      PowerUpType.MULTI_BALL
    ]
    
    const weights = [25, 10, 15, 20, 15, 15]
    const totalWeight = weights.reduce((a, b) => a + b, 0)
    let random = Math.random() * totalWeight
    let selectedType: PowerUpType = PowerUpType.EXTRA_LIFE
    
    for (let i = 0; i < types.length; i++) {
      random -= weights[i]
      if (random <= 0) {
        selectedType = types[i]
        break
      }
    }
    
    const powerUp: PowerUp = {
      x: brick.x + brick.width / 2 - 10,
      y: brick.y + brick.height / 2,
      width: 20,
      height: 20,
      type: selectedType,
      speed: 2,
      color: getPowerUpColor(selectedType),
      active: true
    }
    
    this.powerUps.push(powerUp)
  }
  
  private updatePowerUps(): void {
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const powerUp = this.powerUps[i]
      powerUp.y += powerUp.speed
      
      if (powerUp.y > CANVAS_HEIGHT) {
        this.powerUps.splice(i, 1)
        continue
      }
      
      if (
        powerUp.x < this.paddle.x + this.paddle.width &&
        powerUp.x + powerUp.width > this.paddle.x &&
        powerUp.y < this.paddle.y + this.paddle.height &&
        powerUp.y + powerUp.height > this.paddle.y
      ) {
        this.applyPowerUp(powerUp.type)
        this.powerUps.splice(i, 1)
      }
    }
  }
  
  private applyPowerUp(type: PowerUpType): void {
    const now = Date.now()
    const duration = 10000
    
    switch (type) {
      case PowerUpType.PADDLE_LONGER:
        this.activePowerUps.set('paddle_longer', {
          endTime: now + duration,
          value: this.paddle.originalWidth * 1.5
        })
        this.activePowerUps.delete('paddle_shorter')
        break
        
      case PowerUpType.PADDLE_SHORTER:
        this.activePowerUps.set('paddle_shorter', {
          endTime: now + duration,
          value: this.paddle.originalWidth * 0.6
        })
        this.activePowerUps.delete('paddle_longer')
        break
        
      case PowerUpType.BALL_SPEED_UP:
        this.activePowerUps.set('ball_speed_up', {
          endTime: now + duration,
          value: 0
        })
        for (const ball of this.balls) {
          ball.speed *= 1.3
          ball.dx *= 1.3
          ball.dy *= 1.3
        }
        break
        
      case PowerUpType.EXTRA_LIFE:
        this.lives = Math.min(this.lives + 1, 5)
        break
        
      case PowerUpType.PIERCING:
        this.isPiercing = true
        this.piercingTimer = now + duration
        for (const ball of this.balls) {
          ball.isPiercing = true
        }
        break
        
      case PowerUpType.MULTI_BALL:
        const newBalls: Ball[] = []
        for (const ball of this.balls) {
          const ball1 = { ...ball, dx: -ball.speed, dy: -ball.speed }
          const ball2 = { ...ball, dx: ball.speed, dy: -ball.speed }
          newBalls.push(ball1, ball2)
        }
        this.balls.push(...newBalls.slice(0, Math.max(0, 6 - this.balls.length)))
        break
    }
  }
  
  private checkLevelComplete(): void {
    const breakableBricks = this.bricks.filter(b => b.type !== BrickType.UNBREAKABLE)
    const activeBreakable = breakableBricks.filter(b => b.active)
    
    if (activeBreakable.length === 0) {
      if (this.level >= 10) {
        this.victory()
      } else {
        this.levelComplete()
      }
    }
  }
  
  private resetBall(): void {
    const config = getLevelConfig(this.level)
    this.balls = [this.createBall(config.ballSpeed)]
    this.paddle = this.createPaddle()
  }
  
  private resetGame(): void {
    this.score = 0
    this.lives = 3
    this.level = 1
    this.powerUps = []
    this.activePowerUps.clear()
    this.isPiercing = false
    this.createBricks()
    this.resetBall()
  }
  
  private gameOver(): void {
    this.gameState = GameState.GAME_OVER
    this.loadSettings()
    addLeaderboardEntry(this.playerName, this.score, this.level)
  }
  
  private victory(): void {
    this.gameState = GameState.VICTORY
    this.loadSettings()
    addLeaderboardEntry(this.playerName, this.score, this.level)
  }
  
  private levelComplete(): void {
    this.gameState = GameState.LEVEL_COMPLETE
  }
  
  private render(): void {
    this.ctx.fillStyle = '#1a1a2e'
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'
    this.ctx.lineWidth = 1
    for (let x = 0; x < CANVAS_WIDTH; x += 40) {
      this.ctx.beginPath()
      this.ctx.moveTo(x, 0)
      this.ctx.lineTo(x, CANVAS_HEIGHT)
      this.ctx.stroke()
    }
    for (let y = 0; y < CANVAS_HEIGHT; y += 40) {
      this.ctx.beginPath()
      this.ctx.moveTo(0, y)
      this.ctx.lineTo(CANVAS_WIDTH, y)
      this.ctx.stroke()
    }
    
    switch (this.gameState) {
      case GameState.MENU:
        this.renderMenu()
        break
      case GameState.PLAYING:
      case GameState.PAUSED:
        this.renderGame()
        break
      case GameState.GAME_OVER:
        this.renderGameOver()
        break
      case GameState.LEVEL_COMPLETE:
        this.renderLevelComplete()
        break
      case GameState.VICTORY:
        this.renderVictory()
        break
      case GameState.LEADERBOARD:
        this.renderLeaderboard()
        break
      case GameState.SETTINGS:
        this.renderSettings()
        break
    }
  }
  
  private renderGame(): void {
    for (const brick of this.bricks) {
      if (!brick.active) continue
      
      this.ctx.fillStyle = brick.color
      this.ctx.fillRect(brick.x, brick.y, brick.width, brick.height)
      
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
      this.ctx.lineWidth = 2
      this.ctx.strokeRect(brick.x, brick.y, brick.width, brick.height)
      
      if (brick.type === BrickType.MULTI_HP && brick.hp > 0) {
        this.ctx.fillStyle = '#ffffff'
        this.ctx.font = 'bold 14px Arial'
        this.ctx.textAlign = 'center'
        this.ctx.textBaseline = 'middle'
        this.ctx.fillText(
          brick.hp.toString(),
          brick.x + brick.width / 2,
          brick.y + brick.height / 2
        )
      }
      
      if (brick.type === BrickType.UNBREAKABLE) {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
        this.ctx.lineWidth = 1
        const cx = brick.x + brick.width / 2
        const cy = brick.y + brick.height / 2
        this.ctx.beginPath()
        this.ctx.arc(cx - 8, cy, 3, 0, Math.PI * 2)
        this.ctx.stroke()
        this.ctx.beginPath()
        this.ctx.arc(cx + 8, cy, 3, 0, Math.PI * 2)
        this.ctx.stroke()
        this.ctx.beginPath()
        this.ctx.moveTo(cx - 5, cy + 5)
        this.ctx.lineTo(cx + 5, cy + 5)
        this.ctx.stroke()
      }
    }
    
    for (const powerUp of this.powerUps) {
      this.ctx.beginPath()
      this.ctx.arc(
        powerUp.x + powerUp.width / 2,
        powerUp.y + powerUp.height / 2,
        powerUp.width / 2,
        0,
        Math.PI * 2
      )
      this.ctx.fillStyle = powerUp.color
      this.ctx.fill()
      this.ctx.strokeStyle = '#ffffff'
      this.ctx.lineWidth = 2
      this.ctx.stroke()
      
      this.ctx.fillStyle = '#ffffff'
      this.ctx.font = 'bold 12px Arial'
      this.ctx.textAlign = 'center'
      this.ctx.textBaseline = 'middle'
      const icons: Record<string, string> = {
        [PowerUpType.PADDLE_LONGER]: '+',
        [PowerUpType.PADDLE_SHORTER]: '-',
        [PowerUpType.BALL_SPEED_UP]: '>',
        [PowerUpType.EXTRA_LIFE]: '♥',
        [PowerUpType.PIERCING]: '•',
        [PowerUpType.MULTI_BALL]: '○'
      }
      this.ctx.fillText(
        icons[powerUp.type] || '?',
        powerUp.x + powerUp.width / 2,
        powerUp.y + powerUp.height / 2
      )
    }
    
    this.ctx.fillStyle = '#3498db'
    this.ctx.fillRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height)
    
    this.ctx.strokeStyle = '#ffffff'
    this.ctx.lineWidth = 2
    this.ctx.strokeRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height)
    
    for (const ball of this.balls) {
      this.ctx.beginPath()
      this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2)
      
      if (ball.isPiercing) {
        this.ctx.fillStyle = '#00ffff'
        this.ctx.shadowColor = '#00ffff'
        this.ctx.shadowBlur = 10
      } else {
        this.ctx.fillStyle = '#ffffff'
        this.ctx.shadowColor = 'transparent'
        this.ctx.shadowBlur = 0
      }
      this.ctx.fill()
      this.ctx.shadowBlur = 0
      
      this.ctx.strokeStyle = ball.isPiercing ? '#00ffff' : '#ffffff'
      this.ctx.lineWidth = 2
      this.ctx.stroke()
    }
    
    this.ctx.fillStyle = '#ffffff'
    this.ctx.font = 'bold 20px Arial'
    this.ctx.textAlign = 'left'
    this.ctx.textBaseline = 'top'
    this.ctx.fillText(`分数: ${this.score}`, 20, 10)
    
    this.ctx.textAlign = 'center'
    this.ctx.fillText(`第 ${this.level} 关`, CANVAS_WIDTH / 2, 10)
    
    this.ctx.textAlign = 'right'
    this.ctx.fillText('生命: ', CANVAS_WIDTH - 100, 10)
    
    for (let i = 0; i < this.lives; i++) {
      this.ctx.fillStyle = '#e74c3c'
      this.ctx.beginPath()
      this.ctx.arc(CANVAS_WIDTH - 80 + i * 25, 20, 8, 0, Math.PI * 2)
      this.ctx.fill()
    }
    
    if (this.activePowerUps.size > 0 || this.isPiercing) {
      this.ctx.textAlign = 'left'
      this.ctx.font = '14px Arial'
      this.ctx.fillStyle = '#f39c12'
      let y = 35
      
      if (this.isPiercing) {
        const remaining = Math.ceil((this.piercingTimer - Date.now()) / 1000)
        this.ctx.fillText(`穿透球: ${remaining}秒`, 20, y)
        y += 20
      }
      
      for (const [type, data] of this.activePowerUps) {
        const remaining = Math.ceil((data.endTime - Date.now()) / 1000)
        if (remaining > 0) {
          const names: Record<string, string> = {
            paddle_longer: '挡板变长',
            paddle_shorter: '挡板变短',
            ball_speed_up: '小球加速'
          }
          this.ctx.fillText(`${names[type] || type}: ${remaining}秒`, 20, y)
          y += 20
        }
      }
    }
    
    if (this.gameState === GameState.PAUSED) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
      this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
      
      this.ctx.fillStyle = '#ffffff'
      this.ctx.font = 'bold 48px Arial'
      this.ctx.textAlign = 'center'
      this.ctx.textBaseline = 'middle'
      this.ctx.fillText('游戏暂停', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60)
      
      this.ctx.font = '24px Arial'
      this.ctx.fillText('按 ESC 或 P 继续游戏', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)
      this.ctx.fillText('按 R 重新开始', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40)
      this.ctx.fillText('按 M 返回主菜单', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80)
    }
  }
  
  private renderMenu(): void {
    this.ctx.fillStyle = '#ffffff'
    this.ctx.font = 'bold 56px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    this.ctx.fillText('打砖块', CANVAS_WIDTH / 2, 150)
    
    this.ctx.font = '24px Arial'
    this.ctx.fillStyle = '#aaaaaa'
    this.ctx.fillText('BREAKOUT', CANVAS_WIDTH / 2, 200)
    
    const menuItems = [
      { text: '开始游戏', key: '1' },
      { text: '排行榜', key: '2' },
      { text: '设置', key: '3' }
    ]
    
    const startY = 300
    this.ctx.font = 'bold 28px Arial'
    
    menuItems.forEach((item, index) => {
      const y = startY + index * 60
      this.ctx.fillStyle = '#ffffff'
      this.ctx.textAlign = 'center'
      this.ctx.fillText(`${item.key}. ${item.text}`, CANVAS_WIDTH / 2, y)
    })
    
    this.ctx.font = '16px Arial'
    this.ctx.fillStyle = '#888888'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('按数字键选择或点击对应区域', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 80)
    
    this.ctx.font = '14px Arial'
    this.ctx.fillText('控制: ← → 或 A/D 移动挡板 | 空格发射小球', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 50)
    this.ctx.fillText('P/ESC 暂停 | R 重新开始 | M 返回菜单', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30)
  }
  
  private renderGameOver(): void {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    
    this.ctx.fillStyle = '#e74c3c'
    this.ctx.font = 'bold 56px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    this.ctx.fillText('游戏结束', CANVAS_WIDTH / 2, 180)
    
    this.ctx.fillStyle = '#ffffff'
    this.ctx.font = '28px Arial'
    this.ctx.fillText(`最终得分: ${this.score}`, CANVAS_WIDTH / 2, 280)
    this.ctx.fillText(`到达关卡: 第 ${this.level} 关`, CANVAS_WIDTH / 2, 330)
    
    if (this.score >= this.highScore && this.score > 0) {
      this.ctx.fillStyle = '#f39c12'
      this.ctx.font = 'bold 32px Arial'
      this.ctx.fillText('🎉 新纪录！', CANVAS_WIDTH / 2, 400)
    }
    
    this.ctx.fillStyle = '#aaaaaa'
    this.ctx.font = '20px Arial'
    this.ctx.fillText('按 R 重新开始 | 按 M 返回主菜单', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 80)
  }
  
  private renderLevelComplete(): void {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    
    this.ctx.fillStyle = '#2ecc71'
    this.ctx.font = 'bold 56px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    this.ctx.fillText('关卡完成！', CANVAS_WIDTH / 2, 200)
    
    this.ctx.fillStyle = '#ffffff'
    this.ctx.font = '28px Arial'
    this.ctx.fillText(`当前得分: ${this.score}`, CANVAS_WIDTH / 2, 280)
    this.ctx.fillText(`即将进入: 第 ${this.level + 1} 关`, CANVAS_WIDTH / 2, 330)
    
    this.ctx.fillStyle = '#f39c12'
    this.ctx.font = '24px Arial'
    this.ctx.fillText('按空格进入下一关', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 100)
  }
  
  private renderVictory(): void {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    
    this.ctx.fillStyle = '#f39c12'
    this.ctx.font = 'bold 56px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    this.ctx.fillText('🎉 恭喜通关！', CANVAS_WIDTH / 2, 180)
    
    this.ctx.fillStyle = '#ffffff'
    this.ctx.font = '28px Arial'
    this.ctx.fillText(`最终得分: ${this.score}`, CANVAS_WIDTH / 2, 280)
    this.ctx.fillText('你完成了所有 10 个关卡！', CANVAS_WIDTH / 2, 330)
    
    if (this.score >= this.highScore) {
      this.ctx.fillStyle = '#f39c12'
      this.ctx.font = 'bold 32px Arial'
      this.ctx.fillText('🏆 新纪录！', CANVAS_WIDTH / 2, 400)
    }
    
    this.ctx.fillStyle = '#aaaaaa'
    this.ctx.font = '20px Arial'
    this.ctx.fillText('按 R 重新开始 | 按 M 返回主菜单', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 80)
  }
  
  private renderLeaderboard(): void {
    this.ctx.fillStyle = '#ffffff'
    this.ctx.font = 'bold 40px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    this.ctx.fillText('排行榜', CANVAS_WIDTH / 2, 80)
    
    const leaderboard = this.getLeaderboardData()
    
    if (leaderboard.length === 0) {
      this.ctx.font = '24px Arial'
      this.ctx.fillStyle = '#888888'
      this.ctx.fillText('暂无记录', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)
    } else {
      const startY = 140
      const rowHeight = 45
      
      this.ctx.font = 'bold 18px Arial'
      this.ctx.fillStyle = '#aaaaaa'
      this.ctx.textAlign = 'left'
      this.ctx.fillText('排名', 60, startY)
      this.ctx.textAlign = 'center'
      this.ctx.fillText('玩家', CANVAS_WIDTH / 2, startY)
      this.ctx.textAlign = 'right'
      this.ctx.fillText('分数  关卡', CANVAS_WIDTH - 60, startY)
      
      this.ctx.strokeStyle = '#444444'
      this.ctx.lineWidth = 1
      this.ctx.beginPath()
      this.ctx.moveTo(40, startY + 20)
      this.ctx.lineTo(CANVAS_WIDTH - 40, startY + 20)
      this.ctx.stroke()
      
      leaderboard.forEach((entry: any, index: number) => {
        const y = startY + (index + 1) * rowHeight
        
        this.ctx.font = 'bold 20px Arial'
        this.ctx.textAlign = 'left'
        
        if (index === 0) {
          this.ctx.fillStyle = '#f39c12'
          this.ctx.fillText('🥇', 40, y)
        } else if (index === 1) {
          this.ctx.fillStyle = '#95a5a6'
          this.ctx.fillText('🥈', 40, y)
        } else if (index === 2) {
          this.ctx.fillStyle = '#d35400'
          this.ctx.fillText('🥉', 40, y)
        } else {
          this.ctx.fillStyle = '#888888'
          this.ctx.fillText((index + 1).toString(), 60, y)
        }
        
        this.ctx.fillStyle = '#ffffff'
        this.ctx.textAlign = 'center'
        this.ctx.fillText(entry.name, CANVAS_WIDTH / 2, y)
        
        this.ctx.textAlign = 'right'
        this.ctx.fillText(`${entry.score}  第${entry.level}关`, CANVAS_WIDTH - 60, y)
        
        this.ctx.font = '14px Arial'
        this.ctx.fillStyle = '#666666'
        this.ctx.fillText(entry.date, CANVAS_WIDTH - 60, y + 18)
      })
    }
    
    this.ctx.fillStyle = '#aaaaaa'
    this.ctx.font = '20px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('按 M 返回主菜单', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 50)
  }
  
  private renderSettings(): void {
    this.ctx.fillStyle = '#ffffff'
    this.ctx.font = 'bold 40px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    this.ctx.fillText('设置', CANVAS_WIDTH / 2, 80)
    
    const settings = getSettings()
    
    const startY = 160
    const rowHeight = 60
    
    this.ctx.font = '22px Arial'
    this.ctx.textAlign = 'left'
    this.ctx.fillStyle = '#ffffff'
    
    this.ctx.fillText(`1. 音效: ${settings.soundEnabled ? '开启' : '关闭'}`, 150, startY)
    this.ctx.fillText(`2. 主题: ${settings.theme === 'dark' ? '深色' : '浅色'}`, 150, startY + rowHeight)
    this.ctx.fillText(`3. 默认昵称: ${settings.defaultName}`, 150, startY + rowHeight * 2)
    this.ctx.fillText(`4. 最高分: ${settings.highScore}`, 150, startY + rowHeight * 3)
    
    this.ctx.fillStyle = '#888888'
    this.ctx.font = '18px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('按 1/2 切换设置 | 按 M 返回主菜单', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 80)
  }
  
  private getLeaderboardData() {
    const stored = localStorage.getItem('breakout_leaderboard')
    if (stored) {
      return JSON.parse(stored)
    }
    return []
  }
  
  private gameLoop(_timestamp: number): void {
    if (this.gameState === GameState.PLAYING) {
      this.updatePaddle()
      this.updateBalls()
      this.updatePowerUps()
      this.checkLevelComplete()
    }
    
    this.render()
    this.animationId = requestAnimationFrame((t) => this.gameLoop(t))
  }
  
  public start(): void {
    this.loadSettings()
    this.render()
    this.animationId = requestAnimationFrame((t) => this.gameLoop(t))
    
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect()
      const y = e.clientY - rect.top
      
      if (this.gameState === GameState.MENU) {
        if (y >= 280 && y <= 320) {
          this.startNewGame()
        } else if (y >= 340 && y <= 380) {
          this.gameState = GameState.LEADERBOARD
        } else if (y >= 400 && y <= 440) {
          this.gameState = GameState.SETTINGS
        }
      } else if (this.gameState === GameState.LEADERBOARD || this.gameState === GameState.SETTINGS) {
        this.gameState = GameState.MENU
      }
    })
  }
  
  public handleKeyPress(key: string): void {
    const lowerKey = key.toLowerCase()
    
    switch (this.gameState) {
      case GameState.MENU:
        if (key === '1') {
          this.startNewGame()
        } else if (key === '2') {
          this.gameState = GameState.LEADERBOARD
        } else if (key === '3') {
          this.gameState = GameState.SETTINGS
        }
        break
        
      case GameState.PLAYING:
        if (key === ' ') {
        } else if (lowerKey === 'r') {
          this.restart()
        } else if (lowerKey === 'm') {
          this.goToMenu()
        }
        break
        
      case GameState.PAUSED:
        if (lowerKey === 'r') {
          this.restart()
        } else if (lowerKey === 'm') {
          this.goToMenu()
        }
        break
        
      case GameState.LEVEL_COMPLETE:
        if (key === ' ') {
          this.nextLevel()
        }
        break
        
      case GameState.GAME_OVER:
      case GameState.VICTORY:
        if (lowerKey === 'r') {
          this.restart()
        } else if (lowerKey === 'm') {
          this.goToMenu()
        }
        break
        
      case GameState.LEADERBOARD:
      case GameState.SETTINGS:
        if (lowerKey === 'm') {
          this.gameState = GameState.MENU
        } else if (this.gameState === GameState.SETTINGS) {
          if (key === '1') {
            const settings = getSettings()
            saveSettingsToStorage({ soundEnabled: !settings.soundEnabled })
          } else if (key === '2') {
            const settings = getSettings()
            saveSettingsToStorage({ theme: settings.theme === 'dark' ? 'light' : 'dark' })
          }
        }
        break
    }
  }
  
  private startNewGame(): void {
    this.loadSettings()
    this.resetGame()
    this.gameState = GameState.PLAYING
  }
  
  private nextLevel(): void {
    this.level++
    this.powerUps = []
    this.activePowerUps.clear()
    this.isPiercing = false
    this.createBricks()
    this.resetBall()
    this.gameState = GameState.PLAYING
  }
  
  public pause(): void {
    if (this.gameState === GameState.PLAYING) {
      this.gameState = GameState.PAUSED
    }
  }
  
  public resume(): void {
    if (this.gameState === GameState.PAUSED) {
      this.gameState = GameState.PLAYING
    }
  }
  
  public restart(): void {
    this.resetGame()
    this.gameState = GameState.PLAYING
  }
  
  public goToMenu(): void {
    this.gameState = GameState.MENU
  }
  
  public getGameState(): GameState {
    return this.gameState
  }
  
  public getScore(): number {
    return this.score
  }
  
  public getLevel(): number {
    return this.level
  }
  
  public getLives(): number {
    return this.lives
  }
  
  public destroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
    }
  }
}
