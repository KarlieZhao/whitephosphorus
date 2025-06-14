import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { LatLngBoundsExpression } from 'leaflet';

const SatelliteViewer = () => {
    const mapRef = useRef(null);

    const [map, setMap] = useState<L.Map | null>(null);
    const [satelliteLayer, setSatelliteLayer] = useState<L.TileLayer | null>(null);
    const [currentBaseLayer, setCurrentBaseLayer] = useState<L.TileLayer | null>(null);
    const [measurePath, setMeasurePath] = useState<L.Polyline | null>(null);
    const [opacity, setOpacity] = useState(100);
    const [baseLayerType, setBaseLayerType] = useState('none');
    const [measuring, setMeasuring] = useState(false);
    // const [measurePoints, setMeasurePoints] = useState([]);
    const [coordinates, setCoordinates] = useState({
        center: { lat: 0, lng: 0 },
        mouse: { lat: 0, lng: 0 },
        zoom: 1
    });

    // Configuration
    const TILE_URL = 'http://localhost:8000/{z}/{x}/{y}.png';
    const SATELLITE_BOUNDS: LatLngBoundsExpression = [
        [32.97815, 35.00337], // Southwest corner [lat, lng]
        [33.46518, 35.85741]  // Northeast corner [lat, lng]
    ];
    const MAX_ZOOM = 18;

    // Base layer configurations
    const baseLayers = {
        osm: {
            url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            attribution: '© OpenStreetMap contributors'
        },
        satellite: {
            url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            attribution: 'Tiles © Esri'
        },
        terrain: {
            url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
            attribution: '© OpenTopoMap contributors'
        }
    };

    // Initialize map
    useEffect(() => {
        if (!mapRef.current || map) return;

        // Initialize Leaflet map
        const L = window.L;
        const mapInstance = L.map(mapRef.current, {
            crs: L.CRS.EPSG3857,
            minZoom: 0,
            maxZoom: MAX_ZOOM,
            zoomSnap: 0.5,
            zoomDelta: 0.5
        });

        // Add satellite layer
        const satLayer = L.tileLayer(TILE_URL, {
            minZoom: 0,
            maxZoom: MAX_ZOOM,
            bounds: SATELLITE_BOUNDS,
            attribution: 'Custom Satellite Image'
        }).addTo(mapInstance);

        // Set initial view
        mapInstance.fitBounds(SATELLITE_BOUNDS);

        // Add scale control
        L.control.scale({
            maxWidth: 200,
            metric: true,
            imperial: true
        }).addTo(mapInstance);

        // Event listeners
        const updateCoordinates = () => {
            const center = mapInstance.getCenter();
            setCoordinates(prev => ({
                ...prev,
                center: { lat: center.lat, lng: center.lng },
                zoom: mapInstance.getZoom()
            }));
        };

        // const onMouseMove = (e) => {
        //     setCoordinates(prev => ({
        //         ...prev,
        //         mouse: { lat: e.latlng.lat, lng: e.latlng.lng }
        //     }));
        // };

        mapInstance.on('zoomend moveend', updateCoordinates);
        // mapInstance.on('mousemove', onMouseMove);
        // mapInstance.on('click', onMapClick);

        setMap(mapInstance);
        setSatelliteLayer(satLayer);
        updateCoordinates();

        // Cleanup
        return () => {
            mapInstance.remove();
        };
    }, []);

    // Control functions
    const fitToSatelliteImage = () => {
        if (map) {
            map.fitBounds(SATELLITE_BOUNDS);
        }
    };

    const toggleBasemap = () => {
        if (!map) return;

        const L = window.L;
        if (currentBaseLayer) {
            map.removeLayer(currentBaseLayer);
            setCurrentBaseLayer(null);
            setBaseLayerType('none');
        } else {
            const layer = L.tileLayer(baseLayers.osm.url, {
                attribution: baseLayers.osm.attribution
            });
            map.addLayer(layer);
            if (satelliteLayer) satelliteLayer.bringToFront();
            setCurrentBaseLayer(layer);
            setBaseLayerType('osm');
        }
    };

    const changeBaseLayer = (layerType: ('osm' | 'satellite' | 'terrain' | 'none')) => {
        if (!map) return;

        const L = window.L;
        if (currentBaseLayer) {
            map.removeLayer(currentBaseLayer);
            setCurrentBaseLayer(null);
        }

        if (layerType !== 'none' && baseLayers[layerType]) {
            const layer = L.tileLayer(baseLayers[layerType].url, {
                attribution: baseLayers[layerType].attribution
            });
            map.addLayer(layer);
            if (satelliteLayer) satelliteLayer.bringToFront();
            setCurrentBaseLayer(layer);
        }
        setBaseLayerType(layerType);
    };

    const updateOpacity = (value: number) => {
        setOpacity(value);
        if (satelliteLayer) {
            satelliteLayer.setOpacity(value / 100);
        }
    };

    const toggleMeasuring = () => {
        const newMeasuring = !measuring;
        setMeasuring(newMeasuring);

        if (map) {
            if (newMeasuring) {
                map.getContainer().style.cursor = 'crosshair';
                // setMeasurePoints([]);
            } else {
                map.getContainer().style.cursor = '';
                if (measurePath) {
                    map.removeLayer(measurePath);
                    setMeasurePath(null);
                }
            }
        }
    };

    const downloadView = () => {
        if (map) {
            const bounds = map.getBounds();
            alert(`Current view bounds: ${bounds.toBBoxString()}`);
        }
    };


    // const onMapClick = (e) => {
    //     if (measuring) {
    //         addMeasurePoint(e.latlng, mapInstance, L);
    //     } else {
    //         L.popup()
    //             .setLatLng(e.latlng)
    //             .setContent(`
    //     <strong>Location:</strong><br>
    //     Lat: ${e.latlng.lat.toFixed(6)}<br>
    //     Lng: ${e.latlng.lng.toFixed(6)}
    //   `)
    //             .openOn(mapInstance);
    //     }
    // };

    // Add measure point
    // const addMeasurePoint = (latlng, mapInstance, L) => {
    //     const newPoints = [...measurePoints, latlng];
    //     setMeasurePoints(newPoints);

    //     if (measurePath) {
    //         mapInstance.removeLayer(measurePath);
    //     }

    //     if (newPoints.length > 1) {
    //         const path = L.polyline(newPoints, { color: 'red', weight: 3 }).addTo(mapInstance);

    //         // Calculate total distance
    //         let totalDistance = 0;
    //         for (let i = 1; i < newPoints.length; i++) {
    //             totalDistance += newPoints[i - 1].distanceTo(newPoints[i]);
    //         }

    //         const distanceText = totalDistance > 1000 ?
    //             `${(totalDistance / 1000).toFixed(2)} km` :
    //             `${totalDistance.toFixed(0)} m`;

    //         path.bindPopup(`Distance: ${distanceText}`).openPopup();
    //         setMeasurePath(path);
    //     }

    //     // Add marker for the point
    //     L.circleMarker(latlng, {
    //         color: 'red',
    //         radius: 4
    //     }).addTo(mapInstance);
    // };

    return (
        <div className="relative w-full h-screen">
            {/* Map Container */}
            <div ref={mapRef} className="w-full h-full" />

            {/* Info Panel */}
            <div className="absolute top-3 right-3 bg-white bg-opacity-95 p-4 rounded-lg shadow-lg z-[1000] min-w-[200px] text-sm">
                <div className="font-bold mb-2">Coordinates (Lat, Lng):</div>
                <div><strong>Center:</strong> {coordinates.center.lat.toFixed(6)}, {coordinates.center.lng.toFixed(6)}</div>
                <div><strong>Mouse:</strong> {coordinates.mouse.lat.toFixed(6)}, {coordinates.mouse.lng.toFixed(6)}</div>
                <div><strong>Zoom Level:</strong> {coordinates.zoom.toFixed(1)}</div>
                <div><strong>Elevation:</strong> -m</div>
            </div>

            {/* Controls */}
            <div className="absolute top-3 left-16 bg-white bg-opacity-95 p-4 rounded-lg shadow-lg z-[1000]">
                <button
                    onClick={fitToSatelliteImage}
                    className="m-1 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs"
                >
                    Fit to Satellite
                </button>
                <button
                    onClick={toggleBasemap}
                    className="m-1 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs"
                >
                    Toggle Basemap
                </button>
                <button
                    onClick={toggleMeasuring}
                    className={`m-1 px-3 py-2 text-white rounded text-xs ${measuring ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
                        }`}
                >
                    {measuring ? 'Stop Measuring' : 'Measure Distance'}
                </button>
                <button
                    onClick={downloadView}
                    className="m-1 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs"
                >
                    Download View
                </button>
            </div>

            {/* Layer Controls */}
            <div className="absolute bottom-3 left-3 bg-white bg-opacity-95 p-3 rounded-lg shadow-lg z-[1000]">
                <div className="mb-3">
                    <label className="block text-xs font-bold mb-2">
                        Satellite Opacity:
                    </label>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={opacity}
                        onChange={(e) => updateOpacity(parseInt(e.target.value))}
                        className="w-full"
                    />
                    <span className="text-xs">{opacity}%</span>
                </div>

                <div>
                    <label className="block text-xs font-bold mb-2">
                        Base Layer:
                    </label>
                    <select
                        value={baseLayerType}
                        onChange={(e) => changeBaseLayer(e.target.value as ('osm' | 'satellite' | 'terrain' | 'none'))}
                        className="w-full p-1 text-xs"
                    >
                        <option value="osm">OpenStreetMap</option>
                        <option value="satellite">Satellite (ESRI)</option>
                        <option value="terrain">Terrain</option>
                        <option value="none">None</option>
                    </select>
                </div>
            </div>
        </div>
    );
};

export default SatelliteViewer;