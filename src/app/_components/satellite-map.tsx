"use client";
import React, { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

export const mapZoomLevel = 11.2;

type SatelliteMapProps = {
    onZoomChange?: (zoom: number) => void;
    onCenterChange?: (center: [number, number]) => void;
    setMapInstance?: (map: any) => void;
    showSatellite?: boolean;
};

export default function SatelliteMap({ onZoomChange, onCenterChange, setMapInstance, showSatellite }: SatelliteMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const svgLayerRef = useRef<SVGElement | null>(null);
    const tileLayerRef = useRef<any>(null);
    useEffect(() => {
        const L = require("leaflet");

        const map = L.map(mapRef.current!, {
            minZoom: 11.2,
            maxZoom: 15,
            zoomControl: false
        }).setView([33.2, 35.57], mapZoomLevel);

        if (setMapInstance) {
            setMapInstance(map);
        }
        mapInstanceRef.current = map;

        // tile layer
        const tileLayer = L.tileLayer("/tiles/{z}/{x}/{y}.png", {
            tms: true,
            opacity: 0.9,
        }).addTo(map);

        tileLayerRef.current = tileLayer;

        // zoom control
        L.control.zoom({
            position: 'bottomleft'
        }).addTo(map);

        L.svg().addTo(map); // adds <svg> overlay to map panes
        svgLayerRef.current = map.getPanes().overlayPane.querySelector("svg");

        map.on("zoomend", () => {
            if (onZoomChange) {
                onZoomChange(map.getZoom());
            }
        });

        map.on("moveend", () => {
            if (onCenterChange) {
                const center = map.getCenter();
                onCenterChange([center.lng, center.lat]);
            }
        });

        return () => {
            map.remove();
        };
    }, [onZoomChange]);

    useEffect(() => {
        if (mapInstanceRef.current && tileLayerRef.current) {
            if (showSatellite) {
                // add tile layer if not already added
                if (!mapInstanceRef.current.hasLayer(tileLayerRef.current)) {
                    tileLayerRef.current.addTo(mapInstanceRef.current);
                }
            } else {


                // remove tile layer if it exists
                if (mapInstanceRef.current.hasLayer(tileLayerRef.current)) {
                    mapInstanceRef.current.removeLayer(tileLayerRef.current);
                }
            }
        }
    }, [showSatellite]);

    return <div id="map" ref={mapRef} className="inset-0" />;
}