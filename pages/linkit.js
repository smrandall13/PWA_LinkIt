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
		attributes: [],
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
			const group = document.getElementById('linkit-group-' + groupid);
			if (group) group.classList.toggle('linkit-group-closed');
		},
	},
	form: function (table = '', newItem = 0) {
		// Base Variables
		let items = [];
		let itemid = '';
		let itemKey = '';
		let itemType = '';
		let label = '';
		let typeChange = '';

		// Form Details
		if (table == 'entities') {
			items = LINKIT.settings.entities;
			itemid = LINKIT.settings.entityid;
			label = 'New Entity';
			funKey = 'entity';
			itemKey = 'entityid';
			if (newItem === 1) {
				typeChange = ` onchange='LINKIT.entity.type(this.value)'`;
			}
		} else if (table == 'relationships') {
			items = LINKIT.settings.relationships;
			itemid = LINKIT.settings.relationshipid;
			label = 'New Relationship';
			funKey = 'relationship';
			itemKey = 'relationshipid';
		} else if (table == 'projects') {
			items = LINKIT.settings.projects;
			itemid = LINKIT.settings.projectid;
			label = 'New Project';
			funKey = 'project';
			itemKey = 'projectid';
		}

		if ((!items || items.length === 0) && newItem === 0) return; // Exit if No Items

		let item = itemid ? items.find((item) => item.id === itemid) : null;
		if (newItem === 1) item = null;

		// Attribute Options
		let attributeOptions = '';
		if (LINKIT.settings.attributes && LINKIT.settings.attributes.length > 0) {
			let uniqueAttributeLabels = [];
			LINKIT.settings.attributes.forEach((attribute) => {
				let labels = uniqueKey(attribute.list, 'label');
				uniqueAttributeLabels = [...uniqueAttributeLabels, ...labels];
			});

			uniqueAttributeLabels.forEach((label) => (attributeOptions += `<option value='${label}'>${label}</option>`));
		}

		// Types
		let types = uniqueKey(items, 'type');
		if (isEmpty(types) && table == 'projects') types = types = [...types, ...['ERD', 'Hierarchy', 'Custom']];
		if (table == 'entities') types = [...types, ...['Person', 'Place', 'Thing']];
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
		let attributes = [];
		let controls = `<div id='linkit-control-create' class='app-button app-button-small'  style='flex:1;'>Create</div>`;
		if (!isEmpty(item) && newItem === 0) {
			if (item && item.id === LINKIT.settings[itemKey]) {
				itemType = item.type;
				attributes = item.attributes;
				label = item.name;
				controls = `<div id='linkit-control-update' class='app-button app-button-small' style='flex:1;'>Update</div>
				<div id='linkit-control-delete' class='app-button app-button-small app-button-caution' style='flex:1;'>Delete</div>`;
			}
		}
		if (newItem === 1) {
			const typeAttributes = LINKIT.attribute.type('Core');
			if (typeAttributes && typeAttributes.length && typeAttributes.length > 0) attributes = typeAttributes;
		}
		if (!isArray(attributes)) attributes = [];

		// Primary
		let primary = `<div class='app-box-label'>Name</div><div class='app-box-value'><input type="text" id="linkit-form-name" placeholder="Name" value='${getKeyValue('name')}' /></div>
				<div class='app-box-label'>Type</div><div class='app-box-value'>
					<input type="text" id="linkit-form-type" placeholder='Type' list='linkit-types' value='${getKeyValue('type')}' ${typeChange}/>
					<datalist id='linkit-types'>${typeOptions}</datalist>
				</div>
				<div class='app-box-label'>Description</div><div class='app-box-value'><textarea id="linkit-form-description">${getKeyValue('description')}</textarea></div>`;

		// Content
		let content = `<input type="hidden" id="linkit-form-table" value='${table}' />`;
		if (table == 'entities' || table == 'relationships') {
			content += `<div class='app-box-body flex-row'><div class='app-box-partial'>`;
		} else {
			content += `<div class='app-box-body'>`;
		}
		content += primary;

		// Attributes
		let attributeList = LINKIT.attribute.list(attributes);

		// Relationships

		// Add to Content
		if (table == 'entities' || table == 'relationships') {
			content += `</div><div class='app-box-partial'>
				<div class='app-box-label'>Properties / Traits / Details<datalist id='linkit-attributes'>${attributeOptions}</datalist></div><div id='linkit-attributes-list' class='app-box-grid'>${attributeList}</div>
			</div>`;
		}
		content += `</div>`;

		// New Project Form
		POPUP.open(label, content, controls, 'linkit-edit-form');

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
		if (isEmpty(getValue('linkit-form-name'))) {
			MESSAGE.show('Error', 'Please enter a name.');
			return;
		}
		if (isEmpty(getValue('linkit-form-type'))) {
			MESSAGE.show('Error', 'Please enter a type.');
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
		const attributes = [];
		inputs.forEach((input) => {
			const key = input.id.split('-')[input.id.split('-').length - 1];
			if (input.id.includes('attr_')) {
				if (input.id.includes('attr_key_')) {
					let number = input.id.split('_')[2];
					if (isEmpty(number)) number = 0;

					let label = getValue(`linkit-form-attr_key_${number}`);
					let type = getValue(`linkit-form-attr_type_${number}`);
					let value = getValue(`linkit-form-attr_value_${number}`);

					if (!isEmpty(label) && !isEmpty(value) && number > 0) {
						if (isEmpty(type)) type = 'text';
						attributes.push({
							label: label,
							type: type,
							value: value,
						});
					}
				}
			} else {
				postData[key] = input.value;
			}
		});

		// Attributes
		if (!isEmpty(attributes) && attributes.length > 0) {
			postData['attributes'] = attributes;
		}

		DATA.submit(tableName, conditions, postData, 'set').then((result) => {
			if (result && result.data) {
				LINKIT.settings[tableName] = result.data[tableName];
				LINKIT.settings[itemKey] = result.data[itemKey];
			}
			if (tableName == 'entities' || tableName == 'relationships') {
				LINKIT.entity.load();
			} else if (tableName == 'projects') {
				LINKIT.project.load();
			}
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

			if (tableName == 'entities' || tableName == 'relationships') {
				LINKIT.entity.load();
			} else if (tableName == 'projects') {
				LINKIT.project.load();
			}
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
			LINKIT.attribute.get();
		},
		type: function (type = 'Core') {
			if (!isEmpty(type)) {
				const attributes = LINKIT.attribute.type(type);
				if (attributes) {
					const attributeElement = document.getElementById('linkit-attributes-list');
					if (attributeElement) {
						let attributeList = LINKIT.attribute.list(attributes);
						attributeElement.innerHTML = attributeList;
					}
				}
			}
		},
		new: function () {
			const entities = LINKIT.settings.entities;
			LINKIT.settings.entityid = '';

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
	attribute: {
		get: function () {
			DATA.submit('attributes').then((result) => {
				if (result && result.data && result.data.attributes && isArray(result.data.attributes)) {
					LINKIT.settings.attributes = result.data.attributes;
				}
			});
		},
		list: function (attributes = []) {
			// Attributes
			const createAttributeValue = function (a, attribute) {
				let value = attribute.value;
				let defaultValue = attribute.default;
				if (isEmpty(value)) value = defaultValue;
				if (isEmpty(defaultValue)) defaultValue = '';
				if (isEmpty(value)) value = '';
				let type = attribute.type || 'text';
				type = 'text';

				if (type == 'integer' || type == 'number' || type == 'range' || type == 'boolean') value = parseInt(value);
				if (type == 'float' || type == 'decimal') value = parseFloat(value);
				// if (type == 'date' || type == 'datetime') value = new Date(value);

				let attributeValue = '';
				let attrID = `linkit-form-attr_value_${a}`;
				if (type == 'select') {
					let options = ``;
					if (attribute.list && attribute.list.length > 0) {
						attribute.list.forEach((option) => (options += `<option value='${option}'>${option}</option>`));
					}
					attributeValue = `<select id='${attrID}' value='${value}'>${options}</select>`;
				} else if (type == 'color') {
					attributeValue = `<input type='color' id='${attrID}' value='${value}' />`;
				} else if (type == 'url' || type == 'link' || type == 'web') {
					attributeValue = `<input type='url' id='${attrID}' value='${value}' />`;
				} else if (type == 'date') {
					attributeValue = `<input type='date' id='${attrID}' value='${value}' />`;
				} else if (type == 'email') {
					attributeValue = `<input type='email' id='${attrID}' value='${value}' />`;
				} else if (type == 'phone' || type == 'tel') {
					attributeValue = `<input type='tel' id='${attrID}' value='${value}' />`;
				} else if (type == 'integer' || type == 'number') {
					attributeValue = `<input type='number' id='${attrID}' value='${value}' />`;
				} else if (type == 'range') {
					attributeValue = `<input type='range' id='${attrID}' value='${value}' />`;
				} else if (type == 'datetime') {
					attributeValue = `<input type='datetime' id='${attrID}' value='${value}' />`;
				} else if (type == 'checkbox' || type == 'boolean') {
					attributeValue = `<div class='app-toggle-wrapper'><label class='app-toggle-switch'><input type='checkbox' id='${attrID}' ${value ? 'checked' : ''} /><span class='app-toggle-slider'></span></label></div>`;
				} else if (type == 'text' || type == 'varchar') {
					attributeValue = `<input type='text' id='linkit-form-attr_value_${a}' placeholder="${defaultValue}" value='${value}' />`;
				}
				return attributeValue;
			};

			const createAttrbuteLine = function (num = 0, label = '', value = '') {
				return `<div class='app-box-value'>
					<input type='text' id='linkit-form-attr_key_${num}' value='${label}' placeholder='Label' style='max-width:100px;' list='linkit-attributes' />
				</div>
				<div class='app-box-value'>${value}</div>`;
			};

			attributeList = ``;
			let a = 1;
			if (attributes && attributes.length > 0) {
				attributes.forEach((attribute) => {
					attributeList += createAttrbuteLine(a, attribute.label, createAttributeValue(a, attribute));
					a++;
				});
				attributeList += createAttrbuteLine(a, '', `<input type='text' id='linkit-form-attr_value_${a}' value='' />`);
			} else {
				attributeList += createAttrbuteLine(1, '', `<input type='text' id='linkit-form-attr_value_1' value='' />`);
				attributeList += createAttrbuteLine(2, '', `<input type='text' id='linkit-form-attr_value_2' value='' />`);
				attributeList += createAttrbuteLine(3, '', `<input type='text' id='linkit-form-attr_value_3' value='' />`);
			}
			return attributeList;
		},
		type: function (type = '') {
			let attributes = '';
			if (!isEmpty(type)) {
				const coreAttributes = LINKIT.settings.attributes.find((attribute) => attribute.label === type);
				if (coreAttributes && coreAttributes.list) attributes = coreAttributes.list;
			}
			return attributes;
		},
	},
	visual: function (visual = '') {
		if (!isEmpty(visual)) LINKIT.settings.visual = visual;
		visual = LINKIT.settings.visual;

		const visual2D = document.getElementById('linkit-visual-2d');
		visual2D.classList.add('app-hidden');

		const visual3D = document.getElementById('linkit-visual-3d');
		visual3D.classList.add('app-hidden');

		const visualTable = document.getElementById('linkit-visual-table');
		visualTable.classList.add('app-hidden');

		// Remove Button Active Class
		const buttons = document.getElementsByClassName('linkit-control-button');
		for (let i = 0; i < buttons.length; i++) {
			const button = buttons[i];
			button.classList.remove('linkit-control-button-active');
			// If Button iD contains visual, add active class
			if (button.id.includes(visual)) {
				button.classList.add('linkit-control-button-active');
			}
		}

		if (visual === '2d') {
			LINKITSVG.init(); // Delay to ensure d3 is loaded, then init
		} else if (visual === '3d') {
			// document.getElementById('linkit-visual-2d').innerHTML = LINKITSVG.draw3D();
		} else if (visual === 'table') {
			// document.getElementById('linkit-visual-2d').innerHTML = LINKITSVG.drawTable();
		}
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
					LINKIT.form('projects', 1);
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
					let projectLabel = project.name;
					let projectClass = '';
					if (project.id == LINKIT.settings.projectid) {
						// projectLabel = ` - ${project.name}`;
						projectClass = 'linkit-project-selected';
					}
					list += `<div class='linkit-project-item ${projectClass}' onclick="LINKIT.project.select('${project.id}')">${projectLabel}</div>`;
				});
			}
			list += `<div id='linkit-project-add' class='app-button app-button-small linkit-project-button'><div class='app-icon app-icon-xsmall app-icon-add'></div><div class='app-button-text'>New Project</div></div>`;

			// Entity Button
			let buttons = '';
			if (!isEmpty(project)) {
				LINKIT.entity.get();

				buttons = `<div id='linkit-project-info' class='app-button app-button-small linkit-project-button'><div class='app-icon app-icon-xsmall app-icon-info'></div><div class='app-button-text'>Project Info</div></div>
					`;
			}

			// Visual Class
			let visualLeft = '';
			let visualCenter = '';
			let visualRight = '';
			if (!isEmpty(LINKIT.settings.visual)) LINKIT.settings.visual = '2d';
			if (LINKIT.settings.visual === '2d') {
				visualLeft = 'linkit-control-button-active';
			} else if (LINKIT.settings.visual === '3d') {
				visualCenter = 'linkit-control-button-active';
			} else if (LINKIT.settings.visual === 'line') {
				visualRight = 'linkit-control-button-active';
			}

			// Add Content to Container
			container.innerHTML = `
				<div id='linkit-header'>
					<div id='linkit-header-line'></div>
					<div id='linkit-controls'>
						<div id='linkit-control-2d' class='linkit-control-button linkit-control-button-left ${visualLeft}'>2D</div>
						<div id='linkit-control-3d' class='linkit-control-button linkit-control-button-center ${visualCenter}'>3D</div>
						<div id='linkit-control-table' class='linkit-control-button linkit-control-button-right ${visualRight}'>Table</div>
					</div>
				</div>
				<div id='linkit-menu'>
					<div id='linkit-project-selector' class='linkit-header-selector'>${label}</div>
					<div id='linkit-project-list' class='app-hidden'><div class='linkit-group-title'>Projects</div>${list}</div>
					<div class='linkit-project-category'>Entities</div>
					<div id='linkit-project-entitynew' class='app-button app-button-small linkit-project-button'><div class='app-icon app-icon-xsmall app-icon-add'></div>New Entity</div>
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
			addEvent('linkit-control-2d', () => {
				LINKIT.visual('2d');
			});
			addEvent('linkit-control-3d', () => {
				LINKIT.visual('3d');
			});
			addEvent('linkit-control-table', () => {
				LINKIT.visual('table');
			});

			// Parent Reference
			let reference = document.getElementById('linkit-header');

			// 2D Append SVG
			const svg = document.createElement('svg');
			svg.id = 'linkit-visual-2d';
			reference.parentNode.insertBefore(svg, reference);

			// 3D
			const div3D = document.createElement('div');
			div3D.id = 'linkit-visual-3d';
			reference.parentNode.insertBefore(div3D, reference);

			// Table
			const divTA = document.createElement('div');
			divTA.id = 'linkit-visual-table';
			reference.parentNode.insertBefore(divTA, reference);

			// No Project - Init New Project Form
			if (isEmpty(projects)) LINKIT.form('projects', 1);
		},
		new: function () {
			const projects = LINKIT.settings.projects;

			// Check Project Limit
			if (projects.length >= LINKIT.settings.projectLimit) {
				LINKIT.plan.message('Project Limit Reached');
				return;
			}

			// New Project Form
			LINKIT.form('projects', 1);
		},
		info: function (projectID = '') {
			if (isEmpty(projectID)) projectID = LINKIT.settings.projectid;
			if (isEmpty(projectID)) return;

			const project = LINKIT.settings.projects.find((project) => project.id == projectID);
			if (isEmpty(project)) return;
			LINKIT.form('projects');
		},
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
