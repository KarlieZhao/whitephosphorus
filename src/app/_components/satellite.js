import React, { useState, useEffect, useRef, useCallback } from 'react';
const SatelliteMap = () => {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  
  const TILE_SIZE = 256;
  const MAX_ZOOM = 4;
  const MIN_ZOOM = 0.5;

  // Calculate which tiles are visible in the current viewport
  const getVisibleTiles = useCallback(() => {
    if (!containerRef.current) return [];
    
    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    // Calculate the tile coordinates for the visible area
    const startTileX = Math.floor(-offset.x / (TILE_SIZE * zoom));
    const endTileX = Math.ceil((-offset.x + containerWidth) / (TILE_SIZE * zoom));
    const startTileY = Math.floor(-offset.y / (TILE_SIZE * zoom));
    const endTileY = Math.ceil((-offset.y + containerHeight) / (TILE_SIZE * zoom));
    
    const tiles = [];
    for (let x = startTileX; x <= endTileX; x++) {
      for (let y = startTileY; y <= endTileY; y++) {
        // Only include tiles that exist (positive coordinates)
        if (x >= 0 && y >= 0 && x < 8 && y < 8) {
          tiles.push({ x, y });
        }
      }
    }
    
    return tiles;
  }, [offset, zoom]);

  // Handle mouse wheel zoom
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom * zoomFactor));
    
    if (newZoom !== zoom) {
      // Zoom towards mouse position
      const zoomRatio = newZoom / zoom;
      setOffset(prev => ({
        x: mouseX - (mouseX - prev.x) * zoomRatio,
        y: mouseY - (mouseY - prev.y) * zoomRatio
      }));
      setZoom(newZoom);
    }
  }, [zoom]);

  // Handle mouse drag
  const handleMouseDown = useCallback((e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  }, [offset]);

  const handleMouseMove = useCallback((e) => {
    if (isDragging) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch events for mobile
  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({ x: touch.clientX - offset.x, y: touch.clientY - offset.y });
    }
  }, [offset]);

  const handleTouchMove = useCallback((e) => {
    if (isDragging && e.touches.length === 1) {
      e.preventDefault();
      const touch = e.touches[0];
      setOffset({
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y
      });
    }
  }, [isDragging, dragStart]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
      
      return () => {
        container.removeEventListener('wheel', handleWheel);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [handleWheel, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  const visibleTiles = getVisibleTiles();

  // Generate a placeholder tile image (in real use, you'd fetch from a tile server)
  const getTileUrl = (x, y) => {
    // This creates a simple colored tile with coordinates
    // In real implementation, this would be your tile server URL like:
    // `https://tile.server.com/${zoomLevel}/${x}/${y}.png`
    return `data:image/svg+xml,${encodeURIComponent(`
      <svg width="256" height="256" xmlns="http://www.w3.org/2000/svg">
        <rect width="256" height="256" fill="${`hsl(${(x + y) * 30 % 360}, 60%, 70%)`}"/>
        <rect width="254" height="254" x="1" y="1" fill="none" stroke="#333" stroke-width="2"/>
        <text x="128" y="120" text-anchor="middle" font-size="16" font-family="monospace">
          Tile ${x},${y}
        </text>
        <text x="128" y="140" text-anchor="middle" font-size="12" font-family="monospace">
          Zoom: ${zoom.toFixed(1)}
        </text>
      </svg>
    `)}`;
  };

  return (
    <div className="w-full h-screen bg-gray-100 relative overflow-hidden">
      {/* Controls */}
      <div className="absolute top-4 left-4 z-10 bg-white p-4 rounded-lg shadow-lg">
        <div className="space-y-2">
          <div className="text-sm font-semibold">Map Controls</div>
          <div className="text-xs text-gray-600">
            Zoom: {zoom.toFixed(2)}x
          </div>
          <div className="text-xs text-gray-600">
            Offset: ({Math.round(offset.x)}, {Math.round(offset.y)})
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setZoom(Math.min(MAX_ZOOM, zoom * 1.2))}
              className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
            >
              Zoom In
            </button>
            <button
              onClick={() => setZoom(Math.max(MIN_ZOOM, zoom * 0.8))}
              className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
            >
              Zoom Out
            </button>
          </div>
          <button
            onClick={() => {
              setZoom(1);
              setOffset({ x: 0, y: 0 });
            }}
            className="w-full px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
          >
            Reset View
          </button>
        </div>
      </div>

      {/* Tile container */}
      <div
        ref={containerRef}
        className={`w-full h-full relative ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        style={{ touchAction: 'none' }}
      >
        {/* Render visible tiles */}
        {visibleTiles.map(({ x, y }) => (
          <img
            key={`${x}-${y}`}
            src={getTileUrl(x, y)}
            alt={`Tile ${x},${y}`}
            className="absolute select-none"
            draggable={false}
            style={{
              left: offset.x + x * TILE_SIZE * zoom,
              top: offset.y + y * TILE_SIZE * zoom,
              width: TILE_SIZE * zoom,
              height: TILE_SIZE * zoom,
              imageRendering: zoom > 1 ? 'pixelated' : 'auto'
            }}
            onLoad={(e) => {
              // Fade in effect
              e.target.style.opacity = '1';
            }}
            onError={(e) => {
              // Handle tile loading errors
              e.target.style.backgroundColor = '#f0f0f0';
            }}
          />
        ))}
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 right-4 bg-white p-3 rounded-lg shadow-lg text-xs text-gray-600 max-w-48">
        <div className="font-semibold mb-1">Instructions:</div>
        <div>• Drag to pan around</div>
        <div>• Mouse wheel to zoom</div>
        <div>• Touch and drag on mobile</div>
        <div>• Only visible tiles are rendered</div>
      </div>
    </div>
  );
};

export default SatelliteMap;