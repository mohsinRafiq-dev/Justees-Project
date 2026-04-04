/**
 * Convert basic markdown formatting to HTML
 * Supports: **bold**, *italic*, __bold__, _italic_
 * @param {string} text - The markdown text to convert
 * @returns {string} HTML string
 */
import { marked } from 'marked';

// Configure marked to treat single line breaks as <br>
marked.setOptions({
  breaks: true,
});

/**
 * Convert markdown text to HTML using a full parser.
 * marked handles **bold**, *italic*, lists, headers, links, etc.
 * @param {string} text
 * @returns {string} HTML string
 */
export const convertMarkdownToHtml = (text) => {
  if (!text) return '';
  // Before handing off to marked we swap the emphasis rules:
  // *single* -> bold, **double** -> italic
  // Replace double first to avoid nested conflicts.
  let transformed = text
    // convert **italic** (user wants double for italic)
    .replace(/\*\*(.*?)\*\*/g, '<em>$1</em>')
    // convert *bold* (single asterisk for bold)
    .replace(/\*(.*?)\*/g, '<strong>$1</strong>');

  // marked will parse the rest of markdown (lists, headers, etc.) and
  // will leave HTML tags intact.
  return marked.parse(transformed);
};

/**
 * React component to render markdown as HTML
 * @param {Object} props
 * @param {string} props.content - The markdown content to render
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element}
 */
export const MarkdownRenderer = ({ content, className = '' }) => {
  const htmlContent = convertMarkdownToHtml(content);
  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};