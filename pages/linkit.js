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
	project: {
		get: function () {},
		update: function () {},
		delete: function () {},
		load: function () {
			const projects = LINKIT.settings.projects;
			const project = LINKIT.settings.project;
			let content = '';

			// No Projects
			if (isEmpty(projects)) {
				content += '<div class="linkit-header">No Projects</div>';
				content += `<div class='app-button app-button-small'>Add Project</div>`;
			} else if (isEmpty(project)) {
				// List Projects
				// List Projects
				content += '<div class="linkit-header">Select Project</div>';
				content += "<div class='linkit-list'>";

				projects.forEach((project) => {
					content += `<div class='linkit-list-item' data-id='${project.id}'>${project.name}</div>`;
				});

				content += '</div>';
				content += `<div class='app-button app-button-small'>Add Project</div>`;
			} else if (!isEmpty(project)) {
				// Load Project
				// List Projects
				content += `<div class="linkit-header">${project.name}</div>`;
			}
			container.innerHTML = content;
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
		console.log('INIT');

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

				LINKIT.project.load();
			}
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
