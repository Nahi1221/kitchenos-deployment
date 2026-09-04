import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kitchenos.settings')
django.setup()

from core.utils.mailer import send_email

try:
    result = send_email(
        to='nmulugeta97@gmail.com',
        subject='KitchenOS Test Email',
        html_content='<p>This is a test email from KitchenOS via Brevo SMTP.</p>'
    )
    print('Email sent successfully!')
    print('Result:', result)
except Exception as e:
    print('Failed to send email:', e)
