import os
import logging
import boto3
from botocore.exceptions import ClientError
from fastapi import HTTPException, status

logger = logging.getLogger(__name__)

AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
AWS_S3_BUCKET = os.getenv("AWS_S3_BUCKET")

def get_s3_client():
    # If keys are default mock values, we can't connect to real AWS.
    # We will raise a clean warning but instantiate the client.
    if not AWS_ACCESS_KEY_ID or AWS_ACCESS_KEY_ID == "mock_key_id":
        logger.warning("AWS credentials are set to mock values. S3 operations will fail until valid credentials are provided in .env.")
    
    try:
        s3 = boto3.client(
            "s3",
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
            region_name=AWS_REGION
        )
        return s3
    except Exception as e:
        logger.error(f"Failed to initialize S3 client: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"S3 integration error: {str(e)}"
        )

def upload_file_to_s3(local_file_path: str, s3_key: str) -> str:
    s3 = get_s3_client()
    try:
        # Check if bucket exists, if not, try to create it (only in dev/mock scenarios, or raise error)
        s3.upload_file(
            Filename=local_file_path,
            Bucket=AWS_S3_BUCKET,
            Key=s3_key
        )
        return s3_key
    except ClientError as e:
        logger.error(f"S3 upload client error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AWS S3 upload failed: {e.response['Error']['Message']}"
        )
    except Exception as e:
        logger.error(f"S3 upload unexpected error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AWS S3 upload failed: {str(e)}"
        )

def delete_file_from_s3(s3_key: str):
    s3 = get_s3_client()
    try:
        s3.delete_object(
            Bucket=AWS_S3_BUCKET,
            Key=s3_key
        )
    except ClientError as e:
        logger.error(f"S3 delete error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AWS S3 deletion failed: {e.response['Error']['Message']}"
        )

def generate_presigned_url(s3_key: str, expiration: int = 3600) -> str:
    s3 = get_s3_client()
    try:
        response = s3.generate_presigned_url(
            'get_object',
            Params={'Bucket': AWS_S3_BUCKET, 'Key': s3_key},
            ExpiresIn=expiration
        )
        return response
    except ClientError as e:
        logger.error(f"S3 presigned URL generation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"S3 URL generation failed: {e.response['Error']['Message']}"
        )
