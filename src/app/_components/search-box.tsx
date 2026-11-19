"use client";
import { useMemo, useState } from "react";

/**
 * Search at the top of the map panel, for an incident by its code or for a town.
 *
 * Picking an incident centres the map on it and opens it as if its dot had been clicked;
 * picking a town adds it to the town filter, the same as clicking its bar in the chart at
 * the bottom of the panel. Codes match on their number, so "91", "wp91" and "WP 91" all find
 * WP91. Incidents not yet geolocated are listed but can't be picked: they have no dot.
 */
type Result =
    | { kind: "entry"; key: string; pt: any; placed: boolean }
    | { kind: "town"; key: string; town: string; strikes: number };

const MAX_RESULTS = 7;

// case, accents, hyphens and apostrophes ignored, so "khiam" finds "Al Khiam"
const fold = (s: string) =>
    s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase()
        .replace(/[-'’]/g, " ").replace(/\s+/g, " ").trim();

const formatDate = (iso: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export default function SearchBox({ geoData, onPickEntry, onPickTown }: {
    geoData: any[];
    onPickEntry: (pt: any) => void;
    onPickTown: (town: string) => void;
}) {
    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(0);

    const towns = useMemo(() => {
        const byTown = new Map<string, number>();
        geoData.forEach((p) => {
            const t = (p.town ?? "").trim();
            if (t) byTown.set(t, (byTown.get(t) ?? 0) + (p.shell_count ?? 0));
        });
        return [...byTown].map(([town, strikes]) => ({ town, strikes, folded: fold(town) }));
    }, [geoData]);

    const results = useMemo<Result[]>(() => {
        const q = fold(query);
        if (!q) return [];
        const out: Result[] = [];
        const num = q.match(/^(?:wp ?)?(\d+)$/);
        if (num) {
            // numeric order puts the exact code first: it is the smallest with that prefix
            geoData
                .filter((p) => p.code.slice(2).startsWith(num[1]))
                .sort((a, b) => Number(a.code.slice(2)) - Number(b.code.slice(2)))
                .slice(0, MAX_RESULTS)
                .forEach((pt) => out.push({ kind: "entry", key: pt.code, pt, placed: pt.lat != null && pt.lon != null }));
        } else if (q.length >= 2) {
            // a name starting with the query first, then one with a word starting with it
            const rank = (t: { folded: string }) =>
                t.folded.startsWith(q) ? 0 : t.folded.split(" ").some((w) => w.startsWith(q)) ? 1 : 2;
            towns
                .filter((t) => t.folded.includes(q))
                .sort((a, b) => rank(a) - rank(b) || b.strikes - a.strikes)
                .slice(0, MAX_RESULTS)
                .forEach((t) => out.push({ kind: "town", key: t.town, town: t.town, strikes: t.strikes }));
        }
        return out;
    }, [query, geoData, towns]);

    const pick = (r: Result | undefined) => {
        if (!r || (r.kind === "entry" && !r.placed)) return;
        if (r.kind === "entry") onPickEntry(r.pt);
        else onPickTown(r.town);
        setQuery("");
        setOpen(false);
        (document.activeElement as HTMLElement | null)?.blur();
    };

    return (
        <div className="panel-search">
            <svg className="panel-search-icon" width="13" height="13" viewBox="0 0 16 16" aria-hidden>
                <circle cx="6.5" cy="6.5" r="5" fill="none" stroke="currentColor" strokeWidth="1.6" />
                <path d="M10.3 10.3 15 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <input
                className="panel-search-input"
                type="search"
                placeholder="Search by WP number or town"
                aria-label="Search by WP number or town"
                role="combobox"
                aria-expanded={open && !!query}
                aria-controls="panel-search-results"
                autoComplete="off"
                spellCheck={false}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setActive(0); setOpen(true); }}
                onFocus={() => setOpen(true)}
                onBlur={() => setOpen(false)}
                onKeyDown={(e) => {
                    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                        e.preventDefault();
                        if (!results.length) return;
                        const step = e.key === "ArrowDown" ? 1 : -1;
                        setActive((i) => (i + step + results.length) % results.length);
                    } else if (e.key === "Enter") {
                        e.preventDefault();
                        pick(results[active]);
                    } else if (e.key === "Escape") {
                        // kept from the map's own Esc, which would also let go of the open point
                        e.stopPropagation();
                        setQuery("");
                        setOpen(false);
                    }
                }}
            />
            {open && query.trim() && (
                <ul id="panel-search-results" className="panel-search-results" role="listbox"
                    // keeps focus in the input, so its blur doesn't close the list before the click lands
                    onMouseDown={(e) => e.preventDefault()}>
                    {results.length === 0 && (
                        <li className="panel-search-empty">No incident or town matches</li>
                    )}
                    {results.map((r, i) => {
                        const disabled = r.kind === "entry" && !r.placed;
                        return (
                            <li key={r.key}
                                role="option"
                                aria-selected={i === active}
                                aria-disabled={disabled}
                                className={`panel-search-result${i === active ? " is-active" : ""}${disabled ? " is-disabled" : ""}`}
                                onMouseEnter={() => setActive(i)}
                                onClick={() => pick(r)}>
                                {r.kind === "entry" ? (
                                    <>
                                        <span className="panel-search-name">{r.pt.code}</span>
                                        <span className="panel-search-meta">
                                            {disabled ? "not yet geolocated" : `${r.pt.town}, ${formatDate(r.pt.date)}`}
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <span className="panel-search-name">{r.town}</span>
                                        <span className="panel-search-meta">
                                            town · {r.strikes} strike{r.strikes === 1 ? "" : "s"}
                                        </span>
                                    </>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
