let brushCanvas = document.getElementById("brushCanvas");
let debugCanvas = document.getElementById("debugCanvas");

brushCanvas.width = window.innerWidth;
brushCanvas.height = window.innerHeight;
debugCanvas.width = window.innerWidth;
debugCanvas.height = window.innerHeight;

// let brush = new WickBrush({
//     brushTip: tire,
//     numNodes: 10, 
//     tension: 25, 
//     canvas: stampCanvas, 
//     debug: false, 
//     debugCanvas: debugCanvas,
// });

// brush.onDown = function(b) {
//     b.change({pressure: 0.03});
// }
// Pressure.set(brushCanvas, {
//     change: function(force, event){
//         brush.change({pressure: Math.max(force, .03)});
//     }
// });

let stampCanvas = document.getElementById("stampCanvas");
stampCanvas.style.left = window.innerWidth - 198 + "px";
stampCanvas.style.top = window.innerHeight - 198 + "px";
stampCanvas.width = 196;
stampCanvas.height = 196;

let brush = new WickBrush({
    size: 10,
    numNodes: 1, 
    tension: 75, 
    canvas: stampCanvas, 
    debug: false, 
    debugCanvas: debugCanvas,
});

let stampBrush = new WickBrush({
    brushTip: stampTip,
    size: 50,
    numNodes: 1, 
    tension: 75, 
    canvas: brushCanvas, 
    debug: false, 
    debugCanvas: debugCanvas,
});
stampBrush.stampCanvas = stampCanvas;
let ctx = brushCanvas.getContext('2d');
ctx.beginPath();
ctx.moveTo(brushCanvas.width-200,brushCanvas.height-200);
ctx.lineTo(brushCanvas.width-200,brushCanvas.width);
ctx.lineTo(brushCanvas.width,brushCanvas.height);
ctx.lineTo(brushCanvas.width,brushCanvas.height-200);
ctx.closePath();
ctx.stroke();
