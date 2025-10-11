"use client"

import { useState } from "react"
import { ChevronRight, ChevronDown } from "lucide-react"

interface JsonViewerProps {
  data: any
  defaultExpanded?: boolean
}

export function JsonViewer({ data, defaultExpanded = true }: JsonViewerProps) {
  return (
    <div className="rounded-md bg-muted p-4">
      <div className="text-xs font-mono overflow-auto max-h-96">
        <JsonNode data={data} defaultExpanded={defaultExpanded} />
      </div>
    </div>
  )
}

interface JsonNodeProps {
  data: any
  defaultExpanded?: boolean
  isLast?: boolean
}

function JsonNode({ data, defaultExpanded = true, isLast = true }: JsonNodeProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  if (data === null) {
    return <span className="text-purple-600">null</span>
  }

  if (data === undefined) {
    return <span className="text-purple-600">undefined</span>
  }

  if (typeof data === "string") {
    return <span className="text-green-600">&quot;{data}&quot;</span>
  }

  if (typeof data === "number") {
    return <span className="text-blue-600">{data}</span>
  }

  if (typeof data === "boolean") {
    return <span className="text-purple-600">{data.toString()}</span>
  }

  if (Array.isArray(data)) {
    if (data.length === 0) {
      return <span>[]</span>
    }

    return (
      <span>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="inline-flex items-center hover:bg-muted-foreground/10 rounded px-0.5"
        >
          {isExpanded ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
        </button>
        {isExpanded ? (
          <>
            <span>[</span>
            <div className="ml-4">
              {data.map((item, index) => (
                <div key={index}>
                  <JsonNode
                    data={item}
                    defaultExpanded={true}
                    isLast={index === data.length - 1}
                  />
                  {index < data.length - 1 && <span>,</span>}
                </div>
              ))}
            </div>
            <span>]</span>
          </>
        ) : (
          <span className="text-muted-foreground">
            [{data.length} {data.length === 1 ? "item" : "items"}]
          </span>
        )}
      </span>
    )
  }

  if (typeof data === "object") {
    const keys = Object.keys(data)

    if (keys.length === 0) {
      return <span>{"{}"}</span>
    }

    return (
      <span>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="inline-flex items-center hover:bg-muted-foreground/10 rounded px-0.5"
        >
          {isExpanded ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
        </button>
        {isExpanded ? (
          <>
            <span>{"{"}</span>
            <div className="ml-4">
              {keys.map((key, index) => (
                <div key={key}>
                  <span className="text-red-600">&quot;{key}&quot;</span>
                  <span>: </span>
                  <JsonNode
                    data={data[key]}
                    defaultExpanded={true}
                    isLast={index === keys.length - 1}
                  />
                  {index < keys.length - 1 && <span>,</span>}
                </div>
              ))}
            </div>
            <span>{"}"}</span>
          </>
        ) : (
          <span className="text-muted-foreground">
            {"{"}
            {keys.length} {keys.length === 1 ? "key" : "keys"}
            {"}"}
          </span>
        )}
      </span>
    )
  }

  return <span>{String(data)}</span>
}
