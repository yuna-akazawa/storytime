export interface StoryTemplate {
  id: string
  name: string
  variables: string[]
  template: string
}

export interface GeneratedStory {
  pages: string[]
  title: string
}

export function generateStoryContent(template: StoryTemplate): GeneratedStory {
  const sampleVariables: Record<string, string> = {
    character: "Luna the cat",
    setting: "enchanted forest",
    object: "magical crystal",
    adventure: "found a hidden treasure",
    emotion: "excited"
  }

  let content = template.template

  template.variables.forEach(variable => {
    const placeholder = `{${variable}}`
    const value = sampleVariables[variable] || `[${variable}]`
    content = content.replace(new RegExp(placeholder, 'g'), value)
  })

  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const pages: string[] = []

  for (let i = 0; i < sentences.length; i += 2) {
    const page = sentences.slice(i, i + 2).join('. ').trim() + '.'
    pages.push(page)
  }

  return {
    pages,
    title: `Adventures of ${sampleVariables.character || 'Our Hero'}`
  }
}

export function applyTemplate(text: string, variables: Record<string, string>): string {
  let result = text
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`
    result = result.replace(new RegExp(placeholder, 'g'), value)
  })
  return result
}

export const defaultTemplates: StoryTemplate[] = [
  {
    id: 'adventure',
    name: 'Adventure Story',
    variables: ['character', 'setting', 'object', 'adventure'],
    template: 'Once upon a time, {character} lived in a {setting}. One day, they discovered a mysterious {object}. {character} {adventure} and learned something important about friendship.'
  },
  {
    id: 'mystery',
    name: 'Mystery Story',
    variables: ['character', 'setting', 'object'],
    template: '{character} was exploring the {setting} when they noticed something strange. A {object} was missing! {character} decided to investigate and solve the mystery.'
  },
  {
    id: 'friendship',
    name: 'Friendship Story',
    variables: ['character', 'emotion', 'adventure'],
    template: '{character} felt {emotion} about making new friends. But then they {adventure} and met someone special. Together they had the best day ever!'
  }
]