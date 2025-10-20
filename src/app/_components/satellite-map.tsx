"use client";
import React, { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
export const mapZoomLevel = 11

type SatelliteMapProps = {
    onZoomChange?: (zoom: number) => void;
    onCenterChange?: (center: [number, number]) => void;
    setMapInstance?: (map: any) => void;
    showSatellite?: boolean;
    TypewriterFinished?: boolean
};

export default function SatelliteMap({ onZoomChange, onCenterChange, setMapInstance, showSatellite = false, TypewriterFinished }: SatelliteMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const svgLayerRef = useRef<SVGElement | null>(null);
    const tileLayerRef = useRef<any>(null);

    const DOT_ANIMATION_DELAY = TypewriterFinished ? 20 : 60;
    const BORDER_DELAY = 500;
    const controlEnabledTimeout = DOT_ANIMATION_DELAY * 111 + BORDER_DELAY;


    useEffect(() => {
        const L = require("leaflet");
        const map = L.map(mapRef.current!, {
            minZoom: 11,
            maxZoom: 15,
            maxBounds: L.latLngBounds(
                [32.8, 34.7],  //  southwest
                [33.6, 36.3]   //  northeast
            ),
            maxBoundsViscosity: 0.7,
            zoomControl: false
        }).setView([33.2, 35.57], mapZoomLevel);

        if (setMapInstance) {
            setMapInstance(map);
        }
        mapInstanceRef.current = map;
        map.dragging.disable();
        map.scrollWheelZoom.disable();
        map.doubleClickZoom.disable();

        if (TypewriterFinished) {
            setTimeout(() => {
                map.dragging.enable();
                map.scrollWheelZoom.enable();
                map.doubleClickZoom.enable();
                L.control.zoom({
                    position: 'bottomleft'
                }).addTo(map);
            }, controlEnabledTimeout);
        }

        // tile layer
        const tileLayer = L.tileLayer("/tiles/{z}/{x}/{y}.png", {
            tms: true,
            opacity: 0.65
        }).addTo(map);

        tileLayerRef.current = tileLayer;

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
    }, [onZoomChange, TypewriterFinished]);

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
    }, [showSatellite, TypewriterFinished]);


    return <div id="map" ref={mapRef} className="inset-0" />;
}