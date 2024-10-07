import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import S3 from 'aws-sdk/clients/s3';
import { nanoid } from 'nanoid';

@Injectable()
export class FileUploadService {
  private readonly s3: S3;
  private readonly bucketName: string;

  constructor(private readonly configService: ConfigService) {
    this.s3 = new S3({
      credentials: {
        accessKeyId: configService.get('AWS_ACCESS_KEY') as string,
        secretAccessKey: configService.get('AWS_SECRET_KEY') as string,
      },
      region: configService.get('AWS_REGION'),
    });
    this.bucketName = configService.get('AWS_BUCKET') as string;
  }

  uploadFile(file: Express.Multer.File) {
    const params: S3.PutObjectRequest = {
      Bucket: this.bucketName,
      Key: `${nanoid()}-${file.originalname}`,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    return this.s3.upload(params).promise();
  }

  uploadFiles(files: Express.Multer.File[]) {
    const uploadPromises = files.map((file) => this.uploadFile(file));

    return Promise.all(uploadPromises);
  }

  async deleteFile(fileKey: string) {
    const params: S3.DeleteObjectRequest = {
      Bucket: this.bucketName,
      Key: fileKey,
    };

    await this.s3.deleteObject(params).promise();
  }

  deleteFiles(fileKeys: string[]) {
    const promises = fileKeys.map((key) => this.deleteFile(key));

    return Promise.all(promises);
  }
}
