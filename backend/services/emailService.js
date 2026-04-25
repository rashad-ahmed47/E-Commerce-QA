const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        // Will only initialize successfully if env vars exist
        // For development, we log emails to console if credentials missing
        this.transporter = null;
        if (process.env.SMTP_HOST) {
            this.transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT || 587,
                secure: false, // true for 465, false for other ports
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            });
        }
    }

    async sendEmail(options) {
        if (!this.transporter) {
            console.log('--- EMAIL MOCK ---');
            console.log(`To: ${options.email}`);
            console.log(`Subject: ${options.subject}`);
            console.log(`Body: ${options.message}`);
            console.log('------------------');
            return true;
        }

        const message = {
            from: `${process.env.FROM_NAME || 'E-SHOP'} <${process.env.FROM_EMAIL || 'noreply@eshop.com'}>`,
            to: options.email,
            subject: options.subject,
            text: options.message,
            html: options.html || `<p>${options.message.replace(/\n/g, '<br>')}</p>`,
        };

        try {
            const info = await this.transporter.sendMail(message);
            console.log('Message sent: %s', info.messageId);
            return true;
        } catch (error) {
            console.error('Email send failed: ', error);
            return false;
        }
    }
}

module.exports = new EmailService();
