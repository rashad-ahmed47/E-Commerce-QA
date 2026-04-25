/**
 * Returns Management Logic
 */

const Returns = {
    async initList() {
        if (!Auth.isAuthenticated()) {
            window.location.href = '/login.html?redirect=returns.html';
            return;
        }
        Auth.initAuthUI();
        
        try {
            const returns = await Utils.fetchApi('/api/returns/myreturns');
            const container = document.getElementById('returnsList');
            
            if (returns.length === 0) {
                container.innerHTML = `
                    <div class="empty-state bg-white rounded-2xl shadow-sm border border-gray-100 p-12">
                        <i data-lucide="refresh-cw" class="mx-auto h-16 w-16 text-gray-300 mb-4"></i>
                        <h3 class="text-xl font-bold text-gray-900 mb-2">No returns yet</h3>
                        <p class="text-gray-500">You haven't submitted any return requests.</p>
                    </div>
                `;
                lucide.createIcons();
                return;
            }

            container.innerHTML = returns.map(ret => {
                const statusClass = this.getStatusClass(ret.status);

                return `
                    <div class="card overflow-hidden">
                        <div class="bg-gray-50 p-4 border-b border-gray-100 flex flex-wrap justify-between items-center gap-4">
                            <div>
                                <p class="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Submitted On</p>
                                <p class="text-sm font-medium text-gray-900">${Utils.formatDate(ret.createdAt)}</p>
                            </div>
                            <div class="text-right">
                                <p class="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Return ID</p>
                                <p class="text-sm font-mono text-gray-900">${ret._id}</p>
                            </div>
                        </div>
                        
                        <div class="p-6">
                            <div class="flex justify-between items-start mb-6">
                                <div>
                                    <h3 class="font-bold text-gray-900 text-lg mb-1">Reason: ${ret.reason}</h3>
                                    <p class="text-sm text-gray-600 line-clamp-1">For Order #${ret.order._id}</p>
                                </div>
                                <span class="badge ${statusClass} px-3 py-1 text-sm">${ret.status}</span>
                            </div>

                            ${ret.adminComment ? `
                                <div class="bg-blue-50 border border-blue-100 p-4 rounded-xl mb-6 flex gap-3">
                                    <i data-lucide="message-circle" class="text-blue-500 flex-shrink-0"></i>
                                    <div>
                                        <p class="text-xs font-bold text-blue-800 uppercase tracking-wider mb-1">Admin Note</p>
                                        <p class="text-sm text-blue-900">${ret.adminComment}</p>
                                    </div>
                                </div>
                            ` : ''}

                            <!-- Status Timeline UI -->
                            <div class="border-t border-gray-100 pt-6">
                                <h4 class="font-bold text-sm text-gray-900 mb-4">Tracking History</h4>
                                <div class="space-y-4">
                                    ${ret.statusLog.map((log, idx) => `
                                        <div class="flex gap-4">
                                            <div class="flex flex-col items-center">
                                                <div class="w-3 h-3 rounded-full ${idx === ret.statusLog.length - 1 ? 'bg-primary-500 ring-4 ring-primary-50' : 'bg-gray-300'}"></div>
                                                ${idx < ret.statusLog.length - 1 ? '<div class="w-0.5 h-full bg-gray-200 mt-1"></div>' : ''}
                                            </div>
                                            <div class="pb-2">
                                                <p class="font-bold text-sm ${idx === ret.statusLog.length - 1 ? 'text-gray-900' : 'text-gray-500'}">${log.status}</p>
                                                <p class="text-xs text-gray-400">${Utils.formatDate(log.timestamp)}</p>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                            
                            ${ret.status === 'Completed' && ret.resolution === 'Refund' ? `
                                <div class="mt-6 p-4 bg-success-50 rounded-xl border border-success-100 flex justify-between items-center">
                                    <div class="flex items-center gap-2 text-success-700 font-bold">
                                        <i data-lucide="check-circle"></i> Refund Processed
                                    </div>
                                    <span class="font-bold text-success-700 text-lg">${Utils.formatCurrency(ret.refundAmount)}</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `;
            }).join('');
            
            lucide.createIcons();
        } catch (error) {
            Toast.error('Failed to load return requests');
        }
    },

    getStatusClass(status) {
        switch (status) {
            case 'Pending': return 'badge-warning';
            case 'Approved': return 'badge-primary';
            case 'Completed': return 'badge-success';
            case 'Rejected': return 'badge-danger';
            case 'In Review': return 'badge-info';
            default: return 'badge-neutral';
        }
    },

    initRequestForm() {
        if (!Auth.isAuthenticated()) {
            window.location.href = '/login.html';
            return;
        }
        Auth.initAuthUI();
        lucide.createIcons();

        const params = new URLSearchParams(window.location.search);
        const orderId = params.get('orderId');

        if (!orderId) {
            window.location.href = '/orders.html';
            return;
        }

        document.getElementById('orderIdDisplay').innerText = orderId;

        // Image drag drop logic
        const dropZone = document.getElementById('dropZone');
        const fileInput = document.getElementById('images');
        const previewContainer = document.getElementById('imagePreview');
        let selectedFiles = [];

        dropZone.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

        function handleFiles(files) {
            const newFiles = Array.from(files).slice(0, 3 - selectedFiles.length);
            selectedFiles = [...selectedFiles, ...newFiles];
            if (selectedFiles.length > 0) {
                previewContainer.classList.remove('hidden');
                renderPreviews();
            }
        }

        function renderPreviews() {
            previewContainer.innerHTML = selectedFiles.map((file, index) => `
                <div class="relative aspect-square rounded-xl overflow-hidden border border-gray-200">
                    <img src="${URL.createObjectURL(file)}" class="w-full h-full object-cover">
                    <button type="button" class="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full p-1" onclick="Returns.removeFile(${index})">
                        <i data-lucide="x" class="w-3 h-3"></i>
                    </button>
                </div>
            `).join('');
            lucide.createIcons();
        }

        this.removeFile = (index) => {
            selectedFiles.splice(index, 1);
            renderPreviews();
            if (selectedFiles.length === 0) previewContainer.classList.add('hidden');
        };

        // Form Submit
        document.getElementById('returnForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('submitBtn');
            btn.disabled = true;
            btn.innerHTML = '<div class="spinner border-white mr-2"></div> Submitting...';

            const formData = new FormData();
            formData.append('order', orderId);
            formData.append('reason', document.getElementById('reason').value);
            formData.append('description', document.getElementById('description').value);
            
            selectedFiles.forEach(f => formData.append('images', f));

            try {
                const res = await fetch('/api/returns', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${Auth.getToken()}` },
                    body: formData
                });
                
                if (!res.ok) throw new Error((await res.json()).message);
                
                Toast.success('Return request submitted');
                setTimeout(() => window.location.href = '/returns.html', 1500);
            } catch (error) {
                Toast.error(error.message);
                btn.disabled = false;
                btn.innerText = 'Submit Request';
            }
        });
    }
};

window.Returns = Returns;
