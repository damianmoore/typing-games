'use client';

interface QuestionDisplayProps {
  content: string | React.ReactNode;
  fontSize?: string;
}

export default function QuestionDisplay({ content, fontSize = '120px' }: QuestionDisplayProps) {
  return (
    <div className="mb-16 text-center">
      <div
        className="font-bold tracking-wider"
        style={{ fontSize }}
      >
        {content}
      </div>
    </div>
  );
}
