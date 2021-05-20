let clear = document.getElementById("clear");
let size = document.getElementById("size");
let pressure = document.getElementById("pressure");
let stampPressure = document.getElementById("stampPressure");
let color1 = document.getElementById("color1");
const toolNames = ["clear", "pressure", "stampPressure", "color1", "size"];

function showElements(elts) {
    for (let toolName of toolNames) {
        if (elts[toolName]) {
            document.getElementById(toolName + "Tool").style.display = "block";
        }
        else {
            document.getElementById(toolName + "Tool").style.display = "none";
        }
    }
    if (elts.stampCanvas) {
        stampCanvas.style.display = "block";
    }
    else {
        stampCanvas.style.display = "none";
    }
}

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
    stampCanvas.width = 200;
    stampCanvas.height = 200;
}

resizeCanvases();
window.onresize = resizeCanvases;
showElements({clear: true, pressure: true, color1: true, size: true});

let brush = new WickBrush({
    canvas: brushCanvas1,
    debugCanvas: debugCanvas,
});
let brush2 = new WickBrush({
    canvas: stampCanvas,
})

let smoothBrushButton = document.getElementById("smoothBrush");
let tireBrushButton = document.getElementById("tireBrush");
let stampBrushButton = document.getElementById("stampBrush");

smoothBrushButton.onclick = function() {
    brush.canvas = brushCanvas1;
    brush.brushTip = defaultBrush;
    showElements({clear: true, pressure: true, color1: true, size: true})
}

tireBrushButton.onclick = function() {
    brush.canvas = brushCanvas1;
    brush.brushTip = tireTip;
    showElements({clear: true, color1: true, size: true});
}

stampBrushButton.onclick = function() {
    brush.canvas = brushCanvas1;
    brush.brushTip = stampTip;
    brush.stampCanvas = stampCanvas;
    showElements({clear: true, pressure: true, stampPressure: true, color1: true, stampCanvas: true, size: true})
}

clear.onclick = function() {
    for (let canvas of canvases) {
        let ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}

size.onchange = function(e) {
    brush.size = e.target.value;
    brush2.size = e.target.value;
}

let force = 1;
Pressure.set(brushCanvas1, {
    change: function(f, event){
        force = f;
    }
});
pressure.onchange = function(e) {
    if (e.target.checked) {
        brush.onDown = function() {
            brush.change({pressure: 0});
        }
        brush.onDraw = function() {
            brush.change({pressure: Math.max(force, .03)});
        }
    }
    else {
        brush.onDown = null;
        brush.onDraw = null;
        brush.pressure = 1;
    }
}

let stampForce = 1;
Pressure.set(stampCanvas, {
    change: function(f, event){
        stampForce = f;
    }
});
stampPressure.onchange = function(e) {
    if (e.target.checked) {
        brush2.onDown = function() {
            brush2.change({pressure: 0});
        }
        brush2.onDraw = function() {
            brush2.change({pressure: Math.max(stampForce, .03)});
        }
    }
    else {
        brush2.onDown = null;
        brush2.onDraw = null;
        brush2.pressure = 1;
    }
}

color1.onchange = function(e) {
    brush.fillStyle = e.target.value;
    brush2.fillStyle = e.target.value;
}