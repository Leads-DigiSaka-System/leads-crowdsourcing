"use client";;
import { useState } from 'react';
import Link from 'next/link';
import { StatCard } from '@/components/ui/stat-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// Removed collapsible thread usage; using centralized dialog instead
import {
  Calendar,
  FileText,
  MessageSquare,
  Send,
  Loader2,
  ExternalLink,
  Link as LinkIcon,
  ChevronLeft,
  ChevronRight,
  Users,
  Hourglass,
  CalendarCheck,
  Clock,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { statusConfig } from '@/lib/utils';

export default function UserMeetingsContent({ initialData, userId, pagination }) {
  const [meetingRequests, setMeetingRequests] = useState(initialData);
  // Centralized dialog control & per-request drafts
  const [openMessageRequestId, setOpenMessageRequestId] = useState(null);
  const [messageDrafts, setMessageDrafts] = useState({});
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState('');

  const sendMessage = async (meetingRequestId) => {
    const draft = (messageDrafts[meetingRequestId] || '').trim();
    if (!draft) return;
    setSendingMessage(true);
    setError('');
    try {
      const response = await fetch(`/api/meeting-requests/${meetingRequestId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: draft }),
      });
      if (response.ok) {
        const message = await response.json();
        setMeetingRequests(prev => prev.map(req => req.id === meetingRequestId ? { ...req, messages: [...req.messages, message] } : req));
        setMessageDrafts(prev => ({ ...prev, [meetingRequestId]: '' }));
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to send message');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setSendingMessage(false);
    }
  };

  // Calculate stats
  const stats = {
    total: meetingRequests.length,
    pending: meetingRequests.filter(r => r.status === 'PENDING' || r.status === 'READ').length,
    scheduled: meetingRequests.filter(r => r.status === 'SCHEDULED').length,
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon={Users}
          title="Total Requests"
          value={stats.total}
          description="All meeting requests submitted"
        />
        <StatCard
          icon={Hourglass}
          title="Under Review"
          value={stats.pending}
          description="Requests pending or being reviewed"
          valueClassName="text-blue-600"
        />
        <StatCard
          icon={CalendarCheck}
          title="Scheduled"
          value={stats.scheduled}
          description="Meetings that are scheduled"
          valueClassName="text-green-600"
        />
      </div>

      {/* Meeting Requests */}
      <div className="space-y-4">
        {meetingRequests.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold mb-2">No Meeting Requests</h3>
              <p className="text-muted-foreground mb-4">
                You haven't submitted any meeting requests yet.
              </p>
              <Button asChild>
                <a href="/meetings/contact-researcher">Request a Meeting</a>
              </Button>
            </CardContent>
          </Card>
        ) : (
          meetingRequests.map((request) => {
            const StatusIcon = statusConfig[request.status].icon;
            const hasMessages = request.messages.length > 0;
            const unreadMessages = request.messages.filter(msg => msg.isAdminMessage).length;

            return (
              <Card key={request.id} className="transition-all hover:shadow-md">
                <CardHeader>
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <h3 className="font-semibold">{request.project.title}</h3>
                          {request.project.authors && (
                            <p className="text-sm text-muted-foreground">
                              By: {request.project.authors}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <Badge
                        variant="outline"
                        className={statusConfig[request.status].color}
                      >
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig[request.status].label}
                      </Badge>

                      {hasMessages && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MessageSquare className="h-3 w-3" />
                          {request.messages.length} message{request.messages.length !== 1 ? 's' : ''}
                          {unreadMessages > 0 && (
                            <span className="bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full text-xs ml-1">
                              {unreadMessages} new
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{new Date(request.preferredDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{request.preferredTime}</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Reason:</p>
                    <p className="text-sm">{request.reason}</p>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Submitted {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                  </div>

                  <div className="text-xs text-muted-foreground border-l-2 border-muted pl-3">
                    {statusConfig[request.status].description}
                  </div>

                  {/* Meeting Details for Scheduled Meetings */}
                  {request.status === 'SCHEDULED' && request.meetingLink && request.scheduledDate && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg space-y-2">
                      <div className="flex items-center gap-2 text-green-800">
                        <Calendar className="h-4 w-4" />
                        <span className="font-medium text-sm">Meeting Scheduled</span>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2 text-green-700">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(request.scheduledDate).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <LinkIcon className="h-3 w-3 text-green-700" />
                          <a
                            href={request.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-700 hover:text-green-900 underline flex items-center gap-1"
                          >
                            Join Meeting
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Messages Action Button */}
                  {(hasMessages || request.status === 'READ' || request.status === 'SCHEDULED') && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setOpenMessageRequestId(request.id)}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      {hasMessages ? `View Messages (${request.messages.length})` : 'Send Message'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Centralized Messages Dialog */}
      <Dialog
        open={!!openMessageRequestId}
        onOpenChange={(open) => { if (!open) setOpenMessageRequestId(null); }}
      >
        <DialogContent className="max-w-2xl">
          {openMessageRequestId && (() => {
            const req = meetingRequests.find(r => r.id === openMessageRequestId);
            if (!req) return null;
            const messageCount = req.messages.length;
            const draft = messageDrafts[req.id] || '';
            return (
              <>
                <DialogHeader>
                  <DialogTitle>Messages - {req.project.title}</DialogTitle>
                  <DialogDescription>
                    Conversation with the research team. {messageCount === 0 ? 'Start the discussion.' : ''}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <div className="text-sm font-medium mb-1">Original Request</div>
                    <div className="text-sm text-muted-foreground">{req.reason}</div>
                  </div>
                  {messageCount > 0 && (
                    <div className="max-h-60 overflow-y-auto space-y-2 border rounded-lg p-3 bg-muted/30">
                      {req.messages.map(m => (
                        <div key={m.id} className={`flex ${m.isAdminMessage ? 'justify-start' : 'justify-end'}`}>
                          <div className={`max-w-[80%] p-3 rounded-lg ${m.isAdminMessage ? 'bg-muted text-foreground' : 'bg-primary text-primary-foreground'}`}>
                            <div className="text-xs mb-1 opacity-70">
                              {m.isAdminMessage ? 'Researcher' : 'You'} • {formatDistanceToNow(new Date(m.createdAt), { addSuffix: true })}
                            </div>
                            <p className="text-sm">{m.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Type your message..."
                      value={draft}
                      onChange={(e) => setMessageDrafts(prev => ({ ...prev, [req.id]: e.target.value }))}
                      rows={2}
                      className="flex-1"
                    />
                    <Button
                      onClick={() => sendMessage(req.id)}
                      disabled={!draft.trim() || sendingMessage}
                      size="sm"
                    >
                      {sendingMessage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Link
            href={`/meetings?page=${Math.max(1, pagination.currentPage - 1)}`}
            className={pagination.currentPage <= 1 ? 'pointer-events-none' : ''}
          >
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
          </Link>

          <span className="text-sm text-muted-foreground mx-4">
            Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalCount} total requests)
          </span>

          <Link
            href={`/meetings?page=${Math.min(pagination.totalPages, pagination.currentPage + 1)}`}
            className={pagination.currentPage >= pagination.totalPages ? 'pointer-events-none' : ''}
          >
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.currentPage >= pagination.totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}