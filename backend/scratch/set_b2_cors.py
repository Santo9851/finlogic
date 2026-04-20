import os
from pathlib import Path
from dotenv import load_dotenv
import boto3
from botocore.config import Config

# Load environment variables
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / '.env')

def set_b2_cors():
    bucket_name = os.environ.get('B2_BUCKET_NAME', '').strip()
    client = boto3.client(
        's3',
        endpoint_url=os.environ.get('B2_ENDPOINT_URL', '').strip(),
        aws_access_key_id=os.environ.get('B2_KEY_ID', '').strip(),
        aws_secret_access_key=os.environ.get('B2_APPLICATION_KEY', '').strip(),
        region_name=os.environ.get('B2_REGION', 'us-west-002').strip(),
        config=Config(signature_version='s3v4'),
    )

    cors_configuration = {
        'CORSRules': [
            {
                'AllowedHeaders': ['*'],
                'AllowedMethods': ['GET', 'POST', 'PUT', 'HEAD'],
                'AllowedOrigins': ['http://localhost:3000', 'http://127.0.0.1:3000'],
                'ExposeHeaders': ['ETag', 'x-amz-request-id', 'x-amz-id-2'],
                'MaxAgeSeconds': 3600
            }
        ]
    }

    print(f"Applying CORS to bucket: {bucket_name}...")
    try:
        client.put_bucket_cors(Bucket=bucket_name, CORSConfiguration=cors_configuration)
        print("CORS rules applied successfully via S3 API!")
    except Exception as e:
        print(f"Failed to apply CORS: {e}")

if __name__ == "__main__":
    set_b2_cors()
