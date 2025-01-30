class WebPConverter {
    constructor() {
        this.files = [];
        this.convertedImages = [];
        this.initEventListeners();
    }

    initEventListeners() {
        const dropZone = document.getElementById('dropZone');
        const fileInput = document.getElementById('fileInput');
        const convertBtn = document.getElementById('convertBtn');
        const qualityInput = document.getElementById('quality');
        
        // Drag and drop
        dropZone.addEventListener('dragover', e => this.handleDragOver(e));
        dropZone.addEventListener('drop', e => this.handleDrop(e));
        
        // File input
        fileInput.addEventListener('change', e => this.handleFileSelect(e));
        
        // Quality control
        qualityInput.addEventListener('input', () => {
            document.getElementById('qualityValue').textContent = `${qualityInput.value}%`;
        });
        
        // Convert button
        convertBtn.addEventListener('click', () => this.convertFiles());
        
        // Download all
        document.getElementById('downloadAll').addEventListener('click', () => this.downloadAll());
    }

    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'copy';
    }

    handleDrop(e) {
        e.preventDefault();
        this.processFiles(e.dataTransfer.files);
    }

    handleFileSelect(e) {
        this.processFiles(e.target.files);
    }

    async processFiles(files) {
        const validFiles = Array.from(files).filter(file => 
            file.type === 'image/webp' && file.size < 5 * 1024 * 1024
        );

        if (validFiles.length === 0) {
            alert('Пожалуйста, выберите файлы WebP (макс. 5MB каждый)');
            return;
        }

        this.files = validFiles;
        this.updateUI();
        this.showPreviews();
    }

    async showPreviews() {
        const gallery = document.getElementById('gallery');
        gallery.innerHTML = '';

        for (const file of this.files) {
            const img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            img.classList.add('preview');
            gallery.appendChild(img);
        }

        document.getElementById('convertBtn').disabled = false;
    }

    async convertFiles() {
        const quality = document.getElementById('quality').value / 100;
        this.convertedImages = [];

        for (const [index, file] of this.files.entries()) {
            try {
                const jpgBlob = await this.convertWebPToJPG(file, quality);
                this.convertedImages.push({
                    name: file.name.replace(/\.webp$/i, '.jpg'),
                    blob: jpgBlob
                });
                this.updateProgress(index + 1, this.files.length);
            } catch (error) {
                console.error('Ошибка конвертации:', error);
            }
        }

        document.getElementById('downloadAll').disabled = false;
        this.showNotification(`Конвертация завершена! Готово файлов: ${this.convertedImages.length}`);
    }

    convertWebPToJPG(file, quality) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = URL.createObjectURL(file);
            
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                
                canvas.toBlob(blob => {
                    resolve(blob);
                    URL.revokeObjectURL(img.src);
                }, 'image/jpeg', quality);
            };
            
            img.onerror = reject;
        });
    }

    async downloadAll() {
        const zip = new JSZip();
        
        this.convertedImages.forEach((img, index) => {
            zip.file(img.name, img.blob);
        });

        const content = await zip.generateAsync({type: 'blob'});
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = 'converted-images.zip';
        link.click();
    }

    updateProgress(current, total) {
        const progress = document.getElementById('progress');
        progress.textContent = `Обработано: ${current} из ${total}`;
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    updateUI() {
        // Дополнительные обновления интерфейса
    }
}

// Инициализация приложения
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js');
    });
}

new WebPConverter();
