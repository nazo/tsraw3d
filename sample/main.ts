/// <reference path="../src/lib.ts"/>

import Vector3 = tsraw3d.Vector3;
import VertexBuffer = tsraw3d.VertexBuffer;
import Stage3D = tsraw3d.Stage3D;
import GameScene = tsraw3d.GameScene;
import Camera = tsraw3d.Camera;
import Canvas3D = tsraw3d.Canvas3D;
import GameSceneManager = tsraw3d.GameSceneManager;

class Map3D {
    private data: Vector3[][];
    private width: number = 20;
    private height: number = 20;
    private tile_size :number = 100;
    private offsetX = 0;
    private offsetY = 0;
    private offsetZ = 0;

    generate() {
        this.data = new Array(this.height);
        for(var y=0;y<this.height;y++) {
            this.data[y] = new Array(this.width);
            for(var x=0;x<this.width;x++) {
                this.data[y][x] = new Vector3(
                        x * this.tile_size,
                        Math.floor(Math.random() * 200) / 3,
                        y * this.tile_size
                        );
            }
        }
    }

    getBuffer() : VertexBuffer[] {
        var vbs = [];
        for(var y=0;y<this.height - 1;y++) {
            for(var x=0;x<this.width - 1;x++) {
                var data0 = this.data[y][x];
                var data1 = this.data[y][x + 1];
                var data2 = this.data[y + 1][x + 1];
                var data3 = this.data[y + 1][x];
                var vb = new VertexBuffer();
                vb.color = "rgb(" + Math.floor((x * 12.8) % 256) + ", 255, " + Math.floor((y * 12.8) % 256) + ")";
                vb.add(new Vector3(data0.x, data0.y, data0.z));
                vb.add(new Vector3(data1.x, data1.y, data1.z));
                vb.add(new Vector3(data2.x, data2.y, data2.z));
                vb.add(new Vector3(data3.x, data3.y, data3.z));
                vbs.push(vb);
            }
        }

        return vbs;
    }

    getHeightFromPos(x: number, y: number) {
        var mapX = Math.floor(x / this.tile_size);
        var mapY = Math.floor(y / this.tile_size);
        if (mapY < 0 || (mapY + 1) >= this.data.length) {
            return 0;
        }
        if (mapX < 0 || (mapX + 1) >= this.data[mapY].length) {
            return 0;
        }
        var ofsX = x % this.tile_size;
        var ofsY = y % this.tile_size;

        var data0 = this.data[mapY][mapX];
        var data1 = this.data[mapY][mapX + 1];
        var data2 = this.data[mapY + 1][mapX + 1];
        var data3 = this.data[mapY + 1][mapX];

        var pa : Vector3;
        var pb : Vector3;
        var pc : Vector3;

        if (ofsX < this.tile_size / 2) {
            if (ofsY < this.tile_size / 2) {
                pa = data0;
                pb = data1;
                pc = data3;
            } else {
                pa = data0;
                pb = data2;
                pc = data3;
            }
        } else {
            if (ofsY < this.tile_size / 2) {
                pa = data0;
                pb = data1;
                pc = data2;
            } else {
                pa = data1;
                pb = data2;
                pc = data3;
            }
        }

        var n = pb.sub(pa).cross(pc.sub(pa));

        return pa.y - (n.x * (x - pa.x) + n.z * (y - pa.z)) / n.y;
    }

    isInbound(x: number, y: number) : boolean {
        return (( (0 <= x) && (x < this.width * this.tile_size) ) && ( (0 <= y) && (y < this.height * this.tile_size) ));
    }

    getCenterX() : number {
        return (this.width / 2 * this.tile_size);
    }

    getCenterY() : number {
        return (this.width / 2 * this.tile_size);
    }
}

class Shot {
    private pos : Vector3;
    private angle : number;

    constructor(x: number, y:number, z:number, angle:number) {
        this.pos = new Vector3(x, y, z);
        this.angle = angle;
    }

    onEnterFrame() {
        this.pos.x += Math.cos(this.angle * Math.PI / 180) * 20;
        this.pos.z += Math.sin(this.angle * Math.PI / 180) * 20;
    }

    render(box : VertexBuffer[], stage : Stage3D) {
        for(var i=0;i<box.length;i++) {
            var vb : VertexBuffer = box[i].copy();
            vb.translate(this.pos.x, this.pos.y, this.pos.z);
            vb.color = "rgb(0, 0, 255)";
            stage.drawPrimitive(vb);
        }
    }

    getPos() : Vector3 {
        return this.pos;
    }

    getAngle() : number {
        return this.angle;
    }
}

class ShotBuffer {
    private shots : Shot[];

    constructor() {
        this.shots = [];
    }

    grow(x: number, y:number, z:number, angle:number) {
        this.shots.push(new Shot(x, y, z, angle));
    }

    onEnterFrame() {
        var length = this.shots.length;
        for(var i=0;i<length;i++) {
            this.shots[i].onEnterFrame();
        }
    }

    render(box : VertexBuffer[], stage : Stage3D) {
        var length = this.shots.length;
        for(var i=0;i<length;i++) {
            this.shots[i].render(box, stage);
        }
        console.log(length);
    }

    hitMap(map : Map3D) {
        var length = this.shots.length;
        var newShots : Shot[] = [];
        for(var i=0;i<length;i++) {
            var shot = this.shots[i];
            if (map.isInbound(shot.getPos().x, shot.getPos().z)) {
                if (map.getHeightFromPos(shot.getPos().x, shot.getPos().z) <= shot.getPos().y) {
                    newShots.push(shot);
                }
            }
        }
        this.shots = newShots;
    }
}

class Player {
    private moveFront : number = 0;
    private moveBack : number = 0;
    private turnLeft : number = 0;
    private turnRight : number = 0;
    private jumpStart : number = 0;
    private jumpUp : number = 0;
    private jumpEnable : number = 0;
    private shotStart : number = 0;
    private pos : Vector3;
    private oldPos : Vector3;
    private angle : number;

    constructor(x: number, y:number, z:number) {
        window.addEventListener('keydown', e => {
            if  (e.keyCode == 87) {
                this.moveFront = 1;
            } else if  (e.keyCode == 83) {
                this.moveBack = 1;
            }
            if (e.keyCode == 65) {
                this.turnLeft = 1;
            } else if  (e.keyCode == 68) {
                this.turnRight = 1;
            }
            if  (e.keyCode == 32) {
                this.jumpStart = 1;
            }
            if  (e.keyCode == 13) {
                this.shotStart = 1;
            }
        });

        this.pos = new Vector3(x, y, z);
        this.angle = 0;
        this.jumpUp = 0;
        this.jumpEnable = 0;
    }

    onEnterFrame() {
        this.oldPos = this.pos.copy();
        if (this.moveFront) {
            this.pos.x += Math.cos(this.angle * Math.PI / 180) * 5;
            this.pos.z += Math.sin(this.angle * Math.PI / 180) * 5;
        }
        if (this.moveBack) {
            this.pos.x -= Math.cos(this.angle * Math.PI / 180) * 5;
            this.pos.z -= Math.sin(this.angle * Math.PI / 180) * 5;
        }
        if (this.turnLeft) {
            this.angle += 5;
            if (this.angle >= 360) {
                this.angle -= 360;
            }
        }
        if (this.turnRight) {
            this.angle -= 5;
            if (this.angle < 0) {
                this.angle += 360;
            }
        }
        if (this.jumpStart && this.jumpEnable) {
            this.jumpUp = 200;
            this.jumpEnable = 0;
        }

        this.moveFront = 0;
        this.moveBack = 0;
        this.turnLeft = 0;
        this.turnRight = 0;
        this.jumpStart = 0;
    }

    canShotStart() {
        var ret = this.shotStart;
        this.shotStart = 0;
        return ret;
    }

    rollbackPos() {
        this.pos = this.oldPos.copy();
    }

    onHitGround(groundY: number) {
        if (this.jumpUp > 0) {
            this.jumpUp -= 20;
            this.pos.y += 20;
            this.jumpEnable = 0;
        } else {
            if (groundY < this.pos.y) {
                this.pos.y -= 10;
            }
        }
        if (groundY > this.pos.y) {
            this.pos.y = groundY;
            this.jumpUp = 0;
            this.jumpEnable = 1;
        }
    }

    render(box : VertexBuffer[], stage : Stage3D) {
        for(var i=0;i<box.length;i++) {
            var vb : VertexBuffer = box[i].copy();
            vb.translate(this.pos.x, this.pos.y, this.pos.z);
            vb.color = "rgb(255, 0, 0)";
            stage.drawPrimitive(vb);
        }
    }

    getPos() : Vector3 {
        return this.pos;
    }

    getAngle() : number {
        return this.angle;
    }
}

class FirstScene extends GameScene {

    private moveZ : number;
    private camera : Camera;
    private cameraX : number;
    private cameraXMove : number;
    private map: Map3D;
    private player: Player;
    private box : VertexBuffer[];
    private shot_box : VertexBuffer[];
    private shotBuffer : ShotBuffer;

    init() {
        this.moveZ = 0;
        this.map = new Map3D();
        this.map.generate();

        this.box = this.stage.createBox(0, 0, 0, 5);
        this.shot_box = this.stage.createBox(0, 0, 0, 2);

        this.player = new Player(this.map.getCenterX(), 260, this.map.getCenterY());
        this.shotBuffer = new ShotBuffer();

        this.camera = new Camera();
        this.camera.setPos(0, 0, -10000);
        this.camera.setLookAt(0, 0, 0);
        this.stage.setCamera(this.camera);
        this.cameraX = 0;
        this.cameraXMove = 1;
    }

    main() {
        this.player.onEnterFrame();
        if (!this.map.isInbound(this.player.getPos().x, this.player.getPos().z)) {
            this.player.rollbackPos();
        }
        var mapY = this.map.getHeightFromPos(this.player.getPos().x, this.player.getPos().z);
        this.player.onHitGround(mapY);

        this.shotBuffer.onEnterFrame();
        this.shotBuffer.hitMap(this.map);

        if (this.player.canShotStart()) {
            this.shotBuffer.grow(this.player.getPos().x + 1.5, this.player.getPos().y + 1.5, this.player.getPos().z + 1.5, this.player.getAngle());
        }

        this.camera.setPos(
            this.player.getPos().x - (Math.cos(this.player.getAngle() * Math.PI / 180) * 200),
            this.player.getPos().y + 80,
            this.player.getPos().z - (Math.sin(this.player.getAngle() * Math.PI / 180) * 200));
        this.camera.setLookAt(this.player.getPos().x, this.player.getPos().y, this.player.getPos().z);

        this.player.render(this.box, this.stage);
        this.shotBuffer.render(this.shot_box, this.stage);

        var mapBuffers = this.map.getBuffer();
        for(var i=0;i<mapBuffers.length;i++) {
            var vb : VertexBuffer = mapBuffers[i];
            this.stage.drawPrimitive(vb);
        }
    }

    finish() {
    }
}

function main() {
    var canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    document.body.appendChild(canvas);
    var context = canvas.getContext('2d');
    var drawer = new Canvas3D(context);
    var stage = new Stage3D(drawer);
    stage.setScreenSize(512, 512);
    stage.setPerspectiveMatrixFovLH(Math.PI / 4, canvas.height / canvas.width, 1, 1000);

    var sceneManager = new GameSceneManager(stage);
    sceneManager.change(new FirstScene(sceneManager));
    sceneManager.start();

}

main();
