"""
CyberSphere Email Service
─────────────────────────
Handles SMTP mail delivery for user registration and login alerts.
Runs asynchronously in a background thread to prevent API request blocking.
"""

import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import threading
from datetime import datetime
from config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("EmailService")

def _send_email_sync(to_email: str, subject: str, html_content: str):
    """Synchronous sender ran in a background thread."""
    if not settings.SMTP_EMAIL or not settings.SMTP_APP_PASSWORD:
        logger.warning("SMTP credentials not configured. Skipping email dispatch.")
        return

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"CyberSphere Security <{settings.SMTP_EMAIL}>"
        msg["To"] = to_email

        part = MIMEText(html_content, "html")
        msg.attach(part)

        # Connect to Gmail SMTP
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_EMAIL, settings.SMTP_APP_PASSWORD)
            server.sendmail(settings.SMTP_EMAIL, to_email, msg.as_string())
        
        logger.info(f"Email successfully sent to {to_email} with subject: '{subject}'")
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")

def send_welcome_email(email: str, display_name: str):
    """Sends a welcome email upon registration."""
    subject = "Welcome to CyberSphere Operations Control"
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #030712; color: #f3f4f6; margin: 0; padding: 20px; }}
            .container {{ max-width: 600px; margin: 0 auto; background: #0b0f19; border: 1px solid #1f2937; border-radius: 12px; padding: 30px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.5); }}
            .header {{ text-align: center; border-bottom: 1px solid #1f2937; padding-bottom: 20px; }}
            .logo {{ font-size: 24px; font-weight: bold; color: #00f5ff; text-shadow: 0 0 10px rgba(0,245,255,0.3); letter-spacing: 2px; }}
            .content {{ padding: 20px 0; line-height: 1.6; font-size: 15px; color: #d1d5db; }}
            .btn {{ display: inline-block; padding: 12px 24px; background: #7c3aed; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: bold; text-align: center; margin-top: 20px; border: 1px solid #9333ea; box-shadow: 0 0 15px rgba(124,58,237,0.4); }}
            .footer {{ text-align: center; font-size: 11px; color: #4b5563; border-top: 1px solid #1f2937; padding-top: 20px; margin-top: 20px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">CYBERSPHERE</div>
            </div>
            <div class="content">
                <h2>Access Granted, {display_name}</h2>
                <p>Your security analyst account has been successfully initialized on the CyberSphere platform.</p>
                <p>You now have full access to our neural threat detection engines, including:</p>
                <ul>
                    <li><strong>PhishGuard AI:</strong> URL and email analysis</li>
                    <li><strong>SecureShare:</strong> End-to-end encrypted file sharing</li>
                    <li><strong>CloudScan:</strong> Dynamic site vulnerability scanning</li>
                </ul>
                <p>Please log in to your console dashboard to start scanning.</p>
                <div style="text-align: center;">
                    <a href="http://localhost:5173/login" class="btn">Launch Dashboard</a>
                </div>
            </div>
            <div class="footer">
                CyberSphere Operations Control · All connections secured via SSL/TLS · SOC-Grade Security
            </div>
        </div>
    </body>
    </html>
    """
    threading.Thread(target=_send_email_sync, args=(email, subject, html_content), daemon=True).start()

def send_login_alert(email: str, display_name: str, ip_address: str = "127.0.0.1", user_agent: str = "Unknown"):
    """Sends an alert on successful login."""
    subject = "CyberSphere Security Alert: Successful Login Detected"
    time_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #030712; color: #f3f4f6; margin: 0; padding: 20px; }}
            .container {{ max-width: 600px; margin: 0 auto; background: #0b0f19; border: 1px solid #1f2937; border-radius: 12px; padding: 30px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.5); }}
            .header {{ text-align: center; border-bottom: 1px solid #1f2937; padding-bottom: 20px; }}
            .logo {{ font-size: 24px; font-weight: bold; color: #ff0040; text-shadow: 0 0 10px rgba(255,0,64,0.3); letter-spacing: 2px; }}
            .content {{ padding: 20px 0; line-height: 1.6; font-size: 15px; color: #d1d5db; }}
            .alert-box {{ background: rgba(255,149,0,0.1); border: 1px solid rgba(255,149,0,0.3); border-radius: 8px; padding: 15px; margin: 20px 0; }}
            .meta-label {{ font-weight: bold; color: #9ca3af; font-family: monospace; }}
            .meta-val {{ color: #ffffff; font-family: monospace; }}
            .footer {{ text-align: center; font-size: 11px; color: #4b5563; border-top: 1px solid #1f2937; padding-top: 20px; margin-top: 20px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">SECURITY NOTICE</div>
            </div>
            <div class="content">
                <h2>Successful Operator Authentication</h2>
                <p>Hello {display_name},</p>
                <p>A new login was recorded for your CyberSphere analyst account.</p>
                <div class="alert-box">
                    <strong>Session Metadata:</strong><br/>
                    <span class="meta-label">Email:</span> <span class="meta-val">{email}</span><br/>
                    <span class="meta-label">Time:</span> <span class="meta-val">{time_str}</span><br/>
                    <span class="meta-label">IP:</span> <span class="meta-val">{ip_address}</span><br/>
                    <span class="meta-label">Client:</span> <span class="meta-val">{user_agent}</span>
                </div>
                <p style="color: #ff9500;">If this access was not authorized by you, please reset your password immediately and contact security support.</p>
            </div>
            <div class="footer">
                CyberSphere Operations Control · Security Auditing Enabled
            </div>
        </div>
    </body>
    </html>
    """
    threading.Thread(target=_send_email_sync, args=(email, subject, html_content), daemon=True).start()
