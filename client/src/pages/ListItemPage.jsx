/**
 * ListItemPage.jsx — demoui-matched 4-step wizard
 */
import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCreateItem } from '@/hooks/useItems'
import LocationPicker from '@/components/LocationPicker'

const CATEGORIES = [
  { label: '📷 Photography', value: 'Cameras' },
  { label: '🔧 Tools & DIY', value: 'Tools' },
  { label: '🏕️ Outdoor & Sports', value: 'Sports' },
  { label: '🎮 Electronics', value: 'Electronics' },
  { label: '🎸 Instruments', value: 'Instruments' },
  { label: '🚗 Vehicles', value: 'Vehicles' },
  { label: '🏠 Spaces', value: 'Spaces' },
  { label: '📦 Other', value: 'Other' },
]

export default function ListItemPage() {
  const navigate = useNavigate()
  const fileRef = useRef(null)
  const [step, setStep] = useState(1)
  const [images, setImages] = useState([])
  const [imageFiles, setImageFiles] = useState([])
  const [form, setForm] = useState({
    title: '',
    category: '',
    description: '',
    location: '',
    locationState: '',
    locationAddress: '',
    coordinates: null,
    pricePerDay: '',
    deposit: '',
    minRental: 1,
  })

  const { mutate: createItem, isPending: publishing } = useCreateItem()

  const [errors, setErrors] = useState({})
  const clearErr = (name) => setErrors((p) => { const n = { ...p }; delete n[name]; return n })

  const set = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }))
    clearErr(e.target.name)
  }

  const handleFiles = (e) => {
    const files = Array.from(e.target.files || [])
    const previews = files.slice(0, 6 - images.length).map((f) => URL.createObjectURL(f))
    setImages((p) => [...p, ...previews])
    setImageFiles((p) => [...p, ...files.slice(0, 6 - p.length)])
  }

  const goStep = (s) => setStep(s)

  const validateStep2 = () => {
    if (imageFiles.length === 0) {
      setErrors({ photos: 'At least one photo is required' })
      return false
    }
    return true
  }

  const validateStep1 = () => {
    const e = {}
    if (!form.title.trim())       e.title       = 'Title is required'
    if (!form.category)           e.category    = 'Please select a category'
    if (!form.description.trim()) e.description = 'Description is required'
    if (!form.location.trim())    e.location    = 'Location is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const validateStep3 = () => {
    const e = {}
    if (!form.pricePerDay || Number(form.pricePerDay) < 1) e.pricePerDay = 'Price must be at least ₹1'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handlePublish = () => {
    if (!validateStep3()) { setStep(3); return }

    // Send everything — text fields + images — in one multipart request
    const formData = new FormData()
    formData.append('title',       form.title)
    formData.append('category',    form.category)
    formData.append('description', form.description)
    formData.append('location',    JSON.stringify({
      city: form.location,
      ...(form.locationState ? { state: form.locationState } : {}),
      ...(form.locationAddress ? { address: form.locationAddress } : {}),
      ...(form.coordinates ? { coordinates: form.coordinates } : {}),
    }))
    formData.append('pricePerDay', form.pricePerDay)
    if (form.deposit) formData.append('deposit', form.deposit)
    formData.append('minRentalDays', form.minRental)
    imageFiles.forEach((f) => formData.append('images', f))

    createItem(formData, {
      onSuccess: () => navigate('/dashboard'),
    })
  }

  const stepCircleClass = (i) => {
    if (i < step) return 'wizard-step-circle done'
    if (i === step) return 'wizard-step-circle active'
    return 'wizard-step-circle'
  }

  const stepLabelClass = (i) => {
    if (i < step) return 'wizard-step-label done'
    if (i === step) return 'wizard-step-label active'
    return 'wizard-step-label'
  }

  const catObj = CATEGORIES.find((c) => c.value === form.category)
  const emoji = catObj ? catObj.label.split(' ')[0] : '📷'

  return (
    <div className="wizard-layout">
      {/* Wizard header */}
      <div className="wizard-header">
        <div className="wizard-title">List your item</div>
        <div className="wizard-steps">
          {[1, 2, 3, 4].map((n, i) => (
            <div className="wizard-step-item" key={n}>
              <div className={stepCircleClass(n)}>{n < step ? '✓' : n}</div>
              {i < 3 && <div className={`wizard-step-line ${n < step ? 'done' : ''}`} />}
            </div>
          ))}
        </div>
        <div className="wizard-step-labels">
          <span className={stepLabelClass(1)}>Details</span>
          <span className={stepLabelClass(2)}>Photos</span>
          <span className={stepLabelClass(3)}>Pricing</span>
          <span className={stepLabelClass(4)}>Preview</span>
        </div>
      </div>

      {/* Step 1: Details */}
      {step === 1 && (
        <div className="wizard-card">
          <div className="wizard-section-title">Basic Details</div>
          <div className="form-group">
            <label className="form-label">Item Title</label>
            <input className="form-input" name="title" value={form.title} onChange={set} placeholder="e.g. Sony A7 III Camera with 28-70mm Lens" style={errors.title ? { borderColor: 'var(--danger)' } : {}} />
            {errors.title && <div style={{ color: 'var(--danger)', fontSize: 12, marginTop: 4 }}>{errors.title}</div>}
          </div>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-input" name="category" value={form.category} onChange={set} style={errors.category ? { borderColor: 'var(--danger)' } : {}}>
              <option value="">Select a category…</option>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            {errors.category && <div style={{ color: 'var(--danger)', fontSize: 12, marginTop: 4 }}>{errors.category}</div>}
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" name="description" value={form.description} onChange={set} rows={4} placeholder="Describe your item, what's included, condition, any special notes…" style={{ resize: 'vertical', ...(errors.description ? { borderColor: 'var(--danger)' } : {}) }} />
            {errors.description && <div style={{ color: 'var(--danger)', fontSize: 12, marginTop: 4 }}>{errors.description}</div>}
          </div>
          <div className="form-group">
            <label className="form-label">Location</label>
            <LocationPicker
              value={form.location}
              error={errors.location}
              onChange={(city, state, coords, address) => {
                setForm((p) => ({
                  ...p,
                  location: city,
                  locationState: state || p.locationState,
                  locationAddress: address || p.locationAddress,
                  coordinates: coords || p.coordinates,
                }))
                clearErr('location')
              }}
            />
          </div>
          <div className="wizard-footer">
            <button className="btn-secondary" onClick={() => navigate('/dashboard')}>Cancel</button>
              <button className="btn-primary" onClick={() => { if (validateStep1()) goStep(2) }}>Next: Photos →</button>
          </div>
        </div>
      )}

      {/* Step 2: Photos */}
      {step === 2 && (
        <div className="wizard-card">
          <div className="wizard-section-title">
            Upload Photos
            <span style={{ color: 'var(--danger)', marginLeft: 6, fontSize: 16 }}>*</span>
            <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--danger)', marginLeft: 6 }}>Required</span>
          </div>
          {errors.photos && (
            <div style={{ color: 'var(--danger)', fontSize: 13, fontWeight: 500, marginBottom: 12,
              padding: '8px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
              ⚠️ {errors.photos}
            </div>
          )}
          <div
            className="upload-zone"
            onClick={() => fileRef.current?.click()}
            style={errors.photos ? { borderColor: 'var(--danger)' } : {}}
          >
            <div className="upload-icon">📁</div>
            <div className="upload-text">Drag photos here or click to upload</div>
            <div className="upload-sub">Up to 6 photos · JPG, PNG · Max 10MB each</div>
            <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleFiles} />
          </div>
          {images.length > 0 && (
            <div className="upload-grid" style={{ marginTop: 16 }}>
              {images.map((src, i) => (
                <div className="upload-thumb" key={i} style={{ backgroundImage: `url(${src})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                  <span
                    style={{ position: 'absolute', top: 4, right: 4, cursor: 'pointer', fontSize: 14, background: 'rgba(0,0,0,0.5)', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={() => {
                      setImages((p) => p.filter((_, j) => j !== i))
                      setImageFiles((p) => p.filter((_, j) => j !== i))
                    }}
                  >✕</span>
                </div>
              ))}
              {images.length < 6 && (
                <div className="upload-thumb" style={{ border: '1px dashed var(--border)', background: 'transparent', color: 'var(--text-3)', fontSize: 20, cursor: 'pointer' }} onClick={() => fileRef.current?.click()}>+</div>
              )}
            </div>
          )}
          <div className="wizard-footer">
            <button className="btn-secondary" onClick={() => goStep(1)}>← Back</button>
            <button className="btn-primary" onClick={() => { if (validateStep2()) goStep(3) }}>Next: Pricing →</button>
          </div>
        </div>
      )}

      {/* Step 3: Pricing */}
      {step === 3 && (
        <div className="wizard-card">
          <div className="wizard-section-title">Set Your Price</div>
          <div className="form-group">
            <label className="form-label">Daily Rate (₹)</label>
            <input className="form-input" type="number" name="pricePerDay" value={form.pricePerDay} onChange={set} placeholder="e.g. 45" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, ...(errors.pricePerDay ? { borderColor: 'var(--danger)' } : {}) }} />
            {errors.pricePerDay && <div style={{ color: 'var(--danger)', fontSize: 12, marginTop: 4 }}>{errors.pricePerDay}</div>}
          </div>
          <div className="form-group">
            <label className="form-label">Refundable Deposit (optional)</label>
            <input className="form-input" type="number" name="deposit" value={form.deposit} onChange={set} placeholder="e.g. 100" />
          </div>
          <div className="form-group">
            <label className="form-label">Minimum Rental Period</label>
            <select className="form-input" name="minRental" value={form.minRental} onChange={set}>
              <option value={1}>1 day minimum</option>
              <option value={2}>2 days minimum</option>
              <option value={3}>3 days minimum</option>
              <option value={7}>1 week minimum</option>
            </select>
          </div>
          <div className="wizard-footer">
            <button className="btn-secondary" onClick={() => goStep(2)}>← Back</button>
            <button className="btn-primary" onClick={() => { if (validateStep3()) goStep(4) }}>Preview →</button>
          </div>
        </div>
      )}

      {/* Step 4: Preview */}
      {step === 4 && (
        <div className="wizard-card">
          <div className="wizard-section-title">Preview & Publish</div>
          <p style={{ color: 'var(--text-2)', fontSize: 14, marginBottom: 20 }}>This is how your listing will appear to renters.</p>
          <div className="item-card" style={{ maxWidth: '100%' }}>
            <div className="item-img">
              {images[0]
                ? <img src={images[0]} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: 52 }}>{emoji}</span>
              }
              <div className="item-img-overlay" />
              <div className="item-badge">{catObj ? catObj.label : 'Category'}</div>
            </div>
            <div className="item-body">
              <div className="item-title">{form.title || 'Your Item Title'}</div>
              <div className="item-meta">
                <div className="item-location">📍 {form.location || 'Location'}</div>
                <div className="item-rating">⭐ New listing</div>
              </div>
              <div className="item-footer">
                <div className="item-price">₹{form.pricePerDay || '0'} <span>/ day</span></div>
                <div className="item-owner">
                  <div className="owner-avatar" style={{ fontSize: 10 }}>You</div>
                  <div className="owner-name">You</div>
                </div>
              </div>
            </div>
          </div>
          <div className="wizard-footer">
            <button className="btn-secondary" onClick={() => goStep(3)}>← Edit</button>
            <button className="btn-primary" onClick={handlePublish} disabled={publishing}>
              {publishing ? '🚀 Publishing…' : '🚀 Publish Listing'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
