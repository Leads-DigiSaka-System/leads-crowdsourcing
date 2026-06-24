"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

/**
 * ImageUpload Component
 * A reusable component for uploading images with validation and preview
 *
 * @param {string} currentImage - Current image URL
 * @param {Function} onUpload - Callback function when upload is successful (receives File object)
 * @param {boolean} uploading - Upload loading state
 * @param {string} label - Label text for the upload button
 * @param {Object} validation - Validation options
 * @param {number} validation.minWidth - Minimum width in pixels
 * @param {number} validation.minHeight - Minimum height in pixels
 * @param {number} validation.maxWidth - Maximum width in pixels
 * @param {number} validation.maxHeight - Maximum height in pixels
 * @param {number} validation.maxSizeMB - Maximum file size in MB
 * @param {boolean} validation.enforceSquare - Enforce 1:1 aspect ratio
 * @param {string} helpText - Help text to display below the upload area
 */
export default function ImageUpload({
  currentImage = "",
  onUpload,
  uploading = false,
  label = "Upload Image",
  validation = {},
  helpText = "",
  previewClassName = "w-32 h-32",
}) {
  const fileInputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(currentImage);

  const validateImage = (file) => {
    return new Promise((resolve, reject) => {
      // Check if it's an image
      if (!file.type.startsWith("image/")) {
        reject("Please upload an image file");
        return;
      }

      // Check file size
      const maxSize = validation.maxSizeMB || 1;
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > maxSize) {
        reject(`Image must be less than ${maxSize}MB`);
        return;
      }

      // Check dimensions if validation is provided
      if (
        validation.minWidth ||
        validation.minHeight ||
        validation.maxWidth ||
        validation.maxHeight ||
        validation.enforceSquare
      ) {
        const img = new window.Image();
        img.onload = () => {
          const width = img.width;
          const height = img.height;

          if (validation.minWidth && width < validation.minWidth) {
            reject(`Image width must be at least ${validation.minWidth}px`);
            return;
          }

          if (validation.minHeight && height < validation.minHeight) {
            reject(`Image height must be at least ${validation.minHeight}px`);
            return;
          }

          if (validation.maxWidth && width > validation.maxWidth) {
            reject(`Image width must be at most ${validation.maxWidth}px`);
            return;
          }

          if (validation.maxHeight && height > validation.maxHeight) {
            reject(`Image height must be at most ${validation.maxHeight}px`);
            return;
          }

          if (validation.enforceSquare && width !== height) {
            reject("Image must be square (1:1 aspect ratio)");
            return;
          }

          resolve(file);
        };

        img.onerror = () => {
          reject("Failed to load image");
        };

        img.src = URL.createObjectURL(file);
      } else {
        resolve(file);
      }
    });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await validateImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      onUpload(file);
    } catch (error) {
      toast.error(error);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleClearImage = () => {
    setPreviewUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Update preview when currentImage prop changes
  if (currentImage !== previewUrl && currentImage) {
    setPreviewUrl(currentImage);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        {/* Preview */}
        {previewUrl && (
          <div
            className={`relative ${previewClassName} rounded-lg border-2 border-gray-200 overflow-hidden`}
          >
            <Image
              src={previewUrl}
              alt="Preview"
              fill
              className="object-cover"
              unoptimized
            />
            {!uploading && (
              <button
                type="button"
                onClick={handleClearImage}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                aria-label="Remove image"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* Upload Button */}
        <div className="flex-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
            id={`image-upload-${label.replace(/\s+/g, "-").toLowerCase()}`}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full sm:w-auto"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                {label}
              </>
            )}
          </Button>
          {helpText && (
            <p className="text-xs text-muted-foreground mt-2">{helpText}</p>
          )}
        </div>
      </div>
    </div>
  );
}
