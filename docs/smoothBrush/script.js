let brushCanvas = document.getElementById("brushCanvas");
let debugCanvas = document.getElementById("debugCanvas");

brushCanvas.width = window.innerWidth;
brushCanvas.height = window.innerHeight;
debugCanvas.width = window.innerWidth;
debugCanvas.height = window.innerHeight;

let brush = new WickBrush({
    canvas: brushCanvas,
    debugCanvas: debugCanvas,
});

brush.onDown = function(b) {
    b.change({pressure: 0.03});
}

Pressure.set(brushCanvas, {
    change: function(force, event){
        brush.change({pressure: Math.max(force, .03)});
    }
});