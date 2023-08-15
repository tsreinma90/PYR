// file1.js
const getOptions = function (key) {
  const classes = [
    "c-1-color", // easy
    "c-2-color", // tempo
    "c-3-color", // speed
    "c-4-color", // long
  ];

  switch (key) {
    case "Easy":
      result = {
        start: [100],
        connect: [true, true],
        range: { min: [0], max: [100] },
        disabled: true,
        classes: [classes[0]],
      };
      return result;

    case "Easy+Tempo":
      result = {
        start: [80],
        connect: [true, true],
        range: { min: [0], max: [100] },
        disabled: false,
        classes: [classes[0], classes[1]],
      };
      return result;

    case "Easy+Speed":
      result = {
        start: [80],
        connect: [true, true],
        range: { min: [0], max: [100] },
        disabled: false,
        classes: [classes[0], classes[2]],
      };
      return result;

    case "Easy+Long":
      result = {
        start: [75],
        connect: [true, true],
        range: { min: [0], max: [100] },
        disabled: false,
        classes: [classes[0], classes[3]],
      };
      return result;

    case "Easy+Tempo+Speed":
      result = {
        start: [60, 85],
        connect: [true, true, true],
        range: { min: [0], max: [100] },
        disabled: false,
        classes: [classes[0], classes[1], classes[2]],
      };
      return result;

    case "Easy+Tempo+Long":
      result = {
        start: [40, 75],
        connect: [true, true, true],
        range: { min: [0], max: [100] },
        disabled: false,
        classes: [classes[0], classes[1], classes[3]],
      };
      return result;

    case "Easy+Speed+Long":
      result = {
        start: [60, 75],
        connect: [true, true, true],
        range: { min: [0], max: [100] },
        disabled: false,
        classes: [classes[0], classes[2], classes[3]],
      };
      return result;

    case "Easy+Tempo+Speed+Long":
      result = {
        start: [60, 72, 80],
        connect: [true, true, true, true],
        range: {
          min: [0],
          max: [100],
        },
        disabled: false,
        classes:[classes[0], classes[1], classes[2], classes[3]]
      };
      return result;

    case "Tempo":
      result = {
        start: [100],
        connect: [true, true],
        range: { min: [0], max: [100] },
        disabled: true,
        classes:[classes[1]]
      };
      return result;

    case "Tempo+Speed":
      result = {
        start: [85],
        connect: [true, true],
        range: { min: [0], max: [100] },
        disabled: false,
        classes:[classes[1], classes[2]]
      };
      return result;

    case "Tempo+Long":
      result = {
        start: [75],
        connect: [true, true],
        range: { min: [0], max: [100] },
        disabled: false,
        classes:[classes[1], classes[3]]
      };
      return result;

    case "Tempo+Speed+Long":
      result = {
        start: [50, 75],
        connect: [true, true, true],
        range: { min: [0], max: [100] },
        disabled: false,
        classes:[classes[1], classes[2], classes[3]]
      };
      return result;

    case "Speed":
      result = {
        start: [100],
        connect: [true, true],
        range: { min: [0], max: [100] },
        disabled: true,
        classes:[classes[2]]
      };
      return result;

    case "Speed+Long":
      result = {
        start: [60],
        connect: [true, true],
        range: { min: [0], max: [100] },
        disabled: false,
        classes:[classes[2], classes[3]]
      };
      return result;

    case "Long":
      result = {
        start: [100],
        connect: [true, true],
        range: { min: [0], max: [100] },
        disabled: true,
        classes:[classes[3]]
      };
      return result;

    default:
      result = {
        start: [100],
        connect: [true, true],
        range: { min: [0], max: [100] },
        disabled: true,
        classes:[]
      };
      return result;
  }
};

// Export the function to a global object or namespace
window.slider = window.slider || {};
window.slider.getOptions = getOptions;
