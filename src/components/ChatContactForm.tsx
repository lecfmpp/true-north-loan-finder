import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Mail, Phone, MessageSquare, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ContactFormProps {
  onSubmit: () => void;
  onCancel: () => void;
}

export function ChatContactForm({ onSubmit, onCancel }: ContactFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const formatPhoneNumber = (value: string) => {
    // Remove all non-numeric characters
    const phoneNumber = value.replace(/\D/g, '');
    
    // Canadian phone number formatting: (XXX) XXX-XXXX
    if (phoneNumber.length >= 6) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
    } else if (phoneNumber.length >= 3) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    } else if (phoneNumber.length > 0) {
      return `(${phoneNumber}`;
    }
    return phoneNumber;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !email.trim()) {
      toast({
        title: "Required fields missing",
        description: "Please provide your name and email address.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('chat_contact_submissions')
        .insert({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
          message: message.trim() || null,
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Contact information submitted!",
        description: "Thank you! Our team will contact you within 24 hours.",
      });

      onSubmit();
    } catch (error) {
      console.error('Error submitting contact form:', error);
      toast({
        title: "Submission failed",
        description: "Please try again or contact us directly.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <div className="p-2 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare size={18} />
            <h3 className="font-semibold text-sm">Contact Information</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={isSubmitting}
            className="h-8 w-8 p-0"
          >
            <X size={16} />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          We'll have a specialist contact you soon.
        </p>
      </div>
      <div className="p-2">
        <form onSubmit={handleSubmit} className="space-y-2">
          <div>
            <Label htmlFor="contact-name" className="flex items-center gap-1 text-xs mb-1">
              <User size={10} />
              Name *
            </Label>
            <Input
              id="contact-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              required
              disabled={isSubmitting}
              className="h-7 text-xs"
            />
          </div>

          <div>
            <Label htmlFor="contact-email" className="flex items-center gap-1 text-xs mb-1">
              <Mail size={10} />
              Email *
            </Label>
            <Input
              id="contact-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              required
              disabled={isSubmitting}
              className="h-7 text-xs"
            />
          </div>

          <div>
            <Label htmlFor="contact-phone" className="flex items-center gap-1 text-xs mb-1">
              <Phone size={10} />
              Phone (Optional)
            </Label>
            <Input
              id="contact-phone"
              type="tel"
              value={phone}
              onChange={handlePhoneChange}
              placeholder="(555) 123-4567"
              disabled={isSubmitting}
              className="h-7 text-xs"
              maxLength={14}
            />
          </div>

          <div>
            <Label htmlFor="contact-message" className="text-xs mb-1 block">
              Brief description
            </Label>
            <Textarea
              id="contact-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Financing requirements..."
              rows={2}
              disabled={isSubmitting}
              className="text-xs resize-none min-h-[40px]"
            />
          </div>

          <div className="flex gap-1 pt-1">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 h-7 text-xs"
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              className="h-7 text-xs px-3"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}