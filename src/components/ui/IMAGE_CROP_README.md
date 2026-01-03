# Image Crop Component

A circular image cropping component built with `react-image-crop` for profile avatar uploads.

## Features

- **Circular Crop**: Crops images in a perfect circle
- **Drag & Resize**: Intuitive drag-to-select and resize handles
- **Aspect Ratio Lock**: Maintains 1:1 aspect ratio for circular avatars
- **File Size Limit**: Configurable max file size (default 1.5MB)
- **Theme Support**: Styled for both light and dark themes
- **Preview Canvas**: Hidden canvas for generating the cropped image

## Components

### `ImageCrop`
Main wrapper component that handles the cropping logic.

**Props:**
- `file: File` - The image file to crop
- `aspect?: number` - Aspect ratio (default: 1 for square/circle)
- `circularCrop?: boolean` - Enable circular crop (default: false)
- `maxImageSize?: number` - Max file size in bytes (default: 1MB)
- `onCrop?: (croppedImage: string) => void` - Callback with base64 cropped image
- `onChange?: (crop: Crop) => void` - Callback when crop changes
- `onComplete?: (crop: PixelCrop) => void` - Callback when crop completes
- `children: React.ReactNode` - Child components

### `ImageCropContent`
Placeholder component for layout (optional).

**Props:**
- `className?: string` - Additional CSS classes

### `ImageCropApply`
Button to apply the crop and generate the final image.

### `ImageCropReset`
Button to reset the crop to default state.

## Usage Example

```tsx
import {
  ImageCrop,
  ImageCropApply,
  ImageCropContent,
  ImageCropReset,
} from './ui/image-crop';
import { Button } from './ui/button';
import { XIcon } from 'lucide-react';

function ProfileImageUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setCroppedImage(null);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setCroppedImage(null);
  };

  if (!selectedFile) {
    return (
      <input
        accept="image/*"
        onChange={handleFileChange}
        type="file"
      />
    );
  }

  if (croppedImage) {
    return (
      <div>
        <img
          alt="Cropped"
          src={croppedImage}
          className="rounded-full w-24 h-24"
        />
        <Button onClick={handleReset}>
          <XIcon className="size-4" />
        </Button>
      </div>
    );
  }

  return (
    <ImageCrop
      aspect={1}
      circularCrop
      file={selectedFile}
      maxImageSize={1.5 * 1024 * 1024}
      onCrop={setCroppedImage}
    >
      <ImageCropContent className="max-w-md" />
      <div className="flex items-center gap-2">
        <ImageCropApply />
        <ImageCropReset />
        <Button onClick={handleReset} variant="ghost">
          <XIcon className="size-4" />
        </Button>
      </div>
    </ImageCrop>
  );
}
```

## Styling

The component uses custom CSS classes defined in `globals.css`:
- `.ReactCrop` - Main container
- `.ReactCrop__crop-selection` - Selection overlay with purple border
- `.ReactCrop__drag-handle` - Corner/edge handles for resizing

Colors are theme-aware and match the purple accent color scheme.

## Implementation in ProfileContent

The image crop is integrated into the profile page avatar upload:
1. User clicks "Upload new" button
2. File picker opens and user selects an image
3. Crop interface appears with circular overlay
4. User drags and resizes to select desired area
5. User clicks "Apply" to crop
6. Cropped circular image is previewed
7. User saves profile to upload the avatar

## Dependencies

- `react-image-crop` - Core cropping library
- `react-image-crop/dist/ReactCrop.css` - Base styles

