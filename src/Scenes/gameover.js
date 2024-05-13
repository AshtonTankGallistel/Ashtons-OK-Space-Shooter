class gameOverScreen extends Phaser.Scene{
    constructor(){
        super("gameOverScreenScene");
        this.my = {sprite: {},
            //projectiles: [],
            bulletCharge: [],
            enemies: {},
            text: {}
        };

        this.playerTimer = 0;
    }

    preload(){
        this.load.setPath("./assets/");
        //player
        this.load.image("Player","player_24.png");
        //text
        this.load.bitmapFont("rocketSquare", "KennyRocketSquare_0.png", "KennyRocketSquare.fnt");
    }

    create(){
        let my = this.my;

        my.sprite.player = this.add.sprite(0,-150,"Player");

        //text display
        my.text.gameover = this.add.bitmapText(game.config.width / 4, game.config.height / 4, "rocketSquare", "GAME OVER");
        my.text.gameover.x = game.config.width / 4 - my.text.gameover.displayWidth / 2;

        my.text.scoreDisplay = this.add.bitmapText(my.text.gameover.x, game.config.height / 3, "rocketSquare", "High Score: " + highScore);

        my.text.creditsKen = this.add.bitmapText(my.text.gameover.x, game.config.height * 1 / 2, "rocketSquare", "Sprites and images from\nKenney's asset packs");
        my.text.creditsAsh = this.add.bitmapText(my.text.gameover.x, game.config.height * 1 / 2, "rocketSquare", "Designed and coded by\nAshton Gallistel");
        my.text.creditsAsh.y = my.text.creditsKen.y + my.text.creditsAsh.displayHeight * 4 / 3;
        my.text.instructions = this.add.bitmapText(my.text.gameover.x, game.config.height * 1 / 2, "rocketSquare", "Press space to return\nto the title screen");
        my.text.instructions.y = my.text.creditsAsh.y + my.text.instructions.displayHeight * 4 / 3;
        //console.log(my.text.creditsKen.y + "," + my.text.creditsAsh.y);

        let spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        spaceKey.on('down', (key,event) => {
            this.scene.start("titleScreenScene");
        })
    }
    
    update(time,delta){
        let my = this.my;
        this.playerTimer += delta;
        my.sprite.player.x = 50 * Math.cos(this.playerTimer / 250) + game.config.width * 3 / 4 ;
        my.sprite.player.y += delta / 10;
        my.sprite.player.rotation += delta / 125;
        //console.log(my.sprite.player.x + "," + my.sprite.player.y);
    }
}