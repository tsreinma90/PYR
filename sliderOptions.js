// file1.js
const getOptions = function (key) {
  switch (key) {
    case "Easy":
      result = {
        start: [100],
        connect: [true, true],
        range: { min: [0], max: [100] },
        disabled: true,
      };
      return result;

    case "Easy+Tempo":
      result = {
        start: [80],
        connect: [true, true],
        range: { min: [0], max: [100] },
        disabled: false,
      };
      return result;

    case "Easy+Speed":
      result = {
        start: [80],
        connect: [true, true],
        range: { min: [0], max: [100] },
        disabled: false,
      };
      return result;

    case "Easy+Long":
      result = {
        start: [75],
        connect: [true, true],
        range: { min: [0], max: [100] },
        disabled: false,
      };
      return result;

    case "Easy+Tempo+Speed":
      result = {
        start: [60, 85],
        connect: [true, true, true],
        range: { min: [0], max: [100] },
        disabled: false,
      };
      return result;

    case "Easy+Tempo+Long":
      result = {
        start: [40, 75],
        connect: [true, true, true],
        range: { min: [0], max: [100] },
        disabled: false,
      };
      return result;

    case "Easy+Speed+Long":
      result = {
        start: [60, 75],
        connect: [true, true, true],
        range: { min: [0], max: [100] },
        disabled: false,
      };
      return result;

    case "Easy+Tempo+Speed+Long":
      result = {
        start: [20, 40, 60],
        connect: [true, true, true, true],
        range: {
          min: [0],
          max: [100],
        },
      };
      return result;

    case "Tempo":
      result = {
        start: [100],
        connect: [true, true],
        range: { min: [0], max: [100] },
        disabled: true,
      };
      return result;

    case "Tempo+Speed":
      result = {
        start: [85],
        connect: [true, true],
        range: { min: [0], max: [100] },
        disabled: false,
      };
      return result;

    case "Tempo+Long":
      result = {
        start: [75],
        connect: [true, true],
        range: { min: [0], max: [100] },
        disabled: false,
      };
      return result;

    case "Tempo+Speed+Long":
      result = {
        start: [50, 75],
        connect: [true, true, true],
        range: { min: [0], max: [100] },
        disabled: false,
      };
      return result;

    case "Speed":
      result = {
        start: [100],
        connect: [true, true],
        range: { min: [0], max: [100] },
        disabled: true,
      };
      return result;

    case "Speed+Long":
      result = {
        start: [60],
        connect: [true, true],
        range: { min: [0], max: [100] },
        disabled: false,
      };
      return result;

    default:
      return null;
  }
};

// Export the function to a global object or namespace
window.slider = window.slider || {};
window.slider.getOptions = getOptions;
