import os
import uuid

from django.conf import settings
from django.core.files.storage import default_storage


def upload_image(file_obj, folder='uploads'):
    if getattr(settings, 'CLOUDINARY_URL', ''):
        import cloudinary.uploader
        result = cloudinary.uploader.upload(
            file_obj,
            folder=folder,
            resource_type='image',
        )
        return result.get('secure_url')
    else:
        ext = os.path.splitext(file_obj.name)[1] or '.jpg'
        filename = f"{uuid.uuid4().hex}{ext}"
        name = default_storage.save(f'{folder}/{filename}', file_obj)
        return f"{settings.MEDIA_URL}{name}"
