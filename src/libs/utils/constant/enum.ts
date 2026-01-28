export enum ResponseData {
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export enum Role {
  CUSTOMER = 'customer',
  ADMIN = 'admin',
  BUSINESS = 'business',
}

export enum VerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

export enum ApiTag {
  FAQ = 'Faq',
  CLIP_SUBSCRIPTION = 'Clip Subscription',
  CONTACT_US = 'Contact Us',
  EMAIL_TEMPLATE = 'Email Template',
  HOME_PAGE = 'Home Page',
  CATEGORY = 'Category',
  PROJECT = 'Project',
  BUSINESS = 'Business',
  REVIEW = 'Review',
  COMMON_MODULE = 'Common Module',
  OFFER = 'Offer',
  DASHBOARD = 'Dashboard',
  COUNTY = 'County',
  CHAT = 'Chat',
}

export enum ControllerEndpoint {
  FAQ = 'faq',
  CLIP_SUBSCRIPTION = 'subscription',
  CONTACT_US = 'contact-us',
  EMAIL_TEMPLATE = 'template',
  HOME_PAGE = 'home-page',
  CATEGORY = 'category',
  PROJECT = 'project',
  BUSINESS = 'business',
  REVIEW = 'review',
  ADMIN_DASHBOARD = 'admin-dashboard',
  OFFER = 'offer',
  DASHBOARD = 'dashboard',
  COUNTY = 'county',
}

export enum Type {
  DETAILS = 'DETAILS',
  INSPIRATION = 'INSPIRATION',
  CURRENT_AFFAIR = 'CURRENT AFFAIRS',
}

export enum Status {
  ACTIVE = 'active',
  DEACTIVE = 'deactive',
}

export enum CategorySource {
  PROFF = 'proff',
  ADMIN = 'admin',
}

export enum ProjectStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ASSIGNED = 'assigned',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  DELETED = 'deleted',
}

export enum ProjectFilterStatus {
  PUBLISHED = 'published',
  APPLIED = 'applied',
}

export enum OfferStatus {
  PENDING = 'pending',
  ASSIGNED = 'assigned',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  DELETED = 'deleted',
}

export enum BusinessStatus {
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAYMENT_RECEIVED = 'payment_received',
  PAYMENT_REJECTED = 'payment_rejected',
}

export enum BusinessClipStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
}

export enum BusinessClipHistory {
  APPLIED = 'applied',
  PURCHASED = 'purchased',
}

export enum BusinessPaymentStatus {
  PENDING = 'pending',
  RECEIVED = 'received',
  REJECTED = 'rejected',
}

export enum TimeFrameType {
  DAY = 'day',
  MONTH = 'month',
}

export enum BusinessProjectType {
  ALL = 'all',
  ACTIVE = 'active',
}

export enum TemplateValidation {
  YES = 'yes',
  NO = 'no',
}

export enum TemplateFieldType {
  TEXT = 'text',
  EMAIL = 'email',
  NUMBER = 'number',
  TEL = 'tel',
  RADIO = 'radio',
  CHECKBOX = 'checkbox',
  DROPDOWN = 'dropdown',
  DATE = 'date',
  FILE = 'file',
  TEXTAREA = 'textarea',
}

export enum MessageStatus {
  READ = 'read',
  UNREAD = 'unread',
}

export enum MessagesType {
  NORMAL = 'normal',
  IMAGES = 'images',
}
