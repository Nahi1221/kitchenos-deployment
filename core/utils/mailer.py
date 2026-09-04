import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from django.conf import settings
from django.utils import timezone
from core.models import AuditLog


def send_email(to, subject, html_content, from_email=None, user=None):
    if not from_email:
        from_email = getattr(settings, 'BREVO_FROM_EMAIL', 'noreply@kitchenos.app')

    host = getattr(settings, 'BREVO_SMTP_HOST', 'smtp-relay.brevo.com')
    port = int(getattr(settings, 'BREVO_SMTP_PORT', 587))
    username = getattr(settings, 'BREVO_SMTP_USER', '')
    password = getattr(settings, 'BREVO_SMTP_PASSWORD', '')

    if not username or not password:
        if user:
            AuditLog.objects.create(
                user=user,
                action='EMAIL',
                model_name='Email',
                object_id=to,
                details={'subject': subject, 'error': 'SMTP credentials not configured'},
            )
        raise ValueError('Brevo SMTP credentials are not configured.')

    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = from_email
    msg['To'] = to
    msg.attach(MIMEText(html_content, 'html', 'utf-8'))

    try:
        with smtplib.SMTP_SSL(host, port) as server:
            server.login(username, password)
            server.sendmail(from_email, [to], msg.as_string())
    except Exception as e:
        if user:
            AuditLog.objects.create(
                user=user,
                action='EMAIL',
                model_name='Email',
                object_id=to,
                details={'subject': subject, 'error': str(e)},
            )
        raise

    return {'status': 'sent', 'to': to, 'subject': subject, 'timestamp': timezone.now().isoformat()}


def send_tenant_approval_email(tenant_email, tenant_name, password, business_name, user=None):
    subject = 'Your KitchenOS Account Has Been Approved'
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Welcome to KitchenOS!</h2>
      <p>Hello <strong>{tenant_name}</strong>,</p>
      <p>Your account for <strong>{business_name}</strong> has been approved.</p>
      <p>You can log in with these credentials:</p>
      <ul>
        <li>Email: <strong>{tenant_email}</strong></li>
        <li>Password: <strong>{password}</strong></li>
      </ul>
      <p>Login here: <a href="http://localhost:5173/login">http://localhost:5173/login</a></p>
      <p style="color: #dc2626;">Please change your password after logging in.</p>
    </div>
    """
    return send_email(tenant_email, subject, html_content, user=user)


def send_tenant_rejection_email(tenant_email, tenant_name, business_name, reason=None, user=None):
    subject = 'Your KitchenOS Registration'
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">KitchenOS Registration Update</h2>
      <p>Hello <strong>{tenant_name}</strong>,</p>
      <p>Unfortunately, your registration for <strong>{business_name}</strong> has been rejected.</p>
      {f'<p>Reason: {reason}</p>' if reason else ''}
      <p>Please contact support if you have questions.</p>
    </div>
    """
    return send_email(tenant_email, subject, html_content, user=user)


def send_registration_confirmation_email(tenant_email, tenant_name, business_name, user=None):
    subject = 'KitchenOS Registration Received'
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Registration Received</h2>
      <p>Hello <strong>{tenant_name}</strong>,</p>
      <p>Your registration for <strong>{business_name}</strong> has been received and is pending admin approval.</p>
      <p>You will receive another email once your account is approved.</p>
    </div>
    """
    return send_email(tenant_email, subject, html_content, user=user)


def send_admin_new_registration_email(admin_email, tenant_name, tenant_email, business_name, plan_name, amount, user=None):
    subject = 'New KitchenOS Tenant Registration'
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">New Registration Pending Approval</h2>
      <p>A new tenant has registered and is waiting for approval.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 8px 0; font-weight: bold;">Business Name</td>
          <td style="padding: 8px 0;">{business_name}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 8px 0; font-weight: bold;">Owner Name</td>
          <td style="padding: 8px 0;">{tenant_name}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 8px 0; font-weight: bold;">Email</td>
          <td style="padding: 8px 0;">{tenant_email}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 8px 0; font-weight: bold;">Plan</td>
          <td style="padding: 8px 0;">{plan_name}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Amount</td>
          <td style="padding: 8px 0;">{amount} ETB</td>
        </tr>
      </table>
      <p><a href="http://localhost:5173/admin/approvals" style="background-color: #2563eb; color: #ffffff; padding: 10px 16px; text-decoration: none; border-radius: 6px;">Review Approval</a></p>
    </div>
    """
    return send_email(admin_email, subject, html_content, user=user)


def send_tenant_suspended_email(tenant_email, tenant_name, business_name, reason=None, user=None):
    subject = 'Your KitchenOS Account Has Been Suspended'
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc2626;">Account Suspended</h2>
      <p>Hello <strong>{tenant_name}</strong>,</p>
      <p>Your account for <strong>{business_name}</strong> has been suspended by the admin.</p>
      {f'<p>Reason: {reason}</p>' if reason else ''}
      <p>You will no longer be able to access your account until it is reactivated.</p>
      <p>Please contact support if you believe this is an error.</p>
    </div>
    """
    return send_email(tenant_email, subject, html_content, user=user)


def send_tenant_activated_email(tenant_email, tenant_name, business_name, user=None):
    subject = 'Your KitchenOS Account Has Been Reactivated'
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #16a34a;">Account Reactivated</h2>
      <p>Hello <strong>{tenant_name}</strong>,</p>
      <p>Your account for <strong>{business_name}</strong> has been reactivated.</p>
      <p>You can now log in to your account.</p>
      <p><a href="http://localhost:5173/login">Login to KitchenOS</a></p>
    </div>
    """
    return send_email(tenant_email, subject, html_content, user=user)
