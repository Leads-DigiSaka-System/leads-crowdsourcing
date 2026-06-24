"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, MessageSquare, Calendar, Clock, FileText } from 'lucide-react';
import { ProjectCombobox } from '@/components/ui/project-combobox';

export default function ContactResearcherForm({ projects }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    projectId: '',
    preferredDate: '',
    preferredTime: '',
    reason: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/meeting-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSuccess(true);
        setFormData({
          projectId: '',
          preferredDate: '',
          preferredTime: '',
          reason: ''
        });


        setTimeout(() => {
          router.push('/meetings');
        }, 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to submit meeting request');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
    setSuccess(false);
  };

  if (success) {
    return (
      <Alert className="border-green-200 bg-green-50 text-green-800">
        <MessageSquare className="h-4 w-4" />
        <AlertDescription>
          Your meeting request has been submitted successfully! You'll be redirected to your meetings page where you can track the status and communicate with our team.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="project" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Project of Interest
          </Label>
          <ProjectCombobox
            projects={projects}
            value={formData.projectId}
            onChange={(value) => handleChange('projectId', value)}
            placeholder="Search and select a project..."
            loading={false}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="preferredDate" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Preferred Date
            </Label>
            <Input
              id="preferredDate"
              type="date"
              value={formData.preferredDate}
              onChange={(e) => handleChange('preferredDate', e.target.value)}
              required
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="preferredTime" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Preferred Time
            </Label>
            <Input
              id="preferredTime"
              type="time"
              value={formData.preferredTime}
              onChange={(e) => handleChange('preferredTime', e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="reason" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Reason for Meeting
          </Label>
          <Textarea
            id="reason"
            placeholder="Please describe the purpose of the meeting, topics you'd like to discuss, or questions you have..."
            value={formData.reason}
            onChange={(e) => handleChange('reason', e.target.value)}
            required
            rows={4}
            className="resize-none"
          />
        </div>

        <Button
          type="submit"
          disabled={loading || !formData.projectId || !formData.preferredDate || !formData.preferredTime || !formData.reason}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting Request...
            </>
          ) : (
            <>
              <MessageSquare className="mr-2 h-4 w-4" />
              Submit Meeting Request
            </>
          )}
        </Button>
      </form>
    </div>
  );
}