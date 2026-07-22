import { z } from 'zod';

export const consultationSchema = z.object({
  consultation_type: z.enum(['in_person', 'telemedicine', 'home_visit']),
  consultation_date: z.string().min(1, 'Date is required'),
  reason_for_consultation: z.string().min(5, 'Reason must be at least 5 characters'),
  diagnosis: z.string(),
  icd_code: z.string().max(20).nullable().optional(),
  medical_report: z.string(),
  follow_up_date: z.string().nullable().optional(),
  visible_to_patient: z.boolean(),
  patient_summary: z.string(),
  patient_instructions: z.string(),
  height_unit: z.enum(['cm', 'm']),
  // Vitals — optional; setValueAs in register converts empty string to null and
  // a comma decimal ("36,9") to a number before zod sees it. Unparseable input
  // arrives as NaN, so each field carries an `error` message for that case —
  // without it zod reports the raw "expected number, received nan".
  weight: z.number({ error: 'Enter a number, e.g. 72.5' }).positive('Weight must be positive').max(500, 'Weight too high').optional().nullable(),
  height: z.number({ error: 'Enter a number, e.g. 170' }).positive('Height must be positive').max(300, 'Height too high').optional().nullable(),
  sp2: z.number({ error: 'Enter a number, e.g. 98' }).min(50, 'SpO₂ cannot be below 50%').max(100, 'SpO₂ cannot exceed 100%').optional().nullable(),
  temperature: z.number({ error: 'Enter a number, e.g. 36.9' }).min(30, 'Temperature too low').max(45, 'Temperature too high').optional().nullable(),
  bp_systolic: z.number({ error: 'Enter a whole number, e.g. 120' }).int().min(50).max(300).optional().nullable(),
  bp_diastolic: z.number({ error: 'Enter a whole number, e.g. 80' }).int().min(30).max(200).optional().nullable(),
}).refine(
  data => !(data.bp_systolic && data.bp_diastolic && data.bp_systolic <= data.bp_diastolic),
  { message: 'Systolic must be greater than diastolic', path: ['bp_systolic'] }
);

export type ConsultationFormData = z.infer<typeof consultationSchema>;
