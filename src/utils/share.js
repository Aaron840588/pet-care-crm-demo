/**
 * Share utility — uses Web Share API (native share sheet on iOS/Android)
 * Falls back to direct download on desktop.
 */

/**
 * Convert a data URL to a File object
 */
function dataUrlToFile(dataUrl, filename) {
  const [header, base64] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)?.[1] || 'image/png';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], filename, { type: mime });
}

/**
 * Try native share with file. Returns true if shared, false if not supported.
 */
export async function shareImageFile(dataUrl, filename) {
  const file = dataUrlToFile(dataUrl, filename);

  // Check if Web Share API supports file sharing
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: filename.replace(/_/g, ' ').replace('.png', ''),
        text: '🐾 From Kat\'s Pet-Sitting Services',
      });
      return 'shared';
    } catch (err) {
      // User cancelled the share sheet
      if (err.name === 'AbortError') return 'cancelled';
      console.error('Share failed:', err);
      return 'error';
    }
  }

  return 'unsupported';
}

/**
 * Direct download (save to gallery / files)
 */
export function downloadImage(dataUrl, filename) {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
