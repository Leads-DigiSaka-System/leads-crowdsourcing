"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MeetingsDataTable } from '@/components/ui/meetings-data-table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Clock, MoreHorizontal, Loader2, MessageSquare, CheckCircle, XCircle, Eye, Send, Link, CalendarDays, Users, ClockIcon, CalendarCheck, Activity } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { StatCard } from '@/components/ui/stat-card';
import { statusConfig } from '@/lib/utils';



export default function MeetingsContent() {
    const { data: session } = useSession();
    const router = useRouter();
    const [meetingRequests, setMeetingRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [updatingId, setUpdatingId] = useState(null);
    // Per-request message drafts so typing in one dialog doesn't affect others
    const [messageDrafts, setMessageDrafts] = useState({});
    // Track which request's message dialog is open (controlled dialog)
    const [openMessageRequestId, setOpenMessageRequestId] = useState(null);
    const [sendingMessage, setSendingMessage] = useState(false);
    const [schedulingMeeting, setSchedulingMeeting] = useState(false);
    const [scheduleMeetingId, setScheduleMeetingId] = useState(null);
    const [meetingLink, setMeetingLink] = useState('');
    const [scheduledDate, setScheduledDate] = useState('');
    const [scheduledTime, setScheduledTime] = useState('');

    useEffect(() => {
        if (session && session.user?.role !== 'admin') {
            router.push('/');
        }
    }, [session, router]);

    useEffect(() => {
        const fetchMeetingRequests = async () => {
            try {
                const response = await fetch('/api/meeting-requests');
                if (response.ok) {
                    const data = await response.json();
                    setMeetingRequests(data.meetingRequests || []);
                } else {
                    setError('Failed to fetch meeting requests');
                }
            } catch (error) {
                setError('Network error. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        if (session?.user?.role === 'admin') {
            fetchMeetingRequests();
        }
    }, [session]);

    const updateStatus = async (id, newStatus) => {
        setUpdatingId(id);
        try {
            const response = await fetch(`/api/meeting-requests/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            if (response.ok) {
                const updatedRequest = await response.json();
                setMeetingRequests(prev => prev.map(request => request.id === id ? updatedRequest : request));
            } else {
                setError('Failed to update status');
            }
        } catch (error) {
            setError('Network error. Please try again.');
        } finally {
            setUpdatingId(null);
        }
    };

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
                setMeetingRequests(prev => prev.map(request =>
                    request.id === meetingRequestId
                        ? { ...request, messages: [...(request.messages || []), message] }
                        : request
                ));
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

    const scheduleMeeting = async () => {
        if (!meetingLink.trim() || !scheduledDate || !scheduledTime) {
            setError('Please fill in all fields');
            return;
        }

        setSchedulingMeeting(true);
        setError('');

        try {
            const dateTimeString = `${scheduledDate}T${scheduledTime}`;
            const scheduledDateTime = new Date(dateTimeString);

            const response = await fetch(`/api/meeting-requests/${scheduleMeetingId}/schedule`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    meetingLink: meetingLink.trim(),
                    scheduledDate: scheduledDateTime.toISOString()
                }),
            });

            if (response.ok) {
                const { meetingRequest } = await response.json();
                setMeetingRequests(prev => prev.map(request =>
                    request.id === scheduleMeetingId ? meetingRequest : request
                ));
                setMeetingLink('');
                setScheduledDate('');
                setScheduledTime('');
                setScheduleMeetingId(null);
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to schedule meeting');
            }
        } catch (error) {
            setError('Network error. Please try again.');
        } finally {
            setSchedulingMeeting(false);
        }
    };

    const openScheduleDialog = (requestId) => {
        setScheduleMeetingId(requestId);
        setMeetingLink('');
        setScheduledDate('');
        setScheduledTime('');
        setError('');
    };

    // Define columns for the data table
    const columns = [
        {
            accessorKey: "user",
            header: "User",
            cell: ({ row }) => {
                const user = row.getValue("user");
                return (
                    <div className="space-y-1">
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                    </div>
                );
            },
        },
        {
            accessorKey: "project",
            header: "Project",
            cell: ({ row }) => {
                const project = row.getValue("project");
                return (
                    <div className="space-y-1">
                        <div className="font-medium text-sm max-w-[200px] truncate">{project.title}</div>
                        {project.authors && (
                            <div className="text-xs text-muted-foreground">By: {project.authors}</div>
                        )}
                    </div>
                );
            },
        },
        {
            accessorKey: "preferredDate",
            header: "Date",
            cell: ({ row }) => {
                const request = row.original;
                return (
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{new Date(request.preferredDate).toLocaleDateString()}</span>
                        <Clock className="h-4 w-4 text-muted-foreground ml-2" />
                        <span>{request.preferredTime}</span>
                    </div>
                );
            },
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.getValue("status");
                const StatusIcon = statusConfig[status].icon;
                return (
                    <Badge variant="outline" className={statusConfig[status].color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig[status].label}
                    </Badge>
                );
            },
        },
        {
            accessorKey: "messages",
            header: "Messages",
            cell: ({ row }) => {
                const request = row.original;
                const messageCount = request.messages?.length || 0;
                return (
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                            {messageCount > 0 ? `${messageCount} messages` : 'No messages'}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setOpenMessageRequestId(request.id)}
                        >
                            <MessageSquare className="h-3 w-3 mr-1" />
                            {messageCount > 0 ? 'View' : 'Start'}
                        </Button>
                    </div>
                );
            },
        },
        {
            accessorKey: "createdAt",
            header: "Submitted",
            cell: ({ row }) => {
                const createdAt = row.getValue("createdAt");
                return (
                    <div className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
                    </div>
                );
            },
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
                const request = row.original;

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" disabled={updatingId === request.id}>
                                {updatingId === request.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <MoreHorizontal className="h-4 w-4" />
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => updateStatus(request.id, 'read')}>
                                <Eye className="mr-2 h-4 w-4" />Mark as Read
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openScheduleDialog(request.id)}>
                                <CalendarDays className="mr-2 h-4 w-4" />Schedule Meeting
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateStatus(request.id, 'COMPLETED')}>
                                <CheckCircle className="mr-2 h-4 w-4" />Mark as Completed
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateStatus(request.id, 'REJECTED')}>
                                <XCircle className="mr-2 h-4 w-4" />Mark as Rejected
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];

    const stats = {
        total: meetingRequests.length,
        pending: meetingRequests.filter(r => r.status === 'PENDING').length,
        scheduled: meetingRequests.filter(r => r.status === 'SCHEDULED').length,
        completed: meetingRequests.filter(r => r.status === 'COMPLETED').length,
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                    icon={Users}
                    title="Total Meetings"
                    value={stats.total}
                    description="All meeting requests"
                />
                <StatCard
                    icon={ClockIcon}
                    title="Pending"
                    value={stats.pending}
                    description="Awaiting review"

                />
                <StatCard
                    icon={CalendarCheck}
                    title="Scheduled"
                    value={stats.scheduled}
                    description="Meetings planned"

                />
                <StatCard
                    icon={Activity}
                    title="Completed"
                    value={stats.completed}
                    description="Finished meetings"

                />
            </div>

            {/* Meeting Requests Data Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Meeting Requests</CardTitle>
                    <CardDescription>Manage meeting requests and communicate with users</CardDescription>
                </CardHeader>
                <CardContent>
                    {meetingRequests.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                            <p>No meeting requests yet</p>
                        </div>
                    ) : (
                        <MeetingsDataTable
                            columns={columns}
                            data={meetingRequests}
                            searchKey="user"
                            searchPlaceholder="Search by user name or email..."
                        />
                    )}
                </CardContent>
            </Card>

            {/* Centralized Messages Dialog */}
            <Dialog
                open={!!openMessageRequestId}
                onOpenChange={(open) => {
                    if (!open) setOpenMessageRequestId(null);
                }}
            >
                <DialogContent className="max-w-2xl">
                    {openMessageRequestId && (() => {
                        const request = meetingRequests.find(r => r.id === openMessageRequestId);
                        if (!request) return null;
                        const messageCount = request.messages?.length || 0;
                        const draftValue = messageDrafts[request.id] || '';
                        return (
                            <>
                                <DialogHeader>
                                    <DialogTitle>Messages - {request.user.name}</DialogTitle>
                                    <DialogDescription>
                                        Conversation about "{request.project.title}"
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div className="p-3 bg-muted/30 rounded-lg">
                                        <div className="text-sm font-medium mb-1">Original Request:</div>
                                        <div className="text-sm text-muted-foreground">{request.reason}</div>
                                    </div>
                                    {messageCount > 0 && (
                                        <div className="max-h-60 overflow-y-auto space-y-2 border rounded-lg p-3 bg-muted/30">
                                            {request.messages.map((message) => (
                                                <div key={message.id} className={`flex ${message.isAdminMessage ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[80%] p-3 rounded-lg ${message.isAdminMessage
                                                        ? 'bg-primary text-primary-foreground'
                                                        : 'bg-muted text-foreground'
                                                        }`}>
                                                        <div className="text-xs mb-1 opacity-70">
                                                            {message.isAdminMessage ? 'You' : message.sender.name} • {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                                                        </div>
                                                        <p className="text-sm">{message.content}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <div className="flex gap-2">
                                        <Textarea
                                            placeholder="Type your message..."
                                            value={draftValue}
                                            onChange={(e) => setMessageDrafts(prev => ({ ...prev, [request.id]: e.target.value }))}
                                            rows={2}
                                            className="flex-1"
                                        />
                                        <Button
                                            onClick={() => sendMessage(request.id)}
                                            disabled={!draftValue.trim() || sendingMessage}
                                            size="sm"
                                        >
                                            {sendingMessage ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Send className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </>
                        );
                    })()}
                </DialogContent>
            </Dialog>

            {/* Schedule Meeting Dialog */}
            <Dialog open={scheduleMeetingId !== null} onOpenChange={(open) => !open && setScheduleMeetingId(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <CalendarDays className="h-5 w-5" />
                            Schedule Meeting
                        </DialogTitle>
                        <DialogDescription>
                            Provide meeting details to automatically schedule and notify the user.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="meetingLink">Meeting Link</Label>
                            <Input
                                id="meetingLink"
                                type="url"
                                placeholder="https://zoom.us/j/... or https://meet.google.com/..."
                                value={meetingLink}
                                onChange={(e) => setMeetingLink(e.target.value)}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-2">
                                <Label htmlFor="scheduledDate">Date</Label>
                                <Input
                                    id="scheduledDate"
                                    type="date"
                                    value={scheduledDate}
                                    onChange={(e) => setScheduledDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="scheduledTime">Time</Label>
                                <Input
                                    id="scheduledTime"
                                    type="time"
                                    value={scheduledTime}
                                    onChange={(e) => setScheduledTime(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={() => setScheduleMeetingId(null)}>
                                Cancel
                            </Button>
                            <Button
                                onClick={scheduleMeeting}
                                disabled={schedulingMeeting || !meetingLink.trim() || !scheduledDate || !scheduledTime}
                            >
                                {schedulingMeeting ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                    <Link className="h-4 w-4 mr-2" />
                                )}
                                Schedule Meeting
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}