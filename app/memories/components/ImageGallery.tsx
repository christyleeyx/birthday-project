"use client";

import { useCallback, useEffect, useState } from "react";

interface ImageGalleryProps {
  imageUrls: string[];
  title: string;
}

export default function ImageGallery({ imageUrls, title }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const selectedImageUrl =
    selectedIndex === null ? null : imageUrls[selectedIndex];
  const selectedImageNumber = selectedIndex === null ? null : selectedIndex + 1;

  const closeLightbox = useCallback(() => {
    setSelectedIndex(null);
  }, []);

  const showPreviousImage = useCallback(() => {
    setSelectedIndex((currentIndex) => {
      if (currentIndex === null) {
        return currentIndex;
      }

      return currentIndex === 0 ? imageUrls.length - 1 : currentIndex - 1;
    });
  }, [imageUrls.length]);

  const showNextImage = useCallback(() => {
    setSelectedIndex((currentIndex) => {
      if (currentIndex === null) {
        return currentIndex;
      }

      return currentIndex === imageUrls.length - 1 ? 0 : currentIndex + 1;
    });
  }, [imageUrls.length]);

  useEffect(() => {
    if (selectedIndex === null) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeLightbox();
      }

      if (event.key === "ArrowLeft") {
        showPreviousImage();
      }

      if (event.key === "ArrowRight") {
        showNextImage();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeLightbox, selectedIndex, showNextImage, showPreviousImage]);

  if (imageUrls.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-slate-700">
        {imageUrls.length === 1 ? "1 image" : `${imageUrls.length} images`}
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {imageUrls.map((imageUrl, index) => (
          <button
            key={imageUrl}
            type="button"
            onClick={() => setSelectedIndex(index)}
            className="group block overflow-hidden rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-offset-2"
          >
            {/* Public Supabase image URLs are not configured for next/image yet. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={title}
              className="aspect-square w-full object-cover transition group-hover:scale-105"
            />
          </button>
        ))}
      </div>

      {selectedImageUrl ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`${title} image preview`}
          onClick={closeLightbox}
        >
          <div
            className="flex max-h-full w-full max-w-5xl flex-col gap-4"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-white">
                {selectedImageNumber} of {imageUrls.length}
              </p>
              <button
                type="button"
                onClick={closeLightbox}
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-pink-200"
              >
                Close
              </button>
            </div>

            <div className="flex min-h-0 items-center gap-3">
              <button
                type="button"
                onClick={showPreviousImage}
                className="hidden rounded-full bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-pink-200 sm:inline-flex"
              >
                Prev
              </button>

              <div className="flex min-h-0 flex-1 justify-center">
                {/* Public Supabase image URLs are not configured for next/image yet. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedImageUrl}
                  alt={title}
                  className="max-h-[75vh] max-w-full rounded-xl object-contain"
                />
              </div>

              <button
                type="button"
                onClick={showNextImage}
                className="hidden rounded-full bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-pink-200 sm:inline-flex"
              >
                Next
              </button>
            </div>

            {imageUrls.length > 1 ? (
              <div className="flex justify-center gap-3 sm:hidden">
                <button
                  type="button"
                  onClick={showPreviousImage}
                  className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-pink-200"
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={showNextImage}
                  className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-pink-200"
                >
                  Next
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
