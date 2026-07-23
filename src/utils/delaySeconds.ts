const delaySeconds = (seconds: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, seconds * 1000);
  });

export default delaySeconds;
