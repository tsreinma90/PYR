import { TEMPLATES as HALF } from "./half-marathon.js";
import { TEMPLATES as FIVEK } from "./5k.js";
//import { TEMPLATES as TENK } from "./10k.js";
//import { TEMPLATES as MARATHON } from "./marathon.js";

export const TEMPLATE_REGISTRY = {
  ...HALF,
  ...FIVEK
};