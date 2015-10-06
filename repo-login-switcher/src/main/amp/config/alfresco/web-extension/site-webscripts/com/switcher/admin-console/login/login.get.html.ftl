<@markup id="css" >
<#-- CSS Dependencies -->
    <@link href="${url.context}/res/components/console/category-manager.css" group="console"/>
    <@link href="${url.context}/res/components/console/users.css" group="console"/>
</@>

<@markup id="js">
<#-- JavaScript Dependencies -->
    <@script src="${url.context}/res/components/console/consoletool.js" group="console"/>
    <@script src="${url.context}/res/components/console/category-manager.js" group="console"/>
    <@script src="${url.context}/res/components/console/login-switcher.js" group="console"/>
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
    <div id="${el}-body" class="switcher">
        <div class="yui-g">
            <div class="yui-u first">
                <div class="title" style="font-size: 131.1%;font-weight: bold;margin: 15px"><label
                        for="${el}-datatable">${msg("title.login-manager")}</label></div>
            </div>
        </div>
        <div id="${el}-personName" username="" class="hidden"></div>
        <div class="search-main" style="float:left; margin: 10px">
            <div class="results" id="${el}-datatable"></div>
        </div>
        <div id="switch-button" style="float:left; margin: 10px">
            <div class="search-button">
                <span class="yui-button yui-push-button" id="${el}-switch-button">
                    <span class="first-child"><button>${msg("button.switch-user")}</button></span>
                </span>
            </div>
        </div>
    </div>

    </@>
</@>

