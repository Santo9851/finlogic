import os
from pathlib import Path
from dotenv import load_dotenv
import boto3
from botocore.config import Config

# Load environment variables
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / '.env')

def test_b2_connection():
    # Strip any potential hidden whitespace
    key_id = os.environ.get('B2_KEY_ID', '').strip()
    app_key = os.environ.get('B2_APPLICATION_KEY', '').strip()
    endpoint = os.environ.get('B2_ENDPOINT_URL', '').strip()
    region = os.environ.get('B2_REGION', 'us-west-002').strip()

    print(f"Testing connection to: {endpoint}")
    print(f"Using Key ID: {key_id}")

    client = boto3.client(
        's3',
        endpoint_url=endpoint,
        aws_access_key_id=key_id,
        aws_secret_access_key=app_key,
        region_name=region,
        config=Config(
            signature_version='s3v4',
            s3={'addressing_style': 'path'}
        ),
    )

    try:
        response = client.list_buckets()
        print("✅ Success! Your keys are working.")
        print("Buckets found:", [b['Name'] for b in response.get('Buckets', [])])
    except Exception as e:
        print(f"❌ Connection failed: {e}")

if __name__ == "__main__":
    test_b2_connection()
