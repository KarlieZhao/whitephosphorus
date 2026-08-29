import * as d3 from "d3";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { VectorMap, type BasemapId } from "./map";
import { Histogram } from "./histo";
import Timeline from "./timeline";
import Area from "./area";
import { TypewriterProps } from "./header";
import SatelliteMap from "./satellite-map";
import LandscapeHisto from "./histo_landscape";
import LandscapeBar from "./landscape-bar";
import { isMobileDevice } from "./mobile-detector";

// export const RED_GRADIENT = ["#db2f0f", "#C03117", "#A5331E", "#8A3525", "#6E362C", "#7C3629", "#6E362C"]
// export const RED_GRADIENT = ["#cfcfcf", "#aaa", "#909090", "#858585", "#777", "#666", "#606060"]

export const MONTHS = ["2023-10", "2023-11", "2023-12", "2024-01", "2024-02", "2024-03", "2024-04", "2024-05", "2024-06",
    "2024-07", "2024-08", "2024-09", "2024-10", "2024-11", "2024-12", "2025-01", "2025-02", "2025-03", "2025-04", "2025-05",
    "2025-06", "2025-07", "2025-08", "2025-09", "2025-10", "2025-11", "2025-12", "2026-01", "2026-02", "2026-03", "2026-04", "2026-05"];
export const MONTHS_CONVERT = ["2023-9", "2023-10", "2023-11", "2024-0", "2024-1", "2024-2", "2024-3", "2024-4", "2024-5", "2024-6",
    "2024-7", "2024-8", "2024-9", "2024-10", "2024-11", "2025-0", "2025-1", "2025-2", "2025-3", "2025-4",
    "2025-5", "2025-6", "2025-7", "2025-8", "2025-9", "2025-10", "2025-11", "2026-0", "2026-1", "2026-2", "2026-3", "2026-4"];
const MONTHS_PRINT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// module scope, not a component const: the activeFilters memo labels the month chip during
// render, which ran before a component-level const could initialise and threw on every
// month click
const monthParser = (input: string) => {
    const [year, month] = input.split("-")
    return MONTHS_PRINT[parseInt(month) - 1] + " " + year;
}

const TOTAL_STRIKES_BY_YEAR: { [year: string]: number } = {
    "2023": 119,
    "2024": 133,
    "2025": 1,
    "2026": 35,
}
// derived rather than written out, so the "out of N total strikes" readouts below can
// never drift from the year table the way a hard-coded total did
const TOTAL_STRIKES = Object.values(TOTAL_STRIKES_BY_YEAR).reduce((a, b) => a + b, 0);
const PENDING_GEOLOCATION_BY_YEAR: { [year: string]: number } = {
    "2023": 8,
    "2024": 21,
    "2025": 0,
    "2026": 6,
}
// verified but not-yet-geolocated incidents, used to compute pending counts for arbitrary date ranges
// (per-year sums here match TOTAL_STRIKES_BY_YEAR / PENDING_GEOLOCATION_BY_YEAR above)
export const PENDING_INCIDENTS: { date: string; bursts: number }[] = [
    { date: "2023-10-15", bursts: 2 }, // WP10
    { date: "2023-10-15", bursts: 2 }, // WP11
    { date: "2023-10-17", bursts: 1 }, // WP427
    { date: "2023-12-08", bursts: 3 }, // WP48
    { date: "2024-01-21", bursts: 6 }, // WP59
    { date: "2024-03-17", bursts: 3 }, // WP69
    { date: "2024-04-17", bursts: 2 }, // WP71
    { date: "2024-06-04", bursts: 1 }, // WP79
    { date: "2024-06-23", bursts: 1 }, // WP145
    { date: "2024-07-05", bursts: 1 }, // WP440
    { date: "2024-07-13", bursts: 1 }, // WP87
    { date: "2024-07-29", bursts: 1 }, // WP88
    { date: "2024-09-19", bursts: 3 }, // WP500
    { date: "2024-09-30", bursts: 2 }, // WP96
    { date: "2026-03-03", bursts: 1 }, // WP419
    { date: "2026-04-14", bursts: 1 }, // WP416
    { date: "2026-04-30", bursts: 2 }, // WP428
    { date: "2026-05-09", bursts: 2 }, // WP435
];
const DISCORD_INVITE_URL = "https://discord.gg/YxZNEKWfQT";
// 6 decimal places is ~0.11m at this latitude — well beyond the accuracy any of these
// geolocations actually carry, so longer stored values just add visual noise. Number()
// drops trailing zeros so shorter coordinates aren't padded with false precision.
const trimCoord = (n: number) => (typeof n === "number" && !isNaN(n) ? Number(n.toFixed(6)) : n);
const geoSource: { [key: string]: String } = {
    "AB": "Ahmad Baydoun",
    "AN": "X: AnnoNemo",
    "AUB": "American University of Beirut",
    "GS": "Green Southerners",
    "AS": "Alex Spoerndli",
    "MM": "Maria Molijn",
    "HRW": "Human Rights Watch"
}
export const RED_GRADIENT = d3.quantize(d3.interpolateRgb("#db2f0f", "#2e1f1f"), 8);
export const width = 350;
export type geoDataProps = {
    geoData: any[];
    selectedCity?: string[];
    selectedDay?: number;
    selectedDates?: [string, string];
    selectedAreaType?: string[];
    selectedMonth?: number | null;
    selectedYear?: string | null;
    onBarClick?: (data: [string, number] | null) => void;
    onMonthClick?: (data: [string, number] | null) => void;
    onSegmentClick?: (data: number | null) => void;
    onTimelineDragged?: (data: [string, string] | null) => void;
    onAreaTypeClicked?: (data: string | null) => void;
};
interface landscape_mapping_prop {
    resident: string;
    bare: string;
    agri: string
}

/**
 * `basemap` is passed straight through to the map; the live map uses OpenFreeMap.
 *
 * `combineFilters` is on by default: filters intersect, several landscapes and towns can
 * be held at once, and chips show what is selected. Setting it false restores the older
 * behaviour where picking one filter cleared the rest — kept only as an escape hatch, so
 * the `!combineFilters` branches below are no longer reached by any page.
 */
export default function DataSource({
    TypewriterFinished = false,
    basemap = "openfreemap",
    combineFilters = true,
}: TypewriterProps & { basemap?: BasemapId; combineFilters?: boolean }) {
    const [geoData, setGeoData] = useState<any[]>([]);
    /**
     * Landscape and city hold several values at once; a point matches if it is in any of
     * them, so "residential OR agricultural" narrows by kind while still crossing with the
     * year. Year stays single — two years is what the date range is for.
     */
    const [selectedCity, setSelectedCity] = useState<string[]>([]);
    const [selectedDay, setselectedDay] = useState<number>(-1);
    const [selectedAreaType, setSelectedAreaType] = useState<string[]>([]);
    const [selectedDates, setSelectedDates] = useState<[string, string]>(["", ""]);
    const [selectedMonth, setSelectedMonth] = useState<number | null>(null)
    const [selectedYear, setSelectedYear] = useState<string | null>(null)

    const [showSatelliteMap, setShowSatelliteMap] = useState<boolean>(false);
    const [details, updateDetails] = useState<any[]>([]);
    /**
     * The summary a filter produces ("35 strikes happened in 2026…"), kept apart from the
     * per-incident readout so that hovering a point does not wipe out the context of what
     * is being looked at. Rendered above the incident detail rather than replacing it.
     */
    const [filterReadout, setFilterReadout] = useState<any[]>([]);
    const [showPanels, setShowPanels] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        setIsMobile(isMobileDevice());
    }, []);

    const [mapZoom, setMapZoom] = useState(11.2);
    const [leafletCenter, setLeafletCenter] = useState<[number, number]>([35.57, 33.2]);
    const [mapInstance, setMapInstance] = useState<any | null>(null);

    // on mobile the readout panel can cover the whole tappable map area, leaving no
    // background to tap for the usual reset — bumping this tells VectorMap to clear its
    // internal focus state alongside clearing the readout here
    const [clearSelectionSignal, setClearSelectionSignal] = useState(0);


    const landscape_map: landscape_mapping_prop = {
        "resident": "residential",
        "agri": "agricultural",
        "bare": "forested/open terrain"
    }

    /**
     * Every landscape ticked excludes nothing a reader would expect it to, so it filters as
     * if none were ticked. Without this, ticking all three quietly dropped the verified but
     * not-yet-geolocated incidents — they carry a town and a date but no landscape, so they
     * match no category — and the counts fell without anything on screen saying why. The
     * chips stay lit: this changes what is matched, not what is selected.
     */
    const ALL_LANDSCAPES = Object.keys(landscape_map).length;
    // memoised: it feeds useMemo/useEffect dependency lists, and a fresh array every render
    // would make them all recompute on every render
    const effectiveAreaType = useMemo(
        () => (selectedAreaType.length === ALL_LANDSCAPES ? [] : selectedAreaType),
        [selectedAreaType, ALL_LANDSCAPES]);

    const controlEnabledTimeout = 500;

    const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

    /**
     * What the user currently has selected, in the order the panel presents it. Drives the
     * chips, the count and the clear-all button. Each entry knows how to remove itself, so
     * a chip's × is the same action as clicking that control off.
     */
    const activeFilters = useMemo(() => {
        const f: { key: string; label: string; clear: () => void }[] = [];
        if (selectedYear) f.push({ key: "year", label: selectedYear, clear: () => setSelectedYear(null) });
        if (selectedMonth != null && MONTHS[selectedMonth])
            f.push({ key: "month", label: monthParser(MONTHS[selectedMonth]), clear: () => setSelectedMonth(null) });
        if (selectedDates[0] && selectedDates[1])
            f.push({ key: "dates", label: `${selectedDates[0]} – ${selectedDates[1]}`, clear: () => setSelectedDates(["", ""]) });
        selectedAreaType.forEach((a) =>
            f.push({
                key: `area:${a}`,
                label: (landscape_map as unknown as Record<string, string>)[a] ?? a,
                clear: () => setSelectedAreaType((prev) => prev.filter((x) => x !== a)),
            }));
        selectedCity.forEach((c) =>
            f.push({ key: `city:${c}`, label: c, clear: () => setSelectedCity((prev) => prev.filter((x) => x !== c)) }));
        if (selectedDay !== -1)
            f.push({ key: "day", label: `${DAY_NAMES[selectedDay]}s`, clear: () => setselectedDay(-1) });
        return f;
    }, [selectedYear, selectedMonth, selectedDates, selectedAreaType, selectedCity, selectedDay]);

    /**
     * The chips that actually narrow the data. All three landscapes ticked is a live
     * selection with chips on screen, but it matches everything, so it must not be picked
     * as the dimension a summary describes — that produced a readout built from an empty
     * landscape list, which then read as an empty date range ("Between Invalid Date…").
     */
    const narrowingFilters = useMemo(
        () => activeFilters.filter((f: { key: string }) =>
            f.key.split(":")[0] !== "area" || effectiveAreaType.length > 0),
        [activeFilters, effectiveAreaType]);

    /** the same intersection the map draws, so the chip count always matches the dots */
    const filteredStrikes = useMemo(() => {
        const pts = geoData.filter((p: any) => {
            if (selectedCity.length && !selectedCity.includes(p.town)) return false;
            if (effectiveAreaType.length && !effectiveAreaType.includes(p.landscape)) return false;
            if (selectedYear && p.date.slice(0, 4) !== selectedYear) return false;
            if (selectedMonth != null && p.date.slice(0, 7) !== MONTHS[selectedMonth]) return false;
            if (selectedDates[0] && selectedDates[1] && !(p.date >= selectedDates[0] && p.date <= selectedDates[1])) return false;
            if (selectedDay !== -1 && (new Date(p.date).getDay() + 6) % 7 !== selectedDay) return false;
            return true;
        });
        return { count: pts.reduce((n: number, p: any) => n + Math.max(1, p.shell_count ?? 1), 0), pts };
    }, [geoData, selectedCity, effectiveAreaType, selectedYear, selectedMonth, selectedDates, selectedDay]);

    /**
     * Chips sit on one line and scroll sideways instead of wrapping, so the box keeps a
     * constant height however many filters are on. The fade at the right edge is the only
     * hint that more are off-screen, so it is switched on only when there actually are.
     */
    const chipsRef = useRef<HTMLDivElement | null>(null);
    const [chipsOverflow, setChipsOverflow] = useState(false);
    useEffect(() => {
        const el = chipsRef.current;
        if (!el) return;
        setChipsOverflow(el.scrollWidth > el.clientWidth + 1);
    }, [activeFilters]);

    /** which dimension the user touched last, so the summary describes that one */
    const [lastFilterKey, setLastFilterKey] = useState<string | null>(null);

    /**
     * The filter summary is regenerated from state rather than written by the click
     * handler that caused it. A handler runs before its own setState lands, so any summary
     * it writes describes the filters as they were a moment ago — which is how removing a
     * year could leave "out of 133 strikes in 2024" sitting under a residential-only
     * selection. Deriving it here means it can never describe anything but the current
     * selection.
     */
    useEffect(() => {
        if (!combineFilters) return;
        if (narrowingFilters.length === 0 && selectedAreaType.length !== ALL_LANDSCAPES) {
            setFilterReadout([]);
            return;
        }
        const dimensionOf = (k: string) => k.split(":")[0];
        const argFor: Record<string, any> = {
            year: selectedYear,
            month: selectedMonth != null ? MONTHS[selectedMonth] : null,
            dates: selectedDates,
            area: effectiveAreaType.length === 1 ? effectiveAreaType[0] : effectiveAreaType,
            city: selectedCity.length === 1 ? selectedCity[0] : selectedCity,
            day: selectedDay,
        };
        const asList = (xs: string[]) =>
            xs.length < 2 ? xs[0] : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`;

        /**
         * The period is the stable part of the readout: it stays put while landscape and
         * town selections come and go, and only the line beneath it changes. Swapping the
         * whole block on every click made it hard to tell what had actually moved.
         */
        const timeKey = selectedYear ? "year" : selectedMonth != null ? "month"
            : (selectedDates[0] && selectedDates[1]) ? "dates" : null;
        // all-landscapes-ticked already collapses to [] in effectiveAreaType, so a line
        // describing it would only restate the period in different words
        const labelFor = (a: string) =>
            (landscape_map as unknown as Record<string, string>)[a] ?? a;
        const landscapeTerms = effectiveAreaType.map(labelFor);
        const narrowing = [...landscapeTerms, ...selectedCity];

        /**
         * A selected category that matched nothing must not be folded into the main
         * sentence: "landed in residential and agricultural areas" reads as though some
         * landed in agricultural ones when none did. Split here and say so separately.
         */
        const strikesIn = (o: any) =>
            pointsMatching(o).reduce((n: number, p: any) => n + Math.max(1, p.shell_count ?? 1), 0);
        const landscapeHit = effectiveAreaType.filter((a: string) => strikesIn({ area: [a] }) > 0);
        const landscapeNone = effectiveAreaType.filter((a: string) => strikesIn({ area: [a] }) === 0);
        // towns are judged against the landscapes that actually matched, not the whole
        // selection — otherwise one empty category drags every town into "none" with it
        const cityHit = selectedCity.filter((c: string) => strikesIn({ city: [c], area: landscapeHit }) > 0);
        const cityNone = selectedCity.filter((c: string) => strikesIn({ city: [c], area: landscapeHit }) === 0);

        /**
         * With every landscape ticked the selection excludes nothing, so instead of falling
         * silent the readout turns into a breakdown: how the strikes on screen divide
         * between the three, with any empty category named rather than quietly dropped.
         * Counts come from pointsMatching, so they respect whatever period and towns are
         * also selected.
         */
        const allLandscapesPicked = selectedAreaType.length === ALL_LANDSCAPES;
        const breakdown = (() => {
            if (!allLandscapesPicked) return null;
            const counts = Object.keys(landscape_map).map((a) => ({
                label: labelFor(a),
                n: strikesIn({ area: [a] }),
            }));
            const hit = counts.filter((c) => c.n > 0);
            const none = counts.filter((c) => c.n === 0);
            return (
                <>
                    {/* one category per line: the three run well past the column set wide */}
                    {hit.map((c, i) => (
                        <React.Fragment key={c.label}>
                            <span className="text-2xl text-white">{c.n}</span>
                            {i === 0 ? " landed in " : " in "}
                            {/* one strike is "a residential area", not "residential areas" */}
                            {c.n === 1 ? (/^[aeiou]/i.test(c.label) ? "an " : "a ") : ""}
                            <span className="text-2xl text-white">{c.label}</span>
                            {c.n === 1 ? " area" : " areas"}
                            {i < hit.length - 1
                                ? <>{i === hit.length - 2 ? " and" : ","}<br /></>
                                : "."}
                        </React.Fragment>
                    ))}
                    {none.length > 0 && (
                        <>
                            {hit.length > 0 ? <br /> : null}None landed in{" "}
                            <span className="text-2xl text-white">
                                {none.map((c) => c.label).join(" or ")}
                            </span>{" "}
                            areas.
                        </>
                    )}
                </>
            );
        })();

        // nothing selected but the three landscapes: the breakdown is the whole readout, so
        // it needs a total of its own to sit under
        if (narrowingFilters.length === 0) {
            const pending = Object.values(PENDING_GEOLOCATION_BY_YEAR).reduce((a, b) => a + b, 0);
            setFilterReadout([
                <>
                    <span className="text-2xl text-white">{TOTAL_STRIKES}</span> white phosphorus
                    strikes landed across <span className="text-2xl text-white">South Lebanon</span>
                    {" "}and <span className="text-2xl text-white">northern Israel</span>,<br />
                    <span className="text-2xl text-white">{pending}</span> of which are verified but
                    not yet geolocated.
                </>,
                <div style={{ marginTop: "0.6rem" }}>
                    Want to help?{" "}
                    <a href={DISCORD_INVITE_URL} target="_blank" rel="noopener noreferrer" className="underline text-white">Join our Discord</a>.
                </div>,
                <div style={{ marginTop: "2rem" }}>{breakdown}</div>,
            ]);
            updateDetails([]);
            return;
        }

        if (timeKey) {
            // the period block counts the period, not the narrowed subset
            const periodPts = pointsMatching({ area: [], city: [] });
            /**
             * Repeats the arithmetic of whichever period branch getDetails is about to take,
             * so "58 of the 119" names the number sitting one line above it rather than a
             * second, slightly different total.
             */
            const periodTotal = (() => {
                const mapped = periodPts
                    .filter((p: any) => p.lat != null && p.lon != null)
                    .reduce((sum: number, p: any) => sum + p.shell_count, 0);
                if (timeKey === "year") return TOTAL_STRIKES_BY_YEAR[selectedYear as string] ?? mapped;
                const pending = PENDING_INCIDENTS.filter(p =>
                    timeKey === "month"
                        ? p.date.slice(0, 7) === argFor.month
                        : p.date >= selectedDates[0] && p.date <= selectedDates[1]
                ).reduce((sum, p) => sum + p.bursts, 0);
                return mapped + pending;
            })();
            // "1 of the 1 landed in…" is not a sentence anyone writes
            const allOfThem = filteredStrikes.count === periodTotal;
            /**
             * Landscape and town are joined by "in", not "and" — they are two different
             * questions about the same strike ("residential areas in Yohmor"), where "and"
             * read as if Yohmor were a third kind of terrain.
             */
            const areaPhrase = (terms: string[], singular: boolean) => (
                <>
                    {singular ? (/^[aeiou]/i.test(terms[0]) ? "an " : "a ") : ""}
                    <span className="text-2xl text-white">{asList(terms)}</span>
                    {singular ? " area" : " areas"}
                </>
            );
            const townPhrase = (terms: string[]) => (
                <span className="text-2xl text-white">{asList(terms)}</span>
            );
            // one strike in one kind of place is "an agricultural area", not "agricultural areas"
            const oneArea = landscapeHit.length === 1 && filteredStrikes.count === 1;
            const hitLandscape = landscapeHit.length ? areaPhrase(landscapeHit.map(labelFor), oneArea) : null;
            const hitCity = cityHit.length ? townPhrase(cityHit) : null;
            /**
             * The combination matched nothing at all. Said as one sentence over the whole
             * selection — "None of the 35 landed in agricultural areas in Yohmor" — because
             * splitting it into per-dimension "none" clauses would claim Yohmor was empty
             * when what was empty is agricultural-land-in-Yohmor.
             */
            const nothingMatched = filteredStrikes.count === 0;
            const allLandscape = landscapeTerms.length ? areaPhrase(landscapeTerms, false) : null;
            const allCity = selectedCity.length ? townPhrase(selectedCity) : null;
            const narrowRow = (narrowing.length || breakdown) ? (
                // 2rem matches .dynamic-readout > div:nth-child(3) in globals.css, which is
                // what sets the gap above the line this one sits under
                <div style={{ marginTop: "2rem" }}>
                    {!narrowing.length ? null : nothingMatched ? (
                        <>
                            None of the <span className="text-2xl text-white">{periodTotal}</span> landed in{" "}
                            {allLandscape}
                            {allLandscape && allCity ? " in " : ""}
                            {allCity}.
                        </>
                    ) : (
                        <>
                            {allOfThem ? (
                                filteredStrikes.count === 1 ? "It landed in " : "All of them landed in "
                            ) : (
                                <>
                                    <span className="text-2xl text-white">{filteredStrikes.count}</span>{" "}
                                    strike{filteredStrikes.count === 1 ? "" : "s"} of the{" "}
                                    <span className="text-2xl text-white">{periodTotal}</span> landed in{" "}
                                </>
                            )}
                            {hitLandscape}
                            {hitLandscape && hitCity ? " in " : ""}
                            {hitCity}.
                            {landscapeNone.length > 0 && (
                                <> None landed in {areaPhrase(landscapeNone.map(labelFor), false)}.</>
                            )}
                            {cityNone.length > 0 && (
                                <> None landed in {townPhrase(cityNone)}.</>
                            )}
                        </>
                    )}
                    {breakdown && <>{narrowing.length ? " " : ""}{breakdown}</>}
                </div>
            ) : null;
            getDetails(periodPts, argFor[timeKey], false, null, narrowRow);
            return;
        }

        const key =
            lastFilterKey && narrowingFilters.some((f: { key: string }) => dimensionOf(f.key) === lastFilterKey)
                ? lastFilterKey
                : dimensionOf(narrowingFilters[0].key);
        getDetails(filteredStrikes.pts, argFor[key], false, readoutContext(key),
            breakdown ? <div style={{ marginTop: "2rem" }}>{breakdown}</div> : undefined);
    }, [combineFilters, narrowingFilters, filteredStrikes.pts, lastFilterKey]);

    const clearAllFilters = () => {
        setSelectedYear(null);
        setSelectedMonth(null);
        setSelectedDates(["", ""]);
        setSelectedAreaType([]);
        setSelectedCity([]);
        setselectedDay(-1);
        getDetails(undefined, "all");
    };

    /**
     * Points matching every active filter, optionally with one dimension overridden — a
     * handler calls this with the value it is about to set, since its own setState has not
     * landed yet. Lets the existing readouts keep their wording while counting the whole
     * combination rather than the single dimension that was clicked.
     */
    const pointsMatching = (o: {
        city?: string[]; area?: string[]; year?: string | null;
        month?: number | null; dates?: [string, string]; day?: number;
    } = {}) => {
        const city = o.city !== undefined ? o.city : selectedCity;
        const area = o.area !== undefined ? o.area : effectiveAreaType;
        const year = o.year !== undefined ? o.year : selectedYear;
        const month = o.month !== undefined ? o.month : selectedMonth;
        const dates = o.dates !== undefined ? o.dates : selectedDates;
        const day = o.day !== undefined ? o.day : selectedDay;
        return geoData.filter((p: any) => {
            if (city.length && !city.includes(p.town)) return false;
            if (area.length && !area.includes(p.landscape)) return false;
            if (year && p.date.slice(0, 4) !== year) return false;
            if (month != null && p.date.slice(0, 7) !== MONTHS[month]) return false;
            if (dates[0] && dates[1] && !(p.date >= dates[0] && p.date <= dates[1])) return false;
            if (day !== -1 && (new Date(p.date).getDay() + 6) % 7 !== day) return false;
            return true;
        });
    };

    useEffect(() => {
        if (!TypewriterFinished) return;
        setTimeout(() => {
            setShowPanels(true);
        }, controlEnabledTimeout);
    }, [TypewriterFinished])

    useEffect(() => {
        fetch("/data/geoData.json")
            .then((res) => res.json())
            .then((data) => {
                console.log("data loaded. Total", data.length, "entries.")
                const sortedData = data.sort((a: any, b: any) => {
                    const dateA = new Date(`${a.date}T${a.time}`);
                    const dateB = new Date(`${b.date}T${b.time}`);
                    return dateA.getTime() - dateB.getTime();
                });
                setGeoData(sortedData);
            })
            .catch((err) => console.error("Failed to load geoData:", err));
    }, []);


    /**
     * Renders one readout line. Some lines are a div carrying their own top margin (the
     * Discord prompt, the narrowing sentence). On the satellite basemap each row gets a
     * dark backdrop, and a margin sitting *inside* the painted row was painted with it —
     * an empty black band above the text. Hoisting the margin onto the row keeps the
     * spacing and lets the box hug the words, without needing the backdrop to be moved
     * onto the child (which stacked two boxes on browsers where that selector applied).
     */
    const readoutRow = (line: any, key: string) => {
        const margin = React.isValidElement(line)
            ? (line.props as any)?.style?.marginTop
            : undefined;
        if (!margin) return <div key={key}>{line}</div>;
        const flat = React.cloneElement(line as any, {
            style: { ...(line.props as any).style, marginTop: 0 },
        });
        return <div key={key} style={{ marginTop: margin }}>{flat}</div>;
    };

    const closeReadout = () => {
        getDetails();
        setClearSelectionSignal(s => s + 1);
    };

    /**
     * The denominator for a "N of M" readout. With no other filter active that is the whole
     * dataset; with one, it is the subtotal inside it — so picking 2024 then residential
     * reads "50 … out of 133 strikes in 2024" rather than "out of 288", which is the
     * comparison actually being made.
     */
    const readoutContext = (excludeKey: string, overrides: any = {}) => {
        if (!combineFilters) return null;
        // chips are keyed per value ("area:resident"), so exclude the whole dimension
        const rest = narrowingFilters.filter((f: { key: string }) => f.key.split(":")[0] !== excludeKey);
        if (rest.length === 0) return null;
        // "no filter on this dimension" is spelled differently per dimension
        const NEUTRAL: Record<string, any> = { area: [], city: [], year: null, month: null, day: -1, dates: ["", ""] };
        const pts = pointsMatching({ ...overrides, [excludeKey]: NEUTRAL[excludeKey] });
        return {
            total: pts.reduce((n: number, p: any) => n + Math.max(1, p.shell_count ?? 1), 0),
            label: rest.map((f: { label: string }) => f.label).join(" · "),
        };
    };

    const getDetails = (
        pt?: any,
        arg?: any,
        clicked?: boolean,
        context?: { total: number; label: string } | null,
        extraRow?: any,
    ) => {
        let readout1, readout2, readout3, readout4, readout5, readout6, readout7, readout8 = "";
        let thumbnails: string[] = [];
        let ext_link: string[] = [];

        // a tagged call describes a filter selection; an untagged one describes one incident
        const isFilterSummary = combineFilters && arg != undefined;
        const emit = (rowsIn: any[]) => {
            let rows = rowsIn;
            if (extraRow) {
                // dropped into the first free line so the block above it stays put
                const body = rowsIn.slice(0, 8);
                const free = body.findIndex((r: any) => !r);
                if (free >= 0) body[free] = extraRow; else body[7] = extraRow;
                rows = [...body, rowsIn[8], rowsIn[9]];
            }
            if (isFilterSummary) {
                setFilterReadout(rows);
                updateDetails([]); // a new selection invalidates whichever point was open
            } else {
                updateDetails(rows);
            }
        };

        if (!pt) {
            updateDetails([readout1, readout2, readout3, readout4, readout5, readout6, readout7, readout8, thumbnails, ext_link]);
            if (arg === "all") setFilterReadout([]);
            return;
        }
        if (arg != undefined) {
            //multi point array
            if (pt.length === 0 || !Array.isArray(pt)) {
                // said here rather than in the filter box, which now holds a fixed height
                if (isFilterSummary) readout1 = <>No incidents match these filters.</>;
                emit([readout1, readout2, readout3, readout4, readout5, readout6, readout7, readout8, thumbnails, ext_link]);
                return;
            }
            const shellCount = pt.reduce((sum, p) => sum + p.shell_count, 0)

            /**
             * Several values selected in one category. A date range is also an array, so
             * it is told apart by its contents rather than its shape.
             */
            const isDatePair = Array.isArray(arg) && arg.length === 2 &&
                arg.every((x: any) => /^\d{4}-\d{2}-\d{2}$/.test(String(x)));
            if (Array.isArray(arg) && arg.length > 1 && !isDatePair) {
                const asList = (xs: string[]) =>
                    xs.length < 2 ? xs[0] : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`;
                const isLandscape = Object.keys(landscape_map).includes(arg[0]);
                const names = isLandscape
                    ? arg.map((k: string) => (landscape_map as unknown as Record<string, string>)[k])
                    : arg;
                readout1 = <><span className="text-2xl text-white">{shellCount}</span> white phosphorus strike{shellCount > 1 ? "s" : ""} landed in <span className="text-2xl text-white">{asList(names)}</span>{isLandscape ? " areas" : ""}, out of <span className="text-2xl text-white">{context ? context.total : TOTAL_STRIKES}</span>{context ? <> strikes in <span className="text-2xl text-white">{context.label}</span></> : " total strikes"}.</>
                emit([readout1, readout2, readout3, readout4, readout5, readout6, readout7, readout8, thumbnails, ext_link]);
                return;
            }

            if (typeof arg === "string") {

                if (arg.indexOf("-") > 0) {
                    //month
                    // exclude not-yet-geolocated entries (null coords) from the mapped count first,
                    // so adding pendingInMonth back doesn't double-count them
                    const mappedInMonth = pt.filter((p: any) => p.lat != null && p.lon != null).reduce((sum: number, p: any) => sum + p.shell_count, 0);
                    const pendingInMonth = PENDING_INCIDENTS
                        .filter(p => p.date.slice(0, 7) === arg)
                        .reduce((sum, p) => sum + p.bursts, 0);
                    const totalInMonth = mappedInMonth + pendingInMonth;
                    readout1 = <><span className="text-2xl text-white">{totalInMonth}</span> white phosphorus strike{totalInMonth > 1 ? "s" : ""} happened in <span className="text-2xl text-white">{monthParser(arg)}</span>
                        {pendingInMonth > 0 && <>,<br /><span className="text-2xl text-white">{pendingInMonth}</span> of which {pendingInMonth > 1 ? "are" : "is"} verified but not yet geolocated</>}
                        .</>
                    readout2 = pendingInMonth > 0
                        ? <div style={{ marginTop: "0.6rem" }}>Want to help? <a href={DISCORD_INVITE_URL} target="_blank" rel="noopener noreferrer" className="underline text-white">Join our Discord</a>.</div>
                        : <></>
                } else if (Object.keys(landscape_map).includes(arg)) {
                    //landscape
                    const key = arg as keyof landscape_mapping_prop;
                    const subset = pt.filter(p => p.landscape === arg);
                    readout1 = <><span className="text-2xl text-white">{shellCount}</span> white phosphorus strike{shellCount > 1 ? "s" : ""} landed in <span className="text-2xl text-white">{landscape_map[key]}</span> areas, out of <span className="text-2xl text-white">{context ? context.total : TOTAL_STRIKES}</span>{context ? <> strikes in <span className="text-2xl text-white">{context.label}</span></> : " total strikes"}.</>
                    readout2 = <></>
                } else if (/^\d{4}$/.test(arg)) {
                    //year
                    const pendingCount = PENDING_GEOLOCATION_BY_YEAR[arg] ?? 0;
                    const totalCount = TOTAL_STRIKES_BY_YEAR[arg] ?? shellCount;
                    readout1 = <><span className="text-2xl text-white">{totalCount}</span> white phosphorus strike{totalCount > 1 ? "s" : ""} happened in <span className="text-2xl text-white">{arg}</span>
                        {pendingCount > 0 && <>,<br /><span className="text-2xl text-white">{pendingCount}</span> of which {pendingCount > 1 ? "are" : "is"} verified but not yet geolocated</>}
                        .</>
                    readout2 = pendingCount > 0
                        ? <div style={{ marginTop: "0.6rem" }}>Want to help? <a href={DISCORD_INVITE_URL} target="_blank" rel="noopener noreferrer" className="underline text-white">Join our Discord</a>.</div>
                        : <></>
                }
                else {
                    let shellCount = 0;
                    const dates = pt.map(p => {
                        const dateTimeString = `${p.date}T${p.time}`;
                        const date = new Date(dateTimeString);
                        shellCount += p.shell_count;
                        return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: 'numeric' });
                        // const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).replace(/\s(am|pm)/, (match) => match.toUpperCase());;
                    })

                    if (pt.length > 1) {
                        // city/town
                        readout1 = <>Between <span className="text-2xl text-white">{dates[0]}</span> and  <span className="text-2xl text-white">{dates[dates.length - 1]}</span>,</>
                        readout2 = <><span className="text-2xl text-white">{shellCount} </span>white phosphorus strike{shellCount > 1 ? "s" : ""} in
                            <span className="text-2xl text-white"> {pt[0].town}</span>.</>
                    } else {
                        readout1 = <>On <span className="text-2xl text-white">{dates[0]}</span>,</>
                        readout2 = <>{shellCount} white phosphorus strike{shellCount > 1 ? "s" : ""} in <span className="text-2xl text-white">{pt[0].town}</span>.</>
                    }
                }
            } else if (Array.isArray(arg)) {
                //clicked on timeline
                const townCount = new Set(pt.map(p => p.town));
                const date1 = new Date(arg[0]);
                const date_start = date1.toLocaleDateString("en-US", { month: "short", day: "numeric", year: 'numeric' });
                const date2 = new Date(arg[1]);
                const date_end = date2.toLocaleDateString("en-US", { month: "short", day: "numeric", year: 'numeric' });
                readout1 = <>Between <span className="text-2xl text-white">{date_start}</span> and <span className="text-2xl text-white">{date_end}</span>,</>

                // exclude not-yet-geolocated entries (null coords) from the mapped count first,
                // so adding pendingInRange back doesn't double-count them
                const mappedInRange = pt.filter((p: any) => p.lat != null && p.lon != null).reduce((sum: number, p: any) => sum + p.shell_count, 0);
                const pendingInRange = PENDING_INCIDENTS
                    .filter(p => p.date >= arg[0] && p.date <= arg[1])
                    .reduce((sum, p) => sum + p.bursts, 0);
                const totalInRange = mappedInRange + pendingInRange;
                readout2 = <div style={{ marginTop: "0.5rem" }}><span className="text-2xl text-white">{totalInRange} </span>white phosphorus strike{totalInRange > 1 ? "s" : ""} across <span className="text-2xl text-white">{townCount.size}</span> cities/towns
                    {pendingInRange > 0 && <>,<br /><span className="text-2xl text-white">{pendingInRange}</span> of which {pendingInRange > 1 ? "are" : "is"} verified but not yet geolocated</>}
                    .</div>
                readout3 = pendingInRange > 0
                    ? <div style={{ marginTop: "0.6rem" }}>Want to help? <a href={DISCORD_INVITE_URL} target="_blank" rel="noopener noreferrer" className="underline text-white">Join our Discord</a>.</div>
                    : <></>
            }
            else if (typeof arg === 'number') { //filtered by day of week
                const date = new Date(pt[0].date);
                let day = date.getDay();
                const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                readout2 = <></>
                readout1 = <><span className="text-2xl text-white">{shellCount}</span> white phosphorus strike{shellCount > 1 ? "s" : ""} happened on <span className="text-2xl text-white">{days[day]}s</span>, out of <span className="text-2xl text-white">{context ? context.total : TOTAL_STRIKES}</span>{context ? <> strikes in <span className="text-2xl text-white">{context.label}</span></> : " total strikes"}.</>
            } else {
                readout1 = <></>
                readout2 = <></>
            }
            thumbnails = [];
        } else {
            //single point
            const dateTimeString = `${pt.date}T${pt.time}`;
            const date = new Date(dateTimeString);
            const formattedDate = date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: 'numeric' });
            const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).replace(/\s(am|pm)/, (match) => match.toUpperCase());;
            readout1 = <>On <span className="text-2xl text-white">{formattedDate}</span>, at <span className="text-2xl text-white">{formattedTime}</span>,</>;
            readout2 = <><span className="text-2xl text-white">{pt.shell_count}</span> white phosphorus strike{pt.shell_count > 1 ? "s" : ""} in <span className="text-2xl text-white">{pt.town}</span>.</>
            //only on click
            if (clicked) {
                readout3 = `Coordinates: ${trimCoord(pt.lat)}, ${trimCoord(pt.lon)}`;
                readout4 = `Code: ${pt.code}`
                if (pt.landscape) {
                    const lands = landscape_map[pt.landscape as keyof typeof landscape_map];
                    readout5 = `Landscape: ${lands.slice(0, 1).toUpperCase() + lands.slice(1)} area`;
                } else readout5 = "Landscape type is not yet unidentified."
                const geolocator = pt.by.map((person: string) => geoSource[person] ?? "/").join(", ")
                readout6 = `Geolocated by: ${geolocator}`
                readout7 = "";
                readout8 = "";

                // display labels for the source-link list — the entry's own media names
                // (e.g. "wp432_media1"), not the image files themselves
                thumbnails = pt.filename.map((name: string) => name.replace(/\.\w+$/, ""))
                ext_link = [...pt.links]
            } else {
                readout3 = "";
                readout4 = "";
                readout5 = "";
                readout6 = "";
                readout7 = "";
                readout8 = "";
                thumbnails = []
                ext_link = []
            }
        }
        emit([readout1, readout2, readout3, readout4, readout5, readout6, readout7, readout8, thumbnails, ext_link]);
    }


    return (<>
        <div
            className={isMobile && !TypewriterFinished ? "mobile-intro-dim" : ""}
            onClick={() => {
                //reset all
                if (selectedCity.length) {
                    setSelectedCity([]);
                }
                if (selectedDay != -1) {
                    setselectedDay(-1);
                }
                if (selectedAreaType.length) {
                    setSelectedAreaType([]);
                }
                if (selectedDates[0] != "" || selectedDates[1] != "") {
                    setSelectedDates(["", ""])
                }
                if (selectedMonth != null) {
                    setSelectedMonth(null)
                }
                if (selectedYear != null) {
                    setSelectedYear(null)
                }
                if (isMobile && details[0]) {
                    getDetails();
                }
            }}>

            <SatelliteMap
                onZoomChange={setMapZoom}
                onCenterChange={setLeafletCenter}
                setMapInstance={setMapInstance}
                showSatellite={showSatelliteMap}
                TypewriterFinished={TypewriterFinished}
            />

            <VectorMap
                geoData={geoData}
                selectedCity={selectedCity}
                selectedDates={selectedDates}
                selectedDay={selectedDay}
                selectedAreaType={effectiveAreaType}
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
                TypewriterFinished={TypewriterFinished}
                getMapDetails={getDetails}
                leafletCenter={leafletCenter}
                mapZoom={mapZoom}
                mapInstance={mapInstance}
                showSatellite={showSatelliteMap}
                TypeWriterFinished={TypewriterFinished}
                clearSelectionSignal={clearSelectionSignal}
                basemap={basemap}
            />
        </div >
        <div className={`map-readout opacity-100 ${isMobile && details[0] ? "has-content" : ""} ${showSatelliteMap ? "on-satellite" : ""}`}>
            {isMobile && details[0] && (
                // Mobile only. Dense clusters of incidents mean their (large, ~190m-radius)
                // clickable bloom areas can cover most of what looks like "blank" map space,
                // so a tap doesn't reliably land on true empty space to reset. On desktop
                // hovering away already clears the readout, and the button sat under the
                // contamination counter where it read as a stray floating box.
                <button
                    onClick={closeReadout}
                    aria-label="Close"
                    className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-white/10 text-white/80 text-lg leading-none z-10"
                    style={{ pointerEvents: "all" }}
                >
                    ×
                </button>
            )}
            <div
                className="dynamic-readout"
                // the readout's text lines carry `pointer-events: all` so they stay
                // selectable, which means they also swallow map clicks that land on them —
                // making it look like clicking blank space fails to deselect. Treat a plain
                // click on the text as "dismiss", while leaving text selection and links alone.
                onClick={(e) => {
                    const t = e.target as HTMLElement;
                    if (t.closest("a") || t.closest("button")) return;
                    if ((window.getSelection()?.toString() ?? "").length > 0) return;
                    closeReadout();
                }}
            >
                {/* the filter summary stays put; the incident detail stacks beneath it */}
                {filterReadout.slice(0, 8).map((line, idx) => readoutRow(line, `f-${idx}`))}
                {filterReadout.length > 0 && details.some(Boolean) && (
                    <div className="readout-divider" />
                )}
                {details.slice(0, 8).map((line, idx) => readoutRow(line, String(idx)))}
                {/* links out to the source instead of hosting/displaying the media directly —
                    several sources are watermarked agency preview images (AFP Forum, ANP,
                    Getty), which aren't cleared for public reproduction */}
                {details[9] && details[9].length > 0 && (
                    <div className="flex gap-x-2 items-baseline">
                        <span className="flex-shrink-0">Links:</span>
                        {/* chunked into rows of 3 so overflow wraps onto its own line, aligned
                            under the first link rather than under the "Links:" label */}
                        <div className="flex flex-col gap-y-1">
                            {Array.from({ length: Math.ceil(details[9].length / 3) }, (_, row) =>
                                details[9].slice(row * 3, row * 3 + 3)
                            ).map((chunk: string[], row: number) => (
                                <div key={row} className="flex gap-x-2 items-baseline">
                                    {chunk.map((link: string, i: number) => (
                                        <React.Fragment key={i}>
                                            {i > 0 && <span className="text-white text-lg leading-none">•</span>}
                                            <a
                                                href={link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="media-link text-white/80 hover:text-white"
                                            >
                                                {details[8]?.[row * 3 + i] ?? `Media ${row * 3 + i + 1}`}
                                            </a>
                                        </React.Fragment>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>

        {!isMobile && <div
            className={`fixed right-3 top-28 z-50 side-bar transition-opacity duration-500 ease-in-out ${showPanels ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} >
            <div className="satellite-toggle-container relative mt-1">
                <div className={`map-toggle-group ${TypewriterFinished ? "pointer-events-auto" : "pointer-events-none"}`}>
                    <div
                        className={`map-toggle-option ${!showSatelliteMap ? "map-toggle-option-active" : ""}`}
                        onClick={() => setShowSatelliteMap(false)}
                    >
                        Vector Map
                    </div>
                    <div
                        className={`map-toggle-option ${showSatelliteMap ? "map-toggle-option-active" : ""}`}
                        onClick={() => setShowSatelliteMap(true)}
                    >
                        Satellite Image
                    </div>
                </div>
            </div>


            {/*
              * Rendered whether or not anything is selected. An empty box holding its own
              * height is quieter than one that appears and shoves the whole panel down every
              * time a filter goes on or off.
              */}
            {combineFilters && (
                <div className="active-filters">
                    <div
                        ref={chipsRef}
                        className={`active-filters-chips${chipsOverflow ? " is-overflowing" : ""}`}
                    >
                        {activeFilters.map((f: { key: string; label: string; clear: () => void }) => (
                            <button key={f.key} className="filter-chip" onClick={f.clear}
                                aria-label={`Remove filter ${f.label}`}>
                                {f.label}<span className="filter-chip-x">×</span>
                            </button>
                        ))}
                    </div>
                    {/* hidden rather than unmounted, so "Clear all" never moves */}
                    <button
                        className="clear-filters"
                        onClick={clearAllFilters}
                        style={{ visibility: activeFilters.length ? "visible" : "hidden" }}
                        tabIndex={activeFilters.length ? 0 : -1}
                    >
                        Clear all
                    </button>
                </div>
            )}

            <div className="mt-5">
                <div className="chart-titles">Filter by Year</div>
                <div className="flex gap-3 justify-center mt-3">
                    {["All", "2023", "2024", "2025", "2026"].map((year) => (
                        <div
                            key={year}
                            className={`chart-titles area-type-legend year-filter-pill ${(year === "All" && selectedYear === null) || selectedYear === year ? "area-type-legend-active" : ""}`}
                            onClick={() => {
                                /**
                                 * Year, month and date range are three ways of saying the
                                 * same thing, so they replace each other. Landscape, city
                                 * and day are independent and are left alone when filters
                                 * combine — holding a year AND a landscape is the whole
                                 * point of the feature.
                                 */
                                setSelectedDates(["", ""]);
                                setSelectedMonth(null);
                                if (!combineFilters) {
                                    setSelectedCity([]);
                                    setselectedDay(-1);
                                    setSelectedAreaType([]);
                                }

                                if (year === "All") {
                                    setSelectedYear(null);
                                    getDetails(null);
                                } else {
                                    setSelectedYear(year);
                                    setLastFilterKey("year");
                                    if (!combineFilters) {
                                        const pts = geoData.filter((p: any) => p.date.slice(0, 4) === year);
                                        getDetails(pts, year);
                                    }
                                }
                            }}>{year}</div>
                    ))}
                </div>
            </div>

            <div className="mt-5">
                <Timeline geoData={geoData}
                    selectedDates={selectedDates}
                    onTimelineDragged={(data) => {
                        if (!data) return;
                        setSelectedDates([data[0], data[1]]);
                        // a date range supersedes the other two time filters
                        setSelectedMonth(null)
                        setSelectedYear(null)
                        if (!combineFilters) {
                            setselectedDay(-1);
                            setSelectedAreaType([]);
                        }
                        setLastFilterKey("dates");
                        if (!combineFilters) {
                            const pts = geoData.filter((p: any) => { return p.date <= data[1] && p.date >= data[0] })
                            getDetails(pts, [data[0], data[1]])
                        }
                    }} />
            </div>

            <div className="mt-5">
                <div className="chart-titles">Strikes by Month</div>
                <LandscapeHisto geoData={geoData}
                    selectedCity={selectedCity}
                    selectedDates={selectedDates}
                    selectedDay={selectedDay}
                    selectedAreaType={effectiveAreaType}
                    selectedMonth={selectedMonth}
                    onMonthClick={(d: ([string, number] | null)) => { //[d.key, d.count]
                        if (d) {
                            const [year, month] = d[0].split("-");
                            const realMonth = year + "-" + (parseInt(month))
                            setSelectedMonth(MONTHS_CONVERT.indexOf(realMonth));
                            const realMonthinData = MONTHS[MONTHS_CONVERT.indexOf(realMonth)];
                            const pts = geoData.filter((p: any) => { return p.date.slice(0, 7) === realMonthinData })
                            getDetails(pts, realMonthinData);

                            // console.log("selected month is ", MONTHS_CONVERT.indexOf(realMonth))
                            // console.log(realMonth, d[1])
                        } else {
                            setSelectedMonth(null);
                        }
                        //reset others
                        setSelectedCity([]);
                        setSelectedDates(["", ""]);
                        setSelectedAreaType([]);
                        setselectedDay(-1)
                        setSelectedYear(null)
                    }}
                />
            </div>
            <div className="mt-4 ">
                <div className="chart-titles">Strikes by Hour</div>
                <Area geoData={geoData}
                    selectedCity={selectedCity}
                    selectedDates={selectedDates}
                    selectedDay={selectedDay}
                    selectedAreaType={effectiveAreaType}
                    selectedMonth={selectedMonth}
                    selectedYear={selectedYear}
                />
            </div>
            <div className={`mt-8`}>
                <div className="chart-titles">Catogorized by Landscape</div>
                <LandscapeBar
                    geoData={geoData}
                    selectedCity={selectedCity}
                    selectedDates={selectedDates}
                    selectedDay={selectedDay}
                    selectedMonth={selectedMonth}
                    selectedYear={selectedYear}
                    selectedAreaType={selectedAreaType}
                    onAreaTypeClicked={(type) => {
                        // clicking a selected value removes it, so several can be held at once
                        setSelectedAreaType((prev) =>
                            !type ? []
                                : combineFilters
                                    ? (prev.includes(type) ? prev.filter((x) => x !== type) : [...prev, type])
                                    : (prev.includes(type) ? [] : [type]));
                        const turningOff = !type || selectedAreaType.includes(type);
                        if (type) {
                            setLastFilterKey("area");
                            if (!combineFilters) {
                                if (turningOff) getDetails(null);
                                else getDetails(geoData.filter((p: any) => p.landscape === type), type);
                            }
                        } else {
                            getDetails(null);
                        }
                        if (!combineFilters) {
                            setSelectedCity([]);
                            setSelectedDates(["", ""]);
                            setselectedDay(-1);
                            setSelectedMonth(null);
                            setSelectedYear(null);
                        }
                    }}
                />
            </div>



            <div className="mt-4 histogram">
                <Histogram
                    geoData={geoData}
                    selectedCity={selectedCity}
                    selectedDates={selectedDates}
                    selectedDay={selectedDay}
                    selectedAreaType={effectiveAreaType}
                    selectedMonth={selectedMonth}
                    selectedYear={selectedYear}
                    onBarClick={(data) => {
                        if (!data) return;
                        const newCity = data[0];
                        setSelectedCity((prev) =>
                            combineFilters
                                ? (prev.includes(newCity) ? prev.filter((x) => x !== newCity) : [...prev, newCity])
                                : (prev.includes(newCity) ? [] : [newCity]));

                        setLastFilterKey("city");
                        if (!combineFilters) {
                            // same here: re-clicking the selected town clears it
                            if (selectedCity.includes(newCity)) getDetails(null);
                            else getDetails(geoData.filter((p: any) => p.town === newCity), newCity);
                        }
                        if (!combineFilters) {
                            setselectedDay(-1);
                            setSelectedAreaType([]);
                            setSelectedDates(["", ""])
                            setSelectedMonth(null)
                            setSelectedYear(null)
                        }
                    }} />
            </div>
        </div>}
    </>);
}
