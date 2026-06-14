export default function delayMinutes(minutes) {
  return new Promise((resolve) => {
    setTimeout(resolve, minutes * 1000 * 60);
  });
}
