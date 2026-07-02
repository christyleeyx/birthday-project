"use client";

import {
  ChangeEvent,
  ClipboardEvent,
  PointerEvent,
  useEffect,
  useRef,
  useState,
} from "react";

type BoardItem =
  | {
      id: string;
      type: "note";
      x: number;
      y: number;
      text: string;
      color: "pink" | "violet" | "cream";
    }
  | {
      id: string;
      type: "image";
      x: number;
      y: number;
      src: string;
      alt: string;
      width: number;
      height: number;
      aspectRatio: number;
      hasTransparency: boolean;
    };

const STORAGE_KEY = "mosaic-notice-board-items";

const defaultItems: BoardItem[] = [
  {
    id: "welcome-note",
    type: "note",
    x: 250,
    y: 40,
    text: "Collect moments, not things.",
    color: "pink",
  },
  {
    id: "today-note",
    type: "note",
    x: 40,
    y: 300,
    text: "Today\n- write the tiny details\n- save the funny bits\n- add the photos later",
    color: "cream",
  },
  {
    id: "beautiful-note",
    type: "note",
    x: 520,
    y: 300,
    text: "Make something beautiful.",
    color: "violet",
  },
];

const noteColorClasses = {
  pink: "bg-pink-200",
  violet: "bg-violet-200",
  cream: "bg-[#ead8b8]",
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function imageHasTransparency(image: HTMLImageElement) {
  const canvas = document.createElement("canvas");
  const sampleSize = 64;
  const scale = Math.min(1, sampleSize / image.naturalWidth);

  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));

  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    return false;
  }

  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;

  for (let index = 3; index < pixels.length; index += 4) {
    if (pixels[index] < 255) {
      return true;
    }
  }

  return false;
}

function createImageItemFromFile(
  file: File,
  index: number,
): Promise<BoardItem> {
  return new Promise<BoardItem>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const aspectRatio = image.naturalWidth / image.naturalHeight;
        const width = 180;

        resolve({
          id: crypto.randomUUID(),
          type: "image",
          x: 80 + index * 24,
          y: 70 + index * 24,
          src: String(reader.result),
          alt: file.name || "Pasted image",
          width,
          height: width / aspectRatio,
          aspectRatio,
          hasTransparency: imageHasTransparency(image),
        });
      };
      image.src = String(reader.result);
    };
    reader.onerror = () => {
      resolve({
        id: crypto.randomUUID(),
        type: "image",
        x: 80 + index * 24,
        y: 70 + index * 24,
        src: "",
        alt: file.name || "Pasted image",
        width: 180,
        height: 135,
        aspectRatio: 4 / 3,
        hasTransparency: false,
      });
    };
    reader.readAsDataURL(file);
  });
}

export default function InteractiveNoticeBoard() {
  const boardRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<{
    itemId: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const resizeStateRef = useRef<{
    itemId: string;
    startX: number;
    startWidth: number;
    aspectRatio: number;
  } | null>(null);

  const [items, setItems] = useState<BoardItem[]>(defaultItems);

  useEffect(() => {
    void Promise.resolve().then(() => {
      const savedItems = window.localStorage.getItem(STORAGE_KEY);

      if (!savedItems) {
        return;
      }

      try {
        setItems(JSON.parse(savedItems) as BoardItem[]);
      } catch {
        setItems(defaultItems);
      }
    });
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addNote = () => {
    const colors: BoardItem[] = [
      {
        id: crypto.randomUUID(),
        type: "note",
        x: 120,
        y: 120,
        text: "New note",
        color: "pink",
      },
      {
        id: crypto.randomUUID(),
        type: "note",
        x: 120,
        y: 120,
        text: "New note",
        color: "violet",
      },
      {
        id: crypto.randomUUID(),
        type: "note",
        x: 120,
        y: 120,
        text: "New note",
        color: "cream",
      },
    ];
    const noteCount = items.filter((item) => item.type === "note").length;

    setItems((currentItems) => [
      ...currentItems,
      {
        ...colors[noteCount % colors.length],
        x: 140 + noteCount * 18,
        y: 110 + noteCount * 18,
      },
    ]);
  };

  const addImages = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);

    if (files.length === 0) {
      return;
    }

    const imageItems = await Promise.all(
      files
        .filter((file) => file.type.startsWith("image/"))
        .map((file, index) => createImageItemFromFile(file, index)),
    );

    setItems((currentItems) => [...currentItems, ...imageItems]);
    event.target.value = "";
  };

  const pasteImages = async (event: ClipboardEvent<HTMLDivElement>) => {
    const files = Array.from(event.clipboardData.files).filter((file) =>
      file.type.startsWith("image/"),
    );

    if (files.length === 0) {
      return;
    }

    event.preventDefault();

    const imageItems = await Promise.all(
      files.map((file, index) => createImageItemFromFile(file, index)),
    );

    setItems((currentItems) => [...currentItems, ...imageItems]);
  };

  const removeItem = (itemId: string) => {
    setItems((currentItems) =>
      currentItems.filter((item) => item.id !== itemId),
    );
  };

  const updateNoteText = (itemId: string, text: string) => {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === itemId && item.type === "note" ? { ...item, text } : item,
      ),
    );
  };

  const startDrag = (
    event: PointerEvent<HTMLElement>,
    item: BoardItem,
  ) => {
    const board = boardRef.current;

    if (!board) {
      return;
    }

    const boardRect = board.getBoundingClientRect();
    dragStateRef.current = {
      itemId: item.id,
      offsetX: event.clientX - boardRect.left - item.x,
      offsetY: event.clientY - boardRect.top - item.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveDraggedItem = (event: PointerEvent<HTMLElement>) => {
    const board = boardRef.current;
    const dragState = dragStateRef.current;

    if (!board || !dragState) {
      return;
    }

    const boardRect = board.getBoundingClientRect();
    const nextX = clamp(
      event.clientX - boardRect.left - dragState.offsetX,
      0,
      boardRect.width - 170,
    );
    const nextY = clamp(
      event.clientY - boardRect.top - dragState.offsetY,
      0,
      boardRect.height - 170,
    );

    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === dragState.itemId ? { ...item, x: nextX, y: nextY } : item,
      ),
    );
  };

  const stopDrag = () => {
    dragStateRef.current = null;
  };

  const startResize = (event: PointerEvent<HTMLButtonElement>, item: BoardItem) => {
    if (item.type !== "image") {
      return;
    }

    event.stopPropagation();
    resizeStateRef.current = {
      itemId: item.id,
      startX: event.clientX,
      startWidth: item.width,
      aspectRatio: item.aspectRatio,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const resizeImage = (event: PointerEvent<HTMLButtonElement>) => {
    const resizeState = resizeStateRef.current;

    if (!resizeState) {
      return;
    }

    const nextWidth = clamp(
      resizeState.startWidth + event.clientX - resizeState.startX,
      90,
      420,
    );
    const nextHeight = nextWidth / resizeState.aspectRatio;

    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === resizeState.itemId && item.type === "image"
          ? { ...item, width: nextWidth, height: nextHeight }
          : item,
      ),
    );
  };

  const stopResize = () => {
    resizeStateRef.current = null;
  };

  return (
    <div className="relative min-h-[620px] rounded-[2rem] border border-amber-800/20 bg-[#b97938] p-4 shadow-2xl shadow-amber-950/20 sm:p-6">
      <div className="absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_1px_1px,rgba(80,45,18,0.22)_1px,transparent_0)] [background-size:12px_12px]" />
      <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-white/10 via-transparent to-amber-950/15" />

      <div className="relative z-10 mb-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={addNote}
          className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-pink-200"
        >
          Add note
        </button>
        <label className="cursor-pointer rounded-full bg-pink-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-pink-700 focus-within:ring-2 focus-within:ring-pink-200">
          Add images
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={addImages}
            className="sr-only"
          />
        </label>
        <p className="flex items-center text-xs font-medium text-white/80">
          Click the board, then paste an image.
        </p>
      </div>

      <div
        ref={boardRef}
        tabIndex={0}
        onPaste={pasteImages}
        className="relative h-[590px] overflow-hidden rounded-[1.5rem]"
        aria-label="Interactive notice board. Paste images here."
      >
        {items.map((item) =>
          item.type === "note" ? (
            <article
              key={item.id}
              style={{ left: item.x, top: item.y }}
              className={`absolute w-44 rotate-[-2deg] p-4 shadow-lg ${noteColorClasses[item.color]}`}
            >
              <div
                onPointerDown={(event) => startDrag(event, item)}
                onPointerMove={moveDraggedItem}
                onPointerUp={stopDrag}
                onPointerCancel={stopDrag}
                className="absolute -top-3 left-1/2 h-6 w-20 -translate-x-1/2 cursor-grab rotate-3 bg-amber-100/80 active:cursor-grabbing"
              />
              <textarea
                value={item.text}
                onChange={(event) => updateNoteText(item.id, event.target.value)}
                className="min-h-28 w-full resize-none bg-transparent font-serif text-xl leading-snug text-slate-900 outline-none"
                aria-label="Editable board note"
              />
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="mt-3 rounded-full border border-slate-900/10 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-white/50"
              >
                Remove
              </button>
            </article>
          ) : (
            <figure
              key={item.id}
              style={{
                left: item.x,
                top: item.y,
                width: item.width ?? 180,
              }}
              onPointerDown={(event) => startDrag(event, item)}
              onPointerMove={moveDraggedItem}
              onPointerUp={stopDrag}
              onPointerCancel={stopDrag}
              className="group absolute cursor-grab active:cursor-grabbing"
            >
              {/* User-added data URLs are local board previews. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.src}
                alt={item.alt}
                style={{ height: item.height ?? 135 }}
                className={`w-full rounded-xl object-contain shadow-xl ${
                  item.hasTransparency ? "" : "border-2 border-white"
                }`}
                draggable={false}
              />
              <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
                <button
                  type="button"
                  onPointerDown={(event) => startResize(event, item)}
                  onPointerMove={resizeImage}
                  onPointerUp={stopResize}
                  onPointerCancel={stopResize}
                  className="flex h-7 w-7 cursor-nwse-resize items-center justify-center rounded-full bg-white/95 text-xs font-bold text-slate-700 shadow-md transition hover:bg-white"
                  aria-label="Resize image"
                >
                  ↔
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    removeItem(item.id);
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-sm font-bold text-rose-700 shadow-md transition hover:bg-white"
                  aria-label="Remove image"
                >
                  x
                </button>
              </div>
            </figure>
          ),
        )}
      </div>
    </div>
  );
}
