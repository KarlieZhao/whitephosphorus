"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Viewer for the photos and videos the site hosts itself, opened from an incident's links.
 *
 * They used to sit on Flickr. Since November 2026 they are in the same S3 bucket as the
 * satellite tiles (folder `media/`, served through CloudFront), one file per media label
 * (wpNNN_mediaK.jpg or .mp4, with a still of each video at wpNNN_mediaK.poster.jpg). The files
 * carry no metadata: the build stripped EXIF, GPS and phone tags, so no filming position can
 * travel with them.
 *
 * Links to agencies and social media still open their own page in a new tab: those images
 * aren't the site's to republish.
 */
export const MEDIA_HOST = "https://d30kdnzbsfnn0n.cloudfront.net/media/";
export const isHostedMedia = (url: string) => url.startsWith(MEDIA_HOST);

export type ViewerItem = { label: string; url: string };

export default function MediaViewer({ items, start, onClose }: {
    items: ViewerItem[];
    start: number;
    onClose: () => void;
}) {
    const [index, setIndex] = useState(start);
    const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");
    const dialog = useRef<HTMLDialogElement>(null);
    const closeButton = useRef<HTMLButtonElement>(null);
    // kept in refs so the key handler is attached once, not again on every render
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;
    const countRef = useRef(items.length);
    countRef.current = items.length;

    const item = items[index];
    const isVideo = /\.mp4$/i.test(item.url);
    const step = (by: number) => setIndex((i) => (i + by + countRef.current) % countRef.current);

    useEffect(() => setStatus("loading"), [index]);

    useEffect(() => {
        const returnFocusTo = document.activeElement as HTMLElement | null;
        // a modal <dialog> sits in the browser's top layer, above the header and panels
        // whatever their z-index, and keeps the page behind it from taking focus or clicks
        if (!dialog.current?.open) dialog.current?.showModal();
        closeButton.current?.focus();
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                // stops here, so the map's own Esc doesn't also let go of the open incident
                e.stopPropagation();
                onCloseRef.current();
            } else if ((e.key === "ArrowRight" || e.key === "ArrowLeft") && countRef.current > 1) {
                // a focused video keeps its arrow keys for seeking
                if ((e.target as HTMLElement)?.tagName === "VIDEO") return;
                e.preventDefault();
                step(e.key === "ArrowRight" ? 1 : -1);
            }
        };
        // capture phase: runs before the map's listener on the same window
        window.addEventListener("keydown", onKey, true);
        return () => {
            window.removeEventListener("keydown", onKey, true);
            returnFocusTo?.focus?.();
        };
    }, []);

    // the next photo starts loading while this one is looked at
    useEffect(() => {
        if (items.length < 2) return;
        const next = items[(index + 1) % items.length];
        if (!/\.mp4$/i.test(next.url)) new Image().src = next.url;
    }, [index, items]);

    const stop = (e: React.MouseEvent) => e.stopPropagation();

    return (
        <dialog ref={dialog} className="media-viewer"
            aria-label={items.length > 1 ? `${item.label}, ${index + 1} of ${items.length}` : item.label}
            // Esc is handled above; this keeps the browser from closing the dialog on its own
            onCancel={(e) => e.preventDefault()}
            // a click on the dark surround closes it, as on the map
            onClick={() => onCloseRef.current()}>
            <div className="media-viewer-bar" onClick={stop}>
                <span className="media-viewer-title">{item.label}</span>
                {items.length > 1 && (
                    <span className="media-viewer-count">{index + 1} / {items.length}</span>
                )}
                <a className="media-viewer-open" href={item.url} target="_blank" rel="noopener noreferrer">
                    Open in new tab
                </a>
                <button ref={closeButton} className="media-viewer-close" onClick={() => onCloseRef.current()} aria-label="Close">
                    ×
                </button>
            </div>
            <div className="media-viewer-stage">
                {status === "failed" ? (
                    <div className="media-viewer-note" onClick={stop}>This file could not be loaded.</div>
                ) : isVideo ? (
                    <video key={item.url} src={item.url} poster={item.url.replace(/\.mp4$/i, ".poster.jpg")}
                        controls playsInline preload="metadata" onClick={stop}
                        onLoadedMetadata={() => setStatus("ready")} onError={() => setStatus("failed")} />
                ) : (
                    <>
                        {status === "loading" && <div className="media-viewer-note">Loading…</div>}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img key={item.url} src={item.url} alt={item.label} onClick={stop}
                            className={status === "ready" ? "" : "is-loading"}
                            onLoad={() => setStatus("ready")} onError={() => setStatus("failed")} />
                    </>
                )}
                {items.length > 1 && (
                    <>
                        <button className="media-viewer-nav media-viewer-prev" aria-label="Previous"
                            onClick={(e) => { stop(e); step(-1); }}>‹</button>
                        <button className="media-viewer-nav media-viewer-next" aria-label="Next"
                            onClick={(e) => { stop(e); step(1); }}>›</button>
                    </>
                )}
            </div>
        </dialog>
    );
}
