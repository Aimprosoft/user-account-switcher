<#--
  Copyright 2019 Aimprosoft

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
-->

<@markup id="css" >
<#-- CSS Dependencies -->
    <@link href="${url.context}/res/components/console/category-manager.css" group="console"/>
    <@link href="${url.context}/res/components/console/users.css" group="console"/>
</@>

<@markup id="js">
<#-- JavaScript Dependencies -->
    <@script src="${url.context}/res/components/console/consoletool.js" group="console"/>
    <@script src="${url.context}/res/components/console/category-manager.js" group="console"/>
    <@script src="${url.context}/res/share-login-switcher/components/console/login-switcher.js" group="console"/>
</@>

<@markup id="widgets">
    <@createWidgets group="console"/>
    <@inlineScript group="console">
    Alfresco.util.addMessages(${messages}, "Alfresco.ConsoleSwitchUsers");
    </@>
</@>

<@markup id="html">
    <#assign el=args.htmlid?html>
    <@uniqueIdDiv>

    <div id="${el}-body" class="users">
        <div class="yui-g">
            <div class="yui-u first">
                <div class="title" style="font-size: 131.1%;font-weight: bold;margin: 15px"><label
                        for="${el}-datatable">${msg("title.login-manager")}</label></div>
            </div>
        </div>
        <div id="${el}-search">
            <div id="${el}-personName" username="" class="hidden"></div>
            <div class="yui-g">
                <div class="yui-u first">
                    <div class="title"><label for="${el}-search-text">${msg("label.title-search")}</label></div>
                </div>
                <div class="yui-u align-right">
                  <span class="search-button">
                     <span class="yui-button yui-push-button" id="${el}-switch-button">
                        <span class="first-child"><button>${msg("button.switch-user")}</button></span>
                     </span>
                  </span>
                </div>
            </div>
            <div class="yui-g separator">
                <div class="yui-u first">
                    <div class="search-text"><input type="text" id="${el}-search-text" name="-" value=""
                                                    maxlength="256"/>

                        <div class="search-button">
                            <span class="yui-button yui-push-button" id="${el}-search-button">
                               <span class="first-child"><button>${msg("button.search")}</button></span>
                            </span>
                            <span class="yui-button yui-push-button" id="${el}-show-all-button">
                               <span class="first-child"><button>${msg("button.search-all")}</button></span>
                            </span>
                        </div>
                    </div>
                </div>
                <div class="yui-u align-right">
                </div>
            </div>
            <div class="search-main">
                <input id="yui-history-field" type="hidden">

                <div id="paging"></div>
                <div class="results" id="${el}-datatable"></div>
            </div>
        </div>
    </div>

    </@>
</@>

