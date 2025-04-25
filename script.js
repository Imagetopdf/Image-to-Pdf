// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize jsPDF
    const { jsPDF } = window.jspdf;
    
    // Get DOM elements
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const selectFilesBtn = document.getElementById('selectFilesBtn');
    const convertBtn = document.getElementById('convertBtn');
    const clearAllBtn = document.getElementById('clearAllBtn');
    const previewSection = document.getElementById('previewSection');
    const imagePreview = document.getElementById('imagePreview');
    const pdfName = document.getElementById('pdfName');
    const pdfQuality = document.getElementById('pdfQuality');
    const pdfOrientation = document.getElementById('pdfOrientation');
    const pdfMargin = document.getElementById('pdfMargin');
    const statusMessage = document.getElementById('status-message');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const comparisonModal = document.getElementById('comparisonModal');
    const closeModal = document.getElementById('closeModal');
    const originalImage = document.getElementById('originalImage');
    const pdfPreview = document.getElementById('pdfPreview');
    
    // Store uploaded images
    let uploadedImages = [];
    
    // Event listeners
    selectFilesBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    convertBtn.addEventListener('click', convertToPdf);
    clearAllBtn.addEventListener('click', clearAll);
    closeModal.addEventListener('click', () => comparisonModal.style.display = 'none');
    
    // Handle file selection
    function handleFileSelect(e) {
        const files = e.target.files || (e.dataTransfer && e.dataTransfer.files);
        if (!files || files.length === 0) return;
        
        processFiles(files);
    }
    
    // Handle drag over
    function handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.style.borderColor = var(--primary-color);
        uploadArea.style.backgroundColor = 'rgba(67, 97, 238, 0.1)';
    }
    
    // Handle drag leave
    function handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.style.borderColor = '#ccc';
        uploadArea.style.backgroundColor = 'transparent';
    }
    
    // Handle drop
    function handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.style.borderColor = '#ccc';
        uploadArea.style.backgroundColor = 'transparent';
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            processFiles(files);
        }
    }
    
    // Process selected files
    function processFiles(files) {
        const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        const newImages = [];
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            if (!validImageTypes.includes(file.type)) {
                showStatus(`Skipped ${file.name} - Only JPG, PNG, GIF, and WEBP images are supported`, 'error');
                continue;
            }
            
            const reader = new FileReader();
            
            reader.onload = function(e) {
                newImages.push({
                    name: file.name,
                    size: formatFileSize(file.size),
                    type: file.type,
                    dataUrl: e.target.result
                });
                
                // When all files are processed
                if (newImages.length === files.length || i === files.length - 1) {
                    uploadedImages = [...uploadedImages, ...newImages];
                    updatePreview();
                }
            };
            
            reader.readAsDataURL(file);
        }
    }
    
    // Update image preview
    function updatePreview() {
        if (uploadedImages.length === 0) {
            previewSection.style.display = 'none';
            return;
        }
        
        previewSection.style.display = 'block';
        imagePreview.innerHTML = '';
        
        uploadedImages.forEach((image, index) => {
            const imageItem = document.createElement('div');
            imageItem.className = 'image-item';
            
            imageItem.innerHTML = `
                <img src="${image.dataUrl}" alt="${image.name}">
                <div class="image-info">
                    <p><strong>${image.name}</strong></p>
                    <p>${image.size}</p>
                    <div class="image-actions">
                        <button class="compare-btn" data-index="${index}">
                            <i class="fas fa-eye"></i> Compare
                        </button>
                        <button class="remove-btn" data-index="${index}">
                            <i class="fas fa-times"></i> Remove
                        </button>
                    </div>
                </div>
            `;
            
            imagePreview.appendChild(imageItem);
        });
        
        // Add event listeners to remove buttons
        document.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                uploadedImages.splice(index, 1);
                updatePreview();
            });
        });
        
        // Add event listeners to compare buttons
        document.querySelectorAll('.compare-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                showComparison(index);
            });
        });
    }
    
    // Show before/after comparison
    function showComparison(index) {
        const image = uploadedImages[index];
        originalImage.src = image.dataUrl;
        
        // Create a temporary canvas to simulate PDF preview
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Calculate dimensions based on orientation
            let width = img.width;
            let height = img.height;
            const orientation = pdfOrientation.value;
            const margin = parseInt(pdfMargin.value) * 5.67; // Convert mm to pixels (approx)
            
            if (orientation === 'portrait') {
                if (width > height) {
                    [width, height] = [height, width];
                }
            } else if (orientation === 'landscape') {
                if (height > width) {
                    [width, height] = [height, width];
                }
            }
            
            // Add margin
            width += margin * 2;
            height += margin * 2;
            
            canvas.width = width;
            canvas.height = height;
            
            // Fill with white background
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, width, height);
            
            // Draw image with margin
            const x = margin;
            const y = margin;
            const imgWidth = width - margin * 2;
            const imgHeight = height - margin * 2;
            
            ctx.drawImage(img, x, y, imgWidth, imgHeight);
            
            // Set preview
            pdfPreview.src = canvas.toDataURL('image/jpeg', parseFloat(pdfQuality.value));
            
            // Show modal
            comparisonModal.style.display = 'flex';
        };
        
        img.src = image.dataUrl;
    }
    
    // Convert images to PDF
    function convertToPdf() {
        if (uploadedImages.length === 0) {
            showStatus('Please add at least one image to convert', 'error');
            return;
        }
        
        loadingIndicator.style.display = 'block';
        convertBtn.disabled = true;
        
        // Create a new PDF document
        const pdf = new jsPDF();
        const quality = parseFloat(pdfQuality.value);
        const margin = parseInt(pdfMargin.value);
        const orientation = pdfOrientation.value;
        
        // Process each image
        Promise.all(uploadedImages.map(image => {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = function() {
                    resolve(img);
                };
                img.src = image.dataUrl;
            });
        })).then(images => {
            images.forEach((img, index) => {
                let imgWidth = img.width;
                let imgHeight = img.height;
                
                // Calculate dimensions based on orientation
                if (orientation === 'portrait') {
                    if (imgWidth > imgHeight) {
                        [imgWidth, imgHeight] = [imgHeight, imgWidth];
                    }
                } else if (orientation === 'landscape') {
                    if (imgHeight > imgWidth) {
                        [imgWidth, imgHeight] = [imgHeight, imgWidth];
                    }
                }
                
                // Convert from pixels to mm (1px ≈ 0.264583mm)
                const width = imgWidth * 0.264583;
                const height = imgHeight * 0.264583;
                
                // Add a new page for each image (except the first one)
                if (index > 0) {
                    pdf.addPage([width, height], orientation === 'portrait' ? 'portrait' : 'landscape');
                } else {
                    // Set the first page size based on the first image
                    pdf.setPage(0);
                    pdf.internal.pageSize.setWidth(width);
                    pdf.internal.pageSize.setHeight(height);
                }
                
                // Add image to PDF
                pdf.addImage(
                    img.src, 
                    'JPEG', 
                    margin, 
                    margin, 
                    width - margin * 2, 
                    height - margin * 2, 
                    undefined, 
                    'FAST', 
                    0
                );
            });
            
            // Save the PDF
            const fileName = pdfName.value.trim() || 'converted';
            pdf.save(`${fileName}.pdf`);
            
            showStatus('PDF created successfully!', 'success');
            loadingIndicator.style.display = 'none';
            convertBtn.disabled = false;
        }).catch(error => {
            console.error('Error creating PDF:', error);
            showStatus('Error creating PDF. Please try again.', 'error');
            loadingIndicator.style.display = 'none';
            convertBtn.disabled = false;
        });
    }
    
    // Clear all images
    function clearAll() {
        uploadedImages = [];
        updatePreview();
        fileInput.value = '';
        showStatus('All images cleared', 'success');
    }
    
    // Show status message
    function showStatus(message, type) {
        statusMessage.textContent = message;
        statusMessage.className = 'status-message ' + type;
        
        // Hide message after 5 seconds
        setTimeout(() => {
            statusMessage.style.display = 'none';
        }, 5000);
    }
    
    // Format file size
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === comparisonModal) {
            comparisonModal.style.display = 'none';
        }
    });
});
