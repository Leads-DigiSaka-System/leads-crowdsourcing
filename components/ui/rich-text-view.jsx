"use client"

import DOMPurify from "dompurify";
import parse, { domToReact } from 'html-react-parser';

function convertPlainTextToHtml(input) {
    const text = (input || "").trim()
    if (!text) return ""
    // If it already looks like HTML, return as is
    if (/[<][a-zA-Z!/?]/.test(text)) return text

    const lines = text.split(/\r?\n/)
    const hasNumbered = lines.every(l => l.trim() === "" || /^\s*\d+\.\s+/.test(l))
    if (hasNumbered) {
        const items = lines
            .map(l => l.trim())
            .filter(Boolean)
            .map(l => l.replace(/^\d+\.\s+/, ""))
            .map(item => `<li>${escapeHtml(item)}</li>`)
            .join("")
        return `<ol>${items}</ol>`
    }
    // Otherwise convert double newlines to paragraphs, single newline to <br/>
    const paragraphs = text
        .split(/\n{2,}/)
        .map(p => `<p>${escapeHtml(p).replace(/\n/g, "<br/>")}</p>`)
        .join("")
    return paragraphs
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

export default function RichTextView({ html, className = "" }) {
    // Remove Quill snow theme UI marker spans that can affect rendering
    const stripQuillUi = (s) => String(s || "").replace(/<span[^>]*class=\"[^\"]*ql-ui[^\"]*\"[^>]*><\/span>/g, "")
    const prepared = convertPlainTextToHtml(stripQuillUi(html));
    const safe = typeof window !== "undefined" ? DOMPurify.sanitize(prepared) : prepared;

    // Add target _blank and rel noopener to all <a> tags
    const addTargetBlank = (html) =>
        html.replace(/<a\b([^>]*)>/gi, (match, attrs) => {
            let newAttrs = attrs;
            if (!/target\s*=/.test(attrs)) {
                newAttrs += ' target="_blank"';
            }
            if (!/rel\s*=/.test(attrs)) {
                newAttrs += ' rel="noopener noreferrer"';
            }
            return `<a${newAttrs}>`;
        });

    const processedHtml = addTargetBlank(safe);

    // Helpers to transform flat Quill list (<li data-list ... class="ql-indent-N">) into
    // proper nested <ul>/<ol> structures supporting any depth and mixed types.
    const getIndentLevel = (classAttr = "") => {
        const m = classAttr.match(/ql-indent-(\d+)/);
        return m ? parseInt(m[1], 10) : 0;
    };

    const liTypeToTag = (t) => (t === 'bullet' ? 'ul' : 'ol');

    // Build nested list tree from flat items
    function buildNestedFromFlat(liNodes) {
        // Each block is a list container: { type: 'ul'|'ol', items: [ {content, children: blocks[]} ] }
        const root = { blocks: [] };
        const levels = []; // stack of containers for each indent level
        const lastItems = []; // last <li> at each level

        const ensureContainerAt = (level, type) => {
            // If container exists with same type, reuse
            if (levels[level] && levels[level].type === type) return levels[level];

            // Create a new container of this type at the given level
            const container = { type, items: [] };

            if (level === 0) {
                root.blocks.push(container);
            } else {
                let parentLi = lastItems[level - 1];
                if (!parentLi) {
                    // Create a synthetic parent if indentation jumps unexpectedly
                    parentLi = { content: null, children: [] };
                    const parentContainer = ensureContainerAt(level - 1, type);
                    parentContainer.items.push(parentLi);
                    lastItems[level - 1] = parentLi;
                }
                parentLi.children = parentLi.children || [];
                parentLi.children.push(container);
            }

            // Trim deeper levels and set current level
            levels.splice(level);
            levels[level] = container;
            return container;
        };

        const closeToLevel = (level) => {
            // Keep containers up to "level" - deeper ones are closed
            levels.splice(level + 1);
            lastItems.splice(level + 1);
        };

        liNodes.forEach((n, idx) => {
            if (!n || n.name !== 'li') return;
            const liTypeAttr = n.attribs?.['data-list'] || 'ordered';
            const type = liTypeToTag(liTypeAttr);
            const indent = getIndentLevel(n.attribs?.class);
            // Close deeper levels if needed
            closeToLevel(indent);
            // Ensure a container at current indent with correct type
            const container = ensureContainerAt(indent, type);
            // If container exists but type differs (same level mixed types), start a new container
            if (container.type !== type) {
                ensureContainerAt(indent, type);
            }
            const liObj = { content: domToReact(n.children), children: [] };
            levels[indent].items.push(liObj);
            lastItems[indent] = liObj;
        });

        return root.blocks;
    }

    const renderBlocks = (blocks, keyPrefix = 'b') =>
        blocks.map((block, i) => {
            const Tag = block.type === 'ul' ? 'ul' : 'ol';
            return (
                <Tag key={`${keyPrefix}-${i}`} className="rtv-list">
                    {block.items.map((it, j) => (
                        <li key={`${keyPrefix}-${i}-li-${j}`}>
                            {it.content}
                            {it.children?.length ? renderBlocks(it.children, `${keyPrefix}-${i}-c${j}`) : null}
                        </li>
                    ))}
                </Tag>
            );
        });

    return (
        <div className={`prose prose-gray max-w-none ${className}`}>
            <div className="rich-text-view text-muted-foreground leading-relaxed">
                {parse(processedHtml, {
                    replace: (node) => {
                        // Rebuild Quill-flattened lists into nested lists
                        if (node?.name === 'ol' || node?.name === 'ul') {
                            const liNodes = (node.children || []).filter((c) => c.name === 'li');
                            if (liNodes.length) {
                                const blocks = buildNestedFromFlat(liNodes);
                                return <>{renderBlocks(blocks)}</>;
                            }
                            // Fallback: normal render
                            const Tag = node.name;
                            return (
                                <Tag className="rtv-list">
                                    {domToReact(node.children)}
                                </Tag>
                            );
                        }
                    },
                })}
            </div>
            <style jsx global>{`
                .rich-text-view .rtv-list { 
                    padding-left: 1.5rem; 
                    margin: 0.5rem 0; 
                }
                .rich-text-view ol.rtv-list { list-style: decimal; }
                .rich-text-view ul.rtv-list { list-style: disc; }
                .rich-text-view li { 
                    margin: 0.25rem 0;
                }
                .rich-text-view a { 
                    color: #2563eb; 
                    text-decoration: underline; 
                }
            `}</style>
        </div>
    );
}