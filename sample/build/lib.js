var tsraw3d;
(function (tsraw3d) {
    var Vector3 = (function () {
        function Vector3(x, y, z) {
            this.x = x;
            this.y = y;
            this.z = z;
            this.w = 1;
        }
        Vector3.prototype.copy = function () {
            return new Vector3(this.x, this.y, this.z);
        };

        Vector3.prototype.intersectMatrix = function (matrix) {
            var vector = [this.x, this.y, this.z, this.w];
            var results = [0, 0, 0, 0];
            for (var j = 0; j < 4; j++) {
                for (var i = 0; i < 4; i++) {
                    results[j] += vector[i] * matrix.get(i, j);
                }
            }
            var resultVector = new Vector3(results[0], results[1], results[2]);
            resultVector.w = results[3];
            return resultVector;
        };

        Vector3.prototype.cross = function (target) {
            return new Vector3(this.y * target.z - this.z * target.y, this.z * target.x - this.x * target.z, this.x * target.y - this.y * target.x);
        };

        Vector3.prototype.dot = function (target) {
            return this.x * target.x + this.y * target.y + this.z * target.z;
        };

        Vector3.prototype.add = function (target) {
            return new Vector3(this.x + target.x, this.y + target.y, this.z + target.z);
        };

        Vector3.prototype.sub = function (target) {
            return new Vector3(this.x - target.x, this.y - target.y, this.z - target.z);
        };

        Vector3.prototype.length = function () {
            return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
        };

        Vector3.prototype.normal = function () {
            var len = this.length();
            return new Vector3(this.x / len, this.y / len, this.z / len);
        };
        return Vector3;
    })();
    tsraw3d.Vector3 = Vector3;

    var Matrix4 = (function () {
        function Matrix4() {
            this.matrix = [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]];
        }
        Matrix4.fromArray = function (matrix) {
            var instance = new Matrix4();
            instance.setMatrix(matrix);
            return instance;
        };

        Matrix4.prototype.setMatrix = function (matrix) {
            this.matrix = matrix;
        };

        Matrix4.prototype.intersect = function (matrix) {
            var resultMatrix = new Matrix4();
            for (var j = 0; j < 4; j++) {
                for (var i = 0; i < 4; i++) {
                    var result = 0;
                    for (var k = 0; k < 4; k++) {
                        result += this.get(k, j) * matrix.get(i, k);
                    }
                    resultMatrix.set(i, j, result);
                }
            }

            return resultMatrix;
        };

        Matrix4.prototype.get = function (x, y) {
            return this.matrix[y][x];
        };

        Matrix4.prototype.set = function (x, y, value) {
            this.matrix[y][x] = value;
        };

        Matrix4.prototype.inverse = function () {
            var matrix = [
                [this.matrix[0][0], this.matrix[1][0], this.matrix[2][0], this.matrix[3][0]],
                [this.matrix[0][1], this.matrix[1][1], this.matrix[2][1], this.matrix[3][1]],
                [this.matrix[0][2], this.matrix[1][2], this.matrix[2][2], this.matrix[3][2]],
                [this.matrix[0][3], this.matrix[1][3], this.matrix[2][3], this.matrix[3][3]]
            ];
            return Matrix4.fromArray(matrix);
        };
        return Matrix4;
    })();
    tsraw3d.Matrix4 = Matrix4;

    var VertexBuffer = (function () {
        function VertexBuffer() {
            this.buffer = [];
            this.color = null;
        }
        VertexBuffer.prototype.setBuffer = function (buffer) {
            this.buffer = buffer;
        };

        VertexBuffer.prototype.copy = function () {
            var buffer = [];
            for (var i = 0; i < this.buffer.length; i++) {
                buffer[i] = this.buffer[i].copy();
            }
            var vb = new VertexBuffer();
            vb.setBuffer(buffer);
            return vb;
        };

        VertexBuffer.prototype.add = function (vertex) {
            this.buffer.push(vertex);
        };

        VertexBuffer.prototype.count = function () {
            return this.buffer.length;
        };

        VertexBuffer.prototype.get = function (pos) {
            if (pos < 0 && this.buffer.length <= pos) {
                return null;
            }
            return this.buffer[pos];
        };

        VertexBuffer.prototype.intersectMatrix = function (matrix) {
            for (var i = 0; i < this.buffer.length; i++) {
                this.buffer[i] = this.buffer[i].intersectMatrix(matrix);
            }
            return this;
        };

        VertexBuffer.prototype.translate = function (x, y, z) {
            var matrix = Matrix4.fromArray([
                [1, 0, 0, x],
                [0, 1, 0, y],
                [0, 0, 1, z],
                [0, 0, 0, 1]
            ]);

            this.intersectMatrix(matrix);
        };

        VertexBuffer.prototype.rotateX = function (deg) {
            var cos = Math.cos(deg / 180 * Math.PI);
            var sin = Math.sin(deg / 180 * Math.PI);
            var matrix = Matrix4.fromArray([
                [1, 0, 0, 0],
                [0, cos, -sin, 0],
                [0, sin, cos, 0],
                [0, 0, 0, 1]
            ]);

            this.intersectMatrix(matrix);
        };

        VertexBuffer.prototype.rotateY = function (deg) {
            var cos = Math.cos(deg / 180 * Math.PI);
            var sin = Math.sin(deg / 180 * Math.PI);
            var matrix = Matrix4.fromArray([
                [cos, 0, sin, 0],
                [0, 1, 0, 0],
                [-sin, 0, cos, 0],
                [0, 0, 0, 1]
            ]);

            this.intersectMatrix(matrix);
        };

        VertexBuffer.prototype.rotateZ = function (deg) {
            var cos = Math.cos(deg / 180 * Math.PI);
            var sin = Math.sin(deg / 180 * Math.PI);
            var matrix = Matrix4.fromArray([
                [cos, -sin, 0, 0],
                [sin, cos, 0, 0],
                [0, 0, 1, 0],
                [0, 0, 0, 1]
            ]);

            this.intersectMatrix(matrix);
        };
        return VertexBuffer;
    })();
    tsraw3d.VertexBuffer = VertexBuffer;

    var Camera = (function () {
        function Camera() {
            this.x = 0;
            this.y = 0;
            this.z = 0;
            this.lookX = 0;
            this.lookY = 0;
            this.lookZ = 0;
            this.upX = 0;
            this.upY = 1.0;
            this.upZ = 0;
            this.dirty = true;
        }
        Camera.prototype.setPos = function (x, y, z) {
            this.x = x;
            this.y = y;
            this.z = z;
            this.dirty = true;
        };

        Camera.prototype.setLookAt = function (x, y, z) {
            this.lookX = x;
            this.lookY = y;
            this.lookZ = z;
            this.dirty = true;
        };

        Camera.prototype.setUpVec = function (x, y, z) {
            this.upX = x;
            this.upY = y;
            this.upZ = z;
            this.dirty = true;
        };

        Camera.prototype.getViewMatrix = function () {
            if (this.dirty) {
                this.dirty = false;

                var eye = new Vector3(this.x, this.y, this.z);
                var at = new Vector3(this.lookX, this.lookY, this.lookZ);
                var up = new Vector3(this.upX, this.upY, this.upZ);
                var zaxis = at.sub(eye).normal();
                var xaxis = up.cross(zaxis).normal();
                var yaxis = zaxis.cross(xaxis);

                this.viewMatrix = Matrix4.fromArray([
                    [xaxis.x, yaxis.x, zaxis.x, 0],
                    [xaxis.y, yaxis.y, zaxis.y, 0],
                    [xaxis.z, yaxis.z, zaxis.z, 0],
                    [-xaxis.dot(eye), -yaxis.dot(eye), -zaxis.dot(eye), 1]
                ]).inverse();
            }

            return this.viewMatrix;
        };
        return Camera;
    })();
    tsraw3d.Camera = Camera;

    var Stage3D = (function () {
        function Stage3D(drawer) {
            this.drawer = drawer;
            this.camera = null;
            this.nearClipping = 0;
            this.farClipping = 0;
            this.zList = [];
        }
        Stage3D.prototype.setScreenSize = function (width, height) {
            this.width = width;
            this.height = height;
            this.viewportMatrix = Matrix4.fromArray([
                [width / 2, 0, 0, 0],
                [0, -height / 2, 0, 0],
                [0, 0, 1, 0],
                [width / 2, height / 2, 0, 1]
            ]).inverse();
        };

        Stage3D.prototype.setCamera = function (camera) {
            this.camera = camera;
        };

        Stage3D.prototype.setPerspectiveMatrix = function (matrix) {
            this.perspectiveMatrix = matrix;
        };

        Stage3D.prototype.setPerspectiveMatrixFovLH = function (fovY, aspect, zn, zf) {
            var h = 1 / Math.tan(fovY / 2);
            var w = h / aspect;
            this.nearClipping = zn;
            this.farClipping = zf;
            this.setPerspectiveMatrix(Matrix4.fromArray([
                [w, 0, 0, 0],
                [0, h, 0, 0],
                [0, 0, zf / (zf - zn), 1],
                [0, 0, -zn * zf / (zf - zn), 0]
            ]).inverse());
        };

        Stage3D.prototype.drawPrimitive = function (buffer) {
            var poly = [];
            var z = null;
            for (var i = 0; i < buffer.count(); i++) {
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
                this.zList.push({ weight: weight, poly: poly, color: buffer.color });
            }
        };

        Stage3D.prototype.render = function () {
            this.zList.sort(function (a, b) {
                return a.weight > b.weight ? -1 : (a.weight < b.weight ? 1 : 0);
            });

            for (var i = 0; i < this.zList.length; i++) {
                this.drawer.polyline(this.zList[i].poly, this.zList[i].color);
            }
        };

        Stage3D.prototype.clear = function () {
            this.zList = [];
            this.drawer.clear();
        };

        Stage3D.prototype.createBox = function (x, y, z, size) {
            var box = [
                [[x + 0, y + 0, z + 0], [x + 0, y + size, z + 0], [x + size, y + size, z + 0], [x + size, y + 0, z + 0]],
                [[x + 0, y + 0, z + 0], [x + 0, y + 0, z + size], [x + 0, y + size, z + size], [x + 0, y + size, z + 0]],
                [[x + 0, y + 0, z + 0], [x + 0, y + 0, z + size], [x + size, y + 0, z + size], [x + size, y + 0, z + 0]],
                [[x + 0, y + size, z + 0], [x + 0, y + size, z + size], [x + size, y + size, z + size], [x + size, y + size, z + 0]],
                [[x + size, y + 0, z + 0], [x + size, y + 0, z + size], [x + size, y + size, z + size], [x + size, y + size, z + 0]],
                [[x + 0, y + 0, z + size], [x + 0, y + size, z + size], [x + size, y + size, z + size], [x + size, y + 0, z + size]]
            ];

            var vbs = [];
            for (var i = 0; i < box.length; i++) {
                var vb = new VertexBuffer();
                for (var j = 0; j < box[i].length; j++) {
                    vb.add(new Vector3(box[i][j][0], box[i][j][1], box[i][j][2]));
                }
                vbs.push(vb);
            }

            return vbs;
        };
        return Stage3D;
    })();
    tsraw3d.Stage3D = Stage3D;

    var Canvas3D = (function () {
        function Canvas3D(context) {
            this.context = context;
        }
        Canvas3D.prototype.line = function (x, y, x2, y2) {
            this.context.beginPath();
            this.context.moveTo(x, y);
            this.context.lineTo(x2, y2);
            this.context.closePath();
            this.context.stroke();
        };

        Canvas3D.prototype.polyline = function (points, color) {
            if (color != null) {
                this.context.fillStyle = color;
            }
            this.context.beginPath();
            var startPos = points.shift();
            this.context.moveTo(startPos[0], startPos[1]);
            for (var i = 0; i < points.length; i++) {
                var point = points[i];
                this.context.lineTo(point[0], point[1]);
            }
            this.context.closePath();
            if (color != null) {
                this.context.fill();
            }
            this.context.stroke();
        };

        Canvas3D.prototype.clear = function () {
            this.context.clearRect(0, 0, 512, 512);
        };
        return Canvas3D;
    })();
    tsraw3d.Canvas3D = Canvas3D;

    var GameSceneManager = (function () {
        function GameSceneManager(stage) {
            this.stage = stage;
        }
        GameSceneManager.prototype.start = function () {
            var _this = this;
            setInterval(function () {
                _this.mainloop();
            }, 32);
        };

        GameSceneManager.prototype.change = function (scene) {
            if (this.scene) {
                this.scene.finish();
            }
            this.scene = scene;
            this.scene.init();
        };

        GameSceneManager.prototype.mainloop = function () {
            this.stage.clear();
            if (this.scene) {
                this.scene.main();
            }
            this.stage.render();
        };
        return GameSceneManager;
    })();
    tsraw3d.GameSceneManager = GameSceneManager;

    var GameScene = (function () {
        function GameScene(manager) {
            this.manager = manager;
            this.stage = this.manager.stage;
        }
        GameScene.prototype.init = function () {
        };
        GameScene.prototype.main = function () {
        };
        GameScene.prototype.finish = function () {
        };
        return GameScene;
    })();
    tsraw3d.GameScene = GameScene;
})(tsraw3d || (tsraw3d = {}));
