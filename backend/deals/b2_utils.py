"""
deals/b2_utils.py
Backblaze B2 pre-signed URL helpers using boto3 (S3-compatible API).

Required settings / env vars:
    B2_KEY_ID          – Application Key ID
    B2_APPLICATION_KEY – Application Key (secret)
    B2_BUCKET_NAME     – Target bucket name
    B2_ENDPOINT_URL    – e.g. https://s3.eu-central-003.backblazeb2.com
    B2_REGION          – e.g. eu-central-003
    B2_PRESIGN_EXPIRY  – seconds (default 3600)
"""
import logging
import mimetypes
import uuid
from typing import Optional

from django.conf import settings

logger = logging.getLogger(__name__)


def get_b2_client():
    """Return a boto3 S3 client configured for Backblaze B2."""
    try:
        import boto3
        from botocore.config import Config
    except ImportError as exc:
        raise RuntimeError(
            "boto3 is required for B2 uploads. "
            "Install it: pip install boto3"
        ) from exc

    endpoint = getattr(settings, 'B2_ENDPOINT_URL', '').strip()
    key_id = getattr(settings, 'B2_KEY_ID', '').strip()
    app_key = getattr(settings, 'B2_APPLICATION_KEY', '').strip()
    region = getattr(settings, 'B2_REGION', 'us-west-002').strip()

    return boto3.client(
        's3',
        endpoint_url=endpoint,
        aws_access_key_id=key_id,
        aws_secret_access_key=app_key,
        region_name=region,
        config=Config(
            signature_version='s3v4',
            s3={'addressing_style': 'virtual'}
        ),
    )


def generate_presigned_upload_url(filename: str, project_id: str, content_type: str = None, expiry: int = 3600) -> dict:
    """
    Generate a pre-signed PUT URL for direct browser binary uploads.
    """
    bucket = getattr(settings, 'B2_BUCKET_NAME', '')
    safe_filename = filename.replace(' ', '_')
    file_key = f'pe_docs/{project_id}/{uuid.uuid4().hex}_{safe_filename}'
    
    # Use provided content_type or guess it
    if not content_type:
        content_type, _ = mimetypes.guess_type(filename)
    content_type = content_type or 'application/octet-stream'

    client = get_b2_client()
    try:
        url = client.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': bucket,
                'Key': file_key,
                'ContentType': content_type,
            },
            ExpiresIn=expiry,
        )
        return {
            'url': url,
            'file_key': file_key,
            'content_type': content_type,
        }
    except Exception as exc:
        logger.error("B2 presigned PUT error: %s", exc)
        raise


def generate_presigned_download_url(file_key: str, filename: Optional[str] = None, expiry: int = 3600) -> str:
    """
    Generate a pre-signed GET URL for reading a document from B2.
    """
    bucket = getattr(settings, 'B2_BUCKET_NAME', '')
    client = get_b2_client()
    
    params = {'Bucket': bucket, 'Key': file_key}
    if filename:
        params['ResponseContentDisposition'] = f'attachment; filename="{filename}"'

    try:
        return client.generate_presigned_url(
            ClientMethod='get_object',
            Params=params,
            ExpiresIn=int(expiry),
        )
    except Exception as exc:
        logger.error("B2 download presign error: %s", exc)
        raise


def delete_b2_object(file_key: str) -> None:
    """Permanently delete an object from B2."""
    bucket = getattr(settings, 'B2_BUCKET_NAME', '')
    client = get_b2_client()
    try:
        client.delete_object(Bucket=bucket, Key=file_key)
        logger.info("Deleted B2 object: %s", file_key)
    except Exception as exc:
        logger.error("B2 delete error for key %s: %s", file_key, exc)
        raise
