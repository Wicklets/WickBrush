function basicLineTip(brush) {
    if (!brush.pNode) return;
	let ctx = brush.canvas.getContext('2d');
	ctx.beginPath();
	ctx.moveTo(brush.pNode.x, brush.pNode.y);
	ctx.lineTo(brush.node.x, brush.node.y);
	ctx.stroke();
    console.log(brush.node, brush.pNode);
}