"use client"

import dynamic from "next/dynamic"
import { useMemo } from "react"
import "react-quill-new/dist/quill.snow.css"

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false })

export default function RichTextEditor({ value, onChange, placeholder, className = "" }) {
    const modules = useMemo(
        () => ({
            toolbar: [
                ["bold", "italic", "underline", "strike"],
                [{ list: "ordered" }, { list: "bullet" }],
                [{ indent: "-1" }, { indent: "+1" }],
                [{ align: [] }],
                ["link"],
                ["clean"],
            ],
        }),
        []
    )

    const formats = [
        "bold",
        "italic",
        "underline",
        "strike",
        "list",
        "indent",
        "align",
        "link",
    ]

    return (
        <div className={`rich-text-editor ${className}`}>
            <ReactQuill
                theme="snow"
                value={value || ""}
                onChange={onChange}
                placeholder={placeholder}
                modules={modules}
                formats={formats}
            />
            <style jsx global>{`
        .rich-text-editor .ql-container {
          min-height: 160px;
          border-bottom-left-radius: 0.5rem;
          border-bottom-right-radius: 0.5rem;
        }
        .rich-text-editor .ql-toolbar {
          border-top-left-radius: 0.5rem;
          border-top-right-radius: 0.5rem;
        }
      `}</style>
        </div>
    )
}
