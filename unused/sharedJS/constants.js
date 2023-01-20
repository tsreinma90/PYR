/* Constants */
const monthMap = {
    0 : "January",
    1 : "February",
    2 : "March",
    3 : "April",
    4 : "May",
    5 : "June",
    6 : "July",
    7 : "August",
    8 : "September",
    9 : "October",
    10 : "November",
    11 : "December"
};

const monthlyDayCountMap = new Map();
monthlyDayCountMap.set(0, 31);
leapYear(new Date().getFullYear()) ? monthlyDayCountMap.set(1, 28) : monthlyDayCountMap.set(1, 29);
monthlyDayCountMap.set(2, 31);
monthlyDayCountMap.set(3, 30);
monthlyDayCountMap.set(4, 31);
monthlyDayCountMap.set(5, 30);
monthlyDayCountMap.set(6, 31);
monthlyDayCountMap.set(7, 31);
monthlyDayCountMap.set(8, 30);
monthlyDayCountMap.set(9, 31);
monthlyDayCountMap.set(10, 30);
monthlyDayCountMap.set(11, 31);

const weekdays = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday"
];

const weekdayMap = new Map();
weekdayMap.set(0, 'Sunday');
weekdayMap.set(1, 'Monday');
weekdayMap.set(2, 'Tuesday');
weekdayMap.set(3, 'Wednesday');
weekdayMap.set(4, 'Thursday');
weekdayMap.set(5, 'Friday');
weekdayMap.set(6, 'Saturday');

const workoutMap = new Map();
workoutMap.set('Sunday', 'Easy');
workoutMap.set('Monday', 'Steady');
workoutMap.set('Tuesday', 'Hill Repeats');
workoutMap.set('Wednesday', 'Track / Repeats');
workoutMap.set('Thursday', 'Tempo');
workoutMap.set('Friday', 'Steady');
workoutMap.set('Saturday', 'Long Run');

const percentMap = new Map();
percentMap.set('Steady', 0.15);
percentMap.set('Long Run', 0.32);
percentMap.set('Easy', 0.10);
percentMap.set('Tempo', 0.15);
percentMap.set('Track / Repeats', 0.05);
percentMap.set('Hill Repeats', 0.10);

const raceDistanceMap = new Map();
raceDistanceMap.set('5km', '3');
raceDistanceMap.set('10km', '6');
raceDistanceMap.set('10mi', '10');
raceDistanceMap.set('1/2 Marathon', '13');
raceDistanceMap.set('Marathon', '26');
raceDistanceMap.set('50km', '31');
raceDistanceMap.set('50mi', '50');
raceDistanceMap.set('100km', '62');
raceDistanceMap.set('100mi', '100');

function leapYear(year){
  return ((year % 4 == 0) && (year % 100 != 0)) || (year % 400 == 0);
}