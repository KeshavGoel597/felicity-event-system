const nodemailer = require('nodemailer');

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

/**
 * Send ticket email to participant
 * @param {Object} options - Email options
 * @param {String} options.recipientEmail - Participant email
 * @param {String} options.participantName - Participant full name
 * @param {String} options.eventName - Event name
 * @param {String} options.eventDate - Event date/time
 * @param {String} options.ticketId - Unique ticket ID
 * @param {String} options.qrCode - Base64 encoded QR code
 * @param {Array} options.merchandiseDetails - Merchandise items (optional)
 * @param {String} options.location - Event location (optional)
 */
const sendTicketEmail = async (options) => {
  const {
    recipientEmail,
    participantName,
    eventName,
    eventDate,
    ticketId,
    qrCode,
    merchandiseDetails,
    location,
  } = options;

  try {
    const transporter = createTransporter();

    // Build merchandise items HTML
    let merchandiseHTML = '';
    if (merchandiseDetails && merchandiseDetails.length > 0) {
      merchandiseHTML = `
        <h3 style="color: #333; margin-top: 20px;">Purchased Items:</h3>
        <ul style="list-style: none; padding: 0;">
          ${merchandiseDetails.map(item => `
            <li style="background: #f9f9f9; padding: 10px; margin: 5px 0; border-radius: 5px;">
              <strong>${item.itemName}</strong><br/>
              ${item.selectedSize ? `Size: ${item.selectedSize}<br/>` : ''}
              ${item.selectedColor ? `Color: ${item.selectedColor}<br/>` : ''}
              ${item.selectedVariant ? `Variant: ${item.selectedVariant}<br/>` : ''}
              Quantity: ${item.quantity} | Price: ₹${item.price}
            </li>
          `).join('')}
        </ul>
      `;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #ddd; border-radius: 0 0 10px 10px; }
          .ticket-box { background: #f8f9fa; border: 2px dashed #667eea; padding: 20px; margin: 20px 0; border-radius: 10px; text-align: center; }
          .qr-code { margin: 20px 0; }
          .footer { text-align: center; color: #666; margin-top: 20px; font-size: 12px; }
          .button { background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">🎉 Registration Confirmed!</h1>
            <p style="margin: 10px 0 0 0;">Felicity Event Management System</p>
          </div>
          <div class="content">
            <h2 style="color: #667eea;">Hello ${participantName}!</h2>
            <p>Thank you for registering! Your ticket for <strong>${eventName}</strong> has been confirmed.</p>
            
            <div style="background: #e8eaf6; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #333;">Event Details:</h3>
              <p style="margin: 5px 0;"><strong>Event:</strong> ${eventName}</p>
              <p style="margin: 5px 0;"><strong>Date:</strong> ${eventDate}</p>
              ${location ? `<p style="margin: 5px 0;"><strong>Location:</strong> ${location}</p>` : ''}
            </div>

            ${merchandiseHTML}

            <div class="ticket-box">
              <h3 style="color: #667eea; margin-top: 0;">Your Ticket</h3>
              <p style="font-size: 24px; font-weight: bold; color: #333; margin: 10px 0;">
                ${ticketId}
              </p>
              <div class="qr-code">
                <img src="cid:qrcode" alt="QR Code" style="max-width: 200px; height: auto;"/>
              </div>
              <p style="color: #666; font-size: 14px;">
                ⚠️ Please show this QR code at the event venue for entry
              </p>
            </div>

            <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Important:</strong></p>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Save this email or take a screenshot of the QR code</li>
                <li>Carry a valid ID card to the event</li>
                <li>Arrive 15 minutes before the event starts</li>
              </ul>
            </div>

            <p style="margin-top: 30px;">See you at the event! 🎊</p>
            <p style="color: #666;">Best regards,<br/>Felicity Team</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply to this email.</p>
            <p>© 2026 Felicity Event Management System. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"Felicity Events" <${process.env.EMAIL_USER}>`,
      to: recipientEmail,
      subject: `🎫 Your Ticket for ${eventName} - ${ticketId}`,
      html: htmlContent,
      attachments: [
        {
          filename: 'qrcode.png',
          content: qrCode.split('base64,')[1],
          encoding: 'base64',
          cid: 'qrcode', // Referenced in HTML as cid:qrcode
        },
      ],
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Ticket email sent to ${recipientEmail}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Email sending failed: ${error.message}`);
    // Don't throw error - email failure should not fail the registration
    return { success: false, error: error.message };
  }
};

/**
 * Send a generic email
 * @param {String} to - Recipient email address
 * @param {String} subject - Email subject
 * @param {String} text - Plain text body
 * @param {String} html - HTML body (optional)
 */
const sendEmail = async (to, subject, text, html) => {
  try {
    // Support both (to, subject, text, html) and ({ to, subject, html }) call signatures
    let recipientEmail, emailSubject, emailText, emailHtml;

    if (typeof to === 'object') {
      // Called as sendEmail({ to, subject, text, html })
      recipientEmail = to.to;
      emailSubject = to.subject;
      emailText = to.text || '';
      emailHtml = to.html || '';
    } else {
      // Called as sendEmail(to, subject, text, html)
      recipientEmail = to;
      emailSubject = subject;
      emailText = text || '';
      emailHtml = html || '';
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: `"Felicity Events" <${process.env.EMAIL_USER}>`,
      to: recipientEmail,
      subject: emailSubject,
      text: emailText,
      html: emailHtml,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${recipientEmail}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Email sending failed: ${error.message}`);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendTicketEmail,
  sendEmail,
};
