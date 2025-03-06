const appContent = document.getElementById('app-content');
const APP = {
	data: {},
	timeouts: [],
	intervals: [],
	executions: [],
	settings: { page: '', theme: '', font: '' },
	page: {
		current: '',
		go: async function (pageID = '') {
			// Don't reload same page
			if (APP.page.current === pageID) {
				return;
			}

			let htmlPath = ``;
			let cssPath = ``;
			let jsPath = ``;
			if (pageID === 'home' || pageID === 'settings') {
				htmlPath = `/app/${pageID}.html`;
				cssPath = `/app/${pageID}.css`;
				jsPath = `/app/${pageID}.js`;
			} else {
				let pageData = null;
				if (APP.data && APP.data.pages) pageData = APP.data.pages.find((page) => page.id === pageID);
				if (pageData) {
					if (pageData && pageData.html) {
						htmlPath = pageData.html;
					}
					if (pageData && pageData.style) {
						cssPath = pageData.style;
					}
					if (pageData && pageData.script) {
						jsPath = pageData.script;
					}
				}
			}
			APP.page.reset();

			if (!isEmpty(htmlPath)) {
				const contentElement = document.getElementById('app-content-container');
				try {
					const response = await fetch(htmlPath);
					if (!response.ok) throw new Error(`Failed to load ${htmlPath}`);
					contentElement.innerHTML = await response.text();
					APP.page.current = pageID;
				} catch (error) {
					LOG.error('Error loading HTML:' + error);
				}

				// Load CSS
				if (!isEmpty(cssPath)) {
					try {
						const response = await fetch(cssPath);
						if (!response.ok) throw new Error(`Failed to load ${cssPath}`);

						const cssLink = document.createElement('link');
						cssLink.rel = 'stylesheet';
						cssLink.href = cssPath;
						cssLink.classList.add('dynamic-style'); // Mark to remove later
						document.head.appendChild(cssLink);
					} catch (error) {
						LOG.error('Error loading CSS:' + error);
					}
				}

				// Load JS
				if (!isEmpty(jsPath)) {
					try {
						const response = await fetch(jsPath);
						if (!response.ok) throw new Error(`Failed to load ${jsPath}`);

						const script = document.createElement('script');
						script.src = jsPath;
						script.classList.add('dynamic-script'); // Mark to remove later
						script.defer = true;
						document.body.appendChild(script);
					} catch (error) {
						LOG.error('Error loading JS:' + error);
					}
				}

				STORAGE.set('app-page', pageID);

				// Get Page Name
				const pageName = APP.data.pages.find((page) => page.id === pageID).name;

				if (pageName !== APP.data.name) {
					APP.title(APP.data.name + ' - ' + pageName);
				} else {
					APP.title(APP.data.name);
				}
			}

			if (APP.data.displayMenu === true) {
				document.getElementById('page-' + pageName).classList.add('active'); // Add Active Class to Page On Menu
				APP.menu.toggle(2); // Close Menu
			}
		},
		reset: function () {
			// Remove previous styles
			document.querySelectorAll('.dynamic-style').forEach((el) => el.remove());

			// Remove previous scripts
			document.querySelectorAll('.dynamic-script').forEach((el) => el.remove());

			// Menu Reset
			document.querySelectorAll('.app-menu-page').forEach((el) => el.classList.remove('active'));

			// Clear
			const contentElement = document.getElementById('app-content-container');
			if (contentElement) contentElement.innerHTML = '';

			if (APP.executions && APP.executions.length && APP.executions.length > 0) {
				APP.executions.forEach((execute, index) => {
					if (isFunction(execute)) {
						execute();
					}
					if (index == APP.executions.length - 1) {
						APP.executions = [];
					}
				});
			}

			APP.page.current = '';
		},
	},
	menu: {
		toggle: function (menuState = 0) {
			const menu = document.getElementById('app-menu');

			if (menu) {
				const toggle = document.getElementById('app-menu-toggle');
				const back = document.getElementById('app-menu-back');
				if (menuState === 0) {
					if (menu.classList.contains('app-menu-closed')) {
						menuState = 1;
					} else {
						menuState = 2;
					}
				}

				if (menuState === 1) {
					menu.classList.remove('app-menu-closed');
					toggle.classList.remove('app-menu-closed');
					back.classList.remove('app-menu-closed');
				} else {
					menu.classList.add('app-menu-closed');
					toggle.classList.add('app-menu-closed');
					back.classList.add('app-menu-closed');
				}
			}
		},
		init: function () {
			if (APP.data && APP.data.displayMenu === true) {
				let menuBack = document.getElementById('app-menu-back');
				if (!menuBack) {
					menuBack = document.createElement('div');
					menuBack.id = 'app-menu-back';
					appContent.insertAdjacentElement('beforebegin', menuBack);
				}

				let menu = document.getElementById('app-menu');
				if (!menu) {
					menu = document.createElement('aside');
					menu.id = 'app-menu';
					menuBack.insertAdjacentElement('afterend', menu);
				}

				// Main Menu Content
				let menuContent = `<h2 id="app-menu-header">Menu<div id="app-menu-toggle" class="menu-toggle"><div></div></div></h2><div id="app-menu-content">`;

				// Home
				if (APP.data.displayHome) {
					menuContent += `<div id="app-menu-home" class="app-menu-list">
									<div id="page-home" class="app-menu-page active" onclick="APP.page.go('home')">
										<div class="app-menu-page-icon app-icon-home"></div>
										<div class="app-menu-page-title">Home</div>
									</div>
								</div>`;
				}

				menuContent += `<div id="app-page-list" class="app-menu-list">`;
				// Pages
				if (APP.data && APP.data.pages) {
					APP.data.pages.forEach((page) => {
						let pageData = `<div id="page-${page.id}" class="app-menu-page" onclick="APP.page.go('${page.id}')">`;
						if (!isEmpty(page.icon)) {
							pageData += `<div class="app-menu-page-icon" style='background-image: url("${page.icon}")'></div>`;
						}
						pageData += `<div class="app-menu-page-title">${page.name}</div>`;
						pageData += `</div>`;

						menuContent += pageData;
					});
				}
				menuContent += `</div>`;

				// Settings
				if (APP.data.displaySettings) {
					menuContent += `<div id="app-menu-settings" class="app-menu-list">
									<div id="page-settings" class="app-menu-page active" onclick="APP.page.go('settings')">
										<div class="app-menu-page-icon app-icon-settings"></div>
										<div class="app-menu-page-title">Settings</div>
									</div>
								</div>`;
				}
				menuContent += '</div>';

				// Copyright
				if (!isEmpty(APP.data.copyright)) {
					menuContent += `<div id="app-copyright">${APP.data.copyright}</div>`;
				}

				// Add Content To Menu
				menu.innerHTML = menuContent;

				// Toggle
				const toggleButton = document.getElementById('app-menu-toggle');
				toggleButton.addEventListener('click', () => {
					APP.menu.toggle();
				});
			}
		},
	},
	font: {
		key: 'app-font',
		fonts: [
			{ name: 'Nunito', value: 'Nunito.ttf', class: 'font-nunito' },
			{ name: 'Playfair', value: 'Playfair.ttf', class: 'font-playfair' },
			{ name: 'CourierPrime', value: 'CourierPrime.ttf', class: 'font-courierprime' },
			{ name: 'Roboto', value: 'Roboto.ttf', class: 'font-roboto' },
		],

		apply: function (fontName) {
			if (isEmpty(fontName)) {
				fontName = APP.font.fonts[0].name;
			}

			const font = APP.font.fonts.find((f) => f.name === fontName);
			if (!font) {
				font = APP.font.fonts[0];
			}

			APP.font.fonts.forEach((f) => {
				document.body.classList.remove(f.class);
			});

			document.body.classList.add(font.class);
			APP.settings.font = font.name;
			STORAGE.set(APP.font.key, font.name);
		},
	},
	theme: {
		key: 'app-theme',
		themes: [
			{ name: 'Light', class: 'theme-light' },
			{ name: 'Dark', class: 'theme-dark' },
		],

		apply: function (themeName) {
			if (isEmpty(themeName)) {
				themeName = APP.theme.themes[0].name;
			}

			const theme = APP.theme.themes.find((t) => t.name === themeName);
			if (!theme) {
				theme = APP.theme.themes[0];
			}

			APP.theme.themes.forEach((t) => {
				document.body.classList.remove(t.class);
			});
			document.body.classList.add(theme.class);
			APP.settings.theme = theme.name;
			STORAGE.set(APP.theme.key, theme.name);
		},
	},
	pwa: {
		prompt: null,
		init: function () {
			if ('serviceWorker' in navigator) {
				navigator.serviceWorker.register('service-worker.js');
				APP.pwa.handle();
			}
		},
		handle: function () {
			let deferredPrompt;
			const installBtn = document.getElementById('app-install');

			window.addEventListener('beforeinstallprompt', (e) => {
				e.preventDefault();
				deferredPrompt = e;
			});

			installBtn.addEventListener('click', () => {
				deferredPrompt.prompt(); // Show Install Banner
				deferredPrompt.userChoice.then((choice) => {
					if (choice.outcome === 'accepted') {
						APP.pwa.installed();
					}
					deferredPrompt = null;
					location.reload();
				});
			});

			setTimeout(APP.pwa.installed, 500); // Check if the app is installed
		},
		installed: function () {
			const isInstalled = window.matchMedia('(display-mode: standalone)').matches;
			APP.settings.installed = isInstalled;
			const installBtn = document.getElementById('app-install');
			if (isInstalled) {
				installBtn.classList.add('app-hidden');
			} else {
				installBtn.classList.remove('app-hidden');
			}
		},
	},
	reset: function () {
		localStorage.clear();
		location.reload();
		navigator.serviceWorker.getRegistrations();
	},
	execute: function (callback) {
		APP.executions.push(callback);
	},
	title: function (title = '') {
		if (!isEmpty(title)) {
			document.title = title;
			document.getElementById('app-title').innerHTML = title;
		}
	},
	init: async function (callback) {
		try {
			// App Data (app.json)
			FETCH(
				'app.json',
				null, // No data payload for GET requests
				(data) => {
					APP.data = data;

					// Check Font
					let fontName = STORAGE.get('app-font');
					if (isEmpty(fontName)) fontName = APP.data.defaultFont;
					if (isEmpty(fontName) || !APP.font.fonts.find((f) => f.name === fontName)) fontName = APP.font.fonts[0].name;
					APP.font.apply(fontName);

					// Check Theme
					let themeName = STORAGE.get('app-theme');
					if (isEmpty(themeName)) {
						themeName = APP.data.defaultTheme;
					}
					if (isEmpty(themeName) || !APP.theme.themes.find((f) => f.name === themeName)) {
						themeName = APP.theme.themes[0].name;
					}
					APP.theme.apply(themeName);

					// App Info
					document.getElementById('app-name').innerHTML = APP.data.name;
					document.getElementById('app-favicon').href = APP.data.icon;
					document.getElementById('app-icon').src = APP.data.icon;

					// APP Title
					APP.title(APP.data.name);

					// Check Page
					let pageID = STORAGE.get('app-page');
					if (isEmpty(pageID)) {
						pageID = APP.data.defaultPage;
					}
					if (pageID === 'home' && APP.data.displayHome === false) {
						pageID = '';
					}
					if (pageID === 'settings' && APP.data.displaySettings === false) {
						pageID = '';
					}
					if (pageID !== 'home' && pageID !== 'settings' && (isEmpty(pageID) || !APP.data.pages.find((p) => p.id === pageID))) {
						pageID = APP.data.pages[0].id;
					}

					// Menu Initialize
					APP.menu.init();

					// PWA Initialize
					if (APP.data.allowInstall) {
						APP.pwa.init();
					}
					APP.page.go(pageID);

					callback();
				},
				(error) => {
					console.error(`Failed to load app.json:`, error);
				},
				{ method: 'GET' } // Override default POST method
			);
		} catch (error) {
			LOG.error('Error loading HTML:' + error);
		}
	},
};

const FETCH_REQUESTS = new Map(); // Track ongoing requests by URL+data
const FETCH = function (url = '', data = null, successCallback = null, failureCallback = null, options = {}) {
	if (isEmpty(url)) return;

	// Check Fetch
	const key = url + JSON.stringify(data);
	if (FETCH_REQUESTS.has(key)) {
		FETCH_REQUESTS.get(key).abort();
		FETCH_REQUESTS.delete(key);
	}

	// Create a new AbortController for this request
	const controller = new AbortController();
	const signal = controller.signal;
	FETCH_REQUESTS.set(key, controller);

	// Default options
	const defaultOptions = {
		cache: 'no-store',
		method: 'POST',
		mode: 'cors',
		headers: {
			'Content-Type': 'application/json',
		},
		signal, // Attach the signal to allow aborting the request
	};

	// Only include body if data is provided
	if (data) {
		defaultOptions.body = JSON.stringify(data);
	}

	// Merge user options
	const fetchOptions = { ...defaultOptions, ...options };

	fetch(url, fetchOptions)
		.then((response) => {
			if (!response.ok) {
				throw new Error(`HTTP error! Status: ${response.status}`);
			}
			return response.json();
		})
		.then((data) => {
			if (typeof successCallback === 'function') successCallback(data);
		})
		.catch((error) => {
			if (typeof failureCallback === 'function') failureCallback(error);
		})
		.finally(() => {
			FETCH_REQUESTS.delete(key); // Remove completed/canceled requests from the tracking list
		});
};

const NOTIFY = {
	send: function (title = '', message = '') {
		if (Notification.permission === 'granted') {
			new Notification(title, { body: message });
		} else if (Notification.permission !== 'denied') {
			NOTIFY.init(() => {
				NOTIFY.send(title, message);
			});
		}
	},
	init: function (callback) {
		if ('Notification' in window && APP.data.allowNotifications === true) {
			Notification.requestPermission().then((permission) => {
				if (permission === 'granted') {
					if (isFunction(callback)) callback();
					LOG.message('Notification permission granted.');
				} else {
					LOG.message('Notification permission denied.');
				}
			});
		} else {
			LOG.message('Notifications are not supported in this browser.');
		}
	},
};

const MESSAGE = {
	show: function (title = '', message = '', className = '', callback = null) {
		if (document.getElementById('app-message')) {
			document.getElementById('app-message').remove();
		}

		if (!isEmpty(message)) {
			// Message Back
			const appMessageBack = document.createElement('div');
			appMessageBack.id = 'app-message-back';
			appMessageBack.style.opacity = 0;
			appContent.appendChild(appMessageBack);

			const appMessage = document.createElement('div');
			appMessage.id = 'app-message';
			appMessage.style.opacity = 0;
			if (!isEmpty(className)) {
				appMessage.classList.add(className);
			}

			if (isEmpty(title)) {
				title = '';
			}
			appMessage.innerHTML = `<div id="app-message-title"><div id='app-message-title-text'>${title}</div><div id="app-message-close"></div></div><div id="app-message-content">${message}</div>`;
			appContent.appendChild(appMessage);
			setTimeout(() => {
				appMessageBack.style.opacity = 0.75;
				appMessage.style.opacity = 1;
				isFunction(callback) && callback();
			}, 200);

			document.getElementById('app-message-close').addEventListener('click', () => {
				MESSAGE.hide();
			});
			document.getElementById('app-message-back').addEventListener('click', () => {
				MESSAGE.hide();
			});
		}
	},
	confirm: function (title = '', message = '', confirmFunction = null) {
		if (!isEmpty(message) && !isEmpty(confirmFunction)) {
			message += "<div id='app-message-controls'><button id='app-message-confirm' class='app-button app-button-caution'>Yes</button><button id='app-message-cancel' class='app-button'>No</button></div>";
			MESSAGE.show(title, message, '', () => {
				const confirmButton = document.getElementById('app-message-confirm');
				confirmButton.addEventListener('click', () => {
					MESSAGE.hide();
					confirmFunction();
				});

				const cancelButton = document.getElementById('app-message-cancel');
				cancelButton.addEventListener('click', () => MESSAGE.hide());
			});
		}
	},
	error: function (message) {
		MESSAGE.show('Error', message, 'app-message-caution');
	},
	alert: function (title, message) {
		MESSAGE.show(title, message, 'app-message-caution');
	},
	hide: function () {
		const appMessageBack = document.getElementById('app-message-back');
		const appMessage = document.getElementById('app-message');

		appMessageBack.style.opacity = 0;
		appMessage.style.opacity = 0;
		setTimeout(() => {
			appMessageBack.remove();
			appMessage.remove();
		}, 1000);
	},
};

const STORAGE = {
	get: function (key) {
		let value = localStorage.getItem(key);
		try {
			return JSON.parse(value);
		} catch (e) {
			return value;
		}
	},
	set: function (key, value) {
		localStorage.setItem(key, JSON.stringify(value));
	},
	reset: function (key) {
		localStorage.removeItem(key);
	},
};

const LOG = {
	message: function (message) {
		if (!isEmpty(message) && console) console.log(message);
	},
	error: function (message) {
		if (!isEmpty(message) && console) console.error(message);
	},
};

const LOCATE = {};
// Functions
const isEmpty = (value) => value === undefined || value === null || (typeof value === 'string' && value.trim() === '') || (Array.isArray(value) && value.length === 0) || (typeof value === 'object' && Object.keys(value).length === 0);

const isFunction = (variable) => typeof variable === 'function';

const capitalizeFirst = (str) => str.charAt(0).toUpperCase() + str.slice(1);

const getValue = (inputID) => {
	if (!isEmpty(inputID)) {
		const input = document.getElementById(inputID);
		if (input && input.id == inputID && input.value) {
			return input.value;
		} else {
			return '';
		}
	}
	return '';
};

const setValue = (inputID, value) => {
	if (!isEmpty(inputID)) {
		const input = document.getElementById(inputID);
		if (input && input.id == inputID) {
			input.value = value;
		}
	}
};

const formatDateTime = (variable = '', dateFormat = '', timeFormat = '') => {
	const dateString = formatDate(variable, dateFormat);
	const timeString = formatTime(variable, timeFormat);
	return `${dateString} ${timeString}`;
};

const formatDate = (variable = '', format = '') => {
	if (isEmpty(variable)) return '';

	const date = new Date(variable);
	const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
	const day = date.getDate();
	const monthIndex = date.getMonth();
	const year = date.getFullYear();

	if (isEmpty(format)) {
		// Long
		return `${monthNames[monthIndex]} ${day}, ${year}`;
	} else {
		return format
			.replace('YYYY', year)
			.replace('MM', monthIndex + 1)
			.replace('DD', day);
	}
};

const formatTime = (variable = '', format = '') => {
	if (!variable) return ''; // Ensures variable is not empty or undefined

	const date = new Date(variable);
	if (isNaN(date.getTime())) return ''; // Handles invalid dates

	const hours = date.getHours();
	const minutes = date.getMinutes();
	const seconds = date.getSeconds();
	const ampm = hours >= 12 ? 'PM' : 'AM';
	const hours12 = hours % 12 || 12;

	// Ensure format is a string to prevent errors
	format = String(format);

	if (!format) {
		return `${hours12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
	} else {
		return format
			.replace('HH', (format.includes('AMPM') ? hours12 : hours).toString().padStart(2, '0'))
			.replace('mm', minutes.toString().padStart(2, '0'))
			.replace('ss', seconds.toString().padStart(2, '0'))
			.replace('AMPM', ampm);
	}
};

// Initialize PWA functionality
document.addEventListener('DOMContentLoaded', () => {
	APP.init(() => {
		// Wait for the app to initialize // Fade out and remove cover screen
		const cover = document.getElementById('app-cover');
		cover.style.opacity = '0'; // Smooth fade-out
		setTimeout(() => cover.remove(), 1000); // Remove after animation
	});
});
