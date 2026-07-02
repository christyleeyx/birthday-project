"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { supabaseBrowserClient } from "../../supabase/client";
import { MemoryFormValues } from "../../supabase/utils/types";
import { validateAndCompressImage } from "../utils/imageCompression";
import { getMemoryImageStoragePath } from "../utils/storagePaths";

interface MemoryEditFormProps {
  memoryId: string;
  initialValues: MemoryFormValues;
  submitLabel?: string;
  onSuccess?: () => void;
}

export default function MemoryEditForm({
  memoryId,
  initialValues,
  submitLabel = "Save changes",
  onSuccess,
}: MemoryEditFormProps) {
  const [title, setTitle] = useState(initialValues.title);
  const [content, setContent] = useState(initialValues.content);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentImageUrls, setCurrentImageUrls] = useState<string[]>(
    initialValues.image_urls ?? [],
  );
  const [currentImageCaptions, setCurrentImageCaptions] = useState<string[]>(
    initialValues.image_captions ?? [],
  );
  const [currentImageTimestamps, setCurrentImageTimestamps] = useState<string[]>(
    initialValues.image_timestamps ?? [],
  );
  const [removedImageUrls, setRemovedImageUrls] = useState<string[]>([]);

  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [newImageCaptions, setNewImageCaptions] = useState<string[]>([]);
  const [newImageTimestamps, setNewImageTimestamps] = useState<string[]>([]);

  const handleRemoveExistingImage = (imageUrlToRemove: string) => {
    setCurrentImageUrls((imageUrls) => {
      const indexToRemove = imageUrls.findIndex((imageUrl) => imageUrl === imageUrlToRemove);

      if (indexToRemove >= 0) {
        setCurrentImageCaptions((captions) =>
          captions.filter((_, captionIndex) => captionIndex !== indexToRemove),
        );
        setCurrentImageTimestamps((timestamps) =>
          timestamps.filter((_, timestampIndex) => timestampIndex !== indexToRemove),
        );
      }

      return imageUrls.filter((imageUrl) => imageUrl !== imageUrlToRemove);
    });
    setRemovedImageUrls((imageUrls) => [...imageUrls, imageUrlToRemove]);
  };

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);

    if (files.length === 0) {
      return;
    }

    setError(null);

    try {
      const compressedFiles = await Promise.all(
        files.map((file) => validateAndCompressImage(file)),
      );

      setSelectedImages(compressedFiles);
      setPreviewUrls(compressedFiles.map((file) => URL.createObjectURL(file)));
      setNewImageCaptions(new Array(compressedFiles.length).fill(""));
      setNewImageTimestamps(new Array(compressedFiles.length).fill(new Date().toISOString()));
    } catch (imageError) {
      setError(
        imageError instanceof Error
          ? imageError.message
          : "Could not prepare images for upload.",
      );
    }
  };

  const handleExistingCaptionChange = (index: number, value: string) => {
    setCurrentImageCaptions((current) => {
      const next = [...current];
      next[index] = value;
      return next;
    });
  };

  const handleNewCaptionChange = (index: number, value: string) => {
    setNewImageCaptions((current) => {
      const next = [...current];
      next[index] = value;
      return next;
    });
  };

  const uploadImages = async (files: File[], userId: string) => {
    const uploadedUrls: string[] = [];

    for (const file of files) {
      const filePath = `${userId}/${crypto.randomUUID()}-${file.name}`;

      const { error: uploadError } = await supabaseBrowserClient.storage
        .from("memories")
        .upload(filePath, file);

      if (uploadError) {
        throw new Error(`Failed to upload image: ${uploadError.message}`);
      }

      const { data } = supabaseBrowserClient.storage
        .from("memories")
        .getPublicUrl(filePath);

      uploadedUrls.push(data.publicUrl);
    }

    return uploadedUrls;
  };

  const deleteImagesFromStorage = async (imageUrls: string[]) => {
    const storagePaths = imageUrls
      .map((imageUrl) => getMemoryImageStoragePath(imageUrl))
      .filter((storagePath): storagePath is string => Boolean(storagePath));

    if (storagePaths.length === 0) {
      return;
    }

    const { error: deleteImagesError } = await supabaseBrowserClient.storage
      .from("memories")
      .remove(storagePaths);

    if (deleteImagesError) {
      throw new Error(
        `Memory updated, but image cleanup failed: ${deleteImagesError.message}`,
      );
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!title.trim() || !content.trim()) {
      setError("Both a title and content are required.");
      return;
    }

    setLoading(true);

    const { data: sessionData, error: sessionError } =
      await supabaseBrowserClient.auth.getSession();

    if (sessionError || !sessionData.session) {
      setLoading(false);
      setError("You must be signed in to update a memory.");
      return;
    }

    const userId = sessionData.session.user.id;

    try {
      const newImageUrls = await uploadImages(selectedImages, userId);
      const imageUrls = [...currentImageUrls, ...newImageUrls];
      const normalizedExistingCaptions = currentImageUrls.map(
        (_, index) => currentImageCaptions[index]?.trim() ?? "",
      );
      const normalizedExistingTimestamps = currentImageUrls.map(
        (_, index) => currentImageTimestamps[index] ?? new Date().toISOString(),
      );
      const imageCaptions = [
        ...normalizedExistingCaptions,
        ...newImageCaptions.map((caption) => caption.trim()),
      ];
      const imageTimestamps = [
        ...normalizedExistingTimestamps,
        ...newImageTimestamps,
      ];

      const { error: updateError } = await supabaseBrowserClient
        .from("memories")
        .update({
          title: title.trim(),
          content: content.trim(),
          image_urls: imageUrls,
          image_captions: imageCaptions,
          image_timestamps: imageTimestamps,
        })
        .eq("id", memoryId)
        .eq("user_id", userId);

      if (updateError) {
        setError(updateError.message);
        return;
      }

      await deleteImagesFromStorage(removedImageUrls);

      if (onSuccess) {
        onSuccess();
      }
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not update this memory.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <label className="block">
        <span className="text-sm font-medium text-slate-700">Title</span>
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="A special day we won't forget"
          className="mt-2 w-full rounded-xl border border-rose-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
          required
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-slate-700">Memory</span>
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Update the details of your memory..."
          rows={8}
          className="mt-2 w-full rounded-xl border border-rose-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
          required
        />
      </label>

      {currentImageUrls.length > 0 ? (
        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-700">Current images</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {currentImageUrls.map((imageUrl, index) => (
              <div key={imageUrl} className="space-y-2">
                {/* Public Supabase image URLs are not configured for next/image yet. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt="Current memory image"
                  className="aspect-square w-full rounded-xl object-cover"
                />
                <input
                  value={currentImageCaptions[index] ?? ""}
                  onChange={(event) =>
                    handleExistingCaptionChange(index, event.target.value)
                  }
                  placeholder="Edit caption"
                  className="w-full rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveExistingImage(imageUrl)}
                  className="w-full rounded-full border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-rose-200 focus:ring-offset-2"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="space-y-3">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">
            Add images
          </span>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            className="mt-2 w-full rounded-xl border border-rose-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition file:mr-4 file:rounded-full file:border-0 file:bg-pink-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-pink-700 hover:file:bg-pink-100 focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
          />
        </label>

        {previewUrls.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {previewUrls.map((previewUrl, index) => (
              <div key={previewUrl} className="space-y-2">
                {/* Browser blob preview URLs are not useful for next/image optimization. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="New selected memory preview"
                  className="aspect-square w-full rounded-xl object-cover"
                />
                <input
                  value={newImageCaptions[index] ?? ""}
                  onChange={(event) =>
                    handleNewCaptionChange(index, event.target.value)
                  }
                  placeholder={`Caption ${index + 1}`}
                  className="w-full rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                />
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex h-12 items-center justify-center rounded-full bg-pink-600 px-6 text-sm font-semibold text-white transition hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
