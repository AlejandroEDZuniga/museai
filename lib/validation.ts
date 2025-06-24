import { z } from 'zod'

export const analyzeImageSchema = z.object({
  image: z.string().min(1, 'Image is required'),
  location: z.string().optional(),
  language: z.enum(['en']).default('en')
})

export const chatMessageSchema = z.object({
  scanId: z.string().uuid(),
  message: z.string().min(1, 'Message is required'),
  language: z.enum(['en']).default('en')
})

export const userLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180)
})

export type AnalyzeImageInput = z.infer<typeof analyzeImageSchema>
export type ChatMessageInput = z.infer<typeof chatMessageSchema>
export type UserLocationInput = z.infer<typeof userLocationSchema>