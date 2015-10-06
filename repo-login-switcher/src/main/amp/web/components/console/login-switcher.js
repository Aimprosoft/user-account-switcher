/**
 * Copyright (C) 2005-2015 Alfresco Software Limited.
 *
 * This file is part of Alfresco
 *
 * Alfresco is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Alfresco is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Alfresco. If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * ConsoleSwitchUsers tool component.
 *
 * @namespace Alfresco
 * @class Alfresco.ConsoleSwitchUsers
 */
(function () {
    /**
     * YUI Library aliases
     */
    var Dom = YAHOO.util.Dom;
    /**
     * Alfresco Slingshot aliases
     */
    var $html = Alfresco.util.encodeHTML;

    /**
     * ConsoleSwitchUsers constructor.
     *
     * @param {String} htmlId The HTML id of the parent element
     * @return {Alfresco.ConsoleSwitchUsers} The new ConsoleSwitchUsers instance
     * @constructor
     */
    Alfresco.ConsoleSwitchUsers = function (htmlId) {
        Alfresco.ConsoleSwitchUsers.superclass.constructor.call(this, htmlId);

        /* Register this component */
        Alfresco.util.ComponentManager.register(this);

        /* Load YUI Components */
        Alfresco.util.YUILoaderHelper.require(["button", "container", "datasource", "datatable", "json"], this.onComponentsLoaded, this);

        /* Define panel handlers */
        var parent = this;

        // NOTE: the panel registered first is considered the "default" view and is displayed first

        /* View Panel Handler (Shows found users) */
        ViewPanelHandler = function ViewPanelHandler_constructor() {
            ViewPanelHandler.superclass.constructor.call(this, "view");
        };

        YAHOO.extend(ViewPanelHandler, Alfresco.ConsolePanelHandler,
            {

                /**
                 * INSTANCE VARIABLES
                 */
                /**
                 * All found alfresco users
                 * */
                foundUsers: [],

                /**
                 * PANEL LIFECYCLE CALLBACKS
                 */

                /**
                 * Called by the ConsolePanelHandler when this panel shall be loaded
                 *
                 * @method onLoad
                 */
                onLoad: function onLoad() {
                    var me = this;
                    var switchBtnCallBack = function (e, args) {

                        me.onSwitchUserClick(e, args, me);

                    };

                    parent.widgets.switchButton = Alfresco.util.createYUIButton(parent, "switch-button", switchBtnCallBack);

                    // DataTable and DataSource setup
                    parent.widgets.dataSource = new YAHOO.util.DataSource(Alfresco.constants.PROXY_URI + "api/people",
                        {
                            responseType: YAHOO.util.DataSource.TYPE_JSON,
                            responseSchema: {
                                resultsList: "people",
                                metaFields: {
                                    recordOffset: "startIndex",
                                    totalRecords: "totalRecords"
                                }
                            }
                        });

                    // Work to be performed after data has been queried but before display by the DataTable
                    parent.widgets.dataSource.doBeforeParseData = function PeopleFinder_doBeforeParseData(oRequest, oFullResponse) {
                        var updatedResponse = oFullResponse;

                        if (oFullResponse) {
                            var items = oFullResponse.people;
                            var filteredItems = [];

                            // remove GUEST(s)
                            for (var i = 0; i < items.length; i++) {
                                if (items[i].userName == "guest" || items[i].userName.indexOf("guest&") == 0 || items[i].userName == Alfresco.constants.USERNAME) {
                                    items.splice(i, 1);
                                    i--;
                                } else if (items[i].enabled == true) {
                                    filteredItems.push(items[i]);
                                    me.foundUsers.push(items[i].userName)
                                }
                            }
                            // we need to wrap the array inside a JSON object so the DataTable gets the object it expects
                            updatedResponse =
                            {
                                "people": filteredItems
                            };
                        }

                        return updatedResponse;
                    };

                    // Setup the main datatable
                    this._setupDataTable();

                    var successHandler = function ConsoleSwitchUsers__ps_successHandler(sRequest, oResponse, oPayload) {

                        me._setDefaultDataTableErrors(parent.widgets.dataTable);
                        parent.widgets.dataTable.onDataReturnInitializeTable.call(parent.widgets.dataTable, sRequest, oResponse, oPayload);
                    };

                    var failureHandler = function ConsoleSwitchUsers__ps_failureHandler(sRequest, oResponse) {
                        if (oResponse.status == 401) {
                            // Our session has likely timed-out, so refresh to offer the login page
                            window.location.reload();
                        }
                        else {
                            try {
                                var response = YAHOO.lang.JSON.parse(oResponse.responseText);
                                parent.widgets.dataTable.set("MSG_ERROR", response.message);
                                parent.widgets.dataTable.showTableMessage(response.message, YAHOO.widget.DataTable.CLASS_ERROR);
                                me._setResultsMessage("message.noresults");
                            }
                            catch (e) {
                                me._setDefaultDataTableErrors(parent.widgets.dataTable);
                            }
                        }
                    };

                    parent.widgets.dataSource.sendRequest((""),
                        {
                            success: successHandler,
                            failure: failureHandler,
                            scope: parent
                        });

                },

                /**
                 * Setup the YUI DataTable with custom renderers.
                 *
                 * @method _setupDataTable
                 * @private
                 */
                _setupDataTable: function _setupDataTable() {
                    /**
                     * DataTable Cell Renderers
                     *
                     * Each cell has a custom renderer defined as a custom function. See YUI documentation for details.
                     * These MUST be inline in order to have access to the parent instance (via the "parent" variable).
                     */

                    /**
                     * Generic HTML-safe custom datacell formatter
                     */
                    var renderCellSafeHTML = function renderCellSafeHTML(elCell, oRecord, oColumn, oData) {
                        elCell.innerHTML = $html(oData);
                    };

                    // DataTable column defintions
                    var columnDefinitions =
                        [
                            {
                                key: "userName",
                                label: parent._msg("label.username"),
                                sortable: false,
                                formatter: renderCellSafeHTML,
                                width: 150
                            }
                        ];

                    // DataTable definition
                    parent.widgets.dataTable = new YAHOO.widget.DataTable(parent.id + "-datatable", columnDefinitions, parent.widgets.dataSource,
                        {
                            initialLoad: false,
                            selectionMode: "single",
                            renderLoopSize: 32,
                            dynamicData: true,
                            generateRequest: function (oState, oSelf) {

                                // Set defaults
                                oState = oState || {pagination: null, sortedBy: null};
                                var sort = encodeURIComponent((oState.sortedBy) ? oState.sortedBy.key : oSelf.getColumnSet().keys[0].getKey());
                                var dir = (oState.sortedBy && oState.sortedBy.dir === YAHOO.widget.DataTable.CLASS_DESC) ? "desc" : "asc";

                                // Build the request
                                var query = "?sortBy=" + sort + "&dir=" + dir;

                                if (parent.searchTerm) {
                                    query = query + "&filter=" + encodeURIComponent(parent.searchTerm);
                                }

                                return query;
                            },
                            MSG_EMPTY: parent._msg("message.empty")
                        });

                    parent.widgets.dataTable.subscribe("rowClickEvent", this.onUserSelectClick);
                },

                /**
                 * Select User event handler
                 *
                 * @method onSelectUserClick
                 * @param el {object} DataTable element
                 */

                onUserSelectClick: function ConsoleSwitchUsers_onUserSelectClick(el) {
                    var select = el.target.children;
                    parent.widgets.dataTable.unselectAllRows();
                    if (select) {
                        this.selectRow(el.target);
                        var recordID = parent.widgets.dataTable.getSelectedRows()[0],
                            record = parent.widgets.dataTable.getRecord(recordID);
                        Dom.get(parent.id + "-personName").value = record.getData("userName");
                    }
                },

                /**
                 * Switch User event handler
                 *
                 * @method onSwitchUserClick
                 * @param e {object} DomEvent
                 * @param args {array} Event parameters (depends on event type)
                 * @param scope
                 */
                onSwitchUserClick: function ConsoleSwitchUsers_onSwitchUser(e, args, scope) {
                    var me = scope;
                    var userElement = Dom.get(parent.id + "-personName");
                    var userName = YAHOO.lang.trim(userElement.value);

                    if (me.foundUsers.indexOf(userName) > -1) {
                        Alfresco.util.Ajax.jsonGet(
                            {
                                url: Alfresco.constants.URL_PAGECONTEXT + "api/switch-login?user=" + encodeURIComponent(userName) + "&pw=1",
                                responseContentType: "json",
                                successCallback: {

                                    fn: function (res) {
                                        if (res.json !== undefined) {
                                            Alfresco.util.PopupManager.displayMessage(
                                                {
                                                    text: parent._msg("message.switching-user", $html(parent.group))
                                                });
                                            Alfresco.util.navigateTo(Alfresco.constants.URL_PAGECONTEXT + "user/" + res.json.userName + "/dashboard");
                                        }
                                        else {
                                            Alfresco.util.PopupManager.displayPropmpt(
                                                {
                                                    title: res.servletResponse.statusText,
                                                    text: parent._msg("message.switching-failure", $html(parent.group))
                                                })
                                        }
                                    },
                                    scope: this
                                }
                            });
                    } else {
                        Alfresco.util.PopupManager.displayMessage(
                            {
                                text: parent._msg("message.invalid-user", $html(parent.group))
                            });
                    }
                },

                /**
                 * Resets the YUI DataTable errors to our custom messages
                 * NOTE: Scope could be YAHOO.widget.DataTable, so can't use "this"
                 *
                 * @method _setDefaultDataTableErrors
                 * @param dataTable {object} Instance of the DataTable
                 * @private
                 */
                _setDefaultDataTableErrors: function _setDefaultDataTableErrors(dataTable) {
                    var msg = Alfresco.util.message;
                    dataTable.set("MSG_EMPTY", parent._msg("message.empty", "Alfresco.ConsoleSwitchUsers"));
                    dataTable.set("MSG_ERROR", parent._msg("message.error", "Alfresco.ConsoleSwitchUsers"));
                },

            });
        new ViewPanelHandler();
        return this;
    };

    YAHOO.extend(Alfresco.ConsoleSwitchUsers, Alfresco.ConsoleTool,
        {

            /**
             * Fired by YUI when parent element is available for scripting.
             * Component initialisation, including instantiation of YUI widgets and event listener binding.
             *
             * @method onReady
             */
            onReady: function ConsoleSwitchUsers_onReady() {

                // Call super-class onReady() method
                Alfresco.ConsoleSwitchUsers.superclass.onReady.call(this);
            },

            /**
             * PRIVATE FUNCTIONS
             */

            /**
             * Gets a custom message
             *
             * @method _msg
             * @param messageId {string} The messageId to retrieve
             * @return {string} The custom message
             * @private
             */
            _msg: function ConsoleSwitchUsers__msg(messageId) {
                return Alfresco.util.message.call(this, messageId, "Alfresco.ConsoleSwitchUsers", Array.prototype.slice.call(arguments).slice(1));
            }
        });

})();