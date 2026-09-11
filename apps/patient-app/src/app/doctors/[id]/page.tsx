'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';

const API_URL = 'http://localhost:3000/api/v1';

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  bio: string | null;
  consultationFee: string;
  slotDurationMins: number;
  departments: { department: { id: string; name: string } }[];
}

interface Slot {
  id: string | null;
  startTime: string;
  endTime: string;
  isBooked: boolean;
}

interface SlotData {
  date: string;
  isUnavailable: boolean;
  reason?: string;
  slotDurationMins?: number;
  slots: Slot[];
}

export default function DoctorBookingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [doctorLoading, setDoctorLoading] = useState(true);

  // Date selection state
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [slotData, setSlotData] = useState<SlotData | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [error, setError] = useState('');

  // Booking Modal State
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingReason, setBookingReason] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');

  const handleOpenBooking = () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      window.location.href = `/login?redirect=/doctors/${id}`;
      return;
    }
    setBookingError('');
    setShowBookingModal(true);
  };

  const handleConfirmBooking = async () => {
    if (!selectedSlot) return;
    const token = localStorage.getItem('accessToken');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    setBookingLoading(true);
    setBookingError('');

    try {
      const idempotencyKey = `book_${id}_${selectedSlot.startTime}_${Date.now()}`;
      const res = await fetch(`${API_URL}/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          doctorId: id,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
          reason: bookingReason || undefined,
          idempotencyKey,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setBookingError(data.error?.message || 'Failed to book slot. Please try another slot.');
        return;
      }

      // Success -> Redirect to Appointments Dashboard
      window.location.href = '/appointments';
    } catch {
      setBookingError('Unable to connect to hospital servers. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  // Generate 14 days carousel starting from today
  const availableDates: { dateStr: string; dayLabel: string; dateLabel: string }[] = [];
  const baseDate = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = i === 0 ? 'Today' : i === 1 ? 'Tmrw' : d.toLocaleDateString('en-US', { weekday: 'short' });
    const dateLabel = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    availableDates.push({ dateStr, dayLabel, dateLabel });
  }

  // Load Doctor Details
  useEffect(() => {
    async function loadDoctor() {
      try {
        setDoctorLoading(true);
        const res = await fetch(`${API_URL}/doctors/${id}`);
        const data = await res.json();
        if (data.success) {
          setDoctor(data.data);
        } else {
          setError(data.error?.message || 'Doctor not found');
        }
      } catch {
        setError('Failed to fetch doctor profile');
      } finally {
        setDoctorLoading(false);
      }
    }
    loadDoctor();
  }, [id]);

  // Load Slots whenever date changes
  useEffect(() => {
    async function loadSlots() {
      try {
        setSlotsLoading(true);
        setSelectedSlot(null);
        const res = await fetch(`${API_URL}/scheduling/slots?doctorId=${id}&date=${selectedDate}`);
        const data = await res.json();
        if (data.success) {
          setSlotData(data.data);
        }
      } catch {
        // Fallback
      } finally {
        setSlotsLoading(false);
      }
    }
    loadSlots();
  }, [id, selectedDate]);

  const formatSlotTime = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'UTC',
    });
  };

  // Group slots by time of day
  const groupSlots = (slots: Slot[]) => {
    const morning: Slot[] = [];
    const afternoon: Slot[] = [];
    const evening: Slot[] = [];

    slots.forEach((s) => {
      const hour = new Date(s.startTime).getUTCHours();
      if (hour < 12) {
        morning.push(s);
      } else if (hour < 16) {
        afternoon.push(s);
      } else {
        evening.push(s);
      }
    });

    return { morning, afternoon, evening };
  };

  if (doctorLoading) {
    return (
      <main className="page-content">
        <div className="container" style={{ paddingTop: 'var(--space-8)' }}>
          <div className="skeleton" style={{ height: '140px', borderRadius: 'var(--radius-xl)', marginBottom: 'var(--space-6)' }} />
          <div className="skeleton" style={{ height: '70px', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-6)' }} />
          <div className="skeleton" style={{ height: '240px', borderRadius: 'var(--radius-xl)' }} />
        </div>
      </main>
    );
  }

  if (error || !doctor) {
    return (
      <main className="page-content">
        <div className="container" style={{ paddingTop: 'var(--space-8)' }}>
          <Link href="/departments" style={{ fontSize: 'var(--font-size-sm)' }}>← Back to departments</Link>
          <div className="status-badge badge-danger" style={{ marginTop: 'var(--space-4)', padding: 'var(--space-4)' }}>
            {error || 'Doctor not found'}
          </div>
        </div>
      </main>
    );
  }

  const grouped = slotData?.slots ? groupSlots(slotData.slots) : { morning: [], afternoon: [], evening: [] };
  const availableSlotCount = slotData?.slots ? slotData.slots.filter(s => !s.isBooked).length : 0;

  return (
    <main className="page-content">
      <div className="container" style={{ paddingTop: 'var(--space-6)' }}>
        <Link href="/departments" style={{ fontSize: 'var(--font-size-sm)', display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)', marginBottom: 'var(--space-4)' }}>
          ← Back to departments
        </Link>

        {/* ─── Responsive Split Layout (Desktop 2-Col, Mobile Stacked) ─── */}
        <div className="doctor-booking-layout">
          
          {/* Left Column: Doctor Profile Card */}
          <div className="doctor-sidebar-sticky">
            <div className="doctor-header-card" style={{ flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
                <div className="doctor-avatar-lg">
                  {doctor.name.charAt(0)}
                </div>
                <div>
                  <h1 style={{ fontSize: 'var(--font-size-xl)' }}>{doctor.name}</h1>
                  <p style={{ color: 'var(--color-primary-600)', fontWeight: 'var(--font-weight-medium)', marginTop: '2px' }}>
                    {doctor.specialization}
                  </p>
                  {doctor.departments && doctor.departments[0] && (
                    <span className="dept-tag" style={{ marginTop: 'var(--space-2)' }}>
                      🏥 {doctor.departments[0].department.name}
                    </span>
                  )}
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 'var(--space-3)',
                padding: 'var(--space-3)',
                backgroundColor: 'var(--color-gray-50)',
                borderRadius: 'var(--radius-lg)',
                fontSize: 'var(--font-size-sm)',
                textAlign: 'center',
              }}>
                <div>
                  <span style={{ color: 'var(--color-gray-500)', fontSize: 'var(--font-size-xs)' }}>Consultation Fee</span>
                  <div style={{ fontWeight: 'var(--font-weight-bold)', color: 'var(--color-primary-700)', fontSize: 'var(--font-size-base)', marginTop: '2px' }}>
                    ₹{doctor.consultationFee}
                  </div>
                </div>
                <div>
                  <span style={{ color: 'var(--color-gray-500)', fontSize: 'var(--font-size-xs)' }}>Slot Duration</span>
                  <div style={{ fontWeight: 'var(--font-weight-bold)', color: 'var(--color-gray-800)', fontSize: 'var(--font-size-base)', marginTop: '2px' }}>
                    {doctor.slotDurationMins} mins
                  </div>
                </div>
              </div>

              {doctor.bio && (
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)' }}>
                  {doctor.bio}
                </p>
              )}

              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <span className="hero-pulse-dot" />
                <span>Zero Double Booking Guaranteed</span>
              </div>
            </div>
          </div>

          {/* Right Column: Date Carousel & Time Slots */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            
            {/* Date Selection Carousel */}
            <div style={{ backgroundColor: 'var(--color-white)', padding: 'var(--space-5)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                <h2 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-bold)' }}>
                  1. Select Date
                </h2>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)' }}>
                  14 Days Schedule
                </span>
              </div>

              <div className="date-pills-container">
                {availableDates.map(({ dateStr, dayLabel, dateLabel }) => {
                  const isSelected = selectedDate === dateStr;
                  return (
                    <button
                      key={dateStr}
                      className={`date-pill ${isSelected ? 'date-pill-active' : ''}`}
                      onClick={() => setSelectedDate(dateStr)}
                    >
                      <span className="date-pill-day">{dayLabel}</span>
                      <span className="date-pill-date">{dateLabel}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Slots Card */}
            <div style={{ backgroundColor: 'var(--color-white)', padding: 'var(--space-6)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                <h2 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-bold)' }}>
                  2. Choose Available Slot
                </h2>
                {!slotsLoading && slotData && !slotData.isUnavailable && (
                  <span className="status-badge badge-primary">
                    {availableSlotCount} Available
                  </span>
                )}
              </div>

              {slotsLoading ? (
                <div className="slot-grid">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={i} className="skeleton" style={{ height: '52px', borderRadius: 'var(--radius-lg)' }} />
                  ))}
                </div>
              ) : slotData?.isUnavailable ? (
                <div className="slot-unavailable-card">
                  <span style={{ fontSize: '2rem' }}>🏖️</span>
                  <p style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-gray-800)', marginTop: 'var(--space-2)' }}>
                    {slotData.reason || 'No consultation slots available on this date.'}
                  </p>
                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-500)', marginTop: 'var(--space-1)' }}>
                    Doctor is off-duty or hospital is closed. Please pick another date above.
                  </p>
                </div>
              ) : slotData && slotData.slots.length > 0 ? (
                <div>
                  {/* Morning Slots */}
                  {grouped.morning.length > 0 && (
                    <div>
                      <div className="slot-section-title">
                        <span>☀️ Morning</span>
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-400)', fontWeight: 'normal' }}>
                          ({grouped.morning.filter(s => !s.isBooked).length} slots)
                        </span>
                      </div>
                      <div className="slot-grid">
                        {grouped.morning.map((slot, idx) => {
                          const isSelected = selectedSlot?.startTime === slot.startTime;
                          return (
                            <button
                              key={idx}
                              disabled={slot.isBooked}
                              className={`slot-chip ${slot.isBooked ? 'slot-chip-booked' : ''} ${isSelected ? 'slot-chip-selected' : ''}`}
                              onClick={() => setSelectedSlot(slot)}
                            >
                              <span>{formatSlotTime(slot.startTime)}</span>
                              {slot.isBooked && <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>Booked</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Afternoon Slots */}
                  {grouped.afternoon.length > 0 && (
                    <div>
                      <div className="slot-section-title">
                        <span>🌤️ Afternoon</span>
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-400)', fontWeight: 'normal' }}>
                          ({grouped.afternoon.filter(s => !s.isBooked).length} slots)
                        </span>
                      </div>
                      <div className="slot-grid">
                        {grouped.afternoon.map((slot, idx) => {
                          const isSelected = selectedSlot?.startTime === slot.startTime;
                          return (
                            <button
                              key={idx}
                              disabled={slot.isBooked}
                              className={`slot-chip ${slot.isBooked ? 'slot-chip-booked' : ''} ${isSelected ? 'slot-chip-selected' : ''}`}
                              onClick={() => setSelectedSlot(slot)}
                            >
                              <span>{formatSlotTime(slot.startTime)}</span>
                              {slot.isBooked && <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>Booked</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Evening Slots */}
                  {grouped.evening.length > 0 && (
                    <div>
                      <div className="slot-section-title">
                        <span>🌙 Evening</span>
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-400)', fontWeight: 'normal' }}>
                          ({grouped.evening.filter(s => !s.isBooked).length} slots)
                        </span>
                      </div>
                      <div className="slot-grid">
                        {grouped.evening.map((slot, idx) => {
                          const isSelected = selectedSlot?.startTime === slot.startTime;
                          return (
                            <button
                              key={idx}
                              disabled={slot.isBooked}
                              className={`slot-chip ${slot.isBooked ? 'slot-chip-booked' : ''} ${isSelected ? 'slot-chip-selected' : ''}`}
                              onClick={() => setSelectedSlot(slot)}
                            >
                              <span>{formatSlotTime(slot.startTime)}</span>
                              {slot.isBooked && <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>Booked</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="slot-unavailable-card">
                  <p style={{ color: 'var(--color-gray-500)' }}>No available consultation slots for this date.</p>
                </div>
              )}
            </div>

            {/* Sticky Booking Confirmation Banner */}
            {selectedSlot && (
              <div className="booking-summary-banner">
                <div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Selected Consultation
                  </div>
                  <div style={{ fontWeight: 'var(--font-weight-bold)', color: 'var(--color-gray-900)', fontSize: 'var(--font-size-base)', marginTop: '2px' }}>
                    {new Date(selectedSlot.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {formatSlotTime(selectedSlot.startTime)}
                  </div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-primary-700)', marginTop: '2px' }}>
                    Dr. {doctor.name} • ₹{doctor.consultationFee}
                  </div>
                </div>

                <button
                  className="btn btn-primary btn-lg"
                  onClick={handleOpenBooking}
                  id="proceed-booking-btn"
                >
                  Book Appointment →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Booking Confirmation Modal */}
        {showBookingModal && (
          <div className="modal-backdrop" onClick={() => setShowBookingModal(false)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-4)' }}>
                <div>
                  <h2>Confirm OPD Appointment</h2>
                  <p style={{ fontSize: 'var(--font-size-sm)', marginTop: '2px' }}>
                    Dr. {doctor.name} ({doctor.specialization})
                  </p>
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setShowBookingModal(false)}
                >
                  ✕
                </button>
              </div>

              {bookingError && (
                <div className="status-badge badge-danger" style={{ display: 'block', padding: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                  {bookingError}
                </div>
              )}

              <div style={{
                backgroundColor: 'var(--color-gray-50)',
                padding: 'var(--space-4)',
                borderRadius: 'var(--radius-lg)',
                marginBottom: 'var(--space-5)',
                fontSize: 'var(--font-size-sm)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                  <span style={{ color: 'var(--color-gray-500)' }}>Date & Time:</span>
                  <strong>
                    {selectedSlot && `${new Date(selectedSlot.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at ${formatSlotTime(selectedSlot.startTime)}`}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                  <span style={{ color: 'var(--color-gray-500)' }}>Consultation Fee:</span>
                  <strong style={{ color: 'var(--color-primary-700)' }}>₹{doctor.consultationFee}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-gray-500)' }}>Duration:</span>
                  <span>{doctor.slotDurationMins} minutes</span>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 'var(--space-6)' }}>
                <label className="form-label">Chief Complaint / Reason for Visit (Optional)</label>
                <textarea
                  className="form-input"
                  style={{ height: '80px', resize: 'vertical' }}
                  placeholder="e.g., Fever for 3 days, headache, routine checkup..."
                  value={bookingReason}
                  onChange={(e) => setBookingReason(e.target.value)}
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowBookingModal(false)}
                  disabled={bookingLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleConfirmBooking}
                  disabled={bookingLoading}
                  id="confirm-booking-submit"
                >
                  {bookingLoading ? 'Securing Slot...' : 'Confirm & Book Slot'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
