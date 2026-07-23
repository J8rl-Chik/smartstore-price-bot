const delayMinutes = (minutes: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, minutes * 1000 * 60);
  });

export default delayMinutes;
