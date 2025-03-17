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
	repulsion: -100,
	timeouts: [],
	data: null,
	animate: true,
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
	isLinked: function (node1, node2) {
		return LINKITSVG.data.links.some((link) => (link.source.id === node1.id && link.target.id === node2.id) || (link.source.id === node2.id && link.target.id === node1.id));
	},
	drag: {
		start: function (event, d) {
			LINKITSVG.dragging = false;
			if (!event.active) LINKITSVG.simulation.alphaTarget(0.3).restart();
			if (d.isLinked) {
				d.fx = d.x;
				d.fy = d.y;
			}
		},
		drag: function (event, d) {
			LINKITSVG.dragging = true;
			d.fx = event.x;
			d.fy = event.y;
		},
		end: function (event, d) {
			if (!event.active) LINKITSVG.simulation.alphaTarget(0);

			if (d.isLinked) {
				// Allow Animation
				d.fx = null;
				d.fy = null;
			}

			// Stop Animation
			if (!LINKITSVG.animate) {
				d.fx = event.x;
				d.fy = event.y;
			}

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
			let projectNodes = STORAGE.get('linkitsvg-nodes');
			const projectid = LINKIT.settings.projectid;
			if (projectNodes) {
				projectNodes = JSON.parse(projectNodes);
			} else {
				projectNodes = {};
			}
			projectNodes[projectid] = { nodes: nodePositions };
			STORAGE.set('linkitsvg-nodes', JSON.stringify(projectNodes));
		}, 3000);
	},
	load: function () {
		const projectNodes = JSON.parse(STORAGE.get('linkitsvg-nodes')) || {};
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

			const savedZoom = STORAGE.get('linkitsvg-zoom');
			if (savedZoom) {
				const parsedTransform = JSON.parse(savedZoom);
				LINKITSVG.svg.call(LINKITSVG.zoom.transform, d3.zoomIdentity.translate(parsedTransform.x, parsedTransform.y).scale(parsedTransform.k));
			}
		}
	},
	reset: function () {
		STORAGE.reset('linkitsvg-nodes');
		STORAGE.reset('linkitsvg-zoom');
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
		clearTimeout(LINKITSVG.timeouts['init']);

		// Make sure d3 is loaded
		if (!d3) {
			LINKITSVG.timeouts['init'] = setTimeout(LINKITSVG.init, 1000);
			return;
		}

		// Define default dimensions for the rounded rectangles
		const rectWidth = 80;
		const rectHeight = 30;
		const borderRadius = 4;

		// Clear existing SVG
		LINKITSVG.clear();

		// Data
		const data = {
			nodes: [...LINKIT.settings.entities],
			links: [...LINKIT.settings.relationships],
		};
		LINKITSVG.data = data;

		// Width / Height
		const svgContainer = document.getElementById('app-content-container');
		let width = svgContainer.offsetWidth || svgContainer.clientWidth;
		let height = svgContainer.offsetHeight || svgContainer.clientHeight; //.append('svg').attr('width', width).attr('height', height);
		// let nodeDistanceX = width / 8; // Adjust distance as needed
		let nodeDistanceX = 240; // Adjust distance as needed

		const svg = d3
			.select('#' + LINKITSVG.svgid)
			.append('svg')
			.attr('width', width)
			.attr('height', height);

		// Apply the gradient as an SVG background
		svg.append('rect').attr('width', width).attr('height', height).style('fill', 'transparent').style('stroke', 'transparent');

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

		// Node Elements - Rounded Rectangle - Append text inside the rectangle

		const rects = node
			.append('rect')
			.attr('width', rectWidth)
			.attr('height', rectHeight)
			.attr('class', 'linkit-svg-node')
			.attr('rx', borderRadius) // Rounded corners
			.attr('ry', borderRadius)
			.attr('x', -rectWidth / 2) // Centering rectangle
			.attr('y', -rectHeight / 2);

		const textElements = node
			.append('text')
			.attr('text-anchor', 'middle')
			.attr('dy', 5) // Center text within the rectangle
			.attr('fill', 'white')
			.text((d) => d.name);

		// Function to calculate text width dynamically
		function getTextWidth(textElement) {
			return textElement.getComputedTextLength() + 20; // Add padding
		}

		// Adjust rectangle width based on text size
		setTimeout(() => {
			textElements.each(function (d, i) {
				const textWidth = getTextWidth(this);
				d.rectWidth = textWidth; // Store width in data for positioning
			});

			// Apply calculated width to rectangles
			rects.attr('width', (d) => d.rectWidth).attr('x', (d) => -d.rectWidth / 2); // Center rectangle horizontally
		}, 50);

		// Zoom
		const zoom = d3
			.zoom()
			.scaleExtent([0.5, 3]) // Allow zooming in/out
			.on('zoom', (event) => {
				group.attr('transform', event.transform);
				STORAGE.set('linkitsvg-zoom', JSON.stringify(event.transform));
			});

		// Center Nodes
		data.nodes.forEach((node, index) => {
			// if (node.isLinked) {
			// 	node.x = width / 2 + (Math.random() - 0.5) * 50; // Small random offset to avoid overlap
			// 	node.y = height / 2 + (Math.random() - 0.5) * 50;
			// } else {
			// 	node.fx = width / 2 + Math.random() * 100 - 50; // Keep unlinked nodes in place
			// 	node.fy = height / 2 + Math.random() * 100 - 50;
			// }
			const angle = (index / data.nodes.length) * Math.PI * 2; // Spread nodes in a circle
			node.x = width / 2 + Math.cos(angle) * 200; // Spread around center
			node.y = height / 2 + Math.sin(angle) * 200;
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
			) // Adjust distance as needed
			.force(
				'charge',
				d3.forceManyBody().strength((d) => (!d.isLinked ? LINKITSVG.repulsion : 0))
			) // Apply repulsion only to linked nodes
			.force('center', d3.forceCenter(width / 2, height / 2))
			.force('collision', d3.forceCollide().radius(50))
			.on('tick', () => {
				node.attr('transform', (d) => `translate(${d.x},${d.y})`);
				link
					.attr('x1', (d) => d.source.x)
					.attr('y1', (d) => d.source.y)
					.attr('x2', (d) => d.target.x)
					.attr('y2', (d) => d.target.y);
			})
			.alpha(1) // Set initial alpha
			.alphaDecay(0.01) // Slow down animation to prevent abrupt motion
			.alphaMin(0.002) // Allow fine adjustments before stopping
			.restart();

		LINKITSVG.simulation.on('tick', () => {
			link
				.attr('x1', (d) => d.source.x)
				.attr('y1', (d) => d.source.y)
				.attr('x2', (d) => d.target.x)
				.attr('y2', (d) => d.target.y);

			linkLabels.attr('x', (d) => (d.source.x + d.target.x) / 2).attr('y', (d) => (d.source.y + d.target.y) / 2);

			node.attr('transform', (d) => `translate(${d.x},${d.y})`); // Keep nodes centered
		});

		LINKITSVG.center(); // Allows Drag

		LINKITSVG.load(); // Load Saved Node Positions
		removeClass(LINKITSVG.svgid, 'app-hidden');
	},
};
