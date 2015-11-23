{
"dir": "${dir}",
"recordsReturned": ${recordsReturned},
"sort": <#if sortBy??>"${sortBy}"<#else>null</#if>,
"startIndex": ${startIndex},
"totalRecords": ${totalRecords},
"pageSize": ${pageSize},
"people" : [
<#list peoplelist as person>
{
    <#assign p=person.p.properties>
    <#escape x as jsonUtils.encodeJSONString(x)>
    "url": "${url.serviceContext + "/api/people/" + p.userName}",
    "userName": "${p.userName}",
    "enabled": ${people.isAccountEnabled(person.p)?string("true","false")},
        <#if person.p.assocs["cm:avatar"]??>
        "avatar": "${"api/node/" + person.p.assocs["cm:avatar"][0].nodeRef?string?replace('://','/') + "/content/thumbnails/avatar"}",
        </#if>
    "firstName": <#if p.firstName??>"${p.firstName}"<#else>null</#if>,
    "lastName": <#if p.lastName??>"${p.lastName}"<#else>null</#if>,
    "jobtitle": <#if p.jobtitle??>"${p.jobtitle}"<#else>null</#if>,
    "organization": <#if p.organization??>"${p.organization}"<#else>null</#if>,
    "organizationId": <#if p.organizationId??>"${p.organizationId}"<#else>null</#if>,
    "location": <#if p.location??>"${p.location}"<#else>null</#if>,
    "telephone": <#if p.telephone??>"${p.telephone}"<#else>null</#if>,
    "mobile": <#if p.mobile??>"${p.mobile}"<#else>null</#if>,
    "email": <#if p.email??>"${p.email}"<#else>null</#if>,
    "companyaddress1": <#if p.companyaddress1??>"${p.companyaddress1}"<#else>null</#if>,
    "companyaddress2": <#if p.companyaddress2??>"${p.companyaddress2}"<#else>null</#if>,
    "companyaddress3": <#if p.companyaddress3??>"${p.companyaddress3}"<#else>null</#if>,
    "companypostcode": <#if p.companypostcode??>"${p.companypostcode}"<#else>null</#if>,
    "companytelephone": <#if p.companytelephone??>"${p.companytelephone}"<#else>null</#if>,
    "companyfax": <#if p.companyfax??>"${p.companyfax}"<#else>null</#if>,
    "companyemail": <#if p.companyemail??>"${p.companyemail}"<#else>null</#if>,
    "skype": <#if p.skype??>"${p.skype}"<#else>null</#if>,
    "instantmsg": <#if p.instantmsg??>"${p.instantmsg}"<#else>null</#if>,
    "userStatus": <#if p.userStatus??>"${p.userStatus}"<#else>null</#if>,
    "userGroups": [
        <#list person.g as g>
            <#assign authName = g.properties["cm:authorityName"]>
            <#if authName?starts_with("GROUP_site")><#assign displayName = authName?substring(6)>
            <#else>
                <#assign displayName = g.properties["cm:authorityDisplayName"]!authName?substring(6)>
            </#if>
        "${displayName}"
            <#if g_has_next>,</#if></#list>],
    "userStatusTime": <#if p.userStatusTime??>{ "iso8601": "${xmldate(p.userStatusTime)}"}<#else>null</#if>,
    "googleusername": <#if p.googleusername??>"${p.googleusername}"<#else>null</#if>,
    "quota": <#if p.sizeQuota??>${p.sizeQuota?c}<#else>-1</#if>,
    "sizeCurrent": <#if p.sizeCurrent??>${p.sizeCurrent?c}<#else>0</#if>,
    "emailFeedDisabled": <#if p.emailFeedDisabled??>${p.emailFeedDisabled?string("true","false")}<#else>false</#if>,
    "persondescription": <#if p.persondescription??>"${stringUtils.stripUnsafeHTML(p.persondescription.content)}"<#else>null</#if>
    </#escape>
}
    <#if person_has_next>,</#if>
</#list>
]
}