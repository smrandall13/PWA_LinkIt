const SVG = {
     center: function (entityID = "") {
          const group = LINKIT2D.group; // Get the SVG group element
          if (group.empty()) return; // Exit if no <g> is found

          LINKIT2D.svg.call(LINKIT2D.zoom);
          const transform = d3.zoomTransform(LINKIT2D.svg.node()); // Get current zoom transform
          let newX = LINKIT2D.width / 2;
          let newY = LINKIT2D.height / 2;

          if (entityID) {
               const selectedNode = LINKIT2D.nodes.filter((d) => d.id === entityID);
               // if (selectedNode.empty()) break; // Exit if the node is not found
               const nodeData = selectedNode.datum(); // Get node data (position)

               // Calculate new translation to center the node
               newX = LINKIT2D.width / 2 - nodeData.x * transform.k;
               newY = LINKIT2D.height / 2 - nodeData.y * transform.k;

               // Smoothly transition to the new position
               LINKIT2D.svg.transition().duration(750).call(LINKIT2D.zoom.transform, d3.zoomIdentity.translate(newX, newY).scale(transform.k));
          }
     }
};

const LINKIT2D = {
     // ,pages/linkitd3.js
     svgid: "linkit-visual-graph",
     simulation: null,
     nodes: null,
     svg: null,
     group: null,
     zoom: null,
     dragging: false,
     width: 0,
     height: 0,
     repulsion: -100,
     distance: 200,
     timeouts: [],
     data: null,
     animate: true,
     timeouts: [],
     center: function (entityID = "") {
          const group = LINKIT2D.group; // Get the SVG group element
          if (group.empty()) return; // Exit if no <g> is found

          LINKIT2D.svg.call(LINKIT2D.zoom);
          const transform = d3.zoomTransform(LINKIT2D.svg.node()); // Get current zoom transform
          let newX = LINKIT2D.width / 2;
          let newY = LINKIT2D.height / 2;

          if (entityID) {
               const selectedNode = LINKIT2D.nodes.filter((d) => d.id === entityID);
               // if (selectedNode.empty()) break; // Exit if the node is not found
               const nodeData = selectedNode.datum(); // Get node data (position)

               // Calculate new translation to center the node
               newX = LINKIT2D.width / 2 - nodeData.x * transform.k;
               newY = LINKIT2D.height / 2 - nodeData.y * transform.k;

               // Smoothly transition to the new position
               LINKIT2D.svg.transition().duration(750).call(LINKIT2D.zoom.transform, d3.zoomIdentity.translate(newX, newY).scale(transform.k));
          }
     },
     isLinked: function (node1, node2) {
          return LINKIT2D.data.links.some((link) => (link.source.id === node1.id && link.target.id === node2.id) || (link.source.id === node2.id && link.target.id === node1.id));
     },
     drag: {
          start: function (event, d) {
               LINKIT2D.dragging = false;
               if (!event.active) LINKIT2D.simulation.alphaTarget(0.3).restart();
               if (d.isLinked) {
                    d.fx = d.x;
                    d.fy = d.y;
               }
          },
          drag: function (event, d) {
               LINKIT2D.dragging = true;
               d.fx = event.x;
               d.fy = event.y;
          },
          end: function (event, d) {
               if (!event.active) LINKIT2D.simulation.alphaTarget(0);

               if (d.isLinked) {
                    // Allow Animation
                    d.fx = null;
                    d.fy = null;
               }

               // Stop Animation
               if (!LINKIT2D.animate) {
                    d.fx = event.x;
                    d.fy = event.y;
               }

               LINKIT2D.dragging = false;
               LINKIT2D.save();
          }
     },
     save: function () {
          clearTimeout(LINKIT2D.timeouts["save"]);
          LINKIT2D.timeouts["save"] = setTimeout(() => {
               const nodePositions = LINKIT2D.nodes.data().map((d) => ({
                    id: d.id,
                    x: d.x,
                    y: d.y
               }));
               let projectNodes = STORAGE.get("linkitsvg-nodes");
               const projectid = LINKIT.settings.projectid;
               if (projectNodes) {
                    projectNodes = JSON.parse(projectNodes);
               } else {
                    projectNodes = {};
               }
               projectNodes[projectid] = { nodes: nodePositions };
               STORAGE.set("linkitsvg-nodes", JSON.stringify(projectNodes));
          }, 1000);
     },
     load: function () {
          const projectNodes = JSON.parse(STORAGE.get("linkitsvg-nodes")) || {};
          const projectid = LINKIT.settings.projectid;
          if (projectNodes[projectid]) {
               const nodePositions = projectNodes[projectid]["nodes"];
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

               if (!isEmpty(LINKIT.settings.entityid)) LINKIT2D.select(LINKIT.settings.entityid);

               const savedZoom = STORAGE.get("linkitsvg-zoom");
               if (savedZoom) {
                    const parsedTransform = JSON.parse(savedZoom);
                    LINKIT2D.svg.call(LINKIT2D.zoom.transform, d3.zoomIdentity.translate(parsedTransform.x, parsedTransform.y).scale(parsedTransform.k));
               }
          }

          // Function to calculate text width dynamically
          function getTextWidth(textElement) {
               return textElement.getComputedTextLength() + 20; // Add padding
          }

          // Adjust rectangle width based on text size
          function adjustRectWidth() {
               LINKIT2D.textElements.each(function (d, i) {
                    const textWidth = getTextWidth(this);
                    d.rectWidth = textWidth; // Store width in data for positioning
               });

               // Apply calculated width to rectangles
               LINKIT2D.rects.attr("width", (d) => d.rectWidth).attr("x", (d) => -d.rectWidth / 2); // Center rectangle horizontally
          }
          adjustRectWidth();
          setTimeout(adjustRectWidth, 10);
     },
     select: function (entityID = "") {
          // Clear Selection
          const nodes = document.getElementsByClassName("linkit-svg-node");
          if (nodes && nodes.length > 0) {
               for (let i = 0; i < nodes.length; i++) {
                    nodes[i].classList.remove("linkit-svg-selected");
               }
          }
          if (!isEmpty(entityID)) {
               const node = document.getElementById(`node-${entityID}`);
               if (node) node.classList.add("linkit-svg-selected");
          }
          LINKIT2D.center(entityID);
     },
     reset: function () {
          STORAGE.reset("linkitsvg-nodes");
          STORAGE.reset("linkitsvg-zoom");
     },
     clear: function () {
          if (LINKIT2D.simulation) LINKIT2D.simulation.stop(); // Stop the force simulation

          if (LINKIT2D.svg) LINKIT2D.svg.selectAll("*").remove(); // Remove all elements from the SVG

          // Reset internal state
          LINKIT2D.simulation = null;
          LINKIT2D.nodes = null;
          LINKIT2D.svg = null;
          LINKIT2D.group = null;
          LINKIT2D.width = 0;
          LINKIT2D.height = 0;
          LINKIT2D.dragging = false;
          LINKIT2D.data = null;

          document.getElementById(LINKIT2D.svgid).innerHTML = ""; // Clear SVG container
     },
     init: function () {
          clearTimeout(LINKIT2D.timeouts["init"]);

          // Clear existing SVG
          LINKIT2D.clear();

          // Make sure d3 is loaded
          if (typeof d3 === "undefined" || !d3) {
               LINKIT2D.timeouts["init"] = setTimeout(LINKIT2D.init, 1000);
               return;
          }

          // Define default dimensions for the rounded rectangles
          const rectWidth = 80;
          const rectHeight = 30;
          const borderRadius = 4;

          // Data
          const data = {
               nodes: [...LINKIT.settings.entities],
               links: LINKIT.settings.relationships.map((rel) => ({ ...rel }))
          };

          LINKIT2D.data = data;

          // Width / Height
          const svgContainer = document.getElementById("app-content-container");
          let width = svgContainer.offsetWidth || svgContainer.clientWidth;
          let height = svgContainer.offsetHeight || svgContainer.clientHeight;

          const svg = d3
               .select("#" + LINKIT2D.svgid)
               .append("svg")
               .attr("width", width)
               .attr("height", height);

          // Apply the gradient as an SVG background
          // svg.append('rect').attr('width', width).attr('height', height).style('fill', 'transparent').style('stroke', 'transparent');

          // Group
          const group = svg.append("g").attr("class", "graph-group"); // Parent Group

          // Links between nodes
          const link = group.selectAll(".linkit-svg-link").data(data.links).enter().append("line").attr("class", "linkit-svg-link");

          // Labels of each Link
          const linkTypes = group
               .selectAll(".linkit-svg-link-type")
               .data(data.links)
               .enter()
               .append("text")
               .attr("class", "linkit-svg-link-type")
               .attr("text-anchor", "middle")
               .text((d) => {
                    let type = "";
                    if (d.sourcetype === d.targettype || isEmpty(d.targettype)) {
                         type = `${d.sourcetype}`;
                    } else {
                         type = `${d.sourcetype} - ${d.targettype}`;
                    }
                    return type;
               });

          // Node Attributes
          const node = group
               .selectAll(".linkit-svg-node")
               .data(data.nodes)
               .enter()
               .append("g")
               .attr("class", "linkit-svg-node")
               .attr("id", (d) => `node-${d.id}`);

          // Drag Handlers
          node.call(d3.drag().on("start", LINKIT2D.drag.start).on("drag", LINKIT2D.drag.drag).on("end", LINKIT2D.drag.end));

          // Click Handlers
          node.on("click", function (event, d) {
               if (LINKIT2D.dragging) return;
               LINKIT.entity.select(d.id); // Select the clicked node
          });

          // Hover Handlers
          node.on("mouseover", function (event, d) {
               d3.select(this).classed("linkit-svg-hover", true);
               link.filter((l) => l.source === d || l.target === d).classed("linkit-svg-hover", true); // Select connected links
               linkTypes.filter((l) => l.source === d || l.target === d).classed("linkit-svg-hover", true); // Select connected links
          }).on("mouseout", function (event, d) {
               d3.select(this).classed("linkit-svg-hover", false); // Reset border
               link.filter((l) => l.source === d || l.target === d).classed("linkit-svg-hover", false);
               linkTypes.filter((l) => l.source === d || l.target === d).classed("linkit-svg-hover", false); // Select connected links
          });

          // Node Elements - Rounded Rectangle - Append text inside the rectangle

          const rects = node
               .append("rect")
               .attr("width", rectWidth)
               .attr("height", rectHeight)
               .attr("class", "linkit-svg-node")
               .attr("rx", borderRadius) // Rounded corners
               .attr("ry", borderRadius)
               .attr("x", -rectWidth / 2) // Centering rectangle
               .attr("y", -rectHeight / 2);

          const textElements = node
               .append("text")
               .attr("text-anchor", "middle")
               .attr("dy", 5) // Center text within the rectangle
               .attr("fill", "white")
               .text((d) => d.name);

          // Zoom
          const zoom = d3
               .zoom()
               .scaleExtent([0.5, 3]) // Allow zooming in/out
               .on("zoom", (event) => {
                    group.attr("transform", event.transform);
                    STORAGE.set("linkitsvg-zoom", JSON.stringify(event.transform));
               });

          // Center Nodes
          data.nodes.forEach((node, index) => {
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

          LINKIT2D.zoom = zoom;
          LINKIT2D.width = width;
          LINKIT2D.height = height;
          LINKIT2D.svg = svg;
          LINKIT2D.group = group;
          LINKIT2D.nodes = node;
          LINKIT2D.textElements = textElements;
          LINKIT2D.rects = rects;

          // Simulation
          LINKIT2D.simulation = d3
               .forceSimulation(data.nodes)
               .force(
                    "link",
                    d3
                         .forceLink(data.links)
                         .id((d) => d.id)
                         .distance(LINKIT2D.distance)
               ) // Adjust distance as needed
               .force(
                    "charge",
                    d3.forceManyBody().strength((d) => (!d.isLinked ? LINKIT2D.repulsion : 0))
               ) // Apply repulsion only to linked nodes
               .force("center", d3.forceCenter(width / 2, height / 2))
               .force("collision", d3.forceCollide().radius(50))
               .on("tick", () => {
                    node.attr("transform", (d) => `translate(${d.x},${d.y})`);
                    link.attr("x1", (d) => d.source.x)
                         .attr("y1", (d) => d.source.y)
                         .attr("x2", (d) => d.target.x)
                         .attr("y2", (d) => d.target.y);
               })
               .alpha(1) // Set initial alpha
               .alphaDecay(0.01) // Slow down animation to prevent abrupt motion
               .alphaMin(0.002) // Allow fine adjustments before stopping
               .restart();

          LINKIT2D.simulation.on("tick", () => {
               link.attr("x1", (d) => d.source.x)
                    .attr("y1", (d) => d.source.y)
                    .attr("x2", (d) => d.target.x)
                    .attr("y2", (d) => d.target.y);

               linkTypes.attr("x", (d) => (d.source.x + d.target.x) / 2).attr("y", (d) => (d.source.y + d.target.y) / 2);

               node.attr("transform", (d) => `translate(${d.x},${d.y})`); // Keep nodes centered
          });
          LINKIT2D.simulation.on("end", () => LINKIT2D.save);

          LINKIT2D.center(); // Allows Drag

          LINKIT2D.load(); // Load Saved Node Positions
     }
};
