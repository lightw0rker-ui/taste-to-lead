import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.ethereal.email",
  port: 587,
  auth: {
    user: process.env.SMTP_USER || "test@ethereal.email",
    pass: process.env.SMTP_PASS || "testpass",
  },
});

export async function sendEmail(to: string, subject: string, body: string): Promise<void> {
  try {
    const info = await transporter.sendMail({
      from: '"LuxeEstates Alerts" <alerts@luxeestates.com>',
      to,
      subject,
      html: body,
    });
    console.log(`[NotificationService] Email sent: ${info.messageId}`);
  } catch (error) {
    console.error("[NotificationService] Email send failed:", error);
  }
}

export function buildMatchEmailHtml({
  userName,
  propertyTitle,
  propertyLocation,
  matchScore,
  matchedTags,
  price,
}: {
  userName: string;
  propertyTitle: string;
  propertyLocation: string;
  matchScore: number;
  matchedTags: string[];
  price: number;
}): string {
  const tagBadges = matchedTags.length > 0
    ? matchedTags.map(t => `<span style="display:inline-block;background:#f59e0b;color:#000;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:600;margin:2px;">${t}</span>`).join(" ")
    : '<span style="color:#888;">No specific tags matched</span>';

  return `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:500px;margin:0 auto;background:#1a1a2e;border-radius:12px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#f59e0b,#d97706);padding:24px;text-align:center;">
        <h1 style="margin:0;color:#000;font-size:22px;">HOT LEAD ALERT</h1>
        <p style="margin:4px 0 0;color:#000;opacity:0.7;font-size:14px;">${matchScore}% Match Score</p>
      </div>
      <div style="padding:24px;color:#e2e8f0;">
        <p style="margin:0 0 8px;font-size:16px;"><strong>${userName || "A buyer"}</strong> matched with:</p>
        <h2 style="margin:0 0 4px;color:#f59e0b;font-size:20px;">${propertyTitle}</h2>
        <p style="margin:0 0 16px;color:#94a3b8;font-size:14px;">${propertyLocation} &bull; $${price.toLocaleString()}</p>
        <div style="margin:0 0 20px;">
          <p style="margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;">Matched on:</p>
          ${tagBadges}
        </div>
        <a href="#" style="display:block;text-align:center;background:#f59e0b;color:#000;padding:12px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">View Lead Details</a>
      </div>
    </div>
  `;
}
