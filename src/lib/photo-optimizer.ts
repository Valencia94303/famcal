import sharp from "sharp";
import * as fs from "fs/promises";
import * as path from "path";

export interface OptimizationResult {
  success: boolean;
  originalSize: number;
  optimizedSize: number;
  savedBytes: number;
  savedPercent: number;
  originalPath?: string;
  error?: string;
}

export interface OptimizationStats {
  totalPhotos: number;
  optimizedPhotos: number;
  unoptimizedPhotos: number;
  totalOriginalSize: number;
  totalOptimizedSize: number;
  savedBytes: number;
  savedPercent: number;
}

// Configuration
const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1080;
const QUALITY = 85;
const ORIGINALS_FOLDER = ".originals";

/**
 * Optimize a single photo file
 * - Resizes to max 1920x1080 maintaining aspect ratio
 * - Converts to JPEG at 85% quality
 * - Archives original to .originals folder
 */
export async function optimizePhoto(filePath: string): Promise<OptimizationResult> {
  try {
    // Check if file exists
    const stats = await fs.stat(filePath);
    const originalSize = stats.size;

    // Read image metadata
    const metadata = await sharp(filePath).metadata();

    // Skip if already small enough and JPEG
    const isJpeg = metadata.format === "jpeg" || metadata.format === "jpg";
    const isSmallEnough =
      (metadata.width || 0) <= MAX_WIDTH &&
      (metadata.height || 0) <= MAX_HEIGHT;

    if (isJpeg && isSmallEnough && originalSize < 500 * 1024) {
      return {
        success: true,
        originalSize,
        optimizedSize: originalSize,
        savedBytes: 0,
        savedPercent: 0,
      };
    }

    // Create originals folder
    const dir = path.dirname(filePath);
    const originalsDir = path.join(dir, ORIGINALS_FOLDER);
    await fs.mkdir(originalsDir, { recursive: true });

    // Archive original
    const filename = path.basename(filePath);
    const originalPath = path.join(originalsDir, filename);
    await fs.copyFile(filePath, originalPath);

    // Optimize image
    const outputBuffer = await sharp(filePath)
      .resize(MAX_WIDTH, MAX_HEIGHT, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: QUALITY, mozjpeg: true })
      .toBuffer();

    // Write optimized file (convert extension to .jpg if needed)
    const ext = path.extname(filePath).toLowerCase();
    let outputPath = filePath;
    if (ext !== ".jpg" && ext !== ".jpeg") {
      outputPath = filePath.replace(/\.[^.]+$/, ".jpg");
      // Remove original file if we're changing extension
      await fs.unlink(filePath);
    }

    await fs.writeFile(outputPath, outputBuffer);

    const optimizedSize = outputBuffer.length;
    const savedBytes = originalSize - optimizedSize;
    const savedPercent = Math.round((savedBytes / originalSize) * 100);

    return {
      success: true,
      originalSize,
      optimizedSize,
      savedBytes,
      savedPercent,
      originalPath,
    };
  } catch (error) {
    return {
      success: false,
      originalSize: 0,
      optimizedSize: 0,
      savedBytes: 0,
      savedPercent: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get file size in bytes
 */
export async function getFileSize(filePath: string): Promise<number> {
  try {
    const stats = await fs.stat(filePath);
    return stats.size;
  } catch {
    return 0;
  }
}

/**
 * Check if a file is an image
 */
export function isImageFile(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return [".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp", ".tiff"].includes(ext);
}

/**
 * Get all image files in a directory
 */
export async function getImageFiles(dirPath: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const imageFiles: string[] = [];

    for (const entry of entries) {
      if (entry.isFile() && isImageFile(entry.name)) {
        imageFiles.push(path.join(dirPath, entry.name));
      }
    }

    return imageFiles;
  } catch {
    return [];
  }
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
