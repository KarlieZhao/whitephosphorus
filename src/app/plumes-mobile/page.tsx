"use client";
/**
 * Prototype: the plume taxonomy on a phone. Not linked from anywhere and excluded from
 * the sitemap — `/plumes` is untouched and still desktop-only.
 *
 * The desktop page is a three-column row per plume: video, text, five stills. None of
 * that survives a 375px screen, so this is not a responsive rework of the same grid but
 * three different answers to the same question, switchable at the top so they can be
 * compared on a real device:
 *
 *   cards — the safe one. Each plume a full-width card, stills on a scroll strip.
 *   deck  — one plume per screen, swiped sideways. Comparing neighbours is a thumb flick.
 *   reel  — one plume per screen, scrolled vertically, video full-bleed behind the text.
 *
 * All three share the same reading of the content: the video is the evidence and has to
 * be big, the stills are corroboration and can be secondary.
 */
import { useEffect, useRef, useState } from "react";
import Header from "@/app/_components/header";
import "@/app/globals.css";

type Row = {
    name: string; name_ar: string;
    text: string; text_ar: string;
    video: string; filenames: string[]; links: string[];
};
type Layout = "cards" | "deck" | "reel";

const LAYOUTS: { id: Layout; label: string }[] = [
    { id: "cards", label: "Cards" },
    { id: "deck", label: "Deck" },
    { id: "reel", label: "Reel" },
];

const titleOf = (r: Row) =>
    r.name === "White Phosphorus" ? "White Phosphorus (WP)"
        : r.name === "Fighter Jets" ? "Fighter Jets & UAVs"
            : r.name;

/**
 * A phone will not play eight videos at once, and should not try: each one waits until it
 * is actually on screen, and stops when it leaves. playsInline is what keeps iOS from
 * taking the whole page fullscreen the moment one starts.
 */
function PlumeVideo({ row, fill }: { row: Row; fill?: boolean }) {
    const ref = useRef<HTMLVideoElement>(null);
    const box = useRef<HTMLDivElement>(null);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const el = box.current;
        if (!el) return;
        const io = new IntersectionObserver((entries) => {
            entries.forEach((e) => {
                const v = ref.current;
                if (!v) return;
                if (e.isIntersecting) v.play().catch(() => { });
                else { v.pause(); v.currentTime = 0; }
            });
        }, { threshold: 0.35 });
        io.observe(el);
        return () => io.disconnect();
    }, []);

    const poster = `/cloud_thumb/${row.name.replace(/ /g, "")}.jpg`;
    return (
        <div ref={box} className={fill ? "pm-fill" : "pm-square"}>
            <img src={poster} alt="" loading="lazy" className="pm-media" />
            <video
                ref={ref}
                className="pm-media"
                muted loop playsInline preload="none"
                onLoadedData={() => setReady(true)}
                onCanPlay={() => setReady(true)}
                style={{ opacity: ready ? 1 : 0 }}
            >
                <source src={row.video} type="video/mp4" />
            </video>
        </div>
    );
}

/** The stills, as a strip you push sideways rather than a grid that would crush them. */
function Stills({ row, onOpen }: { row: Row; onOpen: (src: string, link: string) => void }) {
    return (
        <div className="pm-strip">
            {row.filenames.map((src, i) => (
                <button key={i} className="pm-still" onClick={() => onOpen(src, row.links[i])}>
                    <img src={src} alt="" loading="lazy" />
                </button>
            ))}
        </div>
    );
}

export default function PlumesMobilePrototype() {
    const [rows, setRows] = useState<Row[] | null>(null);
    const [lang, setLang] = useState<"en" | "ar">("en");
    const [layout, setLayout] = useState<Layout>("cards");
    const [lightbox, setLightbox] = useState<{ src: string; link: string } | null>(null);
    const controls = useRef<HTMLDivElement>(null);

    /**
     * The reel's screens are "the viewport minus the controls", and the controls are not a
     * fixed height — they wrap differently with language and font loading. Guessing it in
     * CSS left each screen 54px too tall and pushed the stills off the bottom, so the real
     * height is measured and published as a custom property instead.
     */
    useEffect(() => {
        const el = controls.current;
        if (!el) return;
        const publish = () =>
            document.documentElement.style.setProperty("--pm-controls", `${el.offsetHeight}px`);
        publish();
        const ro = new ResizeObserver(publish);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    useEffect(() => {
        fetch("/data/plume.json").then((r) => r.json()).then(setRows).catch(() => setRows([]));
    }, []);

    const Text = ({ row }: { row: Row }) => (
        <div className={lang === "ar" ? "ar" : "en"}>
            <h3 className="pm-name">{lang === "ar" ? row.name_ar : titleOf(row)}</h3>
            <p className="pm-text">{lang === "ar" ? row.text_ar : row.text}</p>
        </div>
    );

    return (
        <div className="pm-page">
            <Header TypewriterFinished={false} />

            <div className="pm-controls" ref={controls}>
                <div className="pm-switch">
                    {LAYOUTS.map((l) => (
                        <button
                            key={l.id}
                            className={layout === l.id ? "pm-tab pm-tab-on" : "pm-tab"}
                            onClick={() => setLayout(l.id)}
                        >{l.label}</button>
                    ))}
                </div>
                <div className="pm-lang">
                    <span className={lang === "en" ? "pm-on" : ""} onClick={() => setLang("en")}>English</span>
                    <span className="pm-sep">/</span>
                    <span className={lang === "ar" ? "pm-on" : ""} onClick={() => setLang("ar")}>العربية</span>
                </div>
            </div>

            {!rows && <div className="pm-loading">Loading…</div>}

            {rows && layout === "cards" && (
                <div className="pm-cards">
                    {rows.map((row, i) => (
                        <section key={i} className="pm-card">
                            <PlumeVideo row={row} />
                            <div className="pm-body">
                                <Text row={row} />
                                <Stills row={row} onOpen={(src, link) => setLightbox({ src, link })} />
                            </div>
                        </section>
                    ))}
                </div>
            )}

            {rows && layout === "deck" && (
                <div className="pm-deck">
                    {rows.map((row, i) => (
                        <section key={i} className="pm-panel">
                            <div className="pm-count">{i + 1} / {rows.length}</div>
                            <PlumeVideo row={row} />
                            <div className="pm-body">
                                <Text row={row} />
                                <Stills row={row} onOpen={(src, link) => setLightbox({ src, link })} />
                            </div>
                        </section>
                    ))}
                </div>
            )}

            {rows && layout === "reel" && (
                <div className="pm-reel">
                    {rows.map((row, i) => (
                        <section key={i} className="pm-screen">
                            <PlumeVideo row={row} fill />
                            <div className="pm-scrim">
                                <Text row={row} />
                                <Stills row={row} onOpen={(src, link) => setLightbox({ src, link })} />
                            </div>
                        </section>
                    ))}
                </div>
            )}

            {lightbox && (
                <div className="pm-lightbox" onClick={() => setLightbox(null)}>
                    <img src={lightbox.src} alt="" />
                    <a href={lightbox.link} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                        View source
                    </a>
                    <button className="pm-close" onClick={() => setLightbox(null)}>close ✕</button>
                </div>
            )}

            <style jsx global>{`
        .pm-page { background: #000; color: #eee; min-height: 100vh; }

        /* the mobile header is fixed, so everything below it starts clear of it */
        .pm-controls { position: sticky; top: 0; z-index: 40; background: #000;
          padding: 4.6rem 0.9rem 0.6rem; display: flex; align-items: center;
          justify-content: space-between; gap: 0.6rem; }
        .pm-switch { display: flex; gap: 0.3rem; }
        .pm-tab { font-size: 0.72rem; letter-spacing: 1px; text-transform: uppercase;
          padding: 0.3rem 0.6rem; border: 1px solid #ffffff22; color: #bbb; background: none; }
        .pm-tab-on { background: #8a2a15; border-color: #c4472a; color: #fff; }
        .pm-lang { font-size: 0.72rem; color: #888; }
        .pm-lang .pm-on { color: #fff; text-decoration: underline; }
        .pm-sep { margin: 0 0.3rem; }
        .pm-loading { padding: 2rem 1rem; color: #888; }

        /* the video box: square in the stacked layouts, full-bleed in the reel */
        .pm-square { position: relative; width: 100%; aspect-ratio: 1 / 1; background: #0a0a0a; }
        .pm-fill { position: absolute; inset: 0; background: #0a0a0a; }
        .pm-media { position: absolute; inset: 0; width: 100%; height: 100%;
          object-fit: cover; transition: opacity 0.3s ease; }

        .pm-name { font-size: 1rem; font-weight: 700; margin-bottom: 0.4rem; color: #fff; }
        .pm-text { font-size: 0.86rem; line-height: 1.45; color: #cfcfcf; }

        /* stills: a strip you push sideways, so five of them never get crushed to specks */
        .pm-strip { display: flex; gap: 0.4rem; overflow-x: auto; margin-top: 0.7rem;
          padding-bottom: 0.2rem; -webkit-overflow-scrolling: touch; }
        .pm-strip::-webkit-scrollbar { display: none; }
        .pm-still { flex: 0 0 auto; width: 74px; height: 56px; padding: 0; border: 0;
          background: none; cursor: pointer; }
        .pm-still img { width: 100%; height: 100%; object-fit: cover; display: block; }

        .pm-cards { padding: 0 0 5rem; }
        .pm-card { margin-bottom: 1.6rem; }
        .pm-body { padding: 0.8rem 0.9rem 0; }

        /* deck: one plume per screen, swiped sideways */
        .pm-deck { display: flex; overflow-x: auto; scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch; padding-bottom: 3rem; }
        .pm-deck::-webkit-scrollbar { display: none; }
        /* min-width:0 matters: a flex item defaults to min-width:auto, so the stills
           strip's own content was pushing each panel out to 424px on a 375px screen and
           dragging the text off the edge with it */
        .pm-panel { flex: 0 0 100vw; min-width: 0; scroll-snap-align: start;
          padding: 0 0 1rem; }
        .pm-count { font-size: 0.68rem; letter-spacing: 1.5px; color: #777;
          padding: 0 0.9rem 0.4rem; }

        /* reel: one plume per screen, scrolled vertically, text over the footage */
        .pm-reel { height: calc(100dvh - var(--pm-controls, 7rem)); overflow-y: auto;
          scroll-snap-type: y mandatory; -webkit-overflow-scrolling: touch; }
        .pm-reel::-webkit-scrollbar { display: none; }
        .pm-screen { position: relative; height: calc(100dvh - var(--pm-controls, 7rem));
          scroll-snap-align: start; overflow: hidden; }
        .pm-scrim { position: absolute; left: 0; right: 0; bottom: 0; padding: 3rem 0.9rem 1.4rem;
          background: linear-gradient(to top, rgba(0,0,0,0.92) 55%, rgba(0,0,0,0)); }

        .pm-lightbox { position: fixed; inset: 0; z-index: 60; background: rgba(0,0,0,0.94);
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 0.9rem; padding: 1rem; }
        .pm-lightbox img { max-width: 100%; max-height: 72vh; object-fit: contain; }
        .pm-lightbox a { color: #fff; font-size: 0.8rem; text-decoration: underline; }
        .pm-close { background: none; border: 1px solid #ffffff33; color: #ccc;
          font-size: 0.72rem; padding: 0.35rem 0.8rem; }
      `}</style>
        </div>
    );
}
