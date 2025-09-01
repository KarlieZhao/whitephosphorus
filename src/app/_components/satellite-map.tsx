"use client";
import React, { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
export const mapZoomLevel = 11
import { controlEnabledTimeout } from "./map";

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

    useEffect(() => {
        const L = require("leaflet");
        const map = L.map(mapRef.current!, {
            minZoom: 10,
            maxZoom: 15,
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
            opacity: 0.8,
            bounds: L.latLngBounds(
                [33.0, 35.02],  //  southwest
                [33.46, 35.9]   //  northeast
            )
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