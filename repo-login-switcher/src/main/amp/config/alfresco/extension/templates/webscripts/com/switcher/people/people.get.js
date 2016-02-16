// Get the args
var sort = args ["sortBy"] == null ? "userName" : args["sortBy"];
var sortField = "@cm\\:" + sort;
var searchTerm = args["filter"];
var skipCount = args["startIndex"] == null ? 0 : args["startIndex"];
var sortAsc = args["dir"] != "desc";
var itemCount = args["results"] == null ? 10 : args["results"];

// search all enabled users of alfresco
var query = "+TYPE:\"cm:person\" AND -ASPECT:\"cm:personDisabled\"" + ((searchTerm != null && searchTerm.length > 0) ? " +@cm\\:username:\"*" + searchTerm + "*\" hint:useCQ" : "");

// search users
var results = search.luceneSearch(query, sortField, sortAsc);

// found total count of users (include admins and guests)
var totalCount = results.length;

// filter the results, removing admins and guests records
var peopleCollectionFiltered = [];
for (var i = 0; i < results.length; i++) {
    var userName = results[i].properties["cm:userName"]; // get person username
    var user = people.getPerson(userName); // get person object

    // Checking whether the user is an administrator or not
    if (!(people.isAdmin(user) || people.isGuest(user))) {
        var obj = {
            p: results[i].nodeRef,
            g: people.getContainerGroups(user)
        };
        peopleCollectionFiltered.push(obj)
    }
}

// paginate found users
peopleCollectionFiltered = peopleCollectionFiltered.slice(skipCount, (skipCount + 1) * itemCount);

// Pass the queried sites to the template
model.pageSize = itemCount;
model.recordsReturned = totalCount;
model.peoplelist = peopleCollectionFiltered;
model.totalRecords = totalCount;
model.startIndex = skipCount;
model.sortBy = sort;
model.dir = (sortAsc == true) ? "asc" : "desc";