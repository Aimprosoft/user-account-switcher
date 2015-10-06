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
