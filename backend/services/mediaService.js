const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

class MediaService {
    // Process image: convert to WebP, resize, and optimize
    async processProductImage(file) {
        const filename = `img-${Date.now()}.webp`;
        const filepath = path.join(__dirname, '../uploads', filename);
        
        await sharp(file.path)
            .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 80 })
            .toFile(filepath);
            
        // Delete original file
        fs.unlinkSync(file.path);
        
        return `/uploads/${filename}`;
    }

    async generateThumbnail(fileUrl) {
        const originalPath = path.join(__dirname, '..', fileUrl);
        const thumbName = `thumb-${path.basename(fileUrl)}`;
        const thumbPath = path.join(__dirname, '../uploads', thumbName);
        
        await sharp(originalPath)
            .resize(200, 200, { fit: 'cover' })
            .webp({ quality: 60 })
            .toFile(thumbPath);
            
        return `/uploads/${thumbName}`;
    }
}

module.exports = new MediaService();
