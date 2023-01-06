function createCalendarCard(calendarEvent) {
    const html = `<div class="` + calendarEvent.class + `" data-id="` + calendarEvent.key + `">
                    <div class="card">
                        <span class="monthNumber">` +
                            calendarEvent.monthDay +
                        `</span> 
                        <div class="myPopover" id="myPopover_` + calendarEvent.key + `">
                            <p>Popover content goes here</p>
                            <button onmousedown="setToRead('`+calendarEvent.key+`')">Close</button>
                        </div>
                        
                        <div class="buttonContainer">
                            <div class="buttons">
                                <button class="editButton" data-id="editbutton_`+calendarEvent.key+`" onclick="setToActive('`+calendarEvent.key+`', event)"><i class="fa-solid fa-pencil"></i></button>
                            </div>
                        </div>
                    </div>
                </div>`;
    return html;
}
