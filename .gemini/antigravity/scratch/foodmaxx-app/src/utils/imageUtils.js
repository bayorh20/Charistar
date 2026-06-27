export const getOptimizedImageUrl = (url, width = 400, quality = 60) => {
  if (!url) return '';
  if (url.includes('images.unsplash.com')) {
    return url
      .replace(/w=\d+/, `w=${width}`)
      .replace(/q=\d+/, `q=${quality}`)
      .replace('auto=format', 'auto=format,compress'); // force compression
  }
  return url;
};
