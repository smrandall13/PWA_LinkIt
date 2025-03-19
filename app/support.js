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

const LOCATE = {
	log: function () {
		// Ensure APP.data has valid location data
		if (!APP.settings.locate.lat || !APP.settings.locate.lng) return;

		// Send log data to the server for writing
		FETCH('', { command: 'locate', request: 'log', lat: APP.settings.locate.lat, lng: APP.settings.locate.lng, acc: APP.settings.locate.acc });
	},
	get: function () {
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(
				(position) => {
					APP.settings.locate.lat = position.coords.latitude;
					APP.settings.locate.lng = position.coords.longitude;
					APP.settings.locate.acc = position.coords.accuracy;

					// Log location after getting it
					LOCATE.log();
				},
				(error) => {
					LOG.error(`Location error: ${error}`);
				},
				{
					enableHighAccuracy: true, // Request the most precise location
					timeout: 3000, // Max wait time for a response (10 sec)
					maximumAge: 0, // Avoid cached location
				}
			);
		}
	},
	init: function (type = '') {
		if (!isEmpty(type) && navigator.geolocation) {
			LOCATE.get(); // Get location immediately
			if (type == 'interval') {
				clearInterval(APP.intervals['locate']);
				APP.intervals['locate'] = setInterval(LOCATE.get, 60000); // Update location every interval
			}
		}
	},
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

const POPUP = {
	open: function (title = '', content = '', controls = '', boxid = 'app-popup-container', classList = '', displayBack = true, callback = null) {
		// Check if Popup already open
		POPUP.close();

		if (!isEmpty(content)) {
			let popupContent = `<div class='app-popup-title'>${title}<div class='app-popup-close' onclick="POPUP.close()"></div></div><div class='app-popup-body'>${content}</div>`;
			if (!isEmpty(controls)) {
				popupContent += `<div class='app-popup-controls'>${controls}</div>`;
			}

			if (displayBack) {
				const back = document.createElement('div');
				back.id = 'app-popup-back';
				document.getElementById('app-content').appendChild(back);
			}

			const popup = document.createElement('div');
			popup.id = boxid;
			popup.classList.add('app-popup-container');
			if (!isEmpty(classList)) popup.classList.add(classList);
			popup.innerHTML = popupContent;
			document.getElementById('app-content').appendChild(popup);

			if (isFunction(callback)) {
				callback();
			}

			// Get first input field and focus
			const input = popup.querySelector('input');
			if (input) input.focus();
		}
	},
	close: function () {
		// Get By Class Name
		let popups = document.getElementsByClassName('app-popup-container');
		if (popups && popups.length > 0) {
			popups = Array.from(popups);
			popups.forEach((popup) => {
				popup.remove();
			});
		}
		let back = document.getElementById('app-popup-back');
		if (back) back.remove();
	},
};

const DATA = {
	database: '',
	account: null,
	submit: function (table = '', condition = '', fields = '', request = 'get') {
		if (!isEmpty(this.database) && !isEmpty(table)) {
			return new Promise((resolve, reject) => {
				// Send request
				const sendData = { command: 'data', request: request, database: this.database, table: table, fields: fields, condition: condition };
				if (!isEmpty(this.account)) sendData.account = this.account;

				FETCH(
					'',
					sendData,
					(response) => {
						// Check if data is JSON or string
						if (typeof response === 'string' && isJSON(response)) {
							response = JSON.parse(response);
						}
						resolve(response.data); // Already an object or a raw string
					},
					(error) => {
						reject(error);
					}
				);
			});
		}
	},
	init: function (database = '', account = '') {
		this.database = database;
		this.account = account;
	},
};

const FETCH_REQUESTS = new Map(); // Track ongoing requests by URL+data
const FETCH = function (url = '', data = null, successCallback = null, failureCallback = null, options = {}) {
	if (isEmpty(url)) {
		url = 'server/api.php';
	}
	let fullUrl = url;
	if (!url.startsWith('http://') && !url.startsWith('https://')) fullUrl = APP.root + url;

	// Check Fetch
	const key = fullUrl + JSON.stringify(data);
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

	fetch(fullUrl, fetchOptions)
		.then((response) => {
			if (!response.ok) {
				throw new Error(`HTTP error! Status: ${response.status}`);
			}
			const contentType = response.headers.get('content-type');
			if (contentType && contentType.includes('application/json')) {
				return response.json();
			} else {
				return response.text();
			}
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

// Functions
const isEmpty = (value) => value === undefined || value === null || (typeof value === 'string' && value.trim() === '') || (Array.isArray(value) && value.length === 0) || (typeof value === 'object' && Object.keys(value).length === 0);
const isFunction = (variable) => typeof variable === 'function';
const isNumber = (variable) => typeof variable === 'number';
const isString = (variable) => typeof variable === 'string';
const isJSON = (variable) => typeof variable === 'object' && variable !== null;
const isArray = (variable) => Array.isArray(variable);
const is = {
	number: isNumber,
	string: isString,
	json: isJSON,
	array: isArray,
	function: isFunction,
	empty: isEmpty,
};

const addClass = (elementID, className) => document.getElementById(elementID).classList.add(className);
const removeClass = (elementID, className) => document.getElementById(elementID).classList.remove(className);
const rmClass = removeClass;
const addEvent = (element, functionCall = null, trigger = 'click') => {
	if (!element || !functionCall) return; // Exit if missing parameters

	// If element is a string, get the actual DOM element
	if (typeof element === 'string') {
		element = document.getElementById(element);
	}

	if (element) {
		// Remove existing event listener if stored
		if (element._eventHandler) {
			element.removeEventListener(trigger, element._eventHandler);
		}

		// Define and store the new event handler function
		element._eventHandler = () => functionCall();

		// Add event listener
		element.addEventListener(trigger, element._eventHandler);
	}
};
const removeEvent = function (element, trigger) {
	if (!element || !functionCall) return; // Exit if missing parameters

	// If element is a string, get the actual DOM element
	if (typeof element === 'string') {
		element = document.getElementById(element);
	}

	if (element) {
		// Remove existing event listener if stored
		if (element._eventHandler) {
			element.removeEventListener(trigger, element._eventHandler);
		}
	}
};

const capitalizeFirst = (str) => str.charAt(0).toUpperCase() + str.slice(1);

const uniqueKey = (array = null, key = '') => {
	if (!isArray(array)) return [];
	let list = [];
	if (isEmpty(key)) {
		list = [...new Set(array)];
	} else {
		list = [...new Set(array.map((item) => item[key]))];
	}

	list = list.filter((item) => !isEmpty(item)); // Remove Empty
	list.sort((a, b) => a.localeCompare(b)); // Sort

	return list;
};
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
