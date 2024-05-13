class titleScreen extends Phaser.Scene{
    constructor(){
        super("titleScreenScene");
        this.my = {sprite: {},
            //projectiles: [],
            bulletCharge: [],
            enemies: {},
            text: {}
        };

        this.my.sprite.projectiles = [];

        this.my.enemies.generic = [];
        this.my.enemies.bigger = [];
        this.my.enemies.charger = [];
        this.my.enemies.beamitter = [];

        this.startX = 400;
        this.permanentY = 450;
        this.health = 3;
        this.invulnerability = 0;
        this.shootCooldown = 0; //in milliseconds, 1000 = 1 sec
        this.waveStrength = 900;
        this.waveCooldown = 0;
        this.score = 0;

        this.resetNeeded = false;

        //Enemy movement paths
        this.genericPoints = [
            350, 100,
            400, 100,
            450, 100
        ];
        this.biggerPoints = [
            350, 50,
            400, 50,
            450, 50
        ];

        this.genericStats = {
            curTime: 0,
            atkCooldown: 0
            //movement: (milliseconds) =>{}
        }

        this.beamitterStats = {
            firing: false,
            atkCooldown: 2000,
            laserTime: 2000
        }

        
        this.direction = 1;
    }

    preload(){
        this.load.setPath("./assets/");
        //player
        this.load.image("Player","player_24.png");
        //projectile
        this.load.image("Ball","environment_12.png");
        //enemy
        this.load.image("shipBase","spaceShips_008.png");
        //text
        this.load.bitmapFont("rocketSquare", "KennyRocketSquare_0.png", "KennyRocketSquare.fnt");
    }

    create(){
        let my = this.my;

        my.sprite.player = this.add.sprite(game.config.width / 2,this.permanentY,"Player");

        //text display
        my.text.title = this.add.bitmapText(game.config.width / 4, game.config.height / 8, "rocketSquare", "TANK'S OK SPACE SHOOTER");
        my.text.title.x = game.config.width / 2 - my.text.title.displayWidth / 2;

        //my.text.scoreDisplay = this.add.bitmapText(my.text.title.x, game.config.height / 3, "rocketSquare", "High Score: " + highScore);

        //my.text.creditsKen = this.add.bitmapText(my.text.title.x, game.config.height * 1 / 2, "rocketSquare", "Sprites and images from\nKenney's asset packs");
        //my.text.creditsAsh = this.add.bitmapText(my.text.title.x, game.config.height * 1 / 2, "rocketSquare", "Designed and coded by\nAshton Gallistel");
        //my.text.creditsAsh.y = my.text.creditsKen.y + my.text.creditsAsh.displayHeight * 4 / 3;
        my.text.instructions = this.add.bitmapText(my.text.title.x, 0, "rocketSquare", "Press space to start!");
        my.text.instructions.x = game.config.width / 2 - my.text.instructions.displayWidth / 2;
        my.text.instructions.y = my.text.title.y + my.text.title.displayHeight * 2;
        //console.log(my.text.creditsKen.y + "," + my.text.creditsAsh.y);

        my.text.title.depth = 1;
        my.text.instructions.depth = 1;

        let spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        spaceKey.on('down', (key,event) => {
            this.scene.start("controlScreenScene");
        })
    }

    //I copied and pasted this from scene.js. It's modified so as to not have any text displays,
    //and for the player to never die. Also, assuming I don't forget to, Beamitters should never spawn,
    //points are never affected or displayed, and player movement will loop between going left and right for a period of time.
    //The player will also never perform a charge shot, instead just constantly shooting.
    update(time, delta){
        let my = this.my;

        //ENEMY CONTROL SYSTEM/// -----------------------------------------------------<

        //console.log(my.enemies.generic.length);
        this.waveCooldown -= delta;
        if(my.enemies.generic.length == 0 && my.enemies.beamitter.length == 0 && this.waveCooldown <= 0){
            if(this.health < 3){
                this.health += 1;
                //my.text.health.setText("Health: " + this.health);
            }
            console.log("New wave spawning!");
            //my.text.wave.visible = false;
            waveSpawnDemo(this);
        }

        this.genericStats.curTime += delta;
        this.genericStats.atkCooldown += delta;
        if(this.genericStats.atkCooldown >= 1000 && my.enemies.generic.length > 0){

            this.genericStats.atkCooldown -= 1000;
            for(let i = 0; i < my.enemies.generic.length / 5; i++){

                let e = my.enemies.generic[Math.floor(Math.random() * my.enemies.generic.length)];
                //console.log("attempting to attack with enemy:" + e);
                //This can fail should the targeted enemy already be attacking or returning to position
                //Consider it a random chance of forgiveness for the player
                if(e.sprite.y == e.centerY && e.state == "move"){
                    e.state = "attack";
                    //Note: the below line somehow causes an error upon the title screen being entered 2+ times. I don't quite understand why?
                    //But the game runs fine so the player won't notice unless they look in the debug log
                    //and there doesn't seem to be any requirement to NOT have error messages so....
                    e.startAttack();
                }
                //else
                    //console.log("too high:" + e.sprite.y);
            }
        }
        this.beamitterStats.atkCooldown -= delta;
        if(this.beamitterStats.atkCooldown <= 0 && this.beamitterStats.firing == false && my.enemies.beamitter.length > 0){
            //console.log("Beginning beamitter attack");
            this.beamitterStats.firing = true;
            let x = Math.round((my.enemies.beamitter.length - 1)* Math.random());
            //console.log("rounding to " + x);
            my.enemies.beamitter[x].state = "charging";
            this.beamitterStats.laserTime = 2000;
        }

        for(let e of my.enemies.generic){
            //enemy.sprite.x = enemy.centerX + Math.sin(this.genericStats.curTime);
            //console.log(e.state);
            if(e.state == "move"){
                e.move(this.genericStats.curTime, delta);
            }
            else if(e.state == "attack" && e.sprite.y > game.config.height + 50){
                //console.log("attempting return from " + e.sprite.y);
                e.endAttack();
                //console.log("enemy sent to height:" + e.sprite.y);
            }
            else if(e.state == "returning"){
                e.returner();
            }
        }
        for(let e of my.enemies.beamitter){
            //console.log(e.state);
            if(e.state == "move"){
                e.move(time, delta);
            }
            else if(e.state == "charging"){
                e.chargeLaser(delta);
            }
            else if(e.state == "firing"){
                e.fireLaser(delta);
                this.beamitterStats.laserTime -= delta;
                if(this.beamitterStats.laserTime <= 0){
                    e.stopLaser();
                    this.beamitterStats.atkCooldown = 2000;
                    this.beamitterStats.firing = false;
                }
            }
        }

        //COLLISION DETECTION/// ------------------------------------------------------<

        //bullets
        for(let i = 0; i < my.sprite.projectiles.length; i++){ //(let shot of my.sprite.projectiles){
            for(let j = 0; j < my.enemies.generic.length; j++){//(let e of my.enemies.generic){
                //console.log(my.sprite.projectiles[i]);
                //console.log(i + "vs" + j);
                if(this.collides(my.sprite.projectiles[i],my.enemies.generic[j].sprite)){
                    this.score += 100;
                    //my.text.score.setText("Score: " + this.score);

                    //console.log("hit!");
                    my.enemies.generic[j].destroySprite();
                    delete my.enemies.generic[j];
                    //console.log("before:" + my.enemies.generic);
                    my.enemies.generic.splice(j,1);
                    //console.log("after:" + my.enemies.generic);
                    j--;
                    my.sprite.projectiles[i].y = -999;
                    //i--;
                    if(my.enemies.generic.length == 0 && my.enemies.beamitter.length == 0){
                        this.waveStrength += 200;
                        this.waveCooldown = 1500;
                        //my.text.wave.visible = true;
                    }
                }
            }
            for(let j = 0; j < my.enemies.beamitter.length; j++){//(let e of my.enemies.beamitter){
                //console.log(my.sprite.projectiles[i]);
                //console.log(i + "vs" + j);
                if(this.collides(my.sprite.projectiles[i],my.enemies.beamitter[j].sprite)){
                    //console.log("hit!");
                    my.enemies.beamitter[j].hp -= 1;
                    //console.log("dealt damage");
                    if(my.enemies.beamitter[j].hp <= 0){
                        //console.log("attempting deletion");
                        //reset beam to not firing if the enemy was the one charging/firing an attack
                        if(my.enemies.beamitter[j].state == "charging" || my.enemies.beamitter[j].state == "firing"){
                            this.beamitterStats.atkCooldown = 2000;
                            this.beamitterStats.firing = false;
                        }
                        this.score += 200;
                        //my.text.score.setText("Score: " + this.score);
                        my.enemies.beamitter[j].destroySprite();
                        delete my.enemies.beamitter[j];
                        //console.log("before:" + my.enemies.beamitter);
                        my.enemies.beamitter.splice(j,1);
                        //console.log("after:" + my.enemies.beamitter);
                        j--;
                    }
                    my.sprite.projectiles[i].y = -999;
                    //i--;
                    if(my.enemies.generic.length == 0 && my.enemies.beamitter.length == 0){
                        this.waveStrength += 200;
                        this.waveCooldown = 1500;
                        //my.text.wave.visible = true;
                    }
                }
            }
        }

        this.invulnerability -= delta;
        //player v enemies
        if(this.invulnerability <= 0){
            for(let i = 0; i < my.enemies.generic.length; i++){
                if(this.collides(my.sprite.player,my.enemies.generic[i].sprite)){
                    this.health -= 1;
                    //my.text.health.setText("Health: " + this.health);
                    //console.log("hit!" + this.health);
                    if(this.health <= 0){
                        //game over
                        if(this.score > highScore){
                            highScore = this.score;
                        }
                        this.resetNeeded = true;
                        //this.scene.start("gameOverScreenScene");
                    }
                    this.invulnerability = 750;
                    break;
                }
            }
            //console.log();
            for(let e of my.enemies.beamitter){
                for(let i = 0; i < e.beamContainer.length; i++){
                    if(this.collides(my.sprite.player,e.beamContainer[i])){
                        this.health -= 1;
                        //my.text.health.setText("Health: " + this.health);
                        //console.log("hit!" + this.health);
                        if(this.health <= 0){
                            //game over
                            if(this.score > highScore){
                                highScore = this.score;
                            }
                            this.resetNeeded = true;
                            //this.scene.start("gameOverScreenScene");
                        }
                        else{
                            this.invulnerability = 750;
                            break;
                        }
                    }
                }
            }
        }

        //PLAYER CONTROL SYSTEM/// ----------------------------------------------------<
        this.shootCooldown -= delta;

        //console.log(delta);


        if(my.sprite.player.x > game.config.width / 2 + 300 || my.sprite.player.x < game.config.width / 2 - 300){
            this.direction *= -1
            if(my.sprite.player.x > game.config.width / 2 + 300)
                my.sprite.player.x = game.config.width / 2 + 300;
            else
                my.sprite.player.x = game.config.width / 2 - 300;
        }
        let playerSpeed = 0.5 * delta;
        if(this.direction == 1 && my.sprite.player.x > 0){
            my.sprite.player.x -= playerSpeed;
            for(let i = 0; i < my.bulletCharge.length; i++){
                my.bulletCharge[i].x -= playerSpeed;
            }
        }
        if(this.direction == -1 && my.sprite.player.x < game.config.width){
            my.sprite.player.x += playerSpeed;
            for(let i = 0; i < my.bulletCharge.length; i++){
                my.bulletCharge[i].x += playerSpeed;
            }
        }
        if(false){//Phaser.Input.Keyboard.JustUp(this.Spacekey)){
            //console.log("bluh A");
            while(my.bulletCharge.length > 0){
                //console.log("bluh B");
                my.sprite.projectiles.push(my.bulletCharge.pop());
                //console.log("bluh C");
            }
            //console.log("bluh D");
            my.bulletCharge = [];
            this.shootCooldown = 150;
        }
        if(false){//this.Spacekey.isDown){ //(Phaser.Input.Keyboard.JustDown(this.Spacekey)){ //(this.Spacekey.isDown){
            //console.log(this.shootCooldown <= 0);
            if(this.shootCooldown <= 0 && my.bulletCharge.length < 3){
                //console.log("bluh timer done" + my.bulletCharge.length);
                //my.sprite.projectiles.push(this.add.sprite(my.sprite.player.x,this.permanentY,"Ball"));
                //let object = this.add.sprite(my.sprite.player.x,this.permanentY,"Ball");
                //console.log("bluh" + object.y);
                //my.bulletCharge.push(object);
                //console.log("bluh" + my.bulletCharge[0].y);

                //my.bulletCharge[0].x = my.bulletCharge - (my.bulletCharge[0].displayWidth);
                let object = null;
                switch(my.bulletCharge.length) {
                    case 0:
                        object = this.add.sprite(my.sprite.player.x,this.permanentY,"Ball");
                        object.setScale(.5);
                        my.bulletCharge.push(object);
                        this.shootCooldown = 175;
                        //console.log("timer set to " + this.shootCooldown);
                        break;
                    case 1:
                        my.bulletCharge[0].x -= my.bulletCharge[0].displayWidth/2;
                        object = this.add.sprite(my.sprite.player.x + my.bulletCharge[0].displayWidth/2,this.permanentY,"Ball");
                        object.setScale(.5);
                        my.bulletCharge.push(object);
                        this.shootCooldown = 200;
                        break;
                    case 2:
                        object = this.add.sprite(my.sprite.player.x,this.permanentY - my.bulletCharge[0].displayHeight/2,"Ball");
                        object.setScale(.5);
                        my.bulletCharge.push(object);
                    default: //No more bullets can be added
                        this.shootCooldown = 150
                        break;
                }

            }
        }
        else if(this.shootCooldown <= 0){
            if(this.shootCooldown <= 0){
                let object = this.add.sprite(my.sprite.player.x,this.permanentY,"Ball")
                object.setScale(.5);
                my.sprite.projectiles.push(object);

                //let object = this.add.sprite(my.sprite.player.x,this.permanentY,"Ball");
                //my.sprite.projectiles.push(object);
                this.shootCooldown = 150; // = 0.15 sec
            }
        }
        let projSpeed = 1 * delta;
        for(let i = 0; i < my.sprite.projectiles.length; i++){
            //console.log("bluh" + my.sprite.projectiles[i].y);
            my.sprite.projectiles[i].y -= projSpeed;
            
            //Fun Fact: the sprites still exist after this!
            //And from what I can tell, none of the teacher's examples managed to resolve this issue, they're also visible.
            //Therefore, it's completely fine for me to leave this bug in my game!!1!
            //Genuinely though, I'm going to try and fix this bug, or at least ask about it, when I'm closer to being done.
            //I've just spent so long trying to solve it already that I need to go and work on other parts of the game now.
            //console.log("lengthbf:" + my.sprite.projectiles.length);
            my.sprite.projectiles = my.sprite.projectiles.filter(inBounds);
            //console.log("lengthaf:" + my.sprite.projectiles.length);
            /*
            if(my.sprite.projectiles[i].y < 20){
                //let object = my.sprite.projectiles.splice(i,1);
                //delete object;
                console.log("length:" + my.sprite.projectiles.length);
                delete my.sprite.projectiles[i];
                my.sprite.projectiles.splice(i,1);
                i -= 1;
                console.log("length:" + my.sprite.projectiles.length);
                //console.log("length alr ignore that" + my.sprite.projectiles[i]);
            }
            */
        }
    }
    
    //collision code taken from ArrayBoom.js, ty Professor Whitehead!
    collides(a, b) {
        //console.log(a);
        //console.log("bruh: " + b.x);
        //console.log("x:" + Math.abs(a.x - b.x) + ">" + (a.displayWidth/2 + b.displayWidth/2));
        //console.log("y:" + Math.abs(a.y - b.y) + ">" + (a.displayHeight/2 + b.displayHeight/2));
        if (Math.abs(a.x - b.x) > (a.displayWidth/2 + b.displayWidth/2)) return false;
        if (Math.abs(a.y - b.y) > (a.displayHeight/2 + b.displayHeight/2)) return false;
        return true;
    }
}

function waveSpawnDemo(scene){
    let my = scene.my;

    let power = scene.waveStrength + Math.floor(200 * Math.random());
    //console.log(power);
    let smallEnemyCount = Math.floor(power / 100);
    //console.log(smallEnemyCount);
    for(let i = 0;i < smallEnemyCount; i++){
        console.log("Adding enemy");
        guy = new enemy(scene,"Genera", 1, ((game.config.width-100) * Math.random()) + 50, (150 * Math.random()) + 50, "shipBase");
        guy.sprite.y -= 200;
        guy.sprite.setScale(0.8);
        //console.log(guy);
        my.enemies.generic.push(guy);
    }
}