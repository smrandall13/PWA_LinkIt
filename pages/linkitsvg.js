const LINKITSVG = {
	simulation: null,
	init: function () {
		// Data
		const data = {
			nodes: [...LINKIT.settings.entities],
			links: [...LINKIT.settings.relationships],
		};

		const svg = d3.select('#linkit-visual-2d');
		const svgContainer = document.getElementById('app-content-container');
		let width = svgContainer.offsetWidth || svgContainer.clientWidth;
		let height = svgContainer.offsetHeight || svgContainer.clientHeight; //.append('svg').attr('width', width).attr('height', height);

		LINKITSVG.simulation = d3
			.forceSimulation(data.nodes)
			.force(
				'link',
				d3
					.forceLink(data.links)
					.id((d) => d.id)
					.distance(150)
			)
			.force('charge', d3.forceManyBody().strength(-400))
			.force('center', d3.forceCenter(width / 2, height / 2));

		const link = svg.selectAll('.link').data(data.links).enter().append('line').attr('class', 'link');

		const node = svg.selectAll('.node').data(data.nodes).enter().append('g').attr('class', 'node').call(d3.drag().on('start', LINKITSVG.dragStarted).on('drag', LINKITSVG.dragged).on('end', LINKITSVG.dragEnded));

		node.append('circle').attr('r', 10);

		node
			.append('text')
			.attr('dx', 12)
			.attr('dy', 4)
			.text((d) => d.name);

		LINKITSVG.simulation.on('tick', () => {
			link
				.attr('x1', (d) => d.source.x)
				.attr('y1', (d) => d.source.y)
				.attr('x2', (d) => d.target.x)
				.attr('y2', (d) => d.target.y);

			node.attr('transform', (d) => `translate(${d.x},${d.y})`);
		});

		removeClass('linkit-visual-2d', 'app-hidden');
	},
	dragStarted(event, d) {
		if (!event.active) LINKITSVG.simulation.alphaTarget(0.3).restart();
		d.fx = d.x;
		d.fy = d.y;
	},
	dragged(event, d) {
		d.fx = event.x;
		d.fy = event.y;
	},
	dragEnded(event, d) {
		if (!event.active) LINKITSVG.simulation.alphaTarget(0);
		d.fx = null;
		d.fy = null;
	},
};
