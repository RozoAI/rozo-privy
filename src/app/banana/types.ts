export interface Transformation {
  id: string;
  title: string;
  description: string;
  prompt: string;
  emoji: string;
  image?: string | null;
  isMultiImage?: boolean;
  isTwoStep?: boolean;
  stepTwoPrompt?: string;
  primaryUploaderTitle?: string;
  primaryUploaderDescription?: string;
  secondaryUploaderTitle?: string;
  secondaryUploaderDescription?: string;
  order?: number;
}

export interface GeneratedContent {
  imageUrl: string | null;
  text: string | null;
  secondaryImageUrl?: string | null;
}

export type ActiveTool = 'mask' | 'none';