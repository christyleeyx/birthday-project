// app/memories/_components/MemoryForm.tsx

"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { supabaseBrowserClient } from "../../supabase/client";
import { MemoryFormValues } from "../../supabase/utils/types";
import { validateAndCompressImage } from "../utils/imageCompression";
import {
  combineDateKeyWithCurrentTime,
  getLocalDateKey,
} from "../utils/memoryDates";
import { buildScrapbookParagraph } from "../utils/scrapbook";

interface MemoryFormProps {
  submitLabel?: string;
  onSuccess?: () => void;
  initialValues?: MemoryFormValues;
  memoryDate?: string;
}

export default function MemoryForm({
  submitLabel = "Save Memory",
  onSuccess,
  initialValues = { title: "", content: "" },
  memoryDate = getLocalDateKey(new Date()),
}: MemoryFormProps) {
  const [title, setTitle] = useState(initialValues.title);
  const [content, setContent] = useState(initialValues.content);
  const [memoryDateValue, setMemoryDateValue] = useState(memoryDate);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [imageCaptions, setImageCaptions] = useState<string[]>([]);

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
      setImageCaptions(new Array(compressedFiles.length).fill(""));
    } catch (imageError) {
      setError(
        imageError instanceof Error
          ? imageError.message
          : "Could not prepare images for upload.",
      );
    }
  };

  const handleCaptionChange = (index: number, value: string) => {
    setImageCaptions((current) => {
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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!title.trim() || !content.trim() || !memoryDateValue) {
      setError("A title, date, and content are required.");
      return;
    }

    setLoading(true);

    const { data: sessionData, error: sessionError } =
      await supabaseBrowserClient.auth.getSession();

    if (sessionError || !sessionData.session) {
      setLoading(false);
      setError("You must be signed in to save a memory.");
      return;
    }

    const userId = sessionData.session.user.id;
    const metadata = sessionData.session.user.user_metadata ?? {};
    const displayName =
      metadata.full_name ||
      metadata.name ||
      sessionData.session.user.email?.split("@")[0] ||
      "You";

    try {
      const imageUrls = await uploadImages(selectedImages, userId);
      const memoryTimestamp = combineDateKeyWithCurrentTime(memoryDateValue);
      const scrapbookContent = buildScrapbookParagraph(
        displayName,
        content.trim(),
        memoryTimestamp,
      );
      const trimmedCaptions = imageCaptions.map((caption) => caption.trim());
      const imageTimestamps = new Array(imageUrls.length).fill(memoryTimestamp);
      const insertPayload = {
        user_id: userId,
        title: title.trim(),
        content: scrapbookContent,
        memory_date: memoryDateValue,
        image_urls: imageUrls,
        image_captions: trimmedCaptions,
        image_timestamps: imageTimestamps,
      };

      const { error: insertError } = await supabaseBrowserClient
        .from("memories")
        .insert([insertPayload]);

      if (insertError) {
        if (
          insertError.message.includes("image_captions") &&
          insertError.message.includes("column")
        ) {
          const fallbackPayload = {
            user_id: userId,
            title: title.trim(),
            content: scrapbookContent,
            memory_date: memoryDateValue,
            image_urls: imageUrls,
          };

          const { error: fallbackError } = await supabaseBrowserClient
            .from("memories")
            .insert([fallbackPayload]);

          if (fallbackError) {
            setError(fallbackError.message);
            return;
          }
        } else {
          setError(insertError.message);
          return;
        }
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "An unexpected error occurred while saving the memory.",
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
          placeholder="Our first date at sunset..."
          className="mt-2 w-full rounded-xl border border-rose-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
          required
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-slate-700">Memory date</span>
        <input
          type="date"
          value={memoryDateValue}
          onChange={(event) => setMemoryDateValue(event.target.value)}
          className="mt-2 w-full rounded-xl border border-rose-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-slate-700">Memory note</span>
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Write the story of the moment..."
          rows={8}
          className="mt-2 w-full rounded-xl border border-rose-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
          required
        />
      </label>

      <div className="space-y-3">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Images</span>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            className="mt-2 w-full rounded-xl border border-rose-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition file:mr-4 file:rounded-full file:border-0 file:bg-pink-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-pink-700 hover:file:bg-pink-100 focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
          />
        </label>

        {previewUrls.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {previewUrls.map((previewUrl, index) => (
              <div key={previewUrl} className="rounded-2xl border border-rose-100 bg-rose-50/60 p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Selected memory preview"
                  className="aspect-square w-full rounded-xl object-cover"
                />
                <input
                  value={imageCaptions[index] ?? ""}
                  onChange={(event) => handleCaptionChange(index, event.target.value)}
                  placeholder={`Caption for image ${index + 1}`}
                  className="mt-3 w-full rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
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
        {loading ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
