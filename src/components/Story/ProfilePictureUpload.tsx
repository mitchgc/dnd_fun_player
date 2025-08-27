import React, { useState, useRef } from 'react';
import { User, Upload, X, Crown } from 'lucide-react';

interface ProfilePictureUploadProps {
  currentImage?: string | null;
  onImageChange: (imageUrl: string | null) => void;
  characterName: string;
}

const ProfilePictureUpload: React.FC<ProfilePictureUploadProps> = ({ currentImage, onImageChange, characterName }) => {
  const [previewImage, setPreviewImage] = useState(currentImage);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        setPreviewImage(imageUrl);
        if (onImageChange) {
          onImageChange(imageUrl);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageChange(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleImageChange(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleRemoveImage = () => {
    setPreviewImage(null);
    if (onImageChange) {
      onImageChange(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const [showModal, setShowModal] = useState(false);

  const handleImageClick = (e: React.MouseEvent) => {
    if (previewImage) {
      e.stopPropagation();
      setShowModal(true);
    } else {
      handleClick();
    }
  };

  const handleRightClick = (e: React.MouseEvent) => {
    if (previewImage) {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <>
      <div className="flex flex-col items-center">
        <div
          className={`relative w-48 h-64 cursor-pointer transition-all duration-300 rounded-lg overflow-hidden border-2 ${
            isDragging
              ? 'border-green-400 bg-green-900/30'
              : previewImage
              ? 'border-gray-500 hover:border-gray-400 shadow-xl hover:shadow-2xl'
              : 'border-gray-600 hover:border-green-500 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900'
          }`}
          onClick={handleImageClick}
          onContextMenu={handleRightClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {previewImage ? (
            <>
              <img
                src={previewImage}
                alt={`${characterName} portrait`}
                className="w-full h-full object-cover"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveImage();
                }}
                className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 transition-colors duration-200 shadow-lg"
                title="Remove image"
              >
                <X size={16} />
              </button>
              <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 flex items-center justify-center transition-all duration-200 opacity-0 hover:opacity-100">
                <div className="text-center">
                  <div className="text-white drop-shadow-lg text-sm font-medium">Click to view</div>
                  <div className="text-xs text-gray-300 mt-1">Right-click to change</div>
                </div>
              </div>
              
              {/* Elegant overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-white">
              <div className="text-center">
                <div className="relative mb-4">
                  <Crown size={48} className="mx-auto text-yellow-400 drop-shadow-lg" />
                  <User size={36} className="mx-auto -mt-8 text-gray-300" />
                </div>
                <p className="text-sm font-bold text-yellow-400 mb-1">Upload Portrait</p>
                <p className="text-xs text-gray-400">Regal Character Art</p>
              </div>
            </div>
          )}
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        {!previewImage && (
          <div className="mt-4 text-center">
            <p className="text-gray-400 text-sm font-medium">
              Click or drag portrait to upload
            </p>
            <p className="text-gray-500 text-xs mt-1">
              Best with waist-up character art • PNG, JPG up to 5MB
            </p>
          </div>
        )}
      </div>

      {/* Modal for enlarged image view */}
      {showModal && previewImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
          onClick={() => setShowModal(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] p-4">
            <img
              src={previewImage}
              alt={`${characterName} portrait (enlarged)`}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            />
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-2 right-2 bg-black bg-opacity-60 hover:bg-opacity-80 text-white rounded-full p-2 transition-colors duration-200"
              title="Close"
            >
              <X size={24} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ProfilePictureUpload;