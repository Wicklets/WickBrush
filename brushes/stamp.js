function stampTip(b) {
    let ctx = b.canvas.getContext('2d');
    let s = b.stampCanvas;
    if (!s) return;

    let r = b.size/2 * b.pressure
    
    for (let i = 0; i < b.smoothNodes.length; i++) {
        let node = b.smoothNodes[i];
        ctx.drawImage(s, 0, 0, s.width, s.height, node.x - r, node.y - r, r*2, r*2);
    }
}