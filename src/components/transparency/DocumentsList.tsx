"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { FileText, FileSpreadsheet, FileJson, ExternalLink, Download } from "lucide-react";
import type { VaultDocuments } from "@/types/vault";

interface DocumentsListProps {
  documents: VaultDocuments;
}

export function DocumentsList({ documents }: DocumentsListProps) {
  const getFileIcon = (type: string) => {
    switch (type) {
      case 'csv':
        return <FileSpreadsheet className="w-5 h-5 text-muted-foreground" />;
      case 'json':
        return <FileJson className="w-5 h-5 text-muted-foreground" />;
      case 'link':
        return <ExternalLink className="w-5 h-5 text-muted-foreground" />;
      default:
        return <FileText className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getTimeAgo = (isoDate?: string) => {
    if (!isoDate) return null;
    const seconds = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    return `${months}mo ago`;
  };

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback: open in new tab
      window.open(url, '_blank');
    }
  };

  return (
    <Card className="p-4 sm:p-5 bg-card border border-border">
      <h3 className="text-lg font-semibold text-foreground mb-4">Documents</h3>

      {documents.files.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No documents available
        </div>
      ) : (
        <div className="space-y-2">
          {documents.files.map(file => (
            <div
              key={file.id}
              className="flex items-center justify-between p-3 bg-muted/20 border border-border rounded-lg hover:border-primary/30 transition-colors group"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex-shrink-0">{getFileIcon(file.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">
                    {file.name}
                  </div>
                  {file.uploadedAt && (
                    <div className="text-xs text-muted-foreground/60">
                      Uploaded {getTimeAgo(file.uploadedAt)}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 ml-3">
                {/* Open in new tab */}
                <Tooltip content={<p className="text-xs">Open in new tab</p>}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-70 group-hover:opacity-100"
                    onClick={() => window.open(file.url, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </Tooltip>

                {/* Download */}
                {file.type !== 'link' && (
                  <Tooltip content={<p className="text-xs">Download</p>}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-70 group-hover:opacity-100"
                      onClick={() => handleDownload(file.url, file.name)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </Tooltip>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
