import React, { useState } from 'react';
import { X, MapPin, Navigation, Compass, Check, Search, Crosshair } from 'lucide-react';
import { DeliveryAddress, Language, Coordinates } from '../types';
import { translations, MALAYSIAN_PRESET_LOCATIONS } from '../data/translations';

interface DeliveryMapPickerProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  currentAddress: DeliveryAddress;
  onSelectAddress: (address: DeliveryAddress) => void;
}

export const DeliveryMapPicker: React.FC<DeliveryMapPickerProps> = ({
  isOpen,
  onClose,
  language,
  currentAddress,
  onSelectAddress,
}) => {
  const t = translations[language];
  const [coords, setCoords] = useState<Coordinates>(currentAddress.coordinates || { lat: 3.1390, lng: 101.6869 });
  const [street, setStreet] = useState(currentAddress.street || 'Jalan Ampang');
  const [unit, setUnit] = useState(currentAddress.buildingUnit || 'Unit 12-3A, Residensi');
  const [postcode, setPostcode] = useState(currentAddress.postcode || '50450');
  const [city, setCity] = useState(currentAddress.city || 'Kuala Lumpur');
  const [state, setState] = useState(currentAddress.state || 'Wilayah Persekutuan Kuala Lumpur');
  const [recipientName, setRecipientName] = useState(currentAddress.recipientName || 'Al-Mehdhar');
  const [phone, setPhone] = useState(currentAddress.phone || '012-3849120');
  const [notes, setNotes] = useState(currentAddress.notes || 'Please leave at door / gate');
  const [isLocating, setIsLocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  // Handle map click to drop pin
  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Convert relative X/Y to minor lat/lng variance around current center
    const xRatio = (x / rect.width) - 0.5;
    const yRatio = (y / rect.height) - 0.5;
    
    const newLat = Number((coords.lat - yRatio * 0.02).toFixed(6));
    const newLng = Number((coords.lng + xRatio * 0.02).toFixed(6));
    
    setCoords({ lat: newLat, lng: newLng });
  };

  const handleUseGPS = () => {
    if (!navigator.geolocation) {
      alert(language === 'en' ? 'Geolocation is not supported by your browser' : 'Geolokasi tidak disokong pelayar anda');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));
        setCoords({ lat, lng });
        setStreet('Current GPS Location, Malaysia');
      },
      () => {
        setIsLocating(false);
        // Fallback default to KLCC
        setCoords({ lat: 3.1579, lng: 101.7116 });
        setCity('Kuala Lumpur');
      },
      { timeout: 8000 }
    );
  };

  const handleSelectPreset = (preset: typeof MALAYSIAN_PRESET_LOCATIONS[0]) => {
    setCoords({ lat: preset.coordinates.lat, lng: preset.coordinates.lng });
    setStreet(preset.street);
    setCity(preset.city);
    setState(preset.state);
    setPostcode(preset.postcode);
  };

  const handleSave = () => {
    const updated: DeliveryAddress = {
      recipientName: recipientName.trim(),
      phone: phone.trim(),
      street: street.trim(),
      buildingUnit: unit.trim(),
      postcode: postcode.trim(),
      city: city.trim(),
      state: state.trim(),
      notes: notes.trim(),
      coordinates: coords,
      formattedAddress: `${unit ? unit + ', ' : ''}${street}, ${postcode} ${city}, ${state}`
    };
    onSelectAddress(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-emerald-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-200" />
            <div>
              <h3 className="font-bold text-base leading-snug">
                {t.selectLocation}
              </h3>
              <p className="text-[11px] text-emerald-100">
                {t.mapPinInstruction}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* Quick presets in Malaysia */}
          <div>
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
              {language === 'en' ? 'Quick Malaysian Presets' : 'Kawasan Pantas Malaysia'}
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar text-xs">
              {MALAYSIAN_PRESET_LOCATIONS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className="px-2.5 py-1 rounded-full whitespace-nowrap bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-medium transition-colors text-[11px]"
                >
                  📍 {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Google Map Mock Canvas */}
          <div className="relative rounded-xl overflow-hidden border-2 border-emerald-500/40 bg-slate-100 shadow-inner select-none h-60 sm:h-72">
            {/* Map Canvas Background with Roads & Landmarks styling */}
            <div
              onClick={handleMapClick}
              className="absolute inset-0 cursor-crosshair bg-[#e5e3df] overflow-hidden"
              style={{
                backgroundImage: `
                  linear-gradient(to right, #cfd8dc 1px, transparent 1px),
                  linear-gradient(to bottom, #cfd8dc 1px, transparent 1px),
                  radial-gradient(circle at 50% 50%, #d5e8d4 30%, transparent 60%)
                `,
                backgroundSize: '40px 40px, 40px 40px, 100% 100%'
              }}
            >
              {/* Simulated Malaysian Highway & Green Park areas */}
              <div className="absolute top-1/4 left-0 right-0 h-4 bg-[#fcd34d] opacity-70 border-y border-amber-500 transform -rotate-6" />
              <div className="absolute top-0 bottom-0 left-1/3 w-3 bg-[#ffffff] opacity-90 border-x border-gray-400 transform rotate-12" />
              <div className="absolute top-0 bottom-0 right-1/4 w-3 bg-[#ffffff] opacity-90 border-x border-gray-400" />
              <div className="absolute top-8 right-8 w-24 h-20 rounded-2xl bg-emerald-200/60 border border-emerald-300 flex items-center justify-center text-[10px] text-emerald-800 font-bold rotate-6">
                🌳 Taman Awam
              </div>
              <div className="absolute bottom-6 left-8 w-32 h-16 rounded-xl bg-blue-100/70 border border-blue-200 flex items-center justify-center text-[10px] text-blue-800 font-bold">
                🌊 Sungai Klang
              </div>

              {/* Center Crosshair Pin */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full flex flex-col items-center pointer-events-none drop-shadow-lg z-10 transition-transform">
                <div className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md whitespace-nowrap mb-0.5 border border-white">
                  📍 {street || 'Delivery Spot'}
                </div>
                <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg border-2 border-white ring-4 ring-red-500/20">
                  <MapPin className="w-5 h-5 fill-white text-red-600" />
                </div>
                <div className="w-2 h-2 rounded-full bg-red-800 -mt-1 opacity-75" />
              </div>
            </div>

            {/* Google Map Branding Overlay */}
            <div className="absolute bottom-2 left-2 pointer-events-none bg-white/90 px-2 py-0.5 rounded text-[10px] font-bold text-gray-600 flex items-center gap-1 shadow-xs">
              <span className="text-blue-500">G</span>
              <span className="text-red-500">o</span>
              <span className="text-amber-500">o</span>
              <span className="text-blue-500">g</span>
              <span className="text-green-500">l</span>
              <span className="text-red-500">e</span>
              <span className="text-gray-400 ml-1">Maps (Malaysia)</span>
            </div>

            {/* Controls on Map */}
            <div className="absolute top-2 right-2 flex flex-col gap-2 z-20">
              <button
                type="button"
                onClick={handleUseGPS}
                disabled={isLocating}
                className="bg-white hover:bg-emerald-50 text-gray-800 hover:text-emerald-700 p-2 rounded-lg shadow-md border border-gray-200 flex items-center gap-1.5 text-xs font-semibold transition-all"
                title={t.useCurrentLocation}
              >
                <Crosshair className={`w-4 h-4 text-emerald-600 ${isLocating ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">GPS</span>
              </button>
            </div>

            {/* Coordinates Badge */}
            <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-xs text-white px-2 py-0.5 rounded text-[10px] font-mono">
              LAT: {coords.lat.toFixed(4)} | LNG: {coords.lng.toFixed(4)}
            </div>
          </div>

          {/* Form Fields for Delivery Registration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="font-semibold text-gray-700 block mb-1">
                {t.recipientName} *
              </label>
              <input
                type="text"
                required
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm"
              />
            </div>
            <div>
              <label className="font-semibold text-gray-700 block mb-1">
                {t.recipientPhone} *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-semibold text-gray-700 block mb-1">
                {t.streetAddress} *
              </label>
              <input
                type="text"
                required
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm"
                placeholder="e.g. Jalan Kerinchi, Bangsar South"
              />
            </div>

            <div>
              <label className="font-semibold text-gray-700 block mb-1">
                {t.buildingUnit}
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm"
                placeholder="No. 18 / Tingkat 3, Blok B"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">
                  {t.postcode}
                </label>
                <input
                  type="text"
                  value={postcode}
                  onChange={(e) => setPostcode(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm"
                />
              </div>
              <div>
                <label className="font-semibold text-gray-700 block mb-1">
                  {t.city}
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="font-semibold text-gray-700 block mb-1">
                {t.deliveryNotes}
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm"
                placeholder="e.g. Tinggalkan di pondok guard / Tekan loceng"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-gray-700 hover:bg-gray-200 font-semibold text-xs transition-colors"
          >
            {t.close}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 transition-all"
          >
            <Check className="w-4 h-4" />
            <span>{language === 'en' ? 'Confirm Delivery Location' : 'Sahkan Lokasi Penghantaran'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
