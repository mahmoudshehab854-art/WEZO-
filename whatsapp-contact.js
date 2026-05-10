/**
 * WEZO WhatsApp Contact System
 * Advanced booking management with WhatsApp integration
 * Author: mahmoudshehab854-art
 */

const WEZO = (() => {
    // Configuration
    const config = {
        businessPhone: '201033964828', // WhatsApp Business Number (without +)
        storageKey: 'wezo_bookings',
        dateFormat: 'YYYY-MM-DD HH:mm:ss'
    };

    // Initialize storage if empty
    if (!localStorage.getItem(config.storageKey)) {
        localStorage.setItem(config.storageKey, JSON.stringify([]));
    }

    /**
     * Format date to readable string
     */
    const formatDate = (date) => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${day}/${month}/${year} - ${hours}:${minutes}`;
    };

    /**
     * Generate unique booking ID
     */
    const generateBookingId = () => {
        return 'WEZO' + Date.now() + Math.random().toString(36).substr(2, 9);
    };

    /**
     * Escape special characters for WhatsApp
     */
    const escapeWhatsApp = (text) => {
        return text.replace(/[*_[\]()~`>#+=|{}.!-]/g, '\\$&');
    };

    /**
     * Create formatted WhatsApp message
     */
    const createWhatsAppMessage = (formData) => {
        const timestamp = new Date();
        const formattedTime = formatDate(timestamp);

        const message = `🎥 *طلب حجز جديد من WEZO*

👤 *الاسم:* ${formData.name}
📱 *رقم الهاتف:* ${formData.phone}
📅 *تاريخ الحفل:* ${formData.eventDate}
🕐 *الوقت المفضل:* ${formData.eventTime || 'غير محدد'}
📍 *موقع الحفل:* ${formData.location}
🎯 *نوع الخدمة:* ${formData.serviceType}
💬 *الملاحظات:* ${formData.notes || 'لا توجد ملاحظات'}

⏰ *وقت الطلب:* ${formattedTime}
🆔 *رقم الحجز:* ${generateBookingId()}`;

        return message;
    };

    /**
     * Generate WhatsApp link
     */
    const generateWhatsAppLink = (formData) => {
        const message = createWhatsAppMessage(formData);
        const encodedMessage = encodeURIComponent(message);
        return `https://wa.me/${config.businessPhone}?text=${encodedMessage}`;
    };

    /**
     * Save booking data locally
     */
    const saveFormData = (formData) => {
        try {
            const bookings = JSON.parse(localStorage.getItem(config.storageKey)) || [];
            
            const booking = {
                id: generateBookingId(),
                ...formData,
                timestamp: new Date().toISOString(),
                status: 'pending'
            };

            bookings.push(booking);
            localStorage.setItem(config.storageKey, JSON.stringify(bookings));
            
            return booking;
        } catch (error) {
            console.error('Error saving booking:', error);
            return null;
        }
    };

    /**
     * Get all bookings
     */
    const getAllBookings = () => {
        try {
            return JSON.parse(localStorage.getItem(config.storageKey)) || [];
        } catch (error) {
            console.error('Error retrieving bookings:', error);
            return [];
        }
    };

    /**
     * Get booking by ID
     */
    const getBookingById = (id) => {
        const bookings = getAllBookings();
        return bookings.find(b => b.id === id);
    };

    /**
     * Update booking status
     */
    const updateBookingStatus = (id, status) => {
        try {
            const bookings = getAllBookings();
            const index = bookings.findIndex(b => b.id === id);
            
            if (index !== -1) {
                bookings[index].status = status;
                bookings[index].updatedAt = new Date().toISOString();
                localStorage.setItem(config.storageKey, JSON.stringify(bookings));
                return bookings[index];
            }
            return null;
        } catch (error) {
            console.error('Error updating booking:', error);
            return null;
        }
    };

    /**
     * Delete booking
     */
    const deleteBooking = (id) => {
        try {
            const bookings = getAllBookings();
            const filtered = bookings.filter(b => b.id !== id);
            localStorage.setItem(config.storageKey, JSON.stringify(filtered));
            return true;
        } catch (error) {
            console.error('Error deleting booking:', error);
            return false;
        }
    };

    /**
     * Get booking statistics
     */
    const getBookingStatistics = () => {
        const bookings = getAllBookings();
        const stats = {
            total: bookings.length,
            pending: bookings.filter(b => b.status === 'pending').length,
            confirmed: bookings.filter(b => b.status === 'confirmed').length,
            completed: bookings.filter(b => b.status === 'completed').length,
            cancelled: bookings.filter(b => b.status === 'cancelled').length,
            byServiceType: {},
            byLocation: {}
        };

        bookings.forEach(b => {
            stats.byServiceType[b.serviceType] = (stats.byServiceType[b.serviceType] || 0) + 1;
            stats.byLocation[b.location] = (stats.byLocation[b.location] || 0) + 1;
        });

        return stats;
    };

    /**
     * Export bookings as CSV
     */
    const exportBookingsAsCSV = () => {
        const bookings = getAllBookings();
        
        if (bookings.length === 0) {
            alert('لا توجد حجوزات للتصدير');
            return;
        }

        const headers = ['رقم الحجز', 'الاسم', 'الهاتف', 'تاريخ الحفل', 'الموقع', 'نوع الخدمة', 'الحالة', 'تاريخ الطلب'];
        const rows = bookings.map(b => [
            b.id,
            b.name,
            b.phone,
            b.eventDate,
            b.location,
            b.serviceType,
            b.status,
            formatDate(b.timestamp)
        ]);

        let csv = headers.join(',') + '\n';
        rows.forEach(row => {
            csv += row.map(cell => `"${cell}"`).join(',') + '\n';
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `WEZO-Bookings-${Date.now()}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    /**
     * Print booking statistics
     */
    const printBookingStats = () => {
        const stats = getBookingStatistics();
        console.log('📊 WEZO Booking Statistics:');
        console.table(stats);
    };

    /**
     * Handle contact form submission
     */
    const handleContactForm = (formData) => {
        try {
            // Validate form data
            if (!formData.name || !formData.phone || !formData.eventDate || !formData.location) {
                throw new Error('يرجى ملء جميع الحقول المطلوبة');
            }

            // Save booking
            const savedBooking = saveFormData(formData);
            if (!savedBooking) {
                throw new Error('حدث خطأ في حفظ البيانات');
            }

            // Generate WhatsApp link
            const whatsappLink = generateWhatsAppLink(formData);

            // Show success message
            showNotification('تم حفظ طلبك بنجاح! سيتم فتح واتساب الآن...', 'success');

            // Redirect to WhatsApp
            setTimeout(() => {
                window.open(whatsappLink, '_blank');
            }, 1500);

            return {
                success: true,
                booking: savedBooking,
                whatsappLink: whatsappLink
            };

        } catch (error) {
            console.error('Form handling error:', error);
            showNotification(error.message || 'حدث خطأ في معالجة الطلب', 'error');
            return {
                success: false,
                error: error.message
            };
        }
    };

    /**
     * Show notification
     */
    const showNotification = (message, type = 'info') => {
        const notification = document.createElement('div');
        notification.className = `wezo-notification wezo-notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 9999;
            animation: slideIn 0.3s ease;
            font-family: 'Cairo', sans-serif;
            ${type === 'success' ? 'background: #4CAF50; color: white;' : 'background: #f44336; color: white;'}
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    };

    /**
     * Add notification styles
     */
    const addNotificationStyles = () => {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(400px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            @keyframes slideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(400px);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    };

    // Initialize notification styles on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addNotificationStyles);
    } else {
        addNotificationStyles();
    }

    // Public API
    return {
        handleContactForm,
        generateWhatsAppLink,
        saveFormData,
        getAllBookings,
        getBookingById,
        updateBookingStatus,
        deleteBooking,
        getBookingStatistics,
        exportBookingsAsCSV,
        printBookingStats,
        showNotification,
        config
    };
})();

// Make WEZO available globally
window.WEZO = WEZO;
