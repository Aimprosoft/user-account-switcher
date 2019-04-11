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


/**
 * Admin Console Tools list component
 */

function main() {
    // get the tool info from the request context - as supplied by the console template script
    var toolInfo = context.properties["console-tools"];

    // resolve the message labels
    for (var g = 0, group; g < toolInfo.length; g++) {
        group = toolInfo[g];
        for (var i = 0, info; i < group.length; i++) {
            info = group[i];
            info.label = msg.get(info.label);
            info.description = msg.get(info.description);
            if (info.group != "") {
                info.groupLabel = msg.get(info.groupLabel);
            }
        }
    }
    //sort the tools by label
    var tools = Array.prototype.slice.call(toolInfo[0]);
    toolInfo[0] = tools.sort(function(a, b){
        if(a.label < b.label) return -1;
        if(a.label > b.label) return 1;
        return 0;
    });

    model.tools = toolInfo;
}

main();
