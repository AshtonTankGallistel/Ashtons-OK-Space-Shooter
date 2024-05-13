var highScore = 0;

class oneDim extends Phaser.Scene{
    constructor(){
        super("oneDimScene");
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
        //console.log("constructed");
    }

    preload(){
        this.load.setPath("./assets/");
        //player
        this.load.image("Player","player_24.png");
        //projectile
        this.load.image("Ball","environment_12.png");
        this.load.image("Beam Charge","laserBlue3.png");
        this.load.image("Beam Blast","laserBlue1.png");
        //enemy
        this.load.image("shipBase","spaceShips_008.png");
        this.load.image("ship","shipYellow_manned.png");
        //text
        this.load.bitmapFont("rocketSquare", "KennyRocketSquare_0.png", "KennyRocketSquare.fnt");
        //console.log("preloaded");
    }

    create(){
        if(this.resetNeeded == true){
            sceneClear(this);
        }
        //console.log("created");
        //console.log("bluh");
        let my = this.my;

        my.sprite.player = this.add.sprite(this.startX,this.permanentY,"Player");
        //my.sprite.projectiles.projectile = this.add.sprite(-50,this.permanentY,"Ball");//spawns offscreen
        //my.sprite.projectiles = [];

        this.Akey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.Dkey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.Spacekey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.Shiftkey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);

        //text display
        my.text.health = this.add.bitmapText(10, 0, "rocketSquare", "Health: " + this.health);
        my.text.score = this.add.bitmapText(10, 50, "rocketSquare", "Score: " + this.score);
        my.text.wave = this.add.bitmapText(game.config.width / 3, game.config.height / 3, "rocketSquare", "<WAVE CLEAR>");
        my.text.wave.visible = false;

        my.text.health.depth = 1;
        my.text.score.depth = 1;
    }

    update(time, delta){
        let my = this.my;

        //ENEMY CONTROL SYSTEM/// -----------------------------------------------------<

        //console.log(my.enemies.generic.length);
        this.waveCooldown -= delta;
        if(my.enemies.generic.length == 0 && my.enemies.beamitter.length == 0 && this.waveCooldown <= 0){
            if(this.health < 3){
                this.health += 1;
                my.text.health.setText("Health: " + this.health);
            }
            //console.log("New wave spawning!");
            my.text.wave.visible = false;
            waveSpawn(this);
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
                    e.startAttack();
                }
                //else
                    //console.log("too high:" + e.sprite.y);
            }
        }
        this.beamitterStats.atkCooldown -= delta;
        if(this.beamitterStats.atkCooldown <= 0 && this.beamitterStats.firing == false && my.enemies.beamitter.length > 0){
            //console.log("Beginning beamitter attack");
            let x = Math.round((my.enemies.beamitter.length - 1)* Math.random());
            //console.log("rounding to " + x);
            if(my.enemies.beamitter[x].sprite.y == my.enemies.beamitter[x].centerY){
                my.enemies.beamitter[x].state = "charging";
                this.beamitterStats.firing = true;
                this.beamitterStats.laserTime = 2000;
            }
            else{
                this.beamitterStats.atkCooldown = 500;
            }
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
                    my.text.score.setText("Score: " + this.score);

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
                        my.text.wave.visible = true;
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
                        my.text.score.setText("Score: " + this.score);
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
                        my.text.wave.visible = true;
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
                    my.text.health.setText("Health: " + this.health);
                    //console.log("hit!" + this.health);
                    if(this.health <= 0){
                        //game over
                        if(this.score > highScore){
                            highScore = this.score;
                        }
                        this.resetNeeded = true;
                        this.scene.start("gameOverScreenScene");
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
                        my.text.health.setText("Health: " + this.health);
                        //console.log("hit!" + this.health);
                        if(this.health <= 0){
                            //game over
                            if(this.score > highScore){
                                highScore = this.score;
                            }
                            this.resetNeeded = true;
                            this.scene.start("gameOverScreenScene");
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

        let playerSpeed = 0.5 * delta;
        if(this.Akey.isDown && my.sprite.player.x > 0){
            my.sprite.player.x -= playerSpeed;
            for(let i = 0; i < my.bulletCharge.length; i++){
                my.bulletCharge[i].x -= playerSpeed;
            }
        }
        if(this.Dkey.isDown && my.sprite.player.x < game.config.width){
            my.sprite.player.x += playerSpeed;
            for(let i = 0; i < my.bulletCharge.length; i++){
                my.bulletCharge[i].x += playerSpeed;
            }
        }
        if(Phaser.Input.Keyboard.JustUp(this.Spacekey)){
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
        if(this.Spacekey.isDown){ //(Phaser.Input.Keyboard.JustDown(this.Spacekey)){ //(this.Spacekey.isDown){
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
        else if(this.Shiftkey.isDown){
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

//Helper functions
function inBounds(thing){
    //console.log("bluh" + thing.y);
    //console.log(thing.y >= -100);
    if(!(thing.y >= -100)){
        thing.visible = false;
        thing.active = false;
        return false;
    }
    else{
        return true;
    }
}

function waveSpawn(scene){
    let my = scene.my;

    let power = scene.waveStrength + Math.floor(200 * Math.random());
    console.log("power" + power);
    let bigEnemyCount = 0;
    if(power > 1200){
        bigEnemyCount += 1;
    }
    if(power > 1600){
        bigEnemyCount += 1;
    }
    console.log("BEC:" + bigEnemyCount);
    let BeamitterCount = 0;
    for(let i = 0;i < bigEnemyCount; i++){
        //add special enems at random
        //console.log("Beam:" + BeamitterCount);
        if(BeamitterCount == 0){
            //console.log("A");
            guy = new enemy(scene,"Beamitter", 3, 50, (150 * Math.random()) + 50, "ship");
            BeamitterCount = 1;
        }
        else{
            //console.log("B");
            guy = new enemy(scene,"Beamitter", 3, game.config.width-50, (150 * Math.random()) + 50, "ship");
        }
        guy.sprite.y -= 200;
        //guy.sprite.y -= 200;
        //console.log(guy);
        my.enemies.beamitter.push(guy);
    }
    let smallEnemyCount = Math.floor(power / 100);
    //console.log(smallEnemyCount);
    for(let i = 0;i < smallEnemyCount; i++){
        console.log("Adding enemy");
        /*
        let guy = {
            startX: (scene.gameWidth-100) * Math.random() +50,
            startY: (150 * Math.random()) + 50,
            //appearance: scene.add.sprite(startX,startY,"Ball"),
            hp: 1
            //Add function for movement maybe
        }
        guy.appearance = scene.add.sprite(guy.startX,guy.startY,"Ball");
        */
        //console.log(game.config.width);
        guy = new enemy(scene,"Genera", 1, ((game.config.width-100) * Math.random()) + 50, (150 * Math.random()) + 50, "shipBase");
        guy.sprite.y -= 200;
        guy.sprite.setScale(0.8);
        //console.log(guy);
        my.enemies.generic.push(guy);
    }
}

//this is my init function btw
//didn't know that was what this kind of function was called at the time
function sceneClear(scene){
    for(let i = 0; i < scene.my.enemies.generic.length; i++){
        scene.my.enemies.generic[i].destroySprite();
        delete scene.my.enemies.generic[i];
        //console.log("before:" + my.enemies.generic);
        scene.my.enemies.generic.splice(i,1);
    }
    //console.log(scene.my.enemies.beamitter);
    for(let i = 0; i < scene.my.enemies.beamitter.length; i++){
        scene.my.enemies.beamitter[i].destroySprite();
        delete scene.my.enemies.beamitter[i];
        //console.log("before:" + my.enemies.beamitter);
        scene.my.enemies.beamitter.splice(i,1);
    }

    scene.my.sprite.projectiles = [];

    scene.my.enemies.generic = [];
    scene.my.enemies.bigger = [];
    scene.my.enemies.charger = [];
    scene.my.enemies.beamitter = [];

    scene.startX = 400;
    scene.permanentY = 450;
    scene.health = 3;
    scene.invulnerability = 0;
    scene.shootCooldown = 0; //in milliseconds, 1000 = 1 sec
    scene.waveStrength = 900;
    scene.waveCooldown = 0;
    scene.score = 0;

    scene.resetNeeded = false;

    //Enemy movement paths
    scene.genericPoints = [
        350, 100,
        400, 100,
        450, 100
    ];
    scene.biggerPoints = [
        350, 50,
        400, 50,
        450, 50
    ];

    scene.genericStats = {
        curTime: 0,
        atkCooldown: 0
        //movement: (milliseconds) =>{}
    }

    scene.beamitterStats = {
        firing: false,
        atkCooldown: 2000,
        laserTime: 2000
    }
}

class enemy{
    constructor(scene,type, hp, centerX, centerY, spriteName){
        this.type = type;
        this.hp = hp;
        this.centerX = centerX;
        this.centerY = centerY;
        this.points;
        this.curve;
        this.sprite = scene.add.follower(this.curve,centerX,centerY,spriteName);
        this.moveSpeedRandomizer = (0.4 * Math.random()) + 0.8; //random from 0.8 to 1.2
        this.directionRandomizer = 2*(Math.floor(2* Math.random())) - 1; //random 1 or -1
        this.mathOffset = Math.random(); //random 0 to 1 
        this.state = "move";
        if(this.type == "Beamitter"){
            this.BeamitterAddition(scene);
        }
    }
    BeamitterAddition(scene){
        this.location = scene;
        this.chargeTime = 0;
        if(this.centerX < game.config.width / 2){
            this.direction = 1; //pointed left
            this.beamBall = scene.add.sprite(this.centerX + 20,this.centerY + 20,"Beam Charge");
            this.beamBall.angle = -15;
            //this.beamBall.visible = false;
            //this.beamLine = scene.add.sprite(this.centerX + 35,this.centerY + 65,"Beam Blast");
            //this.beamLine.angle = -15;
            //this.beamLine.visible = false;
        }
        else{
            this.direction = -1; //pointed right
            this.beamBall = scene.add.sprite(this.centerX - 20,this.centerY + 20,"Beam Charge");
            this.beamBall.angle = 15;
            //this.beamBall.visible = false;
            //this.beamLine = scene.add.sprite(this.centerX - 35,this.centerY + 65,"Beam Blast");
            //this.beamLine.angle = 15;
            //this.beamLine.visible = false;
        }
        this.beamContainer = [];
        this.beamBall.visible = false;
        this.beamBall.setScale(0);
        //this.beamLine.visible = false;
    }
    move(timeTotal, delta){
        switch(this.type){
            case "Genera":
                this.sprite.x = this.centerX + (this.directionRandomizer * this.moveSpeedRandomizer *
                    100 * Math.sin((timeTotal - this.mathOffset) / 300));
                //console.log("moving sprite at" + this.sprite.y);
                if(this.sprite.y < this.centerY){
                    //console.log("Adjusting a height at" + this.sprite.y);
                    this.sprite.y += delta * 0.5;
                    if(this.sprite.y > this.centerY){
                        this.sprite.y = this.centerY;
                    }
                }
                
                break;
            case "Beamitter":
                if(this.sprite.y < this.centerY){
                    //console.log("Adjusting a height at" + this.sprite.y);
                    this.sprite.y += delta * 0.5;
                    if(this.sprite.y > this.centerY){
                        this.sprite.y = this.centerY;
                    }
                }
                if(this.beamContainer.length > 0){
                    this.fireLaser(delta);
                }
                break;
            default:
                break;
        }
    }
    startAttack(){
        let goalX = Math.random() * game.config.width;
        this.points = [
            this.sprite.x, this.sprite.y,
            goalX, this.sprite.y + 75,
            goalX, game.config.height + 100
        ]
        //console.log("points:" + this.points);
        this.curve = new Phaser.Curves.Spline(this.points);
        this.sprite.setPath(this.curve);
        //console.log("istg if this is undefined:" + this.curve);
        //console.log("entered phaser curve spline thingamabob, beginning startfollow");
        ///*
        //console.log(this.sprite);
        this.sprite.startFollow({
            from: 0,
            to: 1,
            delay: 0,
            duration: 2000,
            ease: 'Sine.easeInOut',
            repeat: -1,
            //yoyo: true,
            rotateToPath: true,
            rotationOffset: -90
        })
        //*/
        //console.log("Began startFollow");
    }
    endAttack(){
        //console.log("running endAttack()");
        this.sprite.stopFollow();
        this.state = "returning";
        //console.log("set state to returning");
        this.sprite.x = this.centerX;
        this.sprite.y = -50;
    }
    returner(){
        this.state = "move";
        //console.log("return of the return");
        this.sprite.x = this.centerX;
        this.sprite.y = -50;

    }
    chargeLaser(delta){
        this.beamBall.setScale(this.beamBall.scaleX + delta / 1000); //hits max at 1 sec
        this.beamBall.visible = true;
        if(this.beamBall.scaleX >= 1){
            this.beamBall.setScale(1);
            this.state = "firing";
            //console.log("beamContainer length of " + this.beamContainer.length);
            let beamLine = this.location.add.sprite(this.centerX + (this.direction * 35),this.centerY + 65,"Beam Blast");
            //console.log("bluh ");
            beamLine.angle = -15 * this.direction;
            this.beamContainer.push(beamLine);
            //console.log("beamContainer length of " + this.beamContainer.length);
        }

    }
    fireLaser(delta){
        //console.log("beamContainer length of " + this.beamContainer.length);
        while(this.beamContainer[this.beamContainer.length - 1].y - this.beamBall.y > 45 && this.state == "firing"){
            let beamLine = this.location.add.sprite(this.beamContainer[this.beamContainer.length - 1].x - this.direction * 50 * Math.tan(15 * Math.PI / 180),
                this.beamContainer[this.beamContainer.length - 1].y - 50,"Beam Blast");
            beamLine.angle = -15 * this.direction;
            this.beamContainer.push(beamLine);
        }
        for(let i of this.beamContainer){
            //console.log("incr i.x by " + this.direction + "," + delta + "," + this.direction * delta);
            i.x += this.direction * delta * Math.tan(15 * Math.PI / 180);
            i.y += delta;
        }
        if(this.beamContainer[0].y > game.config.height + 100){
            //this.beamContainer[0].destroySprite(); //not how that works lol
            this.beamContainer[0].visible = false;
            this.beamContainer[0].active = false;
            delete this.beamContainer[0];
            this.beamContainer.splice(0,1);
        }
    }
    stopLaser(){
        this.beamBall.visible = false;
        this.beamBall.setScale(0);
        this.state = "move";
    }
    destroySprite(){ //Prob not the proper way to do this, but I can't find a better way to delete the sprite
        //console.log("destroyed " + this.type);
        if(this.type == "Beamitter"){
            this.beamBall.visible = false;
            this.beamBall.active = false;
            delete this.beamBall;
            for(let i = this.beamContainer.length - 1; i >= 0; i--){
                //console.log(i + "," + this.beamContainer[i]);
                this.beamContainer[i].visible = false;
                this.beamContainer[i].active = false;
                delete this.beamContainer[i];
            }
            this.beamContainer = [];
        }
        this.sprite.visible = false;
        this.sprite.active = false;
        delete this.sprite;
    }
}