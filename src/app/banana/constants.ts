import type { Transformation } from './types';

export const TRANSFORMATIONS: Transformation[] = [
  {
    id: '3d-figurine',
    title: "3D Figurine",
    prompt: "turn this photo into a character figure. Behind it, place a box with the character's image printed on it, and a computer showing the Blender modeling process on its screen. In front of the box, add a round plastic base with the character figure standing on it. set the scene indoors if possible",
    emoji: "🧍",
    image: "/3D.png",
    description: "Turns your photo into a collectible 3D character figurine, complete with packaging."
  },
  {
    id: 'van-gogh',
    title: "Van Gogh Style",
    prompt: "Reimagine the photo in the style of Van Gogh's 'Starry Night'.",
    emoji: "🌌",
    image: "/VANGOGH.png",
    description: "Repaints your photo with the iconic, swirling brushstrokes of 'Starry Night'."
  },
  {
    id: 'visa-photo',
    title: "Visa Photo Generator",
    prompt: "Size The photo should be 2x2 inches (600x600 pixels). Background Use a plain white or off-white background. Expression Maintain a neutral expression. Attire Avoid glasses, headgear, and uniforms unless for religious reasons. Quality Ensure high resolution (at least 300 DPI) and proper lighting without shadows. ",
    emoji: "😊",
    image: "/ID.png",
    description: "Size The photo should be 2x2 inches (600x600 pixels). Background Use a plain white or off-white background. Expression Maintain a neutral expression. Attire Avoid glasses, headgear, and uniforms unless for religious reasons. Quality Ensure high resolution (at least 300 DPI) and proper lighting without shadows. "
  },
  {
    id: 'cyberpunk',
    title: "Cyberpunk",
    prompt: "Transform the scene into a futuristic cyberpunk city.",
    emoji: "🤖",
    image: "/CYBER.png",
    description: "Transforms your scene into a neon-drenched, futuristic cyberpunk city."
  },

  // Two-image transformations
  {
    id: 'pose-reference',
    title: "Pose Reference",
    prompt: "Apply the pose from the second image to the character in the first image. Render as a professional studio photograph.",
    emoji: "💃",
    image: "/POSE.png",
    description: "Applies a pose from one image to a character from another.",
    isMultiImage: true,
    primaryUploaderTitle: "Character",
    primaryUploaderDescription: "The main character",
    secondaryUploaderTitle: "Pose Reference",
    secondaryUploaderDescription: "The pose to apply",
  },
  {
    id: 'picture-together',
    title: "Picture Together",
    prompt: "Seamlessly merge the two people from these images together into one natural-looking photo with professional lighting.",
    emoji: "👥",
    image: "/PICTURETOGETHER.png",
    description: "Combines two people from separate photos into one realistic image.",
    isMultiImage: true,
    primaryUploaderTitle: "First Person",
    primaryUploaderDescription: "The first person to merge",
    secondaryUploaderTitle: "Second Person",
    secondaryUploaderDescription: "The second person to merge",
  },
  {
    id: 'change-shirt',
    title: "Change Shirt",
    prompt: "Have the person from the first image wear the shirt/clothing from the second image. Make it look natural and well-fitted.",
    emoji: "👕",
    image: "/CHANGESHIRT.png",
    description: "Shows how you would look wearing a specific shirt or piece of clothing.",
    isMultiImage: true,
    primaryUploaderTitle: "Person",
    primaryUploaderDescription: "The person who will wear the clothing",
    secondaryUploaderTitle: "Clothing Item",
    secondaryUploaderDescription: "The shirt or clothing to try on",
  },
  {
    id: 'custom',
    title: "Custom Prompt",
    prompt: "CUSTOM",
    emoji: "✍️",
    image: null,
    description: "Describe any change you can imagine. Your creativity is the only limit!"
  },
];