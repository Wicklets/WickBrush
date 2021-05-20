function basicSmoothTip(brush) {
	let ctx = brush.canvas.getContext('2d');
	for (let node of brush.smoothNodes) {
		ctx.beginPath();
		ctx.arc(node.x, node.y, 10, 0, 2 * Math.PI);
		ctx.fill();
	}
}