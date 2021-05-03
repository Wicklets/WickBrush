let clear = document.getElementById("clear");
let pressure = document.getElementById("pressure");
const toolNames = ["clear", "pressure"];

let brushCanvas2 = document.getElementById("brushCanvas2");
let brushCanvas1 = document.getElementById("brushCanvas1");
let stampCanvas = document.getElementById("stampCanvas");
let debugCanvas = document.getElementById("debugCanvas");
const canvases = [brushCanvas1, brushCanvas2, stampCanvas, debugCanvas];

function resizeCanvases() {
    for (let canvas of canvases) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
}

resizeCanvases();
window.onresize = resizeCanvases;

debugCanvas.style.display = "none";

clear.onclick = function() {
    for (let canvas of canvases) {
        let ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}

let smoothBrushButton = document.getElementById("smoothBrush");
let tireBrushButton = document.getElementById("tireBrush");

let brush = new WickBrush({
    canvas: brushCanvas1,
    debugCanvas: debugCanvas,
});

smoothBrushButton.onclick = function() {
    brush.canvas = brushCanvas1;
    brush.brushTip = defaultBrush;
    showElements({clear: true, pressure: true, fillColor: true,})
}

tireBrushButton.onclick = function() {
    brush.canvas = brushCanvas1;
    brush.brushTip = tire;
    showElements({clear: true, fillColor: true})
}

function showElements(elts) {
    for (let toolName of toolNames) {
        if (elts[toolName]) {
            document.getElementById(toolName + "Tool").style.display = "block";
        }
        else {
            document.getElementById(toolName + "Tool").style.display = "none";
        }
    }
}