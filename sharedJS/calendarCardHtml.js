/*function setToActive(calendarEvent, e) {
    //onclick="toggleActive('`+calendarEvent.key+`')">class="modal"
    //style="position: absolute; left=`+e.clientX+`px; top=`+e.clientY+`px;"
    e.preventDefault();
    let editDialog = `<div class="` + calendarEvent.class + ` other-div" id="` + calendarEvent.key + `"><div class="card"><div class="content">
        <div class="` + calendarEvent.class + ` back" id="` + calendarEvent.key + `">
            <div id="modal_` + calendarEvent.key.toString() + `">
                <div class="banner">
                    <h4> ` + calendarEvent.dateName + ` </h4>
                </div>
                <select>
                    <option> Hello </option>
                    <option> World </option>
                    <option> testing </option>
                </select>
                <button onclick="setToActive('`+calendarEvent.key+`')">Close</button>
                <div class="myPopover" id="myPopover_` + calendarEvent.key + `">
                <p>Popover content goes here</p>
            </div>
            </div>
        </div>
        </div></div></div>`;
    return editDialog;
}*/

function createCalendarCard(calendarEvent) {
    const html = `<div class="` + calendarEvent.class + `" data-id="` + calendarEvent.key + `" onmousedown="setToActive('`+calendarEvent.key+`', event)">
                    <div class="card">
                        <span class="monthNumber">` +
                            calendarEvent.monthDay +
                        `</span> 
                        <div class="myPopover" id="myPopover_` + calendarEvent.key + `">
                            <p>Popover content goes here</p>
                            <button onmousedown="setToRead('`+calendarEvent.key+`')">Close</button>
                        </div>
                    </div>
                </div>`;
    return html;
}
