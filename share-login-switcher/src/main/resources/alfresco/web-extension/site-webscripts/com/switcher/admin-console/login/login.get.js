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

function main() {

    var search = null,
        searchMain = config.scoped["Search"];
    if (searchMain != null)
    {
        search = searchMain["search"];
    }
    var users = null,
        usersMain = config.scoped["Users"];
    if (usersMain != null)
    {
        users = usersMain["users"];
    }

    var minSearchTermLength = (args.minSearchTermLength != null) ? args.minSearchTermLength : search.getChildValue("min-search-term-length"),
        maxSearchResults  = (args.maxSearchResults != null) ? args.maxSearchResults : search.getChildValue("max-search-results"),
        minUsernameLength = users.getChildValue('username-min-length'),
        minPasswordLength = users.getChildValue('password-min-length');

    // Widget instantiation metadata...
    var widget = {
        id : "ConsoleSwitchUsers",
        name : "Alfresco.ConsoleSwitchUsers",
        options : {

        }
    };
    model.widgets = [widget];
}
main();