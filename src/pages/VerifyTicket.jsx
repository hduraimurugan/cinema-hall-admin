import { useState, useRef, useEffect } from "react"
import { Html5Qrcode } from "html5-qrcode"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScanLine, Search, Camera, CameraOff, CheckCircle2, XCircle, ImagePlus } from "lucide-react"
import { bookingAPI } from "../services/api"

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const statusVariants = {
  confirmed: "default",
  cancelled: "destructive",
  completed: "secondary",
}

const VerifyTicket = () => {
  const [manualInput, setManualInput] = useState("")
  const [bookingResult, setBookingResult] = useState(null)
  const [scanError, setScanError] = useState(null)
  const [fetchError, setFetchError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [scannerActive, setScannerActive] = useState(false)
  const [imageScanning, setImageScanning] = useState(false)
  const html5QrCodeRef = useRef(null)
  const fileInputRef = useRef(null)

  const fetchBooking = async (id) => {
    if (!UUID_REGEX.test(id)) {
      setFetchError("Invalid booking ID format")
      return
    }
    setLoading(true)
    setFetchError(null)
    setBookingResult(null)
    try {
      const data = await bookingAPI.verifyBooking(id)
      setBookingResult(data.booking)
    } catch (err) {
      setFetchError(err.message || "Booking not found")
    } finally {
      setLoading(false)
    }
  }

  const startScanner = () => {
    setScanError(null)
    setScannerActive(true)
  }

  const stopScanner = () => {
    setScannerActive(false)
  }

  useEffect(() => {
    if (!scannerActive) return

    const html5QrCode = new Html5Qrcode("qr-reader")
    html5QrCodeRef.current = html5QrCode

    const onDecode = (decodedText) => {
      setScannerActive(false)
      if (!UUID_REGEX.test(decodedText)) {
        setScanError("Invalid QR code — not a booking ID")
        return
      }
      setManualInput(decodedText)
      fetchBooking(decodedText)
    }

    Html5Qrcode.getCameras()
      .then((cameras) => {
        if (!cameras?.length) throw new Error("no-camera")
        const cam = cameras.find((c) => /back|rear|environment/i.test(c.label)) ?? cameras[0]
        return html5QrCode.start(cam.id, { fps: 10, qrbox: { width: 220, height: 220 } }, onDecode, () => {})
      })
      .catch((err) => {
        setScannerActive(false)
        setScanError(
          err?.message === "no-camera"
            ? "No camera found. Upload a QR image or use manual entry."
            : err?.name === "NotAllowedError"
            ? "Camera permission denied. Upload a QR image or use manual entry."
            : "Could not access camera. Upload a QR image or use manual entry."
        )
      })

    return () => {
      try { html5QrCode.stop().catch(() => {}) } catch { /* not running */ }
      html5QrCodeRef.current = null
    }
  }, [scannerActive])

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ""

    setScanError(null)
    setImageScanning(true)

    const scanner = new Html5Qrcode("qr-file-reader")
    try {
      const result = await scanner.scanFile(file, true)
      if (!UUID_REGEX.test(result)) {
        setScanError("QR code found but it's not a valid booking ID.")
        return
      }
      setManualInput(result)
      fetchBooking(result)
    } catch {
      setScanError("No QR code found in the image. Try a clearer photo.")
    } finally {
      setImageScanning(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <ScanLine className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold">Verify Ticket</h1>
      </div>

      {/* hidden element required by Html5Qrcode for file scanning */}
      <div id="qr-file-reader" className="hidden" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Scanner + Upload + Manual Entry */}
        <div className="space-y-4">
          {/* Camera Scanner */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Scan QR Code</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div
                id="qr-reader"
                className={`w-full rounded-lg overflow-hidden bg-muted ${scannerActive ? "min-h-64" : "hidden"}`}
              />
              {!scannerActive && (
                <div className="flex flex-col items-center justify-center h-36 bg-muted rounded-lg text-muted-foreground gap-2">
                  <Camera className="w-10 h-10 opacity-40" />
                  <p className="text-sm">Camera is off</p>
                </div>
              )}
              {scanError && (
                <p className="text-sm text-destructive flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 shrink-0" />
                  {scanError}
                </p>
              )}
              <div className="flex gap-2">
                <Button
                  onClick={scannerActive ? stopScanner : startScanner}
                  variant={scannerActive ? "destructive" : "default"}
                  className="flex-1"
                >
                  {scannerActive ? (
                    <><CameraOff className="w-4 h-4 mr-2" />Stop Camera</>
                  ) : (
                    <><Camera className="w-4 h-4 mr-2" />Start Camera</>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={imageScanning || scannerActive}
                  title="Upload QR code image"
                >
                  <ImagePlus className="w-4 h-4 mr-2" />
                  {imageScanning ? "Scanning…" : "Upload Image"}
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </CardContent>
          </Card>

          {/* Manual Entry */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Manual Entry</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Paste booking ID (UUID)..."
                  value={manualInput}
                  onChange={e => setManualInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && fetchBooking(manualInput.trim())}
                />
                <Button
                  onClick={() => fetchBooking(manualInput.trim())}
                  disabled={loading || !manualInput.trim()}
                >
                  <Search className="w-4 h-4" />
                </Button>
              </div>
              {fetchError && (
                <p className="text-sm text-destructive flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 shrink-0" />
                  {fetchError}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Result */}
        <div>
          {loading && (
            <Card>
              <CardContent className="flex items-center justify-center h-48 text-muted-foreground">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </CardContent>
            </Card>
          )}

          {!loading && bookingResult && (
            <Card className="border-green-500/40">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <CardTitle className="text-base">Booking Details</CardTitle>
                  <Badge variant={statusVariants[bookingResult.booking_status] || "default"} className="ml-auto">
                    {bookingResult.booking_status?.charAt(0).toUpperCase() + bookingResult.booking_status?.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Movie & Show */}
                <div className="pb-3 border-b border-border">
                  <p className="font-bold text-lg">{bookingResult.movie_title}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {bookingResult.show_date
                      ? new Date(bookingResult.show_date).toLocaleDateString("en-IN", { dateStyle: "long" })
                      : ""}
                    {bookingResult.start_time ? ` • ${bookingResult.start_time.slice(0, 5)}` : ""}
                  </p>
                  {bookingResult.screen_name && (
                    <p className="text-sm text-muted-foreground">{bookingResult.screen_name}</p>
                  )}
                </div>

                {/* Customer */}
                <div className="pb-3 border-b border-border">
                  <p className="text-xs text-muted-foreground mb-0.5">Customer</p>
                  <p className="font-semibold">{bookingResult.customer_name || "—"}</p>
                  <p className="text-sm text-muted-foreground">{bookingResult.customer_email}</p>
                </div>

                {/* Seats */}
                <div className="pb-3 border-b border-border">
                  <p className="text-xs text-muted-foreground mb-2">Seats</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(bookingResult.seat_labels || []).map((s, i) => (
                      <span key={i} className="px-3 py-1 bg-secondary text-secondary-foreground text-sm rounded-lg font-semibold">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Amount & Booking ID */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Booking ID</p>
                    <p className="text-xs font-mono text-muted-foreground">{bookingResult.id}</p>
                  </div>
                  <p className="text-2xl font-bold">₹{bookingResult.total_amount}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {!loading && !bookingResult && !fetchError && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-3">
                <ScanLine className="w-12 h-12 opacity-30" />
                <p className="text-sm">Scan a QR code or enter a booking ID to verify</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default VerifyTicket
