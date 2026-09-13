import ReactMarkdown from 'react-markdown';

function dedent(text) {
  if (typeof text !== 'string') return text;
  return text
    .split('\n')
    .map((line) => line.replace(/^[ \t]+/, ''))
    .join('\n')
    .trim();
}

export default function RichText({ children, className = '' }) {
  if (!children) return null;
  return (
    <div className={`rich-text ${className}`.trim()}>
      <ReactMarkdown>{dedent(children)}</ReactMarkdown>
    </div>
  );
}
