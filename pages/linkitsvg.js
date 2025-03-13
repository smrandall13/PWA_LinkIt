const LINKITSVG = {
	simulation: null,
	nodes: null,
	svg: null,
	group: null,
	zoom: null,
	dragging: false,
	width: 0,
	height: 0,
	repulsion: -300,
	timeouts: [],
	center: function (entityID = '') {
		const group = LINKITSVG.group; // Get the SVG group element
		if (group.empty()) return; // Exit if no <g> is found

		LINKITSVG.svg.call(LINKITSVG.zoom);
		const transform = d3.zoomTransform(LINKITSVG.svg.node()); // Get current zoom transform
		let newX = LINKITSVG.width / 2;
		let newY = LINKITSVG.height / 2;

		if (entityID) {
			const selectedNode = LINKITSVG.nodes.filter((d) => d.id === entityID);
			// if (selectedNode.empty()) break; // Exit if the node is not found
			const nodeData = selectedNode.datum(); // Get node data (position)

			// Calculate new translation to center the node
			newX = LINKITSVG.width / 2 - nodeData.x * transform.k;
			newY = LINKITSVG.height / 2 - nodeData.y * transform.k;

			// Smoothly transition to the new position
			LINKITSVG.svg.transition().duration(750).call(LINKITSVG.zoom.transform, d3.zoomIdentity.translate(newX, newY).scale(transform.k));
		}
	},
	drag: {
		start: function (event, d) {
			LINKITSVG.dragging = false;
			if (!event.active) LINKITSVG.simulation.alphaTarget(0.3).restart();
			d.fx = d.x;
			d.fy = d.y;
		},
		drag: function (event, d) {
			LINKITSVG.dragging = true;
			d.fx = event.x;
			d.fy = event.y;
		},
		end: function (event, d) {
			if (!event.active) LINKITSVG.simulation.alphaTarget(0);
			d.fx = null;
			d.fy = null;
			LINKITSVG.dragging = false;
			LINKITSVG.save();
		},
	},
	save: function () {
		clearTimeout(LINKITSVG.timeouts['save']);
		LINKITSVG.timeouts['save'] = setTimeout(() => {
			const nodePositions = LINKITSVG.nodes.data().map((d) => ({
				id: d.id,
				x: d.x,
				y: d.y,
			}));
			STORAGE.set('linkit-nodes', JSON.stringify(nodePositions));
		}, 3000);
	},
	load: function () {
		const nodePositions = JSON.parse(STORAGE.get('linkit-nodes'));
		if (nodePositions) {
			// Assign saved positions to nodes
			LINKIT.settings.entities.forEach((node) => {
				const savedNode = nodePositions.find((n) => n.id === node.id);
				if (savedNode) {
					node.x = savedNode.x;
					node.y = savedNode.y;
					node.fx = savedNode.x; // Fix position to avoid simulation override
					node.fy = savedNode.y;
				}
			});
		}
	},
	reset: function () {
		STORAGE.reset('linkit-nodes');
	},
	init: function () {
		// Data
		const data = {
			nodes: [...LINKIT.settings.entities],
			links: [...LINKIT.settings.relationships],
		};

		const svgContainer = document.getElementById('app-content-container');
		let width = svgContainer.offsetWidth || svgContainer.clientWidth;
		let height = svgContainer.offsetHeight || svgContainer.clientHeight; //.append('svg').attr('width', width).attr('height', height);

		const svg = d3.select('#linkit-visual-2d').append('svg').attr('width', width).attr('height', height);

		let nodeDistanceX = width / 6;

		// Apply the gradient as an SVG background
		svg.append('rect').attr('width', width).attr('height', height).style('fill', 'url(#bgGradient)');

		// Group
		const group = svg.append('g').attr('class', 'graph-group');

		const link = group.selectAll('.linkit-svg-link').data(data.links).enter().append('line').attr('class', 'linkit-svg-link');

		const linkLabels = group
			.selectAll('.linkit-svg-link-label')
			.data(data.links)
			.enter()
			.append('text')
			.attr('class', 'linkit-svg-link-label')
			.attr('text-anchor', 'middle')
			.text((d) => d.type);

		// Node Attributes
		const node = group.selectAll('.linkit-svg-node').data(data.nodes).enter().append('g').attr('class', 'linkit-svg-node');

		// Drag Handlers
		node.call(d3.drag().on('start', LINKITSVG.drag.start).on('drag', LINKITSVG.drag.drag).on('end', LINKITSVG.drag.end));

		// Click Handlers
		node.on('click', function (event, d) {
			if (LINKITSVG.dragging) return;
			// LINKITSVG.center(d.id);
			LINKIT.entity.select(d.id);
		});

		// Hover Handlers
		node
			.on('mouseover', function (event, d) {
				d3.select(this).classed('linkit-svg-hover', true);
				link.filter((l) => l.source === d || l.target === d).classed('linkit-svg-hover', true); // Select connected links
				linkLabels.filter((l) => l.source === d || l.target === d).classed('linkit-svg-hover', true); // Select connected links
			})
			.on('mouseout', function (event, d) {
				d3.select(this).classed('linkit-svg-hover', false); // Reset border
				link.filter((l) => l.source === d || l.target === d).classed('linkit-svg-hover', false);
				linkLabels.filter((l) => l.source === d || l.target === d).classed('linkit-svg-hover', false); // Select connected links
			});
		// Node Elements
		node.append('circle').attr('r', 10);
		node
			.append('text')
			.attr('dx', 12)
			.attr('dy', 4)
			.text((d) => d.name);

		const zoom = d3
			.zoom()
			.scaleExtent([0.5, 3]) // Allow zooming in/out
			.on('zoom', (event) => {
				group.attr('transform', event.transform);
			});

		// Center Nodes
		data.nodes.forEach((node) => {
			node.x = width / 2 + (Math.random() - 0.5) * 50; // Small random offset to avoid overlap
			node.y = height / 2 + (Math.random() - 0.5) * 50;
		});

		LINKITSVG.zoom = zoom;
		LINKITSVG.width = width;
		LINKITSVG.height = height;
		LINKITSVG.svg = svg;
		LINKITSVG.group = group;
		LINKITSVG.nodes = node;

		// Simulation
		LINKITSVG.simulation = d3
			.forceSimulation(data.nodes)
			.force(
				'link',
				d3
					.forceLink(data.links)
					.id((d) => d.id)
					.distance(nodeDistanceX)
			)
			.force('charge', d3.forceManyBody().strength(LINKITSVG.repulsion))
			.force('center', d3.forceCenter(width / 2, height / 2).strength(0.05))
			.force('collision', d3.forceCollide().radius(50))
			.alpha(0.3) // Set initial alpha
			.alphaDecay(0.05); // Slow down animation to prevent abrupt motion

		LINKITSVG.simulation.on('tick', () => {
			link
				.attr('x1', (d) => d.source.x)
				.attr('y1', (d) => d.source.y)
				.attr('x2', (d) => d.target.x)
				.attr('y2', (d) => d.target.y);

			linkLabels.attr('x', (d) => (d.source.x + d.target.x) / 2).attr('y', (d) => (d.source.y + d.target.y) / 2);

			node.attr('transform', (d) => `translate(${d.x},${d.y})`);
		});

		LINKITSVG.center();

		// setTimeout(, 1000);
		LINKITSVG.load();
		removeClass('linkit-visual-2d', 'app-hidden');
	},
};
