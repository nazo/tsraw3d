module tsraw3d {
    export class Vector3 {
        public w: number;

        constructor(public x: number, public y: number, public z: number) {
            this.w = 1;
        }

        copy() {
            return new Vector3(this.x, this.y, this.z);
        }

        intersectMatrix(matrix: Matrix4) : Vector3 {
            var vector = [this.x, this.y, this.z, this.w];
            var results = [0, 0, 0, 0];
            for(var j=0;j<4;j++) {
                for(var i=0;i<4;i++) {
                    results[j] += vector[i] * matrix.get(i, j);
                }
            }
            var resultVector = new Vector3(results[0], results[1], results[2]);
            resultVector.w = results[3];
            return resultVector;
        }

        cross(target: Vector3): Vector3 {
            return new Vector3(this.y * target.z - this.z * target.y, this.z * target.x - this.x * target.z, this.x * target.y - this.y * target.x);
        }

        dot(target: Vector3): number {
            return this.x * target.x + this.y * target.y + this.z * target.z;
        }

        add(target: Vector3): Vector3 {
            return new Vector3(this.x + target.x, this.y + target.y, this.z + target.z);
        }

        sub(target: Vector3): Vector3 {
            return new Vector3(this.x - target.x, this.y - target.y, this.z - target.z);
        }

        length(): number {
            return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
        }

        normal(): Vector3 {
            var len = this.length();
            return new Vector3(this.x / len, this.y / len, this.z / len);
        }

    }

    export class Matrix4 {
        private matrix: number[][];

        constructor() {
            this.matrix = [[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]];
        }

        static fromArray(matrix: number[][]): Matrix4 {
            var instance = new Matrix4();
            instance.setMatrix(matrix);
            return instance;
        }

        setMatrix(matrix: number[][]) {
            this.matrix = matrix;
        }

        intersect(matrix: Matrix4) {
            var resultMatrix = new Matrix4();
            for(var j=0;j<4;j++) {
                for(var i=0;i<4;i++) {
                    var result = 0;
                    for(var k=0;k<4;k++) {
                        result += this.get(k, j) * matrix.get(i, k);
                    }
                    resultMatrix.set(i, j, result);
                }
            }

            return resultMatrix;
        }

        get(x:number, y:number) : number {
            return this.matrix[y][x];
        }

        set(x:number, y:number, value: number) {
            this.matrix[y][x] = value;
        }

        inverse() : Matrix4 {
            var matrix = [
                [this.matrix[0][0], this.matrix[1][0], this.matrix[2][0], this.matrix[3][0]],
                [this.matrix[0][1], this.matrix[1][1], this.matrix[2][1], this.matrix[3][1]],
                [this.matrix[0][2], this.matrix[1][2], this.matrix[2][2], this.matrix[3][2]],
                [this.matrix[0][3], this.matrix[1][3], this.matrix[2][3], this.matrix[3][3]]
                ];
            return Matrix4.fromArray(matrix);
        }
    }

    export class VertexBuffer {
        private buffer : Vector3[] = [];
        public color : string = null;

        setBuffer(buffer : Vector3[]) {
            this.buffer = buffer;
        }

        copy() {
            var buffer = [];
            for(var i=0;i<this.buffer.length;i++) {
                buffer[i] = this.buffer[i].copy();
            }
            var vb = new VertexBuffer();
            vb.setBuffer(buffer);
            return vb;
        }

        add(vertex : Vector3) {
            this.buffer.push(vertex);
        }

        count() {
            return this.buffer.length;
        }

        get(pos: number) {
            if (pos < 0 && this.buffer.length <= pos) {
                return null;
            }
            return this.buffer[pos];
        }

        intersectMatrix(matrix: Matrix4) : VertexBuffer {
            for(var i=0;i<this.buffer.length;i++) {
                this.buffer[i] = this.buffer[i].intersectMatrix(matrix);
            }
            return this;
        }

        translate(x: number, y: number, z: number) {
            var matrix = Matrix4.fromArray([
                [1, 0, 0, x],
                [0, 1, 0, y],
                [0, 0, 1, z],
                [0, 0, 0, 1]
                    ]);

            this.intersectMatrix(matrix);
        }

        rotateX(deg: number) {
            var cos = Math.cos(deg / 180 * Math.PI);
            var sin = Math.sin(deg / 180 * Math.PI);
            var matrix = Matrix4.fromArray([
                [1, 0, 0, 0],
                [0, cos, -sin, 0],
                [0, sin, cos, 0],
                [0, 0, 0, 1]
                    ]);

            this.intersectMatrix(matrix);
        }

        rotateY(deg: number) {
            var cos = Math.cos(deg / 180 * Math.PI);
            var sin = Math.sin(deg / 180 * Math.PI);
            var matrix = Matrix4.fromArray([
                [cos, 0, sin, 0],
                [0, 1, 0, 0],
                [- sin , 0, cos, 0],
                [0, 0, 0, 1]
                    ]);

            this.intersectMatrix(matrix);
        }

        rotateZ(deg: number) {
            var cos = Math.cos(deg / 180 * Math.PI);
            var sin = Math.sin(deg / 180 * Math.PI);
            var matrix = Matrix4.fromArray([
                [cos, -sin, 0, 0],
                [sin, cos, 0, 0],
                [0, 0, 1, 0],
                [0, 0, 0, 1]
                    ]);

            this.intersectMatrix(matrix);
        }

    }

    export class Camera {
        private x: number = 0;
        private y: number = 0;
        private z: number = 0;

        private lookX: number = 0;
        private lookY: number = 0;
        private lookZ: number = 0;

        private upX: number = 0;
        private upY: number = 1.0;
        private upZ: number = 0;

        private dirty: boolean = true;
        private viewMatrix: Matrix4;

        setPos(x: number, y: number, z: number) {
            this.x = x;
            this.y = y;
            this.z = z;
            this.dirty = true;
        }

        setLookAt(x: number, y: number, z: number) {
            this.lookX = x;
            this.lookY = y;
            this.lookZ = z;
            this.dirty = true;
        }

        setUpVec(x: number, y: number, z: number) {
            this.upX = x;
            this.upY = y;
            this.upZ = z;
            this.dirty = true;
        }

        getViewMatrix(): Matrix4 {
            if (this.dirty) {
                this.dirty = false;

                var eye = new Vector3(this.x, this.y, this.z);
                var at = new Vector3(this.lookX, this.lookY, this.lookZ);
                var up = new Vector3(this.upX, this.upY, this.upZ);
                var zaxis = at.sub(eye).normal();
                var xaxis = up.cross(zaxis).normal()
                var yaxis = zaxis.cross(xaxis);

                this.viewMatrix = Matrix4.fromArray([
                    [xaxis.x, yaxis.x, zaxis.x, 0],
                    [xaxis.y, yaxis.y, zaxis.y, 0],
                    [xaxis.z, yaxis.z, zaxis.z, 0],
                    [-xaxis.dot(eye), -yaxis.dot(eye), -zaxis.dot(eye), 1]
                        ]).inverse();
            }

            return this.viewMatrix;
        }
    }

    export class Stage3D {
        private width: number;
        private height: number;
        private camera: Camera = null;
        private viewportMatrix: Matrix4;
        private perspectiveMatrix: Matrix4;
        private nearClipping = 0;
        private farClipping = 0;
        private zList = [];

        constructor(public drawer) {
        }

        setScreenSize(width: number, height: number) {
            this.width = width;
            this.height = height;
            this.viewportMatrix = Matrix4.fromArray([
                    [width/2,0,0,0],
                    [0,-height/2,0,0],
                    [0,0,1,0],
                    [width/2,height/2,0,1]
                    ]).inverse();
        }

        setCamera(camera: Camera) {
            this.camera = camera;
        }

        setPerspectiveMatrix(matrix: Matrix4) {
            this.perspectiveMatrix = matrix;
        }

        setPerspectiveMatrixFovLH(fovY: number, aspect: number, zn: number, zf: number) {
            var h = 1 / Math.tan(fovY / 2);
            var w = h / aspect;
            this.nearClipping = zn;
            this.farClipping = zf;
            this.setPerspectiveMatrix(Matrix4.fromArray([
                    [w, 0, 0, 0],
                    [0, h, 0, 0],
                    [0, 0, zf/(zf-zn), 1],
                    [0, 0, -zn*zf/(zf-zn), 0]
                    ]).inverse());
        }

        drawPrimitive(buffer: VertexBuffer) {
            var poly = [];
            var z = null;
            for(var i: number=0;i<buffer.count();i++) {
                var vertex = buffer.get(i);
                if (this.camera) {
                    vertex = vertex.intersectMatrix(this.camera.getViewMatrix());
                }
                if (vertex.z < this.nearClipping || this.farClipping < vertex.z) {
                    continue;
                }
                vertex = vertex.intersectMatrix(this.perspectiveMatrix);
                if (z == null || vertex.z > z) {
                    z = vertex.z;
                }
                vertex = vertex.intersectMatrix(this.viewportMatrix);
                var x = vertex.x / vertex.w;
                var y = vertex.y / vertex.w;

                poly.push([x, y]);
            }

            if (poly.length >= 2) {
                var weight = z;
                this.zList.push({weight : weight, poly : poly, color : buffer.color});
            }
        }

        render() {
            this.zList.sort((a, b) => {
                return a.weight > b.weight ? -1 : (a.weight < b.weight ? 1 : 0);
            });

            for(var i=0;i<this.zList.length;i++) {
                this.drawer.polyline(this.zList[i].poly, this.zList[i].color);
            }
        }

        clear() {
            this.zList = [];
            this.drawer.clear();
        }

        createBox(x : number, y : number, z : number, size : number) : VertexBuffer[] {
            var box = [
                [ [x + 0, y + 0, z + 0],[x + 0, y + size, z + 0],[x + size, y + size, z + 0],[x + size, y + 0, z + 0] ],
                [ [x + 0, y + 0, z + 0],[x + 0, y + 0, z + size],[x + 0, y + size, z + size],[x + 0, y + size, z + 0] ],
                [ [x + 0, y + 0, z + 0],[x + 0, y + 0, z + size],[x + size, y + 0, z + size],[x + size, y + 0, z + 0] ],
                [ [x + 0, y + size, z + 0],[x + 0, y + size,z + size],[x + size, y+ size, z + size],[x + size,y + size,z + 0] ],
                [ [x + size,y + 0,z + 0],[x + size,y + 0,z + size],[x + size,y + size,z + size],[x + size,y + size,z + 0] ],
                [ [x + 0, y + 0,z + size],[x + 0,y + size,z + size],[x + size,y + size,z + size],[x + size, y + 0,z + size] ]
            ];

            var vbs = [];
            for(var i=0;i<box.length;i++) {
                var vb = new VertexBuffer();
                for(var j=0;j<box[i].length;j++) {
                    vb.add(new Vector3(box[i][j][0], box[i][j][1], box[i][j][2]));
                }
                vbs.push(vb);
            }

            return vbs;
        }
    }

    export class Canvas3D {
        constructor(public context) {
        }

        line(x : number, y : number, x2 : number, y2 : number) {
            this.context.beginPath();
            this.context.moveTo(x, y);
            this.context.lineTo(x2, y2);
            this.context.closePath();
            this.context.stroke();
        }

        polyline(points: number[][], color: string) {
            if (color != null) {
                this.context.fillStyle = color;
            }
            this.context.beginPath();
            var startPos = points.shift();
            this.context.moveTo(startPos[0], startPos[1]);
            for(var i=0;i<points.length;i++) {
                var point = points[i];
                this.context.lineTo(point[0], point[1]);
            }
            this.context.closePath();
            if (color != null) {
                this.context.fill();
            }
            this.context.stroke();
        }

        clear() {
            this.context.clearRect(0, 0, 512, 512);
        }
    }

    export interface IGameScene {
        init();
        main();
        finish();
    }

    export class GameSceneManager {
        private scene: IGameScene;

        start() {
            setInterval(() => {
                this.mainloop();
            }, 32);
        }

        change(scene: IGameScene) {
            if (this.scene) {
                this.scene.finish();
            }
            this.scene = scene;
            this.scene.init();
        }

        mainloop() {
            this.stage.clear();
            if (this.scene) {
                this.scene.main();
            }
            this.stage.render();
        }

        constructor(public stage: Stage3D) {
        }
    }

    export class GameScene implements IGameScene {
        public stage;

        init() {}
        main() {}
        finish() {}
        constructor(public manager : GameSceneManager) {
            this.stage = this.manager.stage;
        }
    }
}
