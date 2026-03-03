// types/formInspection.ts

export interface Damage {
  id: string;
  label: string;
  value: string;
  description: string | null;
}

export interface DamageCategory {
  id: number;
  name: string;
  description: string | null;
  damages: Damage[];
}

export interface OptionSetting {
  rows?: number;
  max_size?: number;
  max_files?: number;
  max_width?: number | null;
  rich_text?: boolean;
  allow_html?: boolean;
  damage_ids?: Damage[] | string[];
  max_height?: number | null;
  max_length?: number;
  min_length?: number | null;
  placeholder?: string | null;
  show_damage?: boolean;
  aspect_ratio?: string | null;
  show_trigger?: boolean;
  allowed_mimes?: string[];
  target_item_id?: string[] | number[]; // Bisa string atau number
  damage_category_id?: number | null;
  compression_quality?: number;
}

export interface Option {
  label: string;
  multi: boolean;
  value: string;
  settings: OptionSetting;
  show_image: boolean;
  show_textarea: boolean;
  image_is_required: boolean;
  textarea_is_required: boolean;
}

export interface ItemSettings {
  // Text & Textarea
  min_length?: number;
  max_length?: number;
  placeholder?: string;
  capitalization?: 'none' | 'uppercase' | 'lowercase' | 'words';
  regex_pattern?: string | null;
  allow_spaces?: boolean;
  allow_special_chars?: boolean;
  trim_spaces?: boolean;
  rows?: number;
  rich_text?: boolean;
  allow_html?: boolean;
  
  // Number & Currency & Percentage
  min?: number | null;
  max?: number | null;
  step?: number;
  decimal_places?: number;
  prefix?: string;
  suffix?: string;
  thousand_separator?: boolean;
  allow_negative?: boolean;
  currency_code?: string;
  currency_symbol?: string;
  min_amount?: number;
  max_amount?: number | null;
  help_text?: string;
  show_percent_sign?: boolean;
  allow_over_100?: boolean;
  
  // Select & Radio & Checkbox
  options?: Option[];
  searchable?: boolean;
  allow_custom?: boolean;
  layout?: 'vertical' | 'horizontal';
  min_selected?: number | null;
  max_selected?: number | null;
  
  // Date & Time
  format?: string | null;
  min_date?: string | null;
  max_date?: string | null;
  show_time?: boolean;
  display_format?: string | null;
  min_time?: string | null;
  max_time?: string | null;
  step_minutes?: number;
  
  // Image & File
  max_width?: number | null;
  max_height?: number | null;
  aspect_ratio?: string | null;
  compression_quality?: number;
  max_size?: number;
  allowed_mimes?: string[];
  max_files?: number;
  show_option?: boolean;
  option_is_required?: boolean;
  
  // Damage & Trigger
  is_triggered?: boolean;
  parent_item_id?: number[] | string[]; // Bisa string atau number
  show_damage?: boolean;
  damage_category_id?: number | null;
  damage_ids?: number[] | Damage[];
  
  // Vehicle filters - 6 data
  transmission?: string[] | null;
  fuel_type?: string | null;
  doors?: number | null;
  drive?: string | null;
  pickup?: boolean | null;
  box?: boolean | null;
  
  settings?: any;
}

export interface InspectionItem {
  id: number;
  name: string;
  description: string | null;
  code: string | null;
}

export interface FormItem {
  id: number;
  section_id: number;
  inspection_item_id: number;
  input_type: string;
  sort_order: number;
  is_active: boolean;
  is_visible: boolean;
  is_required: boolean;
  inspection_item: InspectionItem;
  settings: ItemSettings;
  validation_rules: string[];
  current_result: any | null;
  ui_config: {
    component: string;
    props: any;
  };
}

export interface Section {
  id: number;
  name: string;
  section_type: 'menu' | 'damage';
  sort_order: number;
  is_damage_section: boolean;
  items: FormItem[];
}

export interface Template {
  id: number;
  name: string;
  description: string | null;
  settings: {
    position: string;
    menu_model: string;
  };
  sections: Section[];
}

export interface VehicleAttribute {
  doors: number;
  drive: string;
  pickup: boolean;
  box: boolean;
  fuel_type: string;
  transmission: string;
  is_active: boolean;
}

export interface Inspection {
  id: number;
  template_id: number;
  vehicle_id: number;
  atribute_vehicle: VehicleAttribute;
  vehicle_name: string;
  license_plate: string;
  status: string;
  progress_percentage: number;
  can_be_edited: boolean;
  vehicle_display: string;
}

export interface ValidationConfig {
  [key: string]: {
    rules: string[];
    is_required: boolean;
    input_type: string;
  };
}

export interface Metadata {
  damage_categories: DamageCategory[];
  transmissions: Array<{
    id: number;
    name: string;
    description: string | null;
    is_active: number;
  }>;
}

export interface FormInspectionData {
  inspection: Inspection;
  template: Template;
  existing_results: any[];
  validation_config: ValidationConfig;
  metadata: Metadata;
}

export interface FormDataResponse {
  success: boolean;
  data: {
    form: FormInspectionData;
  };
  message?: string;
}

// Untuk penyimpanan local
export interface FormValue {
  value: any;
  updated_at: number;
}

export interface FormValues {
  [itemId: string]: FormValue;
}

// tipe untuk pengaturan kamera
export type CameraSource = 'camera' | 'gallery' | 'ask';

export interface CameraSettings {
  source: CameraSource;
  saveToGallery?: boolean;
  maxSize?: number;
}

// Key untuk localStorage
export const CAMERA_SETTINGS_KEY = 'inspection_camera_settings';