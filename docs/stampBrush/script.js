let brushCanvas = document.getElementById("brushCanvas");
let stampCanvas = document.getElementById("stampCanvas");

brushCanvas.width = window.innerWidth;
brushCanvas.height = window.innerHeight;
stampCanvas.style.left = window.innerWidth - 198 + "px";
stampCanvas.style.top = window.innerHeight - 198 + "px";
stampCanvas.width = 196;
stampCanvas.height = 196;

let ctx = brushCanvas.getContext('2d');
ctx.beginPath();
ctx.moveTo(brushCanvas.width-200,brushCanvas.height-200);
ctx.lineTo(brushCanvas.width-200,brushCanvas.width);
ctx.lineTo(brushCanvas.width,brushCanvas.height);
ctx.lineTo(brushCanvas.width,brushCanvas.height-200);
ctx.closePath();
ctx.stroke();

let stampBrush = new WickBrush({
    brushTip: stampTip,
    smoothNodesSpacing: 1,
    canvas: brushCanvas,
});

stampBrush.stampCanvas = stampCanvas;

stampBrush.onDown = function(b) {
    b.change({pressure: 0.03});
}

Pressure.set(brushCanvas, {
    change: function(force, event){
        stampBrush.change({pressure: Math.max(force, .03)});
    }
});

let brush = new WickBrush({
    size: 10,
    numNodes: 5, 
    tension: 50, 
    canvas: stampCanvas,
});

brush.onDown = function(b) {
    console.log('a');
    b.change({pressure: 0.03});
}

Pressure.set(stampCanvas, {
    change: function(force, event){
        brush.change({pressure: Math.max(force, .03)});
    }
});