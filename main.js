const canvas = document.querySelector('canvas')
const ctx = canvas.getContext('2d')

canvas.width = canvas.scrollWidth
canvas.height = canvas.scrollHeight

const grids = []
const defenders = []
const enemies = []
const enemiesPosition = []
const projectiles = []
const cellSize = 100
const cellGap = 3
let frame = 0

const defenderImage = new Image()
const enemyImage = new Image()


let money = 200
let defenderCost = 50
let score = 0

mouse = {
    x: undefined,
    y: undefined,
    width: 0.1,
    height: 0.1
}

let canvasPosition = canvas.getBoundingClientRect()
canvas.addEventListener('mousemove', e => {
    mouse.x = e.x - canvasPosition.left
    mouse.y = e.y - canvasPosition.top
})
canvas.addEventListener('mouseleave', e => {
    mouse.x = undefined
    mouse.y = undefined
})

class Grid {
    constructor(x, y) {
        this.x = x
        this.y = y
        this.width = cellSize
        this.height = cellSize
    }
    draw() {
        if (mouse.x && mouse.y && collision(this, mouse)) {
            ctx.strokeStyle = 'white'
            ctx.lineWidth = 1
            ctx.strokeRect(this.x, this.y, this.width, this.height)
        }
    }
}
function createGrid() {
    for (let y = 0; y < canvas.height; y += cellSize) {
        for (let x = 0; x < canvas.width; x += cellSize) {
            grids.push(new Grid(x, y))
        }
    }
}
createGrid()
function handleGrid() {
    for (let i = 0; i < grids.length; i++) {
        const grid = grids[i];
        grid.draw()
    }
}

class Projectile {
    constructor(x, y) {
        this.x = x + 70
        this.y = y + 45
        this.width = 5
        this.height = 5
        this.speed = 1
        this.power = 20
    }
    draw() {
        ctx.beginPath()
        ctx.fillStyle = 'yellow'
        ctx.arc(this.x, this.y, this.width, 0, Math.PI * 2)
        ctx.fill()
    }
    update() {
        this.x += this.speed
    }
}

function handleProjectile() {
    for (let i = 0; i < projectiles.length; i++) {
        const projectile = projectiles[i];
        projectile.update()
        projectile.draw()

        if (projectile.x > canvas.width - projectile.width) {
            projectiles.splice(i, 1)
        }
    }
}

class Defenders {
    constructor(x, y) {
        this.x = x
        this.y = y + cellGap
        this.width = cellSize
        this.height = cellSize - (cellGap * 2)
        this.shooting = false
        this.health = 100
        this.timeHit = 0
        this.time = 0

        this.characterPosition = 'ATTACK'
        this.imageFrame = 0
        this.imageFps = 5
    }
    draw() {
        defenderImage.src = `assets/2/2_entity_000_${this.characterPosition}_00${this.imageFrame}.png`
        if (this.imageFps < 0) {
            this.imageFrame == 6 ? this.imageFrame = 0 : this.imageFrame += 1
            this.imageFps = 5
        }
        this.imageFps--;

        ctx.drawImage(defenderImage, this.x, this.y, this.width, this.height)

        ctx.fillStyle = 'white'
        ctx.font = '20px arial'
        ctx.fillText(Math.floor(this.health), this.x + 20, this.y + 110)
    }
    hit() {
        if (this.timeHit > 130) {
            this.health -= 10
            this.timeHit = 0
        }
        this.timeHit++
    }
    update() {
        if (this.time > 200) {
            projectiles.push(new Projectile(this.x, this.y))
            this.time = 0
        }
        this.time++
    }
}
canvas.addEventListener('click', e => {
    const gridPositionX = mouse.x - (mouse.x % cellSize)
    const gridPositionY = mouse.y - (mouse.y % cellSize)

    if (gridPositionY < cellSize) return

    for (let i = 0; i < defenders.length; i++) {
        if (defenders[i].x === gridPositionX && defenders[i].y === gridPositionY + cellGap)
            return
    }

    if (money >= defenderCost) {
        defenders.push(new Defenders(gridPositionX, gridPositionY))
        money -= defenderCost
    }
});


function handleDefenders() {
    for (let i = 0; i < defenders.length; i++) {
        const defender = defenders[i];
        defender.update()
        defender.draw()

        for (let j = 0; j < enemies.length; j++) {
            const enemy = enemies[j];
            if (collision(defender, enemy)) {
                defender.hit()
                if (defender.health <= 0) {
                    defender.characterPosition = 'DIE'
                    setTimeout(() => {
                        defenders.splice(i, 1)
                        i--
                    }, 1500);
                    enemy.movement = enemy.speed
                }
            }
        }
    }
}
function handleGameStatus() {
    ctx.fillStyle = 'white'
    ctx.font = '30px arial'
    ctx.fillText("Resource : " + money, 30, 45)
    ctx.fillText("Score : " + score, 30, 75)
}

class Enemy {
    constructor(y) {
        this.x = canvas.width
        this.y = y
        this.width = cellSize
        this.height = cellSize
        this.speed = 1
        this.movement = this.speed
        this.health = 100
        this.maxHealth = this.health

        this.characterPosition = 'RUN'
        this.imageFrame = 0
        this.imageFps = 5
    }
    draw() {
        enemyImage.src = `assets/1/1_entity_000_${this.characterPosition}_00${this.imageFrame}.png`
        if (this.imageFps < 0) {
            this.imageFrame == 6 ? this.imageFrame = 0 : this.imageFrame += 1
            this.imageFps = 5
        }
        this.imageFps--;

        ctx.drawImage(enemyImage, this.x, this.y, this.width, this.height)

        ctx.fillStyle = 'white'
        ctx.font = '20px arial'
        ctx.fillText(Math.floor(this.maxHealth), this.x + 20, this.y + 110)
    }
    update() {
        this.x -= this.movement
    }
    attack() {
        this.characterPosition = 'ATTACK'
    }
}
function handleEnemies() {
    for (let i = 0; i < enemies.length; i++) {
        if (enemies[i].x < 0) {
            enemies.splice(i, 1)
        }
        enemies[i].update()
        enemies[i].draw()
        for (let j = 0; j < defenders.length; j++) {
            if (collision(enemies[i], defenders[j])) {
                enemies[i].movement = 0
                enemies[i].attack()
            }
        }

        for (let j = 0; j < projectiles.length; j++) {
            const projectile = projectiles[j];
            if (collision(projectile, enemies[i])) {
                projectiles.splice(j, 1)
                enemies[i].maxHealth -= projectile.power
                if (enemies[i].maxHealth <= 0) {
                    enemies.splice(i, 1)
                }
            }
        }
    }

    if (frame % 150 == 0) {
        randomY = Math.floor(Math.random() * 5 + 1) * cellSize
        enemiesPosition.push(randomY)
        enemies.push(new Enemy(randomY))
    }
}


function collision(first, second) {
    if (
        !(
            first.x > second.x + second.width ||
            first.x + first.width < second.x ||
            first.y > second.y + second.height ||
            first.y + first.height < second.y
        )
    ) {
        return true
    }
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    ctx.fillStyle = 'rgba(0,0,0,0.7)'
    ctx.fillRect(0, 0, canvas.width, cellSize)
    handleGrid()
    handleDefenders()
    handleGameStatus()
    handleEnemies()
    handleProjectile()

    frame++
    requestAnimationFrame(animate)
}

animate()