class controlScreen extends Phaser.Scene{
    constructor(){
        super("controlScreenScene");
        this.my = {sprite: {},
            //projectiles: [],
            bulletCharge: [],
            enemies: {},
            text: {}
        };

        this.my.sprite.projectiles = [];

        this.playerTimer = 0;
        this.direction = 1;
        this.shootCooldown = 150;
        this.shootCooldown2 = 150;
    }

    preload(){
        this.load.setPath("./assets/");
        //player
        this.load.image("Player","player_24.png");
        //projectile
        this.load.image("Ball","environment_12.png");
        //text
        this.load.bitmapFont("rocketSquare", "KennyRocketSquare_0.png", "KennyRocketSquare.fnt");
    }

    create(){
        let my = this.my;


        //text display
        my.text.howtoplay = this.add.bitmapText(game.config.width / 2, game.config.height / 16, "rocketSquare", "HOW TO PLAY");
        my.text.howtoplay.x = game.config.width / 2 - my.text.howtoplay.displayWidth / 2;

        //my.text.scoreDisplay = this.add.bitmapText(my.text.howtoplay.x, game.config.height / 3, "rocketSquare", "High Score: " + highScore);

        my.text.move = this.add.bitmapText(my.text.howtoplay.x, game.config.height * 1 / 4, "rocketSquare", "A and D: move left to right!");
        my.text.move.x = game.config.width / 2 - my.text.move.displayWidth / 2;
        my.text.shoot = this.add.bitmapText(my.text.howtoplay.x, game.config.height * 3 / 4, "rocketSquare", "Shift: shoot as\nfast as possible!");
        my.text.shoot.x = game.config.width / 4 - my.text.shoot.displayWidth / 2;
        my.text.charge = this.add.bitmapText(my.text.howtoplay.x, game.config.height * 3 / 4, "rocketSquare", "Space: charge\nyour attack!\n(max 3)");
        my.text.charge.x = game.config.width * 3 / 4 - my.text.charge.displayWidth / 2;
        //console.log(my.text.move.y + "," + my.text.shoot.y);

        my.text.endDisplay = this.add.bitmapText(game.config.width / 2, my.text.charge.y + 20, "rocketSquare", "(Press space to start!)");
        my.text.endDisplay.x = game.config.width / 2 - my.text.endDisplay.displayWidth / 2;
        my.text.endDisplay.y = my.text.charge.y + my.text.charge.displayHeight + my.text.endDisplay.displayHeight / 2;

        my.sprite.player1 = this.add.sprite(game.config.width / 2,my.text.move.y - 40,"Player").setScale(0.75);
        my.sprite.player2 = this.add.sprite(game.config.width / 4,my.text.shoot.y - 40,"Player").setScale(0.75);
        my.sprite.player3 = this.add.sprite(game.config.width * 3 / 4,my.text.charge.y - 40,"Player").setScale(0.75);

        let spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        spaceKey.on('down', (key,event) => {
            this.scene.start("oneDimScene");
        })
    }

    update(time,delta){
        let my = this.my;
        //this.playerTimer += delta;
        if(my.sprite.player1.x > game.config.width / 2 + 200 || my.sprite.player1.x < game.config.width / 2 - 200){
            this.direction *= -1
        }
        my.sprite.player1.x += this.direction * delta / 2.5;
        //my.sprite.player.y += delta / 10;
        //my.sprite.player.rotation += delta / 125;
        //console.log(my.sprite.player.x + "," + my.sprite.player.y);



        this.shootCooldown -= delta;
        if(this.shootCooldown <= 0){
            let object = this.add.sprite(my.sprite.player2.x,my.sprite.player2.y,"Ball")
            object.setScale(.3);
            my.sprite.projectiles.push(object);

            //let object = this.add.sprite(my.sprite.player.x,this.permanentY,"Ball");
            //my.sprite.projectiles.push(object);
            this.shootCooldown = 150; // = 0.15 sec
        }
        

        this.shootCooldown2 -= delta;
        if(this.shootCooldown2 <= 0 && my.bulletCharge.length < 3){
            let object = null;
            switch(my.bulletCharge.length) {
                case 0:
                    object = this.add.sprite(my.sprite.player3.x,my.sprite.player3.y,"Ball");
                    object.setScale(.3);
                    my.bulletCharge.push(object);
                    this.shootCooldown2 = 175;
                    //console.log("timer set to " + this.shootCooldown2);
                    break;
                case 1:
                    my.bulletCharge[0].x -= my.bulletCharge[0].displayWidth/2;
                    object = this.add.sprite(my.sprite.player3.x + my.bulletCharge[0].displayWidth/2,my.sprite.player3.y,"Ball");
                    object.setScale(.3);
                    my.bulletCharge.push(object);
                    this.shootCooldown2 = 200;
                    break;
                case 2:
                    object = this.add.sprite(my.sprite.player3.x,my.sprite.player3.y - my.bulletCharge[0].displayHeight/2,"Ball");
                    object.setScale(.3);
                    my.bulletCharge.push(object);
                default: //No more bullets can be added
                    this.shootCooldown2 = 150
                    break;
            }

        }
        else if(this.shootCooldown2 <= 0){
            while(my.bulletCharge.length > 0){
                //console.log("bluh B");
                my.sprite.projectiles.push(my.bulletCharge.pop());
                //console.log("bluh C");
            }
            //console.log("bluh D");
            my.bulletCharge = [];
            this.shootCooldown = 150;
        }


        for(let i = 0; i < my.sprite.projectiles.length; i++){
            my.sprite.projectiles[i].y -= delta;
            my.sprite.projectiles = my.sprite.projectiles.filter(inBoundsControl);
        }
    }
}

function inBoundsControl(thing){
    //console.log("bluh" + thing.y);
    //console.log(thing.y >= -100);
    if(!(thing.y >= 200)){
        thing.visible = false;
        thing.active = false;
        return false;
    }
    else{
        return true;
    }
}