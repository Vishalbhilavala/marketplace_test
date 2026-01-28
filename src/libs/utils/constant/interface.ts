import { Types } from 'mongoose';
import { ResponseData, Role } from './enum';

export interface EmailPayload {
  success: boolean;
  messageId?: string;
}

export interface MailTemplate {
  type: string;
  template: string;
  notification_name?: string;
}

export interface ILocation {
  county?: string;
  municipality?: Array<{
    name?: string;
    is_active?: boolean;
  }>;
}

export interface IAddress {
  postalAddress?: {
    addressLine?: string;
    postPlace?: string;
    postalCode?: string;
  };
}

export interface ICoordinates {
  XCoordinate?: number;
  YCoordinate?: number;
}

export interface IPortfolioItem {
  title?: string;
  completion_date?: Date;
  description?: string;
  photos?: string[];
}

export interface UserDetail {
  _id?: Types.ObjectId | string;
  full_name?: string;
  email?: string;
  password?: string;
  phone_number?: string;
  role?: Role.ADMIN | Role.BUSINESS | Role.CUSTOMER;
  profile_image?: string | null;
  is_active: boolean;
  business_name?: string | null;
  location?: ILocation[];
  address?: IAddress | null;
  postal_code?: string | null;
  coordinates?: ICoordinates[] | null;
  org_no?: string | null;
  terms_condition?: boolean;
  Portfolio?: IPortfolioItem[] | null;
  status: string;
  payment_status: string;
  plan_assigned: boolean;
  is_password?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IProject {
  _id: Types.ObjectId;
  customer_id: Types.ObjectId;
  title: string;
  description: string;
  address: string;
  postal_code: string;
  project_image: string[];
  status: string;
  source: string;
  meta_title?: string;
  meta_description?: string;
  meta_keyword?: string[];
  is_deleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserRequest extends Request {
  user: {
    id: string;
    email: string;
    role: string;
  };
}
export interface HandleResponseOptions<T = unknown> {
  statusCode?: number;
  status: ResponseData;
  messageKey?: string;
  message?: string | string[];
  data?: T;
  error?: unknown;
}

export interface ProffCompany {
  naceCategories: string[];
  name: string;
  organisationNumber: string;

  location?: {
    countryPart?: string;
    county?: string;
    municipality?: string;
    coordinates?: {
      XCoordinate: number;
      YCoordinate: number;
      coordinateSystem: string;
    }[];
  };

  postalAddress?: {
    addressLine?: string;
    postPlace?: string;
    postalCode?: string;
  };
}

export interface ProffApiResponse {
  companies: ProffCompany[];
}

export interface BusinessCategoryItem {
  name: string | null;
  sub_category: { name: string }[];
}

export interface CountyData {
  _id: Types.ObjectId;
  municipalities: {
    _id: Types.ObjectId;
    name: string;
    villages: {
      name: string;
      postal_code: string;
    }[];
  }[];
}

interface SubTemplateLean {
  _id: Types.ObjectId;
  type_of_work: { _id: Types.ObjectId }[];
}

export interface CategoryLean {
  category: SubTemplateLean[];
}

export interface ChatMatchStage {
  chat_id: Types.ObjectId;
  message?: {
    $regex: string | RegExp;
    $options?: string;
  };
}
