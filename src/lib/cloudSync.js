// Persistent Cloud Synchronization Store for QLCN 12.7 (Serverless & Cross-Device)
const CLOUD_OBJECT_ID = 'ff808181a067127101a081c2838b4bbd';
const CLOUD_API_URL = `https://api.restful-api.dev/objects/${CLOUD_OBJECT_ID}`;

/**
 * Upload an image (base64) to high-speed CDN and return permanent HTTPS URL
 */
export async function uploadImageToCDN(base64Str, filename = 'image.jpg') {
  if (!base64Str || typeof base64Str !== 'string') return '';
  if (base64Str.startsWith('http://') || base64Str.startsWith('https://')) {
    return base64Str;
  }
  try {
    const matches = base64Str.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    const buffer = matches ? Buffer.from(matches[2], 'base64') : Buffer.from(base64Str, 'base64');
    
    const formData = new FormData();
    formData.append('reqtype', 'fileupload');
    const blob = new Blob([buffer], { type: 'image/jpeg' });
    formData.append('fileToUpload', blob, filename);

    const res = await fetch('https://catbox.moe/user/api.php', {
      method: 'POST',
      body: formData
    });
    if (res.ok) {
      const url = (await res.text()).trim();
      if (url.startsWith('https://') || url.startsWith('http://')) {
        return url;
      }
    }
  } catch (err) {
    console.warn('CDN upload exception, falling back to base64:', err.message);
  }
  return base64Str;
}

/**
 * Retrieve persistent data from Cloud Sync Store
 */
export async function fetchCloudData() {
  try {
    const res = await fetch(CLOUD_API_URL, { headers: { 'Accept': 'application/json' } });
    if (res.ok) {
      const json = await res.json();
      return json.data || {};
    }
  } catch (err) {
    console.warn('Failed to fetch from Cloud Store:', err.message);
  }
  return {};
}

/**
 * Merge and save patch data to Cloud Sync Store
 */
export async function saveCloudData(patch) {
  try {
    const current = await fetchCloudData();
    const merged = { ...current, ...patch };

    const res = await fetch(CLOUD_API_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'qlcn_12_7_cloud_sync',
        data: merged
      })
    });
    if (res.ok) {
      const json = await res.json();
      return json.data || merged;
    }
  } catch (err) {
    console.warn('Failed to save to Cloud Store:', err.message);
  }
  return null;
}
