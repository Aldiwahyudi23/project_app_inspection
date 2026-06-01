<template>
  <div class="customer-seller-form">
    <v-form @submit.prevent="handleSubmit" ref="formRef">
      
      <!-- ==================== -->
      <!-- SECTION: CUSTOMER DATA -->
      <!-- ==================== -->
      <v-card class="mb-4" variant="outlined">
        <v-card-title class="bg-primary text-white pa-3">
          <v-icon start>mdi-account</v-icon>
          Data Customer
        </v-card-title>
        
        <v-card-text class="pa-4">
          <!-- Phone Number with Auto-check -->
          <v-text-field
            v-model="form.phone"
            label="Nomor HP *"
            placeholder="Masukkan nomor HP"
            :rules="phoneRules"
            :loading="checkingPhone"
            :readonly="submitting"
            @blur="checkCustomerByPhone"
            @input="onPhoneInput"
            clearable
          >
            <template v-slot:append-inner>
              <v-icon 
                v-if="form.phone && !checkingPhone"
                :color="existingCustomer ? 'success' : 'info'"
                :icon="existingCustomer ? 'mdi-check-circle' : 'mdi-account-search'"
                size="small"
              />
            </template>
          </v-text-field>

          <!-- Alert when customer exists -->
          <v-alert
            v-if="existingCustomer && existingCustomerData"
            type="info"
            variant="tonal"
            class="mb-4"
          >
            <div class="d-flex align-center">
              <v-icon start>mdi-information</v-icon>
              <span>
                Customer ditemukan dengan ID: {{ existingCustomerData.id }}
                <br>
                <strong>Data customer akan digunakan untuk seller ini</strong>
              </span>
            </div>
          </v-alert>

          <!-- Customer Form Fields -->
          <v-text-field
            v-model="form.name"
            label="Nama Lengkap *"
            placeholder="Nama customer"
            :rules="nameRules"
            :readonly="submitting"
            clearable
          />

          <v-text-field
            v-model="form.email"
            label="Email"
            type="email"
            placeholder="customer@email.com"
            :rules="emailRules"
            :readonly="submitting"
            clearable
          />

          <v-textarea
            v-model="form.address"
            label="Alamat Customer"
            placeholder="Alamat lengkap customer"
            rows="2"
            :readonly="submitting"
            clearable
          />
        </v-card-text>
      </v-card>

      <!-- ==================== -->
      <!-- SECTION: SELLER DATA -->
      <!-- ==================== -->
      <v-card class="mb-4" variant="outlined">
        <v-card-title class="bg-secondary text-white pa-3">
          <v-icon start>mdi-store</v-icon>
          Data Seller (Informasi Lokasi Inspeksi)
        </v-card-title>
        
        <v-card-text class="pa-4">
          <v-text-field
            v-model="form.inspection_area"
            label="Area Inspeksi *"
            placeholder="Contoh: Jakarta Selatan"
            :rules="requiredRule"
            :readonly="submitting"
            clearable
          />

          <v-textarea
            v-model="form.inspection_address"
            label="Alamat Inspeksi *"
            placeholder="Alamat lengkap lokasi inspeksi"
            rows="3"
            :rules="requiredRule"
            :readonly="submitting"
            clearable
          />

          <v-text-field
            v-model="form.link_maps"
            label="Link Google Maps"
            placeholder="https://maps.google.com/..."
            :readonly="submitting"
            clearable
          />

          <v-divider class="my-4" />

          <v-text-field
            v-model="form.unit_holder_name"
            label="Nama Pemilik Unit"
            placeholder="PT / CV / Nama pemilik"
            :readonly="submitting"
            clearable
          />

          <v-text-field
            v-model="form.unit_holder_phone"
            label="No. HP Pemilik Unit"
            placeholder="Nomor telepon pemilik unit"
            :readonly="submitting"
            clearable
          />

          <!-- Hidden inspection_id bisa dari parent component -->
          <input type="hidden" v-model="form.inspection_id" />
        </v-card-text>
      </v-card>

      <!-- ==================== -->
      <!-- SECTION: ACTIONS -->
      <!-- ==================== -->
      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn
          type="button"
          variant="outlined"
          @click="resetForm"
          :disabled="submitting"
        >
          Reset
        </v-btn>
        <v-btn
          type="submit"
          color="primary"
          :loading="submitting"
          :disabled="!isFormValid"
        >
          {{ submitButtonText }}
        </v-btn>
      </v-card-actions>

    </v-form>

    <!-- Success Dialog -->
    <v-dialog v-model="showSuccessDialog" max-width="500">
      <v-card>
        <v-card-title class="bg-success text-white">
          <v-icon start>mdi-check-circle</v-icon>
          Berhasil!
        </v-card-title>
        <v-card-text class="pa-4">
          <p>{{ successMessage }}</p>
          <v-divider class="my-3" />
          <div v-if="savedData">
            <strong>ID Customer:</strong> {{ savedData.customer?.id }}<br>
            <strong>Nama Customer:</strong> {{ savedData.customer?.name }}<br>
            <strong>ID Seller:</strong> {{ savedData.seller?.id }}
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" @click="closeSuccessDialog">OK</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import customerSellerService from '../../services/customerSellerService';
import type { 
  Customer, 
  StoreSellerPayload, 
  StoreSellerResponse 
} from '../../types/customerSeller';

// ==================== PROPS ====================
const props = defineProps<{
  inspectionId: number; // ID inspeksi dari parent
  onSuccess?: (data: StoreSellerResponse['data']) => void;
}>();

// ==================== EMITS ====================
const emit = defineEmits<{
  (e: 'success', data: StoreSellerResponse['data']): void;
  (e: 'error', error: any): void;
}>();

// ==================== STATE ====================
const formRef = ref();
const checkingPhone = ref(false);
const submitting = ref(false);
const existingCustomer = ref(false);
const existingCustomerData = ref<Customer | null>(null);
const showSuccessDialog = ref(false);
const successMessage = ref('');
const savedData = ref<StoreSellerResponse['data'] | null>(null);

// Form Data
const form = reactive<StoreSellerPayload>({
  name: '',
  phone: '',
  email: null,
  address: null,
  inspection_id: props.inspectionId,
  inspection_area: '',
  inspection_address: '',
  link_maps: null,
  unit_holder_name: null,
  unit_holder_phone: null,
  settings: null,
});

// ==================== RULES ====================
const requiredRule = [(v: any) => !!v || 'Field ini wajib diisi'];
const phoneRules = [
  (v: string) => !!v || 'Nomor HP wajib diisi',
  (v: string) => (v && v.length >= 8) || 'Nomor HP minimal 8 digit',
  (v: string) => (v && v.length <= 20) || 'Nomor HP maksimal 20 digit',
];
const nameRules = [(v: string) => !!v || 'Nama wajib diisi'];
const emailRules = [
  (v: string) => !v || /^\S+@\S+\.\S+$/.test(v) || 'Format email tidak valid',
];

// ==================== COMPUTED ====================
const isFormValid = computed(() => {
  return (
    form.name &&
    form.phone &&
    form.inspection_area &&
    form.inspection_address &&
    form.phone.length >= 8
  );
});

const submitButtonText = computed(() => {
  if (submitting.value) return 'Menyimpan...';
  if (existingCustomer.value) return 'Simpan Seller (Customer Existing)';
  return 'Simpan Customer & Seller Baru';
});

// ==================== METHODS ====================

/**
 * Check customer by phone number
 */
const checkCustomerByPhone = async () => {
  if (!form.phone || form.phone.length < 8) {
    existingCustomer.value = false;
    existingCustomerData.value = null;
    return;
  }

  checkingPhone.value = true;

  try {
    const response = await customerSellerService.findByPhone(form.phone);
    
    if (response.found && response.data) {
      existingCustomer.value = true;
      existingCustomerData.value = response.data;
      
      // Auto-fill customer data dari existing customer
      form.name = response.data.name;
      form.email = response.data.email;
      form.address = response.data.address;
    } else {
      existingCustomer.value = false;
      existingCustomerData.value = null;
      // Reset form jika phone berubah tapi tidak ditemukan
      if (!existingCustomer.value) {
        // Jangan auto-reset name, biarkan user mengisi manual
      }
    }
  } catch (error) {
    console.error('Error checking customer:', error);
    existingCustomer.value = false;
    existingCustomerData.value = null;
  } finally {
    checkingPhone.value = false;
  }
};

/**
 * Handle phone input change
 */
const onPhoneInput = () => {
  // Reset existing customer status when phone changes
  if (existingCustomer.value) {
    existingCustomer.value = false;
    existingCustomerData.value = null;
    // Don't reset form fields, user might want to create new customer with same phone? No, phone unique
    // So we keep the data but mark as not existing
  }
};

/**
 * Submit form
 */
const handleSubmit = async () => {
  // Validate form
  const { valid } = await formRef.value.validate();
  if (!valid) return;

  submitting.value = true;

  try {
    // Always create new seller (dengan kemungkinan customer existing atau baru)
    const response = await customerSellerService.store(form);
    
    if (response.success) {
      savedData.value = response.data;
      successMessage.value = existingCustomer.value
        ? 'Seller berhasil disimpan dengan customer yang sudah ada!'
        : 'Customer dan Seller berhasil disimpan!';
      
      showSuccessDialog.value = true;
      
      // Callback success
      if (props.onSuccess) props.onSuccess(response.data);
      emit('success', response.data);
      
      // Reset form (optional)
      resetForm();
    }
  } catch (error: any) {
    console.error('Error submitting form:', error);
    const errorMessage = error.message || 'Terjadi kesalahan saat menyimpan data';
    
    // Show error snackbar atau alert
    alert(errorMessage);
    emit('error', error);
  } finally {
    submitting.value = false;
  }
};

/**
 * Reset form
 */
const resetForm = () => {
  form.name = '';
  form.phone = '';
  form.email = null;
  form.address = null;
  form.inspection_area = '';
  form.inspection_address = '';
  form.link_maps = null;
  form.unit_holder_name = null;
  form.unit_holder_phone = null;
  
  existingCustomer.value = false;
  existingCustomerData.value = null;
  
  formRef.value?.resetValidation();
};

/**
 * Close success dialog
 */
const closeSuccessDialog = () => {
  showSuccessDialog.value = false;
  savedData.value = null;
};

// ==================== WATCH ====================
// Watch for inspectionId changes
watch(() => props.inspectionId, (newId) => {
  form.inspection_id = newId;
});

// ==================== LIFEHOOK ====================
// Initialize
if (!form.inspection_id) {
  console.warn('inspectionId prop is required');
}
</script>

<style scoped>
.customer-seller-form {
  max-width: 800px;
  margin: 0 auto;
  padding: 16px;
}

.bg-primary {
  background-color: #1976d2 !important;
}

.bg-secondary {
  background-color: #6c757d !important;
}

.bg-success {
  background-color: #4caf50 !important;
}

.text-white {
  color: white !important;
}
</style>