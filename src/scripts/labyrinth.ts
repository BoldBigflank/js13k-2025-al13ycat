import { Sprite, getCanvas, getContext, keyPressed } from "kontra";
import { GameManager } from "../types";

const canvas = getCanvas();

const AccelerometerDisplay = {
    x: 320,
    y: 320,
    width: 100,
    height: 100,
    color: "blue",
    handleOrientation: function (event: DeviceOrientationEvent) {
        this.gamma = event.gamma;
        this.beta = event.beta;
    },
    update: function (dt: number) {
        if (!this.initialized) {
            console.log("adding event listener");
            window.addEventListener(
                "deviceorientation",
                this.handleOrientation.bind(this),
                true,
            );
            this.initialized = true;
        }
        const ctx = getContext();

        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    },
    render: function () {
        this.draw();
        const ctx = getContext();

        ctx.save();
        ctx.font = "16px Arial";
        ctx.fillText(`Accelerometer: ${this.x}, ${this.y}`, 10, 10);
        ctx.restore();

        ctx.save();
        ctx.strokeStyle = "black";
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(this.gamma * 10, this.beta * 10);
        ctx.stroke();
        ctx.restore();
    },
};

const Ball = {
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    color: "red",
    speed: 4,
    update: function (dt: number) {
        if (keyPressed("arrowLeft") || keyPressed("a")) {
            this.dx = -1 * this.speed;
        } else if (keyPressed("arrowRight") || keyPressed("d")) {
            this.dx = this.speed;
        } else {
            this.dx = 0;
        }

        if (keyPressed("arrowUp") || keyPressed("w")) {
            this.dy = -1 * this.speed;
        } else if (keyPressed("arrowDown") || keyPressed("s")) {
            this.dy = this.speed;
        } else {
            this.dy = 0;
        }

        this.advance(1);
        if (this.x > getCanvas().width) {
            this.x = 0;
        }
    },
    render: function () {
        this.draw();
    },
};

export const Labyrinth = (gameManager: GameManager) => {
    const { sprites, canvas } = gameManager;
    const ball = new Sprite(Ball);
    sprites.push(ball);
    const accelerometerDisplay = new Sprite(AccelerometerDisplay);
    sprites.push(accelerometerDisplay);
};
