export const CHAT_LINKS = {
  github: { label: 'Open GitHub', url: 'https://github.com/swethankreddy' },
  linkedin: { label: 'Open LinkedIn', url: 'https://linkedin.com/in/swethankreddy' },
  email: { label: 'Email Swethank', url: 'mailto:swethankreddy@iitb.ac.in' },
  resume: { label: 'View Resume', url: '/resume.pdf' },
  iitb: { label: 'IIT Bombay', url: 'https://www.iitb.ac.in' },
} as const;

export type ChatLinkKey = keyof typeof CHAT_LINKS;
