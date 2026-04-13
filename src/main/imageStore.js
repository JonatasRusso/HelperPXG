const fs   = require('fs');
const path = require('path');
const { app } = require('electron');

let _dir = null;

function imagesDir() {
  if (!_dir) {
    _dir = path.join(app.getPath('userData'), 'images');
    if (!fs.existsSync(_dir)) fs.mkdirSync(_dir, { recursive: true });
  }
  return _dir;
}

function saveImage(srcPath, subdir = '') {
  const dir = subdir ? path.join(imagesDir(), subdir) : imagesDir();
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const ext      = path.extname(srcPath).toLowerCase();
  const basename = `${Date.now()}${ext}`;
  const filename = subdir ? `${subdir}/${basename}` : basename;
  fs.copyFileSync(srcPath, path.join(imagesDir(), filename));
  return filename;
}

function deleteImage(filename) {
  if (!filename || filename.startsWith('data:')) return;
  try { fs.unlinkSync(path.join(imagesDir(), filename)); } catch (_) {}
}

function toUrl(filename) {
  if (!filename) return null;
  if (filename.startsWith('data:')) return filename; // legacy base64
  const p = path.join(imagesDir(), filename).replace(/\\/g, '/');
  return `file:///${p}`;
}

// Converts a file:// URL back to a bare filename for storage.
// Passes through data: URIs (legacy) and plain filenames unchanged.
function normalizeForStorage(image) {
  if (!image) return null;
  if (image.startsWith('data:')) return image;
  if (image.startsWith('file:///')) {
    return path.basename(decodeURIComponent(image.replace('file:///', '').replace(/\//g, path.sep)));
  }
  return image;
}

function withImageUrls(characters) {
  return characters.map(c => ({ ...c, image: toUrl(c.image) }));
}

module.exports = { saveImage, deleteImage, toUrl, normalizeForStorage, withImageUrls };
