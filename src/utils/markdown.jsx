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
  // marked automatically escapes and converts; we use parse to allow tags
  return marked.parse(text);
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