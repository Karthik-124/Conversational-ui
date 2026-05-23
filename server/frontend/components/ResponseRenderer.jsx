/**
  ResponseRenderer Component
  
 -Renders message content based on type (text, md, poi, choice).
 -Wraps content in appropriate message bubble styling.
 */
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer
} from "recharts";
import React from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';

// Fix Leaflet marker icons broken by Vite production build
import markerIconPng from 'leaflet/dist/images/marker-icon.png';
import markerIconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadowPng from 'leaflet/dist/images/marker-shadow.png';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl:       markerIconPng,
  iconRetinaUrl: markerIconRetina,
  shadowUrl:     markerShadowPng,
});


function ResponseRenderer({ message, sender, type,source }) {
  console.log("Global Recharts object:", window.Recharts);
  const wrapperClass = sender === 'user' ? 'chat-message-user' : 'chat-message-robot';
  const mapRef = React.useRef(null);
  const mapInstanceRef = React.useRef(null);
  const [selectedOption, setSelectedOption] = React.useState('');

  React.useEffect(() => {
    if (type === 'poi' && mapRef.current && !mapInstanceRef.current) {
      renderPOIMap();
    }

    if (type === 'polygon' && mapRef.current && !mapInstanceRef.current) {
      renderPolygonMap();  
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [type, message]);

  const renderPOIMap = () => {
    try {
      const poiData = typeof message === 'string' ? JSON.parse(message) : message;
      const locations = poiData.locations || [];
      const zoom = poiData.zoom || 13;

      if (!Array.isArray(locations) || locations.length === 0) {
        console.error("No valid locations");
        return;
      }

      const avgLat = locations.reduce((sum, loc) => sum + loc.lat, 0) / locations.length;
      const avgLng = locations.reduce((sum, loc) => sum + loc.lng, 0) / locations.length;

      const map = L.map(mapRef.current, {
        scrollWheelZoom: true,
        dragging: true,
        tap: false
      }).setView([avgLat, avgLng], zoom);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
      }).addTo(map);

      locations.forEach((location) => {
        // Popup content differs based on source (agriguard vs echo-bot)
        const isAgriguard = source === 'agriguard';

        let popupContent;
        if (isAgriguard) {
          // Dynamically render ALL fields
          const rows = Object.entries(location)
            .filter(([key]) => key !== 'lng')   // lng is internal for Leaflet, lon already shown
            .map(([key, val]) => {
              if (val == null || val === '') return '';
              const label = key
                .replace(/_/g, ' ')
                .replace(/([a-z])([A-Z])/g, '$1 $2')
                .replace(/\b\w/g, c => c.toUpperCase());
              const display = typeof val === 'number' ? val.toLocaleString() : val;
              return `<div style="margin-bottom:4px;">
                <span style="color:#666; font-size:12px;">${label}:</span>
                <span style="font-size:12px; font-weight:500;"> ${display}</span>
              </div>`;
            }).join('');

          popupContent = `
            <div style="font-family: sans-serif; min-width: 180px; max-width: 260px;">
              ${rows || '<em style="color:#999;font-size:12px;">No data</em>'}
            </div>`;
        } else {
          popupContent = `
            <div>
              <strong>${location.label}</strong><br>
              ${location.loctype ? `<em>${location.loctype}</em>` : ''}
            </div>`;
        }

        const marker = L.marker([location.lat, location.lng]).addTo(map);
        marker.bindPopup(popupContent);
        // No tooltip — marker shows nothing until clicked
      });


      setTimeout(() => map.invalidateSize(), 100);
      setTimeout(() => map.invalidateSize(), 300);

      mapInstanceRef.current = map;
    } catch (error) {
      console.error("Map error:", error);
    }
  };

  const renderPOI = () => {
    return <div ref={mapRef} className="map-container"></div>;
  };

  const renderChoice = () => {
    try {
      const choiceData = typeof message === 'string' ? JSON.parse(message) : message;
      const groupName = `choice-${Math.random().toString(36).substr(2, 9)}`;
      return (
        <div className="choice-container">
          <span className="choice-question">{choiceData.text}</span>
          {choiceData.options.map((option, idx) => (
            <div key={idx} className="choice-option">
              <input
                type="radio"
                id={`${groupName}-${idx}`}
                name={groupName}
                value={option}
                checked={selectedOption === option}
                onChange={(e) => setSelectedOption(e.target.value)}
              />
              <label htmlFor={`${groupName}-${idx}`}>{option}</label>
            </div>
          ))}
        </div>
      );
    } catch {
      return <span>{message}</span>;
    }
  };

  const renderMarkdown = () => {
    return <div dangerouslySetInnerHTML={{ __html: message }} />;
  };

  const renderText = () => {
    if (message == null) return null;
    // Guard: if message is an object, pretty-print it instead of crashing
    if (typeof message === 'object') {
      return <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '13px' }}>
        {JSON.stringify(message, null, 2)}
      </pre>;
    }
    return <span>{message}</span>;
  };
  const renderChart = () => {
  try {
    const chartData = typeof message === "string" ? JSON.parse(message) : message;
    const data = chartData.data || [];
    const title = chartData.title || "Data Visualization"; 

    const chartWrapper = (chartComponent) => (
      <div className="chart-container">
        <h4 className="chart-title">{title}</h4>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            {chartComponent}
          </ResponsiveContainer>
        </div>
      </div>
    );

    if (chartData.chartType === 'line') {
      return chartWrapper(
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis dataKey="name" stroke="#888" fontSize={12} />
          <YAxis stroke="#888" fontSize={12} />
          <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: 'none', borderRadius: '8px' }} />
          <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} dot={{ r: 4 }} />
        </LineChart>
      );
    }
      if (chartData.chartType === 'bar') {
      return chartWrapper(
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis dataKey="name" stroke="#888" />
          <YAxis stroke="#888" />
          <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: 'none' }} />
          <Bar dataKey="value" fill="#8884d8" radius={[4, 4, 0, 0]} />
        </BarChart>
      );
    }
    if (chartData.chartType === 'pie') {
      const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
      return chartWrapper(
        <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: 'none', borderRadius: '8px' }} />
        </PieChart>
      );
    }
    
    return <span>{message}</span>;
  } catch (error) {
    console.error("Chart error:", error);
    return <span>{message}</span>;
  }
};
const renderTable = () => {
  try {
    const tableData = typeof message === 'string' ? JSON.parse(message) : message;
    const columns = tableData.columns || Object.keys(tableData.rows[0] || {});
    const title = tableData.title || "Data Table";

    return (
      <div className="table-container">
        <h4 className="chart-title">{title}</h4>
        <div className="table-wrapper">
          <table className="dashboard-table">
            <thead>
              <tr>{columns.map((col, i) => <th key={i}>{col}</th>)}</tr>
            </thead>
            <tbody>
              {tableData.rows.map((row, i) => (
                <tr key={i}>
                  {columns.map((col, j) => <td key={j}>{row[col]}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  } catch (e) { return <span>{message}</span>; }
};

const renderPolygonMap = () => {
  try {
    const polygonData = typeof message === 'string' ? JSON.parse(message) : message;
    const polygons = polygonData.polygons || [];
    const interactive = polygonData.interactive || false;
    const locations = polygonData.locations || [];
    const zoom = polygonData.zoom || 13;

    // Calculate center from polygons, or fall back to payload center / default
    const DEFAULT_CENTER = [13.5482, 80.0273];

    let centerLat, centerLng;

    if (polygons.length > 0) {
      let allLats = [];
      let allLngs = [];
      polygons.forEach(polygon => {
        polygon.coordinates.forEach(coord => {
          allLats.push(coord[0]);
          allLngs.push(coord[1]);
        });
      });
      centerLat = allLats.reduce((a, b) => a + b) / allLats.length;
      centerLng = allLngs.reduce((a, b) => a + b) / allLngs.length;
    } else if (polygonData.center) {
      centerLat = polygonData.center.lat ?? polygonData.center[0];
      centerLng = polygonData.center.lng ?? polygonData.center[1];
    } else {
      [centerLat, centerLng] = DEFAULT_CENTER;
    }

    const map = L.map(mapRef.current, {
      scrollWheelZoom: true,
      doubleClickZoom: false,
      dragging: true,
      tap: false,
      touchExtend: false
    }).setView([centerLat, centerLng], zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    if (interactive) {
      addDrawingControls(map);
    }

    
    polygons.forEach((polygon) => {
      const coords = polygon.coordinates || [];
      const color = polygon.color || 'blue';
      const label = polygon.label || '';

      const poly = L.polygon(coords, {
        color: color,
        fillColor: color,
        fillOpacity: 0.2,// make 0 for transparent fill
        weight: 3
      }).addTo(map);

      if (label) {
        poly.bindPopup(`<strong>${label}</strong>`);
      }
    });

    setTimeout(() => map.invalidateSize(), 100);
    setTimeout(() => map.invalidateSize(), 300);

    mapInstanceRef.current = map;
  } catch (error) {
    console.error("Polygon map error:", error);
  }
};

const renderPolygon = () => {
  return <div ref={mapRef} className="map-container"></div>;
};

const addDrawingControls = (map) => {
  const drawnItems = new L.FeatureGroup();
  map.addLayer(drawnItems);

  const originalTouch = L.Browser.touch;
  L.Browser.touch = false;

  const drawControl = new L.Control.Draw({
    position: 'topright',
    draw: {
      polygon: {
        allowIntersection: true,
        showArea: true
      },
      polyline: false,
      circle: false,
      rectangle: false,
      marker: false,
      circlemarker: false
    },
    edit: {
      featureGroup: drawnItems,
      remove: true
    }
  });
  
  map.addControl(drawControl);

  L.Browser.touch = originalTouch;

  // Capture when polygon is created
  map.on(L.Draw.Event.CREATED, function (event) {
    const layer = event.layer;
    drawnItems.addLayer(layer);
    
    const coordinates = layer.getLatLngs()[0].map(latlng => [latlng.lat, latlng.lng]);
    
    console.log('Polygon drawn:', coordinates);
    
    
    sendPolygonToBackend(coordinates);
  });
};

const sendPolygonToBackend = async (coordinates) => {
  try {
    const response = await fetch('http://127.0.0.1:5000/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'polygon_drawn',
        message: {
          coordinates: coordinates,
          timestamp: new Date().toISOString()
        }
      })
    });
    
    const data = await response.json();
    console.log('Backend response:', data);
  } catch (error) {
    console.error('Error sending polygon:', error);
  }
};


  const renderLoading = () => (
    <div className="loading-skeleton">
      <div className="skeleton-line skeleton-line--long"></div>
      <div className="skeleton-line skeleton-line--medium"></div>
      <div className="skeleton-line skeleton-line--short"></div>
    </div>
  );

  const renderContent = () => {
    if (type === 'loading') return renderLoading();
    if (type === 'poi') return renderPOI();
    if (type==='polygon') return renderPolygon();
    if (type === 'choice') return renderChoice();
    if (type ==='chart') return renderChart();
    if (type === 'table') return renderTable();
    if (type !== 'text') return renderMarkdown();
    
    return renderText();
  };

 return (
  <div className={wrapperClass}>
    <div className={`chat-message-text ${type === 'poi' ? 'map-message' : ''}
    ${type === 'polygon' ? 'polygon-message' : ''}`}>
      {renderContent()}
      {source === 'fallback' && (
        <div style={{fontSize: '15px', color: '#999', marginTop: '5px'}}>
           Using keyword matching (Ollama unavailable)
        </div>
      )}
    </div>
  </div>
);
}
export default ResponseRenderer;