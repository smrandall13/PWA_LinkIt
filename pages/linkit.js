const LINKIT = {
     settings: {
          projectid: "",
          entityid: "",
          relationshipid: "",
          entitytype: "",
          activetab: "details",
          visual: "graph",
          visualgrid: true,
          projects: [],
          entities: [],
          relationships: [],
          properties: [],
          projectLimit: 3,
          entityLimit: 100,
          timeouts: [],
          edited: false,
          colorDefault: "#00a878",
          siteupgrade: "https://shaunrandall.com"
     },
     form: {
          open: function (tableName = "", newItem = 0) {
               LINKIT.form.close();

               // Base Variables
               let items = [];
               let itemid = "";
               let itemKey = "";
               let label = "";
               let typeChange = "";

               let itemTitle = "Project";
               let tabTitle = "Project";
               if (tableName == "entities") {
                    itemTitle = "Entity";
                    tabTitle = "Entity";
               }
               let itemCloseTitle = itemTitle;

               if (newItem == 1) itemTitle = "New " + itemTitle;
               let onChange = () => {
                    LINKIT.settings.edited = true;
               };

               // Form Details
               if (tableName == "entities") {
                    items = LINKIT.settings.entities;
                    itemid = LINKIT.settings.entityid;
                    label = "New Entity";
                    funKey = "entity";
                    itemKey = "entityid";
                    if (newItem === 1) {
                         typeChange = ` onchange='LINKIT.entity.type(this.value)'`;
                    }
               } else if (tableName == "relationships") {
                    items = LINKIT.settings.relationships;
                    itemid = LINKIT.settings.relationshipid;
                    label = "New Relationship";
                    funKey = "relationship";
                    itemKey = "relationshipid";
               } else if (tableName == "projects") {
                    items = LINKIT.settings.projects;
                    itemid = LINKIT.settings.projectid;
                    label = "New Project";
                    funKey = "project";
                    itemKey = "projectid";
               }

               if ((!items || items.length === 0) && newItem === 0) return; // Exit if No Items

               let item = itemid ? items.find((item) => item.id === itemid) : null;
               if (newItem === 1) {
                    item = null;
                    itemid = "";
                    onChange = null;
               }
               if (item && item.id === LINKIT.settings.entityid) {
                    // Find In Menu
                    const entity = document.getElementById(`linkit-entity-${item.id}`);
                    document.querySelectorAll(".linkit-entity-item").forEach((item) => item.classList.remove("linkit-entity-item-selected"));
                    entity.classList.add("linkit-entity-item-selected");
                    entity.parentNode.classList.remove("app-group-closed");
               }

               // Gather All Properties
               let allProperties = [];
               if (LINKIT.settings.properties && LINKIT.settings.properties.length > 0) {
                    // Gather Core Properties
                    LINKIT.settings.properties.forEach((property) => {
                         if (property.list && property.list.length > 0) {
                              allProperties = [...allProperties, ...property.list];
                         }
                    });
               }
               if (LINKIT.settings.entities && LINKIT.settings.entities.length > 0) {
                    // Gather Entity Properties
                    LINKIT.settings.entities.forEach((entity) => {
                         if (entity.properties && entity.properties.length > 0) {
                              allProperties = [...allProperties, ...entity.properties];
                         }
                    });
               }

               // Attribute Options
               let propertyLabels = "";
               let propertyGroups = "";
               if (allProperties && allProperties.length > 0) {
                    // Attribute Labels
                    let uniqueAttributeLabels = uniqueKey(allProperties, "label");
                    if (uniqueAttributeLabels && uniqueAttributeLabels.length > 0) uniqueAttributeLabels.forEach((label) => (propertyLabels += `<option value='${label}'>${label}</option>`));

                    // Attribute Groups
                    let uniqueAttributeGroups = uniqueKey(allProperties, "group");
                    if (uniqueAttributeGroups && uniqueAttributeGroups.length > 0) uniqueAttributeGroups.forEach((group) => (propertyGroups += `<option value='${group}'>${group}</option>`));
               }

               // Relationship Options
               let relationshipTypeOptions = "";
               if (LINKIT.settings.relationships && LINKIT.settings.relationships.length > 0) {
                    // Relationship Types
                    let relationshipTypes = uniqueKey([...uniqueKey(LINKIT.settings.relationships, "sourcetype"), ...uniqueKey(LINKIT.settings.relationships, "targettype")]);
                    if (relationshipTypes && relationshipTypes.length > 0) {
                         relationshipTypes.forEach((type) => (relationshipTypeOptions += `<option value='${type}'>${type}</option>`));
                    }
               }

               // Types
               let types = uniqueKey(items, "type");
               if (isEmpty(types) && tableName == "projects") types = types = [...types, ...["ERD", "Hierarchy", "Custom"]];
               if (tableName == "entities") types = [...types, ...["Person", "Place", "Thing"]];
               types = uniqueKey(types);
               let typeOptions = "";
               if (types && types.length > 0) {
                    types.forEach((type) => (typeOptions += `<option value='${type}'>${type}</option>`));
               }

               const getKeyValue = (key, removeDoubleQuotes = 0) => {
                    let value = "";
                    if (isEmpty(key) || !item) value = "";
                    if (item && item[key]) value = item[key];
                    if (isEmpty(value)) value = "";
                    if (removeDoubleQuotes == 1) value = value.replace(/"/g, "");
                    return value;
               };

               // Properties
               let properties = [];
               let controls = BUTTON("linkit-control-create", "", "Create", { class: "app-button-small linkit-button flex-1" });
               if (!isEmpty(itemid)) {
                    if (item && item.id === LINKIT.settings[itemKey]) {
                         if (tableName == "entities") properties = item.properties;
                         label = item.name; //item.type + ': ' + item.name;
                         controls = BUTTON("linkit-control-update", "edit", "Update", {
                              class: "app-button-small linkit-button flex-1"
                         });
                         controls += BUTTON("linkit-control-delete", "delete", "Delete", {
                              class: "app-button-small linkit-button app-button-caution linkit-button-caution flex-1"
                         });
                    }
               }
               if (newItem === 1) {
                    const typeProperties = LINKIT.property.type("Core");
                    if (typeProperties && typeProperties.length && typeProperties.length > 0) properties = typeProperties;
               }
               if (!isArray(properties)) properties = [];

               // Relationships
               let relationships = [];
               if (tableName == "entities" && !isEmpty(itemid)) {
                    relationships = LINKIT.settings.relationships.filter((item) => item.source === itemid || item.target === itemid);
               }

               // Tabs
               if (isEmpty(itemid) || isEmpty(LINKIT.settings.activetab)) LINKIT.settings.activetab = "details";
               const activeTab = LINKIT.settings.activetab;

               // Tab Content
               let entityFields = ``;
               let propertyContent = ``;
               let relationshipContent = "";
               if (tableName == "entities") {
                    let entityColor = getKeyValue("color") || LINKIT.settings.colorDefault || "#00a878";

                    entityFields = `
                         <div class='app-box-label'>Color</div>
                         <div class='app-box-value'>
                              <input type="color" id="linkit-form-color" class='app-hidden' value="${entityColor}" />
                              <div id='linkit-form-color-picker' class='app-color-picker' style='background-color:${entityColor};' onclick="COLOR.open('linkit-form-color')"></div>
                         </div>
                    `;

                    if (!isEmpty(itemid)) {
                         let propDelete = BUTTON("linkit-properties-button-delete", "delete", "Delete All", { class: "app-button-small linkit-button linkit-button-caution flex-1" });
                         if (properties.length == 0) propDelete = "";

                         // Attribute Content
                         propertyContent = `<div id='linkit-tab-container-properties' class='app-box-partial linkit-tab-container linkit-position-fixed ${activeTab == "properties" ? "" : "app-hidden"}'>
                              <div class='linkit-tab-title'>Properties</div>
                              <div class='linkit-box-body' style='padding-top:0;'>
                                   <div id='linkit-properties-list' class='app-box-grid'>${LINKIT.property.list(properties)}</div>
                                   <datalist id='linkit-propertygroups'>${propertyGroups}</datalist>
                                   <datalist id='linkit-propertylabels'>${propertyLabels}</datalist>
                              </div>

                              <div class='linkit-box-controls'>
                                   ${BUTTON("linkit-property-info", "info", "", { class: "app-button-small linkit-icon", tooltip: "Property Info" })}
                                   ${BUTTON("linkit-properties-button-new", "add", "Property", { class: "app-button-small linkit-button flex-1" })}
                                   ${propDelete}
                              </div>
                         </div>`;

                         // Relationship Content
                         let relateButton = BUTTON("linkit-relationships-button-delete", "delete", "Delete All", {
                              class: "app-button-small linkit-button linkit-button-caution flex-1"
                         });
                         if (relationships.length == 0) relateButton = "";

                         relationshipContent = `<div id='linkit-tab-container-relationships' class='app-box-partial linkit-tab-container linkit-position-fixed ${activeTab == "relationships" ? "" : "app-hidden"}'>
                              <div class='linkit-tab-title'>Relationships</div>
                              <div class='linkit-box-body' style='padding-top:0;'>
                                   <div id='linkit-relationships-list' class=' linkit-list' style='display:flex;flex-direction:column;gap:4px;'>${LINKIT.relationship.list(relationships)}</div>
                                   <datalist id='linkit-relationshiptypes'>${relationshipTypeOptions}</datalist>
                              </div>
                              <div class='linkit-box-controls'>					

                                   ${BUTTON("linkit-relationship-info", "info", "", {
                                        class: "app-button-small linkit-icon",
                                        tooltip: "Relationship Info"
                                   })}	

                                   ${BUTTON("linkit-relationship-button-new", "add", "Relationship", {
                                        class: "app-button-small linkit-button flex-1"
                                   })}		

                                   ${relateButton}

                              </div>
                         </div>`;
                    }
               }

               // File Content
               let fileContent = ``;
               if (newItem !== 1) {
                    fileContent = `<div id='linkit-tab-container-files' class='app-box-partial linkit-tab-container linkit-position-fixed ${activeTab == "files" ? "" : "app-hidden"}'>
                              <div class='linkit-tab-title'>Files</div>
                              <div id='linkit-files-list' class='bordered-wrap width-100'>
                                   <div class='align-center' style='width:100%;grid-column: span 2;margin-top:24px;'>Files are not allowed<br>under the current plan.
                                        <div class='flex-row justify-center mart-8'>
                                             ${BUTTON("linkit-plan-upgrade", "", "Upgrade Plan", {
                                                  class: "app-button-small linkit-button padl-8 padr-8"
                                             })}	
                                        </div>
                                   </div>
                              </div>
                         </div>`;
               }

               let tabs = `<div class='linkit-tabs'>
                         <div id='linkit-tab-details' class='linkit-tab ${activeTab == "details" ? "linkit-tab-selected" : ""}' onclick="LINKIT.tabs.select('details')">${tabTitle}</div>`;
               if (!isEmpty(propertyContent)) tabs += `<div id='linkit-tab-properties' class='linkit-tab ${activeTab == "properties" ? "linkit-tab-selected" : ""}' onclick="LINKIT.tabs.select('properties')">Properties</div>`;
               if (!isEmpty(relationshipContent)) tabs += `<div id='linkit-tab-relationships' class='linkit-tab ${activeTab == "relationships" ? "linkit-tab-selected" : ""}' onclick="LINKIT.tabs.select('relationships')">Relationships</div>`;
               if (!isEmpty(itemid)) {
                    tabs += `<div id='linkit-tab-files' class='linkit-tab ${activeTab == "files" ? "linkit-tab-selected" : ""}' onclick="LINKIT.tabs.select('files')">Files</div>`;
               }
               tabs += `</div>`;

               const box = document.createElement("div");
               box.id = "linkit-edit-form";
               box.classList.add("linkit-popup-container");
               box.classList.add("linkit-position-top");

               box.innerHTML = `<div class='linkit-popup-body' style='overflow:visible;padding-top:0;'>
                         <div class='linkit-box gap-8'>
                              <div class='linkit-container linkit-container-title'>
                                   ${label}
                                   <div class='app-icon app-icon-small pointer app-icon-close' onclick="LINKIT.form.close()"></div>
                              </div>

                              <div class='app-box-body flex-row' style='align-items: stretch;'>		

                                   <div id='linkit-tab-container-details' class='app-box-partial linkit-tab-container linkit-position-fixed ${activeTab == "details" ? "" : "app-hidden"}'>
                                        <div class='linkit-tab-title'>${itemTitle}</div>
                                        <div class='linkit-box-body'>
                                             <input type="hidden" id="linkit-form-table" value='${tableName}' />
                                             
                                             <div class='app-box-label space-between'>Name</div>
                                             <div class='app-box-value'>
                                                  <input type="text" id="linkit-form-name" placeholder="Name" value="${getKeyValue("name", 1)}" class='linkit-input' />
                                             </div>
                                             
                                             <div class='app-box-label'>Type</div><div class='app-box-value'>
                                                  <input type="text" id="linkit-form-type" placeholder="Type" list="linkit-types" value="${getKeyValue("type", 1)}" class='linkit-input' ${typeChange}/>
                                                  <datalist id='linkit-types'>${typeOptions}</datalist>
                                             </div>

                                             ${entityFields}
                                             
                                             <div class='app-box-label'>Description</div>
                                             <div class='app-box-value'>
                                                  <textarea id="linkit-form-description" style='min-height:100px;' class='linkit-input'>${getKeyValue("description", 1)}</textarea>
                                             </div>
                                        </div>

                                        <div class='linkit-box-controls app-box-controls'>${controls}</div>
                                   </div>

                                   ${propertyContent}
                                   ${relationshipContent}
                                   ${fileContent}	

                                   ${tabs}
                              </div>
                         </div>
                    </div>`;
               document.getElementById("linkit-container").appendChild(box);

               // Get first input field and focus
               const postAppend = () => {
                    const input = box.querySelector("input");
                    if (input) input.focus();

                    // Add events
                    addEvent("linkit-control-create", () => {
                         LINKIT.update(1);
                    });
                    addEvent("linkit-control-update", () => {
                         LINKIT.update();
                    });
                    addEvent("linkit-control-delete", () => {
                         LINKIT.delete();
                    });

                    addEvent("linkit-relationship-button-new", () => {
                         LINKIT.relationship.edit();
                    });
                    addEvent("linkit-relationship-add", () => {
                         LINKIT.relationship.add();
                    });
                    addEvent("linkit-relationship-info", () => {
                         MESSAGE.info(
                              `Relationship Info`,
                              "Relationship are links between entities.<br>Relationships consist of a Type and Entity.<br><br>The type represents how the two entities are linked.<br><br>To Remove a relationship, clear the Type and Entity fields and click the Update button.<br><br>To add a new relationship, us the + Relationship button and fill out the New Relationship form."
                         );
                    });

                    addEvent("linkit-properties-button-new", () => {
                         LINKIT.property.edit(0);
                    });
                    addEvent("linkit-property-info", () => {
                         MESSAGE.info(
                              `Property Info`,
                              `Properties consist of a Group, Label, and Value.<br>Groups are used to group related properties together, Labels are used to identify the property, and Values are used to store the actual data.<br><br>To Edit or Remove a property, click the Edit button [<div class='app-icon-inline app-icon-edit'></div>] on the row of the property.<br><br>To add a new property use the + Property button and fill out the New Property form.`
                         );
                    });

                    addEvent("linkit-properties-button-delete", () => {
                         LINKIT.property.deleteAll();
                    });
                    addEvent("linkit-relationships-button-delete", () => {
                         LINKIT.relationship.deleteAll();
                    });

                    // Upgrade Plan
                    addEvent("linkit-plan-upgrade", () => {
                         LINKIT.plan.upgrade();
                    });

                    // Add On Change to all inputs
                    if (isFunction(onChange)) {
                         const inputs = document.getElementById("linkit-edit-form").querySelectorAll("input, textarea, select");
                         for (let i = 0; i < inputs.length; i++) {
                              const input = inputs[i];
                              if (input.id) {
                                   addEvent(input.id, onChange);
                              }
                         }
                    }

                    // Tooltips
                    TOOLTIP.init();
               };
               postAppend();
          },
          close: function (confirm = 0) {
               if (LINKIT.settings.edited) {
                    if (confirm == 0) {
                         MESSAGE.confirm("Close Form", "Some inputs have changed.<br>Closing the form will discard any changes.<br>Are you sure you want to close this form?", () => LINKIT.form.close(1));
                         return;
                    }
               }

               // Check if Popup already open
               const popup = getElement("linkit-edit-form");
               if (popup) popup.remove();

               // Clear Selection
               const nodes = document.getElementsByClassName("linkit-svg-node");
               if (nodes && nodes.length > 0) {
                    for (let i = 0; i < nodes.length; i++) {
                         nodes[i].classList.remove("linkit-svg-selected");
                    }
               }

               LINKIT.settings.edited = false;

               LINKIT2D.select();
          },
          init: function () {
               LINKIT.property.close();
               LINKIT.relationship.close();
               LINKIT.file.close();
          }
     },
     update: function (newItem = 0, silent = 0, delay = 100) {
          if (newItem == 1) silent = 1;
          if (silent == 1 && delay == 100) delay = 1000;

          // Update Timeout
          clearTimeout(LINKIT.settings.timeouts["update"]);
          LINKIT.settings.timeouts["update"] = setTimeout(() => {
               const tableName = getValue("linkit-form-table");
               if (isEmpty(tableName)) return;

               // Check Item ID
               let itemid = "";
               let itemKey = "";
               if (tableName == "entities") {
                    itemid = LINKIT.settings.entityid;
                    itemKey = "entityid";
               }
               if (tableName == "relationships") {
                    itemid = LINKIT.settings.relationshipid;
                    itemKey = "relationshipid";
               }
               if (tableName == "projects") {
                    itemid = LINKIT.settings.projectid;
                    itemKey = "projectid";
               }
               if (isEmpty(itemid) && newItem === 0) return;

               // Check Name
               if (isEmpty(getValue("linkit-form-name"))) {
                    MESSAGE.show("Error", "Please enter a name.");
                    return;
               }
               if (isEmpty(getValue("linkit-form-type"))) {
                    MESSAGE.show("Error", "Please enter a type.");
                    return;
               }

               // Data
               const postData = { fields: {} };
               let conditions = [];
               if (tableName !== "projects") {
                    postData.projectid = LINKIT.settings.projectid;
                    postData.fields.projectid = LINKIT.settings.projectid;
               }
               if (!isEmpty(itemid) && newItem === 0) conditions = [{ field: "id", operator: "=", value: itemid }];

               const sanitizeString = (input) => {
                    if (typeof input === "string") return input.trim().replace(/[\r\n\t]+/g, " "); // Replace newlines, carriage returns, and tabs with space
                    return input; // Return as-is if not a string
               };

               // Get All inputs, select, textarea for element
               const form = getElement("linkit-tab-container-details");
               const inputs = form.querySelectorAll("input, select, textarea");
               inputs.forEach((input) => {
                    const key = sanitizeString(input.id.split("-")[input.id.split("-").length - 1]);
                    postData.fields[key] = sanitizeString(input.value);
               });

               // Properties
               const propertiesTab = getElement("linkit-tab-container-properties");
               const properties = [];
               if (propertiesTab) {
                    const propertiesInputs = propertiesTab.querySelectorAll("input, select, textarea");
                    propertiesInputs.forEach((input) => {
                         if (input.id.includes("prop_label_")) {
                              let number = input.id.split("_")[2];
                              if (isEmpty(number)) number = 0;

                              let label = sanitizeString(getValue(`linkit-form-prop_label_${number}`));
                              let group = sanitizeString(getValue(`linkit-form-prop_group_${number}`));
                              let type = sanitizeString(getValue(`linkit-form-prop_type_${number}`));
                              let value = sanitizeString(getValue(`linkit-form-prop_value_${number}`));

                              if (!isEmpty(label) && !isEmpty(value) && number > 0) {
                                   if (isEmpty(type)) type = "text";
                                   properties.push({
                                        label: label,
                                        group: group,
                                        type: type,
                                        value: value
                                   });
                              }
                         }
                    });
               }
               postData.fields.properties = properties;

               // Update Data
               LINKIT.settings.edited = false;
               DATA.submit(tableName, conditions, postData, "set").then((result) => {
                    if (result && result.data) {
                         LINKIT.settings[tableName] = result.data[tableName];
                         LINKIT.settings[itemKey] = result.data[itemKey];
                    }
                    LINKIT.form.init(); // Closes All Form Items
                    setTimeout(() => {
                         if (tableName == "entities") {
                              LINKIT.entity.load();
                              if (silent == 1) LINKIT.entity.select(LINKIT.settings.entityid);
                         } else if (tableName == "projects") {
                              LINKIT.project.load();
                              if (silent == 1) LINKIT.entity.select(LINKIT.settings.projectid);
                         }
                    }, 200);
               });

               // Close New Entry Form
               if (silent == 0) LINKIT.form.close();
          }, delay);
     },
     delete: function (confirm = 0) {
          const tableName = getValue("linkit-form-table");
          if (isEmpty(tableName)) return;

          // Check Item ID
          let itemid = "";
          let itemLabel = "";
          let itemKey = "";
          if (tableName == "entities") {
               itemid = LINKIT.settings.entityid;
               itemKey = "entityid";
               itemLabel = "Entity";
          }
          if (tableName == "relationships") {
               itemid = LINKIT.settings.relationshipid;
               itemKey = "relationshipid";
               itemLabel = "Relationship";
          }
          if (tableName == "projects") {
               itemid = LINKIT.settings.projectid;
               itemKey = "projectid";
               itemLabel = "Project";
          }
          if (isEmpty(itemid)) return;

          // Confirm Delete
          if (confirm == 0) {
               MESSAGE.confirm(`Delete ${itemLabel}`, `Are you sure you want to delete this ${itemLabel.toLowerCase()}?`, () => LINKIT.delete(1));
               return;
          }

          // Delete
          DATA.submit(tableName, [{ field: "id", operator: "=", value: itemid }], null, "delete").then((result) => {
               if (result && result.data) {
                    LINKIT.settings[tableName] = result.data[tableName];
                    LINKIT.settings[itemKey] = "";
               }

               if (tableName == "entities" || tableName == "relationships") {
                    LINKIT.entity.load();
               } else if (tableName == "projects") {
                    LINKIT.project.load();
               }
          });

          // Close New Entry Form
          LINKIT.form.close();
     },
     tabs: {
          select: function (tabid) {
               if (!isEmpty(tabid)) {
                    const tab = getElement(`linkit-tab-${tabid}`);
                    const container = getElement(`linkit-tab-container-${tabid}`);
                    if (tab && container) {
                         document.querySelectorAll(".linkit-tab").forEach((item) => item.classList.remove("linkit-tab-selected"));
                         document.querySelectorAll(".linkit-tab-container").forEach((item) => item.classList.add("app-hidden"));

                         tab.classList.add("linkit-tab-selected");
                         container.classList.remove("app-hidden");
                         LINKIT.settings.activetab = tabid;
                    }
               }
          }
     },
     entity: {
          get: function () {
               if (isEmpty(LINKIT.settings.projectid)) return;

               DATA.submit("entities", [
                    {
                         field: "projectid",
                         operator: "=",
                         value: LINKIT.settings.projectid
                    }
               ]).then((result) => {
                    if (result && result.data) {
                         LINKIT.settings.entities = result.data.entities;
                    }
                    LINKIT.entity.load();
               });
          },
          select: function (entityID = "") {
               if (isEmpty(entityID)) return;

               const entity = LINKIT.settings.entities.find((entity) => entity.id === entityID);
               if (entity && entity.id === entityID) {
                    LINKIT.settings.entityid = entityID;
                    LINKIT.form.open("entities");

                    // Visual Changes
                    if (LINKIT.settings.visual == "graph") {
                         LINKIT2D.select(entityID);
                    }
               }
          },
          load: function () {
               const entities = LINKIT.settings.entities;

               if (entities && entities.length > 0) {
                    entities.sort((a, b) => {
                         if (isEmpty(a.type) && !isEmpty(b.type)) return 1;
                         const type = a.type.localeCompare(b.type);
                         if (type !== 0) return type; // Sort By Type
                         return a.name.localeCompare(b.name); // If Types are the same, sort by name
                    });

                    let list = [];
                    let type = "";

                    let group = 1;

                    entities.forEach((entity, index) => {
                         if (!isEmpty(entity.type) && entity.type !== type) {
                              if (!isEmpty(type)) list.push("</div>");
                              list.push(`<div id='app-group-${group}'class='app-group app-group-closed'><div class='app-group-title' onclick="APP.group.toggle('${group}')" >${entity.type}<div class='app-group-toggle app-icon app-icon-small app-icon-down'></div></div>`);
                              type = entity.type;
                              group++;
                         }
                         list.push(`<div id='linkit-entity-${entity.id}' class='linkit-entity-item' onclick="LINKIT.entity.select('${entity.id}')">${entity.name}</div>`);
                         if (index == entities.length - 1) {
                              const projectEntities = document.getElementById("linkit-project-entities");
                              projectEntities.innerHTML = list.join("");
                              projectEntities.classList.remove("app-hidden");
                         }
                    });

                    list.push(`</div>`); // Close Group
               }
               LINKIT.relationship.get();
               LINKIT.property.get();
          },
          type: function (type = "Core") {
               if (!isEmpty(type)) {
                    let properties = LINKIT.property.type(type);
                    if (!properties || properties.length == 0) {
                         // Get All Properties for the last entity created with matching type
                         const entity = LINKIT.settings.entities.find((entity) => entity.type === type);
                         if (entity) {
                              properties = [...entity.properties];
                              properties.forEach((property) => {
                                   property.value = "";
                              });
                         }
                    }
                    if (properties) {
                         const propertyElement = document.getElementById("linkit-properties-list");
                         if (propertyElement) {
                              let propertyList = LINKIT.property.list(properties);
                              propertyElement.innerHTML = propertyList;
                         }
                    }
               }
          },
          new: function () {
               const entities = LINKIT.settings.entities;
               LINKIT.settings.entityid = "";

               if (isEmpty(LINKIT.settings.projectid)) {
                    MESSAGE.alert("Missing Project", "Project not selected");
                    return;
               }

               // Check Project Limit
               if (entities.length >= LINKIT.settings.entityLimit) {
                    LINKIT.plan.message("Project Entity Limit Reached");
                    return;
               }

               // New Project Form
               LINKIT.form.open("entities", 1);
          }
     },
     relationship: {
          get: function () {
               DATA.submit("relationships", [
                    {
                         field: "projectid",
                         operator: "=",
                         value: LINKIT.settings.projectid
                    }
               ]).then((result) => {
                    if (result && result.data && result.data.relationships && isArray(result.data.relationships)) {
                         LINKIT.settings.relationships = result.data.relationships;
                    }
                    LINKIT.relationship.load();
               });
          },
          load: function () {
               LINKIT.visual.load();
          },
          toggle: function () {},
          close: function () {
               removeElement("linkit-relationship-new");
          },
          reset: function () {
               setValue("linkit-relate_type");
               setValue("linkit-relate-target");
               LINKIT.relationship.close();
          },
          line: function (relateid, entity, source, sourceType, target, targetType, otherEntities) {
               if (source && source.name && target && target.name) {
                    let sourceOptions = `<option value=''>Unknown</option>`;
                    let targetOptions = `<option value=''>Unknown</option>`;
                    if (otherEntities && otherEntities.length > 0) {
                         otherEntities.sort((a, b) => a.name.localeCompare(b.name));
                         otherEntities.forEach((item) => {
                              sourceOptions += `<option value='${item.id}' ${item.id === source.id ? "selected" : ""}>${item.name}</option>`;
                              targetOptions += `<option value='${item.id}' ${item.id === target.id ? "selected" : ""}>${item.name}</option>`;
                         });
                    }

                    let toggleButton = ``;
                    // if (relationship.attributes && relationship.attributes.length > 0) {
                    // 	toggleButton = `<div class='app-icon app-icon-small app-icon-down linkit-icon' style='border-color:transparent;' onclick='LINKIT.relationship.toggle(${relateid})'></div>`;
                    // }

                    let sourceLine = `<div class='app-box-value font-size-xsm app-ellipsis'><input type='text' disabled value='${source.name}' style='max-width:120px;' /></div>
                              <div class='app-box-value font-size-xsm'>
                                   <input type='text' disabled value='${sourceType ? sourceType : ""}' />
                                   <div class='app-icon app-icon-small app-icon-edit linkit-icon' app-tooltip='Edit Relationship' onclick="LINKIT.relationship.edit('${relateid}')"></div>
                              </div>`;

                    let targetLine = `<div class='app-box-value font-size-xsm app-ellipsis'><input type='text' disabled value='${target.name}' style='max-width:120px;'/></div>
                              <div class='app-box-value font-size-xsm'>
                                   <input type='text' disabled value='${targetType ? targetType : sourceType}' />
                                   ${toggleButton}
                              </div>`;

                    return `<div id='linkit-form-relate_box_${relateid}' class='linkit-list-box app-box-grid'>${sourceLine} ${targetLine}</div>`;
               }
               return "";
          },
          list: function (relationships = []) {
               // Relationship Labels
               let otherEntities = LINKIT.settings.entities.filter((entity) => entity.id !== LINKIT.settings.entityid);

               let relationshipList = `<div class='linkit-list-box align-center'>No Relationships</div>`;
               if (relationships && relationships.length > 0) {
                    relationships.sort((a, b) => {
                         const sourcetype = a.sourcetype.localeCompare(b.sourcetype);
                         if (sourcetype !== 0) return sourcetype; // Sort By Type

                         const source = a.source.localeCompare(b.source);
                         if (source !== 0) return source; // Sort By Label

                         const target = a.target.localeCompare(b.target);
                         return target;
                    });

                    relationshipList = ``; //<div class='app-value font-size-xsm'>Source</div><div class='app-value font-size-xsm'>Target</div>`; // Reset Return
                    relationships.forEach((relationship) => {
                         const entity = LINKIT.settings.entities.find((entity) => entity.id === LINKIT.settings.entityid);
                         const source = LINKIT.settings.entities.find((entity) => entity.id === relationship.source);
                         const target = LINKIT.settings.entities.find((entity) => entity.id === relationship.target);

                         if (source && source.name && target && target.name) {
                              relationshipList += LINKIT.relationship.line(relationship.id, entity, source, relationship.sourcetype, target, relationship.targettype, otherEntities);
                         }
                    });
               }
               return relationshipList;
          },
          edit: function (relateId = "") {
               let sourceid = "";
               let sourceType = "";
               let source = null;
               let targetid = "";
               let targetType = "";
               let target = null;
               let relationship = null;

               const entityid = LINKIT.settings.entityid;
               const entity = LINKIT.settings.entities.find((entity) => entity.id === entityid);
               const otherEntities = LINKIT.settings.entities.filter((entity) => entity.id !== entityid);
               const currentRelationships = LINKIT.settings.relationships.filter((relationship) => relationship.source === entityid || relationship.target === entityid);

               let buttonUpdate = BUTTON("linkit-relationship-add", "", "Add Relationship", { class: "app-button-small linkit-button flex-1" });
               let titleLabel = "New Relationship";
               let buttonDelete = ``;

               if (!isEmpty(relateId)) {
                    relationship = LINKIT.settings.relationships.find((relationship) => relationship.id === relateId);
                    sourceid = relationship.source;
                    targetid = relationship.target;
                    if (!isEmpty(relationship.source) && !isEmpty(relationship.target)) {
                         source = LINKIT.settings.entities.find((entity) => entity.id === relationship.source);
                         target = LINKIT.settings.entities.find((entity) => entity.id === relationship.target);
                         sourceType = relationship.sourcetype;
                         targetType = isEmpty(relationship.targettype) ? sourceType : relationship.targettype;
                         titleLabel = "Edit Relationship";
                         buttonUpdate = BUTTON("linkit-relationship-add", "edit", "Update", { class: "app-button-small linkit-button flex-1" });
                         buttonDelete = BUTTON("linkit-relationship-delete", "delete", "Delete", { class: "app-button-small linkit-button linkit-button-caution flex-1" });
                    }
               }

               let targetOptions = `<option value=''>Select Entity</option>`;
               let sourceOptions = `<option value=''>Select Entity</option>`;
               if (otherEntities && otherEntities.length > 0) {
                    // Other Entities is a list of enties not currently seleted under the same project
                    console.log("CR", currentRelationships);

                    // Unused Entities is a slist of entities not related to the current entity
                    const unusedEntities = otherEntities.filter((entity) => {
                         let found = currentRelationships.find((relationship) => (relationship.source === entity.id || relationship.target === entity.id) && relationship.id !== relateId);
                         if (found) console.log("E", entity.name, found);
                         if (found) return false; // Entity is already related
                         return true; // Entity is not related
                    });
                    console.log("R", relationship, unusedEntities);
                    unusedEntities.forEach((entity) => {
                         // console.log("E", entity.name);
                         targetOptions += `<option value='${entity.id}' ${entity.id == targetid ? "selected" : ""}>${entity.name}</option>`;
                         sourceOptions += `<option value='${entity.id}' ${entity.id == sourceid ? "selected" : ""}>${entity.name}</option>`;
                    });
               }

               let sourceSelect = `<input id='linkit-relate-source' type='hidden' class='linkit-input' value='${entityid}'/><input type='text' disabled' value='${entity.name}'>`;
               let targetSelect = `<select id='linkit-relate-target' class='linkit-input'>${targetOptions}</select>`;

               if (targetid == entityid) {
                    sourceSelect = `<select id='linkit-relate-source' class='linkit-input'>${sourceOptions}</select>`;
                    targetSelect = `<input type='hidden' id='linkit-relate-target' class='linkit-input' value='${entityid}'/><input type='text' disabled value='${entity.name}'>`;
               }

               let editContent = `<div id='linkit-relationship-new' class='app-box-cover'>
                         <div class='linkit-tab-title space-between'>${titleLabel} <div class='app-icon-close app-icon app-icon-small pointer app-icon-hover ' onclick='LINKIT.relationship.close()'></div></div>
                         <div class='linkit-box-body'>
                              <input type="hidden" id="linkit-relate-id" value='${relateId}'/>
     
                              <div class='pad-4 border-wrap border-radius'>
                                   <div class='app-box-label'>Source</div>
                                   <div class='app-box-value'>${sourceSelect}</div>
                                   <div class='app-box-label'>Descriptor</div>
                                   <div class='app-box-value'><input type="text" id="linkit-relate-sourcetype" placeholder="Type" class='linkit-input' list='linkit-relationshiptypes' value='${sourceType}'/></div>
                              </div>
     
                              <div class='pad-4 border-wrap border-radius'>
                                   <div class='app-box-label'>Target</div>
                                   <div class='app-box-value'>${targetSelect}</div>
                                   <div class='app-box-label'>Descriptor</div>
                                   <div class='app-box-value'><input type="text" id="linkit-relate-targettype" placeholder="Type" class='linkit-input' list='linkit-relationshiptypes' value='${targetType}'/></div>
                              </div>
     
                         </div>
                         <div class='linkit-box-controls'>
                              ${buttonUpdate}
                              ${buttonDelete}
                         </div>
                    </div>`;

               const parent = document.getElementById("linkit-tab-container-relationships");
               if (parent) {
                    parent.insertAdjacentHTML("beforeend", editContent);

                    const updateButton = document.getElementById("linkit-relationship-add");
                    if (updateButton) addEvent(updateButton, () => LINKIT.relationship.update());

                    const deleteButton = document.getElementById("linkit-relationship-delete");
                    if (deleteButton) addEvent(deleteButton, () => LINKIT.relationship.delete());
               }
          },
          update: function () {
               const relateID = getValue("linkit-relate-id");
               const sourceID = getValue("linkit-relate-source");
               const sourceType = getValue("linkit-relate-sourcetype");
               const targetID = getValue("linkit-relate-target");
               let targetType = getValue("linkit-relate-targettype");
               if (isEmpty(targetType)) targetType = sourceType;

               if (isEmpty(sourceType) || isEmpty(sourceID) || isEmpty(targetID)) {
                    MESSAGE.alert("Error", "Please enter a all fields.");
                    return;
               }

               const postData = {
                    fields: {
                         projectid: LINKIT.settings.projectid,
                         source: sourceID,
                         target: targetID,
                         targettype: targetType,
                         sourcetype: sourceType
                    }
               };
               let conditions = [];
               if (!isEmpty(relateID)) conditions = [{ field: "id", operator: "=", value: relateID }];

               // Send Delete Request
               DATA.submit("relationships", conditions, postData, "set").then((result) => {
                    if (result && result.data) {
                         LINKIT.settings.relationships = result.data.relationships;
                    }

                    LINKIT.relationship.load();
                    LINKIT.entity.select(LINKIT.settings.entityid);
               });
          },
          delete: function () {
               const relateID = getValue("linkit-relate-id");
               if (isEmpty(relateID)) return;

               // Get Box
               const box = document.getElementById("linkit-form-relate_box_" + relateID);
               if (box) box.remove();

               // Send Delete Request
               DATA.submit("relationships", [{ field: "id", operator: "=", value: relateID }], null, "delete").then((result) => {
                    if (result && result.data) {
                         LINKIT.settings.relationships = result.data.relationships;
                    }
                    LINKIT.entity.select(LINKIT.settings.entityid);
               });
          },
          deleteAll: function (confirm = 0) {
               const entitiy = LINKIT.settings.entities.find((entity) => entity.id === LINKIT.settings.entityid);
               if (isEmpty(entitiy)) return;

               if (confirm == 0) {
                    MESSAGE.confirm("Delete All Relationships", `Are you sure you want to delete all relationships for ${entitiy.name}?`, () => LINKIT.relationship.deleteAll(1));
                    return;
               }

               // Delete By Source
               DATA.submit(
                    "relationships",
                    [
                         {
                              field: "source",
                              operator: "=",
                              value: LINKIT.settings.entityid
                         }
                    ],
                    null,
                    "delete"
               ).then((result) => {
                    // Delete By Target
                    DATA.submit(
                         "relationships",
                         [
                              {
                                   field: "target",
                                   operator: "=",
                                   value: LINKIT.settings.entityid
                              }
                         ],
                         null,
                         "delete"
                    ).then((result) => {
                         DATA.submit("relationships", [
                              {
                                   field: "projectid",
                                   operator: "=",
                                   value: LINKIT.settings.projectid
                              }
                         ]).then((result) => {
                              if (result && result.data && result.data.relationships && isArray(result.data.relationships)) {
                                   LINKIT.settings.relationships = result.data.relationships;
                                   LINKIT.relationship.load();
                              }
                              LINKIT.entity.select(LINKIT.settings.entityid);
                         });
                    });
               });
          }
     },
     property: {
          get: function () {
               // Get Attribute Types
               DATA.submit("properties").then((result) => {
                    if (result && result.data && result.data.properties && isArray(result.data.properties)) {
                         LINKIT.settings.properties = result.data.properties;
                    }
               });
          },
          line: function (num, group, label, value) {
               return `<div class='app-box-value'>
                         <input type='text' id='linkit-form-prop_label_${num}' value='${label}' placeholder='Label' disabled style='max-width:100px;' list='linkit-propertylabels' />
                         <input type='hidden' id='linkit-form-prop_group_${num}' value='${group}' disabled list='linkit-propertygroups' />
                    </div>
                    <div class='app-box-value'>
                         ${value}
                         <div class='app-icon app-icon-small app-icon-edit linkit-icon' onclick='LINKIT.property.edit(${num})'></div>
                    </div>`;
          },
          list: function (properties = []) {
               // Properties
               const getPropertyValue = function (a, property) {
                    let value = property.value;
                    let defaultValue = property.default;
                    if (isEmpty(value)) value = defaultValue;
                    if (isEmpty(defaultValue)) defaultValue = "";
                    if (isEmpty(value)) value = "";
                    let type = property.type || "text";
                    type = "text";

                    if (type == "integer" || type == "number" || type == "range" || type == "boolean") value = parseInt(value);
                    if (type == "float" || type == "decimal") value = parseFloat(value);
                    // if (type == 'date' || type == 'datetime') value = new Date(value);

                    let propertyValue = "";
                    let propID = `linkit-form-prop_value_${a}`;
                    if (type == "select") {
                         let options = ``;
                         if (property.list && property.list.length > 0) {
                              property.list.forEach((option) => (options += `<option value='${option}'>${option}</option>`));
                         }
                         propertyValue = `<select id='${propID}' value='${value}'>${options}</select>`;
                    } else if (type == "color") {
                         propertyValue = `<input type='color' id='${propID}' value='${value}' />`;
                    } else if (type == "url" || type == "link" || type == "web") {
                         propertyValue = `<input type='url' id='${propID}' value='${value}' />`;
                    } else if (type == "date") {
                         propertyValue = `<input type='date' id='${propID}' value='${value}' />`;
                    } else if (type == "email") {
                         propertyValue = `<input type='email' id='${propID}' value='${value}' />`;
                    } else if (type == "phone" || type == "tel") {
                         propertyValue = `<input type='tel' id='${propID}' value='${value}' />`;
                    } else if (type == "integer" || type == "number") {
                         propertyValue = `<input type='number' id='${propID}' value='${value}' />`;
                    } else if (type == "range") {
                         propertyValue = `<input type='range' id='${propID}' value='${value}' />`;
                    } else if (type == "datetime") {
                         propertyValue = `<input type='datetime' id='${propID}' value='${value}' />`;
                    } else if (type == "checkbox" || type == "boolean") {
                         propertyValue = `<div class='app-toggle-wrapper'><label class='app-toggle-switch'><input type='checkbox' id='${propID}' ${value ? "checked" : ""} /><span class='app-toggle-slider'></span></label></div>`;
                    } else if (type == "text" || type == "varchar") {
                         propertyValue = `<input type='text' id='linkit-form-prop_value_${a}' placeholder="${defaultValue}" value='${value}' disabled />`;
                    }
                    return propertyValue;
               };

               let propertyList = `<div class="linkit-list-box align-center">No Properties</div>`;

               let a = 1;
               if (properties && properties.length > 0) {
                    properties.sort((a, b) => {
                         if (a.group && b.group) {
                              const group = a.group.localeCompare(b.group);
                              if (group !== 0) return group; // Sort By Group
                         }

                         if (isEmpty(a.type)) a.type = "text";
                         if (isEmpty(b.type)) b.type = "text";
                         const type = a.type.localeCompare(b.type);
                         if (type !== 0) return type; // Sort By Type

                         const label = a.label.localeCompare(b.label);
                         if (label !== 0) return label; // Sort By Label

                         const value = a.value.localeCompare(b.value);
                         return value;
                    });

                    let lastGroup = "";
                    let titleLabels = `<div class='font-size-xsm app-box-value align-center'>Label</div><div class='font-size-xsm app-box-value align-center'>Value</div>`;

                    propertyList = `<div class='linkit-list-box app-box-grid marb-4'>`;
                    let boxOpen = false;
                    properties.forEach((property) => {
                         if (lastGroup !== property.group) {
                              lastGroup = property.group;
                              if (boxOpen) propertyList += `</div><div class='linkit-list-box app-box-grid marb-4'>`;
                              boxOpen = true;
                              if (!isEmpty(property.group)) {
                                   propertyList += `<div class='app-box-subtitle app-box-span flex-row justify-center marb-4'>${property.group}</div>`;
                              }
                              propertyList += titleLabels;
                         }
                         let editButton = ``;
                         propertyList += LINKIT.property.line(a, property.group, property.label, getPropertyValue(a, property) + editButton);
                         a++;
                    });
                    propertyList += "</div>";
               }
               return propertyList;
          },
          edit: function (a = 0) {
               let group = "";
               let label = "";
               let value = "";
               let buttonUpdate = BUTTON("linkit-property-add", "", "Add Property", {
                    class: "app-button-small linkit-button flex-1"
               });
               let titleLabel = "New Property";
               let buttonDelete = ``;

               if (a !== 0) {
                    label = getValue("linkit-form-prop_label_" + a);
                    if (!isEmpty(label)) {
                         group = getValue("linkit-form-prop_group_" + a);
                         value = getValue("linkit-form-prop_value_" + a);
                         titleLabel = "Edit Property";
                         buttonUpdate = BUTTON("linkit-property-add", "edit", "Update", {
                              class: "app-button-small linkit-button flex-1"
                         });
                         buttonDelete = BUTTON("linkit-property-delete", "delete", "Delete", {
                              class: "app-button-small linkit-button linkit-button-caution flex-1"
                         });
                    }
               }

               // Attribute New
               keyEscape = `app-action-escape="setValue" `;
               keyEnter = ``; //app-action-enter="inputNext"`;

               let editContent = `<div id='linkit-property-new' class='app-box-cover'>
                    <div class='linkit-tab-title space-between'>${titleLabel} <div class='app-icon-close app-icon app-icon-small pointer app-icon-hover ' onclick="LINKIT.property.close()"></div></div>
                    <div class='linkit-box-body'>

                         <input type="hidden" id="linkit-prop-number" value='${a}'/>

                         <div class='app-box-label'>Group</div>
                         <div class='app-box-value'>
                              <input type="text" id="linkit-prop-group" placeholder="Group" class='linkit-input' ${keyEscape} ${keyEnter} list='linkit-propertygroups' value='${group}'/>
                         </div>
                         
                         <div class='app-box-label'>Label</div>
                         <div class='app-box-value'>
                              <input type="text" id="linkit-prop-label" placeholder="Label" class='linkit-input' ${keyEscape} ${keyEnter} list='linkit-propertylabels' value='${label}'/>
                         </div>
                         
                         <div class='app-box-label'>Value</div>
                         <div class='app-box-value'>
                              <input type="text" id="linkit-prop-value" placeholder="Value" class='linkit-input'${keyEscape} app-action-enter="LINKIT.property.update()"  value='${value}' />
                         </div>
                         
                    </div>
                    <div class='linkit-box-controls'>
                         ${buttonUpdate}
                         ${buttonDelete}
                    </div>
               </div>`;

               const parent = document.getElementById("linkit-tab-container-properties");
               if (parent) {
                    parent.insertAdjacentHTML("beforeend", editContent);

                    inputFocus("linkit-prop-group");

                    const updateButton = document.getElementById("linkit-property-add");
                    if (updateButton) addEvent(updateButton, () => LINKIT.property.update());

                    const deleteButton = document.getElementById("linkit-property-delete");
                    if (deleteButton) addEvent(deleteButton, () => LINKIT.property.delete());
               }
          },
          close: function () {
               removeElement("linkit-property-new");
          },
          update: function () {
               const number = parseInt(getValue("linkit-prop-number"));
               const group = getValue("linkit-prop-group");
               const label = getValue("linkit-prop-label");
               const value = getValue("linkit-prop-value");
               let type = getValue("linkit-prop-type");
               if (isEmpty(type)) type = "text";

               if (isEmpty(label) || isEmpty(value)) {
                    MESSAGE.error("Please enter a label and value.");
                    return;
               }

               // Existing Attribute
               if (number > 0) {
                    setValue("linkit-form-prop_group_" + number, group);
                    setValue("linkit-form-prop_label_" + number, label);
                    setValue("linkit-form-prop_value_" + number, value);
               } else if (number == 0) {
                    // New Attribute
                    const list = document.getElementById("linkit-properties-list");
                    const inputs = list.querySelectorAll('input[id^="linkit-form-prop_label_"]');
                    // Get the number of properties
                    let num = inputs.length + 1;

                    const line = LINKIT.property.line(num, group, label, `<input type='text' id='linkit-form-prop_value_${num}' value='${value}' />`);
                    let html = list.innerHTML + line;
                    list.innerHTML = html;
               }

               setTimeout(() => {
                    LINKIT.update(0, 1, 0);
               }, 200); // Update Entity
          },
          delete: function (confirm = 0) {
               const number = parseInt(getValue("linkit-prop-number"));
               if (number > 0) {
                    if (confirm == 0) {
                         const group = getValue("linkit-form-prop_group_" + number, "");
                         const label = getValue("linkit-form-prop_label_" + number, "");
                         let name = label;
                         if (!isEmpty(group)) {
                              name = group + ": " + label;
                         }

                         MESSAGE.confirm(`Delete Property`, `Are you sure you want to delete this ${name}?`, () => LINKIT.property.delete(1));
                         return;
                    }
                    setValue("linkit-form-prop_group_" + number, "");
                    setValue("linkit-form-prop_label_" + number, "");
                    setValue("linkit-form-prop_value_" + number, "");
                    LINKIT.update(0, 1, 0);
               }
          },
          deleteAll: function (confirm = 0) {
               if (confirm == 0) {
                    MESSAGE.confirm(`Delete All Properties`, `Are you sure you want to delete all properties?`, () => LINKIT.property.deleteAll(1));
                    return;
               }
               const list = document.getElementById("linkit-properties-list");
               list.innerHTML = "";
               LINKIT.update(0, 1, 0);
          },
          type: function (type = "") {
               let properties = "";
               if (!isEmpty(type)) {
                    const coreProperties = LINKIT.settings.properties.find((property) => property.label === type);
                    if (coreProperties && coreProperties.list) properties = coreProperties.list;
               }
               return properties;
          }
     },
     file: {
          open: function () {},
          close: function () {},
          toggle: function () {},
          list: function () {}
     },
     visual: {
          change: function (visual = "") {
               if (!isEmpty(visual)) LINKIT.settings.visual = visual;
               visual = LINKIT.settings.visual;

               // Remove Button Active Class
               const buttons = document.getElementsByClassName("linkit-control-button");
               for (let i = 0; i < buttons.length; i++) {
                    const button = buttons[i];
                    button.classList.remove("linkit-control-button-active");
                    // If Button iD contains visual, add active class
                    if (button.id.includes(visual)) button.classList.add("linkit-control-button-active");
               }

               LINKIT.visual.load();
          },
          load: function () {
               const visual = LINKIT.settings.visual;

               // Grid
               if (LINKIT.settings.visualgrid) {
                    addClass("app-content", "linkit-visual-grid");
               } else {
                    removeClass("app-content", "linkit-visual-grid");
               }

               // Hide Visuals
               document.querySelectorAll(".linkit-visual").forEach((element) => element.classList.add("app-hidden"));

               if (visual === "graph") {
                    LINKIT2D.init();
               } else if (visual === "3d") {
                    LINKIT3D.init();
               } else if (visual === "table") {
               }

               document.getElementById("linkit-visual-" + visual).classList.remove("app-hidden");

               // Tooltip
               TOOLTIP.init();
          }
     },
     project: {
          get: function () {
               // Get All Projects
               DATA.submit("projects", null).then((result) => {
                    if (result && result.data && result.data.projects && isArray(result.data.projects)) {
                         LINKIT.settings.projects = result.data.projects;
                    }
                    LINKIT.project.load();
               });
          },
          select: function (projectID = "") {
               const list = document.getElementById("linkit-project-list");
               const toggle = document.getElementById("linkit-project-toggle");
               const projects = LINKIT.settings.projects;
               if (isEmpty(projectID)) {
                    if (isEmpty(projects)) {
                         LINKIT.form.open("projects", 1);
                    } else {
                         if (list.classList.contains("app-hidden")) {
                              list.classList.remove("app-hidden");
                              toggle.classList.remove("app-icon-down");
                              toggle.classList.add("app-icon-up");
                         } else {
                              list.classList.add("app-hidden");
                              toggle.classList.add("app-icon-down");
                              toggle.classList.remove("app-icon-up");
                         }
                    }
               } else {
                    list.classList.add("app-hidden");
                    const project = LINKIT.settings.projects.find((project) => project.id == projectID);
                    if (project && project.id == projectID) {
                         LINKIT.settings.projectid = project.id;
                         STORAGE.set("linkit-projectid", project.id);
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
                         if (!project) LINKIT.settings.projectid = "";
                    }
                    if (isEmpty(LINKIT.settings.projectid) && LINKIT.settings.projects.length === 1) LINKIT.settings.projectid = LINKIT.settings.projects[0].id; // Default Project (1st)
               } else {
                    LINKIT.settings.projectid = "";
               }

               // Variables
               const projects = LINKIT.settings.projects;
               const project = LINKIT.settings.projects.find((project) => project.id == LINKIT.settings.projectid);

               // No Projects
               let label = "";
               if (isEmpty(projects)) {
                    label = `<div id='linkit-project-add' class='linkit-project-button no-border no-padding no-margin'><div class='app-icon app-icon-small app-icon-add'></div>New Project</div>`;
               } else if (isEmpty(project)) {
                    label = `Select Project<div id='linkit-project-toggle' class='app-icon app-icon-small app-icon-down'></div>`;
               } else if (!isEmpty(project)) {
                    label = `${project.name}<div id='linkit-project-toggle' class='app-icon app-icon-small app-icon-down'></div>`;
               }

               // List Projects
               let list = "";
               if (projects && projects.length && projects.length > 0) {
                    projects.forEach((project) => {
                         let projectLabel = project.name;
                         let projectClass = "";
                         if (project.id == LINKIT.settings.projectid) {
                              // projectLabel = ` - ${project.name}`;
                              projectClass = "linkit-project-selected";
                         }
                         list += `<div class='linkit-project-item ${projectClass}' onclick="LINKIT.project.select('${project.id}')">${projectLabel}</div>`;
                    });
               }
               list += BUTTON("linkit-project-add", "add", "Project", {
                    class: "app-button-small linkit-project-button linkit-button"
               });

               // Entity Button
               let buttons = "";
               if (!isEmpty(project)) {
                    LINKIT.entity.get();
                    buttons = BUTTON("linkit-project-info", "edit", "Project Info", {
                         class: "app-button-small linkit-project-button linkit-button linkit-back"
                    });
               }

               // Visual Class
               if (!isEmpty(LINKIT.settings.visual)) LINKIT.settings.visual = "graph";
               const visual = LINKIT.settings.visual;

               // Add Content to Container
               // <div id='linkit-control-grid' class='linkit-control-button ${LINKIT.settings.visualgrid ? "linkit-control-button-active" : ""}' style='margin-right:8px;'>Grid</div>
               // <div id='linkit-control-table' class='linkit-control-button linkit-control-button-center ${(visual === 'table' ? 'linkit-control-button-active' : '')}'>Table</div>
               // <div id='linkit-control-3d' class='linkit-control-button linkit-control-button-center ${visual === "3d" ? "linkit-control-button-active" : ""}'>3D</div>
               getElement("linkit-container").innerHTML = `
                         <div id='linkit-header'>
                              <div id='linkit-header-line'></div>
                              <div id='linkit-controls'>
     
                                   <div id='linkit-control-graph' app-tooltip='Graph' class='linkit-control-button linkit-control-button-left app-icon-graph ${visual === "graph" ? "linkit-control-button-active" : ""} '></div>
                                   
                                   <div id='linkit-control-table' class='linkit-control-button linkit-control-button-right ${visual === "list" ? "linkit-control-button-active" : ""}'>List</div>
                              </div>
                         </div>
                         <div id='linkit-menu'>
                              <div id='linkit-project-selector' class='linkit-header-selector '>${label}</div>
                              <div id='linkit-project-list' class='app-hidden'><div class='app-group-title'>Projects</div>${list}</div>
                              <div class='linkit-project-category'>Entities</div>
                              ${BUTTON("linkit-project-entitynew", "add", "Entity", {
                                   class: "app-button-small linkit-project-button linkit-button linkit-back"
                              })}
                              <div id='linkit-project-entities'></div>
                              ${buttons}
                              ${BUTTON("linkit-settings", "settings", "Configure", {
                                   class: "app-button-small linkit-project-button linkit-button linkit-back"
                              })}
                         </div>
                    `;

               // Controls
               addEvent("linkit-project-selector", LINKIT.project.select);
               addEvent("linkit-project-add", LINKIT.project.new);
               addEvent("linkit-project-entitynew", LINKIT.entity.new);
               addEvent("linkit-project-info", LINKIT.project.info);
               addEvent("linkit-control-graph", () => {
                    LINKIT.visual.change("graph");
               });
               addEvent("linkit-control-graph", () => {
                    LINKIT.visual.change("graph");
               });
               addEvent("linkit-control-3d", () => {
                    LINKIT.visual.change("3d");
               });
               addEvent("linkit-control-table", () => {
                    LINKIT.visual.change("table");
               });

               // Parent Reference
               let reference = document.getElementById("linkit-header");

               // 2D Append SVG
               const svg = document.createElement("svg");
               svg.id = "linkit-visual-graph";
               svg.classList.add("linkit-visual");
               reference.parentNode.insertBefore(svg, reference);

               // 3D
               const div3D = document.createElement("div");
               div3D.id = "linkit-visual-3d";
               div3D.classList.add("linkit-visual");
               reference.parentNode.insertBefore(div3D, reference);

               // Table
               const divTA = document.createElement("div");
               divTA.id = "linkit-visual-table";
               divTA.classList.add("linkit-visual");
               reference.parentNode.insertBefore(divTA, reference);

               // No Project - Init New Project Form
               if (isEmpty(projects)) LINKIT.form.open("projects", 1);
          },
          new: function () {
               const projects = LINKIT.settings.projects;

               // Check Project Limit
               if (projects.length >= LINKIT.settings.projectLimit) {
                    LINKIT.plan.message("Project Limit Reached");
                    return;
               }

               // New Project Form
               LINKIT.form.open("projects", 1);
          },
          info: function (projectID = "") {
               if (isEmpty(projectID)) projectID = LINKIT.settings.projectid;
               if (isEmpty(projectID)) return;

               const project = LINKIT.settings.projects.find((project) => project.id == projectID);
               if (isEmpty(project)) return;
               LINKIT.form.open("projects");
          }
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
               LINKIT.settings.projectid = STORAGE.get("linkit-projectid");
               LINKIT.settings.entityid = STORAGE.get("linkit-entityid");
          },
          set: function () {}
     },
     plan: {
          upgrade: function () {
               const link = document.createElement("a");
               link.href = LINKIT.settings.siteupgrade;
               link.target = "_blank";
               link.click();
          },
          message: function (title = "") {
               let message = "";
               if (!isEmpty(title)) {
                    message = title + "<br>";
               }
               message += `Upgrade your plan to add more.<br>
                         <div class='flex-row justify-center mart-8'>${BUTTON("linkit-plan-upgrade", "", "Upgrade Plan", { class: "app-button-small linkit-button" })}</div>`;
               MESSAGE.show("Limit Reached", message, "", () => {
                    addEvent("linkit-plan-upgrade", LINKIT.plan.upgrade);
               });
          }
     },
     init: function () {
          // Get Stored Variables
          LINKIT.storage.get();

          // Initilize Database
          DATA.init("linkit");

          // Get Proejcts
          LINKIT.project.get();

          // On Resize close form
          window.addEventListener("resize", () => {
               LINKIT.form.close();
               LINKIT.visual.change();
          });

          addEvent("app-name", () => {
               const appTheme = document.getElementById("app-theme");
               if (appTheme.href.includes("theme-dark")) {
                    APP.theme.apply("Light");
               } else {
                    APP.theme.apply("Dark");
               }
          });
     }
};
LINKIT.init();
