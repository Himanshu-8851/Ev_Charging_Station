import React, { useState } from 'react';
import axios from 'axios';
import { Clock, Zap, CheckCircle, X } from 'lucide-react';

export default function BookingModal({ station, connector, onClose }) {
  const [selectedDuration, setSelectedDuration] = useState(30); // minutes
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleBooking = async () => {
    setLoading(true);
    setErrorMsg('');

    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + selectedDuration * 60000);
    const estimatedKwh = ((connector.max_power_kw * selectedDuration) / 60).toFixed(1);
    const totalPrice = (estimatedKwh * connector.price_per_kwh + 2.00).toFixed(2); // includes $2 hold fee

    try {
      const response = await axios.post('http://localhost:5000/api/book', {
        userId: 'demo-user-123',
        connectorId: connector.id,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        totalPrice: totalPrice
      });

      if (response.data.success) {
        setConfirmed(true);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Booking failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full text-white shadow-2xl relative">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition"
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

            <div className="mb-6">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Select Duration
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[30, 45, 60].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => setSelectedDuration(mins)}
                    className={`py-2.5 rounded-xl font-semibold text-sm border transition ${
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

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 mb-6 space-y-2.5 text-sm">
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
                className="w-1/2 py-3 rounded-xl border border-slate-800 text-slate-400 font-semibold hover:bg-slate-800/50 transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleBooking} 
                disabled={loading}
                className="w-1/2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition disabled:opacity-50"
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
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}