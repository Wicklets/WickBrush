//TODO: put defaultTip in a different file and package it all together
function defaultTip(b) {
    let left, right, top, bottom;
    let r0 = b.pPressure * b.pSize / 2;
    let r1 = b.pressure * b.size / 2;
    let ctx = b.canvas.getContext('2d');
    let pts = b.smoothNodes;
    ctx.fillStyle = b.fillStyle;
    for (let pt of pts) {
        let r = pt.t * r1 + (1 - pt.t) * r0;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, r, 0, 2 * Math.PI);
        ctx.fill();
        left = left === undefined ? pt.x - r : Math.min(left, pt.x - r);
        right = right === undefined ? pt.x + r : Math.max(right, pt.x + r);
        top = top === undefined ? pt.y - r : Math.min(top, pt.y - r);
        bottom = bottom === undefined ? pt.y + r : Math.max(bottom, pt.y + r);
    }
    return {left: left, right: right, top: top, bottom: bottom};
}

class WickBrush {
    /**
    * Creates a WickBrush.
    * @param {object} args - The arguments {canvas, brushTip, smoothing, numNodes, tension, smoothNodesSpacing, includeSmoothNodes, interval, catchUp, size, pressure, fillStyle, strokeStyle, onDown, onDraw, onMove, onUp, onStrokeFinished, debug, debugCanvas, manualEvents}
    * @returns {WickBrush} - The created brush
    */
    constructor(args) {
        if (!args) args = {};

        this.bounds = {left: null, right: null, top: null, bottom: null};

        this.changeNames = ['node', 'springNodes', 'smoothNodes', 'size', 'pressure', 'fillStyle', 'strokeStyle'];
        this.handlers = {};
        
        this.numNodes = args.numNodes || 10;
        this.tension = args.tension || 10;
        this.smoothing = args.smoothing || 50;
        this.catchUp = args.catchUp === undefined ? 
            true : 
            args.catchUp;
        this.includeSmoothNodes = args.includeSmoothNodes === undefined ? 
            true : 
            args.includeSmoothNodes;
        this.smoothNodesSpacing = args.smoothNodesSpacing === undefined ? 
            2 :
            args.smoothNodesSpacing;
        this.interval = args.interval || 10;
        
        this.size = args.size || 40;
        this.pressure = 1;
        this.fillStyle = args.fillStyle || '0x000000';
        this.strokeStyle = args.strokeStyle || '0x000000';

        this.onDown = args.onDown;
        this.onDraw = args.onDraw;
        this.onMove = args.onMove;
        this.onUp = args.onUp;
        this.onStrokeFinished = args.onStrokeFinished;

        this.drawing = false;

        this.brushTip = args.brushTip || defaultTip;
        
        // TODO: manualEvents == true should prevent events from being attached to canvas

        let self = this;
        this.handlers.canvas = function(e) {
            self.down(e);
        };
        this.canvas = args.canvas;

        this.debug = args.debug;
        // TODO: getter/setter for debugCanvas
        this.debugCanvas = args.debugCanvas;
        if (this.debugCanvas) {
            this.debugCanvas.style.pointerEvents = 'none';
        }
    }

    set smoothing(s) {
        this._smoothing = s;
        s = Math.max(0, Math.min(s, 100));
        this.numNodes = Math.floor(s / 10);
        this.tension = (100 - s * 0.90);
    }

    get smoothing() {
        return this._smoothing;
    }

    set numNodes(n) {
        this._numNodes = Math.max(1, Math.floor(n));
    }

    get numNodes() {
        return this._numNodes;
    }

    set tension(t) {
        this._tension = Math.max(1, Math.min(t, 100));
    }
    
    get tension() {
        return this._tension;
    }

    set interval(i) {
        this._interval = i;
        if (this.handlers.interval) {
            clearInterval(this.handlers.interval);

            let drawHandler = function() {self.draw()};
            this.handlers.interval = setInterval(drawHandler, this.interval);
        }
    }

    get interval() {
        return this._interval;
    }

    /**
     * @param {Boolean} b - Whether to draw on the debugCanvas or not.
     */
    set debug(b) {
        if (b) {
            this._debug = true;
        } else {
            if (this.debugCanvas) {
                let ctx = this.debugCanvas.getContext('2d');
                ctx.clearRect(0,0,this.debugCanvas.width, this.debugCanvas.height);
            }
            this._debug = false;
        }
    }

    /**
     * @returns {Boolean} - Whether drawing on the debugCanvas or not.
     */
    get debug() {
        return this._debug;
    }

    /**
     * @param {canvas} canvas - The HTML Canvas to draw on.
     */
    set canvas(canvas) {
        if (this._canvas) {
            this._canvas.removeEventListener('onpointerdown', this.handlers.canvas, false);
            let oldRect = this._canvas.getBoundingClientRect();
            let newRect = canvas.getBoundingClientRect();
            this.mouseX = this.mouseX + oldRect.left - newRect.left;
            this.mouseY = this.mouseY + oldRect.top - newRect.top;
        }
        this._canvas = canvas;
        this._canvas.addEventListener(
            'pointerdown',
            this.handlers.canvas,
            false);
    }

    /**
     * @returns {canvas} - The HTML Canvas to be drawn on.
     */
    get canvas() {
        return this._canvas;
    }

    /**
     * @param {object} rect - {left, right, top, bottom} rectangle to include in brush.bounds.
     */
    updateBounds(rect) {
        let l, r, t, b;
        if (!rect || 
            isNaN(rect.left) ||
            isNaN(rect.right) ||
            isNaN(rect.top) ||
            isNaN(rect.bottom)) {
            l = this.node.x;
            r = this.node.x;
            t = this.node.y;
            b = this.node.y; 
        }
        else {
            l = rect.left;
            r = rect.right;
            t = rect.top;
            b = rect.bottom;
        }

        if (this.bounds.left !== null) {
            this.bounds.left = Math.min(this.bounds.left, l);
            this.bounds.right = Math.max(this.bounds.right, r);
            this.bounds.top = Math.min(this.bounds.top, t);
            this.bounds.bottom = Math.max(this.bounds.bottom, b);
        }
        else {
            this.bounds.left = l;
            this.bounds.right = r;
            this.bounds.top = t;
            this.bounds.bottom = b;
        }
    }

    /**
     * @param {object} properties - An object in the form {property: value}. Each brush.property is set with value, and each property is added to brush.changeNames so its previous value is kept track of in brush.pProperty.
     */
    change(properties) {
        for (const property in properties) {
            let name = property;
            if (this.changeNames.indexOf(name) === -1) this.changeNames.push(name);
            //TODO: add protected values that can't be changed?
            //would prolly just be node values and bounds
            this[name] = properties[property];
        }
    }

    /**
     * Returns an object containing the current value of all the properties listed in argNames. If argNames is not specified, then canvas and all the properties in brush.changeNames are returned.
     * @param {Array} argNames - (Optional) A list of properties to be returned.
     * @returns {object} - An object filled with arguments (to be used in a BrushTip function) {property: value}
     */
    getArgs(argNames) {
        if (argNames) {
            let args = {};
            for (let i = 0; i < argNames.length; i++) {
                let name = argNames[i];
                args[name] = this[name];
            }
            return args;
        }
        else {
            let args = {canvas: this.canvas};
            for (let i = 0; i < this.changeNames.length; i++) {
                let name = this.changeNames[i];
                let pName = 'p' + name[0].toUpperCase() + name.substring(1);
                args[name] = this[name];
                args[pName] = this[pName];
            }
            return args;
        }
    }

    /**
     * Set all the pProperty values.
     */
    updatePrevious() {
        for (let n = 0; n < this.changeNames.length; n++) {
            let name = this.changeNames[n];
            let pName = 'p' + name[0].toUpperCase() + name.substring(1);   
            this[pName] = this[name];
        }
    }

    /**
     * Calculates smoothNodes between nodes[-3] and nodes[-2] using a Catmull-Rom spline with nodes[-4] and nodes[-1] as control points.
     */
    calculateSmoothNodes() {
        let pSmoothNode = null;
        if (this.smoothNodes && this.smoothNodes.length) pSmoothNode = this.smoothNodes[this.smoothNodes.length - 1];
        this.smoothNodes = [];
        let l = this.nodes.length;
        if (l < 4) return;
        let p0 = this.nodes[l - 4];
        let p1 = this.nodes[l - 3];
        let p2 = this.nodes[l - 2];
        let p3 = this.nodes[l - 1];
        let d01 = Math.sqrt(Math.pow(p1.x - p0.x, 2) + Math.pow(p1.y - p0.y, 2));
        let d12 = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
        let d23 = Math.sqrt(Math.pow(p3.x - p2.x, 2) + Math.pow(p3.y - p2.y, 2));
        if (d01 > d12) {
            let f = d12 / d01;
            p0 = {
                x: p1.x * (1 - f) + p0.x * f,
                y: p1.y * (1 - f) + p0.y * f
            }
        }
        if (d23 > d12) {
            let f = d12 / d23;
            p3 = {
                x: p2.x * (1 - f) + p3.x * f,
                y: p2.y * (1 - f) + p3.y * f
            }
        }
        let t = 0;
        while (t < 1) {
            let p = {
                x: 0.5 * (
                    2 * p1.x + 
                    (-p0.x + p2.x) * t +
                    (2*p0.x - 5*p1.x + 4*p2.x - p3.x) * t*t +
                    (-p0.x + 3*p1.x - 3*p2.x + p3.x) * t*t*t
                    ),
                y: 0.5 * (
                    2 * p1.y + 
                    (-p0.y + p2.y) * t +
                    (2*p0.y - 5*p1.y + 4*p2.y - p3.y) * t*t +
                    (-p0.y + 3*p1.y - 3*p2.y + p3.y) * t*t*t
                    ),
                t: t    
            };
            this.smoothNodes.push(p);

            let dpdt =  {
                x: 0.5 * (
                    (-p0.x + p2.x) +
                    (4*p0.x - 10*p1.x + 8*p2.x - 2*p3.x) * t +
                    (-3*p0.x + 9*p1.x - 9*p2.x + 3*p3.x) * t*t
                    ),
                y: 0.5 * (
                    (-p0.y + p2.y) +
                    (4*p0.y - 10*p1.y + 8*p2.y - 2*p3.y) * t +
                    (-3*p0.y + 9*p1.y - 9*p2.y + 3*p3.y) * t*t
                    ),
            }
            let dpdtMag = Math.sqrt(dpdt.x * dpdt.x + dpdt.y * dpdt.y);
            let dpMag = this.smoothNodesSpacing;
            let dt = dpMag / dpdtMag;
            t += dt;
        }
    }

    /**
     * Start the stroke. Initializes bounds, drawing, springNodes, nodes, all the pProperties. Calls onDown. Sets up move handler, draw interval, and up handler.
     * @param {Event} e - The canvas pointerdown event
     */
    down(e) {
        //set mouse position
        let rect = this.canvas.getBoundingClientRect();
        this.mouseX = e.clientX - rect.left;
        this.mouseY = e.clientY - rect.top;

        //initialize bounds
        this.bounds = {left: null, right: null, top: null, bottom: null};
        this.drawing = true;

        //initialize springNodes
        this.springNodes = [];
        for (let n = 0; n < this.numNodes; n++) {
            this.springNodes.push({
                x: this.mouseX,
                y: this.mouseY
            });
        }
        this.node = this.springNodes[this.springNodes.length - 1];
        this.nodes = [this.node];
        this.calculateSmoothNodes();

        //initialize previous values to null
        for (let i = 0; i < this.changeNames.length; i++) {
            let name = this.changeNames[i];
            let pName = 'p' + name[0].toUpperCase() + name.substring(1);   
            this[pName] = null;
        }

        this.onDown && this.onDown(this, e);
        let bound = this.brushTip(this);
        this.updateBounds(bound);
        this.debug && this.drawDebug(bound);
        
        // Setup events to move brush, draw brush, and lift brush
        let self = this;
        let moveHandler = function(e) {self.move(e)};
        let upHandler = function(e) {self.up(e)};
        this.handlers.pointermove = moveHandler;
        this.handlers.pointerup = upHandler;
        window.addEventListener('pointermove', moveHandler);
        window.addEventListener('pointerup', upHandler);
        let drawHandler = function() {self.draw()};
        this.handlers.interval = setInterval(drawHandler, this.interval);
    }

    /**
     * Called by the draw interval. Updates pProperties, springNodes, nodes, smoothNodes. Calls onDraw and brushTip. Updates bounds. Draws debug info.
     */
    draw() {
        if (!this.drawing) return;
        
        this.updatePrevious();

        //update springNodes
        let newSpringNodes = []; // needs to be a new list so pNodes is not just a shallow copy
        let lastNode = null;
        for (let node of this.springNodes) {
            if (lastNode) {
                //lerp
                let t = 1 - this.tension / 100;
                //again, needs to be new object so it's not just a shallow copy
                newSpringNodes.push({
                    x: (1 - t) * lastNode.x + t * node.x, 
                    y: (1 - t) * lastNode.y + t * node.y
                });
            }
            else {
                newSpringNodes.push({
                    x: this.mouseX,
                    y: this.mouseY
                });
            }
            lastNode = node;
        }
        this.springNodes = newSpringNodes;
        this.node = this.springNodes[this.springNodes.length - 1];
        this.nodes.push(this.node);

        if (this.includeSmoothNodes) this.calculateSmoothNodes();
        
        this.onDraw && this.onDraw(this);
        let bound = this.brushTip(this);
        this.updateBounds(bound);
        this.debug && this.drawDebug(bound);
    }

    /**
     * Called by the window move handler. Updates the location of the mouse. 
     */
    move(e) {
        let r = false;
        if (this.onMove) {
            r = this.onMove(this, e);
        }

        if (!r) {
            let rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
        }
    }

    /**
     * Lifts the pen. Calls onUp. Performs catchUp. Calculates bounds. Sets drawing to false. Cleans up move handler, up handler, draw interval. Calls onStrokeFinished.
     * @param {Event} e - canvas pointerup event. 
     */
    up(e) {
        this.onUp && this.onUp(this, e);
        
        if (this.catchUp) {
            while(this.springNodes.length >= 2) {
                this.updatePrevious();

                this.springNodes.pop();
                this.node = this.springNodes[this.springNodes.length - 1]; //TODO: needs to be deep copy
                this.nodes.push(this.node);

                this.calculateSmoothNodes();

                let bound = this.brushTip(this);
                this.updateBounds(bound);
                this.debug && this.drawDebug(bound);
            }
        }

        this.drawing = false;

        window.removeEventListener('pointermove', this.handlers.pointermove);
        window.removeEventListener('pointerup', this.handlers.pointerup);
        clearInterval(this.handlers.interval);

        this.onStrokeFinished && this.onStrokeFinished(this);
    }

    /**
     * Cancels the current stroke. Sets drawing to false. Removes move handler, up handler, draw interval.
     */
    cancel() {
        this.drawing = false;

        window.removeEventListener('pointermove', this.handlers.pointermove);
        window.removeEventListener('pointerup', this.handlers.pointerup);
        clearInterval(this.handlers.interval);
    }

    /**
     * Draws debug info on debugCanvas.
     */
    drawDebug() {
        if (!this.debugCanvas) return;
        let ctx = this.debugCanvas.getContext('2d');
        ctx.clearRect(0, 0, this.debugCanvas.width, this.debugCanvas.height);
        
        //bound
        let bound = this.bounds;
        ctx.strokeStyle = '#FF0000';
        if (bound) {
            
            ctx.beginPath();
            ctx.rect(bound.left, 
                bound.top, 
                bound.right - bound.left, 
                bound.bottom - bound.top);
            ctx.stroke();
        }
        //bounds
        ctx.beginPath();
        ctx.rect(this.bounds.left,
            this.bounds.top,
            this.bounds.right - this.bounds.left,
            this.bounds.bottom - this.bounds.top);
        ctx.stroke();

        //springNodes
        ctx.strokeStyle = '#00FF00';
        for (let n = 0; n < this.springNodes.length; n++) {
            let node = this.springNodes[n];
            
            ctx.beginPath();
            ctx.arc(node.x, node.y,5,0,2*Math.PI);
            ctx.stroke();
        }

        //smoothNodes
        ctx.strokeStyle = '#00FFFF';
        for (let n = 0; n < this.smoothNodes.length; n++) {
            let node = this.smoothNodes[n];

            ctx.beginPath();
            ctx.arc(node.x, node.y,10,0,2*Math.PI);
            ctx.stroke();
        }
    }

    /**
     * Should only call this if you're not using the brush any more. Cancels current stroke, removes down handler.
     */
    cleanup() {
        if (this.drawing) this.cancel();

        this.canvas.removeEventListener('onpointerdown', this.down, false);
    }
}