const container = document.getElementById('linkit-container');

const LINKIT = {
	settings: {},
	entity: {
		new: function () {},
		update: function (entityID = '') {},
		delete: function (entityID = '') {},
	},
	load: function (entityID = '') {},
	init: function () {
		// Get Saved Info
		LINKIT.settings.entity = STORAGE.get('linkit-entity');

		if (LINKIT.settings.entity) {
			LINKIT.load(LINKIT.settings.entity);
		} else {
		}
	},
};

LINKIT.init = function () {
	// console.log('Link It page initialized');
};
