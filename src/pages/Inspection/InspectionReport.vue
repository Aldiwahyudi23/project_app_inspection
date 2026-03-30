<template>
  <div class="report-page" ref="pageRef">

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Memuat laporan...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button @click="fetchReport">Coba Lagi</button>
    </div>

    <template v-else-if="report">

      <!-- ═══ INFO BANNER ═══ -->
      <div class="info-banner">
        <div class="info-banner-icon">👁️</div>
        <div class="info-banner-text">
          <strong>Preview Laporan PDF</strong>
          <span>Halaman ini adalah gambaran tampilan PDF yang akan dibuat. Periksa semua data, tambah estimasi jika diperlukan, lalu tekan <em>Generate PDF</em> di bagian bawah.</span>
        </div>
      </div>

      <!-- ═══ PAPER ═══ -->
      <div class="paper">

        <!-- HEADER -->
        <table class="header-table">
          <tr>
            <td style="width:33%">
              <template v-if="(hdr.company_position ?? 'left') === 'left'">
                <img v-if="(hdr.company_type ?? 'name') === 'logo' && hdr.company_logo"
                     :src="hdr.company_logo" alt="Logo" class="company-logo">
                <h1 v-else class="company-name">{{ hdr.company_name ?? 'cekMobil' }}</h1>
              </template>
            </td>
            <td style="width:34%;text-align:center">
              <h1 v-if="hdr.show_title" class="report-title">
                {{ hdr.title_text ?? 'Laporan Hasil' }}
              </h1>
            </td>
            <td style="width:33%;text-align:right">
              <template v-if="(hdr.company_position ?? 'left') === 'right'">
                <img v-if="(hdr.company_type ?? 'name') === 'logo' && hdr.company_logo"
                     :src="hdr.company_logo" alt="Logo" class="company-logo">
                <span v-else class="company-name-right" :style="{ color: hdr.company_name_color ?? '#0d98d8' }">
                  {{ hdr.company_name ?? 'cekMobil' }}
                </span>
              </template>
            </td>
          </tr>
        </table>

        <!-- INFO KENDARAAN -->
        <table class="info-table">
          <template v-if="cont.display_vehicle && cont.vehicle_display_type === 'detail' && vd">
            <tr v-for="row in detailRows" :key="row.label">
              <td class="info-label">{{ row.label }}</td>
              <td class="info-value">: {{ row.value }}</td>
              <td class="info-label">{{ row.label2 ?? '' }}</td>
              <td class="info-value">{{ row.value2 != null ? ': ' + row.value2 : '' }}</td>
            </tr>
          </template>

          <template v-else-if="cont.display_vehicle">
            <tr>
              <td style="width:40%;text-align:center;vertical-align:top;padding:6px 4px">
                <img v-if="tpl.image_display"
                     :src="tpl.image_display.image_url"
                     :alt="insp.vehicle_name ?? ''"
                     class="vehicle-thumb"
                     @click="openSingleImage(tpl.image_display.image_url, insp.vehicle_name)">
                <div class="vehicle-name-big">{{ insp.vehicle_name ?? '-' }}</div>
              </td>
              <td style="width:60%;vertical-align:top;padding:4px 6px" colspan="3">
                <table width="100%">
                  <tr><td class="info-label">Nomor Polisi</td><td class="info-value">: {{ insp.license_plate ?? '-' }}</td></tr>
                  <tr><td class="info-label">Kode Inspeksi</td><td class="info-value">: {{ insp.inspection_code ?? '-' }}</td></tr>
                  <tr><td class="info-label">Tanggal</td><td class="info-value">: {{ formatDate(insp.inspection_date, 'dd MMM yyyy, HH:mm') }}</td></tr>
                  <tr v-if="vData.km"><td class="info-label">Odometer</td><td class="info-value">: {{ formatNumber(insp.mileage) }} KM</td></tr>
                  <tr v-if="vData.color"><td class="info-label">Warna</td><td class="info-value">: {{ insp.color ?? '-' }}</td></tr>
                  <tr v-if="vData.no_rangka"><td class="info-label">No Rangka</td><td class="info-value">: {{ insp.no_rangka ?? '-' }}</td></tr>
                  <tr v-if="vData.no_mesin"><td class="info-label">No Mesin</td><td class="info-value">: {{ insp.no_mesin ?? '-' }}</td></tr>
                  <tr v-if="vData.id_transaksi"><td class="info-label">ID Transaksi</td><td class="info-value">: {{ insp.id ?? '-' }}</td></tr>
                </table>
              </td>
            </tr>
          </template>

          <template v-else>
            <tr>
              <td class="info-label">Kode Inspeksi</td>
              <td class="info-value">: {{ insp.inspection_code ?? '-' }}</td>
              <td class="info-label">Tanggal</td>
              <td class="info-value">: {{ formatDate(insp.inspection_date, 'dd MMM yyyy, HH:mm') }}</td>
            </tr>
          </template>
        </table>

        <!-- KESIMPULAN: BANJIR / TABRAK -->
        <table class="conclusion-table">
          <tr>
            <td style="width:50%;text-align:center;padding:4px">
              <img v-if="conclusion.flooded === 'yes'" :src="iconPath('banjir.png')" alt="Banjir" class="conclusion-icon">
              <img v-else :src="iconPath('aman.png')" alt="Aman" class="conclusion-icon">
              <p :style="{ color: conclusion.flooded === 'yes' ? '#dc3545' : '#0d98d8' }" class="conclusion-label">
                {{ conclusion.flooded === 'yes' ? 'Bekas Banjir' : 'Bebas Banjir' }}
              </p>
            </td>
            <td style="width:50%;text-align:center;padding:4px">
              <template v-if="conclusion.collision === 'yes'">
                <img :src="collisionIcon" :alt="collisionText" class="conclusion-icon">
                <p :style="{ color: collisionColor }" class="conclusion-label">{{ collisionText }}</p>
              </template>
              <template v-else>
                <img :src="iconPath('aman.png')" alt="Aman" class="conclusion-icon">
                <p style="color:#0d98d8" class="conclusion-label">Bebas Tabrak</p>
              </template>
            </td>
          </tr>
        </table>

        <!-- Catatan Inspeksi -->
        <div v-if="conclusion.notes" class="notes-box">
          <h3 class="notes-title">Kesimpulan Inspeksi:</h3>
          <div class="notes-content" v-html="conclusion.notes"></div>
        </div>

        <!-- ═══ SECTIONS ═══ -->
        <template v-for="(section, si) in report.sections" :key="section.section_id ?? si">
          <template v-if="hasContent(section)">
            <div class="page-break" v-if="si > 0"></div>
            <div class="section-box" :style="{ borderColor: sectionStyle(section).bg }">
              <div class="section-header" :style="{
                background: sectionStyle(section).bg,
                color: sectionStyle(section).color,
                textAlign: sectionStyle(section).align
              }">{{ section.title }}</div>

              <div class="section-body">
                <template v-if="section.table_setting && section.result?.length">
                  <div class="result-table-wrap">
                    <div v-for="(chunk, ci) in resultChunks(section)" :key="ci"
                         class="result-chunk"
                         :style="{ width: Number(section.table_setting.row) >= 2 ? '48%' : '100%' }">
                      <table class="result-table">
                        <thead v-if="section.table_setting.show_header">
                          <tr>
                            <th :class="borderClass(section)">Item</th>
                            <th :class="borderClass(section)">Kondisi</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="row in chunk" :key="row.inspection_item_id">
                            <td :class="borderClass(section)" class="result-name">{{ row.name }}</td>
                            <td :class="borderClass(section)">
                              <span v-for="(s, i) in parseStatus(row.value)" :key="i">
                                <span :style="{ color: statusColor(s) }">{{ s }}</span>
                                <span v-if="i < parseStatus(row.value).length - 1" style="color:#000">, </span>
                              </span>
                              <span v-if="!parseStatus(row.value).length">-</span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </template>

                <template v-if="section.images?.length">
                  <div v-for="(chunk, ci) in imageChunks(section)" :key="ci" class="img-row">
                    <div v-for="col in imagePerRow(section)" :key="col" class="img-cell"
                         :style="{ width: (100 / imagePerRow(section)) + '%' }">
                      <template v-for="img in [chunk[col - 1]]" :key="col + '-img'">
                        <template v-if="img">
                          <div class="img-name">{{ img.name ?? '-' }}</div>
                          <div class="img-wrap" @click="openSectionImage(section, img)">
                            <img :src="img.image_url" :alt="img.name ?? ''" :style="{ width: imgPxWidth(section) + 'px' }">
                          </div>
                          <div v-if="img.caption" class="img-caption">{{ img.caption }}</div>
                        </template>
                        <template v-else>
                          <div class="img-name-placeholder"></div>
                          <div class="img-placeholder" :style="{ width: imgPxWidth(section) + 'px', height: imgPxWidth(section) + 'px' }"></div>
                        </template>
                      </template>
                    </div>
                  </div>
                </template>

                <!-- NOTED dengan tombol + estimasi -->
                <template v-if="section.noted?.length">
                  <div v-for="(nd, ni) in section.noted" :key="ni" class="noted-item">
                    <div class="noted-header">
                      <span class="noted-name">{{ nd.name ?? '-' }}</span>
                      <template v-if="parseStatus(nd.status).length">
                        <span class="noted-status-wrap">
                          <i>(
                            <template v-for="(s, i) in parseStatus(nd.status)" :key="i">
                              <span :style="{ color: statusColor(s) }">{{ s }}</span>
                              <span v-if="i < parseStatus(nd.status).length - 1" style="color:#000">, </span>
                            </template>
                          )</i>
                        </span>
                      </template>
                      <!-- Tombol + estimasi: hanya saat under_review & status bukan ok/normal/baik/good -->
                      <button
                        v-if="isUnderReview && shouldShowEstBtn(nd.status)"
                        class="btn-add-est-inline"
                        @click="openEstModal(nd.name)"
                        title="Tambah Estimasi"
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                          <path d="M12 5v14M5 12h14"/>
                        </svg>
                        Estimasi
                      </button>
                    </div>
                    <div v-if="specialItemInfo(nd.name)" class="special-item-info">
                      <table class="special-item-table">
                        <tr v-for="row in specialItemInfo(nd.name)" :key="row.label">
                          <td class="si-label">{{ row.label }}</td>
                          <td class="si-value">: {{ row.value }}</td>
                        </tr>
                      </table>
                    </div>
                    <template v-if="nd.images?.length">
                      <div v-for="(nchunk, nci) in chunkArray(nd.images, 4)" :key="nci" class="noted-img-row">
                        <div v-for="col in 4" :key="col" class="noted-img-cell">
                          <template v-for="nimg in [nchunk[col - 1]]" :key="col + '-nimg'">
                            <template v-if="nimg">
                              <div class="noted-img-wrap" @click="openNotedImage(nd, nimg)">
                                <img :src="nimg.image_url" alt="" style="width:100%;height:auto">
                              </div>
                            </template>
                          </template>
                        </div>
                      </div>
                    </template>
                    <div v-if="nd.note" class="noted-note">
                      <strong>Catatan:</strong> {{ nd.note }}
                    </div>
                  </div>
                </template>

              </div>
            </div>
          </template>
        </template>

        <!-- ═══ ESTIMASI SECTION ═══ -->
        <div class="page-break"></div>
        <div class="section-box" style="border-color:#e53e3e" ref="estimasiRef">
          <div class="section-header" style="background:#e53e3e;color:#fff;text-align:center">Estimasi Perbaikan</div>
          <div class="section-body">

            <!-- List estimasi -->
            <transition-group name="est-list" tag="div" class="est-card-list">

              <!-- Real cards -->
              <div
                v-for="(est, idx) in localEstimations"
                :key="est.id ?? est._tempId"
                class="est-card"
                :class="{
                  'est-card--updating': est._updating,
                  'est-card--deleting': est._deleting,
                }"
              >
                <!-- Shimmer saat updating -->
                <div v-if="est._updating" class="est-card-shimmer"></div>

                <div class="est-card-top">
                  <span class="est-num">{{ idx + 1 }}.</span>
                  <span class="est-part">{{ est.part_name }}</span>
                  <div class="est-badges">
                    <span class="est-badge-urgency" :style="urgencyBadgeStyle(est.urgency)">
                      {{ urgencyLabel(est.urgency) }}
                    </span>
                    <span class="est-badge-status" :style="statusBadgeStyle(est.status)">
                      {{ statusLabel(est.status) }}
                    </span>
                  </div>
                  <span class="est-cost">Rp {{ formatNumber(est.estimated_cost) }}</span>
                  <!-- Edit button — hanya saat under_review -->
                  <button
                    v-if="isUnderReview"
                    class="est-edit-btn"
                    @click="openEstModalEdit(est)"
                    :disabled="est._updating || est._deleting"
                    title="Edit"
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                  <!-- Delete button — hanya saat under_review -->
                  <button
                    v-if="isUnderReview"
                    class="est-del-btn"
                    @click="removeEstimation(est)"
                    :disabled="est._updating || est._deleting"
                    title="Hapus"
                  >
                    <!-- Spinner saat deleting -->
                    <svg v-if="est._deleting" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="del-spin">
                      <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" opacity=".3"/>
                      <path d="M21 12a9 9 0 0 0-9-9"/>
                    </svg>
                    <span v-else>✕</span>
                  </button>
                </div>
                <div v-if="est.repair_description && est.repair_description !== '-'" class="est-desc">
                  {{ est.repair_description }}
                </div>
              </div>

              <!-- Skeleton card di BAWAH saat loading add -->
              <div v-for="sk in skeletonCount" :key="'sk-' + sk" class="est-card est-card--skeleton">
                <div class="skeleton-line skeleton-line--wide"></div>
                <div class="skeleton-line skeleton-line--narrow"></div>
              </div>

            </transition-group>

            <!-- Empty state -->
            <div v-if="!localEstimations.length && !skeletonCount" class="est-empty">
              Belum ada estimasi perbaikan.
            </div>

            <!-- Total -->
            <div v-if="localEstimations.length" class="est-total-row">
              <span class="est-total-label">Total Estimasi</span>
              <span class="est-total-value">Rp {{ formatNumber(totalEstimasi) }}</span>
            </div>

            <!-- Tombol Tambah — hanya saat under_review -->
            <div v-if="isUnderReview" class="add-est-wrap">
              <button class="btn-add-est" @click="openEstModal()">
                <span class="add-est-icon">＋</span>
                Tambah Estimasi
              </button>
            </div>

          </div>
        </div>

      </div><!-- end paper -->

      <!-- ═══ GENERATE PDF — hanya saat under_review ═══ -->
      <div v-if="isUnderReview" class="generate-wrap" ref="generateRef">
        <div class="generate-info">
          <span>✅</span>
          <span>Sudah yakin semua data benar? Tekan tombol di bawah untuk membuat PDF.</span>
        </div>
        <button class="btn-generate" :disabled="generating" :class="{ 'is-loading': generating }" @click="generatePdf">
          <span v-if="!generating" class="btn-generate-inner">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            Generate PDF
          </span>
          <span v-else class="btn-generate-inner">
            <span class="btn-spinner"></span>
            Membuat PDF...
          </span>
        </button>
      </div>

    </template>

    <!-- IMAGE PREVIEW MODAL -->
    <ImagePreviewModal
      v-model="modal"
      :is-under-review="isUnderReview" 
      @add-estimasi="openEstModalFromImage"
    />

    <!-- ESTIMASI MODAL -->
    <EstimasiModal
      v-model="estModalOpen"
      :prefill-part-name="estPrefillName"
      :edit-data="estEditData"
      @saved="onEstimasiSaved"
      @updated="onEstimasiUpdated"
    />

    <!-- FLOATING SCROLL FABs -->
    <transition name="fab-fade">
      <button v-if="scrollVisible && scrollDir === 'down'"
              class="fab fab-down"
              @click="scrollToBottom"
              aria-label="Ke bawah">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
    </transition>
    <transition name="fab-fade">
      <button v-if="scrollVisible && scrollDir === 'up'"
              class="fab fab-up"
              @click="scrollToTop"
              aria-label="Ke atas">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="18 15 12 9 6 15"/>
        </svg>
      </button>
    </transition>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ImagePreviewModal from '../../components/Report/ImagePreviewModal.vue'
import EstimasiModal     from '../../components/Report/EstimasiModal.vue' 
import {
  getDataReport,
  PostGeneratePDF,
  storeEstimasi,
  updateEstimasi,
  destroyEstimasi,
} from '../../services/inspectionReportService'
import type {
  ReportData, Section, ImageRow, ResultRow,
  NotedRow, NotedImage, ModalState, ModalImageItem,EstimasiItem,
} from '../../types/inspectionReport'

// ─── State ────────────────────────────────────────────────
const route             = useRoute()
const loading           = ref(true)
const error             = ref<string | null>(null)
const report            = ref<ReportData | null>(null)
const generating        = ref(false)
const generateRef       = ref<HTMLElement | null>(null)
const localInspectionId = computed(() => Number(route.params.id))

const modal = ref<ModalState>({ open: false, currentIndex: 0, images: [] })

// ─── Status guard ─────────────────────────────────────────
const isUnderReview = computed(() => insp.value?.status === 'under_review')

// ─── Estimasi state ───────────────────────────────────────
const localEstimations = ref<any[]>([])
const skeletonCount    = ref(0)
const estModalOpen     = ref(false)
const estPrefillName   = ref<string>('')
const estEditData      = ref<EstimasiItem | null>(null)
let _tempId = 0

// Buka modal tambah (dari noted / dari tabel)
function openEstModal(prefillName?: string) {
  estEditData.value    = null
  estPrefillName.value = prefillName ?? ''
  estModalOpen.value   = true
}

// Buka modal edit (dari tabel estimasi)
function openEstModalEdit(est: any) {
  estEditData.value    = { ...est }
  estPrefillName.value = ''
  estModalOpen.value   = true
}

// Buka modal dari image preview
function openEstModalFromImage(partName: string) {
  estEditData.value    = null
  estPrefillName.value = partName
  estModalOpen.value   = true
}

// Callback: setelah modal emit 'saved' → skeleton bawah → hit API
async function onEstimasiSaved(data: EstimasiItem) {
  skeletonCount.value = 1
  try {
    const res   = await storeEstimasi(localInspectionId.value, data)
    const saved = res.data?.data ?? { ...data, _tempId: ++_tempId }
    localEstimations.value.push(saved)
  } catch (e: any) {
    alert(e?.response?.data?.message ?? 'Gagal menyimpan estimasi')
  } finally {
    skeletonCount.value = 0
  }
}

// Callback: setelah modal emit 'updated' → shimmer di card
async function onEstimasiUpdated(data: EstimasiItem) {
  const idx = localEstimations.value.findIndex((e) => e.id === data.id)
  if (idx === -1) return
  localEstimations.value[idx] = { ...localEstimations.value[idx], _updating: true }
  try {
    const res     = await updateEstimasi(localInspectionId.value, data.id!, data)
    const updated = res.data?.data ?? { ...data }
    localEstimations.value[idx] = { ...updated, _updating: false }
  } catch (e: any) {
    localEstimations.value[idx]._updating = false
    alert(e?.response?.data?.message ?? 'Gagal mengupdate estimasi')
  }
}

// Hapus estimasi — spinner di tombol, fade-out card
async function removeEstimation(est: any) {
  if (!confirm(`Hapus estimasi "${est.part_name}"?`)) return
  const idx = localEstimations.value.findIndex((e) => (e.id ?? e._tempId) === (est.id ?? est._tempId))
  if (idx === -1) return
  localEstimations.value[idx]._deleting = true
  try {
    if (est.id) await destroyEstimasi(localInspectionId.value, est.id)
    setTimeout(() => { localEstimations.value.splice(idx, 1) }, 350)
  } catch (e: any) {
    localEstimations.value[idx]._deleting = false
    alert(e?.response?.data?.message ?? 'Gagal menghapus estimasi')
  }
}

// ─── Apakah status perlu tombol estimasi ─────────────────
const okStatuses = ['ok', 'normal', 'baik', 'good', 'ada']
function shouldShowEstBtn(status: any): boolean {
  const statuses = parseStatus(status)
  if (!statuses.length) return false
  return statuses.some((s) => !okStatuses.includes(s.toLowerCase()))
}

// ─── Floating scroll FAB ──────────────────────────────────
const scrollVisible = ref(false)
const scrollDir     = ref<'up' | 'down'>('down')
let lastScrollY = 0
let scrollTimer: ReturnType<typeof setTimeout> | null = null

function onScroll() {
  const y             = window.scrollY
  scrollDir.value     = y > lastScrollY ? 'down' : 'up'
  scrollVisible.value = true
  lastScrollY         = y
  if (scrollTimer) clearTimeout(scrollTimer)
  scrollTimer = setTimeout(() => { scrollVisible.value = false }, 1800)
}
function scrollToBottom() { generateRef.value?.scrollIntoView({ behavior: 'smooth' }) }
function scrollToTop()    { window.scrollTo({ top: 0, behavior: 'smooth' }) }

// ─── Computed ─────────────────────────────────────────────
const insp       = computed(() => report.value?.inspection ?? {})
const vd         = computed(() => report.value?.vehicle_detail?.data ?? null)
const tpl        = computed(() => report.value?.report_template ?? {})
const cfg        = computed(() => tpl.value?.config_json ?? {})
const hdr        = computed(() => cfg.value?.header ?? {})
const cont       = computed(() => cfg.value?.content ?? {})
const vData      = computed(() => cont.value?.vehicle_data ?? {})
const conclusion = computed(() => report.value?.conclusion ?? {})

const totalEstimasi = computed(() =>
  localEstimations.value.reduce((sum, e) => sum + Number(e.estimated_cost ?? 0), 0)
)

const detailRows = computed(() => {
  if (!vd.value || !insp.value) return []
  const v = vd.value, i = insp.value, vd2 = vData.value
  return [
    { label:'Nomor Polisi', value:i.license_plate??'-', label2:'Kode Inspeksi', value2:i.inspection_code??'-' },
    { label:'Merek', value:v.brand?.name??'-', label2:'Tanggal Inspeksi', value2:formatDate(i.inspection_date,'dd-MM-yyyy HH:mm') },
    { label:'Model', value:v.model?.name??'-', label2:vd2.km?'Odometer':'', value2:vd2.km?formatNumber(i.mileage)+' KM':null },
    { label:'Tipe', value:v.type?.name??'-', label2:vd2.color?'Warna':'', value2:vd2.color?i.color??'-':null },
    { label:'Tahun', value:v.year??'-', label2:vd2.no_rangka?'No Rangka':'', value2:vd2.no_rangka?i.no_rangka??'-':null },
    { label:'CC', value:v.cc?.name??'-', label2:vd2.no_mesin?'No Mesin':'', value2:vd2.no_mesin?i.no_mesin??'-':null },
    { label:'Transmisi', value:v.transmission?.name??'-', label2:vd2.id_transaksi?'ID Transaksi':'', value2:vd2.id_transaksi?i.id??'-':null },
    { label:'Bahan Bakar', value:v.fuel_type??'-', label2:'', value2:null },
    { label:'Periode Pasar', value:v.market_period??'-', label2:'', value2:null },
  ]
})

const collisionIcon  = computed(() => { const s=conclusion.value.collision_severity; return s==='heavy'?iconPath('berat.png'):s==='moderate'?iconPath('beruntun.png'):iconPath('ringan.png') })
const collisionText  = computed(() => { const s=conclusion.value.collision_severity; return s==='heavy'?'Tabrak Berat':s==='moderate'?'Tabrak Sedang':'Tabrak Ringan' })
const collisionColor = computed(() => { const s=conclusion.value.collision_severity; return s==='heavy'?'#dc3545':s==='moderate'?'#fd7e14':'#ff6f00' })

// ─── Helpers ──────────────────────────────────────────────
function extraInfoForItem(n: string | null | undefined) {
  if (!n) return undefined
  const name = n.trim().toLowerCase(), i = insp.value

  if (name.includes('no fisik mesin') || name.includes('no mesin fisik') ||
      name.includes('nomor fisik mesin') || name.includes('nomor mesin fisik'))
    return [{ label: 'No Mesin', value: i.no_mesin ?? '-' }]

  if (name.includes('no rangka fisik') || name.includes('no fisik rangka') ||
      name.includes('nomor rangka fisik') || name.includes('nomor fisik rangka'))
    return [{ label: 'No Rangka', value: i.no_rangka ?? '-' }]

  if (name === 'stnk' || name.includes('surat tanda nomor'))
    return [
      { label: 'No Mesin',        value: i.no_mesin  },
      { label: 'No Rangka',       value: i.no_rangka ?? '-' },
      { label: 'Pajak Tahunan',   value: i.pajak_tahunan ?? '-' },
      { label: 'Pajak 5 Tahunan', value: i.pajak_5_tahunan ?? '-' },
    ]

  if (name.includes('instrument cluster') || name.includes('instrumen cluster'))
    return [{ label: 'Odometer', value: i.mileage != null ? formatNumber(i.mileage) + ' KM' : '-' }]

  return undefined
}

function specialItemInfo(n:string|null|undefined) { const info=extraInfoForItem(n); return info?.length?info:null }
function makeImageItem(img:ImageRow):ModalImageItem { return {url:img.image_url,itemName:img.name??'',caption:img.caption,extraInfo:extraInfoForItem(img.name)} }
function openSectionImage(section:Section, clicked:ImageRow) {
  const items=section.images.map(makeImageItem)
  const idx=section.images.findIndex(img=>img.id===clicked.id&&img.image_url===clicked.image_url)
  modal.value={open:true,currentIndex:Math.max(0,idx),images:items}
}
function openNotedImage(nd:NotedRow, clicked:NotedImage) {
  const items:ModalImageItem[]=nd.images.map(img=>({url:img.image_url,itemName:nd.name??'',caption:img.caption,status:nd.status,note:nd.note,extraInfo:extraInfoForItem(nd.name)}))
  const idx=nd.images.findIndex(img=>img.id===clicked.id&&img.image_url===clicked.image_url)
  modal.value={open:true,currentIndex:Math.max(0,idx),images:items}
}
function openSingleImage(url:string, name?:string) { modal.value={open:true,currentIndex:0,images:[{url,itemName:name??'',extraInfo:extraInfoForItem(name)}]} }

function iconPath(file:string) { return `/images/icons/${file}` }
function formatDate(dateStr:string, _fmt:string) { if(!dateStr)return'-'; return new Date(dateStr).toLocaleDateString('id-ID',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}).replace(',','') }
function formatNumber(n:any) { return Math.floor(Number(n??0)).toLocaleString('id-ID') }
function parseStatus(val:any):string[] { if(!val)return[]; if(Array.isArray(val))return val.filter(Boolean); const t=String(val).trim(); if(t.startsWith('[')){try{const arr=JSON.parse(t);if(Array.isArray(arr))return arr.filter(Boolean)}catch{}}return[val] }
function statusColor(s:string) { const sl=s.toLowerCase(); if(['normal','ada','baik','good','ok'].includes(sl))return'#0d98d8'; if(['tidak normal','tidak ada','rusak','bad','not ok','repaired','gantian','repaint','renggang','baret penyok','tabrak','banjir'].includes(sl))return'#dc3545'; return'#ff6f00' }
function urgencyLabel(u:string) { return u==='immediate'?'Segera':u==='soon'?'Dalam Waktu Dekat':u==='optional'?'Opsional':u==='monitor'?'Pantau':u??'-' }
function statusLabel(s:string)  { return s==='required'?'Wajib':s==='recommended'?'Disarankan':s==='optional'?'Opsional':s??'-' }
function hasContent(s:Section)  { return !!(s.result?.length||s.images?.length||s.noted?.length) }
function sectionStyle(s:Section) { return {bg:s.style?.background_color??'#0d98d8',color:s.style?.title_color??'#ffffff',align:(s.style?.title_align??'center') as 'left'|'center'|'right'} }
function imagePerRow(s:Section):number { return Math.max(2,Math.min(4,parseInt(s.layout?.row_image??'4'))) }
function imgPxWidth(s:Section):number  { return Math.floor(340/imagePerRow(s))-6 }
function imageChunks(s:Section):ImageRow[][] { return chunkArray(s.images,imagePerRow(s)) }
function resultChunks(s:Section):ResultRow[][] { const cols=parseInt(String(s.table_setting?.row??'1')); if(cols>=2){const half=Math.ceil(s.result.length/2);return chunkArray(s.result,half)}return[s.result] }
function borderClass(s:Section) { const bs=s.table_setting?.border_style??'underline'; return bs==='underline'?'border-underline':['box','full'].includes(bs)?'border-box':'' }
function chunkArray<T>(arr:T[],size:number):T[][] { const result:T[][]=[];for(let i=0;i<arr.length;i+=size)result.push(arr.slice(i,i+size));return result }
function urgencyBadgeStyle(u:string) {
  if(u==='immediate') return {background:'#fff0f0',color:'#a32d2d',border:'0.5px solid #f09595'}
  if(u==='soon')      return {background:'#fff8e6',color:'#854f0b',border:'0.5px solid #fac775'}
  return                     {background:'#f1f1ee',color:'#5f5e5a',border:'0.5px solid #d3d1c7'}
}
function statusBadgeStyle(s:string) {
  if(s==='required')    return {background:'#fff0f0',color:'#a32d2d',border:'0.5px solid #f09595'}
  if(s==='recommended') return {background:'#fff8e6',color:'#854f0b',border:'0.5px solid #fac775'}
  return                       {background:'#f1f1ee',color:'#5f5e5a',border:'0.5px solid #d3d1c7'}
}

// ─── Fetch & Generate ─────────────────────────────────────
async function fetchReport() {
  loading.value=true; error.value=null
  try {
    const id  = Number(route.params.id)
    const res = await getDataReport(id)
    const body = res.data ?? res
    report.value = body?.data ?? body
    localEstimations.value = [...(report.value?.estimations ?? [])]
  } catch(e:any) { error.value=e?.response?.data?.message??'Gagal memuat laporan' }
  finally { loading.value=false }
}

const router = useRouter()

async function generatePdf() {
  generating.value = true
  try {
    const id  = Number(route.params.id)
    const res = await PostGeneratePDF(id)
    if (res.data?.success) {
      // Redirect ke job detail setelah generate berhasil
      router.push(`/jobs/${id}`)  // ← sesuaikan nama field uuid
    } else {
      alert(res.data?.message ?? 'Gagal generate PDF')
    }
  } catch(e: any) {
    alert(e?.response?.data?.message ?? 'Gagal generate PDF')
  } finally {
    generating.value = false
  }
}

onMounted(() => { fetchReport(); window.addEventListener('scroll', onScroll, { passive: true }) })
onUnmounted(() => { window.removeEventListener('scroll', onScroll); if(scrollTimer)clearTimeout(scrollTimer) })
</script>

<style scoped>
.report-page {
  background: #f0f2f5;
  min-height: 100vh;
  padding: 6px 6px 28px;
  font-family: 'Segoe UI', sans-serif;
  font-size: 11px;
  -webkit-text-size-adjust: 100%;
}

/* ── INFO BANNER ─────────────────────────────────────── */
.info-banner {
  display: flex; align-items: flex-start; gap: 8px;
  background: linear-gradient(135deg, #e8f4fd 0%, #d0eaf9 100%);
  border: 1px solid #a8d4f0; border-left: 4px solid #0d98d8;
  border-radius: 8px; padding: 9px 10px; margin-bottom: 8px;
  animation: slideDown 0.4s ease both;
}
.info-banner-icon { font-size: 16px; flex-shrink: 0; margin-top: 1px; }
.info-banner-text { display: flex; flex-direction: column; gap: 2px; }
.info-banner-text strong { font-size: 11px; color: #0a6fa0; }
.info-banner-text span   { font-size: 10px; color: #2c5f7a; line-height: 1.5; }
.info-banner-text em     { font-style: normal; font-weight: 700; color: #0d98d8; }

/* ── PAPER ───────────────────────────────────────────── */
.paper {
  background: #fff; max-width: 100%; margin: 0 auto; padding: 8px;
  border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,.08);
  animation: fadeUp 0.35s ease both; animation-delay: 0.06s;
}
@keyframes fadeUp    { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }
@keyframes slideDown { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:none; } }

/* ── HEADER ──────────────────────────────────────────── */
.header-table { width:100%; border-collapse:collapse; margin-bottom:10px; }
.company-name { margin:0; font-size:13px; font-weight:bold; color:#000; }
.company-name-right { font-size:13px; font-weight:bold; }
.company-logo { max-height:36px; max-width:110px; }
.report-title { font-size:11px; margin:0; font-weight:bold; }

/* ── INFO KENDARAAN ──────────────────────────────────── */
.info-table { width:100%; border-collapse:collapse; margin-bottom:10px; }
.info-label { padding:2px 4px; font-weight:bold; width:90px; font-size:10px; vertical-align:top; white-space:nowrap; color:#444; }
.info-value { padding:2px 4px; font-size:10px; vertical-align:top; }
.vehicle-thumb { width:110px; height:auto; border:1px solid #ddd; border-radius:4px; cursor:pointer; }
.vehicle-name-big { font-size:10px; font-weight:bold; margin-top:4px; }

/* ── KESIMPULAN ──────────────────────────────────────── */
.conclusion-table { width:100%; margin:8px 0; border-collapse:collapse; text-align:center; }
.conclusion-table td { vertical-align: middle; }
.conclusion-icon { width:56px; height:56px; display:block; margin:0 auto 4px auto; }
.conclusion-label { font-weight:bold; font-size:10px; margin:0; text-align:center; }

/* ── NOTES ───────────────────────────────────────────── */
.notes-box    { margin:8px 0; padding:8px; background:#f9f9f9; border-left:3px solid #0d98d8; }
.notes-title  { margin:0 0 4px; font-size:11px; }
.notes-content{ font-size:10px; line-height:1.6; }

/* ── SECTIONS ────────────────────────────────────────── */
.section-box    { border:1px solid #0d98d8; border-radius:8px 8px 0 0; margin-bottom:12px; overflow:hidden; }
.section-header { font-size:11px; font-weight:bold; padding:5px 8px; }
.section-body   { padding:6px; }
.page-break     { page-break-before:always; margin-top:14px; }

/* ── RESULT TABLE ────────────────────────────────────── */
.result-table-wrap { display:flex; gap:6px; margin-bottom:8px; flex-wrap:wrap; }
.result-chunk      { flex-shrink:0; }
.result-table      { width:100%; border-collapse:collapse; font-size:9px; }
.result-table th   { background:#f0f0f0; padding:3px 5px; text-align:left; font-size:9px; }
.result-name       { font-weight:500; }
.result-table td   { padding:2px 4px; vertical-align:top; }
.border-underline  { border-bottom:1px solid #ccc; }
.border-box        { border:1px solid #ccc; }

/* ── IMAGE GRID ──────────────────────────────────────── */
.img-row  { display:flex; margin-bottom:3px; }
.img-cell { vertical-align:top; padding:0 2px 3px 0; text-align:center; box-sizing:border-box; }
.img-name { font-size:9px; font-weight:bold; color:#333; height:26px; overflow:hidden; line-height:1.2; word-break:break-word; }
.img-name-placeholder { height:8px; }
.img-wrap { display:inline-block; border:1px solid #ddd; padding:1px; background:#fff; border-radius:2px; cursor:pointer; }
.img-wrap:active { box-shadow:0 0 0 2px #0d98d8; }
.img-wrap img { display:block; height:auto; max-width:100%; }
.img-placeholder { border:1px dashed #eee; border-radius:2px; background:#fafafa; }
.img-caption { font-size:8px; color:#777; font-style:italic; margin-top:1px; }

/* ── NOTED ───────────────────────────────────────────── */
.noted-item    { margin-bottom:10px; border-bottom:1px dashed #ccc; padding-bottom:8px; }
.noted-header  { display:flex; align-items:center; flex-wrap:wrap; gap:4px; font-weight:bold; font-size:10px; padding:3px 2px; }
.noted-name    { margin-right:3px; }
.noted-status-wrap { font-weight:normal; flex:1; }
.noted-img-row { display:flex; margin-top:3px; gap:3px; }
.noted-img-cell { width:25%; text-align:center; }
.noted-img-wrap { display:inline-block; border:1px solid #ddd; padding:1px; background:#fff; border-radius:2px; cursor:pointer; width:100%; }
.noted-img-wrap:active { box-shadow:0 0 0 2px #0d98d8; }
.noted-img-wrap img { display:block; width:100%; height:auto; }
.noted-note { margin:6px 0 2px; font-style:italic; color:#555; font-size:9px; padding:4px 6px; background:#f5f5f5; border-radius:4px; line-height:1.5; }

/* Tombol + estimasi di noted */
.btn-add-est-inline {
  display: inline-flex; align-items: center; gap: 3px;
  padding: 2px 7px; background: #fff5f5;
  border: 1px solid #f09595; border-radius: 10px;
  color: #c53030; font-size: 9px; font-weight: 600;
  cursor: pointer; flex-shrink: 0;
  transition: background 0.15s;
  -webkit-tap-highlight-color: transparent;
}
.btn-add-est-inline:active { background: #ffe0e0; }

/* ── SPECIAL ITEM ────────────────────────────────────── */
.special-item-info { margin:4px 0 6px 2px; padding:6px 10px; background:#f0f8ff; border:1px solid #b8dff5; border-radius:5px; display:inline-block; }
.special-item-table { border-collapse:collapse; font-size:10px; }
.special-item-table tr+tr td { padding-top:2px; }
.si-label { font-weight:600; color:#444; padding-right:6px; white-space:nowrap; }
.si-value { color:#111; font-family:'Courier New',monospace; font-weight:500; }

/* ── ESTIMASI CARDS ──────────────────────────────────── */
.est-card-list { display:flex; flex-direction:column; gap:6px; margin-bottom:8px; }

.est-list-enter-active { animation: estIn 0.28s ease; }
.est-list-leave-active { animation: estOut 0.22s ease forwards; position:relative; }
@keyframes estIn  { from{opacity:0;transform:translateY(-8px) scale(.97)} to{opacity:1;transform:none} }
@keyframes estOut { from{opacity:1;transform:none} to{opacity:0;transform:translateX(16px) scale(.97)} }

.est-card {
  border:1px solid #f0c0c0; border-radius:6px; padding:7px 8px;
  background:#fff9f9; font-size:10px;
  position: relative; overflow: hidden;
  transition: opacity .3s, transform .3s;
}
.est-card--updating { opacity: .65; }
.est-card--deleting { opacity: .35; transform: scale(.98); pointer-events: none; }

/* Shimmer saat updating */
.est-card-shimmer {
  position: absolute; inset: 0;
  background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,.7) 50%, transparent 100%);
  background-size: 200% 100%;
  animation: shimmer 1.1s infinite;
  pointer-events: none;
}
@keyframes shimmer { from{background-position:200% 0} to{background-position:-200% 0} }

/* Skeleton */
.est-card--skeleton {
  border-color: #f0c0c0; background: #fff9f9;
  animation: skeletonPulse 1.1s ease-in-out infinite;
}
@keyframes skeletonPulse { 0%,100%{opacity:.55} 50%{opacity:.9} }
.skeleton-line { background:#fce4e4; border-radius:4px; height:10px; margin-bottom:6px; }
.skeleton-line--wide { width:65%; }
.skeleton-line--narrow { width:38%; }

.est-card-top { display:flex; align-items:center; gap:4px; margin-bottom:3px; }
.est-num  { color:#888; font-size:9px; flex-shrink:0; }
.est-part { font-weight:bold; font-size:10px; flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.est-badges { display:flex; gap:3px; flex-shrink:0; }
.est-badge-urgency, .est-badge-status { font-size:8px; font-weight:600; padding:1px 5px; border-radius:10px; white-space:nowrap; }
.est-cost { font-weight:bold; font-size:10px; color:#333; flex-shrink:0; white-space:nowrap; }

.est-edit-btn {
  background: none; border: none; color: #ccc;
  cursor: pointer; padding: 0 3px; flex-shrink: 0; line-height: 1;
  transition: color .15s; -webkit-tap-highlight-color: transparent;
  display: flex; align-items: center;
}
.est-edit-btn:active:not(:disabled) { color: #0d98d8; }
.est-edit-btn:disabled { opacity: .3; cursor: not-allowed; }

.est-del-btn {
  background: none; border: none; color: #ddd; font-size: 12px;
  cursor: pointer; padding: 0 2px; flex-shrink: 0; line-height: 1;
  transition: color .15s; -webkit-tap-highlight-color: transparent;
  display: flex; align-items: center;
}
.est-del-btn:active:not(:disabled) { color: #e53e3e; }
.est-del-btn:disabled { cursor: not-allowed; }
.del-spin { animation: spin .7s linear infinite; color: #e53e3e; }
@keyframes spin { to { transform: rotate(360deg); } }

.est-desc { color:#444; margin-bottom:2px; line-height:1.4; padding-left:14px; margin-top:1px; font-size:9px; }
.est-empty { text-align:center; color:#bbb; font-size:10px; padding:10px 0 6px; font-style:italic; }

.est-total-row { display:flex; justify-content:space-between; align-items:center; margin-top:8px; padding:7px 8px; background:#fff5f5; border:0.5px solid #f09595; border-radius:6px; }
.est-total-label { font-size:10px; font-weight:bold; color:#a32d2d; }
.est-total-value { font-size:12px; font-weight:bold; color:#a32d2d; }

/* ── ADD ESTIMASI BUTTON ─────────────────────────────── */
.add-est-wrap { margin-top:8px; }
.btn-add-est {
  display:flex; align-items:center; gap:6px; width:100%;
  padding:8px 12px; background:#fff; border:1.5px dashed #0d98d8;
  border-radius:7px; color:#0d98d8; font-size:11px; font-weight:600;
  cursor:pointer; justify-content:center; transition:background .15s;
}
.btn-add-est:active { background:#e8f4fd; }
.add-est-icon { font-size:15px; line-height:1; }

/* ── GENERATE AREA ───────────────────────────────────── */
.generate-wrap {
  margin-top:10px; padding:12px 10px; background:#fff;
  border-radius:10px; box-shadow:0 2px 12px rgba(0,0,0,.08);
  animation:fadeUp .4s ease both; animation-delay:.1s;
}
.generate-info { display:flex; align-items:flex-start; gap:6px; font-size:10px; color:#555; margin-bottom:10px; line-height:1.5; }
.generate-info span:first-child { flex-shrink:0; font-size:13px; }

.btn-generate {
  width:100%; padding:13px;
  background:linear-gradient(135deg,#e53e3e 0%,#c53030 100%);
  color:#fff; border:none; border-radius:10px; font-size:12px; font-weight:700;
  cursor:pointer; letter-spacing:.4px;
  box-shadow:0 2px 14px rgba(229,62,62,.38);
  transition:opacity .2s,transform .15s,box-shadow .2s;
  position:relative; overflow:hidden;
}
.btn-generate::after {
  content:''; position:absolute; inset:0;
  background:linear-gradient(120deg,transparent 30%,rgba(255,255,255,.18) 50%,transparent 70%);
  transform:translateX(-100%); transition:transform .55s;
}
.btn-generate:not(:disabled):active { transform:scale(.97); box-shadow:0 2px 8px rgba(229,62,62,.3); }
.btn-generate:not(:disabled):hover::after { transform:translateX(100%); }
.btn-generate:disabled { opacity:.6; cursor:not-allowed; box-shadow:none; }
.btn-generate.is-loading { animation:pulseShadow 1.4s ease-in-out infinite; }
@keyframes pulseShadow { 0%,100%{box-shadow:0 4px 16px rgba(229,62,62,.38)} 50%{box-shadow:0 4px 26px rgba(229,62,62,.6)} }
.btn-generate-inner { display:flex; align-items:center; justify-content:center; gap:8px; }
.btn-spinner { width:15px; height:15px; border:2px solid rgba(255,255,255,.35); border-top-color:#fff; border-radius:50%; animation:spin .65s linear infinite; flex-shrink:0; }

/* ── FLOATING FAB ────────────────────────────────────── */
.fab {
  position:fixed; right:14px; bottom:20px;
  width:42px; height:42px; border-radius:50%; border:none; cursor:pointer;
  display:flex; align-items:center; justify-content:center;
  box-shadow:0 3px 14px rgba(0,0,0,.22); z-index:999;
  -webkit-tap-highlight-color:transparent; touch-action:manipulation;
}
.fab-down { background:linear-gradient(135deg,#0d98d8,#0b7dba); color:#fff; }
.fab-up   { background:linear-gradient(135deg,#555,#333);       color:#fff; }

.fab-fade-enter-active { animation:fabIn  .22s cubic-bezier(.34,1.56,.64,1); }
.fab-fade-leave-active { animation:fabOut .18s ease forwards; }
@keyframes fabIn  { from{opacity:0;transform:scale(.55) translateY(6px)} to{opacity:1;transform:none} }
@keyframes fabOut { from{opacity:1;transform:none} to{opacity:0;transform:scale(.65)} }

/* ── LOADING / ERROR ─────────────────────────────────── */
.loading-state,.error-state { text-align:center; padding:40px 20px; color:#666; font-size:12px; }
.spinner { width:30px; height:30px; border:2.5px solid #eee; border-top-color:#0d98d8; border-radius:50%; animation:spin .7s linear infinite; margin:0 auto 10px; }

button { -webkit-tap-highlight-color:transparent; touch-action:manipulation; }
img    { -webkit-user-drag:none; }
</style>