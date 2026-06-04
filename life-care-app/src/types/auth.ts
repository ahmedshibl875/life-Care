import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صحيح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تتكون من 6 أحرف على الأقل'),
});

export type LoginFormData = z.infer<typeof LoginSchema>;

export const RegisterSchema = z.object({
  name: z.string()
    .min(3, 'الاسم الكامل يجب أن يتكون من 3 أحرف على الأقل')
    .max(50, 'الاسم الكامل يجب ألا يتجاوز 50 حرفاً')
    .regex(/^[\u0600-\u06FFa-zA-Z\s]+$/, 'الاسم الكامل يجب أن يحتوي على حروف ومسافات فقط'),
  dob: z.string().optional(),
  medicalConditions: z.string().optional(),
  email: z.string().email('صيغة البريد الإلكتروني غير صحيحة'),
  phone: z.string()
    .min(10, 'رقم الهاتف يجب أن يتكون من 10 أرقام على الأقل')
    .regex(/^[0-9]+$/, 'رقم الهاتف يجب أن يحتوي على أرقام فقط'),
  password: z.string()
    .min(8, 'كلمة المرور يجب أن تتكون من 8 أحرف على الأقل')
    .max(50, 'كلمة المرور يجب ألا تتجاوز 50 حرفاً')
    .regex(/^(?=.*[a-zA-Z])(?=.*\d)/, 'كلمة المرور يجب أن تحتوي على الأقل على حرف واحد ورقم واحد'),
  confirmPassword: z.string().min(8, 'يرجى تأكيد كلمة المرور'),
  role: z.enum(['patient', 'companion', 'doctor']),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'كلمتا المرور غير متطابقتين',
  path: ['confirmPassword'],
});

export type RegisterFormData = z.infer<typeof RegisterSchema>;
