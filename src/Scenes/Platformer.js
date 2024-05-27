var win = false;
class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");
    }

    init() {
        // variables and settings
        this.ACCELERATION = 200;
        this.DRAG = 300;    // DRAG < ACCELERATION = icy slide
        this.physics.world.gravity.y = 900;
        this.JUMP_VELOCITY = -400;
        this.PARTICLE_VELOCITY = 100;
        this.SCALE = 3.0;
        win = false;
    }

    preload(){
        this.load.scenePlugin('AnimatedTiles', './lib/AnimatedTiles.js', 'animatedTiles', 'animatedTiles');
        this.load.setPath("./assets/");
        this.load.audio("getCoin", "jingles_STEEL16.ogg");
        this.load.audio("jump", "impactSoft_heavy_001.ogg");
    }

    create() {
        // Create a new tilemap game object which uses 18x18 pixel tiles, and is
        // 45 tiles wide and 25 tiles tall.
        this.map = this.add.tilemap("platformer-level-1", 18, 18, 120, 40);


        // Add a tileset to the map
        // First parameter: name we gave the tileset in Tiled
        // Second parameter: key for the tilesheet (from this.load.image in Load.js)
        this.tileset = this.map.addTilesetImage("kenny_tilemap_packed", "tilemap_tiles");

        // Create a layer
        this.groundLayer = this.map.createLayer("Ground-n-Platforms", this.tileset, 0, 0);

        // Make it collidable
        this.groundLayer.setCollisionByProperty({
            collides: true
        });

        // const animConfig = {
        //     key: 'coin animation',
        //     frames: ,
        //     frameRate: 60,
        //     repeat: -1
        // };

        //this.anims.create(animConfig);


        this.animatedTiles.init(this.map);



        // Find coins in the "Objects" layer in Phaser
        // Look for them by finding objects with the name "coin"
        // Assign the coin texture from the tilemap_sheet sprite sheet
        // Phaser docs:
        // https://newdocs.phaser.io/docs/3.80.0/focus/Phaser.Tilemaps.Tilemap-createFromObjects

        this.coins = this.map.createFromObjects("Collectables", {
            name: "coin",
            key: "tilemap_sheet",
            frame: 151
        });

        this.flags = this.map.createFromObjects("Win Condition", {
            name: "flag",
            key: "tilemap_sheet",
            frame: 111
        });

        this.water = this.map.createFromObjects("Death", {
            name: "water",
            key: "tilemap_sheet",
            frame: 53
        });
        

        // Since createFromObjects returns an array of regular Sprites, we need to convert 
        // them into Arcade Physics sprites (STATIC_BODY, so they don't move) 
        this.physics.world.enable(this.coins, Phaser.Physics.Arcade.STATIC_BODY);

        // Create a Phaser group out of the array this.coins
        // This will be used for collision detection below.
        this.coinGroup = this.add.group(this.coins);

        // Add arcade physics for flags
        this.physics.world.enable(this.flags, Phaser.Physics.Arcade.STATIC_BODY);

        // Add arcade physics for water
        this.physics.world.enable(this.water, Phaser.Physics.Arcade.STATIC_BODY);

        // Create a Phaser group out of the array this.coins
        // This will be used for collision detection below.
        this.flagGroup = this.add.group(this.flags);

        this.waterGroup = this.add.group(this.water);
        

        // set up player avatar
        my.sprite.player = this.physics.add.sprite(30, 10, "platformer_characters", "tile_0000.png");
        my.sprite.player.body.setCollideWorldBounds(true);

        // Enable collision handling
        this.physics.add.collider(my.sprite.player, this.groundLayer);

        // Handle collision detection with coins
        this.physics.add.overlap(my.sprite.player, this.coinGroup, (obj1, obj2) => {
            obj2.destroy(); // remove coin on overlap
            this.sound.play("getCoin", {
                volume: 1 
            });
        });
        
        // Handle collision detection with flags
        this.physics.add.overlap(my.sprite.player, this.flagGroup, (obj1, obj2) => {
            obj2.destroy(); // remove coin on overlap
            this.scene.start("gameOver");
            win = true; 
        });

        this.physics.add.overlap(my.sprite.player, this.waterGroup, (obj1, obj2) => {
            this.scene.start("gameOver");
            win = false;
        });

        // set up Phaser-provided cursor key input
        cursors = this.input.keyboard.createCursorKeys();

        this.rKey = this.input.keyboard.addKey('R');

        // debug key listener (assigned to D key)
        this.input.keyboard.on('keydown-D', () => {
            this.physics.world.drawDebug = this.physics.world.drawDebug ? false : true
            this.physics.world.debugGraphic.clear()
        }, this);

        // TODO: Add movement vfx here
        // movement vfx

        my.vfx.walking = this.add.particles(0, 0, "kenny-particles", {
            frame: ['spark_01.png', 'spark_03.png'],
            // TODO: Try: add random: true
            random: true,
            scale: {start: 0.03, end: .2},
            // TODO: Try: maxAliveParticles: 8,
            maxAliveParticles: 5,
            tint: 0xff0000, 
            lifespan: 350,
            // TODO: Try: gravityY: -400,
            gravityY: -400,
            alpha: {start: 1, end: 0.1}, 
        });

        my.vfx.walking.stop();

        // TODO: add camera code here
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels +2000, this.map.heightInPixels + 2000);
        this.cameras.main.startFollow(my.sprite.player, true, 1, 1); // (target, [,roundPixels][,lerpX][,lerpY])
        this.cameras.main.setDeadzone(50, 50);
        this.cameras.main.setZoom(this.SCALE);

    }

    update() {
        
        if(my.sprite.player.y >= this.map.heightInPixels){
            this.scene.start("gameOver");
        }
        if(cursors.left.isDown) {
            my.sprite.player.setAccelerationX(-this.ACCELERATION);
            my.sprite.player.resetFlip();
            my.sprite.player.anims.play('walk', true);
            // TODO: add particle following code here
            my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-10, my.sprite.player.displayHeight/2-5, false);

            my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);

            // Only play smoke effect if touching the ground

            if (my.sprite.player.body.blocked.down) {

                my.vfx.walking.start();

            }

        } else if(cursors.right.isDown) {
            my.sprite.player.setAccelerationX(this.ACCELERATION);
            my.sprite.player.setFlip(true, false);
            my.sprite.player.anims.play('walk', true);
            // TODO: add particle following code here
            my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-10, my.sprite.player.displayHeight/2-5, false);

            my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);

            // Only play smoke effect if touching the ground

            if (my.sprite.player.body.blocked.down) {

                my.vfx.walking.start();

            }

        } else {
            // Set acceleration to 0 and have DRAG take over
            my.sprite.player.setAccelerationX(0);
            my.sprite.player.setDragX(this.DRAG);
            my.sprite.player.anims.play('idle');
            // TODO: have the vfx stop playing
            my.vfx.walking.stop();
        }

        // player jump
        // note that we need body.blocked rather than body.touching b/c the former applies to tilemap tiles and the latter to the "ground"
        if(!my.sprite.player.body.blocked.down) {
            my.sprite.player.anims.play('jump');
        }
        if(my.sprite.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(cursors.up)) {
            my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
            this.sound.play("jump", {
                volume: 1 
            });
        }

        if(Phaser.Input.Keyboard.JustDown(this.rKey)) {
            this.scene.restart();
        }
    }
}