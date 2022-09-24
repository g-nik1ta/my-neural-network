const btns = document.querySelector(".control-panel").querySelectorAll("button");
for (let i = 0; i < btns.length; i++) {
    btns[i].addEventListener("click", () => {
        btns[i].parentNode.classList.toggle("move");
        btns[i].classList.toggle("moveBtn");
    });
}

const canvas = document.querySelector("#canvas");
const context = canvas.getContext('2d');

class DCanvas {
    constructor() {
        this.pixel = 20;
        this.canvWidth = parseInt(getComputedStyle(canvas).width);
        this.canvHeight = parseInt(getComputedStyle(canvas).height);
    }

    drawLine(x1, y1, x2, y2) {
        context.beginPath();
        context.strokeStyle = 'gray';
        context.lineJoin = 'miter';
        context.lineWidth = 1;
        context.moveTo(x1, y1);
        context.lineTo(x2, y2);
        context.stroke();
    }

    drawCell(x, y, w, h) {
        context.fillStyle = 'blue';
        context.strokeStyle = 'blue';
        context.lineJoin = 'miter';
        context.lineWidth = 1;
        context.rect(x, y, w, h);
        context.fill();
    }

    clear() {
        context.clearRect(0, 0, this.canvWidth, this.canvHeight);
        let resButton = document.querySelector(".result-button");
        if(resButton != null) resButton.classList.remove("result-button");
    }

    drawGrid() {
        const w = this.canvWidth;
        const h = this.canvHeight;
        const p = w / this.pixel;

        const xStep = w / p;
        const yStep = h / p;

        for (let x = 0; x < w; x += xStep) {
            this.drawLine(x, 0, x, h);
        }

        for (let y = 0; y < h; y += yStep) {
            this.drawLine(0, y, w, y);
        }
    }

    calculate(draw = false) {
        const w = this.canvWidth;
        const h = this.canvHeight;
        const p = w / this.pixel;

        const xStep = w / p;
        const yStep = h / p;

        const vector = [];
        let __draw = [];

        for (let x = 0; x < w; x += xStep) {
            for (let y = 0; y < h; y += yStep) {
                const data = context.getImageData(x, y, xStep, yStep);

                let nonEmptyPixelsCount = 0;
                for (let i = 0; i < data.data.length; i += 10) {
                    const isEmpty = data.data[i] === 0;

                    if (!isEmpty) {
                        nonEmptyPixelsCount += 1;
                    }
                }

                if (nonEmptyPixelsCount > 1 && draw) {
                    __draw.push([x, y, xStep, yStep]);
                }

                vector.push(nonEmptyPixelsCount > 1 ? 1 : 0);
            }
        }

        if (draw) {
            this.clear();
            this.drawGrid();

            for (let _d in __draw) {
                this.drawCell(__draw[_d][0], __draw[_d][1], __draw[_d][2], __draw[_d][3]);
            }
        }

        return vector;
    }

}



let vector = [];
let net = null;
let train_data = [];
let isMouseDawn = false;

const d = new DCanvas();

canvas.addEventListener('mousedown', function(e) {
    isMouseDawn = true;
    context.beginPath();
})

canvas.addEventListener('mouseup', function(e) {
    isMouseDawn = false;
})

canvas.addEventListener('mousemove', function(e) {
    if (isMouseDawn) {
        context.fillStyle = 'red';
        context.strokeStyle = 'red';
        context.lineWidth = d.pixel;

        context.lineTo(e.offsetX, e.offsetY);
        context.stroke();

        context.beginPath();
        context.arc(e.offsetX, e.offsetY, d.pixel / 2, 0, Math.PI * 2);
        context.fill();

        context.beginPath();
        context.moveTo(e.offsetX, e.offsetY);
    }
})



document.addEventListener('keypress', function (e) {
    if (e.key.toLowerCase() == 'c') {
        d.clear();
    }

    if (e.key.toLowerCase() == 'v') {
        vector = d.calculate(true);

        //train
        if (confirm('Positive?')) {
            train_data.push({
                input: vector,
                output: { positive: 1 }
            });
        } else {
            train_data.push({
                input: vector,
                output: { negative: 1 }
            });
        }
        // console.log('test');
        console.log(train_data);
    }

    if (e.key.toLowerCase() == 'b') {
        net = new brain.NeuralNetwork();
        net.train(train_data, { log: true });

        const result = brain.likely(d.calculate(), net);
        // alert(result);
        let resButton = document.querySelector(`button[data-parameter="${result}"]`);
        resButton.classList.add("result-button");
    }
});