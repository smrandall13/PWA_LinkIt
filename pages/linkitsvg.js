const LINKITSVG = {
	svgid: 'linkit-visual-2d',
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
	data: null,
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

			// Allow Animation
			d.fx = null;
			d.fy = null;

			// Stop Animation
			// d.fx = event.x;
			// d.fy = event.y;
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
			let projectNodes = STORAGE.get('linkit-nodes');
			const projectid = LINKIT.settings.projectid;
			if (projectNodes) {
				projectNodes = JSON.parse(projectNodes);
			} else {
				projectNodes = {};
			}
			projectNodes[projectid] = { nodes: nodePositions };
			STORAGE.set('linkit-nodes', JSON.stringify(projectNodes));
		}, 3000);
	},
	load: function () {
		const projectNodes = JSON.parse(STORAGE.get('linkit-nodes')) || {};
		const projectid = LINKIT.settings.projectid;
		if (projectNodes[projectid]) {
			const nodePositions = projectNodes[projectid]['nodes'];
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
	clear: function () {
		if (LINKITSVG.simulation) {
			LINKITSVG.simulation.stop(); // Stop the force simulation
		}

		if (LINKITSVG.svg) {
			LINKITSVG.svg.selectAll('*').remove(); // Remove all elements from the SVG
		}

		// Reset internal state
		LINKITSVG.simulation = null;
		LINKITSVG.nodes = null;
		LINKITSVG.svg = null;
		LINKITSVG.group = null;
		LINKITSVG.width = 0;
		LINKITSVG.height = 0;
		LINKITSVG.dragging = false;
		LINKITSVG.data = null;

		document.getElementById(LINKITSVG.svgid).innerHTML = ''; // Clear SVG container
	},
	init: function () {
		// Clear existing SVG
		LINKITSVG.clear();

		// Data
		const data = {
			nodes: [...LINKIT.settings.entities],
			links: [...LINKIT.settings.relationships],
		};
		LINKITSVG.data = data;

		const svgContainer = document.getElementById('app-content-container');
		let width = svgContainer.offsetWidth || svgContainer.clientWidth;
		let height = svgContainer.offsetHeight || svgContainer.clientHeight; //.append('svg').attr('width', width).attr('height', height);

		const svg = d3
			.select('#' + LINKITSVG.svgid)
			.append('svg')
			.attr('width', width)
			.attr('height', height);

		let nodeDistanceX = width / 5;

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
			if (node.isLinked) {
				node.x = width / 2 + (Math.random() - 0.5) * 50; // Small random offset to avoid overlap
				node.y = height / 2 + (Math.random() - 0.5) * 50;
			} else {
				node.fx = width / 2 + Math.random() * 100 - 50; // Keep unlinked nodes in place
				node.fy = height / 2 + Math.random() * 100 - 50;
			}
		});

		// Linked / Unlinked Nodes - Identify nodes that are part of a relationship
		const linkedNodeIds = new Set(data.links.flatMap((link) => [link.source, link.target]));

		// Mark nodes as linked or unlinked
		data.nodes.forEach((node) => {
			node.isLinked = linkedNodeIds.has(node.id);
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
			.on('tick', () => {
				// Only update linked nodes' positions
				node.attr('transform', (d) => (d.isLinked ? `translate(${d.x},${d.y})` : `translate(${d.fx},${d.fy})`));
				link
					.attr('x1', (d) => d.source.x)
					.attr('y1', (d) => d.source.y)
					.attr('x2', (d) => d.target.x)
					.attr('y2', (d) => d.target.y);
			})
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

		LINKITSVG.center(); // Allows Drag

		LINKITSVG.load(); // Load Saved Node Positions
		removeClass(LINKITSVG.svgid, 'app-hidden');
	},
};
