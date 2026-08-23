const nodemailer = require("nodemailer");

let transporterPromise;

async function getTransporter() {
    if (process.env.NODE_ENV === "test") {
        return null;
    }

    if (transporterPromise) {
        return transporterPromise;
    }

    transporterPromise = (async () => {
        if (process.env.SMTP_HOST && process.env.SMTP_USER) {
            return nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: Number(process.env.SMTP_PORT) || 587,
                secure: process.env.SMTP_SECURE === "true",
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            });
        }

        return null;
    })();

    return transporterPromise;
}

module.exports.sendMail = async ({ to, subject, text, html }) => {
    const from =
        process.env.MAIL_FROM ||
        "WanderLust <noreply@wanderlust.local>";

    const transporter = await getTransporter();

    if (!transporter) {
        console.log("📧 [mail:dev]", { to, subject, text });
        return { preview: null, logged: true };
    }

    const info = await transporter.sendMail({
        from,
        to,
        subject,
        text,
        html: html || text,
    });

    const preview = nodemailer.getTestMessageUrl(info);
    if (preview) {
        console.log("📧 Ethereal preview:", preview);
    }

    return { preview, logged: false };
};
