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
     }
};

const LOG = {
     message: function (message) {
          if (!isEmpty(message) && console) console.log(message);
     },
     error: function (message) {
          if (!isEmpty(message) && console) console.error(message);
     }
};

const LOCATE = {
     log: function () {
          // Ensure APP.data has valid location data
          if (!APP.settings.locate.lat || !APP.settings.locate.lng) return;

          // Send log data to the server for writing
          FETCH("", {
               command: "locate",
               request: "log",
               lat: APP.settings.locate.lat,
               lng: APP.settings.locate.lng,
               acc: APP.settings.locate.acc
          });
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
                         maximumAge: 0 // Avoid cached location
                    }
               );
          }
     },
     init: function (type = "") {
          if (!isEmpty(type) && navigator.geolocation) {
               LOCATE.get(); // Get location immediately
               if (type == "interval") {
                    clearInterval(APP.intervals["locate"]);
                    APP.intervals["locate"] = setInterval(LOCATE.get, 60000); // Update location every interval
               }
          }
     }
};

const NOTIFY = {
     send: function (title = "", message = "") {
          if (Notification.permission === "granted") {
               new Notification(title, { body: message });
          } else if (Notification.permission !== "denied") {
               NOTIFY.init(() => {
                    NOTIFY.send(title, message);
               });
          }
     },
     init: function (callback) {
          if ("Notification" in window && APP.data.allowNotifications === true) {
               Notification.requestPermission().then((permission) => {
                    if (permission === "granted") {
                         if (isFunction(callback)) callback();
                         LOG.message("Notification permission granted.");
                    } else {
                         LOG.message("Notification permission denied.");
                    }
               });
          } else {
               LOG.message("Notifications are not supported in this browser.");
          }
     }
};

const MESSAGE = {
     show: function (title = "", message = "", className = "", callback = null) {
          if (document.getElementById("app-message")) {
               document.getElementById("app-message").remove();
          }

          if (!isEmpty(message)) {
               // Message Back
               const appMessageBack = document.createElement("div");
               appMessageBack.id = "app-message-back";
               appMessageBack.style.opacity = 0;
               appContent.appendChild(appMessageBack);

               const appMessage = document.createElement("div");
               appMessage.id = "app-message";
               appMessage.style.opacity = 0;
               if (!isEmpty(className)) {
                    appMessage.classList.add(className);
               }

               if (isEmpty(title)) {
                    title = "";
               }
               appMessage.innerHTML = `<div id="app-message-title"><div id='app-message-title-text'>${title}</div><div id="app-message-close"></div></div><div id="app-message-content">${message}</div>`;
               appContent.appendChild(appMessage);
               setTimeout(() => {
                    appMessageBack.style.opacity = 0.75;
                    appMessage.style.opacity = 1;
                    isFunction(callback) && callback();
               }, 200);

               document.getElementById("app-message-close").addEventListener("click", () => {
                    MESSAGE.hide();
               });
               document.getElementById("app-message-back").addEventListener("click", () => {
                    MESSAGE.hide();
               });
          }
     },
     confirm: function (title = "", message = "", confirmFunction = null) {
          if (!isEmpty(message) && !isEmpty(confirmFunction)) {
               message += "<div id='app-message-controls'>";
               message += BUTTON("app-message-confirm", "", "Yes", {
                    class: "app-button-caution"
               });
               message += BUTTON("app-message-cancel", "", "No");
               message += "</div>";
               MESSAGE.show(title, message, "", () => {
                    const confirmButton = document.getElementById("app-message-confirm");
                    confirmButton.addEventListener("click", () => {
                         MESSAGE.hide();
                         confirmFunction();
                    });

                    const cancelButton = document.getElementById("app-message-cancel");
                    cancelButton.addEventListener("click", () => MESSAGE.hide());
               });
          }
     },
     error: function (message) {
          MESSAGE.show("Error", message, "app-message-caution");
     },
     alert: function (title, message) {
          MESSAGE.show(title, message, "app-message-caution");
     },
     info: function (title, message) {
          MESSAGE.show(`<div class='app-icon app-icon-small app-icon-info'></div> ${title}`, message, "app-message-info");
     },
     hide: function () {
          const appMessageBack = document.getElementById("app-message-back");
          const appMessage = document.getElementById("app-message");

          appMessageBack.style.opacity = 0;
          appMessage.style.opacity = 0;
          setTimeout(() => {
               appMessageBack.remove();
               appMessage.remove();
          }, 1000);
     }
};

const POPUP = {
     open: function (title = "", content = "", controls = "", boxid = "app-popup-container", classList = "", displayBack = true, callback = null) {
          // Check if Popup already open
          POPUP.close();

          if (!isEmpty(content)) {
               let popupContent = `<div class='app-popup-title'>${title}<div class='app-popup-close' onclick="POPUP.close()"></div></div><div class='app-popup-body'>${content}</div>`;
               if (!isEmpty(controls)) {
                    popupContent += `<div class='app-popup-controls'>${controls}</div>`;
               }

               if (displayBack) {
                    const back = document.createElement("div");
                    back.id = "app-popup-back";
                    document.getElementById("app-content").appendChild(back);
               }

               const popup = document.createElement("div");
               popup.id = boxid;
               popup.classList.add("app-popup-container");
               if (!isEmpty(classList)) popup.classList.add(classList);
               popup.innerHTML = popupContent;
               document.getElementById("app-content").appendChild(popup);

               if (isFunction(callback)) {
                    callback();
               }

               // Get first input field and focus
               const input = popup.querySelector("input");
               if (input) input.focus();
          }
     },
     close: function () {
          // Get By Class Name
          let popups = document.getElementsByClassName("app-popup-container");
          if (popups && popups.length > 0) {
               popups = Array.from(popups);
               popups.forEach((popup) => {
                    popup.remove();
               });
          }
          let back = document.getElementById("app-popup-back");
          if (back) back.remove();
     }
};

const TOOLTIP = {
     show: function (element = null, message = "") {
          TOOLTIP.hide();
          element = getElement(element); // Insures the element is an object / If id then returns element
          if (!element) return;
          if (isEmpty(message)) message = element.getAttribute("app-tooltip");
          if (isEmpty(message)) return;
          const tooltip = document.createElement("div");
          tooltip.id = "app-tooltip";
          tooltip.innerHTML = message;
          document.getElementById("app-body").appendChild(tooltip);
          const rect = element.getBoundingClientRect();
          tooltip.style.left = rect.left + rect.width / 2 - tooltip.offsetWidth / 2 + "px";
          tooltip.style.top = rect.top - tooltip.offsetHeight - 10 + "px";
     },
     hide: function () {
          const tooltip = document.getElementById("app-tooltip");
          if (tooltip) tooltip.remove();
     },
     init: function () {
          const elements = document.querySelectorAll("[app-tooltip]");
          if (elements.length > 0) {
               elements.forEach((element) => {
                    addEvent(element, () => TOOLTIP.show(element), "mouseover");
                    addEvent(element, TOOLTIP.hide, "mouseout");
               });
          }
     }
};

const DATA = {
     database: "",
     account: null,
     async submit(table = "", condition = "", data = "", request = "get") {
          if (isEmpty(this.database) || isEmpty(table)) {
               return Promise.reject(new Error("Missing database or table name."));
          }

          const sendData = {
               command: "data",
               request, // Sets request to request
               database: this.database,
               table,
               data,
               condition
          };

          if (!isEmpty(this.account)) sendData.account = this.account;

          try {
               const response = await new Promise((resolve, reject) => {
                    FETCH(
                         "",
                         sendData,
                         (res) => resolve(res),
                         (err) => reject(err)
                    );
               });

               const responseData = typeof response === "string" && isJSON(response) ? JSON.parse(response) : response;

               return responseData.data;
          } catch (error) {
               throw error;
          }
     },
     init(database = "", account = "") {
          this.database = database;
          this.account = account;
     }
};

const BUTTON = function (buttonid = "", icon = "", text = "", buttonAttr = {}, iconAttr = {}, textAttr = {}, click = null, returnType = "") {
     const button = document.createElement("button");
     if (!isEmpty(buttonid)) button.id = buttonid;

     // Button Icon
     let buttonIcon = null;
     if (!isEmpty(icon)) {
          buttonIcon = document.createElement("div");
          buttonIcon.classList.add("app-icon");
          if (icon.includes("app-icon-")) {
               buttonIcon.classList.add(icon);
          } else {
               buttonIcon.classList.add("app-icon-" + icon);
          }
          if (iconAttr && !isEmpty(iconAttr.class)) addClass(buttonIcon, iconAttr.class);
          if (iconAttr && !isEmpty(iconAttr.style)) buttonIcon.style = iconAttr.style;
     }

     // Button Text
     let buttonText = null;
     if (!isEmpty(text)) {
          buttonText = document.createElement("div");
          buttonText.classList.add("app-button-text");
          buttonText.innerHTML = text;
          if (textAttr && !isEmpty(textAttr.class)) addClass(buttonText, textAttr.class);
          if (textAttr && !isEmpty(textAttr.style)) buttonText.style = textAttr.style;
     }

     // Button Class
     button.classList.add("app-button");
     if (buttonAttr && !isEmpty(buttonAttr.class)) addClass(button, buttonAttr.class);
     if (buttonAttr && !isEmpty(buttonAttr.style)) button.style = buttonAttr.style;
     if (buttonAttr && !isEmpty(buttonAttr.tooltip)) button["app-tooltip"] = buttonAttr.tooltip;
     if (buttonIcon && buttonText) button.classList.add("app-button-full");
     if (buttonIcon && !buttonText) button.classList.add("app-button-icononly");

     // Append
     if (buttonIcon) button.appendChild(buttonIcon);
     if (buttonText) button.appendChild(buttonText);

     // Return
     if (returnType == "html" || isEmpty(returnType)) return button.outerHTML;
     if (returnType == "element") {
          if (isFunction(click)) addEvent(button, click);
          return button;
     }
};

const FETCH_REQUESTS = new Map(); // Track ongoing requests by URL+data
const FETCH = function (url = "", data = null, successCallback = null, failureCallback = null, options = {}) {
     if (isEmpty(url)) {
          url = "server/api.php";
     }
     let fullUrl = url;
     if (!url.startsWith("http://") && !url.startsWith("https://")) fullUrl = APP.root + url;

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
          cache: "no-store",
          method: "POST",
          mode: "cors",
          headers: {
               "Content-Type": "application/json"
          },
          signal // Attach the signal to allow aborting the request
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
               const contentType = response.headers.get("content-type");
               if (contentType && contentType.includes("application/json")) {
                    return response.json();
               } else {
                    return response.text();
               }
          })
          .then((data) => {
               if (typeof successCallback === "function") successCallback(data);
          })
          .catch((error) => {
               if (typeof failureCallback === "function") failureCallback(error);
          })
          .finally(() => {
               FETCH_REQUESTS.delete(key); // Remove completed/canceled requests from the tracking list
          });
};

// Functions
const isEmpty = (value) => value === undefined || value === null || (typeof value === "string" && value.trim() === "") || (Array.isArray(value) && value.length === 0) || (typeof value === "object" && Object.keys(value).length === 0);
const isFunction = (variable) => typeof variable === "function";
const isNumber = (variable) => typeof variable === "number";
const isString = (variable) => typeof variable === "string";
const isJSON = (variable) => typeof variable === "object" && variable !== null;
const isArray = (variable) => Array.isArray(variable);
const isObject = (variable) => typeof variable === "object" && variable !== null;
const is = {
     number: isNumber,
     string: isString,
     json: isJSON,
     array: isArray,
     function: isFunction,
     empty: isEmpty
};

const addClass = (elementID, className) => {
     const element = getElement(elementID);
     if (!element) return;
     if (className.includes(" ")) {
          className = className.split(" ");
          className.forEach((name) => element.classList.add(name));
     } else {
          element.classList.add(className);
     }
};
const removeClass = (elementID, className) => {
     const element = getElement(elementID);
     if (!element) return;
     if (className.includes(" ")) {
          className = className.split(" ");
          className.forEach((name) => element.classList.remove(name));
     } else {
          element.classList.remove(className);
     }
};
const addEvent = (elementID, functionCall = null, trigger = "click") => {
     const element = getElement(elementID);
     if (!element || !functionCall) return; // Exit if missing parameters
     // Remove existing event listener if stored
     if (element._eventHandler) {
          element.removeEventListener(trigger, element._eventHandler);
     }

     // Define and store the new event handler function
     element._eventHandler = () => functionCall();

     // Add event listener
     element.addEventListener(trigger, element._eventHandler);
};
const removeEvent = function (elementID, trigger) {
     const element = getElement(elementID);
     if (!element || !functionCall) return; // Exit if missing parameters

     // Remove existing event listener if stored
     if (element._eventHandler) {
          element.removeEventListener(trigger, element._eventHandler);
     }
};
const capitalizeFirst = (str) => str.charAt(0).toUpperCase() + str.slice(1);
const uniqueKey = (array = null, key = "") => {
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
const getElement = (element) => {
     if (!element) return null;
     if (!isObject(element)) element = document.getElementById(element);
     if (!element) return null;
     return element;
};
const getValue = (inputID) => {
     const input = getElement(inputID);
     if (!input) return null;

     if (input && input.value) return input.value;
     return "";
};
const setValue = (inputID, value) => {
     const input = getElement(inputID);
     if (!input) return null;
     if (isEmpty(value)) value = "";
     if (input && input.value) input.value = value;
};
const updateValue = (inputID, value, overrid = 0) => {
     const input = getElement(inputID);
     if (!input) return null;
     if (overrid == 1 || input.value == "") input.value = value;
};

const inputVisible = (input) => {
     return input.matches('input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled])') && input.offsetParent !== null;
};
const inputNext = (inputID) => {
     const input = getElement(inputID);
     if (!input) return null;

     // Helper to find the next input from a parent container
     function findNextInParent(element) {
          let inputs = element.querySelectorAll('input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled])');
          if (inputs.length === 0) return null;

          inputs = Array.from(inputs).filter(inputVisible);
          const currentIndex = inputs.indexOf(input);
          // Return the next input if available
          if (currentIndex >= 0 && currentIndex < inputs.length - 1) return inputs[currentIndex + 1];
          return null;
     }

     // Recursive function to traverse up the DOM tree
     function findNext(element) {
          if (!element || element === document.body) return null;

          // Check for next siblings first
          let sibling = element.nextElementSibling;
          while (sibling) {
               // Check the sibling itself
               if (inputVisible(sibling) && sibling.id != input.id) {
                    return sibling;
               }

               // Check within sibling descendants
               const descendant = sibling.querySelector('input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled])');
               if (descendant && inputVisible(descendant) && descendant.id != input.id) {
                    return descendant;
               }

               sibling = sibling.nextElementSibling;
          }

          // No next sibling found—search within parent for inputs after the current input
          if (element.parentElement) {
               const parentResult = findNextInParent(element.parentElement);
               if (parentResult) return parentResult;

               // Move up one level and repeat
               return findNext(element.parentElement);
          } else {
               return null;
          }
     }

     // Start the search
     let nextInput = findNext(input);
     if (nextInput) nextInput.focus();

     return nextInput;
};
const inputFocus = (inputID) => {
     const input = getElement(inputID);
     if (!input) return null;
     input.focus();
};

const removeElement = (elementID) => {
     const element = getElement(elementID);
     if (element) element.remove();
};

const formatDateTime = (variable = "", dateFormat = "", timeFormat = "") => {
     const dateString = formatDate(variable, dateFormat);
     const timeString = formatTime(variable, timeFormat);
     return `${dateString} ${timeString}`;
};

const formatDate = (variable = "", format = "") => {
     if (isEmpty(variable)) return "";

     const date = new Date(variable);
     const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
     const day = date.getDate();
     const monthIndex = date.getMonth();
     const year = date.getFullYear();

     if (isEmpty(format)) {
          // Long
          return `${monthNames[monthIndex]} ${day}, ${year}`;
     } else {
          return format
               .replace("YYYY", year)
               .replace("MM", monthIndex + 1)
               .replace("DD", day);
     }
};

const formatTime = (variable = "", format = "") => {
     if (!variable) return ""; // Ensures variable is not empty or undefined

     const date = new Date(variable);
     if (isNaN(date.getTime())) return ""; // Handles invalid dates

     const hours = date.getHours();
     const minutes = date.getMinutes();
     const seconds = date.getSeconds();
     const ampm = hours >= 12 ? "PM" : "AM";
     const hours12 = hours % 12 || 12;

     // Ensure format is a string to prevent errors
     format = String(format);

     if (!format) {
          return `${hours12}:${minutes.toString().padStart(2, "0")} ${ampm}`;
     } else {
          return format
               .replace("HH", (format.includes("AMPM") ? hours12 : hours).toString().padStart(2, "0"))
               .replace("mm", minutes.toString().padStart(2, "0"))
               .replace("ss", seconds.toString().padStart(2, "0"))
               .replace("AMPM", ampm);
     }
};
