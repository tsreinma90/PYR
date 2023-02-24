const weekdayMap = new Map();
const workoutMap = new Map();
const percentMap = new Map();

(function() {
    weekdayMap.set(0, 'Sunday');
    weekdayMap.set(1, 'Monday');
    weekdayMap.set(2, 'Tuesday');
    weekdayMap.set(3, 'Wednesday');
    weekdayMap.set(4, 'Thursday');
    weekdayMap.set(5, 'Friday');
    weekdayMap.set(6, 'Saturday');

    percentMap.set('Steady', 0.15);
    percentMap.set('Long Run', 0.32);
    percentMap.set('Easy', 0.10);
    percentMap.set('Tempo', 0.15);
    percentMap.set('Track / Repeats', 0.05);
    percentMap.set('Hill Repeats', 0.10);
})();

function createTrainingPlan(startDay, mileageGoal, raceDate, workoutMap, numWeeksUntilRace) {
    console.log(startDay, mileageGoal, raceDate, workoutMap, numWeeksUntilRace);
    // need to determine 
}

function greet(name) {
    return weekdayMap;
}

export { greet, createTrainingPlan }