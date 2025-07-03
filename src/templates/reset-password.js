const ResetPasswordTemplate = data => {
    const { name, resetPassLink } = data;
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Password Reset</title>
            <style>
            body {
                font-family: Arial, sans-serif;
                background-color: #f7f7f7;
                margin: 0;
                padding: 0;
            }

            .email-container {
                max-width: 600px;
                margin: 40px auto;
                background-color: #ffffff !important;
                border-radius: 8px;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1) !important;
                overflow: hidden;
                border: 1px solid #f2f2f2 !important;
            }

            .email-header {
                background-color: #18181b;
                color: #ffffff;
                text-align: center;
                padding: 20px;
                font-size: 24px;
                font-weight: bold;
            }

            .branding {
                color: #18181b;
                font-weight: bold;
                font-size: 24px;
                margin: 0 0 16px;
            }

            .email-body {
                padding: 30px;
                color: #333333;
                line-height: 1.6;
            }

            .email-body p {
                margin: 0 0 16px;
            }

            .reset-button {
                display: block;
                width: 200px;
                margin: 20px auto;
                padding: 12px 0;
                background-color: #18181b;
                color: #ffffff !important;
                text-align: center;
                text-decoration: none;
                border-radius: 33px;
                font-size: 18px;
                font-weight: bold;
            }

            .reset-button:hover {
                background-color: #18181be6;
            }

            .footer {
                margin-bottom: 0px !important;
            }
            </style>
        </head>

        <body>
            <div class="email-container">
            <div class="email-header">Password Reset</div>
            <div class="email-body">
                <h2 class="branding">LET'Z GEAR</h2>
                <p>Hello ${name},</p>
                <p>
                We received a request to reset your password. Click the button or
                reset url below to reset it:
                </p>
                <a href="${resetPassLink}" class="reset-button">Reset Password</a>

                <p>
                If you’re having trouble clicking the "Reset Password" button, copy
                and paste the URL below into your web browser or click :
                <a href="${resetPassLink}">${resetPassLink}</a>
                </p>

                <p>
                If you didn’t request a password reset, you can ignore this email.
                Your password won’t change until you access the link above and create
                a new one.
                </p>
                <p class="footer">Thank you!</p>
            </div>
            </div>
        </body>
        </html>
    `;
};

module.exports = ResetPasswordTemplate;
