/*
 * Copyright 2019 Aimprosoft
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Get the args
var sort = args ["sortBy"] == null ? "userName" : args["sortBy"];
var sortField = "@cm:" + sort;
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