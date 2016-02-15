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
        this.name = "Alfresco.ConsoleSwitchUsers";
        Alfresco.ConsoleSwitchUsers.superclass.constructor.call(this, htmlId);

        /* Register this component */
        Alfresco.util.ComponentManager.register(this);

        /* Load YUI Components */
        Alfresco.util.YUILoaderHelper.require(["button", "container", "datasource", "datatable", "json", "paginator"], this.onComponentsLoaded, this);

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
                        me._onSwitchUserClick(e, args, me);
                    };

                    var searchBtnCallBack = function (e, args) {
                        me._onSearchButtonClick(e, args)
                    };

                    var showAllBtnCallBack = function (e, args) {
                        me._onShowAllButtonClick(e, args)
                    };


                    // UI Buttons
                    parent.widgets.searchButton = Alfresco.util.createYUIButton(parent, "search-button", searchBtnCallBack);
                    parent.widgets.searchButton = Alfresco.util.createYUIButton(parent, "show-all-button", showAllBtnCallBack);
                    parent.widgets.switchButton = Alfresco.util.createYUIButton(parent, "switch-button", switchBtnCallBack);

                    // disable switch button
                    Alfresco.util.disableYUIButton(parent.widgets.switchButton);

                    // Setup the main datatable
                    this._setupDataTable();


                },

                /**
                 * Called by the ConsolePanelHandler when this panel shall be updated
                 *
                 * @method onUpdate
                 */
                onUpdate: function onUpdate() {
                    // update the text field - as this event could come from bookmark, navigation or a search button click
                    var searchTermElem = Dom.get(parent.id + "-search-text");
                    searchTermElem.value = parent.searchTerm;
                    parent.widgets.dataTable.deleteRows(0, -1);
                },

                /**
                 * Setup the YUI DataTable with custom renderers. todo : refactor this method
                 *
                 * @method _setupDataTable
                 * @private
                 */
                _setupDataTable: function _setupDataTable() {
                    var me = this;
                    // DataTable and DataSource setup
                    parent.widgets.dataSource = new YAHOO.util.DataSource(Alfresco.constants.PROXY_URI + "api/switch-login/people?");
                    parent.widgets.dataSource.responseType = YAHOO.util.DataSource.TYPE_JSON;
                    parent.widgets.dataSource.responseSchema = {
                        resultsList: 'people',
                        fields: [
                            {key: 'userName', parser: "string"},
                            {key: 'firstName', parser: "string"},
                            {key: 'lastName', parser: "string"},
                            {key: 'userGroups', parser: "string"}
                        ],
                        metaFields: {
                            totalRecords: 'totalRecords',
                            paginationRecordOffset: 'startIndex',
                            paginationRowsPerPage: 'pageSize',
                            sortKey: 'sort',
                            sortDir: 'dir'
                        }
                    };

                    // Work to be performed after data has been queried but before display by the DataTable
                    parent.widgets.dataSource.doBeforeParseData = function PeopleFinder_doBeforeParseData(oRequest, oFullResponse) {

                        if (oFullResponse) {
                            var items = oFullResponse.people;

                            // Recording found users in temp array
                            for (var i = 0; i < items.length; i++) {
                                me.foundUsers.push(items[i].userName)
                            }
                        }
                        // disable switch button
                        Alfresco.util.disableYUIButton(parent.widgets.switchButton);
                        return oFullResponse;
                    };

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

                    // DataTable column definitions
                    var columnDefinitions =
                        [
                            {
                                key: "userName",
                                label: parent._msg("label.username"),
                                sortable: true,
                                formatter: renderCellSafeHTML,
                                width: 150
                            },
                            {
                                key: "firstName",
                                label: parent._msg("label.firstname"),
                                sortable: true,
                                formatter: renderCellSafeHTML,
                                width: 200
                            },
                            {
                                key: "lastName",
                                label: parent._msg("label.lastname"),
                                sortable: true,
                                formatter: renderCellSafeHTML,
                                width: 250
                            },
                            {
                                key: "userGroups",
                                label: parent._msg("label.groups"),
                                sortable: false,
                                formatter: renderCellSafeHTML,
                                width: 250
                            }
                        ];

                    // Set up the Paginator instance.
                    var myPaginator = new YAHOO.widget.Paginator({
                        containers: ['paging'],
                        rowsPerPage: 10,
                        rowsPerPageOptions: [10, 25, 50, 100],
                        template: "<strong>{CurrentPageReport}</strong> {PreviousPageLink} {PageLinks} {NextPageLink} {RowsPerPageDropdown}"
                    });

                    var handlePagination = function (state, dt) {
                        var sortedBy = dt.get('sortedBy');

                        var searchTermElem = Dom.get(parent.id + "-search-text");
                        var searchTerm = YAHOO.lang.trim(searchTermElem.value);

                        // Define the new state
                        var newState = {
                            startIndex: state.recordOffset,
                            sorting: {
                                key: sortedBy.key,
                                dir: ((sortedBy.dir === YAHOO.widget.DataTable.CLASS_DESC) ? YAHOO.widget.DataTable.CLASS_DESC : YAHOO.widget.DataTable.CLASS_ASC)
                            },
                            pagination: { // Pagination values
                                recordOffset: state.recordOffset, // Default to first page when sorting
                                rowsPerPage: dt.get("paginator").getRowsPerPage()
                            },
                            searchTerm: searchTerm
                        };

                        // Create callback object for the request
                        var oCallback = {
                            success: dt.onDataReturnSetRows,
                            failure: dt.onDataReturnSetRows,
                            scope: dt,
                            argument: newState // Pass in new state as data payload for callback function to use
                        };

                        // Send the request
                        dt.getDataSource().sendRequest(buildQueryString(newState), oCallback);
                    };

                    var buildQueryString = function (state, dt) {
                        return "startIndex=" + state.pagination.recordOffset +
                        "&maxResults=" + state.pagination.rowsPerPage +
                        "&sortBy=" + state.sorting.key +
                        "&dir=" + ((state.sorting.dir === YAHOO.widget.DataTable.CLASS_ASC) ? "asc" : "desc") +
                        "&filter=" + state.searchTerm != null ? state.searchTerm : "";
                    };

                    var generateRequest = function (oState, oSelf) {

                        parent.widgets.dataTable.deleteRows(parent.widgets.dataTable.getRecordIndex(0), parent.widgets.dataTable.getRecordSet().getLength());

                        var searchTermElem = Dom.get(parent.id + "-search-text");
                        var searchTerm = YAHOO.lang.trim(searchTermElem.value);

                        // Get states or use defaults
                        oState = oState || {pagination: null, sortedBy: null};
                        var sort = encodeURIComponent((oState.sortedBy) ? oState.sortedBy.key : oSelf.getColumnSet().keys[0].getKey());
                        var dir = (oState.sortedBy && oState.sortedBy.dir === YAHOO.widget.DataTable.CLASS_DESC) ? "desc" : "asc";
                        var startIndex = (oState.pagination) ? oState.pagination.recordOffset : 0;
                        var results = (oState.pagination) ? oState.pagination.rowsPerPage : 10;

                        // Build the request
                        var query = "startIndex=" + startIndex +
                            "&results=" + results +
                            "&sortBy=" + sort +
                            "&dir=" + dir;

                        if (searchTerm != null && searchTerm.length > 0) {
                            query = query + "&filter=" + encodeURIComponent(searchTerm);
                        }

                        return query;
                    };

                    // DataTable definition
                    parent.widgets.dataTable = new YAHOO.widget.DataTable(parent.id + "-datatable", columnDefinitions, parent.widgets.dataSource,
                        {
                            initialLoad: true,
                            selectionMode: "single",
                            renderLoopSize: 32,
                            dynamicData: true,
                            paginator: myPaginator,
                            paginationSource: " remote",
                            paginationEventHandler: handlePagination,
                            initialRequest: "startIndex=0&results=10&sortBy=userName&dir=asc",
                            generateRequest: generateRequest,
                            MSG_EMPTY: parent._msg("message.empty")
                        });

                    // DataTable row click event handler
                    parent.widgets.dataTable.subscribe("rowClickEvent", this.onUserSelectClick);

                    // DataTable row tooltip
                    var toolTip = new YAHOO.widget.Tooltip("myTooltip");
                    var showTimer, hideTimer;

                    // DataTable tooltip event handlers
                    parent.widgets.dataTable.on('cellMouseoverEvent', function (oArgs) {
                        if (showTimer) {
                            window.clearTimeout(showTimer);
                            showTimer = 0;
                        }

                        var target = oArgs.target;
                        var column = this.getColumn(target);
                        if (column.key == 'userGroups') {
                            var record = this.getRecord(target);
                            var description = record.getData('userGroups') || 'no groups';
                            var xy = [parseInt(oArgs.event.clientX, 10) + 10, parseInt(oArgs.event.clientY, 10) + 10];

                            showTimer = window.setTimeout(function () {
                                toolTip.setBody(description);
                                toolTip.cfg.setProperty('xy', xy);
                                toolTip.show();
                                hideTimer = window.setTimeout(function () {
                                    toolTip.hide();
                                }, 5000);
                            }, 500);
                        }
                    });
                    parent.widgets.dataTable.on('cellMouseoutEvent', function (oArgs) {
                        if (showTimer) {
                            window.clearTimeout(showTimer);
                            showTimer = 0;
                        }
                        if (hideTimer) {
                            window.clearTimeout(hideTimer);
                            hideTimer = 0;
                        }
                        toolTip.hide();
                    });

                    // Update payload data on the fly for tight integration with latest values from server
                    parent.widgets.dataTable.doBeforeLoadData = function (sRequest, oResponse, oPayload) {
                        parent.widgets.dataTable.deleteRows(0, -1);
                        var meta = oResponse.meta;
                        oPayload.totalRecords = meta.totalRecords || oPayload.totalRecords;
                        oPayload.pagination = {
                            rowsPerPage: meta.paginationRowsPerPage || 10,
                            recordOffset: meta.paginationRecordOffset || 0
                        };
                        return true;
                    };

                    // register the "enter" event on the search text field
                    var searchText = Dom.get(parent.id + "-search-text");

                    new YAHOO.util.KeyListener(searchText,
                        {
                            keys: YAHOO.util.KeyListener.KEY.ENTER
                        },
                        {
                            fn: function () {
                                this._onSearchButtonClick()
                            },
                            scope: this,
                            correctScope: true
                        }, "keydown").enable();

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
                        parent.removeElementClass('yui-dt-asc');
                        parent.removeElementClass('yui-dt-desc');
                        if (record.getData("userName") != null)
                            // enable switch button
                            Alfresco.util.enableYUIButton(parent.widgets.switchButton);
                        Dom.get(parent.id + "-personName").value = record.getData("userName");
                    }
                },

                /**
                 * Switch User event handler
                 *
                 * @method _onSwitchUserClick
                 * @param e {object} DomEvent
                 * @param args {array} Event parameters (depends on event type)
                 * @param scope
                 */
                _onSwitchUserClick: function ConsoleSwitchUsers_onSwitchUser(e, args, scope) {
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

                // search button click event
                _onSearchButtonClick: function ConsoleSwitchUsers_onSearchButtonClick(e, args) {
                    var searchTermElem = Dom.get(parent.id + "-search-text");
                    var searchTerm = YAHOO.lang.trim(searchTermElem.value);

                    // inform the user if the search term entered is too small
                    if (searchTerm.replace(/\*/g, "").length < parent.options.minSearchTermLength) {
                        Alfresco.util.PopupManager.displayMessage(
                            {
                                text: parent._msg("message.minimum-length", parent.options.minSearchTermLength)
                            });
                        return;
                    }

                    parent.widgets.dataSource.sendRequest(parent._buildSearchParams(searchTerm),
                        {
                            success: this.successHandler,
                            failure: this.failureHandler,
                            scope: parent,
                            argument: parent.widgets.dataTable.getState()
                        });
                },

                // search all users button click event
                _onShowAllButtonClick: function ConsoleSwitchUsers_onShowAllButtonClick(e, args) {
                    // clear search field
                    Dom.get(parent.id + "-search-text").value = "";

                    // Send the query to the server
                    // ... with hint to use CQ for user admin page (note: passed via searchTerm in lieu of a change in the /api/people API)
                    parent.widgets.dataSource.sendRequest(parent._buildSearchParams(""),
                        {
                            success: this.successHandler,
                            failure: this.failureHandler,
                            scope: parent,
                            argument: parent.widgets.dataTable.getState()
                        });
                },

                successHandler: function ConsoleSwitchUsers__ps_successHandler(sRequest, oResponse, oPayload) {
                    this._setDefaultDataTableErrors(parent.widgets.dataTable);
                    parent.widgets.dataTable.onDataReturnInitializeTable.call(parent.widgets.dataTable, sRequest, oResponse, oPayload);
                },

                failureHandler: function ConsoleSwitchUsers__ps_failureHandler(sRequest, oResponse) {
                    if (oResponse.status == 401) {
                        // Our session has likely timed-out, so refresh to offer the login page
                        window.location.reload();
                    }
                    else {
                        try {
                            var response = YAHOO.lang.JSON.parse(oResponse.responseText);
                            parent.widgets.dataTable.set("MSG_ERROR", response.message);
                            parent.widgets.dataTable.showTableMessage(response.message, YAHOO.widget.DataTable.CLASS_ERROR);
                            this._setResultsMessage("message.noresults");
                        }
                        catch (e) {
                            this._setDefaultDataTableErrors(parent.widgets.dataTable);
                        }
                    }
                }
            });
        new ViewPanelHandler();
        return this;
    };

    YAHOO.extend(Alfresco.ConsoleSwitchUsers, Alfresco.ConsoleTool,
        {
            /**
             * Object container for initialization options
             *
             * @property options
             * @type object
             */
            options: {
                /**
                 * Number of characters required for a search.
                 *
                 * @property minSearchTermLength
                 * @type int
                 * @default 1
                 */
                minSearchTermLength: 1,

                /**
                 * Maximum number of items to display in the results list
                 *
                 * @property maxSearchResults
                 * @type int
                 * @default 100
                 */
                maxSearchResults: 10
            },
            searchTerm: undefined,
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
             * Resets the YUI DataTable errors to our custom messages
             * NOTE: Scope could be YAHOO.widget.DataTable, so can't use "this"
             *
             * @method _setDefaultDataTableErrors
             * @param dataTable {object} Instance of the DataTable
             * @private
             */
            _setDefaultDataTableErrors: function _setDefaultDataTableErrors(dataTable) {
                var msg = Alfresco.util.message;
                dataTable.set("MSG_EMPTY", this._msg("message.empty", "Alfresco.ConsoleSwitchUsers"));
                dataTable.set("MSG_ERROR", this._msg("message.error", "Alfresco.ConsoleSwitchUsers"));
            },

            /**
             * Set the message in the Results Bar area
             *
             * @method _setResultsMessage
             * @param messageId {string} The messageId to display
             * @private
             */
            _setResultsMessage: function _setResultsMessage(messageId, arg1, arg2) {
                var resultsDiv = Dom.get(this.id + "-search-bar");
                resultsDiv.innerHTML = this._msg(messageId, arg1, arg2);
            },

            /**
             * Build URI parameters for People List JSON data webscript
             *
             * @method _buildSearchParams
             * @param searchTerm {string} User search term
             * @private
             */
            _buildSearchParams: function _buildSearchParams(searchTerm) {
                return "filter=" + encodeURIComponent(searchTerm) +
                    "&startIndex=0&results=10&sortBy=userName&dir=asc";
            },

            removeElementClass: function removeElementClass(className) {
                var els = Dom.getElementsByClassName(className, "td"),
                    i = 0;

                for (i; i < els.length; i++) {
                    Dom.removeClass(els[i], className);
                }
            },
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