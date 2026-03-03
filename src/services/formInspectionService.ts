// src/services/formSinspectionervice.ts
import api from './api'
import type { FormInspectionData } from '../types/formInspection'
import axios from 'axios'

export const getFormInspection = async (id: number) => {
  const response = await api.get(`/app-inspection/form-inspection/start/${id}`)
  return response
}

export const saveInspectionForm = async (inspectionId: number, data: any) => {
  const response = await api.post(
    `/app-inspection/form-inspection/${inspectionId}/save`,
    data
  )
  return response
}

// //Uji coba lewat MOCK SERVER POSTMAN
// export const saveInspectionForm = async (inspectionId: number, data: any) => {
//   const response = await axios.post(
//     `https://effeea7d-c776-4f7b-b23b-7670aa115a00.mock.pstmn.io/app-inspection/form-inspection/save`,
//     data
//   )
//   return response
// }

export const uploadInspectionImages = async (
  inspectionId: number,
  inspectionItemId: number,
  files: File[],
  itemId: number,
  selectedOptionValue: string | null = null
) => {
  const formData = new FormData()
  formData.append('inspection_id', String(inspectionId))
  formData.append('inspection_item_id', String(inspectionItemId))
  formData.append('item_id', String(itemId))
  
  if (selectedOptionValue !== null) {
    formData.append('selected_option_value', selectedOptionValue)
  }

  files.forEach((file) => {
    formData.append('images[]', file)
  })

  const response = await api.post(
    '/app-inspection/form-inspection/upload-image',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  )
  return response.data // pastikan data array gambar kembali
}

export const deleteInspectionImage = async (imageId: number) => {
  const response = await api.delete(`/app-inspection/form-inspection/image/${imageId}`)
  return response.data
}

export const deleteInspectionItem = async (inspectionId: number, itemId: number) => {
  const response = await api.delete(`/app-inspection/form-inspection/${inspectionId}/items/${itemId}`)
  return response.data
}