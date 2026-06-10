export interface Invention {
  id: string;
  title: string;
  shortIdea: string;
  description: string;
  slogan: string;
  targetAudience: string;
  imageUrl: string;
  authorId: string;
  authorName: string;
  authorPhoto: string;
  likesCount: number;
  likedBy: string[];
  createdAt: any;
}

export interface Comment {
  id: string;
  inventionId: string;
  text: string;
  authorId: string;
  authorName: string;
  authorPhoto: string;
  createdAt: any;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  createdAt: number;
}
