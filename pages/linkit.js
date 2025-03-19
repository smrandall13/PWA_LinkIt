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
		timeouts: [],
		edited: false,
	},
	form: {
		open: function (tableName = '', newItem = 0) {
			LINKIT.form.close();

			// Base Variables
			let items = [];
			let itemid = '';
			let itemKey = '';
			let label = '';
			let typeChange = '';
			let onChange = () => {
				// LINKIT.update(0, 1);
				LINKIT.settings.edited = true;
			};
			// onChange = ''; // Reset

			// Form Details
			if (tableName == 'entities') {
				items = LINKIT.settings.entities;
				itemid = LINKIT.settings.entityid;
				label = 'New Entity';
				funKey = 'entity';
				itemKey = 'entityid';
				if (newItem === 1) {
					typeChange = ` onchange='LINKIT.entity.type(this.value)'`;
				}
			} else if (tableName == 'relationships') {
				items = LINKIT.settings.relationships;
				itemid = LINKIT.settings.relationshipid;
				label = 'New Relationship';
				funKey = 'relationship';
				itemKey = 'relationshipid';
			} else if (tableName == 'projects') {
				items = LINKIT.settings.projects;
				itemid = LINKIT.settings.projectid;
				label = 'New Project';
				funKey = 'project';
				itemKey = 'projectid';
			}

			if ((!items || items.length === 0) && newItem === 0) return; // Exit if No Items

			let item = itemid ? items.find((item) => item.id === itemid) : null;
			if (newItem === 1) {
				item = null;
				onChange = null;
			}
			if (item && item.id === LINKIT.settings.entityid) {
				// Find In Menu
				const entity = document.getElementById(`linkit-entity-${item.id}`);
				document.querySelectorAll('.linkit-entity-item').forEach((item) => item.classList.remove('linkit-entity-item-selected'));
				entity.classList.add('linkit-entity-item-selected');
				entity.parentNode.classList.remove('app-group-closed');
			}

			// Attribute Options
			let attributeLabels = '';
			let attributeGroups = '';
			if (LINKIT.settings.attributes && LINKIT.settings.attributes.length > 0) {
				// Attribute Labels
				let uniqueAttributeLabels = [];
				LINKIT.settings.attributes.forEach((attribute) => {
					let labels = uniqueKey(attribute.list, 'label');
					uniqueAttributeLabels = [...uniqueAttributeLabels, ...labels];
				});
				uniqueAttributeLabels.forEach((label) => (attributeLabels += `<option value='${label}'>${label}</option>`));

				// Attribute Groups
				let uniqueAttributeGroups = [];
				LINKIT.settings.attributes.forEach((attribute) => {
					let groups = uniqueKey(attribute.list, 'group');
					uniqueAttributeGroups = [...uniqueAttributeGroups, ...groups];
				});
				uniqueAttributeGroups.forEach((group) => (attributeGroups += `<option value='${group}'>${group}</option>`));
			}

			// Relationship Opetions
			let relationshipOptions = '';

			// Types
			let types = uniqueKey(items, 'type');
			if (isEmpty(types) && tableName == 'projects') types = types = [...types, ...['ERD', 'Hierarchy', 'Custom']];
			if (tableName == 'entities') types = [...types, ...['Person', 'Place', 'Thing']];
			types = uniqueKey(types);
			let typeOptions = '';
			if (types && types.length > 0) types.forEach((type) => (typeOptions += `<option value='${type}'>${type}</option>`));

			const getKeyValue = (key) => {
				let value = '';
				if (isEmpty(key) || !item) value = '';
				if (item && item[key]) value = item[key];
				if (isEmpty(value)) value = '';
				return value;
			};

			// Attributes
			let attributes = [];
			let controls = `<div id='linkit-control-create' class='app-button app-button-small'  style='flex:1;'>Create</div>`;
			if (tableName == 'entities' && !isEmpty(itemid)) {
				if (item && item.id === LINKIT.settings[itemKey]) {
					attributes = item.attributes;
					label = item.type + ': ' + item.name;
					controls = `<div id='linkit-control-update' class='app-button app-button-small' style='flex:1;'><div class='app-icon app-icon-small app-icon-edit'></div>Update</div>
					<div id='linkit-control-delete' class='app-button app-button-small app-button-caution' style='flex:1;'><div class='app-icon app-icon-small app-icon-delete'></div>Delete</div>
				`;
				}
			}
			if (newItem === 1) {
				const typeAttributes = LINKIT.attribute.type('Core');
				if (typeAttributes && typeAttributes.length && typeAttributes.length > 0) attributes = typeAttributes;
			}
			if (!isArray(attributes)) attributes = [];

			// Relationships
			let relationships = [];
			if (tableName == 'entities' && !isEmpty(itemid)) {
				relationships = LINKIT.settings.relationships.find((item) => item.source === itemid);
				console.log('R', LINKIT.settings.relationships, relationships);
			}

			// Tabs
			let tabs = `<div class='app-tabs'>`;
			if (tableName == 'entities') {
				tabs += `<div id='app-tab-attributes' class='app-tab app-tab-selected' onclick="APP.tab.show('attributes');LINKIT.form.init();">Properties</div>
					<div id='app-tab-relationships' class='app-tab' onclick="APP.tab.show('relationships');LINKIT.form.init();">Relationships</div>
					<div id='app-tab-files' class='app-tab' onclick="APP.tab.show('files');LINKIT.form.init();">Files</div>`;
			} else {
				tabs += `<div id='app-tab-files' class='app-tab app-tab-selected' onclick="APP.tab.show('files')">Files</div>`;
			}
			tabs += `</div>`;

			// Delete Button
			let deleteButton = '';
			if (!isEmpty(item) && newItem === 0) {
				deleteButton = `<div id='linkit-control-delete' class='app-button-caution-onhover app-icon app-icon-xsmall app-icon-delete border-radius pointer float-right'></div>`;
			}

			// Content
			let content = `
			<input type="hidden" id="linkit-form-table" value='${tableName}' />

			<div class='app-box-body flex-row' style='align-items: stretch;'>

				<div class='app-box-partial linkit-container max-width-300'>
					<div class='app-box-label space-between'>Name</div><div class='app-box-value'><input type="text" id="linkit-form-name" placeholder="Name" value='${getKeyValue('name')}' /></div>
					<div class='app-box-label'>Type</div><div class='app-box-value'>
						<input type="text" id="linkit-form-type" placeholder='Type' list='linkit-types' value='${getKeyValue('type')}' ${typeChange}/>
						<datalist id='linkit-types'>${typeOptions}</datalist>
					</div>
					<div class='app-box-label'>Description</div><div class='app-box-value'><textarea id="linkit-form-description">${getKeyValue('description')}</textarea></div>

					<div class='app-box-controls mart-8'>${controls}</div>
				</div><div class='app-box-partial  linkit-container  max-width-300 z-index-1'>${tabs}
			`;

			if (tableName == 'entities') {
				content += `<div id='app-tabcontent-attributes' class='app-tab-content'>
						<div id='linkit-attributes-list' class='app-box-grid linkit-list '>${LINKIT.attribute.list(attributes)}</div>

						<div id='linkit-attributes-button' class='flex-row space-between app-grid-span mart-4'>
							<div id='linkit-attribute-info' class='linkit-icon app-icon-info ' app-tooltip='Property Info'></div>
							<div id='linkit-attributes-new-button' class='app-button app-button-small linkit-project-button' style='flex:0 0 auto;width:auto;max-width:none;min-width:auto;'>
								<div class='app-icon-add app-icon app-icon-small'></div>
								Property
							</div>
						</div>
						<datalist id='linkit-attributegroups'>${attributeGroups}</datalist>
						<datalist id='linkit-attributelabels'>${attributeLabels}</datalist>
					</div>

					<div id='app-tabcontent-relationships' class='app-tab-content scroll-y app-tab-content-hidden'>
						<div id='linkit-relationships-list' class='app-box-grid'>${LINKIT.relationship.list(relationships)}</div>
						<datalist id='linkit-relationships'>${relationshipOptions}</datalist>
					</div>
			`;
			}

			// Files
			fileClass = 'app-tab-content-hidden';
			if (tableName == 'projects') fileClass = '';
			content += `<div id='app-tabcontent-files' class='app-tab-content scroll-y ${fileClass}'>
						<div id='linkit-files-list' class='app-box-grid'>
							<div class='align-center' style='width:100%;grid-column: span 2;margin-top:24px;'>Files are not allowed<br>under the current plan.
								<div class='flex-row justify-center mart-8' >
									<div class='app-button app-button-small' onclick="LINKIT.plan.upgrade()">Upgrade Plan</div>
								</div>
							</div>
						</div>
					</div>
				</div>
		`;

			// Attreibute New
			if (tableName == 'entities') {
				content += `<div id='linkit-attributes-edit' class='app-box-partial linkit-container linkit-subcontainer'>
				<div class='space-between flex-row' style='width:100%;'>New Property <div class='app-icon-left app-icon app-icon-small pointer' onclick="LINKIT.attribute.close()"></div></div>
				<div class='app-box-label'>Group</div><div class='app-box-value'><input type="text" id="linkit-attr-group" placeholder="Group" list='linkit-attributegroups'/></div>
				<div class='app-box-label'>Label</div><div class='app-box-value'><input type="text" id="linkit-attr-label" placeholder="Label" list='linkit-attributelabels'/></div>
				<div class='app-box-label'>Value</div><div class='app-box-value'><input type="text" id="linkit-attr-value" placeholder="Value" /></div>

				<div class='width-100 flex-row mart-8'>
					<div id='linkit-attribute-add' class='app-button app-button-small'  style='flex:1; width:100%;'>Add Property</div>
				</div>
			</div>`;
			}

			// <div id='linkit-attribute-update' class='app-button app-button-small app-hidden'  style='flex:1;'><div class='app-icon-edit app-icon app-icon-small'></div>Update</div>
			// <div id='linkit-attribute-delete' class='app-button app-button-small app-button-caution app-hidden'  style='flex:1;'><div class='app-icon-delete app-icon app-icon-small'></div>Delete</div>
			content += `</div>`;

			const box = document.createElement('div');
			box.id = 'linkit-edit-form';
			box.classList.add('linkit-popup-container');
			box.classList.add('linkit-position-top');

			box.innerHTML = `
			<div class=' linkit-container linkit-container-title'>
				${label}
				<div class='linkit-popup-close' onclick="LINKIT.form.close()"></div>
			</div><div class='linkit-popup-body'>${content}</div>`;
			document.getElementById('linkit-container').appendChild(box);

			// Get first input field and focus
			const input = box.querySelector('input');
			if (input) input.focus();

			// Add events
			addEvent('linkit-control-create', () => {
				LINKIT.update(1);
			});
			addEvent('linkit-control-update', () => {
				LINKIT.update();
			});
			addEvent('linkit-control-delete', () => {
				LINKIT.delete();
			});

			addEvent('linkit-attributes-new-button', () => {
				LINKIT.attribute.toggle();
			});
			addEvent('linkit-attribute-add', () => {
				LINKIT.attribute.add();
			});
			addEvent('linkit-attribute-info', () => {
				MESSAGE.info(`Property Info`, 'Properties consist of a Group, Label, and Value.<br>Groups are used to group related properties together, Labels are used to identify the property, and Values are used to store the actual data.<br><br>To Remove a property clear the Label and Value fields of the property and click the Update button.<br><br>To add a new property us the + Property button and fill out the New Property form.');
			});

			// Add On Change to all inputs
			if (isFunction(onChange)) {
				const inputs = document.getElementById('linkit-edit-form').querySelectorAll('input, textarea, select');
				for (let i = 0; i < inputs.length; i++) {
					const input = inputs[i];
					if (input.id) {
						addEvent(input.id, onChange);
					}
				}
			}
		},
		close: function (confirm = 0) {
			if (LINKIT.settings.edited == 1) {
				if (confirm == 0) {
					MESSAGE.confirm('Close Form', 'Some inputs have changed.<br>Closing the form will discard any changes.<br>Are you sure you want to close this form?', () => LINKIT.form.close(1));
					return;
				}
			}
			// Check if Popup already open
			if (document.getElementById('linkit-edit-form')) document.getElementById('linkit-edit-form').remove();
		},
		init: function () {
			LINKIT.attribute.close();
			LINKIT.relationship.close();
			LINKIT.file.close();
		},
		reset: function (silent = 0) {
			LINKIT.form.init();

			const tableName = getValue('linkit-form-table');
			if (!isEmpty(tableName)) {
				if (silent == 1) LINKIT.form.close();
				setTimeout(() => {
					if (tableName == 'entities') {
						LINKIT.entity.load();
						if (silent == 1) LINKIT.entity.select(LINKIT.settings.entityid);
					} else if (tableName == 'projects') {
						LINKIT.project.load();
						if (silent == 1) LINKIT.entity.select(LINKIT.settings.projectid);
					}
					LINKIT.settings.edited = false;
				}, 200);
			}
		},
	},
	update: function (newItem = 0, silent = 0) {
		let timeLimit = 100;
		if (silent == 1) timeLimit = 1000;

		// Update Timeout
		clearTimeout(LINKIT.settings.timeouts['update']);
		LINKIT.settings.timeouts['update'] = setTimeout(() => {
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

			const sanitizeString = (input) => {
				if (typeof input === 'string') {
					return input.trim().replace(/[\r\n\t]+/g, ' '); // Replace newlines, carriage returns, and tabs with space
				}
				return input; // Return as-is if not a string
			};

			// Get All inputs, select, textarea for element
			const form = document.getElementById('linkit-edit-form');
			const inputs = form.querySelectorAll('input, select, textarea');
			const attributes = [];
			inputs.forEach((input) => {
				const key = sanitizeString(input.id.split('-')[input.id.split('-').length - 1]);

				if (input.id.includes('attr_')) {
					if (input.id.includes('attr_key_')) {
						let number = input.id.split('_')[2];
						if (isEmpty(number)) number = 0;

						let label = sanitizeString(getValue(`linkit-form-attr_key_${number}`));
						let group = sanitizeString(getValue(`linkit-form-attr_group_${number}`));
						let type = sanitizeString(getValue(`linkit-form-attr_type_${number}`));
						let value = sanitizeString(getValue(`linkit-form-attr_value_${number}`));

						if (!isEmpty(label) && !isEmpty(value) && number > 0) {
							if (isEmpty(type)) type = 'text';
							attributes.push({
								label: label,
								group: group,
								type: type,
								value: value,
							});
						}
					}
				} else {
					postData[key] = sanitizeString(input.value);
				}
			});

			// Attributes
			if (!isEmpty(attributes) && attributes.length > 0) {
				postData['attributes'] = attributes;
			}

			// Update Data
			DATA.submit(tableName, conditions, postData, 'set').then((result) => {
				if (result && result.data) {
					LINKIT.settings[tableName] = result.data[tableName];
					LINKIT.settings[itemKey] = result.data[itemKey];
				}

				LINKIT.form.reset(silent);
			});

			// Close New Entry Form
			if (silent == 0) {
				LINKIT.form.close();
			}
		}, timeLimit);
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
		LINKIT.form.close();
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
			console.log('E1', entityID);
			if (isEmpty(entityID)) return;
			console.log('E2', entityID);

			const entity = LINKIT.settings.entities.find((entity) => entity.id === entityID);
			if (entity && entity.id === entityID) {
				console.log('E3', entityID);
				LINKIT.settings.entityid = entityID;
				LINKIT.form.open('entities');
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
					list.push(`<div id='app-group-${group}'class='app-group app-group-closed'><div class='app-group-title' onclick="APP.group.toggle('${group}')" >${entity.type}<div class='app-group-toggle app-icon app-icon-small app-icon-down'></div></div>`);
					type = entity.type;
					group++;
				}
				list.push(`<div id='linkit-entity-${entity.id}' class='linkit-entity-item' onclick="LINKIT.entity.select('${entity.id}')">${entity.name}</div>`);
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
				let attributes = LINKIT.attribute.type(type);
				if (!attributes || attributes.length == 0) {
					// Get All Attributes for the last entity created with matching type
					const entity = LINKIT.settings.entities.find((entity) => entity.type === type);
					if (entity) {
						attributes = [...entity.attributes];
						attributes.forEach((attribute) => {
							attribute.value = '';
						});
					}
				}
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
			LINKIT.form.open('entities', 1);
		},
	},
	relationship: {
		get: function () {
			DATA.submit('relationships', [{ field: 'projectid', operator: '=', value: LINKIT.settings.projectid }]).then((result) => {
				if (result && result.data && result.data.relationships && isArray(result.data.relationships)) {
					LINKIT.settings.relationships = result.data.relationships;
					console.log('GR', result.data.relationships);
				}
				LINKIT.relationship.load();
			});
		},
		load: function () {
			LINKITSVG.init();
		},
		open: function () {},
		close: function () {},
		toggle: function () {},
		list: function () {
			return '';
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
		line: function (num, group, label, value) {
			return `<div class='app-box-value'>
			<input type='text' id='linkit-form-attr_key_${num}' value='${label}' placeholder='Label' style='max-width:100px;' list='linkit-attributelabels' />
			<input type='hidden' id='linkit-form-attr_group_${num}' value='${group}' list='linkit-attributegroups' />
		</div>
		<div class='app-box-value'>${value}</div>`;
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

			attributeList = ``;
			let a = 1;
			if (attributes && attributes.length > 0) {
				attributes.sort((a, b) => {
					if (a.group && b.group) {
						const group = a.group.localeCompare(b.group);
						if (group !== 0) return group; // Sort By Group
					}

					if (isEmpty(a.type)) {
						a.type = 'text';
					}
					if (isEmpty(b.type)) {
						b.type = 'text';
					}
					const type = a.type.localeCompare(b.type);
					if (type !== 0) return type; // Sort By Type

					const label = a.label.localeCompare(b.label);
					if (label !== 0) return label; // Sort By Label

					const value = a.value.localeCompare(b.value);
					return value;
				});

				let lastGroup = '';
				let titleLabels = `<div class='font-size-xsm app-box-value'>Label</div><div class='font-size-xsm app-box-value'>Value</div>`;
				attributes.forEach((attribute) => {
					if (!isEmpty(attribute.group) && lastGroup !== attribute.group) {
						lastGroup = attribute.group;
						attributeList += `<div class='app-box-subtitle app-box-span flex-row justify-center mart-8 marb-4'>${attribute.group}</div>${titleLabels}`;
					}
					let editButton = ``; //<div class='app-icon app-icon-xsmall app-icon-edit pointer app-button-onhover' onclick="LINKIT.attribute.edit(${a})"></div>`;
					attributeList += LINKIT.attribute.line(a, attribute.group, attribute.label, createAttributeValue(a, attribute) + editButton);
					a++;
				});
			}
			return attributeList;
		},
		toggle: function () {
			const form = document.getElementById('linkit-attributes-edit');
			if (!form.classList.contains('linkit-subcontainer-visible')) {
				LINKIT.attribute.open();
			} else {
				LINKIT.attribute.close();
			}
		},
		open: function () {
			const form = document.getElementById('linkit-attributes-edit');
			const button = document.getElementById('linkit-attributes-new-button');
			let icon = null;
			if (button) icon = button.querySelector('.app-icon');
			if (form) form.classList.add('linkit-subcontainer-visible');
			if (icon) {
				icon.classList.remove('app-icon-add');
				icon.classList.add('app-icon-minus');
			}
		},
		close: function () {
			const form = document.getElementById('linkit-attributes-edit');
			const button = document.getElementById('linkit-attributes-new-button');
			let icon = null;
			if (button) icon = button.querySelector('.app-icon');
			if (form) form.classList.remove('linkit-subcontainer-visible');
			if (icon) {
				icon.classList.add('app-icon-add');
				icon.classList.remove('app-icon-minus');
			}
		},
		reset: function () {
			setValue('linkit-attr-group');
			setValue('linkit-attr-label');
			setValue('linkit-attr-value');
			LINKIT.attribute.close();
		},
		add: function () {
			const group = getValue('linkit-attr-group');
			const label = getValue('linkit-attr-label');
			const value = getValue('linkit-attr-value');
			let type = getValue('linkit-attr-type');
			if (isEmpty(type)) type = 'text';

			if (isEmpty(label) || isEmpty(value)) {
				MESSAGE.error('Please enter a label and value.');
				return;
			}

			// Get the number of attributes
			const list = document.getElementById('linkit-attributes-list');
			const inputs = list.querySelectorAll('input[id^="linkit-form-attr_key_"]');
			let num = inputs.length + 1;

			const line = LINKIT.attribute.line(num, group, label, `<input type='text' id='linkit-form-attr_value_${num}' value='${value}' />`);
			let html = list.innerHTML + line;
			list.innerHTML = html;
			setTimeout(LINKIT.update, 200); // Update Entity
			LINKIT.attribute.reset();
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
	file: {
		open: function () {},
		close: function () {},
		toggle: function () {},
		list: function () {},
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
					LINKIT.form.open('projects', 1);
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
					<div id='linkit-project-list' class='app-hidden'><div class='app-group-title'>Projects</div>${list}</div>
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
			if (isEmpty(projects)) LINKIT.form.open('projects', 1);
		},
		new: function () {
			const projects = LINKIT.settings.projects;

			// Check Project Limit
			if (projects.length >= LINKIT.settings.projectLimit) {
				LINKIT.plan.message('Project Limit Reached');
				return;
			}

			// New Project Form
			LINKIT.form.open('projects', 1);
		},
		info: function (projectID = '') {
			if (isEmpty(projectID)) projectID = LINKIT.settings.projectid;
			if (isEmpty(projectID)) return;

			const project = LINKIT.settings.projects.find((project) => project.id == projectID);
			if (isEmpty(project)) return;
			LINKIT.form.open('projects');
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
			message += `Upgrade your plan to add more.<br>
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
