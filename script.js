window.addEventListener('load', function(){
    const canvas = this.document.getElementById('canvas1');
    const ctx = canvas.getContext('2d');
    canvas.width = 800;
    canvas.height = 720;
    let enemies = [];
    let projectiles = [];
    let score = 0;
    let highScore = 0;
    let gameOver = false;
    let canFire = true;
    let explosions = [];
    let enemyProjectiles = [];
    let count = 0;

    class InputHandler {
        constructor(){
            this.keys = [];
            window.addEventListener('keydown', e => {
                if((e.key === 'ArrowDown' 
                    || e.key === 'ArrowUp' 
                    || e.key === 'ArrowLeft' 
                    || e.key === 'ArrowRight'
                    || e.key === ' ')
                    && this.keys.indexOf(e.key) === -1){
                    this.keys.push(e.key);
                }
            });
            window.addEventListener('keyup', e => {
                if( e.key === 'ArrowDown' 
                    || e.key === 'ArrowUp' 
                    || e.key === 'ArrowLeft' 
                    || e.key === 'ArrowRight'
                    || e.key === ' '){
                    this.keys.splice(this.keys.indexOf(e.key), 1);
                }     
            });
        }
    }

    class Player {
        constructor(gameWidth, gameHeight){
            this.gameWidth = gameWidth;
            this.gameHeight = gameHeight;
            this.width = 100;
            this.height = 160;
            this.opacity = 1;
            this.x = 0;
            this.y = this.gameHeight - this.height;
            this.image = document.getElementById('playerImage')
            this.frameX = 0;
            this.maxFrame = 750;
            this.frameY = 0;
            this.fps = 20;
            this.frameTimer = 0;
            this.frameInterval = 1000/this.fps;
            this.speed = 0;
            this.vy = 0;
            this.weight = 1;
            this.lives = 3;
            this.liveImage = document.getElementById('heartImage')

        }

        draw(context){
            context.save();
            context.globalAlpha = this.opacity;
            context.drawImage(this.image, this.frameX, this.frameY, this.width, this.height, this.x, this.y, this.width, this.height);
            context.restore();
            for(let i = 0; i < this.lives; i++){
                context.drawImage(this.liveImage, 700 - (i*50), 0, 100, 100);
            }
        }

        update(input, deltaTime, enemies){
            //sprite animation
            if(this.frameTimer > this.frameInterval){
                if(this.frameX >= this.maxFrame) this.frameX = 0;
                else this.frameX = this.frameX + 150;
                this.frameTimer = 0;
            } else {
                this.frameTimer += deltaTime;
            }
            
            //controls 
            if(input.keys.indexOf('ArrowRight') > -1){
                this.speed = 8;
            } else if(input.keys.indexOf('ArrowLeft') > -1){
                this.speed= -8;
            }else{
                this.speed = 0;
            }
            if(input.keys.indexOf('ArrowUp') > -1 && this.onGround()){
                this.vy -= 30;
            }
            if(input.keys.indexOf(' ') > -1 && canFire){
                projectiles.push(new Projectile({
                    position: {
                        x: this.x + this.width/2,
                        y: this.y + this.height/4
                    },
                    velocity:{
                        x:10,
                        y:0
                    }
                }))
                canFire = false;
                setTimeout(allowFire, 300);
            }
            //horizontal movement
            this.x += this.speed;
            if(this.x < 0) this.x = 0;
            else if (this.x > this.gameWidth - this.width) this.x = this.gameHeight - this.width;
            //vertical movement
            this.y += this.vy;
            if(!this.onGround()){
                this.vy += this.weight;
                this.frameY = 160;
            } else{
                this.vy = 0;
                this.frameY = 0;
            }
            if(this.y > this.gameHeight - this.height) this.y = this.gameHeight - this.height
        }
        onGround(){
            return this.y >= this.gameHeight - this.height;
        }
    }
    
    class Projectile{
        constructor({position, velocity}){
            this.position = position;
            this.velocity = velocity;
            this.width = 50;
            this.height = 50;
            this.image = document.getElementById('laser');
        }

        draw(context){
            context.drawImage(this.image, this.position.x, this.position.y, this.width, this.height)
        }

        update(context){
            this.draw(context)
            this.position.x += this.velocity.x
            this.position.y += this.velocity.y
            
        }
    }

    class Explosion{
        constructor({position, image, width, height}) {
            this.position = position;
            this.width = width;
            this.height = height;
            this.frameX = 0;
            this.frameY = 13*height;
            this.maxFrame = 5*width;
            this.fps = 15;
            this.frameTimer = 0;
            this.frameInterval = 2000/this.fps;
            this.image = image;
            this.markedForDeletion = false;
            this.frameChange = width;
        }

        draw(context){
            context.drawImage(this.image, this.frameX, this.frameY, this.width, this.height, this.position.x, this.position.y, this.width, this.height);
        }

        update(context, deltaTime){
            this.draw(context);
            if(this.frameTimer > this.frameInterval){
                if(this.frameX === this.maxFrame) this.markedForDeletion = true;
                else this.frameX = this.frameX + this.frameChange;
                this.frameTimer = 0;
            } else {
                this.frameTimer += deltaTime;
            }
        }
    }

    class Background {
        constructor(gameWidth, gameHeight){
            this.gameWidth = gameWidth;
            this.gameHeight = gameHeight;
            this.image = document.getElementById('backgroundImage');
            this.x = 0;
            this.y = 0;
            this.width = 2304;
            this.height = 720;
            this.speed = 7;
        }
        draw(context){
            context.drawImage(this.image, this.x, this.y, this.width, this.height);
            context.drawImage(this.image, this.x + this.width, this.y, this.width, this.height);
        }
        update(){
            this.x -= this.speed;
            if(this.x < 0 - this.width) this.x = 0;
        }
    }

    class Enemy {
        constructor(gameWidth, gameHeight, enemyHeight, image, speed, type){
            this.gameWidth = gameWidth;
            this.gameHeight = gameHeight;
            this.width = 150;
            this.height = 140;
            this.image = image;
            this.x = this.gameWidth;
            this.y = this.gameHeight - this.height - enemyHeight;
            this.speed = speed;
            this.markedForDeletion = false;
            this.type = type;
        }
        draw(context){
            context.drawImage(this.image, this.x, this.y, this.width, this.height);
        }
        update(deltaTime){
            this.x -= this.speed;
            if(this.x < 0 - this.width) {
                this.markedForDeletion = true;
                score++;
            }
        }
        shoot(enemyProjectile, {velocity}, img, bullet){
            enemyProjectile.push(new EnemyProjectile({
                position:{
                    x: this.x + this.width/4,
                    y: this.y + this.height/2
                },
                velocity:{
                    x: velocity.x,
                    y: velocity.y
                },
                image: img,
                bullet: bullet
            }))
        }
    }

    class EnemyProjectile {
        constructor({position, velocity, image, bullet}){
            this.velocity = {
                x: velocity.x,
                y: velocity.y
            }
            this.position = position;
            this.image = image;
            this.width = 50;
            this.height = 50;
            this.frameX = 0;
            this.maxFrame = 150;
            this.frameY = 0;
            this.fps = 20;
            this.frameTimer = 0;
            this.frameInterval = 2000/this.fps;
            this.bullet = bullet;
        }

        draw(context){
            if(this.bullet){
                context.save();
                context.translate(this.position.x + this.width/2, this.position.y + this.height/2);
                context.rotate(Math.PI/this.bullet);
                context.translate(-this.position.x - this.width/2,-this.position.y - this.height/2);
                context.drawImage(this.image, this.frameX, this.frameY, this.width, this.height, this.position.x, this.position.y, this.width, this.height);
                context.rotate(-Math.PI/this.bullet);
                context.restore();
            }else{
                context.drawImage(this.image, this.frameX, this.frameY, this.width, this.height, this.position.x, this.position.y, this.width, this.height);
            }

        }

        update(context, deltaTime){
            this.draw(ctx)
            this.position.x += this.velocity.x
            this.position.y += this.velocity.y
            if(this.frameTimer > this.frameInterval){
                if(this.frameX >= this.maxFrame) this.frameX = 0;
                else this.frameX = this.frameX + 50;
                this.frameTimer = 0;
            } else {
                this.frameTimer += deltaTime;
            }
        }
    }

    
    const restartBtn = this.document.getElementById('restartGame');
    restartBtn.addEventListener('click', function(){
        gameOver = false;
        score = 0;
        enemies.splice(0, enemies.length);
        enemyProjectiles.splice(0, enemyProjectiles.length);
        explosions.splice(0, explosions.length);
        player.x = 0;
        player.lives = 3;
        count = 0;
        animate(0);
        document.getElementById('gameOver').style.visibility = 'hidden';
    });

    function allowFire (){
        canFire = true;
    }
    
    function handleEnemies (deltaTime){
        if(enemyTimer > enemyInterval + randomEnemyInterval){
            enemies.push(new Enemy(canvas.width, canvas.height, 10, document.getElementById('enemyImage'),8));
            enemyTimer = 0;
            enemyInterval = 6000 - count/2;
        } else{
            enemyTimer += deltaTime;
        }
        if(enemyTimerTwo > enemyIntervalTwo + randomEnemyIntervalTwo && count > 400){
            enemies.push(new Enemy(canvas.width, canvas.height, 200, document.getElementById('enemyImage2'),2));
            enemyTimerTwo = 0;
            enemyIntervalTwo = 6000 - count/2;
        } else{
            enemyTimerTwo += deltaTime;
        }
        if(enemyTimerThree > enemyIntervalThree + randomEnemyIntervalThree && count > 800){
            enemies.push(new Enemy(canvas.width, canvas.height, 600, document.getElementById('enemyImage3'), 4, 3));
            enemyTimerThree = 0;
            enemyIntervalThree = 6000 - count/2;
        } else{
            enemyTimerThree += deltaTime;
        }
        if(enemyTimerFour > enemyIntervalFour + randomEnemyIntervalFour && count > 1200){
            enemies.push(new Enemy(canvas.width, canvas.height, 400, document.getElementById('enemyImage4'), 5, 4));
            enemyTimerFour = 0;
            enemyIntervalFour = 6000 - count/2;
        } else{
            enemyTimerFour += deltaTime;
        }
        if(enemyTimerFive > enemyIntervalFive + randomEnemyIntervalFive && count > 1600){
            enemies.push(new Enemy(canvas.width, canvas.height, 10, document.getElementById('enemyImage5'), 15));
            enemyTimerFive = 0;
            enemyIntervalFive = 6000 - count/2;
        } else{
            enemyTimerFive += deltaTime;
        }
        console.log(enemyInterval, enemyIntervalTwo, enemyIntervalThree, enemyIntervalFour, enemyIntervalFive);

        enemies.forEach((enemy, i) => {
            enemy.draw(ctx);
            enemy.update(deltaTime);

            //enemy hit
            projectiles.forEach((projectile, j) =>{
                if(
                projectile.position.x + projectile.width >= enemy.x + 20
                && projectile.position.y + projectile.height/2 <= enemy.y + enemy.height
                && projectile.position.y + projectile.height/2 >= enemy.y
            ){
                setTimeout(() =>{
                    const enemyFound = enemies.find(enemy2 => enemy2 === enemy);
                    const projectileFound = projectiles.find(projectile2 => projectile2 === projectile);

                    if(enemyFound && projectileFound){
                        enemy.markedForDeletion = true;
                        score++;
                        projectiles.splice(j, 1)
                        explosions.push(new Explosion({
                            position:{
                            x:enemy.x + enemy.width/3,
                            y:enemy.y + enemy.height/5
                            }, 
                            image:document.getElementById('explosions1'),
                            width: 100,
                            height: 100
                        }))
                    }
                    
                }, 0)
                
            }
            })
        })
        
        enemies = enemies.filter(enemy => !enemy.markedForDeletion);
    }

    function handleExplosions (){
        explosions = explosions.filter(explosion => !explosion.markedForDeletion)
    }

    function displayStatusText(context){
        context.fillStyle = 'white';
        context.font = '25px PublicPixel';
        context.fillText('Score:' + score, 20, 80);
        context.fillText('Highscore:' + highScore, 20, 40)
        if(gameOver){
            document.getElementById('gameOver').style.visibility = 'visible';
            if(score > highScore){
                highScore = score;
            }
        }
    }

    const input = new InputHandler();
    const player = new Player(canvas.width, canvas.height);
    const background = new Background(canvas.width, canvas.height);
    const enemy1 = new Enemy(canvas.width, canvas.height);

    let lastTime = 0;
    let enemyTimer = 0;
    let enemyInterval = 6000;
    let randomEnemyInterval = Math.random() * 3000 + 500
    let enemyTimerTwo = 0;
    let enemyIntervalTwo = 6000;
    let randomEnemyIntervalTwo = Math.random() * 3000 + 500
    let enemyTimerThree = 0;
    let enemyIntervalThree = 6000;
    let randomEnemyIntervalThree = Math.random() * 3000 + 500
    let enemyTimerFour = 0;
    let enemyIntervalFour = 6000;
    let randomEnemyIntervalFour = Math.random() * 3000 + 500
    let enemyTimerFive = 0;
    let enemyIntervalFive = 6000;
    let randomEnemyIntervalFive = Math.random() * 3000 + 500

    function animate(timeStamp){
        console.log(count);
        const deltaTime = timeStamp - lastTime;
        lastTime = timeStamp;
        ctx.clearRect(0,0, canvas.width, canvas.height)
        background.draw(ctx);
        background.update();
        player.draw(ctx);
        player.update(input, deltaTime, enemies);
        enemies.forEach((enemy , index)=>{
            if(enemy.type === 3 && count % 100 === 0){
                let img = document.getElementById('bombImage');
                enemy.shoot(enemyProjectiles, {velocity:{x:0, y:5}}, img);
            }
            if(enemy.type === 4 && count % 100 === 0){
                let img = document.getElementById('bombImage2');
                enemy.shoot(enemyProjectiles, {velocity:{x:5, y:7.5}}, img, 4);
            }
            //collision detection
            const dx = (enemy.x + enemy.width/2) - (player.x + player.width/2);
            const dy = (enemy.y + enemy.height/2) - (player.y + player.height/2);
            const distance = Math.sqrt(dx*dx + dy*dy);
            if(distance < enemy.width/2 + player.width/2){
                player.lives--;
                enemies.splice(index, 1);
                explosions.push(new Explosion({
                    position:{
                    x:enemy.x + enemy.width/3,
                    y:enemy.y + enemy.height/5
                    }, 
                    image:document.getElementById('explosions2')
                }))
                explosions.forEach(explosion => {
                    explosion.draw(ctx);
                })
                this.opacity = 0.3;
                for(let i = 0; i < 7; i++){
                    if(i % 2 === 0){
                        setTimeout(() =>{
                            player.opacity = 1
                        }, i*150)
                    } else{
                        setTimeout(() =>{
                            player.opacity = 0.3;
                        }, i*150)
                    }
                }
                setTimeout(() =>{
                    if(player.lives <= 0) gameOver = true;
                },10)
            }
        })
        explosions.forEach(explosion =>{
            explosion.update(ctx, deltaTime);
            explosion.draw(ctx);
        })
        enemyProjectiles.forEach((enemyProjectile, index) =>{
            if(enemyProjectile.position.y + enemyProjectile.height >= canvas.height){
                explosions.push(new Explosion({
                    position:{
                    x:enemyProjectile.position.x,
                    y:enemyProjectile.position.y
                    }, 
                    image:document.getElementById('explosions3'),
                    width: 50,
                    height: 50
                }))
                setTimeout(() =>{
                    enemyProjectiles.splice(index, 1);
                },0)
            } else{
                enemyProjectile.update(ctx, deltaTime);
            }
            //projectile hit detection
            const dx = (enemyProjectile.position.x + enemyProjectile.width/2) - (player.x + player.width/2);
            const dy = (enemyProjectile.position.y + enemyProjectile.height/2) - (player.y + player.height/2);
            const distance = Math.sqrt(dx*dx + dy*dy);
            if(distance < enemyProjectile.width/2 + player.width/2){
                explosions.push(new Explosion({
                    position:{
                    x:enemyProjectile.position.x,
                    y:enemyProjectile.position.y
                    }, 
                    image:document.getElementById('explosions3'),
                    width: 50,
                    height: 50
                }))
                setTimeout(() =>{
                    enemyProjectiles.splice(index, 1);
                },0)
                player.lives--;
                player.opacity = 0.5;
                    for(let i = 0; i < 7; i++){
                        if(i % 2 === 0){
                            setTimeout(() =>{
                                player.opacity = 1
                            }, i*150)
                        } else{
                            setTimeout(() =>{
                                player.opacity = 0.5;
                            }, i*150)
                        }
                    }
                setTimeout(() =>{
                    if(player.lives <= 0) gameOver = true;
                },10)
            }


        });
        projectiles.forEach((projectile =>{

            if(projectile.position.x + projectile.width >= canvas.width){
                projectiles.splice(0 , 1);
            } projectile.update(ctx);
           
        }))
        handleEnemies(deltaTime);
        handleExplosions();
        displayStatusText(ctx);
        if(!gameOver) requestAnimationFrame(animate);
        count++;
    }
    animate(0);

});
