/**
 * Convert basic markdown formatting to HTML
 * Supports: **bold**, *italic*, __bold__, _italic_
 * @param {string} text - The markdown text to convert
 * @returns {string} HTML string
 */
export const convertMarkdownToHtml = (text) => {
  if (!text) return '';
  
  return text
    // Convert **bold** to <strong>bold</strong>
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Convert __bold__ to <strong>bold</strong>
    .replace(/__(.*?)__/g, '<strong>$1</strong>')
    // Convert *italic* to <em>italic</em> (only if not already part of **)
    .replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')
    // Convert _italic_ to <em>italic</em> (only if not already part of __)
    .replace(/(?<!_)_(?!_)(.*?)(?<!_)_(?!_)/g, '<em>$1</em>')
    // Convert line breaks to <br> tags
    .replace(/\n/g, '<br/>');
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