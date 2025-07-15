import React, { useState, useEffect } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar as CalendarIcon, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, isSameDay, isAfter, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";

interface TimeSlot {
  id: string;
  date: string;
  time: string;
  duration_minutes: number;
  current_bookings: number;
  max_bookings: number;
}

interface BookingCalendarProps {
  onBookingConfirmed: (bookingData: any) => void;
  userInfo: {
    name: string;
    email: string;
    phone?: string;
    quizResponseId?: string;
  };
}

const BookingCalendar: React.FC<BookingCalendarProps> = ({ onBookingConfirmed, userInfo }) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [loading, setLoading] = useState(false);
  const [booking, setBooKing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots(selectedDate);
    }
  }, [selectedDate]);

  const fetchAvailableSlots = async (date: Date) => {
    setLoading(true);
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('available_time_slots')
        .select('*')
        .eq('date', dateStr)
        .eq('is_available', true)
        .filter('current_bookings', 'lt', 'max_bookings')
        .order('time');

      if (error) throw error;
      setAvailableSlots(data || []);
    } catch (error) {
      console.error('Error fetching available slots:', error);
      toast({
        title: "Error",
        description: "Failed to load available time slots",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date && isAfter(date, startOfDay(new Date()))) {
      setSelectedDate(date);
      setSelectedSlot(null);
    }
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
  };

  const confirmBooking = async () => {
    if (!selectedSlot || !userInfo.name || !userInfo.email) {
      toast({
        title: "Error",
        description: "Please select a time slot and ensure your information is complete",
        variant: "destructive",
      });
      return;
    }

    setBooKing(true);
    try {
      // Create the booking
      const { data: booking, error: bookingError } = await supabase
        .from('call_bookings')
        .insert({
          time_slot_id: selectedSlot.id,
          user_name: userInfo.name,
          user_email: userInfo.email,
          user_phone: userInfo.phone,
          quiz_response_id: userInfo.quizResponseId,
          booking_status: 'confirmed'
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Start pre-call reminder email sequence
      try {
        const appointmentDateTime = `${selectedSlot.date} ${selectedSlot.time}`;
        const appointmentDate = format(new Date(selectedSlot.date), 'MMMM do, yyyy');
        const appointmentTime = format(new Date(`2000-01-01 ${selectedSlot.time}`), 'h:mm a');
        
        await supabase.functions.invoke('send-email-sequence', {
          body: {
            type: 'pre_call_reminder',
            userEmail: userInfo.email,
            userName: userInfo.name.split(' ')[0], // First name
            callDate: appointmentDate,
            callTime: appointmentTime,
            meetingLink: 'https://meet.google.com/your-meeting-link' // You'll want to generate this
          }
        });
      } catch (emailError) {
        console.error('Error starting email sequence:', emailError);
        // Don't fail the booking if email fails
      }

      toast({
        title: "Booking Confirmed!",
        description: `Your call is scheduled for ${format(new Date(selectedSlot.date), 'MMMM do, yyyy')} at ${format(new Date(`2000-01-01 ${selectedSlot.time}`), 'h:mm a')}`,
      });

      onBookingConfirmed({
        ...booking,
        timeSlot: selectedSlot,
        appointmentDate: format(new Date(selectedSlot.date), 'MMMM do, yyyy'),
        appointmentTime: format(new Date(`2000-01-01 ${selectedSlot.time}`), 'h:mm a')
      });

    } catch (error) {
      console.error('Error creating booking:', error);
      toast({
        title: "Booking Failed",
        description: "There was an error creating your booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setBooKing(false);
    }
  };

  const isDateAvailable = (date: Date) => {
    return isAfter(date, startOfDay(new Date()));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Choose Your Call Date
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            disabled={(date) => !isDateAvailable(date)}
            className={cn("rounded-md border pointer-events-auto")}
          />
        </CardContent>
      </Card>

      {selectedDate && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Available Times for {format(selectedDate, 'MMMM do, yyyy')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">Loading available times...</div>
            ) : availableSlots.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No available times for this date. Please select another date.
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {availableSlots.map((slot) => (
                  <Button
                    key={slot.id}
                    variant={selectedSlot?.id === slot.id ? "default" : "outline"}
                    className="h-auto p-3 flex flex-col items-center"
                    onClick={() => handleSlotSelect(slot)}
                  >
                    <span className="font-medium">
                      {format(new Date(`2000-01-01 ${slot.time}`), 'h:mm a')}
                    </span>
                    <Badge variant="secondary" className="text-xs mt-1">
                      {slot.duration_minutes} min
                    </Badge>
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {selectedSlot && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Confirm Your Booking
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Booking Details:</h4>
              <p><strong>Date:</strong> {format(new Date(selectedSlot.date), 'MMMM do, yyyy')}</p>
              <p><strong>Time:</strong> {format(new Date(`2000-01-01 ${selectedSlot.time}`), 'h:mm a')}</p>
              <p><strong>Duration:</strong> {selectedSlot.duration_minutes} minutes</p>
              <p><strong>Name:</strong> {userInfo.name}</p>
              <p><strong>Email:</strong> {userInfo.email}</p>
            </div>
            
            <Button 
              onClick={confirmBooking} 
              disabled={booking}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-white"
              size="lg"
            >
              {booking ? "Confirming..." : "Confirm My 15-Min Pre-Offer Call"}
            </Button>
            
            <p className="text-sm text-muted-foreground text-center">
              You'll receive a confirmation email with meeting details shortly.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BookingCalendar;