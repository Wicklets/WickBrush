//TODO change nodes to springNodes, change allNodes to nodes
//smoothNodes smoothly connects nodes[l - 3] and nodes[l - 2]

function defaultBrush(b) {
    let left, right, top, bottom;
    let r0 = b.pPressure * b.pSize;
    let r1 = b.pressure * b.size;
    let ctx = b.canvas.getContext('2d');
    let pts = b.smoothNodes;
    //ctx.fillColor = b.color;
    for (let pt of pts) {
        let r = pt.t * r1 + (1 - pt.t) * r0;
        ctx.beginPath();
        ctx.moveTo(pt.x, pt.y);
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
    constructor(args) {
        if (!args) args = {};

        this.bounds = {left: null, right: null, top: null, bottom: null};

        this.changeNames = ['node', 'nodes', 'smoothNodes', 'size', 'pressure', 'color'];
        this.handlers = {};
        
        this.smoothing = args.smoothing || 50; //TODO getter/setter
        this.numNodes = args.numNodes || 10; //TODO getter/setter
        this.tension = args.tension || 10;
        this.catchUp = args.catchUp === undefined ? 
            true : 
            args.catchUp;
        this.includeSmoothNodes = args.includeSmoothNodes === undefined ? 
            true : 
            args.includeSmoothNodes; //TODO getter/setter
        this.smoothNodesSpacing = args.smoothNodesSpacing === undefined ? 
            2 :
            args.smoothNodesSpacing; //TODO getter/setter
        this.smoothNodesTime = 0;
        this.interval = args.interval || 10; //TODO getter/setter
        
        this.size = args.size || 40;
        this.pressure = 1;
        this.color = args.fillColor || '0x000000';

        this.onDown = args.onDown;
        this.onDraw = args.onDraw;
        this.onMove = args.onMove;
        this.onUp = args.onUp;
        this.onStrokeFinished = args.onStrokeFinished;

        this.drawing = false;

        this.brushTip = args.brushTip || defaultBrush;
        
        let self = this;
        this.handlers.canvas = function(e) {
            self.down(e);
        };
        this.canvas = args.canvas;

        this.debug = args.debug;
        // TODO: getters and setters for debugCanvas
        this.debugCanvas = args.debugCanvas;
        if (this.debugCanvas) {
            this.debugCanvas.style.pointerEvents = 'none';
        }
    }

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

    get debug() {
        return this._debug;
    }

    set canvas(canvas) {
        this._canvas && this._canvas.removeEventListener('onpointerdown', this.handlers.canvas, false);
        this._canvas = canvas;
        this._canvas.addEventListener(
            'pointerdown',
            this.handlers.canvas,
            false);
    }

    get canvas() {
        return this._canvas;
    }

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

    change(properties) {
        for (const property in properties) {
            let name = property;
            if (this.changeNames.indexOf(name) === -1) this.changeNames.push(name);
            //TODO: add protected values that can't be changed?
            //would prolly just be node nodes smoothNodes
            this[name] = properties[property];
        }
    }

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

    updatePrevious() {
        for (let n = 0; n < this.changeNames.length; n++) {
            let name = this.changeNames[n];
            let pName = 'p' + name[0].toUpperCase() + name.substring(1);   
            this[pName] = this[name];
        }
    }

    calculateSmoothNodes() {
        this.smoothNodes = [];
        let l = this.allNodes.length;
        if (l < 4) return;
        let p0 = this.allNodes[l - 4];
        let p1 = this.allNodes[l - 3];
        let p2 = this.allNodes[l - 2];
        let p3 = this.allNodes[l - 1];
        let t = this.smoothNodesTime;
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
        this.smoothNodesTime = isNaN(t) ? 0 : t % 1;
    }

    down(e) {
        //initialize bounds
        this.bounds = {left: null, right: null, top: null, bottom: null};
        this.drawing = true;

        //initialize nodes
        this.nodes = [];
        let rect = this.canvas.getBoundingClientRect();
        let x = e.clientX - rect.left;
        let y = e.clientY - rect.top;
        for (let n = 0; n < this.numNodes; n++) {
            this.nodes.push({
                x: x,
                y: y
            });
        }
        this.node = this.nodes[this.nodes.length - 1];
        this.allNodes = [this.node];
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

    draw() {
        if (!this.drawing) return;
        
        this.updatePrevious();

        //update nodes
        let newNodes = []; // needs to be a new list so pNodes is not just a shallow copy
        let lastNode = null;
        for (let node of this.nodes) {
            if (lastNode) {
                //lerp
                let t = this.tension / 100;
                //again, needs to be new object so it's not just a shallow copy
                newNodes.push({
                    x: (1 - t) * lastNode.x + t * node.x, 
                    y: (1 - t) * lastNode.y + t * node.y});
            }
            else {
                newNodes.push({
                    x: node.x,
                    y: node.y
                });
            }
            lastNode = node;
        }
        this.nodes = newNodes;
        this.node = this.nodes[this.nodes.length - 1];
        this.allNodes.push(this.node);

        if (this.includeSmoothNodes) this.calculateSmoothNodes();
        
        this.onDraw && this.onDraw(this);
        let bound = this.brushTip(this);
        this.updateBounds(bound);
        this.debug && this.drawDebug(bound);
    }

    move(e) {
        let r = false;
        if (this.onMove) {
            r = this.onMove(this, e);
        }

        if (!r) {
            //update root node
            let rect = this.canvas.getBoundingClientRect();
            this.nodes[0].x = e.clientX - rect.left;
            this.nodes[0].y = e.clientY - rect.top;
        }
    }

    up(e) {
        this.onUp && this.onUp(this, e);
        
        //should catch up go before onUp?
        if (this.catchUp) {
            while(this.nodes.length >= 2) {
                this.updatePrevious();

                this.nodes.pop();
                this.node = this.nodes[this.nodes.length - 1]; //TODO: needs to be deep copy
                this.allNodes.push(this.node);

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

    cancel() {
        this.drawing = false;

        window.removeEventListener('pointermove', this.move);
        window.removeEventListener('pointerup', this.up);
        clearInterval(this.updateId);

        //this.bounds = {x: undefined, y: undefined, width: 0, height: 0};
    }

    drawDebug(bound) {
        if (!this.debugCanvas) return;
        let ctx = this.debugCanvas.getContext('2d');
        ctx.clearRect(0, 0, this.debugCanvas.width, this.debugCanvas.height);
        
        //bound
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

        //nodes
        ctx.strokeStyle = '#00FF00';
        for (let n = 0; n < this.nodes.length; n++) {
            let node = this.nodes[n];
            
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

    cleanup() {
        if (this.drawing) this.cancel();

        this.canvas.removeEventListener('onpointerdown', this.down, false);
    }
}