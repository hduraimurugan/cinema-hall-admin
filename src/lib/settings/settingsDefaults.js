export const ORG_DEFAULTS = {
  general: {
    org_name: "",
    timezone: "Asia/Kolkata",
    currency: "INR",
    language: "en",
  },
  payment: {
    convenience_fee: { model: "per_ticket", amount: 15 },
    gst_percentage: 18,
    gst_applies_to: "convenience_fee",
    state_taxes: [],
  },
  tickets: {
    booking_id_prefix: "CINE",
    qr_error_correction: "M",
    pdf_footer_text: "",
  },
  security: {
    password_policy: {
      min_length: 8, require_upper: true, require_lower: true,
      require_digit: true, require_special: true,
      prevent_reuse_count: 5, expiry_days: null,
    },
    lockout_policy: {
      thresholds: [
        { attempts: 5, minutes: 15 },
        { attempts: 10, minutes: 60 },
        { attempts: 15, minutes: 1440 },
      ],
    },
    session_timeout_minutes: null,
    mfa_required: false,
    invite_expiry_hours: 72,
  },
  notifications: {
    email: { provider: "smtp", from: "", enabled: true },
    sms: { provider: "", from: "", enabled: false },
    whatsapp: { provider: "", enabled: false },
    push: { provider: "fcm", enabled: false },
  },
  branding: {
    logo_url: "", logo_dark_url: "", banner_url: "",
    primary_color: "", accent_color: "", font_family: "",
    app_name: "Cinemax", default_theme: "dark", white_label: false,
  },
  integrations: {},
  advanced: {},
};

export const HALL_DEFAULTS = {
  cinema_profile: {
    name: "", location: "", district: "", state: "",
    latitude: null, longitude: null, phone: "",
    description: "", operating_hours: { open: "09:00", close: "23:00" },
  },
  showtimes: {
    default_buffer_minutes: 15,
    prevent_overlap: true,
    default_language_version: "Original",
    auto_status_transitions: true,
    timezone: "Asia/Kolkata",
    advance_booking_days: 7,
    booking_open_offset_minutes: 0,
  },
  booking: {
    max_seats_per_booking: 10,
    advance_booking_days: 7,
    hold_minutes: 5,
    cancellation: { allowed: true, window_minutes: 120, penalty_percentage: 10 },
  },
  offers: {
    default_scope: "global",
    default_max_redemptions_per_customer: 1,
    default_validity_days: 30,
    auto_generate_codes: false,
    code_prefix: "CINE",
  },
};

export const USER_DEFAULTS = {
  notifications: {
    booking_confirmed: { email: true, sms: false, whatsapp: false, push: false },
    booking_cancelled: { email: true, sms: false, whatsapp: false, push: false },
    refund_initiated: { email: true, sms: false, whatsapp: false, push: false },
    refund_settled: { email: true, sms: false, whatsapp: false, push: false },
    show_cancelled: { email: true, sms: false, whatsapp: false, push: false },
    show_reminder: { email: true, sms: false, whatsapp: false, push: true },
    daily_report: { email: false, sms: false, whatsapp: false, push: false },
    security_alert: { email: true, sms: true, whatsapp: false, push: true },
  },
  analytics: {
    default_dashboard_widgets: ["revenue", "bookings", "occupancy"],
    default_period: "today",
  },
  appearance: {
    table_rows_per_page: 25,
  },
};
