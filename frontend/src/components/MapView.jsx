import React, { useEffect, useRef } from "react";
import L from "leaflet";

export default function MapView({ clusters = [], onSelectCluster }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);

  const getHotspotColor = (score) => {
    if (score >= 80) return "#dc2626"; // Critical Red
    if (score >= 65) return "#ea580c"; // High Urgency Orange
    return "#2563eb"; // Moderate Blue
  };

  const getCircleRadius = (requests) => {
    const calculated = 12 + requests * 0.22;
    return calculated > 40 ? 40 : calculated;
  };

  // Initialize Leaflet Map once on mount
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current).setView([17.855, 83.345], 11);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Redraw hotspot circles whenever clusters update
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    clusters.forEach((cluster) => {
      const color = getHotspotColor(cluster.priority_score);
      const radius = getCircleRadius(cluster.total_requests);

      const circle = L.circleMarker([cluster.lat, cluster.lng], {
        radius: radius,
        color: color,
        fillColor: color,
        fillOpacity: 0.45,
        weight: 3,
      });

      circle.bindPopup(`
        <div style="font-family: sans-serif; min-width: 180px;">
          <div style="font-size: 11px; font-weight: 800; color: #dc2626; text-transform: uppercase;">
            Rank #${cluster.rank} • ${cluster.village} (${cluster.category})
          </div>
          <div style="font-weight: 700; font-size: 13px; margin-top: 2px;">
            ${cluster.title}
          </div>
          <div style="font-size: 12px; margin-top: 6px;">
            <b>Requests:</b> ${cluster.total_requests} citizens<br/>
            <b>Population:</b> ${cluster.population.toLocaleString()}<br/>
            <b>AI Score:</b> ${cluster.priority_score} / 100
          </div>
        </div>
      `);

      circle.on("click", () => {
        if (onSelectCluster) onSelectCluster(cluster);
      });

      circle.addTo(markersLayerRef.current);
    });
  }, [clusters, onSelectCluster]);

  return (
    <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
      <div className="px-4 py-3 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-bold text-sm uppercase tracking-wider text-amber-400">
            Live Constituency Grievance Hotspot Map (OpenStreetMap)
          </h3>
          <p className="text-xs text-slate-300">
            Bigger red circle = Higher citizen demand & urgency. Click any circle to inspect proof.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-red-600 inline-block"></span> Critical Hotspot
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-orange-600 inline-block"></span> High Priority
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-blue-600 inline-block"></span> Moderate
          </span>
        </div>
      </div>

      <div
        ref={mapContainerRef}
        className="h-[420px] w-full relative z-0"
        style={{ height: "420px", width: "100%" }}
      />
    </div>
  );
}