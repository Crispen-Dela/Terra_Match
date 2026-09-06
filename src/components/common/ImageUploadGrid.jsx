import { useState, useRef } from "react";
import { cn } from "../../utils/cn";
import { processImageFiles } from "../../utils/imageUpload";

function UploadCloudIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("fill-none stroke-current", className)} aria-hidden="true">
      <path
        d="M7 18a4.5 4.5 0 01-1-8.9A5.5 5.5 0 0116.9 8H17a4 4 0 011 7.87"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12 12v7m0-7l-2.5 2.5M12 12l2.5 2.5" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrashIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("fill-none stroke-current", className)} aria-hidden="true">
      <path d="M4 6.5h16M9 6.5V4.8a1 1 0 011-1h4a1 1 0 011 1v1.7M6.5 6.5l.7 12.3a1.5 1.5 0 001.5 1.4h6.6a1.5 1.5 0 001.5-1.4l.7-12.3" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StarBadgeIcon({ className }) {
  return (
    <svg viewBox="0 0 20 20" className={cn("fill-current", className)} aria-hidden="true">
      <path d="M10 1.5l2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.1-5.4 3.1 1.3-6-4.6-4.1 6.1-.6z" />
    </svg>
  );
}

/**
 * Multi-image upload control with live previews, used by both Post a
 * Project, List Your Land, and ID verification. Images are compressed and
 * stored as persistent Base64 Data URLs so they save and display
 * reliably across page refreshes, backend syncs, and devices.
 *
 * `value` is an array of { id, file, url } or strings. Parent owns the state.
 */
export default function ImageUploadGrid({ value = [], onChange, maxImages = 8, label = "Photos" }) {
  const inputRef = useRef(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Normalize items in case value contains raw string URLs
  const normalizedItems = (value || []).map((item, idx) => {
    if (typeof item === "string") {
      return { id: `img-str-${idx}`, url: item };
    }
    return item;
  });

  async function handleFiles(fileList) {
    if (!fileList || fileList.length === 0) return;
    setIsProcessing(true);
    try {
      const next = await processImageFiles(fileList, {
        maxImages,
        existingCount: normalizedItems.length,
      });
      if (next.length > 0) {
        onChange([...normalizedItems, ...next]);
      }
    } catch (err) {
      console.error("Error uploading/processing photos:", err);
    } finally {
      setIsProcessing(false);
    }
  }

  function handleRemove(id) {
    onChange(normalizedItems.filter((img) => img.id !== id));
  }

  function handleDrop(e) {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-ink-900">{label}</label>
        <span className="text-xs text-ink-500">
          {value.length}/{maxImages}
        </span>
      </div>

      <div className="mt-2 grid grid-cols-3 gap-3 sm:grid-cols-4">
        {normalizedItems.map((img, i) => (
          <div
            key={img.id || i}
            className="group relative aspect-square overflow-hidden rounded-lg border border-ink-900/10 bg-mist-100"
          >
            <img src={img.url} alt="" className="h-full w-full object-cover" />
            {i === 0 && (
              <span className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-full bg-forest-600 px-2 py-0.5 text-[10px] font-bold text-white">
                <StarBadgeIcon className="h-2.5 w-2.5" />
                Cover
              </span>
            )}
            <button
              type="button"
              onClick={() => handleRemove(img.id)}
              aria-label="Remove photo"
              className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-ink-900/70 text-white opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
            >
              <TrashIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}

        {isProcessing && (
          <div className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-lg border border-forest-300 bg-forest-50/50 text-forest-700">
            <svg className="h-6 w-6 animate-spin text-forest-600" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <span className="text-[11px] font-medium">Processing...</span>
          </div>
        )}

        {!isProcessing && normalizedItems.length < maxImages && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-ink-900/15 bg-mist-50 text-ink-500 transition-colors hover:border-forest-400 hover:bg-forest-50/60 hover:text-forest-700"
          >
            <UploadCloudIcon className="h-6 w-6" />
            <span className="text-[11px] font-medium">Add photo</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      <p className="mt-2 text-xs text-ink-500">
        JPG or PNG, up to {maxImages} photos. The first photo is used as the cover image.
      </p>
    </div>
  );
}
