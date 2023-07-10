import * as AWS from 'aws-sdk';
import axios from 'axios';  // for downloading image from url, you might need to install this package

const s3 = new AWS.S3();

export async function storeImageInS3(imageUrl: string, conversationId: string) {
    if (!process.env.BUCKET_NAME) {
        throw new Error('BUCKET_NAME environment variable is not set');
      }
  const bucketName = process.env.BUCKET_NAME;
try {
  const response = await axios({
    url: imageUrl,
    method: 'GET',
    responseType: 'stream',
  });
  
  const params = {
    Bucket: bucketName,
    Key: `${conversationId}.jpg`,
    Body: response.data,
  };

  const uploadResult = await s3.upload(params).promise();

  console.log(`Image uploaded successfully at ${uploadResult.Location}`);
} catch (error) {
  console.error(`Failed to upload image to S3: ${error}`);
}
};
