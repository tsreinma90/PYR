monthlyCalendar = {}; // immutable map
selectedMonth = ''; // key
availableDates = ''; // value
buildPlanOpen = false; // modal to automate plan
toggleEventHandler = [];
initialized = false;

/* Create calendar */
window.onload = function(){
    setupMenuButton();
    defineCalendarYear(); // this creates the data we work with
    setupCalendar(); // this updates the HTML on the doc
    initialized = true;
    console.log(toggleEventHandler[0]);
}

function setupMenuButton() {
    const menuToggle = document.getElementById('toggle');
    const showcase = document.getElementById('showcase');

    menuToggle.addEventListener('click', () => {
        menuToggle.classList.toggle('active');
        showcase.classList.toggle('active');
    });
}

function defineCalendarYear() {
    const todaysDate = new Date();
    const startDate = 0 - (todaysDate.getDate() - 1);
    const daysInMonth = monthlyDayCountMap.get(todaysDate.getMonth());
    const scheduleLength = 365 + (daysInMonth - todaysDate.getDate()) + 1;

    for (let i = startDate; i < scheduleLength; i++) {
        let day = new Date(addDays(i));
        let weekday = day.getDay();
        let monthDay = day.getDate();
        let month = day.getMonth();
        let year = day.getFullYear();

        // tKey = ddmmyyyy
        let tKey = monthDay.toString().length == 1 ? '0' + monthDay : "" + monthDay;
        tKey += (month + 1).toString().length == 1 ? '0' + (month + 1) : "" + (month + 1);
        tKey += year.toString();

        const calEvent = { 
            weekday : weekday, // (0-6)
            monthDay : monthDay, // (1-31)
            month : month, // (0-11)
            year : year, // (yyyy)
            dateName : day.toLocaleDateString('en-US', { weekday: 'long' }) + ', ' + monthMap[month] + ' ' + monthDay,  
            selectedDistance : null,
            selectedWorkout : null,
            notes: '',
            class : '',
            disabled : i < 0 ? true : false, // the day is in the past
            key : tKey,
            active : false
        };
        const key = year + '.' + month;
        monthlyCalendar[key] = monthlyCalendar[key] || [];
        monthlyCalendar[key].push(calEvent);
    }
    document.getElementById('previousMonth').style = "display: none;";
}

function setupCalendar() {
    selectedMonth = Object.keys(monthlyCalendar)[0]; // yyyy.mm
    availableDates = monthlyCalendar[selectedMonth]; // availableDates = [] which controls the UI; we only need to show 1 month at a time
    toggleEventHandler = [];

    setStartDay();

    weekdays.forEach(day => {
        document.getElementById('weekdays').innerHTML += ('<div class="liHeader">'+day+'</div>');
    });

    availableDates.forEach(day => {
        let calendarCard = htmlCalendarDay(day);
        document.getElementById('calendarBody').innerHTML += calendarCard;
        
        //calendarCardHtml.addEventListener("click", setToActive(day.key));
    });

    document.getElementById('currentMonth').innerHTML = monthMap[availableDates[0].month];
    document.getElementById('previousMonth').setAttribute("onclick","goToPreviousMonth();");
    document.getElementById('nextMonth').setAttribute("onclick", "goToNextMonth();");
}

function setStartDay(){
    let tempDates = availableDates.map(element => ({...element}));     
    var className = '';

    switch(availableDates[0].weekday){
        case 0:
            className = 'sunday';
            break;
        case 1:
            className = 'monday';
            break;
        case 2:
            className = 'tuesday';
            break;
        case 3:
            className = 'wednesday';
            break;
        case 4:
            className = 'thursday';
            break;
        case 5:
            className = 'friday';
            break;
        case 6:
            className = 'saturday';
            break;                
    }
    tempDates[0].class = className;
    availableDates = tempDates;
    document.getElementById('currentMonth').innerHTML = monthMap[availableDates[0].month];
}

function setToActive(key, e) {
    if (initialized) {
        const targetCard = fetchCard(key);
        const index = targetCard.monthDay - 1;
        availableDates[index].active = true;

        if (availableDates[index].active) {
            const popoverKey = "myPopover_" + targetCard.key;
            const popover = document.getElementById(popoverKey);
            popover.style.display = "block";
            //let calendarCardHtml = document.querySelector("[data-id=" + "\'" + targetCard.key + "\'" + "]");
            //calendarCardHtml.removeEventListener("mousedown", setToActive);
        }
    }
}

function setToRead(key) {
    const targetCard = fetchCard(key);
    const index = targetCard.monthDay - 1;
    availableDates[index].active = false;
    const popoverKey = "myPopover_" + targetCard.key;
    const popover = document.getElementById(popoverKey);
    popover.style.display = "hidden";
    console.log('damn');
}

function fetchCard(key) {
    const targetCard = availableDates.filter(obj => {
        return obj.key == key;
    });

    return targetCard.length ? targetCard[0] : null;
}

function addDays(numOfDays){
    var d = new Date();
    d = d.setDate(d.getDate() + Number(numOfDays));
    return d;
}

function navigateHome(event) {
    window.location.href = "./home.html";
}

/* to-do, create a pop-over card for the "back" when active */
function htmlCalendarDay(day, e) {
    return createCalendarCard(day);
}

function goToNextMonth(event){
    availableDates.forEach(d => { d.active = false;});
    monthlyCalendar[selectedMonth] = availableDates;
    const nextButton = document.getElementById('nextMonth');
    const previousButton = document.getElementById('previousMonth');
    previousButton.style = "";

    var m = Number(availableDates[0].month);
    var y = Number(availableDates[0].year);

    if(m != 11){
        m += 1;
    }else{
        m = 0;
        y += 1;
    }
    let key = y + '.' + m;
    selectedMonth = key;
    availableDates = monthlyCalendar[selectedMonth];
    setStartDay();
    
    document.getElementById('calendarBody').innerHTML = '';
    availableDates.forEach(day => {
        document.getElementById('calendarBody').innerHTML += htmlCalendarDay(day);
    });

    if (!isLastMonth()) {
        nextButton.style = "";
    } else {
        nextButton.style = "display: none;";
    }
}

function goToPreviousMonth(event){
    availableDates.forEach(d => { d.active = false;});
    monthlyCalendar[selectedMonth] = availableDates;
    const nextButton = document.getElementById('nextMonth');
    const previousButton = document.getElementById('previousMonth');
    nextButton.style = "";

    var m = Number(availableDates[0].month);
    var y = Number(availableDates[0].year);

    if(m != 0){
        m -= 1;
    }else{
        m = 11;
        y -= 1;
    }
    let key = y + '.' + m;
    selectedMonth = key;
    availableDates = monthlyCalendar[selectedMonth];
    setStartDay();

    document.getElementById('calendarBody').innerHTML = '';
    availableDates.forEach(day => {
        document.getElementById('calendarBody').innerHTML += htmlCalendarDay(day);
    });

    if (!isFirstMonth()) {
        previousButton.style= "";
    } else {
        previousButton.style = "display: none;";
    }
}

function isFirstMonth(){
    return selectedMonth == Object.keys(monthlyCalendar)[0];
}

function isLastMonth(){
    return selectedMonth == Object.keys(monthlyCalendar).slice(-1).pop().toString();
}

function selectedYear(){
    
}