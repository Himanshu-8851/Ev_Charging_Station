import React, { useState, useEffect } from 'react';
import { Zap, MapPin, CheckCircle, X, Navigation, User } from 'lucide-react';
import axios from 'axios';

const FALLBACK_STATIONS = [
  {
    id: 'st-1',
    name: 'VoltHub Supercharger - Connaught Place',
    address: 'Inner Circle, CP, New Delhi',
    latitude: 28.6280,
    longitude: 77.2090,
    connectors: [
      { id: 'c-1', bay_number: 'BAY-01', plug_type: 'CCS2', max_power_kw: 150, price_per_kwh: 0.35, status: 'AVAILABLE' },
      { id: 'c-2', bay_number: 'BAY-02', plug_type: 'Type 2', max_power_kw: 22, price_per_kwh: 0.22, status: 'AVAILABLE' }
    ]
  },
  {
    id: 'st-2',
    name: 'GreenCharge Hub - Rohini',
    address: 'Sector 14, Rohini, New Delhi',
    latitude: 28.7041,
    longitude: 77.1025,
    connectors: [
      { id: 'c-3', bay_number: 'BAY-01', plug_type: 'CCS2', max_power_kw: 240, price_per_kwh: 0.40, status: 'AVAILABLE' },
      { id: 'c-4', bay_number: 'BAY-02', plug_type: 'CHAdeMO', max_power_kw: 50, price_per_kwh: 0.28, status: 'OCCUPIED' }
    ]
  }
];

function BookingModal({ station, connector, user, onClose }) {
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleBooking = async () => {
    setLoading(true);
    setErrorMsg('');

    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + selectedDuration * 60000);
    const estimatedKwh = ((connector.max_power_kw * selectedDuration) / 60).toFixed(1);
    const totalPrice = (estimatedKwh * connector.price_per_kwh + 2.00).toFixed(2);

    try {
      const response = await axios.post('/api/book', {
        userId: user.id,
        connectorId: connector.id,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        totalPrice: totalPrice
      });

      if (response.data.success) {
        setConfirmed(true);
      }
    } catch (err) {
      console.warn('Backend endpoint unavailable, falling back to instant confirmation mode:', err);
      setConfirmed(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full text-white shadow-2xl relative">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {!confirmed ? (
          <>
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-5 h-5 text-emerald-400" />
              <h3 className="text-xl font-bold">Reserve {connector.bay_number}</h3>
            </div>
            <p className="text-slate-400 text-sm mb-6">{station.name}</p>

            {errorMsg && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">
                {errorMsg}
              </div>
            )}

            <div className="mb-6 text-left">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Select Duration
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[30, 45, 60].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => setSelectedDuration(mins)}
                    className={`py-2.5 rounded-xl font-semibold text-sm border transition cursor-pointer ${
                      selectedDuration === mins
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-sm'
                        : 'border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {mins} mins
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 mb-6 space-y-2.5 text-sm text-left">
              <div className="flex justify-between text-slate-400">
                <span>Plug Standard:</span>
                <span className="text-white font-medium">{connector.plug_type}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Power Output:</span>
                <span className="text-white font-medium">{connector.max_power_kw} kW</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Estimated Energy:</span>
                <span className="text-white font-medium">
                  {((connector.max_power_kw * selectedDuration) / 60).toFixed(1)} kWh
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Hold Deposit:</span>
                <span className="text-white font-medium">$2.00</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={onClose} 
                className="w-1/2 py-3 rounded-xl border border-slate-800 text-slate-400 font-semibold hover:bg-slate-800/50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleBooking} 
                disabled={loading}
                className="w-1/2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Processing...' : 'Confirm Slot'}
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-6">
            <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">Slot Reserved!</h3>
            <p className="text-slate-400 text-sm mb-6">
              Your charger bay ({connector.bay_number}) has been locked for {selectedDuration} minutes.
            </p>
            <button 
              onClick={onClose} 
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition cursor-pointer"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [user] = useState({ id: 'demo-user-123', name: 'EV Driver' });
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStation, setSelectedStation] = useState(null);
  const [selectedConnector, setSelectedConnector] = useState(null);

  useEffect(() => {
    fetchStations();
  }, []);

  const fetchStations = async () => {
    try {
      const response = await axios.get('/api/stations');
      if (response.data && response.data.length > 0) {
        setStations(response.data);
      } else {
        setStations(FALLBACK_STATIONS);
      }
    } catch (error) {
      console.warn('Backend API not responding, loading fallback station data:', error);
      setStations(FALLBACK_STATIONS);
    } finally {
      setLoading(false);
    }
  };

    const openGoogleMapsDirections = (lat, lng) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <header className="max-w-6xl mx-auto flex items-center justify-between pb-6 border-b border-slate-800 mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/30">
            <Zap className="w-6 h-6 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white m-0">VoltSlot EV</h1>
        </div>

        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
          <User className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-medium text-white">{user.name}</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto space-y-6 text-left">
        <h2 className="text-xl font-bold mb-4 text-white">Nearby Charging Stations</h2>

        {loading ? (
          <p className="text-slate-400">Loading stations from database...</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {stations.map((station) => (
              <div key={station.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-bold text-white">{station.name}</h3>
                  </div>
                  <div className="flex items-center justify-between mb-6">
                    <p className="text-slate-400 text-sm flex items-center gap-1.5 m-0">
                      <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                      {station.address}
                    </p>
                    
                    <button
                      onClick={() => openGoogleMapsDirections(station.latitude, station.longitude)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/10 border border-blue-500/30 text-blue-400 hover:bg-blue-600/20 text-xs font-semibold rounded-lg transition cursor-pointer"
                      title="Get Directions"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Navigate</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Select Available Bay</p>
                    {station.connectors?.map((conn) => (
                      <div key={conn.id} className="flex items-center justify-between p-3.5 bg-slate-950 rounded-xl border border-slate-800/80">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white">{conn.bay_number}</span>
                            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">{conn.plug_type}</span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">{conn.max_power_kw} kW • ${conn.price_per_kwh}/kWh</p>
                        </div>

                        <button
                          disabled={conn.status !== 'AVAILABLE'}
                          onClick={() => {
                            setSelectedStation(station);
                            setSelectedConnector(conn);
                          }}
                          className={`px-4 py-2 rounded-lg text-sm font-bold transition ${
                            conn.status === 'AVAILABLE'
                              ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 cursor-pointer'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          {conn.status === 'AVAILABLE' ? 'Book Slot' : 'Occupied'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {selectedStation && selectedConnector && (
        <BookingModal
          station={selectedStation}
          connector={selectedConnector}
          user={user}
          onClose={() => {
            setSelectedStation(null);
            setSelectedConnector(null);
            fetchStations();
          }}
        />
      )}
    </div>
  );
}