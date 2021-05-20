function squareTip(b) {
    let left, right, top, bottom;
    let r0 = b.pPressure * b.pSize / 2;
    let r1 = b.pressure * b.size / 2;
    let ctx = b.canvas.getContext('2d');
    let pts = b.smoothNodes;
    ctx.fillStyle = b.fillStyle;
    for (let pt of pts) {
        let r = pt.t * r1 + (1 - pt.t) * r0;
        ctx.beginPath();
        ctx.moveTo(pt.x - r, pt.y - r);
        ctx.rect(pt.x - r, pt.y - r, 2 * r, 2 * r);
        ctx.fill();
        left = left === undefined ? pt.x - r : Math.min(left, pt.x - r);
        right = right === undefined ? pt.x + r : Math.max(right, pt.x + r);
        top = top === undefined ? pt.y - r : Math.min(top, pt.y - r);
        bottom = bottom === undefined ? pt.y + r : Math.max(bottom, pt.y + r);
    }
    return {left: left, right: right, top: top, bottom: bottom};
}