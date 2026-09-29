import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';

@Injectable()
export class MinioSimpleService {
  private minioClient: Minio.Client;
  private bucketName: string;

  constructor(private configService: ConfigService) {
    this.bucketName = this.configService.get<string>('MINIO_BUCKET')!;
    
    this.minioClient = new Minio.Client({
      endPoint: this.configService.get<string>('MINIO_ENDPOINT')!,
      port: Number(this.configService.get<number>('MINIO_PORT')),
      useSSL: this.configService.get<string>('MINIO_USE_SSL') === 'true',
      accessKey: this.configService.get<string>('MINIO_ACCESS_KEY')!,
      secretKey: this.configService.get<string>('MINIO_SECRET_KEY')!,
    });

    this.initializeBucket();
  }

  private async initializeBucket() {
    try {
      const exists = await this.minioClient.bucketExists(this.bucketName);
      if (!exists) {
        await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
      }
    } catch (error) {
      console.error('MinIO Init Error:', (error as Error).message);
    }
  }

  async uploadMedia(file: Buffer, originalName: string, id: number, prefix: string): Promise<string> {
    const ext = originalName.split('.').pop() || 'jpg';
    const fileName = `${prefix}-${id}-${Date.now()}.${ext}`; // Генерация названия на латинице
    const contentType = prefix === 'image' ? 'image/jpeg' : 'video/mp4';

    await this.minioClient.putObject(
      this.bucketName,
      fileName,
      file,
      file.length,
      { 'Content-Type': contentType }
    );
    return fileName;
  }

  async getSignedUrl(fileName: string | null): Promise<string | null> {
    if (!fileName) return null;
    try {
      return await this.minioClient.presignedGetObject(this.bucketName, fileName, 7 * 24 * 60 * 60);
    } catch {
      return null;
    }
  }
}