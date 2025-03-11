const container = document.getElementById('linkit-container');

const LINKIT = {
	settings: {
		project: '',
		entity: '',
		projects: [],
	},
	entity: {
		new: function () {},
		update: function (entityID = '') {},
		delete: function (entityID = '') {},
	},
	plan: {
		upgrade: function () {
			MESSAGE.show('Upgrade', 'Upgrade Plan');
		},
	},
	project: {
		get: function () {
			DATA.submit('projects', null).then((result) => {
				if (result && result.data) {
					LINKIT.settings.projects = result.data.projects;
					LINKIT.project.load();
				}
			});
		},
		new: function () {
			const projects = LINKIT.settings.projects;

			// Check Project Limit
			const projectLimit = 1;
			if (projects.length >= projectLimit) {
				MESSAGE.show('Error', 'You have reached the maximum number of projects.');
				return;
			}

			// New Project Form
			POPUP.open(
				'New Project',
				`<div class='app-box-body'>
					<div class='app-box-label'>Name</div>
					<div class='app-box-value'><input type="text" id="linkit-project-name" placeholder="Project Name" /></div>

					<div class='app-box-label'>Description</div>
					<div class='app-box-value'><textarea id="linkit-project-description"></textarea></div>

					<div class='app-box-seperator'></div>
					<div class='app-button app-button-small' style='width:100%;' onclick="LINKIT.project.update('')">Create</div>
				</div>`
			);
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
					LINKIT.project.load();
				}
			});

			POPUP.close();
		},
		delete: function () {},
		select: function (projectID = '') {
			const list = document.getElementById('linkit-project-list');
			const projects = LINKIT.settings.projects;
			if (isEmpty(projectID)) {
				if (isEmpty(projects)) {
					LINKIT.project.new();
				} else {
					if (list.classList.contains('app-hidden')) {
						list.classList.remove('app-hidden');
					} else {
						list.classList.add('app-hidden');
					}
				}
			} else {
				list.classList.add('app-hidden');
				const project = LINKIT.settings.projects.find((project) => project.id == projectID);
				if (project && project.id == projectID) {
					LINKIT.settings.project = project;
					LINKIT.project.load();
				}
			}
		},
		load: function () {
			const projects = LINKIT.settings.projects;
			const project = LINKIT.settings.project;

			let list = '';
			let body = '';
			let label = ``;

			// No Projects
			if (isEmpty(projects)) {
				label = `<div id='linkit-project-add' class='linkit-project-button no-border no-padding no-margin'><div class='app-icon app-icon-small app-icon-add'></div>New Project</div>`;
			} else if (isEmpty(project)) {
				label = 'Select Project';
			}

			// List Projects
			if (isEmpty(project) && !isEmpty(projects) && projects.length > 0) {
				projects.forEach((project) => {
					list += `<div class='linkit-project-item' onclick="LINKIT.project.select('${project.id}')">${project.name}</div>`;
				});
			}

			list += `<div id='linkit-project-add' class='linkit-project-button'><div class='app-icon app-icon-small app-icon-add'></div>New Project</div>`;
			let content = `<div id='linkit-project-label'>${label}</div><div id='linkit-project-line'></div><div id='linkit-project-list' class='app-hidden'>${list}</div>${body}`;
			container.innerHTML = content;

			// Controls
			document.getElementById('linkit-project-label').addEventListener('click', () => {
				LINKIT.project.select();
			});

			if (isEmpty(projects)) {
				LINKIT.project.new();
			}
		},
	},
	load: function () {
		const project = LINKIT.settings.project;
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
	init: function () {
		// Get Saved Info
		const projectID = STORAGE.get('linkit-projectid');
		const entityID = STORAGE.get('linkit-entityid');

		// Initilize Database
		DATA.init('linkit');

		// Get Proejcts
		DATA.submit('projects').then((result) => {
			if (result && result.data) {
				LINKIT.settings.projects = result.data;
			}

			if (LINKIT.settings.projects.length > 0) {
				// Check Project
				if (!isEmpty(projectID)) {
					const project = LINKIT.settings.projects.find((project) => project.id == projectID);
					if (project && project.id == projectID) {
						LINKIT.settings.project = project;
					}
				}
			}

			LINKIT.project.load();
		});

		// DATA.submit('projects', [{ field: 'name', operator: '=', value: 'Project 1' }]).then((result) => {
		// 	if (result && result.data) {
		// 		console.log('LR1: ', result);
		// 	}
		// });

		// DATA.submit('projects', [{ field: 'name', operator: 'LIKE', value: '2' }], ['name']).then((result) => {
		// 	if (result && result.data) {
		// 		console.log('LR2: ', result);
		// 	}
		// });

		// if (LINKIT.settings.entity) {
		// 	LINKIT.load();
		// } else {
		// }
	},
};

// setTimeout(LINKIT.init, 1000);
LINKIT.init();
