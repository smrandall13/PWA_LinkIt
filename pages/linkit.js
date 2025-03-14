const webpage = 'https://shaunrandall.com';
const container = document.getElementById('linkit-container');

const LINKIT = {
	settings: {
		projectid: '',
		entityid: '',
		relationshipid: '',
		entitytype: '',
		visual: '2d',
		projects: [],
		entities: [],
		relationships: [],
		projectLimit: 3,
		entityLimit: 100,
	},
	group: {
		open: function (groupid) {
			if (isEmpty(groupid)) return;
			const group = document.getElementById('linkit-group-' + groupid);
			if (group) group.classList.remove('linkit-group-closed');
		},
		close: function (groupid) {
			if (isEmpty(groupid)) return;
			const group = document.getElementById('linkit-group-' + groupid);
			if (group) group.classList.add('linkit-group-closed');
		},
		toggle: function (groupid) {
			if (isEmpty(groupid)) return;
			console.log('G', groupid);
			const group = document.getElementById('linkit-group-' + groupid);
			if (group) group.classList.toggle('linkit-group-closed');
		},
	},
	form: function (table = '', newItem = 0) {
		let items = [];
		let itemid = '';
		let label = '';
		let attributes = [];

		if (table == 'entities') {
			items = LINKIT.settings.entities;
			itemid = LINKIT.settings.entityid;
			label = 'New Entity';
			funKey = 'entity';
		}
		if (table == 'relationships') {
			items = LINKIT.settings.relationships;
			itemid = LINKIT.settings.relationshipid;
			label = 'New Relationship';
			funKey = 'relationship';
		}
		if (table == 'projects') {
			items = LINKIT.settings.projects;
			itemid = LINKIT.settings.projectid;
			label = 'New Project';
			funKey = 'project';
		}
		if (!items || items.length === 0) {
			return;
		}
		const item = itemid ? items.find((item) => item.id === itemid) : null;

		let controls = `<div id='linkit-control-create' class='app-button app-button-small' style='width:100%;'>Create</div>`;

		// Types
		const types = uniqueKey(items, 'type');
		let typeOptions = '';
		if (types && types.length > 0) types.forEach((type) => (typeOptions += `<option value='${type}'>${type}</option>`));

		const getKeyValue = (key) => {
			let value = '';
			if (isEmpty(key) || !item) value = '';
			if (item && item[key]) value = item[key];
			if (isEmpty(value)) value = '';
			return value;
		};

		// item Details
		if (!isEmpty(item) && newItem === 0) {
			if (item && item.id === LINKIT.settings.entityid) {
				attributes = item.attributes;
				label = item.name;
				controls = `<div id='linkit-control-update' class='app-button app-button-small' style='width:100%;'>Update</div>
				<div id='linkit-control-delete' class='app-button app-button-small app-button-caution' style='width:100%;'>Delete</div>`;
			}
		}
		if (!isArray(attributes)) attributes = [];

		// Core
		let content = `<div class='app-box-body'>
				<input type="hidden" id="linkit-form-table" value='${table}' />
				<div class='app-box-label'>Name</div>
				<div class='app-box-value'><input type="text" id="linkit-form-name" placeholder="Entity Name" value='${getKeyValue('name')}' /></div>

				<div class='app-box-label'>Type</div>
				<div class='app-box-value'><input type="text" id="linkit-form-type" placeholder="Entity Type" list='linkit-entity-types' value='${getKeyValue('type')}' /></div>

				<div class='app-box-label'>Description</div>
				<div class='app-box-value'><textarea id="linkit-form-description">${getKeyValue('description')}</textarea></div>

			</div>`;

		// Attributes
		if (table == 'entities' || table == 'relationships') {
			content += `<div class='app-box-seperator'></div><div class='app-box-subtitle'>Attributes</div><div id='linkit-form-attributes' class='app-box-body'></div>`;
		}

		// Controls
		content += `<div class='app-box-seperator'></div><div class='app-box-body'>${controls}</div><datalist id='linkit-entity-types'>${typeOptions}</datalist>`;

		// New Project Form
		POPUP.open(label, content, 'linkit-edit-form');

		// Controls
		addEvent('linkit-control-create', () => {
			LINKIT.update(1);
		});
		addEvent('linkit-control-update', () => {
			LINKIT.update();
		});
		addEvent('linkit-control-delete', () => {
			LINKIT.delete();
		});
	},
	update: function (newItem = 0) {
		const tableName = getValue('linkit-form-table');
		if (isEmpty(tableName)) return;

		// Check Item ID
		let itemid = '';
		let itemKey = '';
		if (tableName == 'entities') {
			itemid = LINKIT.settings.entityid;
			itemKey = 'entityid';
		}
		if (tableName == 'relationships') {
			itemid = LINKIT.settings.relationshipid;
			itemKey = 'relationshipid';
		}
		if (tableName == 'projects') {
			itemid = LINKIT.settings.projectid;
			itemKey = 'projectid';
		}
		if (isEmpty(itemid) && newItem === 0) return;

		// Check Name
		const name = getValue('linkit-form-name');
		if (isEmpty(name)) {
			MESSAGE.show('Error', 'Please enter a name.');
			return;
		}

		// Data
		const postData = {};
		let conditions = [];
		if (tableName !== 'projects') {
			postData['projectid'] = LINKIT.settings.projectid;
		}
		if (!isEmpty(itemid) && newItem === 0) {
			conditions = [{ field: 'id', operator: '=', value: itemid }];
		}

		// Get All inputs, select, textarea for element
		const form = document.getElementById('linkit-edit-form');
		const inputs = form.querySelectorAll('input, select, textarea');
		inputs.forEach((input) => {
			const key = input.id.split('-')[input.id.split('-').length - 1];
			postData[key] = input.value;
		});

		DATA.submit(tableName, conditions, postData, 'set').then((result) => {
			if (result && result.data) {
				LINKIT.settings[tableName] = result.data[tableName];
				LINKIT.settings[itemKey] = result.data[itemKey];
			}
			LINKIT.entity.load();
		});

		// Close New Entry Form
		POPUP.close();
	},
	delete: function (confirm = 0) {
		const tableName = getValue('linkit-form-table');
		if (isEmpty(tableName)) return;

		// Check Item ID
		let itemid = '';
		let itemLabel = '';
		let itemKey = '';
		if (tableName == 'entities') {
			itemid = LINKIT.settings.entityid;
			itemKey = 'entityid';
			itemLabel = 'Entity';
		}
		if (tableName == 'relationships') {
			itemid = LINKIT.settings.relationshipid;
			itemKey = 'relationshipid';
			itemLabel = 'Relationship';
		}
		if (tableName == 'projects') {
			itemid = LINKIT.settings.projectid;
			itemKey = 'projectid';
			itemLabel = 'Project';
		}
		if (isEmpty(itemid)) return;

		// Confirm Delete
		if (confirm == 0) {
			MESSAGE.confirm(`Delete ${itemLabel}`, `Are you sure you want to delete this ${itemLabel.toLowerCase()}?`, () => LINKIT.delete(1));
			return;
		}

		// Delete
		DATA.submit(tableName, [{ field: 'id', operator: '=', value: itemid }], null, 'delete').then((result) => {
			if (result && result.data) {
				LINKIT.settings[tableName] = result.data[tableName];
				LINKIT.settings[itemKey] = '';
			}
			LINKIT.entity.load();
		});

		// Close New Entry Form
		POPUP.close();
	},
	entity: {
		get: function () {
			if (isEmpty(LINKIT.settings.projectid)) return;

			DATA.submit('entities', [{ field: 'projectid', operator: '=', value: LINKIT.settings.projectid }]).then((result) => {
				if (result && result.data) {
					LINKIT.settings.entities = result.data.entities;
				}
				LINKIT.entity.load();
			});
		},
		select: function (entityID = '') {
			if (isEmpty(entityID)) return;

			const entity = LINKIT.settings.entities.find((entity) => entity.id === entityID);
			if (entity && entity.id === entityID) {
				LINKIT.settings.entityid = entityID;
				LINKIT.form('entities');
			}
		},
		load: function () {
			const entities = LINKIT.settings.entities;

			entities.sort((a, b) => {
				const type = a.type.localeCompare(b.type);
				if (type !== 0) return type; // Sort By Type
				return a.name.localeCompare(b.name); // If Types are the same, sort by name
			});

			let list = [];
			let type = '';

			let group = 1;

			entities.forEach((entity, index) => {
				if (!isEmpty(entity.type) && entity.type !== type) {
					if (!isEmpty(type)) list.push('</div>');
					list.push(`<div id='linkit-group-${group}'class='linkit-group linkit-group-closed'><div class='linkit-group-title' onclick="LINKIT.group.toggle('${group}')" >${entity.type}<div class='linkit-group-toggle app-icon app-icon-small app-icon-down'></div></div>`);
					type = entity.type;
					group++;
				}
				list.push(`<div class='linkit-entity-item' onclick="LINKIT.entity.select('${entity.id}')">${entity.name}</div>`);
				if (index == entities.length - 1) {
					const projectEntities = document.getElementById('linkit-project-entities');
					projectEntities.innerHTML = list.join('');
					projectEntities.classList.remove('app-hidden');
				}
			});

			list.push(`</div>`); // Close Group
			LINKIT.relationship.get();
		},
		new: function () {
			const entities = LINKIT.settings.entities;

			if (isEmpty(LINKIT.settings.projectid)) {
				MESSAGE.alert('Missing Project', 'Project not selected');
				return;
			}

			// Check Project Limit
			if (entities.length >= LINKIT.settings.entityLimit) {
				LINKIT.plan.message('Project Entity Limit Reached');
				return;
			}

			// New Project Form
			LINKIT.form('entities', 1);
		},
	},
	relationship: {
		get: function () {
			DATA.submit('relationships', [{ field: 'projectid', operator: '=', value: LINKIT.settings.projectid }]).then((result) => {
				if (result && result.data && result.data.relationships && isArray(result.data.relationships)) {
					LINKIT.settings.relationships = result.data.relationships;
				}
				LINKIT.relationship.load();
			});
		},
		load: function () {
			LINKITSVG.init();
		},
	},
	project: {
		get: function () {
			DATA.submit('projects', null).then((result) => {
				if (result && result.data && result.data.projects && isArray(result.data.projects)) {
					LINKIT.settings.projects = result.data.projects;
				}
				LINKIT.project.load();
			});
		},
		select: function (projectID = '') {
			const list = document.getElementById('linkit-project-list');
			const toggle = document.getElementById('linkit-project-toggle');
			const projects = LINKIT.settings.projects;
			if (isEmpty(projectID)) {
				if (isEmpty(projects)) {
					LINKIT.project.form();
				} else {
					if (list.classList.contains('app-hidden')) {
						list.classList.remove('app-hidden');
						toggle.classList.remove('app-icon-down');
						toggle.classList.add('app-icon-up');
					} else {
						list.classList.add('app-hidden');
						toggle.classList.add('app-icon-down');
						toggle.classList.remove('app-icon-up');
					}
				}
			} else {
				list.classList.add('app-hidden');
				const project = LINKIT.settings.projects.find((project) => project.id == projectID);
				if (project && project.id == projectID) {
					LINKIT.settings.projectid = project.id;
					STORAGE.set('linkit-projectid', project.id);
					LINKIT.settings.entities = [];
					LINKIT.project.load();
				}
			}
		},
		load: function () {
			// Check Project
			if (LINKIT.settings.projects.length > 0) {
				if (!isEmpty(LINKIT.settings.projectid)) {
					const project = LINKIT.settings.projects.find((project) => project.id == LINKIT.settings.projectid);
					if (!project) LINKIT.settings.projectid = '';
				}
				if (isEmpty(LINKIT.settings.projectid) && LINKIT.settings.projects.length === 1) LINKIT.settings.projectid = LINKIT.settings.projects[0].id; // Default Project (1st)
			} else {
				LINKIT.settings.projectid = '';
			}

			// Variables
			const projects = LINKIT.settings.projects;
			const project = LINKIT.settings.projects.find((project) => project.id == LINKIT.settings.projectid);

			// No Projects
			let label = '';
			if (isEmpty(projects)) {
				label = `<div id='linkit-project-add' class='linkit-project-button no-border no-padding no-margin'><div class='app-icon app-icon-small app-icon-add'></div>New Project</div>`;
			} else if (isEmpty(project)) {
				label = `Select Project<div id='linkit-project-toggle' class='app-icon app-icon-small app-icon-down'></div>`;
			} else if (!isEmpty(project)) {
				label = `${project.name}<div id='linkit-project-toggle' class='app-icon app-icon-small app-icon-down'></div>`;
			}

			// List Projects
			let list = '';
			if (projects && projects.length && projects.length > 0) {
				projects.forEach((project) => {
					// if (project.id !== LINKIT.settings.projectid) {
					list += `<div class='linkit-project-item' onclick="LINKIT.project.select('${project.id}')">${project.name}</div>`;
					// }
				});
			}
			list += `<div id='linkit-project-add' class='app-button app-button-small linkit-project-button'><div class='app-icon app-icon-xsmall app-icon-add'></div><div class='app-button-text'>New Project</div></div>`;

			// Entity Button
			let buttons = '';
			if (!isEmpty(project)) {
				LINKIT.entity.get();
				buttons = `<div id='linkit-project-entitynew' class='app-button app-button-small linkit-project-button'><div class='app-icon app-icon-xsmall app-icon-add'></div>New Entity</div>
					<div id='linkit-project-info' class='app-button app-button-small linkit-project-button'><div class='app-icon app-icon-xsmall app-icon-info'></div><div class='app-button-text'>Project Info</div></div>
					`;
			}

			// Visual Class
			let visualLeft = '';
			let visualCenter = '';
			let visualRight = '';
			if (!isEmpty(LINKIT.settings.visual)) LINKIT.settings.visual = '2d';
			if (LINKIT.settings.visual === '2d') {
				visualLeft = 'linkit-visual-active';
			} else if (LINKIT.settings.visual === '3d') {
				visualCenter = 'linkit-visual-active';
			} else if (LINKIT.settings.visual === 'line') {
				visualRight = 'linkit-visual-active';
			}

			// Add Content to Container
			container.innerHTML = `
				<div id='linkit-header'>
					<div id='linkit-header-line'></div>
					<div id='linkit-visual-controls'>
						<div id='linkit-visual-2d' class='linkit-visual-button linkit-visual-button-left ${visualLeft}'></div>
						<div id='linkit-visual-3d' class='linkit-visual-button linkit-visual-button-center ${visualCenter}'></div>
						<div id='linkit-visual-line' class='linkit-visual-button linkit-visual-button-right ${visualRight}'></div>
					</div>
				</div>
				<div id='linkit-menu'>
					<div id='linkit-project-selector' class='linkit-header-selector'>${label}</div>
					<div id='linkit-project-list' class='app-hidden'><div class='linkit-group-title'>Projects</div>${list}</div>
					<div id='linkit-project-entity' class='app-hidden'></div>
					<div id='linkit-project-entities'></div>
					${buttons}
					<div id='linkit-settings' class='app-button app-button-small linkit-project-button'><div class='app-icon app-icon-xsmall app-icon-settings'></div><div class='app-button-text'>Settings</div></div>
				</div>
			`;

			// Controls
			addEvent('linkit-project-selector', LINKIT.project.select);
			addEvent('linkit-project-add', LINKIT.project.new);
			addEvent('linkit-project-entitynew', LINKIT.entity.new);
			addEvent('linkit-project-info', LINKIT.project.info);

			// Append SVG
			const svg = document.createElement('svg');
			svg.id = 'linkit-visual-2d';
			let reference = document.getElementById('linkit-header');
			reference.parentNode.insertBefore(svg, reference);

			// No Project - Init New Project Form
			if (isEmpty(projects)) LINKIT.project.form();
		},
		new: function () {
			const projects = LINKIT.settings.projects;

			// Check Project Limit
			if (projects.length >= LINKIT.settings.projectLimit) {
				LINKIT.plan.message('Project Limit Reached');
				return;
			}

			// New Project Form
			LINKIT.project.form(1);
		},
		form: function (newProject = 0) {
			const projects = LINKIT.settings.projects;

			// Check Project Limit
			if (projects.length >= LINKIT.settings.projectLimit) {
				LINKIT.plan.message('Project Limit Reached');
				return;
			}

			// New Project Form
			let name = '';
			let description = '';
			let controls = `<div class='app-button app-button-small' style='width:100%;' onclick="LINKIT.project.update(${newProject})">Create</div>`;
			let attributes = [{ color: 'white' }];
			let label = 'New Project';

			// Types
			const types = uniqueKey(projects, 'type');
			let typeOptions = '';
			types.forEach((type) => (typeOptions += `<option value='${type}'>${type}</option>`));

			// Entity Details
			if (!isEmpty(LINKIT.settings.projectid) && newProject === 0) {
				const project = LINKIT.settings.projects.find((project) => project.id === LINKIT.settings.projectid);
				if (project && project.id === LINKIT.settings.projectid) {
					name = project.name;
					description = project.description;
					attributes = project.attributes;
					label = project.type + ': ' + project.name;
					controls = `<div class='app-button app-button-small' style='width:100%;' onclick="LINKIT.project.update()">Update</div><div class='app-button app-button-small app-button-caution' style='width:100%;' onclick="LINKIT.project.delete()">Delete</div>`;
				}
			}
			if (!isArray(attributes)) attributes = [];

			let content = `<div class='app-box-body'>
					<div class='app-box-label'>Name</div>
					<div class='app-box-value'><input type="text" id="linkit-project-name" placeholder="Project Name" value='${name}' /></div>

					<div class='app-box-label'>Type</div>
					<div class='app-box-value'><input type="text" id="linkit-project-type" placeholder="Project Type" list='linkit-project-types' value='${name}' /></div>

					<div class='app-box-label'>Description</div>
					<div class='app-box-value'><textarea id="linkit-project-description">${description}</textarea></div>

				</div><div class='app-box-seperator'></div><div class='app-box-subtitle'>Attributes</div><div id='linkit-project-attributes' class='app-box-body'>


				</div><div class='app-box-seperator'></div><div class='app-box-body'>${controls}</div>
				<datalist id='linkit-project-types'>${typeOptions}</datalist>`;

			// New Project Form
			POPUP.open(label, content);
		},
		update: function (projectID = '') {
			const name = document.getElementById('linkit-project-name').value;
			const description = document.getElementById('linkit-project-description').value;

			if (isEmpty(name)) {
				MESSAGE.show('Error', 'Please enter a name.');
				return;
			}

			const postData = { name: name, description: description };
			if (!isEmpty(projectID)) postData.id = projectID;

			DATA.submit('projects', null, postData, 'set').then((result) => {
				if (result && result.data) {
					LINKIT.settings.projects = result.data.projects;
					LINKIT.settings.projectid = result.data.projectid;
				}
				LINKIT.project.load();
			});

			POPUP.close();
		},
		delete: function () {},
	},
	load: function () {
		const project = LINKIT.settings.projectid;
		const projects = LINKIT.settings.projects;

		if (isEmpty(projects)) {
			LINKIT.project.get();
			return;
		}

		if (isEmpty(project)) {
			// List Projects
		} else {
			// Load Project
		}
	},
	storage: {
		get: function () {
			// Get Saved Info
			LINKIT.settings.projectid = STORAGE.get('linkit-projectid');
			LINKIT.settings.entityid = STORAGE.get('linkit-entityid');
		},
		set: function () {},
	},
	plan: {
		upgrade: function () {
			const link = document.createElement('a');
			link.href = webpage;
			link.target = '_blank';
			link.click();
		},
		message: function (title = '') {
			let message = '';
			if (!isEmpty(title)) {
				message = title + '<br>';
			}
			message += `Upgrade to a better plan to add more.<br>
			<div class='flex-row justify-center mart-8'>
				<div class='app-button app-button-small' onclick="LINKIT.plan.upgrade()">Upgrade Plan</div>
			</div>`;
			MESSAGE.show('Limit Reached', message);
		},
	},
	init: function () {
		// Get Stored Variables
		LINKIT.storage.get();

		// Initilize Database
		DATA.init('linkit');

		// Get Proejcts
		LINKIT.project.get();
	},
};

// setTimeout(LINKIT.init, 1000);
LINKIT.init();
