const SAMPLE_SIZE = 32;

export const waitForCaptureReady = async () => {
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  await new Promise((resolve) => setTimeout(resolve, 120));

  if (document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // Browser font readiness is best-effort for image export.
    }
  }
};

export const assertPngDataUrlHasVisibleContent = async (dataUrl, label = 'Generated image') => {
  if (!dataUrl) {
    throw new Error(`${label} was not generated.`);
  }

  await new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = SAMPLE_SIZE;
      canvas.height = SAMPLE_SIZE;

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        reject(new Error(`${label} could not be checked.`));
        return;
      }

      ctx.drawImage(image, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
      const pixels = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE).data;
      let count = 0;
      let min = 255;
      let max = 0;
      let total = 0;
      let totalSquares = 0;

      for (let i = 0; i < pixels.length; i += 4) {
        if (pixels[i + 3] < 8) continue;
        const brightness = pixels[i] * 0.299 + pixels[i + 1] * 0.587 + pixels[i + 2] * 0.114;
        count += 1;
        min = Math.min(min, brightness);
        max = Math.max(max, brightness);
        total += brightness;
        totalSquares += brightness * brightness;
      }

      const variance = count > 0 ? totalSquares / count - (total / count) ** 2 : 0;
      const stdev = Math.sqrt(Math.max(0, variance));
      const range = max - min;

      if (count < SAMPLE_SIZE * SAMPLE_SIZE * 0.5 || range < 8 || stdev < 2) {
        reject(new Error(`${label} rendered blank. Please try again.`));
        return;
      }

      resolve();
    };

    image.onerror = () => reject(new Error(`${label} could not be loaded for checking.`));
    image.src = dataUrl;
  });

  return dataUrl;
};
