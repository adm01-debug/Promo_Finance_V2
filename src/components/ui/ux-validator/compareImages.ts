export const compareImages = (
  img1Data: string,
  img2Data: string,
): Promise<{ heatmap: string; diffScore: number }> => {
  return new Promise((resolve) => {
    const img1 = new Image();
    const img2 = new Image();
    let loadedCount = 0;

    const onLoaded = () => {
      loadedCount++;
      if (loadedCount === 2) {
        const canvas = document.createElement('canvas');
        const width = Math.max(img1.width, img2.width);
        const height = Math.max(img1.height, img2.height);
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve({ heatmap: img1Data, diffScore: 0 });

        ctx.drawImage(img1, 0, 0);
        const img1PixelData = ctx.getImageData(0, 0, width, height).data;

        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img2, 0, 0);
        const img2PixelData = ctx.getImageData(0, 0, width, height).data;

        const diffCanvas = document.createElement('canvas');
        diffCanvas.width = width;
        diffCanvas.height = height;
        const diffCtx = diffCanvas.getContext('2d')!;
        const diffData = diffCtx.createImageData(width, height);
        const data = diffData.data;

        let diffPixels = 0;
        for (let i = 0; i < data.length; i += 4) {
          const rDiff = Math.abs(img1PixelData[i] - img2PixelData[i]);
          const gDiff = Math.abs(img1PixelData[i + 1] - img2PixelData[i + 1]);
          const bDiff = Math.abs(img1PixelData[i + 2] - img2PixelData[i + 2]);
          const brightness = (rDiff + gDiff + bDiff) / 3;

          if (brightness > 10) {
            data[i] = 255;
            data[i + 1] = 0;
            data[i + 2] = 255;
            data[i + 3] = 200;
            diffPixels++;
          } else {
            data[i + 3] = 0;
          }
        }
        diffCtx.putImageData(diffData, 0, 0);
        const diffScore = (diffPixels / (width * height)) * 100;
        resolve({ heatmap: diffCanvas.toDataURL(), diffScore });
      }
    };

    img1.onload = onLoaded;
    img2.onload = onLoaded;
    img1.onerror = () => resolve({ heatmap: '', diffScore: 0 });
    img2.onerror = () => resolve({ heatmap: '', diffScore: 0 });
    img1.src = img1Data;
    img2.src = img2Data;
  });
};
