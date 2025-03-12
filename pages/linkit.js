const webpage = 'https://shaunrandall.com';
const container = document.getElementById('linkit-container');

const LINKIT = {
	settings: {
		projectid: '',
		entityid: '',
		entitytype: '',
		projects: [],
		entities: [],
		projectLimit: 3,
		entityLimit: 100,
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
				LINKIT.entity.form();
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

			entities.forEach((entity, index) => {
				if (!isEmpty(entity.type) && entity.type !== type) {
					if (!isEmpty(type)) list.push('</div>');
					list.push(`<div class='linkit-group'><div class='linkit-group-title'>${entity.type}</div>`);
					type = entity.type;
				}
				list.push(`<div class='linkit-entity-item' onclick="LINKIT.entity.select('${entity.id}')">${entity.name}</div>`);
				if (index == entities.length - 1) {
					const projectEntities = document.getElementById('linkit-project-entities');
					projectEntities.innerHTML = list.join('');
					projectEntities.classList.remove('app-hidden');
				}
			});

			list.push(`</div>`); // Close Group

			// Entity
			// addClass('linkit-project-entity', 'app-hidden');
			// if (!isEmpty(LINKIT.settings.entityid)) {
			// 	const entity = entities.find((entity) => entity.id === LINKIT.settings.entityid);
			// 	if (entity && entity.id === LINKIT.settings.entityid) {
			// 		// document.getElementById('linkit-project-entity').innerHTML = `<div id='linkit-entity-edit' class='linkit-project-button no-border no-padding no-margin'><div class='app-icon app-icon-small app-icon-edit'></div>${entity.name}</div>`;
			// 		rmClass('linkit-project-entity', 'app-hidden');
			// 	}
			// }
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
			LINKIT.entity.form(1);
		},
		form: function (newEntity = 0) {
			const entities = LINKIT.settings.entities;
			if (!entities || entities.length === 0) {
				return;
			}

			let name = '';
			let description = '';
			let controls = `<div class='app-button app-button-small' style='width:100%;' onclick="LINKIT.entity.update(${newEntity})">Create</div>`;
			let attributes = [{ color: 'white' }];
			let label = 'New Entity';

			// Types
			const types = uniqueKey(entities, 'type');
			let typeOptions = '';
			types.forEach((type) => (typeOptions += `<option value='${type}'>${type}</option>`));

			// Entity Details
			if (!isEmpty(LINKIT.settings.entityid) && newEntity === 0) {
				const entity = LINKIT.settings.entities.find((entity) => entity.id === LINKIT.settings.entityid);
				if (entity && entity.id === LINKIT.settings.entityid) {
					name = entity.name;
					description = entity.description;
					attributes = entity.attributes;
					label = entity.type + ': ' + entity.name;
					controls = `<div class='app-button app-button-small' style='width:100%;' onclick="LINKIT.entity.update()">Update</div><div class='app-button app-button-small app-button-caution' style='width:100%;' onclick="LINKIT.entity.delete()">Delete</div>`;
				}
			}
			if (!isArray(attributes)) attributes = [];

			let content = `<div class='app-box-body'>
					<div class='app-box-label'>Name</div>
					<div class='app-box-value'><input type="text" id="linkit-entity-name" placeholder="Entity Name" value='${name}' /></div>

					<div class='app-box-label'>Type</div>
					<div class='app-box-value'><input type="text" id="linkit-entity-type" placeholder="Entity Type" list='linkit-entity-types' value='${name}' /></div>

					<div class='app-box-label'>Description</div>
					<div class='app-box-value'><textarea id="linkit-entity-description">${description}</textarea></div>

				</div><div class='app-box-seperator'></div><div class='app-box-subtitle'>Attributes</div><div id='linkit-entity-attributes' class='app-box-body'>


				</div><div class='app-box-seperator'></div><div class='app-box-body'>${controls}</div>
				<datalist id='linkit-entity-types'>${typeOptions}</datalist>`;

			// New Project Form
			POPUP.open(label, content);
		},
		update: function (newEntity = 0) {
			if (isEmpty(LINKIT.settings.entityid)) return;

			const name = getValue('linkit-entity-name');
			if (isEmpty(name)) {
				MESSAGE.show('Error', 'Please enter a name.');
				return;
			}

			const postData = { name: name, type: getValue('linkit-entity-type'), description: getValue('linkit-entity-description'), projectid: LINKIT.settings.projectid };
			if (!isEmpty(LINKIT.settings.entityid) && newEntity === 0) postData.id = entityID;

			DATA.submit('entities', null, postData, 'set').then((result) => {
				if (result && result.data) {
					LINKIT.settings.entities = result.data.entities;
					LINKIT.settings.entityid = result.data.entityid;
				}
				LINKIT.entity.load();
			});

			// Close New Entry Form
			POPUP.close();
		},
		delete: function (confirm = 0) {
			if (isEmpty(LINKIT.settings.entityid)) return;

			// Confirm Delete
			if (confirm == 0) {
				MESSAGE.confirm('Delete Entity', 'Are you sure you want to delete this entity?', () => LINKIT.entity.delete(1));
				return;
			}

			// Delete
			DATA.submit('entities', null, { id: LINKIT.settings.entityid }, 'delete').then((result) => {
				if (result && result.data) {
					LINKIT.settings.entities = result.data.entities;
					LINKIT.settings.entityid = result.data.entityid;
				}
				LINKIT.entity.load();
			});

			// Close New Entry Form
			POPUP.close();
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
				buttons = `<div id='linkit-project-entitynew' class='linkit-project-button font-size-sm'><div class='app-icon app-icon-xsmall app-icon-add'></div>New Entity</div>
					<div id='linkit-project-info' class='linkit-project-button'><div class='app-icon app-icon-xsmall app-icon-info'></div><div class='app-button-text'>Project Info</div></div>
					`;
			}

			// Add Content to Container
			container.innerHTML = `
				<div id='linkit-header-line'></div>
				<div id='linkit-menu'>
					<div id='linkit-project-selector' class='linkit-header-selector'>${label}</div>
					<div id='linkit-project-list' class='app-hidden'><div class='linkit-group-title'>Projects</div>${list}</div>
					<div id='linkit-project-entity' class='app-hidden'></div>
					<div id='linkit-project-entities'></div>
					${buttons}
					<div id='linkit-settings' class='linkit-project-button'><div class='app-icon app-icon-xsmall app-icon-settings'></div><div class='app-button-text'>Settings</div></div>
				</div>
			`;

			// Controls
			addEvent('linkit-project-selector', LINKIT.project.select);
			addEvent('linkit-project-add', LINKIT.project.new);
			addEvent('linkit-project-entitynew', LINKIT.entity.new);
			addEvent('linkit-project-info', LINKIT.project.info);

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
