window.uniqueWorkoutTracker = {
    Rest: 0,
    Easy: 0,
    Tempo: 0,
    Speed: 0,
    Long: 0
};

window.MONTH_NAMES = function() {
    return [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
}

window.DAYS = function() {
    return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
}

window.updateSliderLegend = function(details, values, handle) {
  const selectedWorkouts = details["classes"];
  const numSelections = values.length;
  const oneHundred =
    details["start"].length === 1 && details["start"][0] === 100 && selectedWorkouts.length > 0;

  let legendMap = new Map();
  legendMap.set('c-1-color', document.getElementById('easy'));
  legendMap.set('c-2-color', document.getElementById('tempo'));
  legendMap.set('c-3-color', document.getElementById('speed'));
  legendMap.set('c-4-color', document.getElementById('long'));

  let first = legendMap.get(selectedWorkouts[0]);
  let second = legendMap.get(selectedWorkouts[1]);
  let third = legendMap.get(selectedWorkouts[2]);
  let fourth = legendMap.get(selectedWorkouts[3]);
    
  for (const [key] of legendMap) {
    if (!selectedWorkouts.includes(key)) {
      legendMap.get(key).innerHTML = 0 + '%';
    }
  }

  if (oneHundred) {
    legendMap.get(selectedWorkouts[0]).innerHTML = 100 + '%';
  } else if (selectedWorkouts.length) {
    switch (numSelections) {  
      case 1:
        first.innerHTML = Math.round(values[handle]) + '%';
        second.innerHTML = Math.round(100 - values[handle]) + '%';
        return null;

      case 2:
        if (handle === 0) {
          first.innerHTML = Math.round(values[handle]) + '%';
          second.innerHTML = Math.round(values[handle+1] - values[handle]) + '%';
          return null;
        } else if (handle === 1) {
          third.innerHTML = Math.round(100 - values[handle]) + '%';
          second.innerHTML = Math.round(100 - (Math.round(values[0]) + Math.round(100 - values[handle]))) + '%';
          return null;
        }

        case 3:
          if (handle === 0) {
            first.innerHTML = Math.round(values[handle]) + '%';
            second.innerHTML = Math.round(values[handle+1] - values[handle]) + '%';
            return null;

          } else if (handle === 1) {
            second.innerHTML = Math.round(values[1] - values[0]) + '%';
            third.innerHTML = Math.round(values[2] - values[1]) + '%';
            return null;

          } else if (handle === 2) {
            third.innerHTML = Math.round(values[2] - values[1]) + '%';
            fourth.innerHTML = Math.round(100 - (Math.round(values[0]) + Math.round(values[1] - values[0]) + Math.round(values[2] - values[1]))) + '%';
          }

      default:
        return null;
    }
  }
};

window.handleWorkoutSelection = function(addSelection, selection) {
    if (addSelection) {
      uniqueWorkoutTracker[selection] += 1;
      const sliderPresets = calculateDefaults(uniqueWorkoutTracker);
      configureSlider(sliderPresets);
    } else {
      if (uniqueWorkoutTracker[selection] > 0)
        uniqueWorkoutTracker[selection] -= 1;
    }
};

window.calculateDefaults = function(selectedWorkouts) {
    const conditions = {
        Easy: false,
        Tempo: false,
        Speed: false,
        Long: false
      };
    
      for (const key in selectedWorkouts) {
        if (selectedWorkouts[key] > 0 && key in conditions) {
          conditions[key] = true;
        }
      }
    
      const trueConditions = Object.keys(conditions).filter(key => conditions[key]);
      return window.slider.getOptions(trueConditions.join("+"));
};

window.configureSlider = function(details) {
var weeklyMileageSlider = document.getElementById("weeklyMileageSlider");
var workoutPercentSlider = document.getElementById("workoutPercentSlider");

if (!details && !init) {
  init = true;
  let valuesForSlider = [];
  const format = {
    to: function (value) {
      return valuesForSlider[Math.round(value)];
    },
    from: function (value) {
      return valuesForSlider.indexOf(Number(value));
    }
  };

  for (let i = 0; i < 100; i++) {
    valuesForSlider.push(i);
  }

  noUiSlider.create(weeklyMileageSlider, {
    start: [20],
    connect: [true, true],
    tooltips: true,
    format: format,
    range: {
      min: [1],
      max: [100]
    }
  });

  noUiSlider.create(workoutPercentSlider, {
    start: [100],
    connect: [true, true],
    range: { min: [0], max: [100] },
    disabled: true
  });

  let connect = workoutPercentSlider.querySelectorAll(".noUi-connect");
  connect[0].classList.add("c-1-color");
} else if (details) {
  workoutPercentSlider.noUiSlider.off('update', activeSliderListeners[0]);
  workoutPercentSlider.noUiSlider.destroy();

  noUiSlider.create(workoutPercentSlider, details);
  details.disabled === true
    ? workoutPercentSlider.noUiSlider.disable()
    : workoutPercentSlider.noUiSlider.enable();

  let connect = workoutPercentSlider.querySelectorAll(".noUi-connect");
  details.classes.forEach((className, i) => {
    connect[i].classList.add(className);
  });

  const sliderUpdate = workoutPercentSlider.noUiSlider.on('update', function (values, handle) {
    updateSliderLegend(details, values, handle);
  });

    activeSliderListeners.push(sliderUpdate);
    }
};

window.toggleSetupWizard = function(flipToBuilder) {
    const card = document.querySelector(".relative");
    card.classList.toggle("flip-card-active");
    let front = document.querySelector("#front");
    let back = document.querySelector("#back");
    
    setTimeout(() => {
        front.style.display = front.style.display === "none" ? "block" : "none";
        back.style.display = back.style.display === "none" ? "block" : "none";
    }, flipToBuilder ? 0 : 450);
};

window.getMonthName = function(dateString) {
    const date = new Date(dateString);
    return MONTH_NAMES[date.getMonth()];
};

window.setupBarChart = function(workoutEvents) {
    if (workoutEvents) {
        let aggregatedData = {};

        workoutEvents.forEach(w => {
            const month = getMonthName(w.event_date);
            if (!aggregatedData[month]) {
            aggregatedData[month] = {
                "Easy": 0, "Tempo": 0, "Speed": 0, "Long": 0
            };
            }
            aggregatedData[month][w.event_workout] += w.event_distance;
        });

        const ctx = document.getElementById("myChart").getContext("2d");
        if (myChart) {
            myChart.destroy();
        }

        myChart = new Chart(ctx, {
            type: "bar",
            data: {
            labels: Object.keys(aggregatedData),
            datasets: [
                {
                label: "Easy",
                backgroundColor: "rgba(167, 243, 208, 0.2)",
                borderColor: "rgba(167, 243, 208, 1)",
                borderWidth: 1,
                data: Object.values(aggregatedData).map(monthData => monthData.Easy)
                },
                {
                label: "Tempo",
                backgroundColor: "rgba(59, 130, 246, 0.2)",
                borderColor: "rgba(59, 130, 246, 1)",
                borderWidth: 1,
                data: Object.values(aggregatedData).map(monthData => monthData.Tempo)
                },
                {
                label: "Speed",
                backgroundColor: "rgba(216, 4, 4, 0.2)",
                borderColor: "rgba(216, 4, 4, 1)",
                borderWidth: 1,
                data: Object.values(aggregatedData).map(monthData => monthData.Speed)
                },
                {
                label: "Long",
                backgroundColor: "rgba(118, 1, 168, 0.2)",
                borderColor: "rgba(118, 1, 168, 1)",
                borderWidth: 1,
                data: Object.values(aggregatedData).map(monthData => monthData.Long)
                }
            ]
            },
            options: {
            scales: {
                xAxes: [{
                ticks: {
                    beginAtZero: true
                }
                }],
                yAxes: [{
                ticks: {
                    beginAtZero: true
                }
                }]
            }
            }
        });
    }
};

window.calculateDefaults = function(selectedWorkouts) {
    const conditions = {
      Easy: false,
      Tempo: false,
      Speed: false,
      Long: false
    };
  
    for (const key in selectedWorkouts) {
      if (selectedWorkouts[key] > 0 && key in conditions) {
        conditions[key] = true;
      }
    }
  
    const trueConditions = Object.keys(conditions).filter(key => conditions[key]);
    return window.slider.getOptions(trueConditions.join("+"));
};

window.resizeListener = function(elementId) {
    var $element = $("#" + elementId);
  var $children = $element.children();
  var initial = false;
  $(window)
    .on("resize", function () {
      if (initial) {
        const width = $(window).width() / $element.width();
        const height = $(window).height() / $element.height();
        const scale = `scale(${Math.min(width, height)})`;
        $element.css({
          "-webkit-transform": scale,
          "-moz-transform": scale,
          "-ms-transform": scale,
          "-o-transform": scale,
          transform: scale
        });
        $children.css({
          "-webkit-transform": scale,
          "-moz-transform": scale,
          "-ms-transform": scale,
          "-o-transform": scale,
          transform: scale
        });
      } else {
        initial = true;
      }
    })
    .trigger("resize");
}