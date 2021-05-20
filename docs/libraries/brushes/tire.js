function add(x1, x2) {
    return {x: x1.x + x2.x, y: x1.y + x2.y};
}

function mag(x) {
    return Math.sqrt(x.x*x.x + x.y*x.y);
}

function scale(a, x) {
    return {x: a*x.x, y: a*x.y};
}

function rot(x) {
    return {x: -x.y, y: x.x};
}

function tireTip(b) {
    if (!b.tireTime) b.tireTime = 0;

    let tireLength = b.size;
    let tireWidth = b.size;

    //let left, right, top, bottom;

    let r = b.size;
    let ctx = b.canvas.getContext('2d');
    ctx.fillStyle = b.fillStyle;
    ctx.strokeStyle = b.fillStyle;
    //tack on a few previous nodes to give ourselves some
    //incoming velocity information for the first few nodes
    if (b.pSmoothNodes) {
        let l = b.pSmoothNodes.length;
        l >= 1 && b.smoothNodes.unshift(b.pSmoothNodes[l - 1]);
        l >= 2 && b.smoothNodes.unshift(b.pSmoothNodes[l - 2]);
        l >= 3 && b.smoothNodes.unshift(b.pSmoothNodes[l - 3]);
    }
    let pts = b.smoothNodes;
    
    for (let p = 3; p < pts.length; p++) {
        
        let p0 = pts[p-3];
        let p1 = pts[p-2];
        let p2 = pts[p-1]
        let p3 = pts[p];

        let p12 = add(p2, scale(-1, p1));
        let dTireTime = mag(p12);
        let t1 = b.tireTime;
        let t2 = b.tireTime + dTireTime;
        b.tireTime = t2;

        let dp1 = add(p2, scale(-1, p0));
        let dp1Mag = mag(dp1);
        let dp2 = add(p3, scale(-1, p1));
        let dp2Mag = mag(dp2);

        let tp1 = rot(scale(tireWidth/2/dp1Mag, dp1));
        let tp2 = rot(scale(tireWidth/2/dp2Mag, dp2));

        let C0 = add(p1, scale(-1, tp1));
        let C1 = add(p1, tp1);
        let C2 = add(p2, scale(-1, tp2));
        let C3 = add(p2, tp2);

        let t = t1;
        let i = Math.floor(t / tireLength);
        while (t < t2) {
            let nextT = Math.min(t2, (i + 1) * tireLength);

            let T1 = (t - t1) / (t2 - t1);
            let T2 = (nextT - t1) / (t2 - t1);
            
            let c0 = add(scale(1 - T1, C0), scale(T1, C2));
            let c1 = add(scale(1 - T1, C1), scale(T1, C3));
            let c2 = add(scale(1 - T2, C0), scale(T2, C2));
            let c3 = add(scale(1 - T2, C1), scale(T2, C3));
            let c001 = add(scale(2/3, c0), scale(1/3, c1)), 
            c011 = add(scale(1/3, c0), scale(2/3, c1)), 
            c223 = add(scale(2/3, c2), scale(1/3, c3)), 
            c233 = add(scale(1/3, c2), scale(2/3, c3));

            if (i % 2 == 0) {
                //middle tread
                
                ctx.beginPath();
                ctx.moveTo(c001.x, c001.y);
                ctx.lineTo(c011.x, c011.y);
                ctx.lineTo(c233.x, c233.y);
                ctx.lineTo(c223.x, c223.y);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            }
            else {
                //outer treads
                ctx.beginPath();
                ctx.moveTo(c001.x, c001.y);
                ctx.lineTo(c223.x, c223.y);
                ctx.lineTo(c2.x, c2.y);
                ctx.lineTo(c0.x, c0.y);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(c011.x, c011.y);
                ctx.lineTo(c233.x, c233.y);
                ctx.lineTo(c3.x, c3.y);
                ctx.lineTo(c1.x, c1.y);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            }

            t = nextT;
            i = Math.floor(t / tireLength);
        }
    }
}