import removeComma from "./removeComma.js";

export default function parseToNumberFromKRW(krwString) {
  return Number(removeComma(krwString).replaceAll("₩", ""));
}
