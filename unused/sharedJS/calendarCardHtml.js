function createCalendarCard(calendarEvent) {
    const html = `<div class="` + calendarEvent.class + `" data-id="` + calendarEvent.key + `">
                    <div class="card">
                        <span class="monthNumber">` +
                            calendarEvent.monthDay +
                        `</span> 
                        <div class="myPopover" id="myPopover_` + calendarEvent.key + `">
                            <br/>
                            <form class="form">
                                <div class="form-control">
                                    <label for="dropdown">Workout</label>
                                    <select id="dropdown" name="Workout">
                                        <option value="easy">Easy</option>
                                        <option value="steady">Steady</option>
                                        <option value="tempo">Tempo</option>
                                        <option value="track">Track</option>
                                        <option value="long">Long Run</option>
                                        <option value="race">Race</option>
                                    </select>
                                </div>
                                <div class="form-control">
                                    <label for="number"># of Miles</label>
                                    <input type="number" id="number" name="number" min="1" max="30">
                                </div>
                                <div class="form-control">
                                    <label for="comments">Comments:</label>
                                    <textarea id="comments" name="comments"></textarea>
                                </div>
                                <div class="form-actions">
                                    
                                    <button type="button">
                                        <i class="fa-solid fa-floppy-disk"></i>
                                    </button>
                                    <button type="button" 
                                            onmousedown="setToRead('`+calendarEvent.key+`')">
                                        <i class="fa-solid fa-xmark"></i>
                                    </button>
                                    <button type="button">
                                        <i class="fa-solid fa-trash"></i>
                                    </button>
                                </div>
                            </form>
                            <!--<button onmousedown="setToRead('`+calendarEvent.key+`')">Close</button>-->
                        </div>
                        
                        <div class="buttonContainer">
                            <div class="buttons">
                                <button class="editButton" 
                                        data-id="editbutton_`+calendarEvent.key+`" 
                                        onclick="setToActive('`+calendarEvent.key+`', event)">
                                        <i class="fa-solid fa-pencil"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>`;
    return html;
}
