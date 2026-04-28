import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMapEvents, GeoJSON } from 'react-leaflet';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import axios from 'axios';
import { MapPin, Navigation, Clock, Activity, Settings2 } from 'lucide-react';
import L from 'leaflet';
import './App.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const API_BASE = 'https://rideshare-kdtree.onrender.com/api';
const DELHI_CENTER = [28.60, 77.10];

const svgRider = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="#ef4444" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3" fill="white"/></svg>`;
const riderIcon = L.divIcon({
  className: 'bg-transparent',
  html: `<div class="rider-pulse" style="width: 36px; height: 36px;">${svgRider}</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36]
});

const svgDriver = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="#3b82f6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 13v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>`;
const driverIcon = L.divIcon({
  className: 'bg-transparent',
  html: `<div class="driver-entrance" style="width: 28px; height: 28px;">${svgDriver}</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14]
});

const svgClosestDriver = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="#eab308" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 13v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>`;
const closestDriverIcon = L.divIcon({
  className: 'bg-transparent',
  html: `<div class="driver-entrance" style="width: 36px; height: 36px; filter: drop-shadow(0 0 10px rgba(234, 179, 8, 0.8));">${svgClosestDriver}</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18]
});

function LocationMarker({ position, setPosition, fetchNearest, fetchRange, mode, k, radius }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
      if (mode === 'knn') {
        fetchNearest(e.latlng.lat, e.latlng.lng, k);
      } else {
        fetchRange(e.latlng.lat, e.latlng.lng, radius);
      }
    },
  });

  return position === null ? null : (
    <Marker position={position} icon={riderIcon}>
      <Popup>
        <strong>Rider Location</strong><br/>
        Lat: {position[0].toFixed(5)}<br/>
        Lng: {position[1].toFixed(5)}
      </Popup>
    </Marker>
  );
}

function App() {
  const [position, setPosition] = useState(DELHI_CENTER);
  const [drivers, setDrivers] = useState([]);
  const [foundCount, setFoundCount] = useState(0);
  const [partitions, setPartitions] = useState([]);
  const [showPartitions, setShowPartitions] = useState(false);
  const [mode, setMode] = useState('knn');
  const [k, setK] = useState(5);
  const [radius, setRadius] = useState(0.02);
  const [timings, setTimings] = useState({ kd: 0, brute: 0 });
  const [stats, setStats] = useState({ total: 100000 });
  const [isSimulating, setIsSimulating] = useState(false);
  const [routeData, setRouteData] = useState(null);

  useEffect(() => {
    fetchStats();
    fetchPartitions();
  }, []);

  useEffect(() => {
    let interval;
    if (isSimulating) {
      interval = setInterval(() => {
        simulateMovement();
        if (position) {
          if (mode === 'knn') fetchNearest(position[0], position[1], k);
          else fetchRange(position[0], position[1], radius);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isSimulating, position, mode, k, radius]);

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API_BASE}/stats`);
      setStats({ total: res.data.total_drivers });
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPartitions = async () => {
    try {
      const res = await axios.get(`${API_BASE}/partitions?max_depth=6`);
      setPartitions(res.data.partitions);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRouteForDriver = async (startLat, startLng, driverLat, driverLng) => {
    try {
      const res = await axios.get(`https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${driverLng},${driverLat}?overview=full&geometries=geojson`);
      if (res.data.routes && res.data.routes.length > 0) {
        return {
          geometry: res.data.routes[0].geometry,
          drivingDistance: res.data.routes[0].distance,
          drivingDuration: res.data.routes[0].duration
        };
      }
    } catch(e) {
      console.error(e);
    }
    return { geometry: null, drivingDistance: Infinity, drivingDuration: Infinity };
  };

  const rerankDrivers = async (lat, lng, fetchedDrivers) => {
    if (fetchedDrivers.length === 0) return fetchedDrivers;

    // Step 2: Send top 5 candidates to OSRM routing engine
    const candidates = fetchedDrivers.slice(0, 5);
    const rest = fetchedDrivers.slice(5);

    const routedCandidates = await Promise.all(candidates.map(async (d) => {
      const routeInfo = await fetchRouteForDriver(lat, lng, d.driver.lat, d.driver.lng);
      return {
        ...d,
        routeGeometry: routeInfo.geometry,
        drivingDistance: routeInfo.drivingDistance,
        drivingDuration: routeInfo.drivingDuration
      };
    }));

    // Re-sort candidates by true Road Distance
    routedCandidates.sort((a, b) => a.drivingDistance - b.drivingDistance);

    return [...routedCandidates, ...rest];
  };

  const fetchNearest = async (lat, lng, kVal) => {
    try {
      const res = await axios.get(`${API_BASE}/search?lat=${lat}&lng=${lng}&k=${kVal}`);
      
      const rerankedDrivers = await rerankDrivers(lat, lng, res.data.results);
      
      setDrivers(rerankedDrivers);
      setFoundCount(res.data.results.length);
      setTimings({ kd: res.data.kd_time_ms, brute: res.data.brute_time_ms });
      
      if (rerankedDrivers.length > 0 && rerankedDrivers[0].routeGeometry) {
        setRouteData(rerankedDrivers[0].routeGeometry);
      } else {
        setRouteData(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRange = async (lat, lng, rad) => {
    try {
      const res = await axios.get(`${API_BASE}/range?lat=${lat}&lng=${lng}&radius=${rad}`);
      
      const rerankedDrivers = await rerankDrivers(lat, lng, res.data.results);
      
      setDrivers(rerankedDrivers);
      setFoundCount(res.data.count);
      setTimings({ kd: res.data.kd_time_ms, brute: res.data.brute_time_ms });

      if (rerankedDrivers.length > 0 && rerankedDrivers[0].routeGeometry) {
        setRouteData(rerankedDrivers[0].routeGeometry);
      } else {
        setRouteData(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const simulateMovement = async () => {
    try {
      await axios.post(`${API_BASE}/simulate`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    if (position) {
      if (newMode === 'knn') fetchNearest(position[0], position[1], k);
      else fetchRange(position[0], position[1], radius);
    }
  };

  const chartData = {
    labels: ['KD-Tree', 'Brute Force'],
    datasets: [
      {
        label: 'Execution Time (ms)',
        data: [timings.kd, timings.brute],
        backgroundColor: ['rgba(59, 130, 246, 0.8)', 'rgba(239, 68, 68, 0.8)'],
        borderColor: ['rgb(29, 78, 216)', 'rgb(185, 28, 28)'],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="app-container">
      {/* Sidebar Controls */}
      <div className="sidebar glass-panel">
        <div className="header">
          <Activity size={28} className="icon-blue" />
          <h2>RideShare KD-Tree</h2>
        </div>

        <div className="control-group">
          <h3><Settings2 size={16} /> Search Mode</h3>
          <div className="toggle-group">
            <button 
              className={`toggle-btn ${mode === 'knn' ? 'active' : ''}`}
              onClick={() => handleModeChange('knn')}
            >
              K-Nearest
            </button>
            <button 
              className={`toggle-btn ${mode === 'range' ? 'active' : ''}`}
              onClick={() => handleModeChange('range')}
            >
              Range Search
            </button>
          </div>
        </div>

        {mode === 'knn' && (
          <div className="control-group">
            <label>Drivers to find (K): {k}</label>
            <input 
              type="range" min="1" max="50" value={k} 
              onChange={(e) => {
                setK(Number(e.target.value));
                if(position) fetchNearest(position[0], position[1], e.target.value);
              }} 
            />
          </div>
        )}

        {mode === 'range' && (
          <div className="control-group">
            <label>Radius (degrees): {radius}</label>
            <input 
              type="range" min="0.005" max="0.1" step="0.005" value={radius} 
              onChange={(e) => {
                setRadius(Number(e.target.value));
                if(position) fetchRange(position[0], position[1], e.target.value);
              }} 
            />
          </div>
        )}

        <div className="control-group">
          <label className="checkbox-label">
            <input 
              type="checkbox" 
              checked={showPartitions} 
              onChange={(e) => setShowPartitions(e.target.checked)} 
            />
            Show KD-Tree Partitions
          </label>
        </div>

        <button 
          className={`simulate-btn ${isSimulating ? 'active' : ''}`}
          onClick={() => setIsSimulating(!isSimulating)}
        >
          {isSimulating ? 'Stop Simulation' : 'Start Live Simulation'}
        </button>

        <div className="stats-box">
          <div className="stat-row">
            <Navigation size={16}/> Total Drivers: {stats.total.toLocaleString()}
          </div>
          <div className="stat-row">
            <MapPin size={16}/> Found: {foundCount} {foundCount > drivers.length ? `(Showing nearest ${drivers.length})` : ''}
          </div>
        </div>

        <div className="chart-container">
          <h3><Clock size={16} /> Performance</h3>
          <Bar data={chartData} options={{ responsive: true, scales: { y: { beginAtZero: true } } }} />
          <p className="speedup">
            KD-Tree is <b>{timings.brute > 0 && timings.kd > 0 ? (timings.brute / timings.kd).toFixed(1) : 0}x</b> faster
          </p>
        </div>
      </div>

      {/* Map Area */}
      <div className="map-area">
        <MapContainer center={DELHI_CENTER} zoom={10} className="map-view">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker 
            position={position} 
            setPosition={setPosition} 
            fetchNearest={fetchNearest} 
            fetchRange={fetchRange} 
            mode={mode} k={k} radius={radius} 
          />
          
          {drivers.map((d, i) => (
            <Marker 
              key={d.driver.id} 
              position={[d.driver.lat, d.driver.lng]} 
              icon={i === 0 ? closestDriverIcon : driverIcon}
              zIndexOffset={i === 0 ? 1000 : 0}
            >
              <Popup>
                <strong>{i === 0 ? `🏆 Closest Driver (#${d.driver.id})` : `Driver #${d.driver.id}`}</strong><br/>
                Lat: {d.driver.lat.toFixed(5)}<br/>
                Lng: {d.driver.lng.toFixed(5)}<br/>
                Air Distance: {d.distance.toFixed(4)}°<br/>
                {d.drivingDistance !== undefined && d.drivingDistance !== Infinity && (
                  <>Road Distance: {(d.drivingDistance / 1000).toFixed(2)} km</>
                )}
              </Popup>
            </Marker>
          ))}

          {mode === 'range' && position && (
            <Circle center={position} radius={radius * 111000} pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.1 }} />
          )}

          {showPartitions && partitions.map((p, i) => {
            const positions = p.axis === 0 
              ? [[p.value, p.min_val_other], [p.value, p.max_val_other]] 
              : [[p.min_val_other, p.value], [p.max_val_other, p.value]]; 
            
            return <Polyline key={i} positions={positions} color="rgba(220, 38, 38, 0.4)" weight={2} />;
          })}

          {routeData && (
            <GeoJSON 
              key={JSON.stringify(routeData)} 
              data={routeData} 
              style={{ color: '#eab308', weight: 4, opacity: 0.8 }} 
            />
          )}
        </MapContainer>
        <div className="instructions glass-panel">
          👆 Click anywhere on the map to set rider location
        </div>
      </div>
    </div>
  );
}

export default App;
