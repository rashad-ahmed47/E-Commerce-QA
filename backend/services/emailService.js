const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        this.transporter = null;
        if (process.env.SMTP_HOST) {
            const port = parseInt(process.env.SMTP_PORT || '587', 10);
            // Port 465 requires SSL (secure:true), all other ports use STARTTLS
            const secure = port === 465;

            this.transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port,
                secure,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            });
        }
    }

    async sendEmail(options) {
        if (!this.transporter) {
            // Development mock — log to console
            console.log('\n--- 📧 EMAIL MOCK ---');
            console.log(`To:      ${options.email}`);
            console.log(`Subject: ${options.subject}`);
            console.log(`Body:\n${options.message}`);
            console.log('---------------------\n');
            return true;
        }

        const message = {
            from: `"${process.env.FROM_NAME || 'E-SHOP'}" <${process.env.FROM_EMAIL || 'noreply@eshop.com'}>`,
            to: options.email,
            subject: options.subject,
            text: options.message,
            html: options.html || `<p>${options.message.replace(/\n/g, '<br>')}</p>`,
        };

        try {
            const info = await this.transporter.sendMail(message);
            console.log(`Email sent: ${info.messageId}`);
            return true;
        } catch (error) {
            console.error('Email send failed:', error.message);
            return false;
        }
    }
}

module.exports = new EmailService();
